# """This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
# """
# import logging
# from datetime import datetime

# from core.permissions import AllPermissions
# from core.redis import start_job_async_or_sync
# from core.utils.common import load_func
# from data_manager.functions import evaluate_predictions
# from django.conf import settings
# from projects.models import Project
# from tasks.functions import update_tasks_counters
# from tasks.models import Annotation, AnnotationDraft, Prediction, Task
# from users.models import User
# from webhooks.models import WebhookAction
# from webhooks.utils import emit_webhooks_for_instance

# all_permissions = AllPermissions()
# logger = logging.getLogger(__name__)


# def retrieve_tasks_predictions(project, queryset, **kwargs):
#     """Retrieve predictions by tasks ids

#     :param project: project instance
#     :param queryset: filtered tasks db queryset
#     """
#     evaluate_predictions(queryset)
#     return {'processed_items': queryset.count(), 'detail': 'Retrieved ' + str(queryset.count()) + ' predictions'}


# def delete_tasks(project, queryset, **kwargs):
#     """Delete tasks by ids

#     :param project: project instance
#     :param queryset: filtered tasks db queryset
#     """
#     tasks_ids = list(queryset.values('id'))
#     count = len(tasks_ids)
#     tasks_ids_list = [task['id'] for task in tasks_ids]
#     project_count = project.tasks.count()
#     # unlink tasks from project
#     queryset = Task.objects.filter(id__in=tasks_ids_list)
#     queryset.update(project=None)
#     # delete all project tasks
#     if count == project_count:
#         start_job_async_or_sync(Task.delete_tasks_without_signals_from_task_ids, tasks_ids_list)
#         logger.info(f'calling reset project_id={project.id} delete_tasks()')
#         project.summary.reset()

#     # delete only specific tasks
#     else:
#         # update project summary and delete tasks
#         start_job_async_or_sync(async_project_summary_recalculation, tasks_ids_list, project.id)

#     project.update_tasks_states(
#         maximum_annotations_changed=False, overlap_cohort_percentage_changed=False, tasks_number_changed=True
#     )
#     # emit webhooks for project
#     emit_webhooks_for_instance(project.organization, project, WebhookAction.TASKS_DELETED, tasks_ids)

#     # remove all tabs if there are no tasks in project
#     reload = False
#     if not project.tasks.exists():
#         project.views.all().delete()
#         reload = True

#     # Execute actions after delete tasks
#     Task.after_bulk_delete_actions(tasks_ids_list, project)

#     return {'processed_items': count, 'reload': reload, 'detail': 'Deleted ' + str(count) + ' tasks'}


# def delete_tasks_annotations(project, queryset, **kwargs):
#     """Delete all annotations and drafts by tasks ids

#     :param project: project instance
#     :param queryset: filtered tasks db queryset
#     """
#     request = kwargs['request']
#     annotator_id = request.data.get('annotator')

#     task_ids = queryset.values_list('id', flat=True)
#     annotations = Annotation.objects.filter(task__id__in=task_ids)
#     if annotator_id:
#         annotations = annotations.filter(completed_by=int(annotator_id))

#     # take only tasks where annotations are going to be deleted
#     real_task_ids = set(list(annotations.values_list('task__id', flat=True)))
#     annotations_ids = list(annotations.values('id'))
#     # remove deleted annotations from project.summary
#     project.summary.remove_created_annotations_and_labels(annotations)
#     # also remove drafts for the task. This includes task and annotation level
#     # drafts by design.
#     drafts = AnnotationDraft.objects.filter(task__id__in=task_ids)
#     if annotator_id:
#         drafts = drafts.filter(user=int(annotator_id))
#     project.summary.remove_created_drafts_and_labels(drafts)

#     count, _ = annotations.delete()
#     drafts.delete()  # since task-level annotation drafts will not have been deleted by CASCADE
#     emit_webhooks_for_instance(project.organization, project, WebhookAction.ANNOTATIONS_DELETED, annotations_ids)
#     request = kwargs['request']

