from abc import ABC, abstractmethod
from datetime import datetime
from typing import List
import pandas as pd
import os


class Inferencer(ABC):
    """推理器基类"""
    
    def __init__(self, dataset_root: str):
        self.dataset_root = dataset_root
    
    @abstractmethod
    def predict(self, image_path: str) -> float:
        """对单张图像进行推理,返回分数"""
        pass
    
    def infer_batch(self, image_paths: List[str]) -> List[dict]:
        """批量推理"""
        results = []
        for path in image_paths:
            try:
                score = self.predict(path)
                rel_path = os.path.relpath(path, self.dataset_root)
                results.append({"image_path": rel_path, "score": score})
            except Exception as e:
                print(f"Error predicting {path}: {e}")
        return results
    
    def save_results(self, results: List[dict]) -> str:
        """保存推理结果为CSV"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"infer_{timestamp}.csv"
        filepath = os.path.join(self.dataset_root, filename)
        df = pd.DataFrame(results)
        df.to_csv(filepath, index=False)
        return filename


class LogistInferencer(Inferencer):
    """Logist模型推理器(示例实现)"""
    
    def predict(self, image_path: str) -> float:
        """
        TODO: 集成实际的logist模型
        目前返回一个基于文件名的伪随机分数作为示例
        """
        import hashlib
        # 使用文件名生成一个0-10之间的确定性伪随机数
        hash_val = int(hashlib.md5(image_path.encode()).hexdigest(), 16)
        return (hash_val % 1001) / 100.0


class DummyInferencer(Inferencer):
    """示例推理器(占位实现)"""
    
    def predict(self, image_path: str) -> float:
        """
        TODO: 后续实现具体模型
        目前默认返回中间值5.0
        """
        return 5.0
