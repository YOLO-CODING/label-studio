import datetime
import math
import os
import logging
import shutil
import time
import subprocess
import sys

import django_rq
import rq
import rq.exceptions
from django.conf import settings
from django.utils.timezone import now
from django_rq import job
from rq.job import Job


from trainings.generators import YoloDatasetGenerator
from plans.models import (
    Plan,
    PlanRecords,
    TrainingModels
)

def run_yolo_subprocess(plan_id, label_type, working_dir, dataset_entry, epoch_count, last_weight=None, epoch_start=0):
    """Run YOLO training in a completely separate process to avoid macOS fork segfault"""
    env = os.environ.copy()
    env['PYTHONUNBUFFERED'] = '1'
    env['OMP_NUM_THREADS'] = '1'
    env['MKL_NUM_THREADS'] = '1'
    env['OPENBLAS_NUM_THREADS'] = '1'
    env['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'
    env['CUDA_VISIBLE_DEVICES'] = ''
    env['PYTORCH_MPS_DISABLE'] = '1'
    env['OBJC_DISABLE_INITIALIZE_FORK_SAFETY'] = 'YES'
    env['DJANGO_SETTINGS_MODULE'] = 'core.settings.label_studio'
    env['DJANGO_DB'] = 'sqlite'
    
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    script_path = os.path.join(base_dir, 'trainings', 'yolo_train_standalone.py')
    
    cmd = [
        sys.executable, script_path,
        str(plan_id),
        label_type,
        working_dir,
        dataset_entry,
        str(epoch_count),
        last_weight or "None",
        str(epoch_start)
    ]
    
    logging.info(f"Running YOLO training subprocess: {' '.join(cmd)}")
    result = subprocess.run(cmd, env=env, cwd=base_dir, capture_output=False)
    return result.returncode == 0

def failure_handler(job, exc_type, exc_value, traceback):
    """自定义失败处理逻辑 - 更新 Plan 状态为 Failed"""
    logging.error(f"Job {job.id} failed with {exc_type}: {exc_value}")
    
    # 从 job args 中提取 plan_id
    if job.args and len(job.args) > 0:
        plan_id = job.args[0]
        try:
            plan = Plan.objects.get(pk=plan_id)
            plan.status = Plan.STATUS_FAILED
            plan.failed = True
            plan.fail_message = f"训练任务异常: {exc_type.__name__}: {str(exc_value)}"
            plan.save()
            logging.info(f"Plan {plan_id} marked as failed due to job exception")
        except Plan.DoesNotExist:
            logging.error(f"Plan {plan_id} not found when handling failure")
        except Exception as e:
            logging.error(f"Error updating plan {plan_id} status: {e}")

@job('q_datasets')
def prepare_training(plan_id):
    logging.info("Preparing training for plan: %s", plan_id)
    plan = Plan.objects.get(pk=plan_id)
    if plan.cancelled:
        logging.info("Plan %s is cancelled", plan_id)
        return
    if plan.failed:
        logging.info("Plan %s is already failed", plan_id)
        return
    generator = YoloDatasetGenerator(plan)
    generator.run()
    if generator.is_failed():
        logging.error("Training failed for plan: %s", generator.get_fail_message())
        plan.failed = True
        plan.fail_message = generator.get_fail_message()
        plan.status = Plan.STATUS_FAILED
        plan.save()
        return
    logging.info("Training prepare-done for plan: %s with type: %s", plan_id, generator.get_label_type())
    plan.status = Plan.STATUS_FILE_READY
    plan.save()

    # 创建 PlanRecord
    record = PlanRecords.objects.create(
        plan=plan,
        content="训练数据集准备就绪",
        platform="本地"
    )

    queue = django_rq.get_queue('q_trainings')
    queue.enqueue(startup_training, plan_id, generator.get_label_type(), generator.get_working_dir(), generator.get_dataset_entry())


@job('q_trainings')
def startup_training(plan_id, label_type, working_dir, dataset_entry):
    logging.info("Starting training for plan: %s at %s : %s : %s", plan_id, str(working_dir), str(dataset_entry), label_type)
    plan = Plan.objects.get(pk=plan_id)
    if plan.cancelled:
        logging.info("Plan %s is cancelled", plan_id)
        return
    if plan.failed:
        logging.info("Plan %s is already failed", plan_id)
        return
    plan.status = Plan.STATUS_RUNNING
    plan.started_at = now()
    # 批次增加
    plan.batch_last = plan.batch_last + 1
    plan.box_loss = 0
    plan.box_precision = 0
    plan.box_recall = 0
    plan.seg_loss = 0
    plan.m_precision = 0
    plan.m_recall = 0
    plan.save()
    time.sleep(5)
    # 创建 PlanRecord
    PlanRecords.objects.create(
        plan=plan,
        content="启动训练...",
        platform="本地"
    )

    queue = django_rq.get_queue('q_trainings')
    next_epoch_count = min(plan.epochs, 10)
    queue.enqueue(do_training_first_epochs, plan_id, label_type, working_dir, dataset_entry, next_epoch_count, on_failure=failure_handler)


@job('q_trainings')
def do_training_first_epochs(plan_id, label_type, working_dir, dataset_entry, epoch_count:int):
    logging.info("epoch 1 -  training for plan: %s with type: %s", plan_id, label_type)
    try:
        plan = Plan.objects.get(pk=plan_id)
        if plan.cancelled:
            logging.info("Plan %s is cancelled", plan_id)
            return
        if plan.failed:
            logging.info("Plan %s is already failed", plan_id)
            return

        # Use subprocess to avoid macOS fork segfault with PyTorch
        success = run_yolo_subprocess(plan_id, label_type, working_dir, dataset_entry, epoch_count, None)
        
        # Read best_weight from temp file
        best_weight = None
        weight_file = os.path.join(working_dir, ".best_weight.txt")
        if os.path.exists(weight_file):
            with open(weight_file, "r") as f:
                best_weight = f.read().strip() or None

        if not success or not best_weight:
            plan.failed = True
            plan.fail_message = "YOLO training subprocess failed"
            plan.status = Plan.STATUS_FAILED
            plan.save()

            PlanRecords.objects.create(
                plan=plan,
                content="第1-" + str(epoch_count) + "轮训练失败",
                platform="本地"
            )
            return

        PlanRecords.objects.create(
            plan=plan,
            content="第1-" + str(epoch_count) + "轮训练完成",
            platform="本地"
        )
        epoch_end = 0 + epoch_count
        queue = django_rq.get_queue('q_trainings')
        if epoch_end < plan.epochs:
            next_count = min(plan.epochs - epoch_end, 10)
            queue.enqueue(do_training_epochs, plan_id, label_type, working_dir, dataset_entry, epoch_end, next_count, best_weight, on_failure=failure_handler)
        else:
            queue.enqueue(finish_training, plan_id, label_type, working_dir, dataset_entry, epoch_end, best_weight, on_failure=failure_handler)
    except Exception as ex:
        logging.error("Training failed for plan: %s with type: %s, error: %s", plan_id, label_type, str(ex))
        try:
            plan = Plan.objects.get(pk=plan_id)
            plan.status = Plan.STATUS_FAILED
            plan.failed = True
            plan.fail_message = f"训练失败: {str(ex)}"
            plan.save()
        except Exception as e:
            logging.error(f"Error updating plan {plan_id} status: {e}")


@job('q_trainings')
def do_training_epochs(plan_id, label_type, working_dir, dataset_entry, epoch_start:int, epoch_count:int, last_weight:str):
    logging.info("epoch " + str(epoch_start) + " -  training for plan: %s with type: %s", plan_id, label_type)
    try:
        plan = Plan.objects.get(pk=plan_id)
        if plan.cancelled:
            logging.info("Plan %s is cancelled", plan_id)
            return
        if plan.failed:
            logging.info("Plan %s is already failed", plan_id)
            return

        # Use subprocess to avoid macOS fork segfault with PyTorch
        success = run_yolo_subprocess(plan_id, label_type, working_dir, dataset_entry, epoch_count, last_weight, epoch_start)
        
        # Read best_weight from temp file
        best_weight = None
        weight_file = os.path.join(working_dir, ".best_weight.txt")
        if os.path.exists(weight_file):
            with open(weight_file, "r") as f:
                best_weight = f.read().strip() or None

        if not success or not best_weight:
            plan.failed = True
            plan.fail_message = "YOLO training subprocess failed"
            plan.status = Plan.STATUS_FAILED
            plan.save()

            PlanRecords.objects.create(
                plan=plan,
                content="第" + str(epoch_start + 1) + "-" + str(epoch_start + epoch_count) + "轮训练失败",
                platform="本地"
            )
            return

        PlanRecords.objects.create(
            plan=plan,
            content="第" + str(epoch_start + 1) + "-" + str(epoch_start + epoch_count) + "轮训练完成",
            platform="本地"
        )
        queue = django_rq.get_queue('q_trainings')
        epoch_end = epoch_start + epoch_count
        if epoch_end < plan.epochs:
            next_count = min(plan.epochs - epoch_end, 10)
            queue.enqueue(do_training_epochs, plan_id, label_type, working_dir, dataset_entry, epoch_end, next_count, best_weight, on_failure=failure_handler)
        else:
            queue.enqueue(finish_training, plan_id, label_type, working_dir, dataset_entry, epoch_end, best_weight, on_failure=failure_handler)
    except Exception as ex:
        logging.error("Training failed for plan: %s with type: %s, error: %s", plan_id, label_type, str(ex))
        try:
            plan = Plan.objects.get(pk=plan_id)
            plan.status = Plan.STATUS_FAILED
            plan.failed = True
            plan.fail_message = f"训练失败: {str(ex)}"
            plan.save()
        except Exception as e:
            logging.error(f"Error updating plan {plan_id} status: {e}")


@job('q_trainings')
def finish_training(plan_id, label_type, working_dir, dataset_entry, epoch_end:int, last_weight:str):
    logging.info("finish training for plan: %s @ %s : %s", plan_id, str(working_dir), str(dataset_entry))
    plan = Plan.objects.get(pk=plan_id)
    if plan.cancelled:
        logging.info("Plan %s is cancelled", plan_id)
        return
    if plan.failed:
        logging.info("Plan %s is already failed", plan_id)
        return


    models_dir = os.path.join(settings.TRAINING_MODEL_DIR, str(plan_id))
    os.makedirs(models_dir, exist_ok=True)
    models_file = os.path.join(models_dir, "training-model.pt")
    if os.path.exists(models_file):
        os.remove(models_file)
    if last_weight and os.path.exists(last_weight):
        shutil.copy(last_weight, models_file)
    else:
        plan.failed = True
        plan.fail_message = "训练模型文件异常（不存在）"
        plan.status = Plan.STATUS_FAILED
        plan.save()
        return

    plan.status = Plan.STATUS_COMPLETED
    plan.completed_at = now()
    plan.save()

    if label_type == "PolygonLabels":
        model_kind = "segment"
    else:
        model_kind = "detect"

    TrainingModels.objects.create(
        batch_no=plan.batch_last,
        plan=plan,
        name= plan.project_title,
        path=models_file,
        label_type=label_type,
        model_kind=model_kind
    )

    PlanRecords.objects.create(
        plan=plan,
        content="训练完成, 共" + str(epoch_end) + "轮",
        platform="本地"
    )

    logging.info("training model is at: " + models_file)