#     tasks = Task.objects.filter(id__in=real_task_ids)
#     tasks.update(updated_at=datetime.now(), updated_by=request.user)
#     # Update tasks counter and is_labeled. It should be a single operation as counters affect bulk is_labeled update
#     project.update_tasks_counters_and_is_labeled(tasks_queryset=real_task_ids)

#     # LSE postprocess
#     postprocess = load_func(settings.DELETE_TASKS_ANNOTATIONS_POSTPROCESS)
#     if postprocess is not None:
#         tasks = Task.objects.filter(id__in=task_ids)
#         postprocess(project, tasks, **kwargs)

#     return {'processed_items': count, 'detail': 'Deleted ' + str(count) + ' annotations'}


# def delete_tasks_annotations_form(user, project):
#     annotator_ids = list(Annotation.objects.filter(project=project).values_list('completed_by', flat=True))
#     draft_annotator_ids = list(AnnotationDraft.objects.filter(task__project=project).values_list('user', flat=True))
#     users = User.objects.filter(id__in=annotator_ids + draft_annotator_ids)
#     return [
#         {
#             'columnCount': 1,
#             'fields': [
#                 {
#                     'type': 'select',
#                     'name': 'annotator',
#                     'label': 'Annotator',
#                     'options': [
#                         {'value': str(user.id), 'label': user.get_full_name() or user.username or user.email}
#                         for user in users
#                     ],
#                     'placeholder': 'All',
#                     'searchable': True,
#                 }
#             ],
#         }
#     ]


# def delete_tasks_predictions(project, queryset, **kwargs):
#     """Delete all predictions by tasks ids

#     :param project: project instance
#     :param queryset: filtered tasks db queryset
#     """
#     task_ids = queryset.values_list('id', flat=True)
#     predictions = Prediction.objects.filter(task__id__in=task_ids)
#     real_task_ids = set(list(predictions.values_list('task__id', flat=True)))
#     count = predictions.count()
#     predictions.delete()
#     start_job_async_or_sync(update_tasks_counters, Task.objects.filter(id__in=real_task_ids))
#     return {'processed_items': count, 'detail': 'Deleted ' + str(count) + ' predictions'}


# def async_project_summary_recalculation(tasks_ids_list, project_id):
#     queryset = Task.objects.filter(id__in=tasks_ids_list)
#     project = Project.objects.get(id=project_id)
#     project.summary.remove_created_annotations_and_labels(Annotation.objects.filter(task__in=queryset))
#     project.summary.remove_data_columns(queryset)
#     Task.delete_tasks_without_signals(queryset)


# actions = [
#     {
#         'entry_point': retrieve_tasks_predictions,
#         'permission': all_permissions.predictions_any,
#         'title': 'Retrieve Predictions',
#         'order': 90,
#         'dialog': {
#             'title': 'Retrieve Predictions',
#             'text': 'Send the selected tasks to all ML backends connected to the project.'
#             'This operation might be abruptly interrupted due to a timeout. '
#             'The recommended way to get predictions is to update tasks using the Label Studio API.'
#             'Please confirm your action.',
#             'type': 'confirm',
#         },
#     },
#     {
#         'entry_point': delete_tasks,
#         'permission': all_permissions.tasks_delete,
#         'title': 'Delete Tasks',
#         'order': 100,
#         'reload': True,
#         'dialog': {
#             'text': 'You are going to delete the selected tasks. Please confirm your action.',
#             'type': 'confirm',
#         },
#     },
#     {
#         'entry_point': delete_tasks_annotations,
#         'permission': all_permissions.tasks_delete,
#         'title': 'Delete Annotations',
#         'order': 101,
#         'dialog': {
#             'text': 'You are going to delete annotations from the selected tasks.\n'
#             'You can select specific annotators to delete annotations for.\n'
#             'Please confirm your action.',
#             'type': 'confirm',
#             'form': delete_tasks_annotations_form,
#         },
#     },
#     {
#         'entry_point': delete_tasks_predictions,
#         'permission': all_permissions.predictions_any,
#         'title': 'Delete Predictions',
#         'order': 102,
#         'dialog': {
#             'text': 'You are going to delete all predictions from the selected tasks. Please confirm your action.',
#             'type': 'confirm',
#         },
#     },
# ]

