"""
Model Deployment Utilities

Helper functions for deploying training models to ML Backend.
"""
import logging
import os
import shutil
from xml.etree import ElementTree as ET

logger = logging.getLogger(__name__)


def extract_model_labels(model_path):
    """
    Extract labels from model file using ultralytics.YOLO.
    
    Args:
        model_path: str, path to model file (e.g., 'plan29-detect-batch3.pt')
    
    Returns:
        dict: label mapping {0: 'ship', 1: 'boat', ...} or None if failed
    """
    try:
        from ultralytics import YOLO
        
        if not os.path.exists(model_path):
            logger.error(f"Model file not found: {model_path}")
            return None
        
        model = YOLO(model_path)
        
        if hasattr(model, 'names') and model.names:
            logger.info(f"Extracted model labels: {model.names}")
            return model.names
        else:
            logger.warning(f"Model {model_path} has no names attribute")
            return None
            
    except Exception as e:
        logger.error(f"Failed to extract model labels: {e}")
        return None


def validate_label_map(label_config_xml, model_labels):
    """
    Validate if model labels match label_config labels.
    
    Args:
        label_config_xml: str, label config XML
        model_labels: dict, model labels {0: 'ship', 1: 'boat', ...}
    
    Returns:
        dict: {
            'valid': bool,
            'missing_labels': list,  # model labels not in label_config
            'config_labels': list,  # labels in label_config
            'message': str
        }
    """
    try:
        root = ET.fromstring(label_config_xml)
        
        # Extract label names and predicted_values from label_config
        config_labels = []
        predicted_values_mapping = []
        
        for label_tag_name in ['RectangleLabels', 'PolygonLabels']:
            label_tag = root.find(f'.//{label_tag_name}')
            if label_tag is not None:
                for label in label_tag.findall('Label'):
                    # Get label value (display name)
                    label_value = label.get('value')
                    if label_value:
                        config_labels.append(label_value)
                    
                    # Get predicted_values (model label mapping)
                    predicted_values = label.get('predicted_values')
                    if predicted_values:
                        predicted_values_mapping.append(predicted_values)
                        logger.info(f"Found predicted_values mapping: '{predicted_values}' -> '{label_value}'")
                break
        
        if not config_labels:
            return {
                'valid': False,
                'missing_labels': [],
                'config_labels': [],
                'message': '项目标签配置中未找到任何标签'
            }
        
        # Combine config_labels and predicted_values to create valid label set
        # Model labels can match either value or predicted_values
        valid_label_set = set(config_labels + predicted_values_mapping)
        
        # Check if model labels match valid labels
        model_label_values = set(model_labels.values()) if model_labels else set()
        
        # Find model labels not in valid set
        missing_labels = model_label_values - valid_label_set
        
        if missing_labels:
            return {
                'valid': False,
                'missing_labels': list(missing_labels),
                'config_labels': config_labels,
                'predicted_values': predicted_values_mapping,
                'message': f'Model labels {missing_labels} not found in label_config {config_labels}'
            }
        else:
            return {
                'valid': True,
                'missing_labels': [],
                'config_labels': config_labels,
                'predicted_values': predicted_values_mapping,
                'message': '所有模型标签都能匹配项目标签配置'
            }
            
    except ET.ParseError as e:
        logger.error(f"Failed to parse label_config XML: {e}")
        return {
            'valid': False,
            'missing_labels': [],
            'config_labels': [],
            'message': f'Failed to parse label_config: {e}'
        }
    except Exception as e:
        logger.error(f"Failed to validate label map: {e}")
        return {
            'valid': False,
            'missing_labels': [],
            'config_labels': [],
            'message': f'Validation error: {e}'
        }


