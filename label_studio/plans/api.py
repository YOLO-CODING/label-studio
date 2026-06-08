"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import os
import logging
import django_rq

from django.conf import settings
from django.utils.decorators import method_decorator
from django.utils.timezone import now
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
from rest_framework import generics, viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action
from rest_framework.exceptions import MethodNotAllowed
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from projects.models import Project
from plans.models import (
    Plan,
    PlanRecords,
    TrainingEpochs,
    TrainingModels
)
from plans.serializers import (
    PlanSerializer,
    PlanRecordsSerializer,
    TrainingEpochsSerializer,
    TrainingModelsSerializer
)
from webhooks.models import WebhookAction
from webhooks.utils import (
    api_webhook,
    api_webhook_for_delete,
    emit_webhooks_for_instance,
)
from core.permissions import ViewClassPermission, all_permissions

from trainings.jobs import prepare_training

logger = logging.getLogger(__name__)

_plan_schema = {
    "type": "object",
    "properties": {
        "project_id": {
            "type": "integer",
            'description': 'Project ID',
            'example': '1',
        },
        'project_title': {
            'type': 'string',
            'description': 'Project title',
            'example': 'My project',
        },
        'quantity': {
            'type': 'integer',
            'description': 'file quantity',
            'example': '100',
        },
        "epochs": {
            'type': 'integer',
            'description': 'training epochs',
            'example': '100',
        },
        "imgsz": {
            'type': 'integer',
            'description': 'image size',
            'example': '608',
        },
    }
}
class PlanListPagination(PageNumberPagination):
    page_size = 10
    max_page_size = 10
    page_size_query_param = None


class PlanListAPI(generics.ListCreateAPIView):
    queryset = Plan.objects.all().order_by('-updated_at')
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    permission_required = ViewClassPermission(
    )
    serializer_class = PlanSerializer
    pagination_class = PlanListPagination

    def filter_queryset(self, queryset):
        return queryset.filter(
            organization=self.request.user.active_organization,
            cancelled=False
        )

    def get(self, request, *args, **kwargs):
        return super(PlanListAPI, self).get(request, *args, **kwargs)

    @extend_schema(exclude=True)
    def post(self, request, *args, **kwargs):
        return super(PlanListAPI, self).post(request, *args, **kwargs)

    def get_serializer_context(self):
        context = super().get_serializer_context()
        project_id = self.request.data.get('project_id')
        if project_id:
            context['project'] = generics.get_object_or_404(Project, pk=project_id)
        return context

    def perform_create(self, serializer):
        project_id = self.request.data.get('project_id')
        project = generics.get_object_or_404(Project, pk=project_id)

        # Extract project-related data to save on Plan
        plan_data = {
            'project_id': project.id,
            'project_title': project.title,
            'data_types': project.data_types,
            'parsed_label_config': project.parsed_label_config,
            'label_config_hash': project.label_config_hash,
            'organization': self.request.user.active_organization,
            'created_by': self.request.user,
            'quantity': self.request.data.get('quantity', 1),
            'epochs': self.request.data.get("epochs", 100),
            "imgsz": self.request.data.get('imgsz', 608),
            "created_at": now(),
            "updated_at": now(),
            "target_platform": "AI Platform",
            "status": 0,
            "failed": False,
            "cancelled": False,
        }

        instance = serializer.save(**plan_data)
        emit_webhooks_for_instance(
            self.request.user.active_organization, project, WebhookAction.PLAN_CREATED, instance
        )


