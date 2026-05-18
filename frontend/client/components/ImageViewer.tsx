import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import html2canvas from "html2canvas";
import {
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Maximize2,
  Contrast,
  Sun,
  Undo2,
  Redo2,
  Type,
  Crop,
  Loader2,
  Grid3x3,
} from "lucide-react";
import OsdViewer from "./OsdViewer";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { CalibrationSettings } from "./CalibrationDialog";
import { useToast } from "@/components/ui/use-toast";
import {
  calculateLength,
  calculateRectangleArea,
  calculateRectanglePerimeter,
  calculateCircleArea,
  calculateCirclePerimeter,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  formatMeasurement,
} from "@/lib/measurements";

type Pt = { x: number; y: number };

export interface Annotation {
  id: string;
  type: "rectangle" | "circle" | "freehand" | "text" | "measurement";
  color: string;
  visible: boolean;
  category?: string;
  coordinates: Pt[];
  layerId?: string | null;
  properties?: {
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: "normal" | "bold";
    textAlign?: "left" | "center" | "right";
    backgroundColor?: string;
    backgroundOpacity?: number;
    hasStroke?: boolean;
    strokeWidth?: number;
    strokeColor?: string;
    [key: string]: any;
  };
  erasedRegions?: { x: number; y: number; radius: number }[];
}

export interface ImageExportHandle {
  exportComposite: () => Promise<Blob>;
  exportMask: () => Promise<Blob>;
}

export interface ImageViewerProps {
  imageUrl?: string;
  onImageLoad?: (dims: { width: number; height: number }) => void;
  imageVisible?: boolean;
  baseImageLayerId?: string | null;

  annotations: Annotation[];
  selectedTool:
    | "select"
    | "pan"
    | "rectangle"
    | "circle"
    | "freehand"
    | "text"
    | "eraser"
    | "measurement";
  annotationColor?: string;
  annotationCategory?: string;
  onAnnotationCreate?: (annotation: Annotation) => void;
  onAnnotationUpdate?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  registerExporter?: (api: ImageExportHandle) => void;

  selectedAnnotationId?: string | null;
  onAnnotationSelect?: (annotationId: string | null) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;

  useHiRes: boolean;
  dziUrl?: string;

  showGrid?: boolean;
  gridColor?: string;
  gridOpacity?: number;
  gridSize?: number;

  calibration?: CalibrationSettings;

  textFontSize?: number;
  textFontFamily?: string;
  textFontWeight?: "normal" | "bold";
  textAlign?: "left" | "center" | "right";
  textBackgroundColor?: string;
  textBackgroundOpacity?: number;
  textHasStroke?: boolean;
  textStrokeWidth?: number;
  textStrokeColor?: string;

  shapeFillColor?: string;
  shapeFillOpacity?: number;
  shapeStrokeColor?: string;
  shapeStrokeWidth?: string | number;
  selectedLayerId?: string | null;
  onAutoCreateLayer?: () => void;

  // eraser size 
  eraserSize?: number;
}

const DEFAULT_COLOR = "#ef4444";
const DEFAULT_CATEGORY = "Lesion";
const genId = () => Math.random().toString(36).slice(2, 10);

const formatDistance = (value: number) => `${value.toFixed(1)} px`;

const getNormalizedRect = (
  start: { x: number; y: number },
  end: { x: number; y: number },
) => {
  const minX = Math.min(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxX = Math.max(start.x, end.x);
  const maxY = Math.max(start.y, end.y);
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
};

function hitTestAnnotation(a: Annotation, pt: Pt): boolean {
  if (!a.visible) return false;

  if (a.type === "circle" && a.coordinates.length >= 2) {
    const { geometry } = a.properties || {};
    if (geometry === "bounding-box") {
      const [rawStart, rawEnd] = a.coordinates;
      const minX = Math.min(rawStart.x, rawEnd.x);
      const maxX = Math.max(rawStart.x, rawEnd.x);
      const minY = Math.min(rawStart.y, rawEnd.y);
      const maxY = Math.max(rawStart.y, rawEnd.y);
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;
      const radiusX = Math.max((maxX - minX) / 2, 1);
      const radiusY = Math.max((maxY - minY) / 2, 1);
      const norm =
        (pt.x - centerX) ** 2 / (radiusX * radiusX) +
        (pt.y - centerY) ** 2 / (radiusY * radiusY);
      return norm <= 1.1;
    }
    const c = a.coordinates[0];
    const e = a.coordinates[1];
    const r = Math.hypot(e.x - c.x, e.y - c.y);
    return Math.hypot(pt.x - c.x, pt.y - c.y) <= r + 6;
  }

  if (a.type === "rectangle" && a.coordinates.length >= 2) {
    const s = a.coordinates[0];
    const e = a.coordinates[1];
    const minX = Math.min(s.x, e.x),
      maxX = Math.max(s.x, e.x);
    const minY = Math.min(s.y, e.y),
      maxY = Math.max(s.y, e.y);
    return (
      pt.x >= minX - 6 &&
      pt.x <= maxX + 6 &&
      pt.y >= minY - 6 &&
      pt.y <= maxY + 6
    );
  }

  if (a.type === "freehand" && a.coordinates.length > 1) {
    for (let i = 1; i < a.coordinates.length; i++) {
      const u = a.coordinates[i - 1];
      const v = a.coordinates[i];
      const dx = v.x - u.x,
        dy = v.y - u.y;
      const L2 = dx * dx + dy * dy || 1;
      const t = Math.max(
        0,
        Math.min(1, ((pt.x - u.x) * dx + (pt.y - u.y) * dy) / L2),
      );
      const cx = u.x + t * dx,
        cy = u.y + t * dy;
      if (Math.hypot(pt.x - cx, pt.y - cy) <= 8) return true;
    }
  }

  if (a.type === "text" && a.coordinates.length >= 1) {
    const p = a.coordinates[0];
    const text = a.properties?.text || "";
    const fontSize = a.properties?.fontSize || 18;
    const alignment = a.properties?.textAlign || "left";
    const lines = text.split("\n");
    const lineHeight = fontSize * 1.3;
    const totalHeight = lines.length * lineHeight;
    const avgCharWidth = fontSize * 0.6;
    const maxLineLength = Math.max(...lines.map((line) => line.length), 1);
    const estimatedWidth = maxLineLength * avgCharWidth;
    let minX = p.x;
    let maxX = p.x + estimatedWidth;
    if (alignment === "center") {
      minX = p.x - estimatedWidth / 2;
      maxX = p.x + estimatedWidth / 2;
    } else if (alignment === "right") {
      minX = p.x - estimatedWidth;
      maxX = p.x;
    }
    const padding = 10;
    return (
      pt.x >= minX - padding &&
      pt.x <= maxX + padding &&
      pt.y >= p.y - padding &&
      pt.y <= p.y + totalHeight + padding
    );
  }

  if (a.type === "measurement" && a.coordinates.length >= 2) {
    const start = a.coordinates[0];
    const end = a.coordinates[1];
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) {
      return Math.sqrt((pt.x - start.x) ** 2 + (pt.y - start.y) ** 2) < 8;
    }
    const t =
      ((pt.x - start.x) * dx + (pt.y - start.y) * dy) / (length * length);
    const clamped = Math.max(0, Math.min(1, t));
    const closestX = start.x + clamped * dx;
    const closestY = start.y + clamped * dy;
    const dist = Math.sqrt((pt.x - closestX) ** 2 + (pt.y - closestY) ** 2);
    return dist <= 10;
  }

  return false;
}

