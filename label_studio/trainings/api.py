"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging
import django_rq
import os

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

from django.utils.decorators import method_decorator
from django.utils.timezone import now
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from core.permissions import ViewClassPermission, all_permissions

from plans.models import (
    Plan,
    TrainingModels
)
from trainings.jobs import (
    prepare_training
)
from trainings.deployment import (
    inject_model_path,
    copy_model_to_backend,
    generate_model_filename
)

from plans.serializers import TrainingModelsSerializer


class TrainingModelListPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'

    def get_page_size(self, request):
        # emulate "unlimited" page_size
        if (
                self.page_size_query_param in request.query_params
                and request.query_params[self.page_size_query_param] == '-1'
        ):
            return 100
        return super().get_page_size(request)

class TrainingModelListAPI(generics.ListAPIView):
    queryset = TrainingModels.objects.all().order_by('-id')
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    permission_required = ViewClassPermission(
    )
    serializer_class = TrainingModelsSerializer
    pagination_class = TrainingModelListPagination

    def get(self, request, *args, **kwargs):
        return super(TrainingModelListAPI, self).get(request, *args, **kwargs)

class TrainingModelAPI(viewsets.ModelViewSet):
    permission_required = ViewClassPermission()
    serializer_class = TrainingModelsSerializer
    http_method_names = ['get', 'delete']
    queryset = TrainingModels.objects.all().order_by('-id')

    def retrieve(self, request, *args, **kwargs):
        return super(TrainingModelAPI, self).retrieve(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        return super(TrainingModelAPI, self).destroy(request, *args, **kwargs)

class TrainingAPI(viewsets.ModelViewSet):

    @action(detail=True, methods=['post'])
    def generate(self, request, pk=None):
        queue = django_rq.get_queue('q_datasets')
        queue.enqueue(prepare_training, pk)

        return Response("OK", status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        plan = Plan.objects.get(pk=pk)
        queue = django_rq.get_queue('q_trainings')
        return Response("OK", status=status.HTTP_200_OK)


class TrainingModelDeployAPI(APIView):
    """Deploy training model to ML Backend"""
    
    permission_required = ViewClassPermission()
    
    def post(self, request, pk):
        """
        Deploy a training model to ML Backend.
        
        Request body:
            {
                "project_id": int,  // Target project ID (optional, defaults to plan.project_id)
            }
        
        Returns:
            {
                "message": "Model deployed successfully",
                "deployed_path": str,
                "project_id": int,
                "project_title": str
            }
        """
        try:
            model = TrainingModels.objects.get(pk=pk)
            
            if model.deployed:
                return Response({
                    'error': 'Model already deployed',
                    'deployed_to_project': model.deployed_to_project,
                    'deployed_at': model.deployed_at
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not model.plan:
                return Response({
                    'error': 'Model has no associated plan'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not os.path.exists(model.path):
                return Response({
                    'error': 'Source model file not found',
                    'path': model.path
                }, status=status.HTTP_400_BAD_REQUEST)
            
            target_filename = generate_model_filename(
                model.plan_id,
                model.model_kind,
                model.batch_no
            )
            
            target_path = copy_model_to_backend(
                model.path,
                target_filename,
                settings.ML_BACKEND_MODEL_DIR
            )
            
            if not target_path:
                return Response({
                    'error': 'Failed to copy model file to ML Backend directory'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            project_id = request.data.get('project_id', model.plan.project_id)
            
            try:
                from projects.models import Project
                project = Project.objects.get(pk=project_id)
            except Project.DoesNotExist:
                return Response({
                    'error': f'Project {project_id} not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            modified_config = inject_model_path(
                project.label_config,
                target_filename,
                model.label_type
            )
            
            if modified_config != project.label_config:
                project.label_config = modified_config
                project.save()
                logger.info(f"Updated label_config for Project {project_id}")
            
            try:
                from ml.models import MLBackend
                
                ml_backend, created = MLBackend.objects.get_or_create(
                    project=project,
                    url='http://localhost:9090',
                    defaults={
                        'title': f'YOLO预标注 - {target_filename}',
                        'is_interactive': True,
                    }
                )
                
                if created:
                    logger.info(f"Created ML Backend association for Project {project_id}")
                else:
                    logger.info(f"ML Backend already exists for Project {project_id}")
                    
            except Exception as e:
                logger.error(f"Failed to ensure ML Backend association: {e}")
            
            model.deployed = True
            model.deployed_at = now()
            model.deployed_path = target_path
            model.deployed_to_project = project_id
            model.save()
            
            logger.info(f"Model {pk} deployed successfully to Project {project_id}")
            
            return Response({
                'message': '模型部署成功',
                'deployed_path': target_path,
                'deployed_filename': target_filename,
                'project_id': project_id,
                'project_title': project.title
            }, status=status.HTTP_200_OK)
            
        except TrainingModels.DoesNotExist:
            return Response({
                'error': f'Training model {pk} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to deploy model {pk}: {e}")
            return Response({
                'error': f'部署失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)