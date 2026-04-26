import os
import pandas as pd
from typing import List, Dict, Optional
from logist_labeling.backend.utils.file_utils import scan_images, get_image_preview


def get_image_list(root_path: str, sub_dir: str, config: Dict, 
                   sort_by: str = 'file_name', 
                   annotated_on_top: str = 'top',
                   recursive: bool = True) -> List[Dict]:
    """获取指定目录下的图像列表"""
    # 扫描图像
    images = scan_images(root_path, sub_dir, config, recursive)
    
    # 加载标注数据
    annotations = load_annotations(root_path)
    
    # 添加标注信息
    for img in images:
        rel_path = img['relative_path']
        if rel_path in annotations:
            img['is_annotated'] = True
            img['score'] = annotations[rel_path]
        else:
            img['is_annotated'] = False
            img['score'] = None
    
    # 排序
    if sort_by == 'file_name':
        images.sort(key=lambda x: x['filename'].lower())
    elif sort_by == 'byte_size':
        images.sort(key=lambda x: x['file_size'])
    
    # 处理annotated图片的位置
    if annotated_on_top == 'top':
        # 已标注的在前面
        annotated = [img for img in images if img['is_annotated']]
        not_annotated = [img for img in images if not img['is_annotated']]
        images = annotated + not_annotated
    elif annotated_on_top == 'bottom':
        # 已标注的在后面
        annotated = [img for img in images if img['is_annotated']]
        not_annotated = [img for img in images if not img['is_annotated']]
        images = not_annotated + annotated
    # 'not_set' 不做额外处理
    
    return images


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


def get_image_preview_data(image_path: str) -> Optional[bytes]:
    """返回图像二进制数据用于预览"""
    return get_image_preview(image_path)
