import os
from typing import List, Dict, Optional
from backend.utils.file_utils import (
    load_dataset_config,
    save_dataset_config,
    list_all_datasets,
    get_dataset_config_path,
    add_dataset_to_list,
    remove_dataset_from_list
)


def create_dataset(root_path: str, config: Dict) -> Dict:
    """创建新数据集配置"""
    # 验证路径是否存在
    if not os.path.exists(root_path):
        raise ValueError(f"Path does not exist: {root_path}")
    
    # 设置默认值
    dataset_config = {
        'root_path': root_path,
        'min_score': config.get('min_score', 0),
        'max_score': config.get('max_score', 10),
        'score_step': config.get('score_step', 1),
        'image_regex': config.get('image_regex', r'.*\.(jpg|jpeg|png|bmp|webp)$'),
        'annotated_on_top': config.get('annotated_on_top', 'top')
    }
    
    # 保存配置到数据集根目录
    save_dataset_config(root_path, dataset_config)
    
    # 添加到数据集列表
    add_dataset_to_list(root_path)
    
    return dataset_config


def get_dataset_config(root_path: str) -> Optional[Dict]:
    """获取数据集配置"""
    return load_dataset_config(root_path)


def update_dataset_config(root_path: str, config: Dict) -> Dict:
    """更新数据集配置"""
    existing_config = load_dataset_config(root_path)
    if not existing_config:
        raise ValueError(f"Dataset not found: {root_path}")
    
    # 更新配置
    existing_config.update(config)
    save_dataset_config(root_path, existing_config)
    return existing_config


def list_datasets() -> List[str]:
    """列出所有已配置的数据集"""
    return list_all_datasets()


def delete_dataset(root_path: str) -> bool:
    """删除数据集配置(不删除磁盘上的数据)"""
    config_path = get_dataset_config_path(root_path)
    
    # 删除配置文件
    if os.path.exists(config_path):
        os.remove(config_path)
    
    # 从列表中移除
    remove_dataset_from_list(root_path)
    
    return True
