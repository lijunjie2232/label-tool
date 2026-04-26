from fastapi import APIRouter, HTTPException
from backend.services.inferencer import DummyInferencer, LogistInferencer
from backend.services import image_service
import os
import glob
import pandas as pd
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/datasets", tags=["inference"])


class InferenceRequest(BaseModel):
    root_path: str
    inferencer_type: str = "dummy"  # dummy or logist


@router.post("/infer")
def run_inference(request: InferenceRequest):
    """执行推理"""
    try:
        root_path = request.root_path
        
        # 加载配置
        from backend.services.dataset_service import get_dataset_config
        config = get_dataset_config(root_path)
        if not config:
            raise HTTPException(status_code=404, detail="Dataset config not found")
        
        # 获取所有图像路径
        images = image_service.get_image_list(root_path, "", config, 'file_name', 'not_set')
        image_paths = [img['absolute_path'] for img in images]
        
        if not image_paths:
            raise HTTPException(status_code=400, detail="No images found")
        
        # 创建推理器
        if request.inferencer_type == "logist":
            inferencer = LogistInferencer(root_path)
        else:
            inferencer = DummyInferencer(root_path)
        
        # 执行批量推理
        results = inferencer.infer_batch(image_paths)
        
        # 保存结果
        filename = inferencer.save_results(results)
        
        return {
            "message": "Inference completed",
            "filename": filename,
            "count": len(results)
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inference-files")
def list_inference_files(request: dict):
    """列出推理结果文件"""
    try:
        root_path = request.get('root_path')
        if not root_path:
            raise HTTPException(status_code=400, detail="root_path is required")
        
        # 查找所有infer_*.csv文件
        pattern = os.path.join(root_path, "infer_*.csv")
        files = glob.glob(pattern)
        
        # 提取文件名
        filenames = [os.path.basename(f) for f in files]
        filenames.sort(reverse=True)  # 最新的在前
        
        return {"files": filenames}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/inference-result")
def get_inference_result(request: dict):
    """获取推理结果"""
    try:
        root_path = request.get('root_path')
        filename = request.get('filename')
        
        if not root_path or not filename:
            raise HTTPException(status_code=400, detail="root_path and filename are required")
        
        filepath = os.path.join(root_path, filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")
        
        # 读取CSV
        df = pd.read_csv(filepath)
        results = []
        for _, row in df.iterrows():
            results.append({
                "image_path": row['image_path'],
                "score": float(row['score'])
            })
        
        return {"filename": filename, "results": results}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/merge-inference")
def merge_inference(request: dict):
    """合并推理结果到标注"""
    try:
        root_path = request.get('root_path')
        filename = request.get('filename')
        
        if not root_path or not filename:
            raise HTTPException(status_code=400, detail="root_path and filename are required")
        
        filepath = os.path.join(root_path, filename)
        if not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found")
        
        # 读取推理结果
        df = pd.read_csv(filepath)
        
        # 添加到标注
        from backend.services.annotation_service import add_annotation
        count = 0
        for _, row in df.iterrows():
            image_path = str(row['image_path'])
            score = float(row['score'])
            add_annotation(root_path, image_path, score)
            count += 1
        
        return {
            "message": "Merge completed",
            "count": count
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
