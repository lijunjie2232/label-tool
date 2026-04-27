"""
Backend package for Logist Labeling tool.

Contains models, routers, services, and utilities.
"""

# Import models
from logist_labeling.backend.models import (
    DatasetConfig,
    AnnotationRecord,
    BatchOperationRequest,
)

# Import routers
from logist_labeling.backend.routers import (
    dataset,
    images,
    annotations,
    inference,
)

# Import services
from logist_labeling.backend.services import (
    dataset_service,
    image_service,
    annotation_service,
)

# Import inferencer
from logist_labeling.backend.services.inferencer import (
    Inferencer,
    DummyInferencer,
    LogistInferencer,
)

# Import utilities
from logist_labeling.backend.utils import file_utils

__all__ = [
    # Models
    "DatasetConfig",
    "AnnotationRecord",
    "BatchOperationRequest",
    # Routers
    "dataset",
    "images",
    "annotations",
    "inference",
    # Services
    "dataset_service",
    "image_service",
    "annotation_service",
    # Inferencer
    "Inferencer",
    "DummyInferencer",
    "LogistInferencer",
    # Utils
    "file_utils",
]
