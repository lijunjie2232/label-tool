from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from logist_labeling.backend.models import AnnotationRecord, BatchOperationRequest
from logist_labeling.backend.services import annotation_service, image_service
from typing import List

router = APIRouter(prefix="/datasets", tags=["annotations"])


@router.post("/annotations")
def get_annotations(request: dict):
    """获取所有标注"""
    try:
        root_path = request.get('root_path')
        if not root_path:
            raise HTTPException(status_code=400, detail="root_path is required")
        
        annotations = annotation_service.load_annotations(root_path)
        return {"annotations": annotations}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/annotation")
def add_annotation(request: dict):
    """添加/更新标注"""
    try:
        root_path = request.get('root_path')
        image_path = request.get('image_path')
        score = request.get('score')
        
        if not root_path or not image_path or score is None:
            raise HTTPException(status_code=400, detail="root_path, image_path and score are required")
        
        annotation_service.add_annotation(root_path, image_path, score)
        return {"message": "Annotation saved", "image_path": image_path, "score": score}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/annotation/remove")
def remove_annotation(request: dict):
    """删除标注"""
    try:
        root_path = request.get('root_path')
        image_path = request.get('image_path')
        
        if not root_path or not image_path:
            raise HTTPException(status_code=400, detail="root_path and image_path are required")
        
        annotation_service.remove_annotation(root_path, image_path)
        return {"message": "Annotation removed", "image_path": image_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/annotations/clear")
def clear_annotations(request: BatchOperationRequest):
    """批量清除标注"""
    try:
        annotation_service.clear_annotations(request.root_path, request.image_paths)
        return {"message": f"Cleared {len(request.image_paths)} annotations"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/annotations/export")
def export_annotations(request: dict):
    """导出标注CSV"""
    try:
        root_path = request.get('root_path')
        if not root_path:
            raise HTTPException(status_code=400, detail="root_path is required")
        
        csv_path = annotation_service.export_annotations_csv(root_path)
        return FileResponse(
            csv_path,
            media_type='text/csv',
            filename='annotations.csv'
        )
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="No annotations file found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/annotations/import")
async def import_annotations(
    root_path: str = Form(...),
    file: UploadFile = File(...)
):
    """导入标注CSV"""
    try:
        csv_content = await file.read()
        result = annotation_service.import_annotations_csv(root_path, csv_content)
        
        return {
            "message": "Import completed",
            "valid": result['valid'],
            "invalid": result['invalid']
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
