"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import base64
import datetime
import logging
import numbers
import os
import random
import traceback
import uuid
from typing import Any, Mapping, Optional, Union, cast
from urllib.parse import urljoin

import ujson as json
from core.bulk_update_utils import bulk_update
from core.current_request import get_current_request
from core.feature_flags import flag_set
from core.label_config import SINGLE_VALUED_TAGS
from core.redis import start_job_async_or_sync
from core.utils.common import (
    find_first_one_to_one_related_field_by_prefix,
    load_func,
    string_is_url,
    temporary_disconnect_list_signal,
)
from core.utils.db import batch_delete, fast_first
from core.utils.params import get_env
from data_import.models import FileUpload
from data_manager.managers import PreparedTaskManager, TaskManager
from django.conf import settings
from django.db import OperationalError, models, transaction
from django.db.models import CheckConstraint, F, JSONField, Q
from django.db.models.lookups import GreaterThanOrEqual
from django.db.models.signals import post_delete, post_save, pre_delete, pre_save
from django.dispatch import Signal, receiver
from django.urls import reverse
from django.utils.timesince import timesince
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _
from label_studio_sdk.label_interface.objects import PredictionValue
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)

PlanMixin = load_func(settings.PLAN_MIXIN)

class Plan (PlanMixin, models.Model):
    # 状态常量
    STATUS_CANCELLED = -1
    STATUS_PENDING = 0
    STATUS_RELEASED = 1
    STATUS_CONFIRMED = 2
    STATUS_FILE_READY = 3
    STATUS_RUNNING = 4
    STATUS_FAILED = 6
    STATUS_COMPLETED = 9

    STATUS_CHOICES = (
        (STATUS_PENDING, 'Pending'),
        (STATUS_RELEASED, 'Released'),
        (STATUS_CONFIRMED, 'Confirmed'),
        (STATUS_FILE_READY, 'FileReady'),
        (STATUS_RUNNING, 'Running'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_CANCELLED, 'Cancelled'),
    )

    """training plan from project"""
    id = models.AutoField(
        auto_created=True,
        primary_key=True,
        serialize=False,
        verbose_name='ID',
        db_index=True,
    )
    organization = models.ForeignKey(
        'organizations.Organization', on_delete=models.SET_NULL, null=True
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_('created by'),
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), null=True, auto_now=True, db_index=True)

    project_id = models.PositiveIntegerField(_('project id'), null=False)
    project_title = models.CharField(_('project title'), null=True, max_length=255)
    data_types = JSONField(_('data_types'), default=dict, null=True)
    parsed_label_config = models.JSONField(
        _('parsed label config'),
        blank=True,
        null=True,
        default=None,
        help_text='Parsed label config in JSON format. See more about it in documentation',
    )
    label_config_hash = models.BigIntegerField(null=True, default=None)
    quantity = models.IntegerField(_('quantity'), default=1)
    status = models.IntegerField(_('status'), choices=STATUS_CHOICES, default=STATUS_PENDING)
    failed = models.BooleanField(_('failed'), default=False)
    fail_message = models.TextField(_('fail_message'), null=True, blank=True)
    target_platform = models.CharField(_('target_platform'), max_length=255, null=True)
    epochs = models.IntegerField(_('epochs'), default=100)
    imgsz = models.IntegerField(_('imgsz'), null=False, default=608)
    training_config = models.CharField(_('training_config'), max_length=10000, null=True, blank=True)
    cancelled = models.BooleanField(_('cancelled'), default=False)
    cancelled_at = models.DateTimeField(_('cancelled at'), null=True, blank=True)
    training_pid = models.IntegerField(_('training_pid'), null=True, blank=True)
    last_heartbeat = models.DateTimeField(_('last heartbeat'), null=True, blank=True)
    started_at = models.DateTimeField(_('started at'), null=True)
    completed_at = models.DateTimeField(_('completed at'), null=True)
    batch_last = models.IntegerField(_('batch_last'), null=True, default=0)
    box_loss = models.FloatField(_('box_loss'), null=True, default=0)
    seg_loss = models.FloatField(_('seg_loss'), null=True, default=0)
    box_precision = models.FloatField(_('box_precision'), null=True, default=0)
    box_recall = models.FloatField(_('box_recall'), null=True, default=0)
    m_precision = models.FloatField(_('m_precision'), null=True, default=0)
    m_recall = models.FloatField(_('m_recall'), null=True, default=0)

    def is_cancellable(self):
        """检查是否可以取消"""
        return self.status in [self.STATUS_PENDING, self.STATUS_CONFIRMED, self.STATUS_RELEASED, self.STATUS_FAILED]

    def is_running(self):
        """检查是否正在运行"""
        return self.status == self.STATUS_RUNNING

    def mark_as_completed(self):
        """标记为完成"""
        self.status = self.STATUS_COMPLETED
        self.save()

    def mark_as_failed(self, message=''):
        """标记为失败"""
        self.status = self.STATUS_FAILED
        self.failed = True
        self.fail_message = message
        self.save()

    def cancel_plan(self):
        """取消计划"""
        if self.is_cancellable():
            self.cancelled = True
            self.status = self.STATUS_CANCELLED
            self.cancelled_at = now()
            self.save()
            return True
        return False

    class Meta:
        ordering = ('-updated_at',)


