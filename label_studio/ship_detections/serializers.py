import json
import os
from rest_framework import serializers
from rest_flex_fields import FlexFieldsModelSerializer

from ship_detections.models import ShipDetection


class JSONDataSerializer(serializers.Serializer):
    """用于序列化JSON数据的序列化器"""
    # 根据你的JSON结构定义字段
    id = serializers.IntegerField()
    status = serializers.CharField()
    sources = serializers.DictField()
    summary = serializers.DictField()
    regions = serializers.ListField()
    ships = serializers.ListField()

    # 或者使用更灵活的方式
    def to_representation(self, instance):
        # 直接返回JSON数据本身
        return instance

class ShipDetectionSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = ShipDetection
        fields = '__all__'