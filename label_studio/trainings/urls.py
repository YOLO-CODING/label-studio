"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from django.urls import include, path

from . import api,views
app_name = 'trainings'

# reverse for projects:name
_urlpatterns = [
    path('', views.trained_model_list, name='trained-models')
]

# reverse for projects:api:name
_api_urlpatterns = [
    # CRUD
    path('models', api.TrainingModelListAPI.as_view(), name='model-list'),
    # 详情、更新、删除
    path('models/<int:pk>/', api.TrainingModelAPI.as_view({
        'get': 'retrieve',
        'delete': 'destroy'
    }), name='model-detail'),
    # 状态操作路由
    path('<int:pk>/generate/', api.TrainingAPI.as_view({'post': 'generate'}), name='training-generate'),
    path('<int:pk>/start/', api.TrainingAPI.as_view({'post': 'start'}), name='training-start'),
]


urlpatterns = [
    path('trained-models/', include(_urlpatterns)),
    path('api/trainings/', include((_api_urlpatterns, app_name), namespace='api')),
]
