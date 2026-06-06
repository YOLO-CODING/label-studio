import json
import logging
import os
import platform
import sys
import shutil
import pandas as pd

from django.conf import settings
from django.db import transaction
from django.utils.timezone import now
from ultralytics import YOLO
from ultralytics.utils.files import WorkingDirectory
from ultralytics.utils import LOGGER as YOLO_LOGGER

from plans.models import (
    TrainingEpochs
)

# os.environ['GITHUB_ACTIONS'] = 'noninteractive'

# 重定向标准输出到文件
class CustomLogger(object):
    def __init__(self, filename="train.log", mode="a"):
        self.terminal = sys.stdout
        self.stderr = sys.stderr
        self.log = open(filename, mode or "a", encoding="utf-8")

    def write(self, message):
        self.terminal.write(message)
        self.log.write(message)

    def flush(self):
        self.terminal.flush()
        self.log.flush()

class PrefixFormatter(logging.Formatter):
    def format(self, record):
        """Format log records with prefixes based on level."""
        # Apply prefixes based on log level
        if record.levelno == logging.WARNING:
            prefix = "WARNING"
            record.msg = f"{prefix} {record.msg}"
        elif record.levelno == logging.ERROR:
            prefix = "ERROR"
            record.msg = f"{prefix} {record.msg}"

        # Handle emojis in message based on platform
        formatted_message = super().format(record)
        return emojis(formatted_message)

def emojis(string=""):
    """Return platform-dependent emoji-safe version of string."""
    return string.encode().decode("ascii", "ignore")

