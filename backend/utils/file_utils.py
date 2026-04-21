import os
import json
import re
from pathlib import Path
from typing import List, Dict, Optional
from PIL import Image


def get_project_config_dir() -> str:
    """获取项目配置目录路径"""
    config_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "configs")
    os.makedirs(config_dir, exist_ok=True)
    return config_dir


def get_datasets_list_path() -> str:
    """获取数据集列表文件路径（JSONL格式）"""
    config_dir = get_project_config_dir()
    return os.path.join(config_dir, "datasets.jsonl")


def get_dataset_config_path(root_path: str) -> str:
    """获取数据集配置文件路径（在数据集根目录下）"""
    return os.path.join(root_path, "config.json")


def load_dataset_config(root_path: str) -> Optional[Dict]:
    """加载数据集配置文件"""
    config_path = get_dataset_config_path(root_path)
    if os.path.exists(config_path):
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None


def save_dataset_config(root_path: str, config: Dict) -> None:
    """保存数据集配置为JSON到数据集根目录"""
    config_path = get_dataset_config_path(root_path)
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config, f, indent=2, ensure_ascii=False)


def add_dataset_to_list(root_path: str) -> None:
    """添加数据集路径到JSONL列表文件"""
    jsonl_path = get_datasets_list_path()
    
    # 读取现有列表
    existing_paths = set()
    if os.path.exists(jsonl_path):
        with open(jsonl_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        data = json.loads(line)
                        if 'root_path' in data:
                            existing_paths.add(data['root_path'])
                    except json.JSONDecodeError:
                        continue
    
    # 如果不存在则添加
    if root_path not in existing_paths:
        with open(jsonl_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps({'root_path': root_path}) + '\n')


def remove_dataset_from_list(root_path: str) -> None:
    """从JSONL列表文件中移除数据集路径"""
    jsonl_path = get_datasets_list_path()
    
    if not os.path.exists(jsonl_path):
        return
    
    # 读取所有行并过滤掉要删除的路径
    updated_lines = []
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    data = json.loads(line)
                    if data.get('root_path') != root_path:
                        updated_lines.append(line)
                except json.JSONDecodeError:
                    updated_lines.append(line)
    
    # 写回更新后的内容
    with open(jsonl_path, 'w', encoding='utf-8') as f:
        for line in updated_lines:
            f.write(line + '\n')


def list_all_datasets() -> List[str]:
    """从JSONL文件中列出所有已配置的数据集根路径"""
    jsonl_path = get_datasets_list_path()
    if not os.path.exists(jsonl_path):
        return []
    
    datasets = []
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    data = json.loads(line)
                    if 'root_path' in data:
                        datasets.append(data['root_path'])
                except json.JSONDecodeError:
                    continue
    return datasets


def is_image_deleted(file_path: str) -> bool:
    """检查文件是否有.del后缀"""
    return file_path.endswith('.del')


def mark_image_deleted(file_path: str) -> str:
    """添加.del后缀"""
    if not is_image_deleted(file_path):
        new_path = file_path + '.del'
        os.rename(file_path, new_path)
        return new_path
    return file_path


def restore_image(file_path: str) -> str:
    """移除.del后缀"""
    if is_image_deleted(file_path):
        new_path = file_path[:-4]  # 去掉'.del'
        os.rename(file_path, new_path)
        return new_path
    return file_path


def scan_images(root_path: str, sub_dir: str, config: Dict, recursive: bool = True) -> List[Dict]:
    """递归扫描图像文件"""
    images = []
    
    # 构建搜索目录
    search_dir = os.path.join(root_path, sub_dir) if sub_dir else root_path
    
    if not os.path.exists(search_dir):
        return images
    
    # 获取图像正则表达式
    image_regex = config.get('image_regex', r'.*\.(jpg|jpeg|png|gif|bmp)$')
    pattern = re.compile(image_regex, re.IGNORECASE)
    
    # 根据recursive参数决定扫描方式
    if recursive:
        # 递归扫描
        for dirpath, dirnames, filenames in os.walk(search_dir):
            for filename in filenames:
                full_path = os.path.join(dirpath, filename)
                
                # 跳过已删除的文件
                if is_image_deleted(full_path):
                    continue
                
                # 检查是否符合正则表达式
                if not pattern.match(filename):
                    continue
                
                # 获取相对路径
                relative_path = os.path.relpath(full_path, root_path)
                
                # 获取文件大小
                try:
                    file_size = os.path.getsize(full_path)
                except OSError:
                    continue
                
                # 获取图像尺寸
                try:
                    with Image.open(full_path) as img:
                        width, height = img.size
                except Exception:
                    continue
                
                images.append({
                    'relative_path': relative_path,
                    'absolute_path': full_path,
                    'file_size': file_size,
                    'width': width,
                    'height': height,
                    'filename': filename
                })
    else:
        # 仅扫描当前目录
        try:
            for filename in os.listdir(search_dir):
                full_path = os.path.join(search_dir, filename)
                
                # 跳过目录
                if not os.path.isfile(full_path):
                    continue
                
                # 跳过已删除的文件
                if is_image_deleted(full_path):
                    continue
                
                # 检查是否符合正则表达式
                if not pattern.match(filename):
                    continue
                
                # 获取相对路径
                relative_path = os.path.relpath(full_path, root_path)
                
                # 获取文件大小
                try:
                    file_size = os.path.getsize(full_path)
                except OSError:
                    continue
                
                # 获取图像尺寸
                try:
                    with Image.open(full_path) as img:
                        width, height = img.size
                except Exception:
                    continue
                
                images.append({
                    'relative_path': relative_path,
                    'absolute_path': full_path,
                    'file_size': file_size,
                    'width': width,
                    'height': height,
                    'filename': filename
                })
        except OSError:
            pass
    
    return images


def get_image_preview(image_path: str) -> Optional[bytes]:
    """读取图像文件用于预览"""
    try:
        with open(image_path, 'rb') as f:
            return f.read()
    except Exception:
        return None