export default function ImageViewer({
  imageUrl,
  onImageLoad,
  imageVisible = true,
  baseImageLayerId = null,
  annotations,
  selectedTool,
  annotationColor = DEFAULT_COLOR,
  annotationCategory = DEFAULT_CATEGORY,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  registerExporter,
  selectedAnnotationId = null,
  onAnnotationSelect,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  useHiRes,
  dziUrl,
  showGrid = false,
  gridColor = "#ffffff",
  gridOpacity = 0.2,
  gridSize = 20,
  calibration = { pixelsPerUnit: 1, unit: "px" },
  textFontSize = 18,
  textFontFamily = "Arial",
  textFontWeight = "normal",
  textAlign = "left",
  textBackgroundColor = "transparent",
  textBackgroundOpacity = 0.7,
  textHasStroke = false,
  textStrokeWidth = 2,
  textStrokeColor = "#000000",
  shapeFillColor = "transparent",
  shapeFillOpacity = 0.3,
  shapeStrokeColor = "#FF0000",
  shapeStrokeWidth = 2,
  selectedLayerId = null,
  onAutoCreateLayer,
  eraserSize = 16,
}: ImageViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const nativeMouseDownRef = useRef<(event: MouseEvent) => void>();
  const nativeMouseUpRef = useRef<(event: MouseEvent) => void>();
  const nativeMouseMoveRef = useRef<(event: MouseEvent) => void>();
  const { toast } = useToast();

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  const [canvasDims, setCanvasDims] = useState({ width: 1, height: 1 });
  const [imageDims, setImageDims] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Pt>({ x: 0, y: 0 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Pt | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Pt[]>([]);
  const [textInput, setTextInput] = useState("");
  const [textPosition, setTextPosition] = useState<Pt | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [gridEnabled, setGridEnabled] = useState(showGrid);

  // updating mouse positions for eraser cursor
  const mouseImagePos = useRef<Pt | null>(null);
  const mouseScreenPos = useRef<Pt | null>(null);

  const [osdViewportVersion, setOsdViewportVersion] = useState(0);

  const toImage = useRef((p: Pt) => p);
  const toScreen = useRef((p: Pt) => p);

  const osdZoomIn = useRef<(() => void) | null>(null);
  const osdZoomOut = useRef<(() => void) | null>(null);
  const osdResetZoom = useRef<(() => void) | null>(null);
  const osdGetZoom = useRef<(() => number) | null>(null);

  // patch tool states
  const [isPatchMode, setIsPatchMode] = useState(false);
  const [patchStartPoint, setPatchStartPoint] = useState<Pt | null>(null);
  const [patchEndPoint, setPatchEndPoint] = useState<Pt | null>(null);
  const [isSelectingPatch, setIsSelectingPatch] = useState(false);
  const [isPatchProcessing, setIsPatchProcessing] = useState(false);

  useLayoutEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      setCanvasDims({ width: el.clientWidth, height: el.clientHeight });
      // ensure cursor overlay uses same container
      if (cursorRef.current && el) {
        // initial hide
        cursorRef.current.style.display = "none";
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    setGridEnabled(showGrid);
  }, [showGrid]);

  useEffect(() => {
    const handleDown = (event: MouseEvent) => {
      nativeMouseDownRef.current?.(event);
    };
    const handleUp = (event: MouseEvent) => {
      nativeMouseUpRef.current?.(event);
    };
    const handleMove = (event: MouseEvent) => {
      nativeMouseMoveRef.current?.(event);
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("mousemove", handleMove);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("mousemove", handleMove);
    };
  }, []);

  useEffect(() => {
    if (!imageUrl) {
      imgRef.current = null;
      return;
    }
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setImageDims({ width: img.width, height: img.height });
      onImageLoad?.({ width: img.width, height: img.height });
    };
    img.src = imageUrl;
    return () => {
      imgRef.current = null;
    };
  }, [imageUrl, onImageLoad]);

  const handleZoomIn = () => {
    if (useHiRes && dziUrl && osdZoomIn.current) {
      osdZoomIn.current();
      if (osdGetZoom.current) {
        setZoom(osdGetZoom.current());
      }
    } else {
      setZoom((v) => Math.min(v + 25, 500));
    }
  };

  const handleZoomOut = () => {
    if (useHiRes && dziUrl && osdZoomOut.current) {
      osdZoomOut.current();
      if (osdGetZoom.current) {
        setZoom(osdGetZoom.current());
      }
    } else {
      setZoom((v) => Math.max(v - 25, 25));
    }
  };

  const handleRotate = () => setRotation((v) => (v + 90) % 360);

  const handleReset = () => {
    if (useHiRes && dziUrl && osdResetZoom.current) {
      osdResetZoom.current();
      setZoom(100);
    } else {
      setZoom(100);
      setPan({ x: 0, y: 0 });
    }
    setBrightness(100);
    setContrast(100);
    setRotation(0);
  };

  const addMeasurementProperties = (annotation: Annotation): Annotation => {
    const coords = annotation.coordinates;
    const props: any = {
      ...(annotation.properties || {}),
      unit: calibration.unit,
    };

    if (annotation.type === "measurement" && coords.length >= 2) {
      props.length = calculateLength(
        coords[0],
        coords[coords.length - 1],
        calibration,
      );
    } else if (annotation.type === "rectangle" && coords.length >= 2) {
      props.area = calculateRectangleArea(coords[0], coords[1], calibration);
      props.perimeter = calculateRectanglePerimeter(
        coords[0],
        coords[1],
        calibration,
      );
    } else if (annotation.type === "circle" && coords.length >= 2) {
      const center = {
        x: (coords[0].x + coords[1].x) / 2,
        y: (coords[0].y + coords[1].y) / 2,
      };
      const edge = coords[1];
      props.area = calculateCircleArea(center, edge, calibration);
      props.perimeter = calculateCirclePerimeter(center, edge, calibration);
    } else if (annotation.type === "freehand" && coords.length >= 3) {
      props.area = calculatePolygonArea(coords, calibration);
      props.perimeter = calculatePolygonPerimeter(coords, calibration);
    }

    return {
      ...annotation,
      properties: props,
    };
  };

  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "+",
        description: "Zoom in",
        callback: () => handleZoomIn(),
      },
      {
        key: "=",
        description: "Zoom in",
        callback: () => handleZoomIn(),
      },
      {
        key: "-",
        description: "Zoom out",
        callback: () => handleZoomOut(),
      },
      {
        key: "_",
        description: "Zoom out",
        callback: () => handleZoomOut(),
      },
      {
        key: "Delete",
        description: "Delete selected annotation",
        callback: () => {
          if (selectedAnnotationId) {
            onAnnotationDelete?.(selectedAnnotationId);
          }
        },
      },
      {
        key: "Backspace",
        description: "Delete selected annotation",
        callback: () => {
          if (selectedAnnotationId) {
            onAnnotationDelete?.(selectedAnnotationId);
          }
        },
      },
      {
        key: "Escape",
        description: "Deselect annotation",
        callback: () => {
          if (selectedAnnotationId) {
            onAnnotationSelect?.(null);
          }
        },
        preventDefault: false,
      },
    ],
    enabled: true,
  });

  const getRelativeImagePt = (e: React.MouseEvent): Pt => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;

    if (useHiRes && dziUrl) {
      return toImage.current({ x: sx, y: sy });
    }

    const canvasW = canvasDims.width,
      canvasH = canvasDims.height;
    const centerX = canvasW / 2,
      centerY = canvasH / 2;

    let x = sx - centerX - pan.x;
    let y = sy - centerY - pan.y;

    const ang = (-rotation * Math.PI) / 180;
    const rx = x * Math.cos(ang) - y * Math.sin(ang);
    const ry = x * Math.sin(ang) + y * Math.cos(ang);

    return {
      x: rx / (zoom / 100) + imageDims.width / 2,
      y: ry / (zoom / 100) + imageDims.height / 2,
    };
  };

  const imageToScreenStyle = (imgPt: Pt) => {
    let p: Pt;
    if (useHiRes && dziUrl) {
      p = toScreen.current(imgPt);
    } else {
      const canvasW = canvasDims.width,
        canvasH = canvasDims.height;
      const centerX = canvasW / 2,
        centerY = canvasH / 2;
      let x = imgPt.x - imageDims.width / 2;
      let y = imgPt.y - imageDims.height / 2;
      x *= zoom / 100;
      y *= zoom / 100;
      const ang = (rotation * Math.PI) / 180;
      const rx = x * Math.cos(ang) - y * Math.sin(ang);
      const ry = x * Math.sin(ang) + y * Math.cos(ang);
      p = { x: rx + centerX + pan.x, y: ry + centerY + pan.y };
    }
    return {
      left: p.x,
      top: p.y,
      position: "absolute" as const,
      transform: "translate(-50%, -50%)",
      zIndex: 30,
      pointerEvents: "auto" as const,
    };
  };

  // find topmost annotation; with optional layerFilter: if provided (string or null) only annotations with candidate.layerId === layerFilter are considered
  const findTopmostAnnotation = (pt: { x: number; y: number }, layerFilter?: string | null) => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const candidate = annotations[i];
      if (!candidate.visible) continue;
      if (layerFilter !== undefined && layerFilter !== null) {
        if (candidate.layerId !== layerFilter) continue;
      } else if (layerFilter === null) {
        // explicit null filter: only select annotations without a layer
        if (candidate.layerId !== null && candidate.layerId !== undefined) continue;
      }
      if (hitTestAnnotation(candidate, pt)) return candidate;
    }
    return null;
  };

    // Helper function to calculate OpenSlide level from OSD zoom
  const calculateOpenSlideLevel = (osdZoom: number, maxLevel: number): number => {
    // Map OSD zoom to OpenSlide pyramid level
    // Higher OSD zoom = lower level number (more detail)
    if (osdZoom >= 1.0) return 0;
    if (osdZoom >= 0.5) return Math.min(1, maxLevel);
    if (osdZoom >= 0.25) return Math.min(2, maxLevel);
    if (osdZoom >= 0.125) return Math.min(3, maxLevel);
    return Math.min(4, maxLevel);
  };

  // Patch capture function
  const capturePatch = async (rect: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number }) => {
    setIsPatchProcessing(true);
    try {
      if (useHiRes && dziUrl) {
        // OSD Mode: Extract patch from SVS file via backend API

        // Get current zoom level
        const currentZoom = osdGetZoom.current ? osdGetZoom.current() : 1.0;

        // Calculate appropriate OpenSlide level (assume max 8 levels)
        const level = calculateOpenSlideLevel(currentZoom, 7);

        // Extract image ID from dziUrl (format: /tiles/{img_id}.dzi)
        const imgIdMatch = dziUrl.match(/\/tiles\/([^.]+)\.dzi/);
        if (!imgIdMatch) {
          showError(
            "Patch capture failed",
            "Failed to extract the image ID from the DZI URL.",
          );
          setIsPatchProcessing(false);
          return;
        }
        const imgId = imgIdMatch[1];

        // Build API URL with parameters
        const apiUrl = `/api/files/patch/${imgId}?` + new URLSearchParams({
          x: Math.round(rect.minX).toString(),
          y: Math.round(rect.minY).toString(),
          width: Math.round(rect.width).toString(),
          height: Math.round(rect.height).toString(),
          level: level.toString(),
          brightness: brightness.toString(),
          contrast: contrast.toString(),
        }).toString();

        // Fetch the patch
        const response = await fetch(apiUrl);

        if (!response.ok) {
          const error = await response.text();
          showError(
            "Patch capture failed",
            `Failed to extract patch: ${error}`,
          );
          setIsPatchProcessing(false);
          return;
        }

        // Download the blob
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `patch_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

      } else if (imgRef.current) {
        // Normal Mode: Draw the selected region from the base image

        // Create a temporary canvas for the patch
        const patchCanvas = document.createElement('canvas');
        patchCanvas.width = Math.round(rect.width);
        patchCanvas.height = Math.round(rect.height);
        const patchCtx = patchCanvas.getContext('2d');

        if (!patchCtx) {
          console.error('Failed to get canvas context');
          return;
        }

        const img = imgRef.current;

        // Apply filters
        patchCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

        // Draw the cropped region
        patchCtx.drawImage(
          img,
          rect.minX, // source x
          rect.minY, // source y
          rect.width, // source width
          rect.height, // source height
          0, // dest x
          0, // dest y
          rect.width, // dest width
          rect.height  // dest height
        );

        // Convert to blob and download
        patchCanvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `patch_${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('Error capturing patch:', error);
      showError(
        "Patch capture failed",
        "Failed to capture patch. Please try again.",
      );
    } finally {
      setIsPatchProcessing(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!useHiRes && !imageUrl) return;
    
    // Handle patch tool
    if (isPatchMode) {
      const p = getRelativeImagePt(e);
      setPatchStartPoint(p);
      setIsSelectingPatch(true);
      return;
    }

    const p = getRelativeImagePt(e);

    // Annotation tools require a selected layer except select and pan
    // Base image layer cannot be used for annotations
    const requiresLayer =
      selectedTool !== "select" &&
      selectedTool !== "pan" &&
      selectedTool !== "eraser";
    if (requiresLayer && (!selectedLayerId || selectedLayerId === baseImageLayerId)) {
      if (onAutoCreateLayer) {
        onAutoCreateLayer();
        // Show a brief message that a layer was created
        // Note: The layer creation is asynchronous, so the user may need to click again
        return;
      } else {
        showError(
          "Select a layer first",
          "Choose an annotation layer before using drawing tools.",
        );
        return;
      }
    }

    if (selectedTool === "eraser") {
      const targetAnn = findTopmostAnnotation(p, selectedLayerId);
      if (targetAnn) {
        if (onAnnotationDelete) {
          onAnnotationDelete(targetAnn.id);
        } else if (onAnnotationUpdate) {
          const updatedAnn = {
            ...targetAnn,
            erasedRegions: [
              ...(targetAnn.erasedRegions || []),
              { x: p.x, y: p.y, radius: eraserSize },
            ],
          };
          onAnnotationUpdate(updatedAnn);
        }
      }
      return;
    }

    if (selectedTool === "pan") {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (selectedTool === "select") {
      const selected = findTopmostAnnotation(p);
      onAnnotationSelect?.(selected ? selected.id : null);
      return;
    }

    if (selectedTool === "text") {
      setTextPosition(p);
      setShowTextInput(true);
      setTextInput("");
      setIsDrawing(false);
      return;
    }

    setIsDrawing(true);
    setStartPoint(p);
    setCurrentPoints([p]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!useHiRes && !imageUrl) return;

    // Handle patch tool selection
    if (isSelectingPatch && patchStartPoint) {
      const p = getRelativeImagePt(e);
      setPatchEndPoint(p);
      return;
    }

    // immediate cursor feedback via DOM cursor element
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      mouseScreenPos.current = { x: sx, y: sy };
      const imgPt = getRelativeImagePt(e);
      mouseImagePos.current = imgPt;

      if (selectedTool === "eraser" && cursorRef.current) {
        // compute screen radius from image-space eraserSize
        const screenCenter = (() => {
          // map image point to screen:
          const canvasW = canvasDims.width, canvasH = canvasDims.height;
          const centerX = canvasW / 2, centerY = canvasH / 2;
          let x = imgPt.x - imageDims.width / 2;
          let y = imgPt.y - imageDims.height / 2;
          x *= zoom / 100;
          y *= zoom / 100;
          const ang = (rotation * Math.PI) / 180;
          const rx = x * Math.cos(ang) - y * Math.sin(ang);
          const ry = x * Math.sin(ang) + y * Math.cos(ang);
          return { x: rx + centerX + pan.x, y: ry + centerY + pan.y };
        })();
        // map a point at (imgPt.x + eraserSize, imgPt.y) to screen to compute radius
        const imgR = { x: imgPt.x + eraserSize, y: imgPt.y };
        const screenR = (() => {
          const canvasW = canvasDims.width, canvasH = canvasDims.height;
          const centerX = canvasW / 2, centerY = canvasH / 2;
          let x = imgR.x - imageDims.width / 2;
          let y = imgR.y - imageDims.height / 2;
          x *= zoom / 100;
          y *= zoom / 100;
          const ang = (rotation * Math.PI) / 180;
          const rx = x * Math.cos(ang) - y * Math.sin(ang);
          const ry = x * Math.sin(ang) + y * Math.cos(ang);
          return { x: rx + centerX + pan.x, y: ry + centerY + pan.y };
        })();
        const screenRadius = Math.hypot(screenR.x - screenCenter.x, screenR.y - screenCenter.y);

        // position and size the cursor div
        const div = cursorRef.current;
        if (div) {
          div.style.display = "block";
          div.style.left = `${screenCenter.x}px`;
          div.style.top = `${screenCenter.y}px`;
          const diameter = Math.max(2, screenRadius * 2);
          div.style.width = `${diameter}px`;
          div.style.height = `${diameter}px`;
          div.style.marginLeft = `-${diameter / 2}px`;
          div.style.marginTop = `-${diameter / 2}px`;
        }
      } else {
        if (cursorRef.current) cursorRef.current.style.display = "none";
      }
    }

    if (selectedTool === "eraser" && e.buttons === 1) {
      const p = getRelativeImagePt(e);
      const targetAnn = findTopmostAnnotation(p, selectedLayerId);
      if (targetAnn) {
        if (onAnnotationDelete) {
          onAnnotationDelete(targetAnn.id);
        } else if (onAnnotationUpdate) {
          const updatedAnn = {
            ...targetAnn,
            erasedRegions: [
              ...(targetAnn.erasedRegions || []),
              { x: p.x, y: p.y, radius: eraserSize },
            ],
          };
          onAnnotationUpdate(updatedAnn);
        }
      }
      return;
    }

    if (isDragging && selectedTool === "pan") {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
      return;
    }

    if (!isDrawing || !startPoint) return;
    const p = getRelativeImagePt(e);
    if (selectedTool === "freehand") {
      setCurrentPoints((prev) => [...prev, p]);
    } else {
      setCurrentPoints([startPoint, p]);
    }
  };

  nativeMouseMoveRef.current = (event: MouseEvent) => {
    const container = containerRef.current;
    if (!container || !container.contains(event.target as Node)) {
      return;
    }
    const syntheticEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
      buttons: event.buttons,
    } as React.MouseEvent<HTMLDivElement>;
    handleMouseMove(syntheticEvent);
  };

  const handleMouseUp = () => {
    setIsDragging(false);

    // Handle patch tool completion
    if (isSelectingPatch && patchStartPoint && patchEndPoint) {
      const rect = getNormalizedRect(patchStartPoint, patchEndPoint);

      // Check if selection has valid dimensions
      if (rect.width > 5 && rect.height > 5) {
        const confirmed = window.confirm("Do you want to save this image patch?");
        if (confirmed) {
          capturePatch(rect);
        }
      }

      setIsSelectingPatch(false);
      setPatchStartPoint(null);
      setPatchEndPoint(null);
      return;
    }

    if (!isDrawing || !startPoint) return;

    let ann: Annotation | null = null;
    if (selectedTool === "measurement" && currentPoints.length === 2) {
      ann = {
        id: genId(),
        type: "measurement",
        category: annotationCategory,
        color: annotationColor,
        visible: true,
        coordinates: [currentPoints[0], currentPoints[1]],
        layerId: selectedLayerId,
      };
    } else if (selectedTool === "circle" && currentPoints.length === 2) {
      const { minX, minY, maxX, maxY } = getNormalizedRect(
        currentPoints[0],
        currentPoints[1],
      );
      ann = {
        id: genId(),
        type: "circle",
        category: annotationCategory,
        color: annotationColor,
        visible: true,
        coordinates: [
          { x: minX, y: minY },
          { x: maxX, y: maxY },
        ],
        properties: {
          geometry: "bounding-box",
          fillColor: shapeFillColor,
          fillOpacity: shapeFillOpacity,
          strokeColor: shapeStrokeColor,
          strokeWidth: Number(shapeStrokeWidth),
        },
        layerId: selectedLayerId,
      };
    } else if (selectedTool === "rectangle" && currentPoints.length === 2) {
      const { minX, minY, maxX, maxY } = getNormalizedRect(
        currentPoints[0],
        currentPoints[1],
      );
      ann = {
        id: genId(),
        type: "rectangle",
        category: annotationCategory,
        color: annotationColor,
        visible: true,
        coordinates: [
          { x: minX, y: minY },
          { x: maxX, y: maxY },
        ],
        properties: {
          fillColor: shapeFillColor,
          fillOpacity: shapeFillOpacity,
          strokeColor: shapeStrokeColor,
          strokeWidth: Number(shapeStrokeWidth),
        },
        layerId: selectedLayerId,
      };
    } else if (selectedTool === "freehand" && currentPoints.length > 1) {
      ann = {
        id: genId(),
        type: "freehand",
        category: annotationCategory,
        color: annotationColor,
        visible: true,
        coordinates: [...currentPoints],
        properties: {
          fillColor: shapeFillColor,
          fillOpacity: shapeFillOpacity,
          strokeColor: shapeStrokeColor,
          strokeWidth: Number(shapeStrokeWidth),
        },
        layerId: selectedLayerId,
      };
    }
    if (ann) {
      const annotationWithMeasurements = addMeasurementProperties(ann);
      onAnnotationCreate?.(annotationWithMeasurements);
    }

    setIsDrawing(false);
    setStartPoint(null);
    setCurrentPoints([]);
  };

  nativeMouseUpRef.current = (event: MouseEvent) => {
    const container = containerRef.current;
    if (!container || !container.contains(event.target as Node)) {
      return;
    }
    handleMouseUp();
  };

  nativeMouseDownRef.current = (event: MouseEvent) => {
    const container = containerRef.current;
    if (!container || !container.contains(event.target as Node)) {
      return;
    }

    const syntheticEvent = {
      clientX: event.clientX,
      clientY: event.clientY,
      button: event.button,
      currentTarget: container,
      preventDefault: () => event.preventDefault(),
      stopPropagation: () => event.stopPropagation(),
    } as React.MouseEvent<HTMLDivElement>;

    handleMouseDown(syntheticEvent);
  };

  const handleTextSubmit = (e: React.FormEvent | React.FocusEvent) => {
    (e as any)?.preventDefault?.();
    if (!textInput.trim() || !textPosition) {
      setShowTextInput(false);
      setTextInput("");
      setTextPosition(null);
      return;
    }
    onAnnotationCreate?.({
      id: genId(),
      type: "text",
      category: annotationCategory,
      color: annotationColor,
      visible: true,
      coordinates: [textPosition],
      properties: {
        text: textInput,
        fontSize: textFontSize,
        fontFamily: textFontFamily,
        fontWeight: textFontWeight,
        textAlign: textAlign,
        backgroundColor: textBackgroundColor,
        backgroundOpacity: textBackgroundOpacity,
        hasStroke: textHasStroke,
        strokeWidth: textStrokeWidth,
        strokeColor: textStrokeColor,
      },
      layerId: selectedLayerId,
    });
    setShowTextInput(false);
    setTextInput("");
    setTextPosition(null);
  };

  useLayoutEffect(() => {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    canvas.width = canvasDims.width;
    canvas.height = canvasDims.height;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Main annotation compositing canvas (we will draw each annotation's pre-composited temp canvas here)
    const annCanvas = document.createElement("canvas");
    annCanvas.width = canvas.width;
    annCanvas.height = canvas.height;
    const aCtx = annCanvas.getContext("2d");
    if (!aCtx) return;
    aCtx.clearRect(0, 0, annCanvas.width, annCanvas.height);

    const map = (p: Pt): Pt =>
      useHiRes && dziUrl
        ? toScreen.current(p)
        : (() => {
            const canvasW = canvasDims.width,
              canvasH = canvasDims.height;
            const centerX = canvasW / 2,
              centerY = canvasH / 2;
            let x = p.x - imageDims.width / 2;
            let y = p.y - imageDims.height / 2;
            x *= zoom / 100;
            y *= zoom / 100;
            const ang = (rotation * Math.PI) / 180;
            const rx = x * Math.cos(ang) - y * Math.sin(ang);
            const ry = x * Math.sin(ang) + y * Math.cos(ang);
            return { x: rx + centerX + pan.x, y: ry + centerY + pan.y };
          })();

    // Draw base image onto main ctx (image remains untouched by eraser)
    if (!useHiRes && imgRef.current && imageVisible) {
      const img = imgRef.current;
      ctx.save();
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(zoom / 100, zoom / 100);
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      ctx.restore();
    }

    // Helper to draw an annotation onto provided ctx
    const drawAnnOn = (drawCtx: CanvasRenderingContext2D, a: Annotation) => {
      if (!a.visible) return;
      drawCtx.save();

      const isShapeType =
        a.type === "circle" || a.type === "rectangle" || a.type === "freehand";
      const strokeColor = (isShapeType && a.properties?.strokeColor) || a.color;
      const strokeWidth = (isShapeType && a.properties?.strokeWidth) || 2;
      const fillColor = (isShapeType && a.properties?.fillColor) || a.color;
      const fillOpacity =
        isShapeType && a.properties?.fillOpacity !== undefined
          ? a.properties.fillOpacity
          : 0.2;

      drawCtx.strokeStyle = strokeColor;
      if (fillColor === "transparent") {
        drawCtx.fillStyle = "transparent";
      } else {
        const r = parseInt(fillColor.slice(1, 3), 16);
        const g = parseInt(fillColor.slice(3, 5), 16);
        const b = parseInt(fillColor.slice(5, 7), 16);
        drawCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${fillOpacity})`;
      }

      const isSelected = a.id === selectedAnnotationId;
      drawCtx.lineWidth = isSelected ? strokeWidth + 1 : strokeWidth;
      drawCtx.shadowColor = isSelected ? strokeColor : "transparent";
      drawCtx.shadowBlur = isSelected ? 12 : 0;

      if (a.type === "circle" && a.coordinates.length >= 2) {
        const { geometry } = a.properties || {};
        if (geometry === "bounding-box") {
          const [rawStart, rawEnd] = a.coordinates;
          const { minX, minY, maxX, maxY } = getNormalizedRect(
            rawStart,
            rawEnd,
          );
          const s = map({ x: minX, y: minY });
          const e = map({ x: maxX, y: maxY });
          const centerX = (s.x + e.x) / 2;
          const centerY = (s.y + e.y) / 2;
          const radiusX = Math.abs(e.x - s.x) / 2;
          const radiusY = Math.abs(e.y - s.y) / 2;
          drawCtx.beginPath();
          drawCtx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
          drawCtx.stroke();
          drawCtx.fill();
        } else {
          const s = map(a.coordinates[0]),
            e = map(a.coordinates[1]);
          const r = Math.hypot(e.x - s.x, e.y - s.y);
          drawCtx.beginPath();
          drawCtx.arc(s.x, s.y, r, 0, Math.PI * 2);
          drawCtx.stroke();
          drawCtx.fill();
        }
      } else if (a.type === "rectangle" && a.coordinates.length >= 2) {
        const s = map(a.coordinates[0]),
          e = map(a.coordinates[1]);
        drawCtx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
        drawCtx.fillRect(s.x, s.y, e.x - s.x, e.y - s.y);
      } else if (a.type === "freehand" && a.coordinates.length > 1) {
        drawCtx.beginPath();
        const p0 = map(a.coordinates[0]);
        drawCtx.moveTo(p0.x, p0.y);
        a.coordinates.slice(1).forEach((pt) => {
          const p = map(pt);
          drawCtx.lineTo(p.x, p.y);
        });
        drawCtx.stroke();
      } else if (a.type === "measurement" && a.coordinates.length >= 2) {
        const start = map(a.coordinates[0]);
        const end = map(a.coordinates[1]);
        const measurementColor = a.color || annotationColor || DEFAULT_COLOR;
        drawCtx.strokeStyle = measurementColor;
        drawCtx.fillStyle = measurementColor + "33";
        drawCtx.beginPath();
        drawCtx.moveTo(start.x, start.y);
        drawCtx.lineTo(end.x, end.y);
        drawCtx.stroke();

        drawCtx.beginPath();
        drawCtx.arc(start.x, start.y, 3, 0, 2 * Math.PI);
        drawCtx.arc(end.x, end.y, 3, 0, 2 * Math.PI);
        drawCtx.fillStyle = measurementColor;
        drawCtx.fill();

        const length = a.properties?.length;
        const unit = a.properties?.unit || "px";
        const label =
          length !== undefined && typeof length === "number"
            ? formatMeasurement(length, unit)
            : "—";

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;

        drawCtx.save();
        drawCtx.translate(midX, midY - 12);
        drawCtx.font = "12px Inter, sans-serif";
        drawCtx.textAlign = "center";
        drawCtx.textBaseline = "middle";
        const metrics = drawCtx.measureText(label);
        const paddingX = 6;
        const paddingY = 3;
        drawCtx.fillStyle = "rgba(15, 23, 42, 0.85)";
        drawCtx.fillRect(
          -metrics.width / 2 - paddingX,
          -8 - paddingY,
          metrics.width + paddingX * 2,
          16 + paddingY * 2,
        );
        drawCtx.fillStyle = "#ffffff";
        drawCtx.fillText(label, 0, 0);
        drawCtx.restore();
      } else if (a.type === "text" && a.coordinates.length >= 1) {
        const p = map(a.coordinates[0]);
        const text = a.properties?.text || "";
        const fontSize = a.properties?.fontSize || 18;
        const fontFamily = a.properties?.fontFamily || "Arial";
        const fontWeight = a.properties?.fontWeight || "normal";
        const alignment = a.properties?.textAlign || "left";
        const bgColor = a.properties?.backgroundColor || "transparent";
        const bgOpacity = a.properties?.backgroundOpacity ?? 0.7;
        const hasStroke = a.properties?.hasStroke || false;
        const strokeWidth = a.properties?.strokeWidth || 2;
        const strokeColor = a.properties?.strokeColor || "#000000";

        drawCtx.save();
        drawCtx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        drawCtx.textBaseline = "top";

        const lines = text.split("\n");
        const lineHeight = fontSize * 1.3;
        const lineMetrics = lines.map((line) => ({
          text: line,
          width: drawCtx.measureText(line).width,
        }));
        const maxWidth = Math.max(...lineMetrics.map((m) => m.width), 1);
        const totalHeight = lines.length * lineHeight;

        let startX = p.x;
        let bgX = p.x;

        if (alignment === "center") {
          bgX = p.x - maxWidth / 2;
        } else if (alignment === "right") {
          bgX = p.x - maxWidth;
        }

        if (bgColor !== "transparent") {
          const paddingX = 8;
          const paddingY = 6;
          let bgColorRgba = bgColor;
          if (bgColor.startsWith("#")) {
            const r = parseInt(bgColor.slice(1, 3), 16);
            const g = parseInt(bgColor.slice(3, 5), 16);
            const b = parseInt(bgColor.slice(5, 7), 16);
            bgColorRgba = `rgba(${r}, ${g}, ${b}, ${bgOpacity})`;
          } else if (bgColor.startsWith("rgb(")) {
            bgColorRgba = bgColor
              .replace("rgb(", "rgba(")
              .replace(")", `, ${bgOpacity})`);
          }

          drawCtx.fillStyle = bgColorRgba;
          drawCtx.fillRect(
            bgX - paddingX,
            p.y - paddingY,
            maxWidth + paddingX * 2,
            totalHeight + paddingY * 2,
          );
        }

        lines.forEach((line, index) => {
          const lineY = p.y + index * lineHeight;
          let lineX = startX;
          if (alignment === "center") {
            lineX = p.x - lineMetrics[index].width / 2;
          } else if (alignment === "right") {
            lineX = p.x - lineMetrics[index].width;
          }

          if (hasStroke) {
            drawCtx.strokeStyle = strokeColor;
            drawCtx.lineWidth = strokeWidth;
            drawCtx.lineJoin = "round";
            drawCtx.miterLimit = 2;
            drawCtx.strokeText(line, lineX, lineY);
          }
          drawCtx.fillStyle = a.color;
          drawCtx.fillText(line, lineX, lineY);
        });

        drawCtx.restore();
      }

      drawCtx.restore();
    };

    // Draw each annotation into its own temp canvas, apply erasedRegions to that temp canvas only,
    // then composite the temp canvas onto the combined annotation canvas. This guarantees erasedRegions
    // only remove pixels for that single annotation (no cross-annotation erasing).
    for (let i = 0; i < annotations.length; i++) {
      const a = annotations[i];
      if (!a.visible) continue;

      const temp = document.createElement("canvas");
      temp.width = annCanvas.width;
      temp.height = annCanvas.height;
      const tctx = temp.getContext("2d");
      if (!tctx) continue;
      tctx.clearRect(0, 0, temp.width, temp.height);

      // draw the annotation to temp canvas
      drawAnnOn(tctx, a);

      // apply erased regions for THIS annotation only (destination-out on temp canvas)
      if (a.erasedRegions && a.erasedRegions.length > 0) {
        tctx.save();
        tctx.globalCompositeOperation = "destination-out";
        a.erasedRegions.forEach(({ x, y, radius }) => {
          const mp = map({ x, y });
          tctx.beginPath();
          tctx.arc(mp.x, mp.y, radius, 0, 2 * Math.PI);
          tctx.fillStyle = "rgba(0,0,0,1)";
          tctx.fill();
        });
        tctx.restore();
      }

      // composite this annotation's temp onto the combined annotation canvas
      aCtx.drawImage(temp, 0, 0);
    }

    // Finally composite the annotation canvas onto the main canvas
    ctx.drawImage(annCanvas, 0, 0);

    // Draw dynamic preview (while user is drawing) on top of everything
    if (isDrawing && currentPoints.length > 1) {
      ctx.save();
      const isShapeTool =
        selectedTool === "circle" ||
        selectedTool === "rectangle" ||
        selectedTool === "freehand";
      const previewStrokeColor = isShapeTool
        ? shapeStrokeColor
        : annotationColor;
      const previewStrokeWidth = isShapeTool ? (shapeStrokeWidth as number) : 2;
      const previewFillColor = isShapeTool ? shapeFillColor : annotationColor;
      const previewFillOpacity = isShapeTool ? shapeFillOpacity : 0.2;

      ctx.strokeStyle = previewStrokeColor;
      ctx.lineWidth = previewStrokeWidth;

      if (previewFillColor === "transparent") {
        ctx.fillStyle = "transparent";
      } else {
        const r = parseInt(previewFillColor.slice(1, 3), 16);
        const g = parseInt(previewFillColor.slice(3, 5), 16);
        const b = parseInt(previewFillColor.slice(5, 7), 16);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${previewFillOpacity})`;
      }

      if (selectedTool === "circle" && currentPoints.length === 2) {
        const { minX, minY, maxX, maxY } = getNormalizedRect(
          currentPoints[0],
          currentPoints[1],
        );
        const s = map({ x: minX, y: minY });
        const e = map({ x: maxX, y: maxY });
        const centerX = (s.x + e.x) / 2;
        const centerY = (s.y + e.y) / 2;
        const radiusX = Math.abs(e.x - s.x) / 2;
        const radiusY = Math.abs(e.y - s.y) / 2;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      } else if (selectedTool === "rectangle" && currentPoints.length === 2) {
        const { minX, minY, maxX, maxY } = getNormalizedRect(
          currentPoints[0],
          currentPoints[1],
        );
        const s = map({ x: minX, y: minY });
        const e = map({ x: maxX, y: maxY });
        ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
        ctx.fillRect(s.x, s.y, e.x - s.x, e.y - s.y);
      } else if (selectedTool === "freehand" && currentPoints.length > 1) {
        ctx.beginPath();
        const p0 = map(currentPoints[0]);
        ctx.moveTo(p0.x, p0.y);
        currentPoints.slice(1).forEach((pt) => {
          const p = map(pt);
          ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      } else if (selectedTool === "measurement" && currentPoints.length === 2) {
        const start = map(currentPoints[0]);
        const end = map(currentPoints[1]);
        const measurementColor = annotationColor || DEFAULT_COLOR;
        ctx.strokeStyle = measurementColor;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(start.x, start.y, 3, 0, 2 * Math.PI);
        ctx.arc(end.x, end.y, 3, 0, 2 * Math.PI);
        ctx.fillStyle = measurementColor;
        ctx.fill();

        const lengthInUnits = calculateLength(
          currentPoints[0],
          currentPoints[1],
          calibration,
        );
        const label = formatMeasurement(lengthInUnits, calibration.unit);

        const midX = (start.x + end.x) / 2;
        const midY = (start.y + end.y) / 2;
        ctx.save();
        ctx.translate(midX, midY - 12);
        ctx.font = "12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const metrics = ctx.measureText(label);
        const paddingX = 6;
        const paddingY = 3;
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.fillRect(
          -metrics.width / 2 - paddingX,
          -8 - paddingY,
          metrics.width + paddingX * 2,
          16 + paddingY * 2,
        );
        ctx.fillStyle = "#ffffff";
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
      ctx.restore();
    }

    // Draw patch selection rectangle
    if (isSelectingPatch && patchStartPoint && patchEndPoint) {
      const rect = getNormalizedRect(patchStartPoint, patchEndPoint);
      const s = map({ x: rect.minX, y: rect.minY });
      const e = map({ x: rect.maxX, y: rect.maxY });

      ctx.save();

      // Draw darkened overlay outside selection
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Clear the selected area
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(s.x, s.y, e.x - s.x, e.y - s.y);
      ctx.globalCompositeOperation = 'source-over';

      // Draw selection rectangle border
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
      ctx.setLineDash([]);

      // Draw dimension labels
      ctx.font = '12px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const width = Math.round(rect.width);
      const height = Math.round(rect.height);
      const label = `${width} × ${height} px`;

      const labelX = (s.x + e.x) / 2;
      const labelY = s.y - 15;

      // Draw label background
      const metrics = ctx.measureText(label);
      const padding = 4;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(
        labelX - metrics.width / 2 - padding,
        labelY - 8,
        metrics.width + padding * 2,
        16
      );

      // Draw label text
      ctx.fillStyle = '#00ff00';
      ctx.fillText(label, labelX, labelY);

      ctx.restore();
    }

    if (gridEnabled) {
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
          ? {
              r: parseInt(result[1], 16),
              g: parseInt(result[2], 16),
              b: parseInt(result[3], 16),
            }
          : { r: 255, g: 255, b: 255 };
      };
      const rgb = hexToRgb(gridColor);
      ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${gridOpacity})`;
      ctx.lineWidth = 1;
      const g = gridSize;
      for (let x = 0; x <= canvas.width; x += g) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += g) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
    }
  }, [
    useHiRes,
    dziUrl,
    canvasDims,
    imageDims,
    zoom,
    brightness,
    contrast,
    rotation,
    pan,
    gridEnabled,
    gridColor,
    gridOpacity,
    gridSize,
    annotations,
    isDrawing,
    currentPoints,
    selectedTool,
    annotationColor,
    selectedAnnotationId,
    osdViewportVersion,
    eraserSize,
    isSelectingPatch, // Trigger redraw when patch selection state changes
    patchStartPoint, // Trigger redraw when patch start point changes
    patchEndPoint, // Trigger redraw when patch end point changes
  ]);

  useEffect(() => {
    if (selectedTool !== "text" && showTextInput) {
      setShowTextInput(false);
      setTextInput("");
      setTextPosition(null);
    }
  }, [selectedTool, showTextInput]);
 const exportComposite = async (): Promise<Blob> => {
  const container = containerRef.current;      // ← 关键：截共同父容器
  const overlay = overlayRef.current;

  if (!container || !overlay) {
    throw new Error("Viewer not ready");
  }

  // 分支 A：如果是 OSD（DeepZoom）场景，截父容器（= OSD + overlay）
  if (useHiRes && dziUrl) {
    // 可选：导出前隐藏十字/辅助光标，避免出现在截图里
    cursorRef.current?.classList.add("invisible");

    const canvas = await html2canvas(container, {
      useCORS: true,
      backgroundColor: null,   // 白底可改为 "#ffffff"
      scale: 2,                // 2× 导出
      logging: false,
    });

    cursorRef.current?.classList.remove("invisible");

    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))),
        "image/png",
        1.0
      );
    });
  }

  // 分支 B：非 OSD（普通图片）。overlay 已经是底图+标注合成 → 直接 2× 放大导出
  const out = document.createElement("canvas");
  out.width = overlay.width * 2;
  out.height = overlay.height * 2;
  const ctx = out.getContext("2d");
  if (!ctx) throw new Error("Canvas context failed");

  // 提升缩放质量
  ctx.imageSmoothingEnabled = true;
  // @ts-ignore
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(overlay, 0, 0, out.width, out.height);

  return await new Promise<Blob>((resolve, reject) => {
    out.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png",
      1.0
    );
  });
};



  // const exportMask = () =>
  //   new Promise<Blob>((resolve, reject) => {
  //     const c = overlayRef.current;
  //     if (!c) return reject(new Error("no canvas"));
  //     const out = document.createElement("canvas");
  //     out.width = c.width;
  //     out.height = c.height;
  //     const octx = out.getContext("2d");
  //     if (!octx) return reject(new Error("ctx"));

  //     // octx.fillStyle = "black";
  //     // octx.fillRect(0, 0, out.width, out.height);
  //     octx.clearRect(0, 0, out.width, out.height);// Transparent background
  //     // Map function for coordinates
  //     const map = (p: Pt): Pt =>
  //       useHiRes && dziUrl
  //         ? toScreen.current(p)
  //         : (() => {
  //             const canvasW = canvasDims.width,
  //               canvasH = canvasDims.height;
  //             const centerX = canvasW / 2,
  //               centerY = canvasH / 2;
  //             let x = p.x - imageDims.width / 2;
  //             let y = p.y - imageDims.height / 2;
  //             x *= zoom / 100;
  //             y *= zoom / 100;
  //             const ang = (rotation * Math.PI) / 180;
  //             const rx = x * Math.cos(ang) - y * Math.sin(ang);
  //             const ry = x * Math.sin(ang) + y * Math.cos(ang);
  //             return { x: rx + centerX + pan.x, y: ry + centerY + pan.y };
  //           })();

  //     octx.strokeStyle = "white";
  //     // octx.fillStyle = "white";
  //     octx.lineWidth = 2;

  //     annotations.forEach((a) => {
  //       if (!a.visible) return;

  //       if (a.type === "circle" && a.coordinates.length >= 2) {
  //         const { geometry } = a.properties || {};
  //         if (geometry === "bounding-box") {
  //           const [rawStart, rawEnd] = a.coordinates;
  //           const { minX, minY, maxX, maxY } = getNormalizedRect(
  //             rawStart,
  //             rawEnd,
  //           );
  //           const s = map({ x: minX, y: minY });
  //           const e = map({ x: maxX, y: maxY });
  //           const centerX = (s.x + e.x) / 2;
  //           const centerY = (s.y + e.y) / 2;
  //           const radiusX = Math.abs(e.x - s.x) / 2;
  //           const radiusY = Math.abs(e.y - s.y) / 2;
  //           octx.beginPath();
  //           octx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2);
  //           // octx.fill();
  //           octx.stroke();// Just stroke for mask
  //         } else {
  //           const s = map(a.coordinates[0]);
  //           const e = map(a.coordinates[1]);
  //           const r = Math.hypot(e.x - s.x, e.y - s.y);
  //           octx.beginPath();
  //           octx.arc(s.x, s.y, r, 0, Math.PI * 2);
  //           // octx.fill();
  //           octx.stroke();// Just stroke for mask
  //         }
  //       } else if (a.type === "rectangle" && a.coordinates.length >= 2) {
  //         const s = map(a.coordinates[0]);
  //         const e = map(a.coordinates[1]);
  //         // octx.fillRect(s.x, s.y, e.x - s.x, e.y - s.y);
  //         octx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
  //       } else if (a.type === "freehand" && a.coordinates.length > 1) {
  //         octx.beginPath();
  //         const p0 = map(a.coordinates[0]);
  //         octx.moveTo(p0.x, p0.y);
  //         a.coordinates.slice(1).forEach((pt) => {
  //           const p = map(pt);
  //           octx.lineTo(p.x, p.y);
  //         });
  //         // octx.fill();
  //         octx.stroke();// Just stroke for mask
  //       } else if (a.type === "text" && a.coordinates.length >= 1) {
  //         const p = map(a.coordinates[0]);
  //         const text = a.properties?.text || "";
  //         const fontSize = a.properties?.fontSize || 18;
  //         const alignment = a.properties?.textAlign || "left";

  //         // Split text into lines for accurate mask
  //         const lines = text.split("\n");
  //         const lineHeight = fontSize * 1.3;
  //         const avgCharWidth = fontSize * 0.6;
  //         const maxLineLength = Math.max(
  //           ...lines.map((line) => line.length),
  //           1,
  //         );
  //         const estimatedWidth = maxLineLength * avgCharWidth;
  //         const totalHeight = lines.length * lineHeight;

  //         let maskX = p.x;
  //         if (alignment === "center") {
  //           maskX = p.x - estimatedWidth / 2;
  //         } else if (alignment === "right") {
  //           maskX = p.x - estimatedWidth;
  //         }

  //         octx.fillRect(maskX, p.y, estimatedWidth, totalHeight);
  //       }
  //     });

  //     out.toBlob(
  //       (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
  //       "image/png",
  //     );
  //   });
  const nextFrame = () =>
    new Promise<void>((r) => requestAnimationFrame(() => r()));
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
  const captureMaskNow = () =>
  new Promise<Blob>((resolve, reject) => {
    const c = overlayRef.current;
    if (!c) return reject(new Error("no canvas"));

    const out = document.createElement("canvas");
    out.width = c.width;
    out.height = c.height;
    const octx = out.getContext("2d");
    if (!octx) return reject(new Error("ctx"));

    octx.clearRect(0, 0, out.width, out.height);

    const map = (p: Pt): Pt =>
      useHiRes && dziUrl
        ? toScreen.current(p)
        : (() => {
            const canvasW = canvasDims.width,
              canvasH = canvasDims.height;
            const centerX = canvasW / 2,
              centerY = canvasH / 2;
            let x = p.x - imageDims.width / 2;
            let y = p.y - imageDims.height / 2;
            x *= zoom / 100;
            y *= zoom / 100;
            const ang = (rotation * Math.PI) / 180;
            const rx = x * Math.cos(ang) - y * Math.sin(ang);
            const ry = x * Math.sin(ang) + y * Math.cos(ang);
            return { x: rx + centerX + pan.x, y: ry + centerY + pan.y };
          })();

    const hexToRgba = (hex: string, alpha: number) => {
      if (hex === "transparent") return `rgba(0,0,0,0)`;
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    annotations.forEach((a) => {
      if (!a.visible) return;

      const isShape =
        a.type === "circle" || a.type === "rectangle" || a.type === "freehand";
      const strokeColor = (isShape && a.properties?.strokeColor) || a.color;
      const strokeWidth = (isShape && a.properties?.strokeWidth) || 2;
      const fillColor = (isShape && a.properties?.fillColor) || "transparent";
      const fillOpacity =
        isShape && a.properties?.fillOpacity !== undefined
          ? a.properties.fillOpacity
          : 0.2;

      octx.save();
      octx.lineWidth = strokeWidth;
      octx.strokeStyle = strokeColor;
      octx.fillStyle =
        fillColor === "transparent"
          ? "rgba(0,0,0,0)"
          : hexToRgba(fillColor, fillOpacity);

      if (a.type === "circle" && a.coordinates.length >= 2) {
        const { geometry } = a.properties || {};
        if (geometry === "bounding-box") {
          const [rawStart, rawEnd] = a.coordinates;
          const minX = Math.min(rawStart.x, rawEnd.x);
          const minY = Math.min(rawStart.y, rawEnd.y);
          const maxX = Math.max(rawStart.x, rawEnd.x);
          const maxY = Math.max(rawStart.y, rawEnd.y);
          const s = map({ x: minX, y: minY });
          const e = map({ x: maxX, y: maxY });
          const cx = (s.x + e.x) / 2;
          const cy = (s.y + e.y) / 2;
          const rx = Math.abs(e.x - s.x) / 2;
          const ry = Math.abs(e.y - s.y) / 2;
          octx.beginPath();
          octx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          if (fillColor !== "transparent") octx.fill();
          octx.stroke();
        } else {
          const s = map(a.coordinates[0]);
          const e = map(a.coordinates[1]);
          const r = Math.hypot(e.x - s.x, e.y - s.y);
          octx.beginPath();
          octx.arc(s.x, s.y, r, 0, Math.PI * 2);
          if (fillColor !== "transparent") octx.fill();
          octx.stroke();
        }
      } else if (a.type === "rectangle" && a.coordinates.length >= 2) {
        const s = map(a.coordinates[0]);
        const e = map(a.coordinates[1]);
        if (fillColor !== "transparent") {
          octx.fillRect(s.x, s.y, e.x - s.x, e.y - s.y);
        }
        octx.strokeRect(s.x, s.y, e.x - s.x, e.y - s.y);
      } else if (a.type === "freehand" && a.coordinates.length > 1) {
        octx.beginPath();
        const p0 = map(a.coordinates[0]);
        octx.moveTo(p0.x, p0.y);
        a.coordinates.slice(1).forEach((pt) => {
          const p = map(pt);
          octx.lineTo(p.x, p.y);
        });
        octx.stroke();
      }

      octx.restore();
    });

    out.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/png"
    );
  });

const exportMask = async (): Promise<Blob> => {
  // Hi-Res（OSD）：用已注入的 reset
  if (useHiRes && dziUrl && osdResetZoom.current) {
    osdResetZoom.current(); // 回到 Home（整图可见）
    setZoom(100);           // 同步显示百分比
  } else {
    // 普通图：回到 100% 与原点
    setZoom(100);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  }

  // 等一帧，确保画面渲染成“默认视图”
  await sleep(250);

  // 然后按原逻辑截当前窗口
  return await captureMaskNow();
};

  useEffect(() => {
    registerExporter?.({ exportComposite, exportMask });
  }, [
    registerExporter,
    zoom,
    rotation,
    pan,
    annotations,
    useHiRes,
    dziUrl,
    canvasDims,
    imageDims,
  ]);

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-4 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onUndo?.()}
              disabled={!canUndo}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRedo?.()}
              disabled={!canRedo}
            >
              <Redo2 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium w-16 text-center">
              {zoom}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              variant={gridEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setGridEnabled((value) => !value)}
              aria-pressed={gridEnabled}
              title={gridEnabled ? "Hide grid overlay" : "Show grid overlay"}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleReset}>
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant={isPatchMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsPatchMode(!isPatchMode)}
              disabled={isPatchProcessing}
              title={
                isPatchProcessing
                  ? "Processing patch..."
                  : isPatchMode
                    ? "Disable patch tool"
                    : "Enable patch tool"
              }
            >
              {isPatchProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crop className="w-4 h-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Sun className="w-4 h-4" />
              <Label className="text-sm">Brightness</Label>
              <Slider
                value={[brightness]}
                onValueChange={(v) => setBrightness(v[0])}
                min={50}
                max={200}
                step={10}
                className="w-20"
              />
              <span className="text-sm w-12 text-center">{brightness}%</span>
            </div>
            <div className="flex items-center space-x-2">
              <Contrast className="w-4 h-4" />
              <Label className="text-sm">Contrast</Label>
              <Slider
                value={[contrast]}
                onValueChange={(v) => setContrast(v[0])}
                min={50}
                max={200}
                step={10}
                className="w-20"
              />
              <span className="text-sm w-12 text-center">{contrast}%</span>
            </div>
          </div>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-slate-900"
      >
        {useHiRes && dziUrl && imageVisible && (
          <div ref={viewerContainerRef} className="absolute inset-0">
            <OsdViewer
              dziUrl={dziUrl}
              brightness={brightness}
              contrast={contrast}
              rotation={rotation}
              onZoomChange={(z) => {
                setZoom(z);
              }}
              onViewportChange={() => {
                setOsdViewportVersion((v) => v + 1);
              }}
              onReady={({
                screenToImage,
                imageToScreen,
                zoomIn,
                zoomOut,
                resetZoom,
                getZoom,
              }) => {
                toImage.current = screenToImage;
                toScreen.current = imageToScreen;
                osdZoomIn.current = zoomIn;
                osdZoomOut.current = zoomOut;
                osdResetZoom.current = resetZoom;
                osdGetZoom.current = getZoom;
                setZoom(getZoom());
              }}
            />
          </div>
        )}

        {/* floating DOM cursor indicator, for eraser tool */}
        <div
          ref={cursorRef}
          style={{
            position: "absolute",
            pointerEvents: "none",
            borderRadius: "9999px",
            border: "2px dashed rgba(255,255,255,0.9)",
            background: "rgba(255,255,255,0.04)",
            display: "none",
            zIndex: 60,
          }}
        />

        <canvas
          ref={overlayRef}
          className={`absolute inset-0 z-10 w-full h-full ${
            selectedTool === "select"
              ? "cursor-pointer"
              : selectedTool === "pan"
                ? "cursor-move"
                : "cursor-crosshair"
          } ${
            useHiRes && selectedTool === "pan"
              ? "pointer-events-none"
              : "pointer-events-auto"
          }`}
          onMouseDown={
            useHiRes && selectedTool === "pan" ? undefined : handleMouseDown
          }
          onMouseMove={
            useHiRes && selectedTool === "pan" ? undefined : handleMouseMove
          }
          onMouseUp={
            useHiRes && selectedTool === "pan" ? undefined : handleMouseUp
          }
          onMouseLeave={
            useHiRes && selectedTool === "pan" ? undefined : handleMouseUp
          }
        />

        {!useHiRes && !imageUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Card className="p-8 text-center bg-card/80 backdrop-blur-sm">
              <div className="w-16 h-16 mx-auto mb-4 bg-medical-blue/20 rounded-full flex items-center justify-center">
                <Move className="w-8 h-8 text-medical-blue" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Image Loaded</h3>
              <p className="text-muted-foreground">
                Import a biomedical image using the File menu to begin analysis
              </p>
            </Card>
          </div>
        )}

        {showTextInput && textPosition && (
          <div
            style={imageToScreenStyle(textPosition)}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="z-50"
          >
            <Card className="w-96 shadow-2xl border-2 border-primary/20">
              <form
                onSubmit={handleTextSubmit}
                onKeyDown={(event) => {
                  if (
                    event.key === "Escape" &&
                    event.currentTarget === event.target
                  ) {
                    event.preventDefault();
                    setShowTextInput(false);
                    setTextInput("");
                    setTextPosition(null);
                  }
                }}
              >
                <div className="p-4 border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Type className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-base">
                        Add Text Annotation
                      </h3>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-destructive/10"
                      onClick={() => {
                        setShowTextInput(false);
                        setTextInput("");
                        setTextPosition(null);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                </div>

                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="textContent"
                      className="text-sm font-medium flex items-center justify-between"
                    >
                      <span>Text Content</span>
                      <span className="text-xs text-muted-foreground font-normal">
                        {textInput.length} character
                        {textInput.length !== 1 ? "s" : ""}
                      </span>
                    </Label>
                    <textarea
                      id="textContent"
                      autoFocus
                      rows={3}
                      className="w-full px-3 py-2 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent resize-none"
                      style={{
                        color: annotationColor,
                        fontFamily: textFontFamily,
                        fontSize: `${Math.min(textFontSize, 16)}px`,
                        fontWeight: textFontWeight,
                      }}
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder="Enter your annotation text..."
                      onKeyDown={(e) => {
                        if (e.key === "Escape") {
                          e.preventDefault();
                          setShowTextInput(false);
                          setTextInput("");
                          setTextPosition(null);
                        }
                        if (e.key === "Enter" && e.ctrlKey) {
                          e.preventDefault();
                          handleTextSubmit(e);
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="p-4 pt-0 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowTextInput(false);
                      setTextInput("");
                      setTextPosition(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!textInput.trim()}
                  >
                    Add
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
