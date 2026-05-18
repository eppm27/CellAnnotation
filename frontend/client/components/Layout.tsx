import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import AnnotationSidebar, { Annotation } from "./AnnotationSidebar";
import ImageViewer from "./ImageViewer";
import KeyboardShortcutsDialog from "./KeyboardShortcutsDialog";
import {
  CalibrationDialog,
  type CalibrationSettings,
} from "./CalibrationDialog";
import { api } from "@/lib/api";
import type { ImageExportHandle } from "./ImageViewer";
import { useAuth } from "@/components/auth/AuthContext";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useToast } from "@/components/ui/use-toast";

const getCurrentImageId = () => localStorage.getItem("lastImageId") || "";
const API_BASE = "http://localhost:5001/api";

interface User {
  name: string;
  email: string;
  avatar?: string;
}

interface LayoutProps {
  children?: React.ReactNode;
}

// Default Color must match the ones inside AnnotationSidebar.tsx
const DEFAULT_COLOR = "#ef4444";
const DEFAULT_CATEGORY = "Lesion";

const cloneAnnotations = (items: Annotation[]): Annotation[] =>
  items.map((item) => ({
    ...item,
    coordinates: item.coordinates.map((pt) => ({ ...pt })),
    properties: item.properties ? { ...item.properties } : undefined,
  }));

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  // zoom svs (OSD high-res support)
  const [useHiRes, setUseHiRes] = useState(false);
  const [dziUrl, setDziUrl] = useState<string | null>(null);

  const navigate = useNavigate();
  const [currentImage, setCurrentImage] = useState<string | undefined>(
    undefined,
  );
  const [currentImageId, setCurrentImageId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  // Layers for mask management
  const [layers, setLayers] = useState<
    { id: string; name: string; visible: boolean }[]
  >([]);
  const [baseImageLayerId, setBaseImageLayerId] = useState<string | null>(null);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<
    | "select"
    | "pan"
    | "rectangle"
    | "circle"
    | "freehand"
    | "text"
    | "eraser"
    | "measurement"
  >("select");
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<
    string | null
  >(null);
  const [undoStack, setUndoStack] = useState<Annotation[][]>([]);
  const [redoStack, setRedoStack] = useState<Annotation[][]>([]);
  const [userView, setUserView] = useState<User | undefined>(undefined);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // For tracking color and category for new annotation creation
  const [annotationColor, setAnnotationColor] = useState(DEFAULT_COLOR);
  const [annotationCategory, setAnnotationCategory] =
    useState(DEFAULT_CATEGORY);
  const [annotationColorHistory, setAnnotationColorHistory] = useState<
    string[]
  >([]);
  const exporterRef = useRef<ImageExportHandle | null>(null);

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: "destructive",
    });
  };

  const showSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
    });
  };

  // Grid settings
  const [showGrid, setShowGrid] = useState(false);
  const [gridColor, setGridColor] = useState("#ffffff");
  const [gridOpacity, setGridOpacity] = useState(0.2);
  const [gridSize, setGridSize] = useState(20);
  const [gridColorHistory, setGridColorHistory] = useState<string[]>([]);

  // Keyboard shortcuts help dialog
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);

  // Measurement calibration
  const [showCalibrationDialog, setShowCalibrationDialog] = useState(false);
  const [calibration, setCalibration] = useState<CalibrationSettings>({
    pixelsPerUnit: 1,
    unit: "px",
  });

  // Text settings
  const [textFontSize, setTextFontSize] = useState(18);
  const [textFontFamily, setTextFontFamily] = useState("Arial");
  const [textFontWeight, setTextFontWeight] = useState<"normal" | "bold">(
    "normal",
  );
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">(
    "left",
  );
  const [textBackgroundColor, setTextBackgroundColor] = useState("transparent");
  const [textBackgroundOpacity, setTextBackgroundOpacity] = useState(0.7);
  const [textHasStroke, setTextHasStroke] = useState(false);
  const [textStrokeWidth, setTextStrokeWidth] = useState(2);
  const [textStrokeColor, setTextStrokeColor] = useState("#000000");

  // Shape settings (for ellipse, rectangle, freehand)
  const [shapeFillColor, setShapeFillColor] = useState("transparent");
  const [shapeFillOpacity, setShapeFillOpacity] = useState(0.3);
  const [shapeStrokeColor, setShapeStrokeColor] = useState("#FF0000");
  const [shapeStrokeWidth, setShapeStrokeWidth] = useState(2);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Eraser size state
  const [eraserSize, setEraserSize] = useState<number>(16);

  // Sync shape stroke color with annotation color
  useEffect(() => {
    setShapeStrokeColor(annotationColor);
  }, [annotationColor]);

  // Restore last image on page load
  useEffect(() => {
    try {
      const lastId =
        typeof window !== "undefined"
          ? localStorage.getItem("lastImageId")
          : null;
      if (lastId) {
        setCurrentImageId(lastId);

        // Restore image metadata (SVS or regular image)
        const storedMetadata = localStorage.getItem(`imageMetadata:${lastId}`);
        if (storedMetadata) {
          try {
            const metadata = JSON.parse(storedMetadata);
            if (metadata.useHiRes && metadata.dziUrl) {
              // Restore SVS image
              setUseHiRes(true);
              setDziUrl(metadata.dziUrl);
              setCurrentImage(undefined);
            } else {
              // Restore regular image
              setUseHiRes(false);
              setDziUrl(null);
              setCurrentImage(
                metadata.thumbnailUrl || `/api/files/thumb/${lastId}`,
              );
            }
          } catch {
            // Fallback if metadata parsing fails
            setCurrentImage(`/api/files/thumb/${lastId}`);
          }
        } else {
          // Fallback if no metadata stored (legacy)
          setCurrentImage(`/api/files/thumb/${lastId}`);
        }

        const stored = localStorage.getItem(`annotations:${lastId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) setAnnotations(parsed);
          } catch {}
        }
        // Load layers for this image
        const storedLayers = localStorage.getItem(`layers:${lastId}`);
        if (storedLayers) {
          try {
            const parsedLayers = JSON.parse(storedLayers);
            if (Array.isArray(parsedLayers)) {
              setLayers(parsedLayers);
              // Restore base image layer ID (always the first layer)
              if (parsedLayers.length > 0) {
                setBaseImageLayerId(parsedLayers[0].id);
                // Restore selected layer ID (first annotation layer, not base image)
                const annotationLayer = parsedLayers.find(layer => layer.id !== parsedLayers[0].id);
                if (annotationLayer) {
                  setSelectedLayerId(annotationLayer.id);
                }
              }
            }
          } catch {}
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!user) {
      setUserView(undefined);
      return;
    }

    setUserView({ name: user.email.split("@")[0], email: user.email });
  }, [user]);

  const handleExportAnnotations = () => {
    const name = currentImageId
      ? `annotations_${currentImageId}.json`
      : "annotations.json";
    const json = JSON.stringify(annotations, null, 2);
    downloadBlob(new Blob([json], { type: "application/json" }), name);
  };

  const handleExportMask = async () => {
    if (!exporterRef.current) return;
    try {
      const blob = await exporterRef.current.exportMask();
      const name = currentImageId ? `mask_${currentImageId}.png` : "mask.png";
      downloadBlob(blob, name);
    } catch (e: any) {
      showError(
        "Export mask failed",
        e?.message ?? "Unable to export the mask.",
      );
    }
  };

  const handleExportComposite = async () => {
    if (!exporterRef.current) return;
    try {
      const blob = await exporterRef.current.exportComposite();
      const name = currentImageId
        ? `composite_${currentImageId}.png`
        : "composite.png";
      downloadBlob(blob, name);
    } catch (e: any) {
      showError(
        "Export composite failed",
        e?.message ?? "Unable to export the composite image.",
      );
    }
  };
//---------------------------------------------------------------------import json
const handleAnnotationImport = async (file: File) => {
  if (!file.name.endsWith(".json")) {
    showError(
      "Unsupported file type",
      "Please upload a JSON annotation file.",
    );
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!Array.isArray(parsed)) {
      showError(
        "Invalid annotation file",
        "Expected an array of annotations in the JSON file.",
      );
      return;
    }

    // Create a new layer for the imported annotations
    const importLayerId = genLayerId();
    const importLayerName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const newLayer = { id: importLayerId, name: importLayerName, visible: true };

    // Assign layerId to imported annotations
    const annotationsWithLayer = parsed.map((annotation: any) => ({
      ...annotation,
      layerId: importLayerId,
    }));

    setAnnotations((prev) => {
      
      const existingIds = new Set(prev.map((a: any) => a.id));
      const merged = [
        ...prev,
        ...annotationsWithLayer.filter((a: any) => !existingIds.has(a.id)),
      ];

      
      if (currentImageId) {
        localStorage.setItem(
          `annotations:${currentImageId}`,
          JSON.stringify(merged)
        );
      }

      return merged;
    });

    // Add the new layer
    setLayers((prev) => [...prev, newLayer]);

    showSuccess(
      "Annotations imported",
      `Loaded ${parsed.length} annotation${parsed.length === 1 ? "" : "s"} into layer "${importLayerName}".`,
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "An unexpected error occurred while loading the JSON file.";
    showError("Import failed", `Failed to load annotations: ${message}`);
  }
};


//---------------------------------------------------------------------

  // Handle image import (from AnnotationSidebar)
  const handleImageImport = async (file: File) => {
    const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
    if (
      ext !== ".png" &&
      ext !== ".svs" &&
      ext !== ".tif" &&
      ext !== ".tiff" &&
      ext !== ".jpg" &&
      ext !== ".jpeg"
    ) {
      showError(
        "Unsupported file type",
        "Only PNG, SVS, TIFF, TIF, JPEG, and JPG files are supported.",
      );
      return;
    }

    const fd = new FormData();
    fd.append("file", file, file.name);

    return new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "http://localhost:5001/api/files/upload", true);

      xhr.onloadstart = () => {
        setUploading(true);
        setUploadProgress(0);
      };

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);
        }
      };

      xhr.onerror = () => {
        setUploading(false);
        setUploadProgress(0);
        const base = "Network error while uploading";
        if (ext === ".svs") {
          const details = [
            base,
            "SVS support requires OpenSlide on the backend. Please ensure the backend environment has OpenSlide installed and restart the server.",
            "macOS: brew install openslide",
            "Ubuntu: sudo apt-get update && sudo apt-get install -y libopenslide0 openslide-tools",
            "Windows: Use WSL2 with Ubuntu, or install OpenSlide binaries and ensure they are on PATH.",
            "Then run: make backend (port 5001).",
          ].join(" ");
          showError("SVS upload failed", details);
        } else {
          showError("Upload failed", base);
        }
        resolve();
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const ext = (file.name.split(".").pop() || "").toLowerCase();
            const dzi = data.dzi_url ?? data.dziUrl ?? null;
            const imageId = data.id;

            // Save the image ID and clear annotations
            if (imageId) {
              setCurrentImageId(imageId);
              localStorage.setItem("lastImageId", imageId);
            }
            setAnnotations([]);
            setLayers([]); // Clear layers for new image
            setBaseImageLayerId(null);
            setSelectedLayerId(null);

            // Add a layer for the base image and create Layer 1 for annotations
            const baseLayerId = genLayerId();
            const baseLayerName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            const layer1Id = genLayerId();
            setLayers([
              { id: baseLayerId, name: baseLayerName, visible: true },
              { id: layer1Id, name: "Layer 1", visible: true }
            ]);
            setBaseImageLayerId(baseLayerId);
            setSelectedLayerId(layer1Id);

            if ((ext === "svs" || ext === ".svs") && dzi) {
              setUseHiRes(true);
              setDziUrl(dzi);
              setCurrentImage(undefined);
              setUploadProgress(100);
              setUploading(false);

              // Store SVS metadata for restoration on page reload
            if (imageId) {
              localStorage.setItem(
                `imageMetadata:${imageId}`,
                JSON.stringify({
                  useHiRes: true,
                    dziUrl: dzi,
                    isSVS: true,
                  }),
                );
              }
              return;
            }

            // Non-SVS: use normal mode
            setUseHiRes(false);
            setDziUrl(null);
            setCurrentImage(data.thumbnail_url);
            setUploadProgress(100);

            // Store non-SVS metadata
            if (imageId) {
              localStorage.setItem(
                `imageMetadata:${imageId}`,
                JSON.stringify({
                  useHiRes: false,
                  dziUrl: null,
                  isSVS: false,
                  thumbnailUrl: data.thumbnail_url,
                }),
              );
            }
          } catch {
            showError(
              "Upload failed",
              "Failed to parse upload response from the server.",
            );
          }
        }
        setUploading(false);
        resolve();
      };

      xhr.send(fd);
    });
  };

  // Persist annotations per image ID
  useEffect(() => {
    if (!currentImageId) return;
    try {
      localStorage.setItem(
        `annotations:${currentImageId}`,
        JSON.stringify(annotations),
      );
    } catch {}
  }, [annotations, currentImageId]);

  // Persist layers per image ID
  useEffect(() => {
    if (!currentImageId) return;
    try {
      localStorage.setItem(`layers:${currentImageId}`, JSON.stringify(layers));
    } catch {}
  }, [layers, currentImageId]);

  const handleImageExport = () => {
    if (!currentImage) return;
    const link = document.createElement("a");
    link.href = currentImage;
    link.download = "biomedical-image-annotated.png";
    link.click();
  };

  async function handleDownloadOriginal() {
    const id = getCurrentImageId();
    if (!id) {
      showError(
        "No image available",
        "Upload an image before downloading the original file.",
      );
      return;
    }
    try {
      const url = `${API_BASE}/files/original/${id}`;
      const res = await fetch(url, { method: "GET" });
      if (!res.ok) throw new Error(await res.text());

      const cd = res.headers.get("Content-Disposition") || "";
      const m = /filename\*?=(?:UTF-8''|")?([^\";]+)/i.exec(cd);
      const filename = m ? decodeURIComponent(m[1]) : `original_${id}`;

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(a.href);
      a.remove();
    } catch (e: any) {
      showError(
        "Download failed",
        e?.message ?? "Unable to download the original image.",
      );
    }
  }

  const handleLogin = () => navigate("/");

  const handleLogout = () => {
    logout();
    navigate("/");
    setCurrentImage(undefined);
    setAnnotations([]);
    setLayers([]);
    setBaseImageLayerId(null);
    setSelectedLayerId(null);
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      const lastId = localStorage.getItem("lastImageId");
      if (lastId) {
        localStorage.removeItem(`annotations:${lastId}`);
        localStorage.removeItem(`layers:${lastId}`);
      }
      localStorage.removeItem("lastImageId");
    } catch {}
  };

  const handleToolSelect = (
    toolId:
      | "select"
      | "pan"
      | "rectangle"
      | "circle"
      | "freehand"
      | "text"
      | "eraser"
      | "measurement",
  ) => {
    setSelectedTool(toolId);
  };

  const handleAnnotationUpdate = (annotation: Annotation) => {
    setUndoStack((prevStack) => [...prevStack, cloneAnnotations(annotations)]);
    setRedoStack([]);
    setAnnotations((prev) =>
      prev.map((a) => (a.id === annotation.id ? annotation : a)),
    );
  };

  const handleAnnotationDelete = (annotationId: string) => {
    setUndoStack((prevStack) => [...prevStack, cloneAnnotations(annotations)]);
    setRedoStack([]);
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId));
    setSelectedAnnotationId((prev) => (prev === annotationId ? null : prev));
  };

  const handleAnnotationVisibilityToggle = (annotationId: string) => {
    setAnnotations((prev) =>
      prev.map((a) =>
        a.id === annotationId ? { ...a, visible: !a.visible } : a,
      ),
    );
  };

  const handleImageLoad = (dimensions: { width: number; height: number }) => {
    console.log("Image loaded with dimensions:", dimensions);
  };

  // For mask/text to stick, handle annotation creation from ImageViewer
  const handleAnnotationCreate = (newAnnotation: Annotation) => {
    setUndoStack((prevStack) => [...prevStack, cloneAnnotations(annotations)]);
    setRedoStack([]);
    // attach the annotation to the currently selected layer (if any)
    const annWithLayer = { ...newAnnotation, layerId: selectedLayerId } as any;
    setAnnotations((prev) => [...prev, annWithLayer]);
    setSelectedAnnotationId(newAnnotation.id);
  };

  // Layer helpers
  const genLayerId = () => Math.random().toString(36).slice(2, 9);
  const handleAutoCreateOrSelectLayer1 = () => {
    // Find existing "Layer 1" among annotation layers
    const layer1 = layers.find(l => l.id !== baseImageLayerId && l.name === "Layer 1");
    if (layer1) {
      // Select existing Layer 1
      setSelectedLayerId(layer1.id);
    } else {
      // Create Layer 1
      const id = genLayerId();
      const l = { id, name: "Layer 1", visible: true };
      setLayers((prev) => [...prev, l]);
      setSelectedLayerId(id);
    }
  };
  const handleAddLayer = () => {
    const id = genLayerId();
    // Count only annotation layers (exclude base image layer)
    const annotationLayerCount = layers.filter(l => l.id !== baseImageLayerId).length;
    // If no annotation layers exist, always create "Layer 1"
    const layerName = annotationLayerCount === 0 ? "Layer 1" : `Layer ${annotationLayerCount + 1}`;
    const l = { id, name: layerName, visible: true };
    setLayers((prev) => [...prev, l]);
    setSelectedLayerId(id);
  };
  const handleDeleteLayer = (layerId: string) => {
    let removedBaseLayer = false;
    // If deleting the base image layer, clear the image
    if (layerId === baseImageLayerId) {
      setCurrentImage(undefined);
      setCurrentImageId(null);
      setBaseImageLayerId(null);
      setUseHiRes(false);
      setDziUrl(null);
      removedBaseLayer = true;
      // Clear localStorage for the image
      if (currentImageId) {
        localStorage.removeItem(`imageMetadata:${currentImageId}`);
        localStorage.removeItem(`annotations:${currentImageId}`);
        localStorage.removeItem(`layers:${currentImageId}`);
      }
    }
    setLayers((prev) => prev.filter((p) => p.id !== layerId));
    // remove annotations on that layer
    setAnnotations((prev) => prev.filter((a: any) => a.layerId !== layerId));
    if (selectedLayerId === layerId) setSelectedLayerId(null);
    if (removedBaseLayer) {
      showSuccess(
        "Base layer deleted",
        "Cleared the image layer and its cached data.",
      );
    } else {
      showSuccess(
        "Layer deleted",
        "Removed the layer and its annotations.",
      );
    }
  };
  const handleRenameLayer = (layerId: string, name: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, name } : l)),
    );
  };
  const handleToggleLayerVisibility = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, visible: !l.visible } : l)),
    );
  };
  const handleSelectLayer = (layerId: string | null) => {
    // Prevent selecting the base image layer
    if (layerId === baseImageLayerId) {
      return;
    }
    setSelectedLayerId(layerId);
  };

  const canUndo = undoStack.length > 0;
  const canRedo = redoStack.length > 0;

  const handleUndo = () => {
    if (!canUndo) return;
    setUndoStack((prevUndo) => {
      const nextUndo = [...prevUndo];
      const previous = nextUndo.pop() ?? [];
      setRedoStack((prevRedo) => [...prevRedo, cloneAnnotations(annotations)]);
      setAnnotations(cloneAnnotations(previous));
      setSelectedAnnotationId(null);
      return nextUndo;
    });
  };

  const handleRedo = () => {
    if (!canRedo) return;
    setRedoStack((prevRedo) => {
      const nextRedo = [...prevRedo];
      const restored = nextRedo.pop() ?? [];
      setUndoStack((prevUndo) => [...prevUndo, cloneAnnotations(annotations)]);
      setAnnotations(cloneAnnotations(restored));
      setSelectedAnnotationId(null);
      return nextRedo;
    });
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      // Undo - Ctrl/Cmd + Z
      {
        key: "z",
        ctrl: true,
        description: "Undo last action",
        callback: () => handleUndo(),
      },
      // Redo - Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z
      {
        key: "y",
        ctrl: true,
        description: "Redo last undone action",
        callback: () => handleRedo(),
      },
      {
        key: "z",
        ctrl: true,
        shift: true,
        description: "Redo last undone action",
        callback: () => handleRedo(),
      },
      // Save - Ctrl/Cmd + S
      {
        key: "s",
        ctrl: true,
        description: "Export annotations",
        callback: () => handleExportAnnotations(),
      },
      // Deselect - Escape
      {
        key: "Escape",
        description: "Deselect annotation",
        callback: () => setSelectedAnnotationId(null),
        preventDefault: false, // Allow escape to work in other contexts too
      },
      // Toggle Grid - G
      {
        key: "g",
        description: "Toggle grid",
        callback: () => setShowGrid((prev) => !prev),
      },
      // Tool shortcuts - Number keys 1-8
      {
        key: "1",
        description: "Select tool",
        callback: () => setSelectedTool("select"),
      },
      {
        key: "2",
        description: "Pan tool",
        callback: () => setSelectedTool("pan"),
      },
      {
        key: "3",
        description: "Circle tool",
        callback: () => setSelectedTool("circle"),
      },
      {
        key: "4",
        description: "Rectangle tool",
        callback: () => setSelectedTool("rectangle"),
      },
      {
        key: "5",
        description: "Freehand tool",
        callback: () => setSelectedTool("freehand"),
      },
      {
        key: "6",
        description: "Measurement tool",
        callback: () => setSelectedTool("measurement"),
      },
      {
        key: "7",
        description: "Eraser tool",
        callback: () => setSelectedTool("eraser"),
      },
      {
        key: "8",
        description: "Text tool",
        callback: () => setSelectedTool("text"),
      },
      // Show keyboard shortcuts help - ? or Shift + /
      {
        key: "?",
        description: "Show keyboard shortcuts",
        callback: () => setShowShortcutsDialog(true),
        preventDefault: false,
      },
      {
        key: "/",
        shift: true,
        description: "Show keyboard shortcuts",
        callback: () => setShowShortcutsDialog(true),
        preventDefault: false,
      },
    ],
    enabled: !children, // Only enable shortcuts on the main layout, not when rendering children
  });

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  if (children) {
    return (
      <div className="h-screen flex flex-col bg-background">
        <Header
          user={userView}
          onLogin={handleLogin}
          onLogout={handleLogout}
          onHelpClick={() => setShowShortcutsDialog(true)}
        />
        <div className="flex-1 flex overflow-hidden">{children}</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Header
        user={userView}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onHelpClick={() => setShowShortcutsDialog(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        <AnnotationSidebar
          annotations={annotations}
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          onAnnotationUpdate={handleAnnotationUpdate}
          onAnnotationDelete={handleAnnotationDelete}
          onAnnotationVisibilityToggle={handleAnnotationVisibilityToggle}
          onImageImport={handleImageImport}
          onAnnotationImport={handleAnnotationImport}
          onImageExport={handleDownloadOriginal}
          onExportAnnotations={handleExportAnnotations}
          onExportMask={handleExportMask}
          onExportComposite={handleExportComposite}
          uploading={uploading}
          uploadProgress={uploadProgress}
          annotationColor={annotationColor}
          setAnnotationColor={setAnnotationColor}
          annotationCategory={annotationCategory}
          setAnnotationCategory={setAnnotationCategory}
          selectedAnnotationId={selectedAnnotationId}
          onSelectedAnnotationChange={setSelectedAnnotationId}
          annotationColorHistory={annotationColorHistory}
          setAnnotationColorHistory={setAnnotationColorHistory}
          layers={layers}
          selectedLayerId={selectedLayerId}
          baseImageLayerId={baseImageLayerId}
          onAddLayer={handleAddLayer}
          onDeleteLayer={handleDeleteLayer}
          onRenameLayer={handleRenameLayer}
          onToggleLayerVisibility={handleToggleLayerVisibility}
          onSelectLayer={handleSelectLayer}
          showGrid={showGrid}
          onToggleGrid={() => setShowGrid(!showGrid)}
          gridColor={gridColor}
          setGridColor={setGridColor}
          gridOpacity={gridOpacity}
          setGridOpacity={setGridOpacity}
          gridSize={gridSize}
          setGridSize={setGridSize}
          gridColorHistory={gridColorHistory}
          setGridColorHistory={setGridColorHistory}
          onOpenCalibration={() => setShowCalibrationDialog(true)}
          calibrationUnit={calibration.unit}
          textFontSize={textFontSize}
          setTextFontSize={setTextFontSize}
          textFontFamily={textFontFamily}
          setTextFontFamily={setTextFontFamily}
          textFontWeight={textFontWeight}
          setTextFontWeight={setTextFontWeight}
          textAlign={textAlign}
          setTextAlign={setTextAlign}
          textBackgroundColor={textBackgroundColor}
          setTextBackgroundColor={setTextBackgroundColor}
          textBackgroundOpacity={textBackgroundOpacity}
          setTextBackgroundOpacity={setTextBackgroundOpacity}
          textHasStroke={textHasStroke}
          setTextHasStroke={setTextHasStroke}
          textStrokeWidth={textStrokeWidth}
          setTextStrokeWidth={setTextStrokeWidth}
          textStrokeColor={textStrokeColor}
          setTextStrokeColor={setTextStrokeColor}
          shapeFillColor={shapeFillColor}
          setShapeFillColor={setShapeFillColor}
          shapeFillOpacity={shapeFillOpacity}
          setShapeFillOpacity={setShapeFillOpacity}
          shapeStrokeColor={shapeStrokeColor}
          setShapeStrokeColor={setShapeStrokeColor}
          shapeStrokeWidth={shapeStrokeWidth}
          setShapeStrokeWidth={setShapeStrokeWidth}
          // eraser size controls
          eraserSize={eraserSize}
          setEraserSize={setEraserSize}
        />
        <ImageViewer
          imageUrl={currentImage}
          onImageLoad={handleImageLoad}
          imageVisible={
            baseImageLayerId
              ? layers.find((l) => l.id === baseImageLayerId)?.visible ?? true
              : true
          }
          baseImageLayerId={baseImageLayerId}
          annotations={annotations.filter((a: any) => {
            // show annotation if its layer is visible (or if it has no layer)
            const lid = (a as any).layerId;
            if (!lid) return true;
            const layer = layers.find((l) => l.id === lid);
            return layer ? layer.visible : true;
          })}
          selectedTool={selectedTool}
          selectedLayerId={selectedLayerId}
          onAutoCreateLayer={handleAutoCreateOrSelectLayer1}
          annotationColor={annotationColor}
          annotationCategory={annotationCategory}
          onAnnotationCreate={handleAnnotationCreate}
          onAnnotationDelete={handleAnnotationDelete}
          onAnnotationUpdate={handleAnnotationUpdate}
          registerExporter={(api) => {
            exporterRef.current = api;
          }}
          selectedAnnotationId={selectedAnnotationId}
          onAnnotationSelect={setSelectedAnnotationId}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          useHiRes={useHiRes}
          dziUrl={dziUrl ?? undefined}
          showGrid={showGrid}
          gridColor={gridColor}
          gridOpacity={gridOpacity}
          gridSize={gridSize}
          calibration={calibration}
          textFontSize={textFontSize}
          textFontFamily={textFontFamily}
          textFontWeight={textFontWeight}
          textAlign={textAlign}
          textBackgroundColor={textBackgroundColor}
          textBackgroundOpacity={textBackgroundOpacity}
          textHasStroke={textHasStroke}
          textStrokeWidth={textStrokeWidth}
          textStrokeColor={textStrokeColor}
          shapeFillColor={shapeFillColor}
          shapeFillOpacity={shapeFillOpacity}
          shapeStrokeColor={shapeStrokeColor}
          shapeStrokeWidth={shapeStrokeWidth}
          // eraser
          eraserSize={eraserSize}
        />
      </div>

      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
      />

      {/* Measurement Calibration Dialog */}
      <CalibrationDialog
        open={showCalibrationDialog}
        onOpenChange={setShowCalibrationDialog}
        currentCalibration={calibration}
        onCalibrationChange={setCalibration}
      />
    </div>
  );
}