class PlanRecords (models.Model):
    id = models.AutoField(
        auto_created=True,
        primary_key=True,
        serialize=False,
        verbose_name='ID',
        db_index=True,
    )
    content = models.TextField(_('content'), blank=True)
    platform = models.CharField(_('platform'), max_length=255, null=True)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True, help_text='Last time a task was updated')
    plan = models.ForeignKey(
        'plans.Plan', on_delete=models.CASCADE, null=True
    )

class TrainingEpochs (models.Model):
    id = models.AutoField(
        auto_created=True,
        primary_key=True,
        serialize=False,
        verbose_name='ID',
        db_index=True,
    )
    batch_no = models.PositiveIntegerField(_('batch no'), null=False)
    epoch = models.PositiveIntegerField(_('epoch'), null=False)
    time = models.FloatField(_('time'), null=True)
    box_loss = models.FloatField(_('box loss'), null=False, default=0)
    seg_loss = models.FloatField(_('seg loss'), null=False, default=0)
    cls_loss = models.FloatField(_('class loss'), null=False, default=0)
    dfl_loss = models.FloatField(_('dfl loss'), null=False, default=0)
    box_precision = models.FloatField(_('box precision'), null=False, default=0)
    box_recall = models.FloatField(_('box recall'), null=False, default=0)
    box_map50 = models.FloatField(_('box map50'), null=False, default=0)
    box_map95 = models.FloatField(_('box map95'), null=False, default=0)
    m_precision = models.FloatField(_('m_precision'), null=False, default=0)
    m_recall = models.FloatField(_('m_recall'), null=False, default=0)
    m_map50 = models.FloatField(_('m_map50'), null=False, default=0)
    m_map95 = models.FloatField(_('m_map95'), null=False, default=0)
    v_box_loss = models.FloatField(_('v_box_loss'), null=False, default=0)
    v_seg_loss = models.FloatField(_('v_seg_loss'), null=False, default=0)
    v_cls_loss = models.FloatField(_('v_cls_loss'), null=False, default=0)
    v_dfl_loss = models.FloatField(_('v_dfl_loss'), null=False, default=0)
    lr_pg0 = models.FloatField(_('lr_pg0'), null=False, default=0)
    lr_pg1 = models.FloatField(_('lr_pg1'), null=False, default=0)
    lr_pg2 = models.FloatField(_('lr_pg2'), null=False, default=0)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True, help_text='Last time a record was updated')

    plan = models.ForeignKey(
        'plans.Plan', on_delete=models.CASCADE, null=True
    )

class TrainingModels (models.Model):
    id = models.AutoField(
        auto_created=True,
        primary_key=True,
        serialize=False,
        verbose_name='ID',
        db_index=True,
    )
    batch_no = models.PositiveIntegerField(_('batch no'), null=False)
    name = models.CharField(_('name'), max_length=255, null=False)
    label_type = models.CharField(_('label type'), max_length=255, null=False)
    model_kind = models.CharField(_('model kind'), max_length=255, null=False)
    path = models.CharField(_('path'), max_length=255, null=False)
    updated_at = models.DateTimeField(_('updated at'), auto_now=True, help_text='Last time a record was updated')
    
    deployed = models.BooleanField(_('deployed'), default=False)
    deployed_at = models.DateTimeField(_('deployed at'), null=True, blank=True)
    deployed_path = models.CharField(_('deployed path'), max_length=500, null=True, blank=True)
    deployed_to_project = models.IntegerField(_('deployed to project'), null=True, blank=True)

    plan = models.ForeignKey(
        'plans.Plan', on_delete=models.CASCADE, null=True
    )

    def has_permission(self, user):
        return self.plan.organization == user.active_organization