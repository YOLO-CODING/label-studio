import logging
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

from django.conf import settings
from django.db import OperationalError, models, transaction
from django.db.models import CheckConstraint, F, JSONField, Q
from django.utils.timezone import now
from django.utils.translation import gettext_lazy as _

ShipDetectionMixin = load_func(settings.SHIP_DETECTION_MIXIN)

logger = logging.getLogger(__name__)

class ShipDetection (ShipDetectionMixin, models.Model):
    id = models.AutoField(
        auto_created=True,
        primary_key=True,
        serialize=False,
        verbose_name='ID',
        db_index=True,
    )
    name = models.CharField(_('name'), max_length=255, null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        verbose_name=_('created by'),
    )
    created_at = models.DateTimeField(_('created at'), auto_now_add=True)
    updated_at = models.DateTimeField(_('updated at'), null=True, auto_now=True)

    class Meta:
        ordering = ('-created_at',)