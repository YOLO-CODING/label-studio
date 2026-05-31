from drf_dynamic_fields import DynamicFieldsMixin
from core.utils.common import load_func, retry_database_locked
from rest_framework import generics, serializers
from rest_flex_fields import FlexFieldsModelSerializer
from projects.models import Project
from plans.models import (
    Plan,
    PlanRecords,
    TrainingEpochs,
    TrainingModels
)
from plans.validation import PlanValidator
from rest_framework.fields import SerializerMethodField
from users.serializers import UserSimpleSerializer


class CreatedByFromContext:
    requires_context = True

    def __call__(self, serializer_field):
        return serializer_field.context.get('created_by')

class BasePlanSerializer(FlexFieldsModelSerializer):
    """Task Serializer with project scheme configs validation"""

    created_by = UserSimpleSerializer(default=CreatedByFromContext(), help_text='Plan owner')

    def project(self, plan):
        """Take the project from context"""
        if 'project' in self.context:
            project = self.context['project']
        elif 'view' in self.context and 'project_id' in self.context['view'].kwargs:
            kwargs = self.context['view'].kwargs
            project = generics.get_object_or_404(Project, kwargs['project_id'])
        elif plan.project_id:
            project = generics.get_object_or_404(Project, pk=plan.project_id)
        else:
            project = None
        return project

    def validate(self, plan):
        instance = self.instance if hasattr(self, 'instance') else None
        validator = PlanValidator(
            self.project(plan=instance),
            plan,
        )
        return validator.validate(plan)

    class Meta:
        model = Plan
        fields = '__all__'


PlanSerializer = load_func('plans.serializers.BasePlanSerializer')


class PlanRecordsSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = PlanRecords
        fields = '__all__'

class TrainingEpochsSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = TrainingEpochs
        fields = '__all__'

class TrainingModelsSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = TrainingModels
        fields = '__all__'