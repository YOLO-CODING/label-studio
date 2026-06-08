"""
Model Deployment Utilities

Helper functions for deploying training models to ML Backend.
"""
import logging
import os
import shutil
from xml.etree import ElementTree as ET

logger = logging.getLogger(__name__)


def inject_model_path(label_config_xml, model_filename, label_type):
    """
    Inject model_path attribute into label_config XML.
    
    Args:
        label_config_xml: str, original label config XML
        model_filename: str, model filename to inject (e.g., 'plan16-detect-batch1.pt')
        label_type: str, label type ('RectangleLabels' or 'PolygonLabels')
    
    Returns:
        str: modified label config XML with model_path attribute
    
    Example:
        Before:
            <RectangleLabels name="label" toName="image">
        
        After:
            <RectangleLabels name="label" toName="image" 
                             model_path="plan16-detect-batch1.pt" 
                             model_score_threshold="0.5">
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
            return label_config_xml
        
        if target_tag is None:
            logger.error(f"Could not find {label_type} tag in label_config")
            return label_config_xml
        
        target_tag.set('model_path', model_filename)
        target_tag.set('model_score_threshold', '0.5')
        
        modified_xml = ET.tostring(root, encoding='unicode')
        return modified_xml
        
    except ET.ParseError as e:
        logger.error(f"Failed to parse label_config XML: {e}")
        return label_config_xml
    except Exception as e:
        logger.error(f"Failed to inject model_path: {e}")
        return label_config_xml


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