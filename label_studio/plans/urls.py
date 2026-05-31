"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from django.urls import include, path

from . import api, views
app_name = 'plans'

# reverse for projects:name
_urlpatterns = [
    path('', views.plan_list, name='plans-index')
]

# reverse for projects:api:name
_api_urlpatterns = [
    # CRUD
    path('', api.PlanListAPI.as_view(), name='plan-list'),
    # 详情、更新、删除
    path('<int:pk>/', api.PlanAPI.as_view({
        'get': 'retrieve',
        'put': 'update',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='plan-detail'),

    # 状态操作路由
    path('<int:pk>/cancel/', api.PlanAPI.as_view({'post': 'do_cancel'}), name='plan-cancel'),
    path('<int:pk>/release/', api.PlanAPI.as_view({'post': 'do_release'}), name='plan-release'),
    path('<int:pk>/confirm/', api.PlanAPI.as_view({'post': 'do_confirm'}), name='plan-confirm'),
    path('<int:pk>/file-ready/', api.PlanAPI.as_view({'post': 'do_file_ready'}), name='plan-file-ready'),
    path('<int:pk>/start/', api.PlanAPI.as_view({'post': 'do_start'}), name='plan-start'),
    path('<int:pk>/complete/', api.PlanAPI.as_view({'post': 'do_complete'}), name='plan-complete'),
    path('<int:pk>/failure/', api.PlanAPI.as_view({'post': 'do_failure'}), name='plan-failure'),

    # 记录管理路由
    path('<int:pk>/add-record/', api.PlanAPI.as_view({'post': 'add_record'}), name='plan-add-record'),
    path('<int:pk>/records/', api.PlanAPI.as_view({'get': 'records'}), name='plan-records'),
    path('<int:pk>/training-epochs/', api.PlanAPI.as_view({'get': 'training_epochs'}), name='training-epochs'),

    path('<int:pk>/training-log/', api.PlanAPI.as_view({'get': 'training_log'}), name='training-log'),
]


urlpatterns = [
    path('plans/', include(_urlpatterns)),
    path('plans/<int:pk>/detail/', views.detail_page, name='plan-detail'),
    path('api/plans/', include((_api_urlpatterns, app_name), namespace='api')),
]
