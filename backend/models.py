from pydantic import BaseModel, Field
from typing import List, Optional


class DatasetConfig(BaseModel):
    root_path: str
    min_score: float = 0
    max_score: float = 10
    score_step: float = 1
    image_regex: str = r".*\.(jpg|jpeg|png|bmp|webp)$"
    annotated_on_top: str = "top"  # top/bottom/not_set


class ImageInfo(BaseModel):
    relative_path: str
    absolute_path: str
    file_size: int
    width: int
    height: int
    is_annotated: bool
    score: Optional[float] = None
    is_deleted: bool = False


class AnnotationRecord(BaseModel):
    image_path: str
    score: float


class InferenceResult(BaseModel):
    timestamp: str
    results: List[AnnotationRecord]


class BatchOperationRequest(BaseModel):
    root_path: str
    operation: str  # delete/clear/set_score/add_score/sub_score
    value: Optional[float] = None
    image_paths: List[str]
