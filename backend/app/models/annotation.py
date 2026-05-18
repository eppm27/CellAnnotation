from pydantic import BaseModel
from typing import List, Dict, Any, Optional


class Point(BaseModel):
    x: float
    y: float


class Annotation(BaseModel):
    id: str
    type: str  # "circle" | "rectangle" | "freehand" | "text" | "measure" | ...
    name: Optional[str] = None
    category: str
    color: str  # e.g. "#ef4444"
    visible: bool = True
    coordinates: List[Point]
    properties: Optional[Dict[str, Any]] = None


class ExportRequest(BaseModel):
    file_id: str
    file_type: str  # "png" | "svs"
    mode: str  # "annotations" | "overlay" | "mask" | "all"
    canvas_width: int
    canvas_height: int
    annotations: List[Annotation]
