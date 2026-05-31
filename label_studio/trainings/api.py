"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging
import django_rq

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