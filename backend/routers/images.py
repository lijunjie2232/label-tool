from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional
from backend.services import image_service
from backend.utils.file_utils import mark_image_deleted, restore_image

router = APIRouter(prefix="/datasets", tags=["images"])


class ImageListRequest(BaseModel):
    """获取图片列表的请求参数"""
    root_path: str
    sub_dir: str = ""
    sort_by: str = "file_name"
    annotated_on_top: str = "top"
    recursive: bool = True


@router.post("/images")
def get_image_list(request: ImageListRequest):
    """获取图像列表"""
    try:
        root_path = request.root_path
        
        # 加载配置
        from backend.services.dataset_service import get_dataset_config
        config = get_dataset_config(root_path)
        if not config:
            raise HTTPException(status_code=404, detail="Dataset config not found")
        
        images = image_service.get_image_list(
            root_path, 
            request.sub_dir, 
            config, 
            request.sort_by, 
            request.annotated_on_top,
            request.recursive
        )
        return {"images": images}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ImagePreviewRequest(BaseModel):
    """获取图像预览的请求参数"""
    path: str


@router.post("/images/preview")
def get_image_preview(request: ImagePreviewRequest):
    """获取图像预览"""
    try:
        import urllib.parse
        path = urllib.parse.unquote(request.path)
        
        image_data = image_service.get_image_preview_data(path)
        if not image_data:
            raise HTTPException(status_code=404, detail="Image not found")
        
        # 根据文件扩展名确定MIME类型
        if path.lower().endswith('.png'):
            media_type = "image/png"
        elif path.lower().endswith('.gif'):
            media_type = "image/gif"
        elif path.lower().endswith('.bmp'):
            media_type = "image/bmp"
        else:
            media_type = "image/jpeg"
        
        return Response(content=image_data, media_type=media_type)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/images/{path}")
def delete_image(path: str):
    """标记图像删除(添加.del后缀)"""
    try:
        import urllib.parse
        path = urllib.parse.unquote(path)
        
        if not path.endswith('.del'):
            mark_image_deleted(path)
        return {"message": "Image marked as deleted", "path": path + ".del"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/images/{path}/restore")
def restore_image_endpoint(path: str):
    """恢复已删除图像"""
    try:
        import urllib.parse
        path = urllib.parse.unquote(path)
        
        restored_path = restore_image(path)
        return {"message": "Image restored", "path": restored_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
