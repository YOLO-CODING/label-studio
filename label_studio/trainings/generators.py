import json
import logging
import math
import os
import random
import shutil
import sys
from typing import List, Tuple, Dict

from django.conf import settings

from projects.models import Project
from rq.utils import now
from tasks.models import Task
from .managers import CustomLogger, PrefixFormatter

logger = logging.getLogger(__name__)

class YoloDatasetGenerator:
    def __init__(self, plan):
        self.plan_id = plan.id
        self.plan = plan
        self.project_id = plan.project_id
        self.project = None
        self.file_tasks = []
        self.working_dir = None
        self.dataset_dir = None
        self.failed = False
        self.fail_message = None
        self.images_dir = None
        self.labels_dir = None
        self.images_dir_map = {
            "train": None,
            "val": None,
            "test": None,
        }
        self.labels_dir_map = {
            "train": None,
            "val": None,
            "test": None,
        }
        self.dataset_entry_file = None
        self.label_type = None
        self.train_log_file = None
        self.log_file_handler = None

    def is_failed(self):
        return self.failed

    def get_fail_message(self):
        return self.fail_message

    def get_working_dir(self):
        return self.working_dir

    def get_dataset_entry(self):
        return self.dataset_entry_file

    def get_label_type(self):
        return self.label_type

    def _get_class_id(self, label_name: str) -> int:
        """
        获取类别ID，如果不存在则创建

        Args:
            label_name: 类别名称

        Returns:
            类别ID
        """
        labels_mapping = {}
        label_config = self.project.parsed_label_config['label']
        if label_config and label_config['labels']:
            for label_index, label in enumerate(label_config['labels']):
                labels_mapping[label] = label_index
        if label_name in labels_mapping:
            return labels_mapping[label_name]
        return 0

    def run(self):
        #build working folders

        self.build_working_directories()

        self.train_log_file = os.path.join(self.working_dir, "training.log")
        self.log_file_handler = logging.FileHandler(self.train_log_file, mode="w")
        self.log_file_handler.setLevel(logging.DEBUG)
        self.log_file_handler.setFormatter(PrefixFormatter("%(message)s"))
        logger.addHandler(self.log_file_handler)

        logger.info("-----------------------------------")
        logger.info("Generating training datasets")
        logger.info("Time: " + str(now()))
        logger.info("----------------------------------")

        self.project = Project.objects.get(pk=self.project_id)
        if self.project is None:
            self.failed = True
            self.fail_message = "项目不存在了: " + str(self.project_id)
            return

        if self.project.parsed_label_config is None or not self.project.parsed_label_config['label']:
            self.failed = True
            self.fail_message = "项目的标注设置不可用"
            return

        label_config = self.project.parsed_label_config['label']
        self.label_type = label_config['type']

        tasks = Task.objects.filter(project=self.project, is_labeled=True)
        if len(tasks) == 0:
            self.failed = True
            self.fail_message = "没有可用的标注任务: " + str(self.project_id)

        split_info = self.split_tasks(tasks)
        for split_name, split_data in split_info.items():
            logger.info("processing " + split_name + ": " + str(len(split_data)))
            for i, task in enumerate(split_data):
                logger.info("processing " + task.file_upload.filepath + ": " + str(i))

                if len(task.completed_annotations) > 0:
                    check_annotation = task.completed_annotations[0]
                    if not check_annotation.result or len(check_annotation.result) == 0:
                        logger.info("Non labeled data in the file: " + task.file_upload.filepath + ", discarded!")
                        continue

                file = task.file_upload.file
                if not file.storage.exists(file.name):
                    self.failed = True
                    self.fail_message = "任务文件不存在，task.id=" + str(task.id);
                    return
                try:
                    target_image_path = os.path.join(self.images_dir_map[split_name], task.file_upload_name)
                    buffer_size = 8192
                    with open(target_image_path, 'wb') as target:
                        with file.open(mode='rb') as source:
                            while True:
                                buffer = source.read(buffer_size)
                                if not buffer:  # 读取完毕
                                    break
                                target.write(buffer)
                        target.flush()

                    # annotation
                    label_file_name = task.file_upload_name.replace(".png", ".txt").replace(".jpg", ".txt").replace(".jpeg", ".txt")
                    target_label_path = os.path.join(self.labels_dir_map[split_name], label_file_name)
                    if len(task.completed_annotations) > 0:
                        self.generate_label_file(target_label_path, task.completed_annotations[0])
                    else:
                        raise ValueError("标注数据异常-completed_annotations[0]")
                except Exception as e:
                    self.failed = True
                    self.fail_message = "解析Task文件异常：" + str(e)
                    logger.error("failed to write " + file.name + ": " + str(e))
                    return
        
        # Ensure val and test directories have data by copying from train if empty
        self._ensure_val_test_data()
        try:
            # classes.txt
            classes_txt_path = os.path.join(self.dataset_dir, "classes.txt")
            self.generate_classes_file(classes_txt_path)
            # notes.json
            notes_json_path = os.path.join(self.dataset_dir, "notes.json")
            self.generate_notes_file(notes_json_path)
            #coco8.yaml
            coco8_yaml_path = os.path.join(self.working_dir, "coco8.yaml")
            self.generate_coco8_file(self.dataset_dir, coco8_yaml_path)
            # dataset entry file
            self.dataset_entry_file = coco8_yaml_path
        except Exception as e:
            self.failed = True
            self.fail_message = "生成数据集文件异常：" + str(e)
            logger.error("failed to generate dataset setup files: " + str(e))
            return

        finally:
            if self.log_file_handler:
                logger.removeHandler(self.log_file_handler)

    def _ensure_val_test_data(self):
        """
        确保 train、val 和 test 目录都有数据。
        如果某个目录为空，则从其他有数据的目录复制。
        """
        train_images = os.listdir(self.images_dir_map["train"])
        train_labels = os.listdir(self.labels_dir_map["train"])
        val_images = os.listdir(self.images_dir_map["val"])
        val_labels = os.listdir(self.labels_dir_map["val"])
        test_images = os.listdir(self.images_dir_map["test"])
        test_labels = os.listdir(self.labels_dir_map["test"])
        
        # Determine which set has the source data
        source = None
        source_images_dir = None
        source_labels_dir = None
        source_images = []
        source_labels = []
        
        if train_images:
            source = "train"
            source_images_dir = self.images_dir_map["train"]
            source_labels_dir = self.labels_dir_map["train"]
            source_images = train_images
            source_labels = train_labels
        elif val_images:
            source = "val"
            source_images_dir = self.images_dir_map["val"]
            source_labels_dir = self.labels_dir_map["val"]
            source_images = val_images
            source_labels = val_labels
        elif test_images:
            source = "test"
            source_images_dir = self.images_dir_map["test"]
            source_labels_dir = self.labels_dir_map["test"]
            source_images = test_images
            source_labels = test_labels
        
        if source is None:
            self.failed = True
            self.fail_message = "所有数据集均为空，无法生成训练数据"
            return
        
        logger.info(f"数据源: {source}, 共 {len(source_images)} 个文件")
        
        # Fill train from source if empty
        if not train_images and source != "train":
            logger.info("训练集为空，从 {} 复制数据...".format(source))
            self._copy_files(source_images_dir, self.images_dir_map["train"], source_images)
            self._copy_files(source_labels_dir, self.labels_dir_map["train"], source_labels)
            train_images = source_images[:]
            train_labels = source_labels[:]
        
        # Fill val from train if empty
        if not val_images:
            logger.info("验证集为空，从训练集复制数据...")
            self._copy_files(self.images_dir_map["train"], self.images_dir_map["val"], train_images)
            self._copy_files(self.labels_dir_map["train"], self.labels_dir_map["val"], train_labels)
        
        # Fill test from train if empty
        if not test_images:
            logger.info("测试集为空，从训练集复制数据...")
            self._copy_files(self.images_dir_map["train"], self.images_dir_map["test"], train_images)
            self._copy_files(self.labels_dir_map["train"], self.labels_dir_map["test"], train_labels)
    
    @staticmethod
    def _copy_files(src_dir, dst_dir, files):
        for f in files:
            shutil.copy2(os.path.join(src_dir, f), os.path.join(dst_dir, f))

    def generate_classes_file(self, file_path):
        with open(file_path, 'w') as f:
            for label in self.project.parsed_label_config['label']['labels']:
                f.write(label + "\n")

    def generate_notes_file(self, file_path):
        labels_data = []
        label_config = self.project.parsed_label_config['label']
        if label_config and label_config['labels']:
            for label_index, label in enumerate(label_config['labels']):
                labels_data.append({
                    "id": label_index,
                    "name": label,
                })

        data = {
            "categories": labels_data,
            "info": {
                "year": 2026,
                "version": "1.0",
                "contributor": "tangxibodong",
            }
        }

        with open(file_path, 'w') as f:
            json.dump(data, f, indent=4)
    def generate_coco8_file(self, dataset_dir, file_path):

        lines = [
            "path: " + str(dataset_dir) +"     # 数据集路径 \n",
            "train: images/train  \n",
            "val: images/val  \n",
            "test: images/test  \n",
            "\n"
            "# Classes \n"
            "names: \n"
        ]
        label_config = self.project.parsed_label_config['label']
        if label_config and label_config['labels']:
            for label_index, label in enumerate(label_config['labels']):
                lines.append("  " + str(label_index) + ": " + label + "\n")

        with open(file_path, 'w') as f:
            f.write("".join(lines))

    ##########################################
    ####### for writing labels file
    ##########################################
    def normalize_coordinate(self, x: float, y: float,
                             original_width: int,
                             original_height: int) -> Tuple[float, float]:
        """
        将坐标归一化为YOLO格式 (0-1)

        Args:
            x, y: 坐标（像素）
            original_width: 原始图片宽度
            original_height: 原始图片高度

        Returns:
            归一化后的坐标 (x_norm, y_norm)
        """
        # 入参为像素坐标
        x_pixel = x
        y_pixel = y

        # 归一化到0-1
        x_norm = x_pixel / original_width
        y_norm = y_pixel / original_height

        # 确保坐标在有效范围内
        x_norm = max(0.0, min(1.0, x_norm))
        y_norm = max(0.0, min(1.0, y_norm))

        return x_norm, y_norm

    def convert_rotated_rectangle_to_polygon(self, rect_data: Dict,
                                             original_width: int,
                                             original_height: int) -> List[List[float]]:
        """
        将旋转矩形转换为多边形顶点

        Args:
            rect_data: 矩形标注数据
            original_width: 原始宽度
            original_height: 原始高度

        Returns:
            多边形顶点列表 [[x1, y1], [x2, y2], ...]
        """
        # 提取矩形参数
        x = rect_data.get('x', 0) / 100 * original_width # 左上角x坐标（百分比）
        y = rect_data.get('y', 0) / 100 * original_height # 左上角y坐标（百分比）
        w = rect_data.get('width', 0) / 100 * original_width  # 宽度（百分比）
        h = rect_data.get('height', 0)  / 100 * original_height # 高度（百分比）
        r = rect_data.get('rotation', 0)  # 旋转角度（度）

        rotation = math.radians(r)
        cos, sin = math.cos(rotation), math.sin(rotation)
        coords = [
            [x, y],
            [x + w * cos, y + w * sin],
            [x + w * cos - h * sin, y + w * sin + h * cos],
            [x - h * sin, y + h * cos],
        ]

        return coords

    def convert_rectangle_to_polygon(self, rect_data: Dict,
                                     original_width: int,
                                     original_height: int) -> List[List[float]]:
        """
        将非旋转矩形转换为多边形顶点

        Args:
            rect_data: 矩形标注数据
            original_width: 原始宽度
            original_height: 原始高度

        Returns:
            多边形顶点列表 [[x1, y1], [x2, y2], ...]
        """
        # 提取矩形参数
        x = rect_data.get('x', 0)   # 左上角x坐标（百分比）
        y = rect_data.get('y', 0)   # 左上角y坐标（百分比）
        width = rect_data.get('width', 0)    # 宽度（百分比）
        height = rect_data.get('height', 0)  # 高度（百分比）

        # 左上和右下点
        x1 = x / 100 * original_width
        y1 = y / 100 * original_height
        x2 = (x + width) / 100 * original_width
        y2 = (y + height) / 100 * original_height

        # 创建多边形顶点（顺时针方向）
        polygon_vertices = [
            [x1, y1],  # 左上
            [x2, y1],  # 右上
            [x2, y2],  # 右下
            [x1, y2]  # 左下
        ]

        return polygon_vertices

    def convert_polygon_to_yolo(self, polygon_data: Dict,
                                original_width: int,
                                original_height: int) -> List[List[float]]:
        """
        将多边形标注转换为YOLO多边形格式

        Args:
            polygon_data: 多边形标注数据
            original_width: 原始宽度
            original_height: 原始高度

        Returns:
            YOLO多边形列表 [[class_id, x1, y1, x2, y2, ...], ...]
        """
        polygon_points = polygon_data.get('points', [])
        labels = polygon_data.get('polygonlabels', [])

        if not polygon_points or not labels:
            return []

        # 获取类别ID
        label_name = labels[0]
        class_id = self._get_class_id(label_name)

        # 归一化多边形坐标
        yolo_polygon = [class_id]
        for point in polygon_points:
            # LabelStudio多边形点已经是百分比坐标
            x_percent, y_percent = point
            x_pixel = x_percent / 100 * original_width
            y_pixel = y_percent / 100 * original_height
            x_norm, y_norm = self.normalize_coordinate(
                x_pixel, y_pixel, original_width, original_height
            )
            yolo_polygon.extend([x_norm, y_norm])

        return [yolo_polygon]

    def convert_rectangle_to_yolo(self, rect_data: Dict,
                                  original_width: int,
                                  original_height: int) -> List[List[float]]:
        """
        将矩形标注转换为YOLO多边形格式

        Args:
            rect_data: 矩形标注数据
            original_width: 原始宽度
            original_height: 原始高度

        Returns:
            YOLO多边形列表 [[class_id, x1, y1, x2, y2, x3, y3, x4, y4], ...]
        """
        labels = rect_data.get('rectanglelabels', [])

        if not labels:
            return []

        # 获取类别ID
        label_name = labels[0]
        class_id = self._get_class_id(label_name)

        # 检查是否有旋转
        rotation = rect_data.get('rotation', 0)

        if rotation != 0:
            # 处理旋转矩形
            polygon_vertices = self.convert_rotated_rectangle_to_polygon(
                rect_data, original_width, original_height
            )
        else:
            # 处理非旋转矩形
            polygon_vertices = self.convert_rectangle_to_polygon(
                rect_data, original_width, original_height
            )

        # 归一化顶点坐标
        yolo_polygon: list[float] = [class_id]
        for vertex in polygon_vertices:
            x_norm, y_norm = self.normalize_coordinate(vertex[0], vertex[1], original_width, original_height)
            yolo_polygon.extend([x_norm, y_norm])

        return [yolo_polygon]

    def generate_label_file(self, label_txt_path, annotation_data):
        results = annotation_data.result or []
        if len(results) == 0:
            raise ValueError("标注数据异常-results[0]")

        yolo_annotations = []
        stats = {
            "polygons": 0,
            "rectangles": 0,
            "rotated_rectangles": 0
        }

        # 获取原始图片尺寸
        original_width = results[0].get('original_width', 1) if results else 1
        original_height = results[0].get('original_height', 1) if results else 1
        for result in results:
            result_type = result.get('type')
            value = result.get('value', {})

            if result_type == 'polygonlabels':
                # 多边形标注
                yolo_polygons = self.convert_polygon_to_yolo(
                    value, original_width, original_height
                )
                yolo_annotations.extend(yolo_polygons)
                if yolo_polygons:
                    stats["polygons"] += 1

            elif result_type == 'rectanglelabels':
                # 矩形标注
                yolo_polygons = self.convert_rectangle_to_yolo(
                    value, original_width, original_height
                )
                yolo_annotations.extend(yolo_polygons)
                if yolo_polygons:
                    stats["rectangles"] += 1
                    if value.get('rotation', 0) != 0:
                        stats["rotated_rectangles"] += 1

            else:
                logger.warn(f"警告: 跳过未知标注类型: {result_type}")
                continue

        with open(label_txt_path, 'w') as f:
            for annotation in yolo_annotations:
                line = ' '.join(f"{coord}" if isinstance(coord, float) else str(coord)
                                for coord in annotation)
                f.write(line + '\n')


    def split_tasks(self, tasks: List[Task], train_ratio=0.8, val_ratio=0.1, test_ratio=0.1):
        total_count = len(tasks)
        sort_index = list(range(0, total_count))
        random.shuffle(sort_index)

        train_count = int(total_count * train_ratio)
        if train_count < 1:
            train_count = 1
        test_count = int(total_count * test_ratio)
        if test_count < 1:
            test_count = 1
        val_count = total_count - train_count - test_count
        if val_count < 1:
            val_count = 1
        train_start_pos = 0
        train_end_pos = train_count

        val_start_pos = train_end_pos
        if val_start_pos + val_count <= total_count:
            val_end_pos = val_start_pos + val_count
        else:
            val_start_pos = total_count - val_count
            val_end_pos = total_count

        test_start_pos = val_end_pos
        if test_start_pos + test_count <= total_count:
            test_end_pos = test_start_pos + test_count
        else:
            test_start_pos = total_count - test_count
            test_end_pos = total_count

        train_pos_array = sort_index[train_start_pos:train_end_pos]
        val_pos_array = sort_index[val_start_pos:val_end_pos]
        test_pos_array = sort_index[test_start_pos:test_end_pos]

        return {
            "train": self.fetch_task_by_shuffle(tasks, train_pos_array),
            "val": self.fetch_task_by_shuffle(tasks, val_pos_array),
            "test": self.fetch_task_by_shuffle(tasks, test_pos_array),
        }

    @staticmethod
    def fetch_task_by_shuffle(tasks: List[Task], pos_array):
        result = []
        for pos in pos_array:
            result.append(tasks[pos])

        return result

    def build_working_directories(self):
        training_root = settings.TRAINING_DIR
        if training_root is None or training_root == "":
            # for local dev
            training_root = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "myData", "training")
        self.working_dir = os.path.join(training_root, str(self.plan.id))
        os.makedirs(self.working_dir, exist_ok=True)

        self.dataset_dir = os.path.join(self.working_dir, 'datasets')
        os.makedirs(self.dataset_dir, exist_ok=True)

        self.images_dir = os.path.join(self.dataset_dir, "images")
        train_images_dir = os.path.join(self.images_dir, "train")
        val_images_dir = os.path.join(self.images_dir, "val")
        test_images_dir = os.path.join(self.images_dir, "test")
        os.makedirs(self.images_dir, exist_ok=True)
        os.makedirs(train_images_dir, exist_ok=True)
        os.makedirs(val_images_dir, exist_ok=True)
        os.makedirs(test_images_dir, exist_ok=True)
        self.clean_files(train_images_dir)
        self.clean_files(val_images_dir)
        self.clean_files(test_images_dir)


        self.labels_dir = os.path.join(self.dataset_dir, "labels")
        train_labels_dir = os.path.join(self.labels_dir, "train")
        val_labels_dir = os.path.join(self.labels_dir, "val")
        test_labels_dir = os.path.join(self.labels_dir, "test")
        os.makedirs(self.labels_dir, exist_ok=True)
        os.makedirs(train_labels_dir, exist_ok=True)
        os.makedirs(val_labels_dir, exist_ok=True)
        os.makedirs(test_labels_dir, exist_ok=True)
        self.clean_files(train_labels_dir)
        self.clean_files(val_labels_dir)
        self.clean_files(test_labels_dir)

        self.images_dir_map = {
            "train": train_images_dir,
            "val": val_images_dir,
            "test": test_images_dir,
        }
        self.labels_dir_map = {
            "train": train_labels_dir,
            "val": val_labels_dir,
            "test": test_labels_dir,
        }

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

class TestPlan:
    def __init__(self, plan_id, plan_name):
        self.id = plan_id
        self.name = plan_name
        self.project_id = 1

if __name__ == '__main__':
    plan = TestPlan(1, "test")
    plan.project_id = 1
    generator = YoloDatasetGenerator(plan)
    generator.run()