"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from django.urls import include, path

from . import api, views
app_name = 'ship-detections'

# reverse for ship-detections:name
_urlpatterns = [
    path('', views.ship_detection_list, name='ship-detection-index')
]

# reverse for ship-detections:api:name
_api_urlpatterns = [
    # list page
    path('', api.ShipDetectionListAPI.as_view(), name='ship-detection-list'),
    # latest
    path('latest/', api.ShipDetectionAPI.as_view({'get': 'get_latest'}), name='ship-detection-latest'),
    # 详情、更新、删除
    path('<int:pk>/', api.ShipDetectionAPI.as_view({
        'get': 'retrieve',
        'patch': 'partial_update',
        'delete': 'destroy'
    }), name='ship-detection-detail')
]


urlpatterns = [
    path('ship-detections/', include(_urlpatterns)),
    path('ship-detections/<int:pk>/detail/', views.detail_page, name='ship-detection-detail'),
    path('api/ship-detections/', include((_api_urlpatterns, app_name), namespace='api')),
]
