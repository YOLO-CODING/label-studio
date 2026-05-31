import json
import os
from django.http import JsonResponse, Http404
from rest_framework import generics, viewsets, status
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response

from core.permissions import ViewClassPermission
from ship_detections.models import ShipDetection
from ship_detections.serializers import (
    ShipDetectionSerializer,
    JSONDataSerializer
)

class ShipDetectionPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'

    def get_page_size(self, request):
        # emulate "unlimited" page_size
        if (
                self.page_size_query_param in request.query_params
                and request.query_params[self.page_size_query_param] == '-1'
        ):
            return 20
        return super().get_page_size(request)


class ShipDetectionListAPI(generics.ListAPIView):
    queryset = ShipDetection.objects.all()
    parser_classes = (JSONParser, FormParser, MultiPartParser)
    permission_required = ViewClassPermission(
    )
    serializer_class = JSONDataSerializer
    pagination_class = ShipDetectionPagination

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def get_queryset(self):
        # 从JSON文件加载数据，返回空queryset以避免数据库查询
        self._load_data_from_json()
        return ShipDetection.objects.none()

    def list(self, request, *args, **kwargs):
        """
        重写list方法，从JSON文件加载数据并返回
        """
        try:
            # 从JSON文件加载数据
            data = self._load_data_from_json()

            # 应用分页
            page = self.paginate_queryset(data)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)

            # 如果没有分页，直接返回所有数据
            serializer = self.get_serializer(data, many=True)
            return Response(serializer.data)

        except FileNotFoundError:
            return Response(
                {"error": "data.json file not found in current directory"},
                status=status.HTTP_404_NOT_FOUND
            )
        except json.JSONDecodeError as e:
            return Response(
                {"error": f"Invalid JSON format in data.json: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {"error": f"An error occurred while loading data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _load_data_from_json(self):
        """
        从当前目录的data.json文件加载数据
        """
        # 获取当前文件所在目录
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_file_path = os.path.join(current_dir, 'data.json')

        # 读取JSON文件
        with open(json_file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        return data


class ShipDetectionAPI(viewsets.ModelViewSet):
    serializer_class = JSONDataSerializer
    http_method_names = ['get', 'patch', 'delete']

    def _load_json_data(self):
        """
        加载data.json文件数据
        """
        current_dir = os.path.dirname(os.path.abspath(__file__))
        json_file_path = os.path.join(current_dir, 'data.json')

        try:
            with open(json_file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data
        except FileNotFoundError:
            raise Http404("data.json file not found")
        except json.JSONDecodeError:
            raise Http404("Invalid JSON format in data.json")

    def _find_ship_by_id(self, ship_id):
        """
        在JSON数据中根据ID查找船只
        """
        data = self._load_json_data()

        # 假设JSON数据格式是你之前提供的格式
        if isinstance(data, list):
            # 查找顶层对象
            for item in data:
                # 如果顶层有id字段且匹配
                if item.get('id') == ship_id:
                    return item

                # 在ships数组中查找
                if 'ships' in item and isinstance(item['ships'], list):
                    for ship in item['ships']:
                        if ship.get('id') == ship_id:
                            return ship
        else:
            # 如果是单个对象
            if data.get('id') == ship_id:
                return data

            # 在ships数组中查找
            if 'ships' in data and isinstance(data['ships'], list):
                for ship in data['ships']:
                    if ship.get('id') == ship_id:
                        return ship

        return None

    def retrieve(self, request, *args, **kwargs):
        """
        从data.json中根据ID查找单个船只记录
        """
        try:
            # 获取请求的ID
            ship_id = kwargs.get('pk')

            # 将ID转换为整数（根据你的数据格式决定）
            try:
                ship_id = int(ship_id)
            except ValueError:
                # 如果ID不是数字，尝试直接匹配字符串
                pass

            # 在JSON数据中查找
            ship_data = self._find_ship_by_id(ship_id)

            if ship_data is None:
                return Response(
                    {"detail": f"Ship with id {ship_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )

            # 序列化并返回数据
            serializer = self.get_serializer(ship_data)
            return Response(serializer.data)

        except Http404 as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        # 由于数据来自文件，这里可以选择实现或返回错误
        return Response(
            {"detail": "Delete operation not supported for file-based data"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    def partial_update(self, request, *args, **kwargs):
        # 由于数据来自文件，这里可以选择实现或返回错误
        return Response(
            {"detail": "Update operation not supported for file-based data"},
            status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    @action(detail=True, methods=['get'])
    def get_latest(self, request):
        try:
            # 从JSON文件加载数据
            data = self._load_json_data()

            if isinstance(data, list):
                # 在JSON数据中查找
                ship_data = data[0]

                if ship_data is None:
                    return Response(data={
                        "error": "Invalid json data"
                    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

                # 序列化并返回数据
                serializer = self.get_serializer(ship_data)
                return Response(serializer.data)
            else:
                return Response(data={
                    "error": "Invalid json data"
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        except Exception as e:
            return Response(
                {"error": f"An error occurred while loading data: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )