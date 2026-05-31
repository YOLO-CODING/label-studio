"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging
from functools import reduce
from operator import getitem
from urllib.parse import urlparse

import ujson as json
from rest_framework.exceptions import ValidationError

logger = logging.getLogger(__name__)


class PlanValidator:
    """Plan Validator with project validation. It is equal to PlanSerializer from django backend."""

    def __init__(self, project, instance=None):
        self.project = project
        self.instance = instance
        self.annotation_count = 0
        self.prediction_count = 0

    def validate(self, data):
        """Validate whole task with task['data'] and task['annotations']. task['predictions']"""
        # project = self.project
        # if project.num_annotations < project.num_tasks:
        #     raise ValidationError("未标记完成")
        #
        # if data['quantity'] is None:
        #     raise ValidationError("训练计划数量错误")
        # elif data['quantity'] < project.num_annotations:
        #     raise ValidationError("标记可能未完成")

        return data