class YoloTrainingManager(object):
    def __init__(self, label_type, working_dir, dataset_entry, last_weight, imgsz, plan):
        self.label_type = label_type or "RectangleLabels"
        model_scale = self.training_config.get('model', 'n')
        if label_type == "PolygonLabels":
            self.initial_model = f"yolo26{model_scale}-seg.yaml"
            self.model_kind = "segment"
        else:
            self.initial_model = f"yolo26{model_scale}.yaml"
            self.model_kind = "detect"
        self.working_dir = working_dir
        self.dataset_entry = dataset_entry
        self.last_weight = last_weight
        self.imgsz = imgsz or 640
        self.plan = plan
        if plan:
            self.batch_no = plan.batch_last
        else:
            self.batch_no = 1

        self.training_config = self._parse_training_config(plan)

        self.training_device = self.training_config.get('device', settings.YOLO_TRAIN_DEVICE)
        self.training_batch = self.training_config.get('batch_size', settings.YOLO_TRAIN_BATCH)
        self.training_optimizer = self.training_config.get('optimizer', settings.YOLO_TRAIN_OPTIMIZER)
        self.training_lr = self.training_config.get('lr', 0.01)
        self.training_patience = self.training_config.get('patience', 50)
        self.training_weight_decay = self.training_config.get('weight_decay', 0.0005)

        self.project_train = "output_train"
        self.project_val = "output_val"
        self.failed = False
        self.fail_message = None
        self.best_weight = None
        self.train_log_file = os.path.join(working_dir, "training.log")
        self.log_file_handler = logging.FileHandler(self.train_log_file)
        self.log_file_handler.setLevel(logging.DEBUG)
        self.log_file_handler.setFormatter(PrefixFormatter("%(message)s"))

    def _parse_training_config(self, plan):
        try:
            return json.loads(plan.training_config or '{}')
        except Exception:
            return {}

    def is_failed(self):
        return self.failed

    def get_fail_message(self):
        return self.fail_message

    def get_best_weight(self):
        return self.best_weight

    def do_training_first(self, epoch_count):
        try:
            self.train_logger = CustomLogger(self.train_log_file, "a")
            sys.stdout = self.train_logger
            sys.stderr = self.train_logger
            self.train_logger.write("---------------------------------------------\n")
            self.train_logger.write("Training started at: " + self.working_dir + ", with epoch : 1-" + str(epoch_count) + "\n")
            self.train_logger.write("Time: " + str(now()) + "\n")
            self.train_logger.write("---------------------------------------------\n")
            self.train_logger.write("\n")
            self.train_logger.flush()
            YOLO_LOGGER.addHandler(self.log_file_handler)

            model = YOLO(self.initial_model)

            # prepare epoch training
            epoch_name = "epoch-1"
            epoch_dir = os.path.join(self.working_dir, "runs", model.task, self.project_train, epoch_name)
            if os.path.exists(epoch_dir):
                self.clean_files(epoch_dir)
                shutil.rmtree(epoch_dir)

            with WorkingDirectory(self.working_dir):
                model.train(data=self.dataset_entry,
                            epochs=epoch_count,
                            imgsz=self.imgsz,
                            device=self.training_device,
                            batch=self.training_batch,
                            optimizer=self.training_optimizer,
                            lr0=self.training_lr,
                            patience=self.training_patience,
                            weight_decay=self.training_weight_decay,
                            project=self.project_train,
                            name=epoch_name,
                            exist_ok=True)

            if model.trainer is not None:
                weight_file = model.trainer.best
            else:
                weight_file = os.path.join(epoch_dir, "weights", "best.pt")
            if not os.path.exists(weight_file):
                self.failed = True
                self.fail_message = "No best weights found at {}".format(weight_file)
                return

            self.best_weight = weight_file

            result_csv = os.path.join(epoch_dir, "results.csv")
            if os.path.exists(result_csv):
                if self.model_kind == "segment":
                    self.collect_segment_epochs(result_csv, 0)
                else:
                    self.collect_detect_epochs(result_csv, 0)
        except Exception as ex:
            logging.error("Error to run do_training_epoch: " + str(ex))
            self.failed = True
            self.fail_message = str(ex)
        finally:
            if self.train_logger:
                sys.stdout.log.close()
                sys.stdout = self.train_logger.terminal
                sys.stderr = self.train_logger.stderr
                self.train_logger = None
            YOLO_LOGGER.removeHandler(self.log_file_handler)

    def do_training_epoch(self, epoch_start:int, epoch_count):
        try:
            self.train_logger = CustomLogger(self.train_log_file, mode="a")
            sys.stdout = self.train_logger
            sys.stderr = self.train_logger

            self.train_logger.write("---------------------------------------------\n")
            self.train_logger.write("Training continued at: " + self.working_dir + ", with epoch : " + str(epoch_start+1) + "-" + str(epoch_start + epoch_count) + "\n")
            self.train_logger.write("Time: " + str(now()) + "\n")
            self.train_logger.write("-----------------------------------------------\n")
            self.train_logger.write("\n")
            self.train_logger.flush()

            YOLO_LOGGER.addHandler(self.log_file_handler)

            model = YOLO(self.last_weight)

            epoch_name = "epoch-{}".format(epoch_start + 1)
            epoch_dir = os.path.join(self.working_dir, "runs", model.task, self.project_train, epoch_name)
            if os.path.exists(epoch_dir):
                self.clean_files(epoch_dir)
                shutil.rmtree(epoch_dir)

            if self.last_weight is None:
                self.failed = True
                self.fail_message = "YOLO training failed, no last weight"
                return

            with WorkingDirectory(self.working_dir):

                model.train(data=self.dataset_entry,
                            epochs=epoch_count,
                            imgsz=self.imgsz,
                            device=self.training_device,
                            batch=self.training_batch,
                            optimizer=self.training_optimizer,
                            lr0=self.training_lr,
                            patience=self.training_patience,
                            weight_decay=self.training_weight_decay,
                            project=self.project_train,
                            name=epoch_name,
                            exist_ok=True)

            if model.trainer is not None:
                weight_file = model.trainer.best
            else:
                weight_file = os.path.join(epoch_dir, "weights", "best.pt")
            if not os.path.exists(weight_file):
                self.failed = True
                self.fail_message = "No best weights found at {}".format(weight_file)
                return

            self.best_weight = weight_file

            result_csv = os.path.join(epoch_dir, "results.csv")
            if os.path.exists(result_csv):
                if self.model_kind == "segment":
                    self.collect_segment_epochs(result_csv, epoch_start)
                else:
                    self.collect_detect_epochs(result_csv, epoch_start)
        except Exception as ex:
            logging.error("Error to run do_training_epoch: " + str(ex))
            self.failed = True
            self.fail_message = str(ex)

        finally:
            if self.train_logger:
                sys.stdout.log.close()
                sys.stdout = self.train_logger.terminal
                sys.stderr = self.train_logger.stderr
                self.train_logger = None
            YOLO_LOGGER.removeHandler(self.log_file_handler)

    def collect_segment_epochs(self, result_csv, epoch_start):
        created_count = 0
        last_box_loss = 0
        last_box_precision = 0
        last_box_recall = 0
        last_seg_loss = 0
        last_m_precision = 0
        last_m_recall = 0
        try:
            # 尝试直接读取整个文件
            df = pd.read_csv(result_csv)
            logging.debug(f"成功读取CSV文件，共{len(df)}行数据")
            # 使用事务确保数据一致性
            with transaction.atomic():
                # 批量创建对象
                training_epochs_list = []

                last_time = 0
                for index, row in df.iterrows():
                    try:

                        # 创建TrainingEpochs对象实例（不立即保存）
                        training_epoch = TrainingEpochs(
                            batch_no=self.batch_no,
                            epoch=int(row['epoch']) + epoch_start,
                            time=float(row['time']) - last_time,
                            box_loss=float(row['train/box_loss']),
                            seg_loss=float(row['train/seg_loss']),
                            cls_loss=float(row['train/cls_loss']),
                            dfl_loss=float(row['train/dfl_loss']),
                            box_precision=float(row['metrics/precision(B)']),
                            box_recall=float(row['metrics/recall(B)']),
                            box_map50=float(row['metrics/mAP50(B)']),
                            box_map95=float(row['metrics/mAP50-95(B)']),
                            m_precision=float(row['metrics/precision(M)']),
                            m_recall=float(row['metrics/recall(M)']),
                            m_map50=float(row['metrics/mAP50(M)']),
                            m_map95=float(row['metrics/mAP50-95(M)']),
                            v_box_loss=float(row['val/box_loss']),
                            v_seg_loss=float(row['val/seg_loss']),
                            v_cls_loss=float(row['val/cls_loss']),
                            v_dfl_loss=float(row['val/dfl_loss']),
                            lr_pg0=float(row['lr/pg0']),
                            lr_pg1=float(row['lr/pg1']),
                            lr_pg2=float(row['lr/pg2']),
                            plan=self.plan
                        )
                        last_box_loss = training_epoch.box_loss
                        last_box_precision = training_epoch.box_precision
                        last_box_recall = training_epoch.box_recall
                        last_seg_loss = training_epoch.seg_loss
                        last_m_precision = training_epoch.m_precision
                        last_m_recall = training_epoch.m_recall
                        training_epochs_list.append(training_epoch)
                        last_time = float(row['time'])
                        created_count += 1

                        # 批量保存，每100条保存一次
                        if len(training_epochs_list) >= 100:
                            TrainingEpochs.objects.bulk_create(training_epochs_list)
                            training_epochs_list = []
                            logging.debug(f"已批量保存 {created_count} 条记录...")

                    except (ValueError, KeyError) as e:
                        logging.error(f"错误: 解析第{index + 1}行时出错: {e}")
                        continue

                # 保存剩余的数据
                if training_epochs_list:
                    TrainingEpochs.objects.bulk_create(training_epochs_list)

            # update result to plan
            plan_update = self.plan
            if plan_update:
                plan_update.box_loss = last_box_loss
                plan_update.box_precision = last_box_precision
                plan_update.box_recall = last_box_recall
                plan_update.seg_loss = last_seg_loss
                plan_update.m_precision = last_m_precision
                plan_update.m_recall = last_m_recall
                plan_update.save()

            logging.info(f"成功收集{created_count}个训练周期数据")
        except FileNotFoundError:
            logging.error(f"CSV文件不存在: {result_csv}")
        except pd.errors.EmptyDataError:
            logging.error(f"CSV文件为空: {result_csv}")
        except Exception as e:
            logging.error(f"收集训练周期数据时出错: {e}")

    def collect_detect_epochs(self, result_csv, epoch_start):
        created_count = 0
        last_box_loss = 0
        last_box_precision = 0
        last_box_recall = 0
        last_seg_loss = 0
        last_m_precision = 0
        last_m_recall = 0
        try:
            # 尝试直接读取整个文件
            df = pd.read_csv(result_csv)
            logging.debug(f"成功读取CSV文件，共{len(df)}行数据")
            # 使用事务确保数据一致性
            with transaction.atomic():
                # 批量创建对象
                training_epochs_list = []

                last_time = 0
                for index, row in df.iterrows():
                    try:

                        # 创建TrainingEpochs对象实例（不立即保存）
                        training_epoch = TrainingEpochs(
                            batch_no=self.batch_no,
                            epoch=int(row['epoch']) + epoch_start,
                            time=float(row['time']) - last_time,
                            box_loss=float(row['train/box_loss']),
                            seg_loss=0,
                            cls_loss=float(row['train/cls_loss']),
                            dfl_loss=float(row['train/dfl_loss']),
                            box_precision=float(row['metrics/precision(B)']),
                            box_recall=float(row['metrics/recall(B)']),
                            box_map50=float(row['metrics/mAP50(B)']),
                            box_map95=float(row['metrics/mAP50-95(B)']),
                            m_precision=0,
                            m_recall=0,
                            m_map50=0,
                            m_map95=0,
                            v_box_loss=float(row['val/box_loss']),
                            v_seg_loss=float(row['val/seg_loss']),
                            v_cls_loss=float(row['val/cls_loss']),
                            v_dfl_loss=float(row['val/dfl_loss']),
                            lr_pg0=float(row['lr/pg0']),
                            lr_pg1=float(row['lr/pg1']),
                            lr_pg2=float(row['lr/pg2']),
                            plan=self.plan
                        )
                        last_box_loss = training_epoch.box_loss
                        last_box_precision = training_epoch.box_precision
                        last_box_recall = training_epoch.box_recall
                        last_seg_loss = training_epoch.seg_loss
                        last_m_precision = training_epoch.m_precision
                        last_m_recall = training_epoch.m_recall
                        training_epochs_list.append(training_epoch)
                        last_time = float(row['time'])
                        created_count += 1

                        # 批量保存，每100条保存一次
                        if len(training_epochs_list) >= 100:
                            TrainingEpochs.objects.bulk_create(training_epochs_list)
                            training_epochs_list = []
                            logging.debug(f"已批量保存 {created_count} 条记录...")

                    except (ValueError, KeyError) as e:
                        logging.error(f"错误: 解析第{index + 1}行时出错: {e}")
                        continue

                # 保存剩余的数据
                if training_epochs_list:
                    TrainingEpochs.objects.bulk_create(training_epochs_list)

            # update result to plan
            plan_update = self.plan
            if plan_update:
                plan_update.box_loss = last_box_loss
                plan_update.box_precision = last_box_precision
                plan_update.box_recall = last_box_recall
                plan_update.seg_loss = last_seg_loss
                plan_update.m_precision = last_m_precision
                plan_update.m_recall = last_m_recall
                plan_update.save()

            logging.info(f"成功收集{created_count}个训练周期数据")
        except FileNotFoundError:
            logging.error(f"CSV文件不存在: {result_csv}")
        except pd.errors.EmptyDataError:
            logging.error(f"CSV文件为空: {result_csv}")
        except Exception as e:
            logging.error(f"收集训练周期数据时出错: {e}")

    @staticmethod
    def clean_files(dir_path):
        if dir_path is None or dir_path == "":
            return
        if not os.path.exists(dir_path):
            return
        for file in os.listdir(dir_path):
            file_path = os.path.join(dir_path, file)
            if os.path.isfile(file_path):  # 检查是否为文件
                os.remove(file_path)  # 删除文件
            elif os.path.isdir(file_path):
                shutil.rmtree(file_path)