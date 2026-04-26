import os
import pandas as pd
from typing import List, Dict
from datetime import datetime


def load_annotations(root_path: str) -> Dict[str, float]:
    """从annotations.csv加载标注数据"""
    csv_path = os.path.join(root_path, 'annotations.csv')
    if not os.path.exists(csv_path):
        return {}
    
    try:
        df = pd.read_csv(csv_path)
        # 转换为字典 {image_path: score}
        annotations = {}
        for _, row in df.iterrows():
            annotations[row['image_path']] = float(row['score'])
        return annotations
    except Exception:
        return {}


def save_annotations(root_path: str, annotations: Dict[str, float]) -> None:
    """保存标注到annotations.csv"""
    csv_path = os.path.join(root_path, 'annotations.csv')
    
    # 转换为DataFrame
    data = []
    for image_path, score in annotations.items():
        data.append({'image_path': image_path, 'score': score})
    
    df = pd.DataFrame(data)
    df.to_csv(csv_path, index=False)


def add_annotation(root_path: str, image_path: str, score: float) -> None:
    """添加/更新单个标注"""
    annotations = load_annotations(root_path)
    annotations[image_path] = score
    save_annotations(root_path, annotations)


def remove_annotation(root_path: str, image_path: str) -> None:
    """移除标注"""
    annotations = load_annotations(root_path)
    if image_path in annotations:
        del annotations[image_path]
        save_annotations(root_path, annotations)


def clear_annotations(root_path: str, image_paths: List[str]) -> None:
    """批量清除标注"""
    annotations = load_annotations(root_path)
    for path in image_paths:
        if path in annotations:
            del annotations[path]
    save_annotations(root_path, annotations)


def export_annotations_csv(root_path: str) -> str:
    """导出标注为CSV文件(返回文件路径)"""
    csv_path = os.path.join(root_path, 'annotations.csv')
    if not os.path.exists(csv_path):
        raise FileNotFoundError("No annotations file found")
    return csv_path


def import_annotations_csv(root_path: str, csv_content: bytes) -> Dict[str, int]:
    """导入CSV并验证图像存在性"""
    import tempfile
    
    # 将上传的文件保存到临时文件
    with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.csv') as tmp:
        tmp.write(csv_content)
        tmp_path = tmp.name
    
    try:
        # 读取CSV
        df = pd.read_csv(tmp_path)
        
        # 验证列
        if 'image_path' not in df.columns or 'score' not in df.columns:
            raise ValueError("CSV must contain 'image_path' and 'score' columns")
        
        # 验证图像存在性
        annotations = load_annotations(root_path)
        valid_count = 0
        invalid_count = 0
        
        for _, row in df.iterrows():
            image_path = str(row['image_path'])
            score = float(row['score'])
            
            # 检查图像是否存在
            full_path = os.path.join(root_path, image_path)
            if os.path.exists(full_path):
                annotations[image_path] = score
                valid_count += 1
            else:
                invalid_count += 1
        
        # 保存标注
        save_annotations(root_path, annotations)
        
        return {
            'valid': valid_count,
            'invalid': invalid_count
        }
    finally:
        # 删除临时文件
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)