def inject_model_path(label_config_xml, model_filename, label_type, model_labels=None, score_threshold=0.5):
    """
    Inject model_path attribute into label_config XML.
    
    Args:
        label_config_xml: str, original label config XML
        model_filename: str, model filename to inject (e.g., 'plan16-detect-batch1.pt')
        label_type: str, label type ('RectangleLabels' or 'PolygonLabels')
        model_labels: dict, optional, model labels {0: 'ship', 1: 'boat', ...}
        score_threshold: float, model confidence threshold (default 0.5)
    
    Returns:
        tuple: (modified_xml, validation_result)
            - modified_xml: str, modified label config XML (only if valid)
            - validation_result: dict, result from validate_label_map()
    
    Note:
        If model_labels provided and validation fails, returns original XML unchanged.
        Only injects model_path when labels match or no model_labels provided.
    """
    try:
        root = ET.fromstring(label_config_xml)
        
        target_tag = None
        if label_type == "RectangleLabels":
            target_tag = root.find('.//RectangleLabels')
        elif label_type == "PolygonLabels":
            target_tag = root.find('.//PolygonLabels')
        else:
            logger.error(f"Unsupported label_type: {label_type}")
            return label_config_xml, {'valid': False, 'message': f'不支持此标签类型: {label_type}'}
        
        if target_tag is None:
            logger.error(f"Could not find {label_type} tag in label_config")
            
            # Detect actual label type in project config
            actual_label_type = None
            if root.find('.//RectangleLabels') is not None:
                actual_label_type = 'RectangleLabels'
            elif root.find('.//PolygonLabels') is not None:
                actual_label_type = 'PolygonLabels'
            
            return label_config_xml, {
                'valid': False, 
                'message': f'标签类型不匹配',
                'model_label_type': label_type,
                'project_label_type': actual_label_type or '未检测到'
            }
        
        # Validate label mapping if model_labels provided
        validation_result = None
        if model_labels:
            validation_result = validate_label_map(label_config_xml, model_labels)
            
            # If validation fails, don't modify XML - return original
            if not validation_result['valid']:
                logger.warning(f"Label validation failed: {validation_result['message']}")
                return label_config_xml, validation_result
        
        # Only inject model_path if validation passed or no model_labels
        target_tag.set('model_path', model_filename)
        target_tag.set('model_score_threshold', str(score_threshold))
        
        modified_xml = ET.tostring(root, encoding='unicode')
        
        if validation_result:
            return modified_xml, validation_result
        else:
            return modified_xml, {'valid': True, 'message': '未提供模型标签，已注入模型路径'}
        
    except ET.ParseError as e:
        logger.error(f"Failed to parse label_config XML: {e}")
        return label_config_xml, {'valid': False, 'message': f'解析标签配置失败'}
    except Exception as e:
        logger.error(f"Failed to inject model_path: {e}")
        return label_config_xml, {'valid': False, 'message': f'注入失败: {str(e)}'}


def copy_model_to_backend(source_path, target_filename, backend_model_dir):
    """
    Copy model file to ML Backend directory.
    
    Args:
        source_path: str, source model file path
        target_filename: str, target filename (e.g., 'plan16-detect-batch1.pt')
        backend_model_dir: str, ML Backend model directory
    
    Returns:
        str: target file path if successful, None if failed
    """
    try:
        if not os.path.exists(source_path):
            logger.error(f"Source model file not found: {source_path}")
            return None
        
        target_path = os.path.join(backend_model_dir, target_filename)
        shutil.copy(source_path, target_path)
        
        logger.info(f"Model copied: {source_path} -> {target_path}")
        return target_path
        
    except Exception as e:
        logger.error(f"Failed to copy model file: {e}")
        return None


def generate_model_filename(plan_id, model_kind, batch_no):
    """
    Generate unique model filename to avoid conflicts.
    
    Args:
        plan_id: int, plan ID
        model_kind: str, model kind ('detect' or 'segment')
        batch_no: int, batch number
    
    Returns:
        str: filename (e.g., 'plan16-detect-batch1.pt')
    """
    return f"plan{plan_id}-{model_kind}-batch{batch_no}.pt"


def remove_model_path(label_config_xml):
    """
    Remove model_path and model_score_threshold attributes from label_config XML.
    
    Args:
        label_config_xml: str, label config XML with model_path attributes
    
    Returns:
        str: cleaned label config XML without model_path attributes
    """
    try:
        root = ET.fromstring(label_config_xml)
        
        for tag_name in ['RectangleLabels', 'PolygonLabels']:
            tag = root.find(f'.//{tag_name}')
            if tag is not None:
                if 'model_path' in tag.attrib:
                    del tag.attrib['model_path']
                if 'model_score_threshold' in tag.attrib:
                    del tag.attrib['model_score_threshold']
        
        return ET.tostring(root, encoding='unicode')
        
    except Exception as e:
        logger.error(f"Failed to remove model_path: {e}")
        return label_config_xml