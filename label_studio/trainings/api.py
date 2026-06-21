"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging
import django_rq
import os

from django.conf import settings

logger = logging.getLogger(__name__)
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
    TrainingModels,
    DeploymentHistory
)
from trainings.jobs import (
    prepare_training
)
from trainings.deployment import (
    inject_model_path,
    remove_model_path,
    copy_model_to_backend,
    generate_model_filename,
    extract_model_labels
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
            
            # Allow redeployment - log warning if already deployed
            if model.deployed:
                logger.warning(f"Redeploying model {pk} (previously deployed to Project {model.deployed_to_project})")
            
            if not model.plan:
                return Response({
                    'error': 'Model has no associated plan'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            target_filename = generate_model_filename(
                model.plan_id,
                model.model_kind,
                model.batch_no
            )
            
            # Build source path from model filename and TRAINING_MODEL_DIR
            source_path = os.path.join(settings.TRAINING_MODEL_DIR, str(model.plan_id), "training-model.pt")
            
            if not os.path.exists(source_path):
                return Response({
                    'error': f'Source model file not found: {source_path}',
                    'model_name': model.path  # Return model filename for user reference
                }, status=status.HTTP_404_NOT_FOUND)
            
            target_path = copy_model_to_backend(
                source_path,
                target_filename,
                settings.ML_BACKEND_MODEL_DIR
            )
            
            if not target_path:
                return Response({
                    'error': 'Failed to copy model file to ML Backend directory'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            project_id = request.data.get('project_id', model.plan.project_id)
            
            # Get score threshold from request (default 0.5)
            try:
                score_threshold = float(request.data.get('score_threshold', 0.5))
                if score_threshold < 0 or score_threshold > 1:
                    return Response({
                        'error': '置信度必须在 0 到 1 之间'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except (TypeError, ValueError):
                return Response({
                    'error': '置信度参数格式错误'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                from projects.models import Project
                project = Project.objects.get(pk=project_id)
            except Project.DoesNotExist:
                return Response({
                    'error': f'Project {project_id} not found'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Auto-delete old deployment if project already has one (ensure 1 project = 1 model)
            old_deployment = DeploymentHistory.objects.filter(project_id=project_id).first()
            
            if old_deployment and old_deployment.training_model != model:
                logger.info(f"Auto-replacing deployment for Project {project_id}: Model {old_deployment.training_model_id} -> Model {model.id}")
                
                old_model = old_deployment.training_model
                old_deployment.delete()
                
                # Update old model's deployment status
                remaining_count = DeploymentHistory.objects.filter(training_model=old_model).count()
                if remaining_count == 0:
                    old_model.deployed = False
                    old_model.deployed_at = None
                    old_model.deployed_path = None
                    old_model.deployed_to_project = None
                    old_model.save()
                else:
                    # Update to most recent remaining deployment
                    last_deployment = DeploymentHistory.objects.filter(
                        training_model=old_model
                    ).order_by('-deployed_at').first()
                    if last_deployment:
                        old_model.deployed_to_project = last_deployment.project_id
                        old_model.deployed_at = last_deployment.deployed_at
                        old_model.deployed_path = last_deployment.deployed_path
                        old_model.save()
            
            # Extract model labels and validate label mapping
            # Use source_path (original training model) to extract labels, not target_path (copied file)
            model_labels = extract_model_labels(source_path)
            logger.info(f"Model labels extracted from {source_path}: {model_labels}")
            
            modified_config, validation_result = inject_model_path(
                project.label_config,
                target_filename,
                model.label_type,
                model_labels,
                score_threshold
            )
            
            logger.info(f"Label validation result: {validation_result}")
            
            # Block deployment if label validation fails
            if validation_result and not validation_result.get('valid'):
                missing_labels = validation_result.get('missing_labels', [])
                config_labels = validation_result.get('config_labels', [])
                message = validation_result.get('message', '')
                model_label_type = validation_result.get('model_label_type')
                project_label_type = validation_result.get('project_label_type')
                
                # Generate user-friendly error message
                # Check if it's label type mismatch (more specific error)
                if message and '标签类型不匹配' in message:
                    error_msg = f"标签类型不匹配，无法部署。\n\n"
                    error_msg += f"原因：模型训练的标注类型与项目配置的标注类型不一致。\n\n"
                    error_msg += f"模型标注类型：{model_label_type}（矩形框标注）\n"
                    error_msg += f"项目标注类型：{project_label_type}（多边形标注）\n\n"
                    error_msg += "解决方法：\n"
                    error_msg += "1. 创建新项目，在标签配置中使用 RectangleLabels\n"
                    error_msg += "2. 或者修改当前项目的标签配置，将 PolygonLabels 改为 RectangleLabels"
                else:
                    error_msg = "模型标签与项目标签不匹配，无法部署。\n\n"
                    error_msg += f"模型识别的标签: {', '.join(missing_labels) if missing_labels else '无'}\n"
                    error_msg += f"项目配置的标签: {', '.join(config_labels) if config_labels else '无'}\n\n"
                    error_msg += "请在项目设置中修改标签配置，添加 predicted_values 属性来匹配模型标签。\n"
                    error_msg += "例如: <Label value=\"warship\" predicted_values=\"ship\" />"
                
                return Response({
                    'error': error_msg,
                    'label_validation': validation_result
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if modified_config != project.label_config:
                project.label_config = modified_config
                project.save()
                logger.info(f"Updated label_config for Project {project_id}")
            
            try:
                from ml.models import MLBackend
                
                # Update or create ML Backend association (update title with latest model)
                # 查找键只用 project（每个项目一条 ML Backend）；
                # URL 从环境变量 ML_BACKEND_URL 取（默认 localhost），避免硬编码 localhost 产生重复记录。
                # 已存在则只更新 title，不改 URL（保留运维已配置的正确地址）。详见 TROUBLESHOOTING 问题 11。
                ml_backend_url = os.environ.get('ML_BACKEND_URL', 'http://localhost:9090')
                ml_backend = MLBackend.objects.filter(project=project).first()
                if ml_backend:
                    ml_backend.title = f'预标注模型 - {target_filename}'
                    ml_backend.is_interactive = True
                    ml_backend.save(update_fields=['title', 'is_interactive'])
                    created = False
                else:
                    ml_backend = MLBackend.objects.create(
                        project=project,
                        url=ml_backend_url,
                        title=f'预标注模型 - {target_filename}',
                        is_interactive=True,
                    )
                    created = True
                
                if created:
                    logger.info(f"Created ML Backend association for Project {project_id}")
                else:
                    logger.info(f"Updated ML Backend association for Project {project_id} with model {target_filename}")
                    
            except Exception as e:
                logger.error(f"Failed to ensure ML Backend association: {e}")
            
            model.deployed = True
            model.deployed_at = now()
            model.deployed_path = target_filename  # Save relative filename, not full path
            model.deployed_to_project = project_id
            model.save()
            
            # Create deployment history record (project_id is unique, so only one record per project)
            deployment_history, created = DeploymentHistory.objects.update_or_create(
                project_id=project_id,  # Find by project_id (unique constraint)
                defaults={
                    'training_model': model,  # Update training_model if old deployment exists
                    'project_title': project.title,
                    'deployed_path': target_filename,
                    'deployed_by': request.user if request.user.is_authenticated else None,
                    'deployed_at': now(),  # Update deployment time
                }
            )
            
            if created:
                logger.info(f"Created deployment history for Model {pk} to Project {project_id}")
            else:
                logger.info(f"Updated deployment history for Model {pk} to Project {project_id} (redeployed)")
            
            logger.info(f"Model {pk} deployed successfully to Project {project_id}")
            
            response_data = {
                'message': '模型部署成功',
                'deployed_path': target_path,
                'deployed_filename': target_filename,
                'project_id': project_id,
                'project_title': project.title,
                'score_threshold': score_threshold
            }
            
            # Add label validation result
            if validation_result:
                response_data['label_validation'] = validation_result
                if not validation_result.get('valid'):
                    logger.warning(f"Label validation warning: {validation_result.get('message')}")
            
            return Response(response_data, status=status.HTTP_200_OK)
            
        except TrainingModels.DoesNotExist:
            return Response({
                'error': f'Training model {pk} not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to deploy model {pk}: {e}")
            return Response({
                'error': f'部署失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TrainingModelCancelDeployAPI(APIView):
    """Cancel deployment of a training model to a specific project"""
    
    permission_required = ViewClassPermission()
    
    def post(self, request, pk):
        try:
            model = TrainingModels.objects.get(pk=pk)
            
            project_id = request.data.get('project_id')
            if not project_id:
                return Response({'error': 'project_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
            deployment = DeploymentHistory.objects.filter(
                training_model=model,
                project_id=project_id
            ).first()
            
            if not deployment:
                return Response({'error': f'No deployment found for Project {project_id}'}, status=status.HTTP_404_NOT_FOUND)
            
            deployment.delete()
            logger.info(f"Deleted deployment history for Model {pk} to Project {project_id}")
            
            # Check if this project still has other model deployments
            remaining_project_deployments = DeploymentHistory.objects.filter(project_id=project_id).count()
            
            if remaining_project_deployments == 0:
                # No other model deployed to this project, clean up label_config
                # but keep MLBackend association so default model can still be used
                try:
                    from projects.models import Project
                    project = Project.objects.get(pk=project_id)
                    
                    # Remove model_path from label_config (project will fall back to default model)
                    cleaned_config = remove_model_path(project.label_config)
                    if cleaned_config != project.label_config:
                        project.label_config = cleaned_config
                        project.save()
                        logger.info(f"Removed model_path from label_config of Project {project_id}")
                    
                    # Keep MLBackend association so project can still use default model
                    # Only update title to reflect the change (no specific model assigned)
                    from ml.models import MLBackend
                    ml_backends = MLBackend.objects.filter(project=project)
                    if ml_backends.exists():
                        ml_backends.update(title='预标注模型 - 默认模型')
                        logger.info(f"Reset MLBackend title for Project {project_id} (will use default model)")
                    
                except Project.DoesNotExist:
                    logger.warning(f"Project {project_id} not found, skipping cleanup")
            
            # Update TrainingModels deployment status
            remaining_count = DeploymentHistory.objects.filter(training_model=model).count()
            
            if remaining_count == 0:
                model.deployed = False
                model.deployed_at = None
                model.deployed_path = None
                model.deployed_to_project = None
                model.save()
                logger.info(f"Reset deployment status for Model {pk} (no remaining deployments)")
            else:
                last_deployment = DeploymentHistory.objects.filter(
                    training_model=model
                ).order_by('-deployed_at').first()
                
                if last_deployment:
                    model.deployed_to_project = last_deployment.project_id
                    model.deployed_at = last_deployment.deployed_at
                    model.deployed_path = last_deployment.deployed_path
                    model.save()
            
            return Response({
                'message': f'Successfully cancelled deployment to Project {project_id}',
                'model_id': pk,
                'project_id': project_id,
                'remaining_deployments': remaining_count
            }, status=status.HTTP_200_OK)
            
        except TrainingModels.DoesNotExist:
            return Response({'error': f'Training model {pk} not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"Failed to cancel deployment for model {pk}: {e}")
            return Response({'error': f'取消部署失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)