from fastapi import APIRouter, HTTPException
from logist_labeling.backend.models import DatasetConfig
from logist_labeling.backend.services import dataset_service

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("/")
def list_datasets():
    """列出所有数据集"""
    try:
        datasets = dataset_service.list_datasets()
        return {"datasets": datasets}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
def create_dataset(config: DatasetConfig):
    """创建数据集配置"""
    try:
        result = dataset_service.create_dataset(config.root_path, config.dict())
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/config")
def get_dataset_config(request: dict):
    """获取数据集配置"""
    try:
        root_path = request.get('root_path')
        if not root_path:
            raise HTTPException(status_code=400, detail="root_path is required")
        
        config = dataset_service.get_dataset_config(root_path)
        if not config:
            raise HTTPException(status_code=404, detail="Dataset not found")
        return config
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/config")
def update_dataset_config(request: dict):
    """更新数据集配置"""
    try:
        root_path = request.get('root_path')
        if not root_path:
            raise HTTPException(status_code=400, detail="root_path is required")
        
        # 提取配置项，排除 root_path 本身（通常不更新）
        updates = {k: v for k, v in request.items() if k != 'root_path'}
        result = dataset_service.update_dataset_config(root_path, updates)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/config")
def patch_dataset_config(request: dict):
    """部分更新数据集配置"""
    try:
        root_path = request.get('root_path')
        if not root_path:
            raise HTTPException(status_code=400, detail="root_path is required")
        
        updates = {k: v for k, v in request.items() if k != 'root_path'}
        result = dataset_service.update_dataset_config(root_path, updates)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete")
def delete_dataset_endpoint(request: dict):
    """删除数据集配置(不删除磁盘数据)"""
    try:
        root_path = request.get('root_path')
        if not root_path:
            raise HTTPException(status_code=400, detail="root_path is required")
        
        success = dataset_service.delete_dataset(root_path)
        if success:
            return {"message": "Dataset configuration removed", "root_path": root_path}
        else:
            raise HTTPException(status_code=404, detail="Dataset not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