class PlanAPI(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete']

    def get_queryset(self):
        return Plan.objects.filter(
            organization=self.request.user.active_organization,
            cancelled=False
        )

    def retrieve(self, request, *args, **kwargs):
        return super(PlanAPI, self).retrieve(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        plan = self.get_object()
        plan.cancelled = True
        plan.cancelled_at = now()
        plan.save()
        return Response(status=status.HTTP_200_OK)

    def partial_update(self, request, *args, **kwargs):
        return super(PlanAPI, self).partial_update(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        context = super().get_serializer_context()
        plan_id = kwargs.get('pk', None) or request.data.get('id')
        plan = generics.get_object_or_404(Plan, pk=plan_id)
        project_id = plan.project_id
        context['project'] = generics.get_object_or_404(Project, pk=project_id)

        return super(PlanAPI, self).update(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def do_cancel(self, request, pk=None):
        plan = self.get_object()
        # 检查是否可以取消
        if plan.cancelled:
            return Response(
                {'detail': '训练计划已撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not plan.is_cancellable():
            return Response(
                {'detail': '训练计划当前状态不可撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        plan.cancelled = True
        plan.cancelled_at = now()
        plan.status = Plan.STATUS_CANCELLED
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def do_release(self, request, pk=None):
        plan = self.get_object()
        if plan.cancelled:
            return Response(
                {'detail': '训练计划已撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if plan.status >= Plan.STATUS_RELEASED:
            return Response(
                {'detail': '训练计划已下达.'},
                status=status.HTTP_200_OK
            )
        plan.status = Plan.STATUS_RELEASED
        plan.updated_at = now()
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def do_confirm(self, request, pk=None):
        plan = self.get_object()
        if plan.cancelled:
            return Response(
                {'detail': '训练计划已撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if plan.status >= Plan.STATUS_CONFIRMED:
            return Response(
                {'detail': '训练计划已确认.'},
                status=status.HTTP_200_OK
            )

        user_epochs = request.data.get('epochs')
        if user_epochs and user_epochs >= 1:
            plan.epochs = user_epochs
        user_imgsz = request.data.get('imgsz')
        if user_imgsz and user_imgsz > 100:
            plan.imgsz = user_imgsz

        user_training_config = request.data.get('training_config')
        if user_training_config:
            plan.training_config = user_training_config

        plan.status = Plan.STATUS_CONFIRMED
        plan.updated_at = now()
        plan.save()

        # start-up training
        queue = django_rq.get_queue('q_datasets')
        queue.enqueue(prepare_training, pk)

        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def do_file_ready(self, request, pk=None):
        plan = self.get_object()
        if plan.cancelled:
            return Response(
                {'detail': '训练计划已撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if plan.status >= Plan.STATUS_FILE_READY:
            return Response(
                {'detail': '训练计划文件已就绪.'},
                status=status.HTTP_200_OK
            )
        plan.status = Plan.STATUS_FILE_READY
        plan.updated_at = now()
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def do_start(self, request, pk=None):
        plan = self.get_object()
        if plan.cancelled:
            return Response(
                {'detail': '训练计划已撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if plan.status == Plan.STATUS_RUNNING:
            return Response(
                {'detail': '训练计划已经在进行中.'},
                status=status.HTTP_200_OK
            )
        plan.status = Plan.STATUS_RUNNING
        plan.updated_at = now()
        plan.started_at = now()
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def do_complete(self, request, pk=None):
        plan = self.get_object()
        if plan.cancelled:
            return Response(
                {'detail': '训练计划已撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if plan.status == Plan.STATUS_COMPLETED:
            return Response(
                {'detail': '训练计划已经完成.'},
                status=status.HTTP_200_OK
            )
        plan.status = Plan.STATUS_COMPLETED
        plan.updated_at = now()
        plan.completed_at = now()
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def do_failure(self, request, pk=None):
        plan = self.get_object()
        if plan.cancelled:
            return Response(
                {'detail': '训练计划已撤销.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if plan.status == Plan.STATUS_FAILED:
            return Response(
                {'detail': '训练计划已经失败.'},
                status=status.HTTP_200_OK
            )
        message = request.data.get('fail_message')
        if message is None:
            message = request.data.get('message')
        if message is None:
            message = '未知错误'
        plan.status = Plan.STATUS_FAILED
        plan.fail_message = message
        plan.updated_at = now()
        plan.save()
        serializer = self.get_serializer(plan)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def add_record(self, request, pk=None):
        """添加 Plan 记录"""
        plan = self.get_object()

        content = request.data.get('content', '')
        platform = request.data.get('platform', '')

        if not content:
            return Response(
                {'detail': 'Content is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 创建 PlanRecord
        record = PlanRecords.objects.create(
            plan=plan,
            content=content,
            platform=platform
        )

        # 可以返回 PlanRecords 的序列化数据
        record_serializer = PlanRecordsSerializer(record)
        return Response(record_serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def records(self, request, pk=None):

        # 如果有查询参数需要分页
        if request.query_params.get('page'):
            # 临时启用分页
            self.pagination_class = PlanListPagination
        else:
            """获取 Plan 的所有记录"""
            self.pagination_class = None

        plan = self.get_object()
        records = PlanRecords.objects.filter(plan=plan).order_by('-updated_at')

        page = self.paginate_queryset(records)
        if page is not None:
            serializer = PlanRecordsSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PlanRecordsSerializer(records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def training_epochs(self, request, pk=None):
        # 如果有查询参数需要分页
        if request.query_params.get('page'):
            # 临时启用分页
            self.pagination_class = PlanListPagination
        else:
            """获取 Plan 的所有记录"""
            self.pagination_class = None

        batch_no = request.query_params.get('batch_no')

        plan = self.get_object()
        if batch_no:
            epochs = TrainingEpochs.objects.filter(plan=plan, batch_no=batch_no).order_by('-updated_at')
        else:
            epochs = TrainingEpochs.objects.filter(plan=plan).order_by('-updated_at')
        page = self.paginate_queryset(epochs)
        if page is not None:
            serializer = TrainingEpochsSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = TrainingEpochsSerializer(epochs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def training_log(self, request, pk=None):
        from ranged_fileresponse import RangedFileResponse
        try:
            log_dir = os.path.join(settings.TRAINING_DIR, str(pk))
            if not os.path.exists(log_dir):
                os.makedirs(log_dir)
            log_file = os.path.join(log_dir, 'training.log')
            if not os.path.exists(log_file):
                with open(log_file, 'w') as f:
                    f.write('正在等待处理,请稍后查看...\n')
                    f.write('------------------------------\n')
                    f.flush()

            content_type = "text/plain"
            return RangedFileResponse(request, open(log_file, 'r') , content_type=content_type)
        except Exception as e:
            logger.exception(e)
            return Response(status=status.HTTP_500_INTERNAL_SERVER_ERROR)