"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
import logging
from datetime import datetime

from core.permissions import AllPermissions
from core.redis import start_job_async_or_sync
from core.utils.common import load_func
from data_manager.functions import evaluate_predictions
from django.conf import settings
from projects.models import Project
from tasks.functions import update_tasks_counters
from tasks.models import Annotation, AnnotationDraft, Prediction, Task
from users.models import User
from webhooks.models import WebhookAction
from webhooks.utils import emit_webhooks_for_instance

all_permissions = AllPermissions()
logger = logging.getLogger(__name__)


def retrieve_tasks_predictions(project, queryset, **kwargs):
    """通过任务ID检索预测

    :param project: 项目实例
    :param queryset: 过滤后的任务数据库查询集
    """
    evaluate_predictions(queryset)
    return {'processed_items': queryset.count(), 'detail': '已检索 ' + str(queryset.count()) + ' 个预测'}


def delete_tasks(project, queryset, **kwargs):
    """通过ID删除任务

    :param project: 项目实例
    :param queryset: 过滤后的任务数据库查询集
    """
    tasks_ids = list(queryset.values('id'))
    count = len(tasks_ids)
    tasks_ids_list = [task['id'] for task in tasks_ids]
    project_count = project.tasks.count()
    # 从项目中取消链接任务
    queryset = Task.objects.filter(id__in=tasks_ids_list)
    queryset.update(project=None)
    # 删除所有项目任务
    if count == project_count:
        start_job_async_or_sync(Task.delete_tasks_without_signals_from_task_ids, tasks_ids_list)
        logger.info(f'调用重置 project_id={project.id} delete_tasks()')
        project.summary.reset()

    # 仅删除特定任务
    else:
        # 更新项目摘要并删除任务
        start_job_async_or_sync(async_project_summary_recalculation, tasks_ids_list, project.id)

    project.update_tasks_states(
        maximum_annotations_changed=False, overlap_cohort_percentage_changed=False, tasks_number_changed=True
    )
    # 为项目触发webhook
    emit_webhooks_for_instance(project.organization, project, WebhookAction.TASKS_DELETED, tasks_ids)

    # 如果项目中没有任务，则删除所有标签页
    reload = False
    if not project.tasks.exists():
        project.views.all().delete()
        reload = True

    # 执行删除任务后的操作
    Task.after_bulk_delete_actions(tasks_ids_list, project)

    return {'processed_items': count, 'reload': reload, 'detail': '已删除 ' + str(count) + ' 个任务'}


def delete_tasks_annotations(project, queryset, **kwargs):
    """通过任务ID删除所有标注和草稿

    :param project: 项目实例
    :param queryset: 过滤后的任务数据库查询集
    """
    request = kwargs['request']
    annotator_id = request.data.get('annotator')

    task_ids = queryset.values_list('id', flat=True)
    annotations = Annotation.objects.filter(task__id__in=task_ids)
    if annotator_id:
        annotations = annotations.filter(completed_by=int(annotator_id))

    # 仅获取将要删除标注的任务
    real_task_ids = set(list(annotations.values_list('task__id', flat=True)))
    annotations_ids = list(annotations.values('id'))
    # 从project.summary中移除已删除的标注
    project.summary.remove_created_annotations_and_labels(annotations)
    # 同时移除任务的草稿。这包括任务级和标注级草稿
    drafts = AnnotationDraft.objects.filter(task__id__in=task_ids)
    if annotator_id:
        drafts = drafts.filter(user=int(annotator_id))
    project.summary.remove_created_drafts_and_labels(drafts)

    count, _ = annotations.delete()
    drafts.delete()  # 由于任务级标注草稿不会通过CASCADE删除
    emit_webhooks_for_instance(project.organization, project, WebhookAction.ANNOTATIONS_DELETED, annotations_ids)
    request = kwargs['request']

    tasks = Task.objects.filter(id__in=real_task_ids)
    tasks.update(updated_at=datetime.now(), updated_by=request.user)
    # 更新任务计数器和is_labeled。这应该是单个操作，因为计数器影响批量is_labeled更新
    project.update_tasks_counters_and_is_labeled(tasks_queryset=real_task_ids)

    # LSE后处理
    postprocess = load_func(settings.DELETE_TASKS_ANNOTATIONS_POSTPROCESS)
    if postprocess is not None:
        tasks = Task.objects.filter(id__in=task_ids)
        postprocess(project, tasks, **kwargs)

    return {'processed_items': count, 'detail': '已删除 ' + str(count) + ' 个标注'}


def delete_tasks_annotations_form(user, project):
    annotator_ids = list(Annotation.objects.filter(project=project).values_list('completed_by', flat=True))
    draft_annotator_ids = list(AnnotationDraft.objects.filter(task__project=project).values_list('user', flat=True))
    users = User.objects.filter(id__in=annotator_ids + draft_annotator_ids)
    return [
        {
            'columnCount': 1,
            'fields': [
                {
                    'type': 'select',
                    'name': 'annotator',
                    'label': '标注员',
                    'options': [
                        {'value': str(user.id), 'label': user.get_full_name() or user.username or user.email}
                        for user in users
                    ],
                    'placeholder': '全部',
                    'searchable': True,
                }
            ],
        }
    ]


def delete_tasks_predictions(project, queryset, **kwargs):
    """通过任务ID删除所有预测

    :param project: 项目实例
    :param queryset: 过滤后的任务数据库查询集
    """
    task_ids = queryset.values_list('id', flat=True)
    predictions = Prediction.objects.filter(task__id__in=task_ids)
    real_task_ids = set(list(predictions.values_list('task__id', flat=True)))
    count = predictions.count()
    predictions.delete()
    start_job_async_or_sync(update_tasks_counters, Task.objects.filter(id__in=real_task_ids))
    return {'processed_items': count, 'detail': '已删除 ' + str(count) + ' 个预测'}


def async_project_summary_recalculation(tasks_ids_list, project_id):
    queryset = Task.objects.filter(id__in=tasks_ids_list)
    project = Project.objects.get(id=project_id)
    project.summary.remove_created_annotations_and_labels(Annotation.objects.filter(task__in=queryset))
    project.summary.remove_data_columns(queryset)
    Task.delete_tasks_without_signals(queryset)


actions = [
    {
        'entry_point': retrieve_tasks_predictions,
        'permission': all_permissions.predictions_any,
        'title': '获取预测结果',
        'order': 90,
        'dialog': {
            'title': '获取预测结果',
            'text': '将选定的任务发送到项目中连接的所有机器学习后端进行预测。'
            '此操作可能会因超时而中断。'
            '推荐的获取预测方式是通过API更新任务。'
            '请确认是否继续执行此操作。',
            'type': 'confirm',
        },
    },
    {
        'entry_point': delete_tasks,
        'permission': all_permissions.tasks_delete,
        'title': '删除任务',
        'order': 100,
        'reload': True,
        'dialog': {
            'text': '您即将删除选定的任务。此操作不可恢复，请确认是否继续。',
            'type': 'confirm',
        },
    },
    {
        'entry_point': delete_tasks_annotations,
        'permission': all_permissions.tasks_delete,
        'title': '删除标注',
        'order': 101,
        'dialog': {
            'text': '您即将删除选定任务中的标注。\n'
            '您可以指定要删除哪些标注员的标注。\n'
            '请确认是否继续执行此操作。',
            'type': 'confirm',
            'form': delete_tasks_annotations_form,
        },
    },
    {
        'entry_point': delete_tasks_predictions,
        'permission': all_permissions.predictions_any,
        'title': '删除预测',
        'order': 102,
        'dialog': {
            'text': '您即将删除选定任务中的所有预测结果。请确认是否继续。',
            'type': 'confirm',
        },
    },
]
