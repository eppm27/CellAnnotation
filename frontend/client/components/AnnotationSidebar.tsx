import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  MousePointer,
  Circle,
  Square,
  Pencil,
  Ruler,
  Type,
  Trash2,
  Eye,
  EyeOff,
  Layers,
  Upload,
  Download,
  FileImage,
  Eraser,
  Move,
  Plus,
  Grid3X3,
  ChevronDown,
  ChevronUp,
  List,
  Settings2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatMeasurement as formatMeasurementValue } from "@/lib/measurements";

// Define the tool type union
export type ToolType =
  | "select"
  | "pan"
  | "rectangle"
  | "circle"
  | "freehand"
  | "text"
  | "eraser"
  | "measurement";

export interface AnnotationTool {
  id: ToolType;
  name: string;
  icon: React.ReactNode;
  active: boolean;
}

export interface Annotation {
  id: string;
  type: "rectangle" | "circle" | "freehand" | "text" | "measurement";
  name?: string;
  category: string;
  color: string;
  layerId?: string;
  visible: boolean;
  coordinates: { x: number; y: number }[];
  properties?: {
    notes?: string;
    geometry?: string;
    // Measurement properties
    length?: number; // in calibrated units
    area?: number; // in calibrated units²
    perimeter?: number; // in calibrated units
    unit?: string; // The unit used for measurements (px, μm, mm, cm)
    // Shape formatting properties (for ellipse, rectangle, freehand)
    fillColor?: string;
    fillOpacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    // Text properties
    text?: string;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: "normal" | "bold";
    textAlign?: "left" | "center" | "right";
    backgroundColor?: string;
    backgroundOpacity?: number;
    hasStroke?: boolean;
    [key: string]: any;
  };
}

interface AnnotationSidebarProps {
  annotations: Annotation[];
  selectedTool: ToolType;
  onToolSelect: (toolId: ToolType) => void;
  onAnnotationUpdate: (annotation: Annotation) => void;
  onAnnotationDelete: (annotationId: string) => void;
  onAnnotationVisibilityToggle: (annotationId: string) => void;
  onImageImport: (file: File) => void;
  onAnnotationImport?: (file: File) => void;
  onMaskImport?: (file: File) => void;
  onImageExport: () => void;
  onExportOriginal?: () => void;
  onExportAnnotations?: () => void;
  onExportMask?: () => void;
  onExportComposite?: () => void;
  // layers
  layers?: { id: string; name: string; visible: boolean }[];
  selectedLayerId?: string | null;
  baseImageLayerId?: string | null;
  onAddLayer?: () => void;
  onDeleteLayer?: (layerId: string) => void;
  onRenameLayer?: (layerId: string, name: string) => void;
  onToggleLayerVisibility?: (layerId: string) => void;
  onSelectLayer?: (layerId: string) => void;
  uploading?: boolean;
  uploadProgress?: number;
  annotationColor: string;
  setAnnotationColor: (color: string) => void;
  annotationCategory: string;
  setAnnotationCategory: (category: string) => void;
  selectedAnnotationId: string | null;
  onSelectedAnnotationChange: (annotationId: string | null) => void;
  annotationColorHistory?: string[];
  setAnnotationColorHistory?: (colors: string[]) => void;
  // grid
  showGrid?: boolean;
  onToggleGrid?: () => void;
  gridColor?: string;
  setGridColor?: (color: string) => void;
  gridOpacity?: number;
  setGridOpacity?: (opacity: number) => void;
  gridSize?: number;
  setGridSize?: (size: number) => void;
  gridColorHistory?: string[];
  setGridColorHistory?: (colors: string[]) => void;
  // calibration
  onOpenCalibration?: () => void;
  calibrationUnit?: string;
  // text settings
  textFontSize?: number;
  setTextFontSize?: (size: number) => void;
  textFontFamily?: string;
  setTextFontFamily?: (family: string) => void;
  textFontWeight?: "normal" | "bold";
  setTextFontWeight?: (weight: "normal" | "bold") => void;
  textAlign?: "left" | "center" | "right";
  setTextAlign?: (align: "left" | "center" | "right") => void;
  textBackgroundColor?: string;
  setTextBackgroundColor?: (color: string) => void;
  textBackgroundOpacity?: number;
  setTextBackgroundOpacity?: (opacity: number) => void;
  textHasStroke?: boolean;
  setTextHasStroke?: (hasStroke: boolean) => void;
  textStrokeWidth?: number;
  setTextStrokeWidth?: (width: number) => void;
  textStrokeColor?: string;
  setTextStrokeColor?: (color: string) => void;
  // shape settings (for ellipse, rectangle, freehand)
  shapeFillColor?: string;
  setShapeFillColor?: (color: string) => void;
  shapeFillOpacity?: number;
  setShapeFillOpacity?: (opacity: number) => void;
  shapeStrokeColor?: string;
  setShapeStrokeColor?: (color: string) => void;
  shapeStrokeWidth?: number;
  setShapeStrokeWidth?: (width: number) => void;
  // eraser
  eraserSize?: number;
  setEraserSize?: (size: number) => void;
}

const annotationTools: AnnotationTool[] = [
  {
    id: "select",
    name: "Select",
    icon: <MousePointer className="w-5 h-5" />,
    active: true,
  },
  {
    id: "pan",
    name: "Pan",
    icon: <Move className="w-5 h-5" />,
    active: false,
  },
  {
    id: "circle",
    name: "Ellipse",
    icon: <Circle className="w-5 h-5" />,
    active: false,
  },
  {
    id: "rectangle",
    name: "Rectangle",
    icon: <Square className="w-5 h-5" />,
    active: false,
  },
  {
    id: "freehand",
    name: "Draw",
    icon: <Pencil className="w-5 h-5" />,
    active: false,
  },
  {
    id: "measurement",
    name: "Measure",
    icon: <Ruler className="w-5 h-5" />,
    active: false,
  },
  {
    id: "eraser",
    name: "Eraser",
    icon: <Eraser className="w-5 h-5" />,
    active: false,
  },
  {
    id: "text",
    name: "Text",
    icon: <Type className="w-5 h-5" />,
    active: false,
  },
];

const annotationColors = [
  {
    name: "Medical Blue",
    value: "#3b82f6",
    class: "bg-medical-blue",
    category: "primary",
  },
  // Primary medical colors - high contrast, accessible
  {
    name: "Crimson Red",
    value: "#DC143C",
    class: "bg-red-600",
    category: "primary",
  },
  {
    name: "Royal Blue",
    value: "#4169E1",
    class: "bg-blue-600",
    category: "primary",
  },
  {
    name: "Forest Green",
    value: "#228B22",
    class: "bg-green-600",
    category: "primary",
  },
  {
    name: "Golden Yellow",
    value: "#FFD700",
    class: "bg-yellow-400",
    category: "primary",
  },
  {
    name: "Deep Purple",
    value: "#663399",
    class: "bg-purple-600",
    category: "primary",
  },
  {
    name: "Teal Blue",
    value: "#008080",
    class: "bg-teal-600",
    category: "primary",
  },

  // Secondary colors for variety
  {
    name: "Orange",
    value: "#FF8C00",
    class: "bg-orange-500",
    category: "secondary",
  },
  {
    name: "Magenta",
    value: "#FF00FF",
    class: "bg-pink-500",
    category: "secondary",
  },
  {
    name: "Lime Green",
    value: "#32CD32",
    class: "bg-lime-500",
    category: "secondary",
  },
  {
    name: "Sky Blue",
    value: "#87CEEB",
    class: "bg-sky-400",
    category: "secondary",
  },
  {
    name: "Coral",
    value: "#FF7F50",
    class: "bg-red-400",
    category: "secondary",
  },
  {
    name: "Indigo",
    value: "#4B0082",
    class: "bg-indigo-600",
    category: "secondary",
  },

  // Neutral colors for subtle annotations
  {
    name: "Dark Gray",
    value: "#696969",
    class: "bg-gray-500",
    category: "neutral",
  },
  {
    name: "Light Gray",
    value: "#D3D3D3",
    class: "bg-gray-300",
    category: "neutral",
  },
  {
    name: "Brown",
    value: "#8B4513",
    class: "bg-amber-700",
    category: "neutral",
  },
  {
    name: "Olive",
    value: "#808000",
    class: "bg-yellow-600",
    category: "neutral",
  },
];

const gridColors = [
  // Subtle colors for grid overlays
  { name: "Light Gray", value: "#D3D3D3", class: "bg-gray-300", opacity: 0.2 },
  { name: "White", value: "#FFFFFF", class: "bg-white", opacity: 0.3 },
  { name: "Black", value: "#000000", class: "bg-black", opacity: 0.1 },
  { name: "Blue Gray", value: "#778899", class: "bg-slate-500", opacity: 0.15 },
  { name: "Red Gray", value: "#DC143C", class: "bg-red-300", opacity: 0.1 },
  { name: "Green Gray", value: "#228B22", class: "bg-green-300", opacity: 0.1 },
];

const textColors = [
  // High contrast text colors
  { name: "Black", value: "#000000", class: "bg-black", category: "dark" },
  { name: "White", value: "#FFFFFF", class: "bg-white", category: "light" },
  {
    name: "Dark Blue",
    value: "#000080",
    class: "bg-blue-900",
    category: "dark",
  },
  { name: "Dark Red", value: "#8B0000", class: "bg-red-900", category: "dark" },
  {
    name: "Dark Green",
    value: "#006400",
    class: "bg-green-900",
    category: "dark",
  },
  { name: "Navy", value: "#000080", class: "bg-blue-900", category: "dark" },
];

const annotationCategories = [
  "Cell Body",
  "Nucleus",
  "Cytoplasm",
  "Membrane",
  "Mitosis",
  "Necrosis",
  "Stroma",
  "Immune Cell",
  "Blood Vessel",
  "Tumor",
  "Lesion",
  "Organ",
  "Bone",
  "Tissue",
  "Pathology",
  "Other",
];

const ALL_CATEGORIES_FILTER = "__all_categories__";

const MAX_COLOR_HISTORY = 12; // Maximum number of recent colors to store

export default function AnnotationSidebar({
  annotations,
  selectedTool,
  onToolSelect,
  onAnnotationUpdate,
  onAnnotationDelete,
  onAnnotationVisibilityToggle,
  onImageImport,
  onMaskImport,
  onImageExport,
  onAnnotationImport,
  onExportAnnotations,
  onExportMask,
  onExportComposite,
  uploading = false,
  uploadProgress = 0,
  annotationColor,
  setAnnotationColor,
  annotationCategory,
  setAnnotationCategory,
  selectedAnnotationId,
  onSelectedAnnotationChange,
  annotationColorHistory = [],
  setAnnotationColorHistory,
  layers = [],
  selectedLayerId = null,
  baseImageLayerId = null,
  onAddLayer,
  onDeleteLayer,
  onRenameLayer,
  onToggleLayerVisibility,
  onSelectLayer,
  showGrid = false,
  onToggleGrid,
  gridColor = "#ffffff",
  setGridColor,
  gridOpacity = 0.2,
  setGridOpacity,
  gridSize = 20,
  setGridSize,
  gridColorHistory = [],
  setGridColorHistory,
  onOpenCalibration,
  calibrationUnit = "px",
  textFontSize = 18,
  setTextFontSize,
  textFontFamily = "Arial",
  setTextFontFamily,
  textFontWeight = "normal",
  setTextFontWeight,
  textAlign = "left",
  setTextAlign,
  textBackgroundColor = "transparent",
  setTextBackgroundColor,
  textBackgroundOpacity = 0.7,
  setTextBackgroundOpacity,
  textHasStroke = false,
  setTextHasStroke,
  textStrokeWidth = 2,
  setTextStrokeWidth,
  textStrokeColor = "#000000",
  setTextStrokeColor,
  shapeFillColor = "transparent",
  setShapeFillColor,
  shapeFillOpacity = 0.3,
  setShapeFillOpacity,
  shapeStrokeColor = "#FF0000",
  setShapeStrokeColor,
  shapeStrokeWidth = 2,
  setShapeStrokeWidth,
  // eraser props
  eraserSize = 16,
  setEraserSize,
}: AnnotationSidebarProps) {
  const { toast } = useToast();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const maskInputRef = useRef<HTMLInputElement>(null);
  const annotationInputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editingLayerName, setEditingLayerName] = useState<string>("");
  const [showColorHistory, setShowColorHistory] = useState(true);
  const [showAnnotationColorHistory, setShowAnnotationColorHistory] =
    useState(true);
  const [showShapeFillColorHistory, setShowShapeFillColorHistory] =
    useState(true);
  const [layerDeleteCandidate, setLayerDeleteCandidate] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const [localEraserSize, setLocalEraserSize] = useState<number>(eraserSize);

  useEffect(() => {
    setLocalEraserSize(eraserSize ?? 16);
  }, [eraserSize]);

  // Sync local state when prop changes from parent ! don't remove
  useEffect(() => {
    setLocalEraserSize(eraserSize ?? 16);
  }, [eraserSize]);

  // Custom categories
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  // Shape fill color history
  const [shapeFillColorHistory, setShapeFillColorHistory] = useState<string[]>(
    [],
  );

  // Collapsible section states
  const [isFileManagementOpen, setIsFileManagementOpen] = useState(true);
  const [isToolsOpen, setIsToolsOpen] = useState(true);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isAnnotationsOpen, setIsAnnotationsOpen] = useState(true);
  const [isTextSettingsOpen, setIsTextSettingsOpen] = useState(false);
  const [annotationSearchTerm, setAnnotationSearchTerm] = useState("");
  const [annotationCategoryFilter, setAnnotationCategoryFilter] =
    useState<string>(ALL_CATEGORIES_FILTER);

  // Combined categories list (built-in + custom)
  const allCategories = [...annotationCategories, ...customCategories];
  const currentlySelectedAnnotation = selectedAnnotationId
    ? annotations.find((a) => a.id === selectedAnnotationId)
    : null;
  const shouldShowCategorySelector =
    selectedTool !== "pan" &&
    selectedTool !== "eraser" &&
    !(selectedTool === "select" && currentlySelectedAnnotation);
  const hasActiveAnnotationFilters =
    annotationSearchTerm.trim().length > 0 ||
    annotationCategoryFilter !== ALL_CATEGORIES_FILTER;
  const filteredAnnotations = annotations.filter((annotation) => {
    const matchesCategory =
      annotationCategoryFilter === ALL_CATEGORIES_FILTER ||
      annotation.category === annotationCategoryFilter;
    if (!matchesCategory) {
      return false;
    }

    const query = annotationSearchTerm.trim().toLowerCase();
    if (!query) {
      return true;
    }

    const name = annotation.name || "";
    const notes = annotation.properties?.notes || "";
    const category = annotation.category || "";
    const type = annotation.type || "";

    return [name, notes, category, type].some((field) =>
      field.toLowerCase().includes(query),
    );
  });
  const selectedAnnotationHiddenByFilters =
    !!selectedAnnotationId &&
    !filteredAnnotations.some(
      (annotation) => annotation.id === selectedAnnotationId,
    );

  // Helper function to add a custom category
  const handleAddCustomCategory = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      return;
    }
    if (!allCategories.includes(trimmedName)) {
      setCustomCategories([...customCategories, trimmedName]);
    }
    setAnnotationCategory(trimmedName);
    if (
      selectedTool === "select" &&
      currentlySelectedAnnotation &&
      currentlySelectedAnnotation.category !== trimmedName
    ) {
      onAnnotationUpdate({
        ...currentlySelectedAnnotation,
        category: trimmedName,
      });
    }
    setNewCategoryName("");
    setShowAddCategory(false);
  };

  // Helper function to update annotation color history
  const handleAnnotationColorChange = (color: string) => {
    setAnnotationColor(color);
    if (setAnnotationColorHistory) {
      // Add color to history, remove duplicates, keep last MAX_COLOR_HISTORY colors
      const newHistory = [
        color,
        ...annotationColorHistory.filter((c) => c !== color),
      ].slice(0, MAX_COLOR_HISTORY);
      setAnnotationColorHistory(newHistory);
    }

    // Also update the selected annotation's color if one is selected
    const selectedAnnotation = annotations.find(
      (a) => a.id === selectedAnnotationId,
    );
    if (selectedAnnotation) {
      if (selectedAnnotation.type === "text") {
        // For text annotations, update strokeColor in properties
        onAnnotationUpdate({
          ...selectedAnnotation,
          properties: {
            ...selectedAnnotation.properties,
            strokeColor: color,
          },
        });
      } else if (
        selectedAnnotation.type === "circle" ||
        selectedAnnotation.type === "rectangle" ||
        selectedAnnotation.type === "freehand"
      ) {
        // For shape annotations, update strokeColor in properties
        onAnnotationUpdate({
          ...selectedAnnotation,
          properties: {
            ...selectedAnnotation.properties,
            strokeColor: color,
          },
        });
      } else {
        // For other annotation types, update the main color field
        onAnnotationUpdate({
          ...selectedAnnotation,
          color: color,
        });
      }
    }
  };

  // Helper function to update grid color history
  const handleGridColorChange = (color: string) => {
    setGridColor?.(color);
    if (setGridColorHistory) {
      // Add color to history, remove duplicates, keep last MAX_COLOR_HISTORY colors
      const newHistory = [
        color,
        ...gridColorHistory.filter((c) => c !== color),
      ].slice(0, MAX_COLOR_HISTORY);
      setGridColorHistory(newHistory);
    }
  };

  // Helper function to update shape fill color history
  const handleShapeFillColorChange = (color: string) => {
    setShapeFillColor?.(color);
    updateSelectedShapeAnnotation({ fillColor: color });
    // Add color to history, remove duplicates, keep last MAX_COLOR_HISTORY colors
    const newHistory = [
      color,
      ...shapeFillColorHistory.filter((c) => c !== color),
    ].slice(0, MAX_COLOR_HISTORY);
    setShapeFillColorHistory(newHistory);
  };

  useEffect(() => {
    if (!selectedAnnotationId) return;
    const node = itemRefs.current[selectedAnnotationId];
    if (node) {
      node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedAnnotationId]);

  // Sync text settings with selected text annotation
  useEffect(() => {
    const selectedAnnotation = annotations.find(
      (a) => a.id === selectedAnnotationId,
    );
    if (selectedAnnotation?.type === "text" && selectedAnnotation.properties) {
      // Load the annotation's text properties into the settings
      if (selectedAnnotation.properties.fontSize !== undefined) {
        setTextFontSize?.(selectedAnnotation.properties.fontSize);
      }
      if (selectedAnnotation.properties.fontFamily !== undefined) {
        setTextFontFamily?.(selectedAnnotation.properties.fontFamily);
      }
      if (selectedAnnotation.properties.fontWeight !== undefined) {
        setTextFontWeight?.(selectedAnnotation.properties.fontWeight);
      }
      if (selectedAnnotation.properties.textAlign !== undefined) {
        setTextAlign?.(selectedAnnotation.properties.textAlign);
      }
      if (selectedAnnotation.properties.backgroundColor !== undefined) {
        setTextBackgroundColor?.(selectedAnnotation.properties.backgroundColor);
      }
      if (selectedAnnotation.properties.backgroundOpacity !== undefined) {
        setTextBackgroundOpacity?.(
          selectedAnnotation.properties.backgroundOpacity,
        );
      }
      if (selectedAnnotation.properties.hasStroke !== undefined) {
        setTextHasStroke?.(selectedAnnotation.properties.hasStroke);
      }
      if (selectedAnnotation.properties.strokeWidth !== undefined) {
        setTextStrokeWidth?.(selectedAnnotation.properties.strokeWidth);
      }
      if (selectedAnnotation.properties.strokeColor !== undefined) {
        setTextStrokeColor?.(selectedAnnotation.properties.strokeColor);
      }
    }
  }, [selectedAnnotationId, annotations]);

  // Sync shape settings with selected shape annotation
  useEffect(() => {
    const selectedAnnotation = annotations.find(
      (a) => a.id === selectedAnnotationId,
    );
    if (
      selectedAnnotation &&
      (selectedAnnotation.type === "circle" ||
        selectedAnnotation.type === "rectangle" ||
        selectedAnnotation.type === "freehand") &&
      selectedAnnotation.properties
    ) {
      // Load the annotation's shape properties into the settings
      if (selectedAnnotation.properties.fillColor !== undefined) {
        setShapeFillColor?.(selectedAnnotation.properties.fillColor);
      }
      if (selectedAnnotation.properties.fillOpacity !== undefined) {
        setShapeFillOpacity?.(selectedAnnotation.properties.fillOpacity);
      }
      if (selectedAnnotation.properties.strokeColor !== undefined) {
        setShapeStrokeColor?.(selectedAnnotation.properties.strokeColor);
      }
      if (selectedAnnotation.properties.strokeWidth !== undefined) {
        setShapeStrokeWidth?.(selectedAnnotation.properties.strokeWidth);
      }
    }
  }, [selectedAnnotationId, annotations]);

  // Sync annotation color with selected annotation
  useEffect(() => {
    const selectedAnnotation = annotations.find(
      (a) => a.id === selectedAnnotationId,
    );
    if (selectedAnnotation) {
      let colorToSet = selectedAnnotation.color;
      if (
        selectedAnnotation.type === "text" &&
        selectedAnnotation.properties?.strokeColor
      ) {
        colorToSet = selectedAnnotation.properties.strokeColor;
      } else if (
        (selectedAnnotation.type === "circle" ||
          selectedAnnotation.type === "rectangle" ||
          selectedAnnotation.type === "freehand") &&
        selectedAnnotation.properties?.strokeColor
      ) {
        colorToSet = selectedAnnotation.properties.strokeColor;
      }
      if (colorToSet) {
        setAnnotationColor(colorToSet);
      }
    }
  }, [selectedAnnotationId, annotations]);

  // Helper function to update selected text annotation's properties
  const updateSelectedTextAnnotation = (
    updates: Partial<Annotation["properties"]>,
  ) => {
    const selectedAnnotation = annotations.find(
      (a) => a.id === selectedAnnotationId,
    );
    if (selectedAnnotation?.type === "text") {
      onAnnotationUpdate({
        ...selectedAnnotation,
        properties: {
          ...selectedAnnotation.properties,
          ...updates,
        },
      });
    }
  };

  // Helper function to update selected shape annotation's properties
  const updateSelectedShapeAnnotation = (
    updates: Partial<Annotation["properties"]>,
  ) => {
    const selectedAnnotation = annotations.find(
      (a) => a.id === selectedAnnotationId,
    );
    if (
      selectedAnnotation &&
      (selectedAnnotation.type === "circle" ||
        selectedAnnotation.type === "rectangle" ||
        selectedAnnotation.type === "freehand")
    ) {
      onAnnotationUpdate({
        ...selectedAnnotation,
        properties: {
          ...selectedAnnotation.properties,
          ...updates,
        },
      });
    }
  };

  const handleFileImport = (
    event: React.ChangeEvent<HTMLInputElement>,
    importer: (file: File) => void,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const name = file.name.toLowerCase();
    const isPNG = name.endsWith(".png");
    const isSVS = name.endsWith(".svs");
    const isTIF = name.endsWith(".tif");
    const isJPG = name.endsWith(".jpg");
    const isTIFF = name.endsWith(".tiff");
    const isJPEG = name.endsWith(".jpeg");
    if (!isPNG && !isSVS && !isTIF && !isJPG && !isTIFF && !isJPEG) {
      toast({
        title: "Unsupported file type",
        description:
          "Only PNG, SVS, TIF, TIFF, JPG, and JPEG files are supported.",
        variant: "destructive",
      });
      event.currentTarget.value = "";
      return;
    }

    importer(file);
    event.target.value = "";
  };

  // / Annotation tools require a selected layer except select and pan
  const handleToolButtonClick = (toolId: ToolType) => {
    const requiresLayer = toolId !== "select" && toolId !== "pan";
    if (requiresLayer && !selectedLayerId) {
      toast({
        title: "Select a layer first",
        description: "Choose an annotation layer before using drawing tools.",
        variant: "destructive",
      });
      return;
    }
    onToolSelect(toolId);
  };

  return (
    <div className="w-80 bg-sidebar border-r border-sidebar-border h-full overflow-y-auto">
      <div className="p-4 space-y-3">
        {/* File Management */}
        <Collapsible
          open={isFileManagementOpen}
          onOpenChange={setIsFileManagementOpen}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center">
                    <FileImage className="w-5 h-5 mr-2 text-medical-blue" />
                    File Management
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isFileManagementOpen ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="justify-start"
                        disabled={uploading}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56">
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          imageInputRef.current?.click();
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileImage className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>Import Image</span>
                          <span className="text-xs text-muted-foreground">PNG, JPG, TIF, SVS</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={(event) => {
                          event.preventDefault();
                          annotationInputRef.current?.click();
                        }}
                        className="flex items-center gap-2"
                      >
                        <List className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>Import Annotations</span>
                          <span className="text-xs text-muted-foreground">JSON format</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept=".png,.PNG,.svs,.SVS,.jpg,.jpeg,.JPG,.JPEG,.tif,.tiff,.TIF,.TIFF"
                    className="hidden"
                    onChange={(event) => handleFileImport(event, onImageImport)}
                  />
                  <input
                    ref={maskInputRef}
                    type="file"
                    accept=".png,.PNG,.svs,.SVS,.jpg,.jpeg,.JPG,.JPEG,.tif,.tiff,.TIF,.TIFF"
                    className="hidden"
                    onChange={(event) =>
                      handleFileImport(event, onMaskImport || onImageImport)
                    }
                  />
                  <input
                    ref={annotationInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onAnnotationImport) {
                        onAnnotationImport(file);
                      }
                      e.target.value = "";
                    }}
                  />

                  {uploading && (
                    <div className="space-y-2">
                      <div className="text-xs text-muted-foreground">
                        Uploading...{" "}
                        {Math.max(0, Math.min(100, uploadProgress)).toFixed(0)}%
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="justify-start">
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64">
                      <DropdownMenuItem
                        onSelect={() => {
                          onExportComposite?.();
                        }}
                        className="flex items-center gap-2"
                      >
                        <FileImage className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>Export Composite Image</span>
                          <span className="text-xs text-muted-foreground">PNG with annotations</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          onExportAnnotations?.();
                        }}
                        className="flex items-center gap-2"
                      >
                        <List className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>Export Annotations</span>
                          <span className="text-xs text-muted-foreground">Full resolution JSON</span>
                        </div>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => {
                          onExportMask?.();
                        }}
                        className="flex items-center gap-2"
                      >
                        <Grid3X3 className="w-4 h-4" />
                        <div className="flex flex-col">
                          <span>Export Mask</span>
                          <span className="text-xs text-muted-foreground">Current viewport PNG</span>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Annotation Tools */}
        <Collapsible open={isToolsOpen} onOpenChange={setIsToolsOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center">
                    <Pencil className="w-5 h-5 mr-2 text-medical-blue" />
                    Annotation Tools
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isToolsOpen ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Tool Selection Grid */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Select Tool
                  </Label>
                  <div
                    role="toolbar"
                    aria-label="Annotation tools"
                    className="grid grid-cols-4 gap-2"
                  >
                    {annotationTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => handleToolButtonClick(tool.id)}
                        aria-pressed={selectedTool === tool.id}
                        aria-label={tool.name}
                        title={tool.name}
                        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-150 text-xs focus:outline-none focus:ring-2 focus:ring-ring/40 ${
                          selectedTool === tool.id
                            ? "bg-accent text-accent-foreground shadow-md"
                            : "bg-transparent hover:bg-accent/30"
                        }`}
                      >
                        <div className="flex items-center justify-center">
                          {/* Larger icon container */}
                          <div className="w-7 h-7 flex items-center justify-center">
                            {tool.icon}
                          </div>
                        </div>
                        <span className="truncate w-16 text-center text-[11px] font-medium">
                          {tool.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tool Properties */}
                <div className="space-y-6">
                  {/* Color - Show when drawing tool is active OR when select tool is active and an annotation is selected */}
                  {(() => {
                    const selectedAnnotation = annotations.find(
                      (a) => a.id === selectedAnnotationId,
                    );
                    const isColorControlsVisible =
                      selectedTool !== "pan" && selectedTool !== "eraser";
                    return isColorControlsVisible;
                  })() && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded border-2 border-border"
                          style={{ backgroundColor: annotationColor }}
                        />
                        <Label className="text-sm font-medium">
                          Annotation Color
                        </Label>
                      </div>

                      {/* Primary colors - enhanced grid */}
                      <div className="space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Quick Colors
                        </Label>
                        <div className="grid grid-cols-6 gap-2">
                          {annotationColors
                            .filter((c) => c.category === "primary")
                            .map((color) => (
                              <Button
                                key={color.value}
                                variant="outline"
                                size="sm"
                                className={`h-9 w-9 p-0 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                                  color.class
                                } ${
                                  annotationColor === color.value
                                    ? "ring-2 ring-ring ring-offset-1 shadow-md"
                                    : "hover:shadow-sm"
                                }`}
                                onClick={() =>
                                  handleAnnotationColorChange(color.value)
                                }
                                title={color.name}
                              />
                            ))}
                        </div>
                      </div>

                      {/* Custom color picker with improved layout */}
                      <div className="p-4 bg-muted/30 rounded-lg border space-y-3">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Custom Color
                        </Label>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col items-center gap-2">
                            <Input
                              type="color"
                              value={annotationColor}
                              onChange={(e) =>
                                handleAnnotationColorChange(e.target.value)
                              }
                              className="w-12 h-12 p-1 cursor-pointer border-2 border-border rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            />
                            <span className="text-xs text-muted-foreground">
                              Picker
                            </span>
                          </div>
                          <div className="flex-1 space-y-1">
                            <Input
                              type="text"
                              value={annotationColor}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                  setAnnotationColor(val);
                                }
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                  handleAnnotationColorChange(val);
                                } else {
                                  setAnnotationColor(annotationColor);
                                }
                              }}
                              placeholder="#DC143C"
                              className="font-mono text-sm h-10"
                            />
                            <span className="text-xs text-muted-foreground">
                              Hex code
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Annotation color history */}
                      {annotationColorHistory.length > 0 && (
                        <div className="mt-2">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() =>
                              setShowAnnotationColorHistory(
                                !showAnnotationColorHistory,
                              )
                            }
                          >
                            <Label className="text-xs text-muted-foreground cursor-pointer">
                              Recent Colors (
                              {Math.min(
                                annotationColorHistory.length,
                                MAX_COLOR_HISTORY,
                              )}
                              )
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAnnotationColorHistory(
                                  !showAnnotationColorHistory,
                                );
                              }}
                            >
                              {showAnnotationColorHistory ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {showAnnotationColorHistory && (
                            <div className="grid grid-cols-6 gap-2 mt-1">
                              {annotationColorHistory
                                .slice(0, MAX_COLOR_HISTORY)
                                .map((color, index) => (
                                  <Button
                                    key={`${color}-${index}`}
                                    variant="outline"
                                    size="sm"
                                    style={{ backgroundColor: color }}
                                    className={`h-8 w-8 p-0 ${
                                      annotationColor === color
                                        ? "ring-2 ring-ring"
                                        : ""
                                    }`}
                                    onClick={() =>
                                      handleAnnotationColorChange(color)
                                    }
                                  />
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category - Hide for pan/eraser; show for select when an annotation is selected */}
                  {shouldShowCategorySelector && (
                      <div>
                        <Label
                          htmlFor="category"
                          className="text-sm font-medium"
                        >
                          Category
                        </Label>
                        <Select
                          value={
                            selectedTool === "select" &&
                            currentlySelectedAnnotation
                              ? currentlySelectedAnnotation.category
                              : annotationCategory
                          }
                          onValueChange={(value) => {
                            setAnnotationCategory(value);
                            if (
                              selectedTool === "select" &&
                              currentlySelectedAnnotation &&
                              currentlySelectedAnnotation.category !== value
                            ) {
                              onAnnotationUpdate({
                                ...currentlySelectedAnnotation,
                                category: value,
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {allCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Add custom category */}
                        {!showAddCategory ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddCategory(true)}
                            className="w-full mt-2 text-xs"
                          >
                            + Add Custom Category
                          </Button>
                        ) : (
                          <div className="mt-2 space-y-2">
                            <Input
                              placeholder="Enter category name..."
                              value={newCategoryName}
                              onChange={(e) =>
                                setNewCategoryName(e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleAddCustomCategory();
                                } else if (e.key === "Escape") {
                                  setShowAddCategory(false);
                                  setNewCategoryName("");
                                }
                              }}
                              className="text-xs"
                              autoFocus
                            />
                            <div className="flex gap-2">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={handleAddCustomCategory}
                                className="flex-1 text-xs"
                                disabled={!newCategoryName.trim()}
                              >
                                Add
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowAddCategory(false);
                                  setNewCategoryName("");
                                }}
                                className="flex-1 text-xs"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                  {/* Measurement Calibration - Only show when measurement tool is selected */}
                  {selectedTool === "measurement" && onOpenCalibration && (
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium flex items-center gap-2">
                          <Ruler className="w-4 h-4" />
                          Measurement Scale
                        </Label>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div>
                            <div className="text-sm font-medium">
                              Current Unit
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {calibrationUnit || "px"}{" "}
                              {calibrationUnit && calibrationUnit !== "px"
                                ? "(calibrated)"
                                : "(pixels)"}
                            </div>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={onOpenCalibration}
                            className="flex items-center gap-2"
                          >
                            <Settings2 className="w-3 h-3" />
                            Calibrate
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Calibrate to measure in real-world units (μm, mm, cm)
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Shape Formatting - Show when shape tool is selected OR when select tool is active and a shape is selected */}
                  {(() => {
                    const selectedAnnotation = annotations.find(
                      (a) => a.id === selectedAnnotationId,
                    );
                    const isShapeTool =
                      selectedTool === "circle" ||
                      selectedTool === "rectangle" ||
                      selectedTool === "freehand";
                    const isSelectingShape =
                      selectedTool === "select" &&
                      selectedAnnotation &&
                      (selectedAnnotation.type === "circle" ||
                        selectedAnnotation.type === "rectangle" ||
                        selectedAnnotation.type === "freehand");
                    return isShapeTool || isSelectingShape;
                  })() && (
                    <div className="pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-sm font-medium">
                          Shape Formatting
                        </Label>
                      </div>
                      <div className="space-y-3">
                        {/* Fill */}
                        <div className="space-y-4">
                          {/* Fill Color Header with Quick Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border-2 border-border flex-shrink-0"
                                style={{
                                  backgroundColor:
                                    shapeFillColor === "transparent"
                                      ? "transparent"
                                      : shapeFillColor,
                                  backgroundImage:
                                    shapeFillColor === "transparent"
                                      ? "linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%)"
                                      : "none",
                                }}
                              />
                              <Label className="text-sm font-medium">
                                Fill Color
                              </Label>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleShapeFillColorChange(shapeStrokeColor)
                                }
                                className="h-7 px-2 text-xs"
                                title="Use current stroke color as fill"
                              >
                                Use Stroke
                              </Button>
                              <Button
                                variant={
                                  shapeFillColor === "transparent"
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() =>
                                  handleShapeFillColorChange("transparent")
                                }
                                className="h-7 px-2 text-xs"
                                title="Remove fill color"
                              >
                                None
                              </Button>
                            </div>
                          </div>

                          {/* Color Selection */}
                          <div className="space-y-3">
                            {/* Color Picker and Hex Input */}
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center gap-1">
                                <Input
                                  type="color"
                                  value={
                                    shapeFillColor === "transparent"
                                      ? "#000000"
                                      : shapeFillColor
                                  }
                                  onChange={(e) =>
                                    handleShapeFillColorChange(e.target.value)
                                  }
                                  className="w-12 h-10 p-1 cursor-pointer border-2 border-border rounded-md shadow-sm hover:shadow-md transition-shadow"
                                  title="Click to pick a color"
                                />
                                <span className="text-xs text-muted-foreground">
                                  Picker
                                </span>
                              </div>
                              <div className="flex-1 space-y-1">
                                <Input
                                  type="text"
                                  value={
                                    shapeFillColor === "transparent"
                                      ? ""
                                      : shapeFillColor
                                  }
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                      setShapeFillColor?.(val || "transparent");
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const val = e.target.value;
                                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                      handleShapeFillColorChange(val);
                                    } else {
                                      setShapeFillColor?.(shapeFillColor);
                                    }
                                  }}
                                  placeholder="#DC143C"
                                  className="font-mono text-sm h-10"
                                  title="Enter hex color code"
                                />
                                <span className="text-xs text-muted-foreground">
                                  Hex code
                                </span>
                              </div>
                            </div>

                            {/* Recent Colors */}
                            {shapeFillColorHistory.length > 0 && (
                              <div className="space-y-2">
                                <div
                                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                                  onClick={() =>
                                    setShowShapeFillColorHistory(
                                      !showShapeFillColorHistory,
                                    )
                                  }
                                >
                                  <Label className="text-xs text-muted-foreground cursor-pointer">
                                    Recent Colors (
                                    {shapeFillColorHistory.length})
                                  </Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-5 w-5 p-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowShapeFillColorHistory(
                                        !showShapeFillColorHistory,
                                      );
                                    }}
                                  >
                                    {showShapeFillColorHistory ? (
                                      <ChevronUp className="h-3 w-3" />
                                    ) : (
                                      <ChevronDown className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                                {showShapeFillColorHistory && (
                                  <div className="grid grid-cols-6 gap-1">
                                    {shapeFillColorHistory
                                      .slice(0, MAX_COLOR_HISTORY)
                                      .map((color, index) => (
                                        <Button
                                          key={`${color}-${index}`}
                                          variant="outline"
                                          size="sm"
                                          style={{ backgroundColor: color }}
                                          className={`h-8 w-8 p-0 hover:scale-110 transition-transform ${
                                            shapeFillColor === color
                                              ? "ring-2 ring-ring ring-offset-1"
                                              : ""
                                          }`}
                                          onClick={() =>
                                            handleShapeFillColorChange(color)
                                          }
                                          title={`Use ${color}`}
                                        />
                                      ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Opacity Control - Only show when color is selected */}
                            {shapeFillColor !== "transparent" && (
                              <div className="space-y-2 pt-2">
                                <div className="flex justify-between items-center">
                                  <Label className="text-xs font-medium">
                                    Opacity
                                  </Label>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {Math.round(shapeFillOpacity * 100)}%
                                  </Badge>
                                </div>
                                <Slider
                                  min={0}
                                  max={1}
                                  step={0.05}
                                  value={[shapeFillOpacity]}
                                  onValueChange={(val) => {
                                    setShapeFillOpacity?.(val[0]);
                                    updateSelectedShapeAnnotation({
                                      fillOpacity: val[0],
                                    });
                                  }}
                                  className="w-full"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                  <span>0%</span>
                                  <span>100%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stroke/Border */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-4 h-4 rounded border-2 border-border"
                                style={{ backgroundColor: shapeStrokeColor }}
                              />
                              <Label className="text-sm font-medium">
                                Stroke Width
                              </Label>
                            </div>
                            <Badge
                              variant="secondary"
                              className="text-xs px-2 py-0.5"
                            >
                              {shapeStrokeWidth}px
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            <Slider
                              min={1}
                              max={20}
                              step={0.5}
                              value={[shapeStrokeWidth]}
                              onValueChange={(val) => {
                                setShapeStrokeWidth?.(val[0]);
                                updateSelectedShapeAnnotation({
                                  strokeWidth: val[0],
                                });
                              }}
                              className="w-full"
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Thin (1px)</span>
                              <span>Thick (20px)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Eraser size control */}
                  {selectedTool === "eraser" && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-2">
                        <Eraser className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">
                          Eraser Size
                        </Label>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            Radius
                          </span>
                          <Badge
                            variant="secondary"
                            className="text-xs px-2 py-0.5"
                          >
                            {localEraserSize}px
                          </Badge>
                        </div>
                        <Slider
                          min={4}
                          max={128}
                          step={1}
                          value={[localEraserSize]}
                          onValueChange={(v) => {
                            const val = Math.max(
                              4,
                              Math.min(128, Math.round(v[0])),
                            );
                            setLocalEraserSize(val);
                            setEraserSize?.(val); // notify parent
                          }}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Small (4px)</span>
                          <span>Large (128px)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Text Settings - Show when text tool is selected OR when select tool is active and a text annotation is selected */}
                  {(() => {
                    const selectedAnnotation = annotations.find(
                      (a) => a.id === selectedAnnotationId,
                    );
                    const isTextTool = selectedTool === "text";
                    const isSelectingText =
                      selectedTool === "select" &&
                      selectedAnnotation?.type === "text";
                    return isTextTool || isSelectingText;
                  })() && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center gap-2">
                        <Type className="w-4 h-4 text-muted-foreground" />
                        <Label className="text-sm font-medium">
                          Text Formatting
                        </Label>
                      </div>
                      <div className="space-y-4">
                        {/* Font Family */}
                        <div>
                          <Label
                            htmlFor="fontFamily"
                            className="text-xs text-muted-foreground"
                          >
                            Font Family
                          </Label>
                          <Select
                            value={textFontFamily}
                            onValueChange={(val) => {
                              setTextFontFamily?.(val);
                              updateSelectedTextAnnotation({ fontFamily: val });
                            }}
                          >
                            <SelectTrigger className="mt-1 h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Arial">Arial</SelectItem>
                              <SelectItem value="Helvetica">
                                Helvetica
                              </SelectItem>
                              <SelectItem value="Times New Roman">
                                Times New Roman
                              </SelectItem>
                              <SelectItem value="Georgia">Georgia</SelectItem>
                              <SelectItem value="Courier New">
                                Courier New
                              </SelectItem>
                              <SelectItem value="Verdana">Verdana</SelectItem>
                              <SelectItem value="Inter">Inter</SelectItem>
                              <SelectItem value="Roboto">Roboto</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Font Size */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <Label
                              htmlFor="fontSize"
                              className="text-xs text-muted-foreground"
                            >
                              Font Size
                            </Label>
                            <span className="text-xs text-muted-foreground">
                              {textFontSize}px
                            </span>
                          </div>
                          <Slider
                            id="fontSize"
                            min={8}
                            max={72}
                            step={1}
                            value={[textFontSize]}
                            onValueChange={(val) => {
                              setTextFontSize?.(val[0]);
                              updateSelectedTextAnnotation({
                                fontSize: val[0],
                              });
                            }}
                            className="w-full"
                          />
                        </div>

                        {/* Font Weight & Alignment in one row */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label
                              htmlFor="fontWeight"
                              className="text-xs text-muted-foreground"
                            >
                              Weight
                            </Label>
                            <Select
                              value={textFontWeight}
                              onValueChange={(val: "normal" | "bold") => {
                                setTextFontWeight?.(val);
                                updateSelectedTextAnnotation({
                                  fontWeight: val,
                                });
                              }}
                            >
                              <SelectTrigger className="mt-1 h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div>
                            <Label
                              htmlFor="textAlign"
                              className="text-xs text-muted-foreground"
                            >
                              Align
                            </Label>
                            <div className="grid grid-cols-3 gap-1 mt-1">
                              <Button
                                variant={
                                  textAlign === "left" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  setTextAlign?.("left");
                                  updateSelectedTextAnnotation({
                                    textAlign: "left",
                                  });
                                }}
                                className="h-8 px-1 text-xs"
                              >
                                L
                              </Button>
                              <Button
                                variant={
                                  textAlign === "center" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  setTextAlign?.("center");
                                  updateSelectedTextAnnotation({
                                    textAlign: "center",
                                  });
                                }}
                                className="h-8 px-1 text-xs"
                              >
                                C
                              </Button>
                              <Button
                                variant={
                                  textAlign === "right" ? "default" : "outline"
                                }
                                size="sm"
                                onClick={() => {
                                  setTextAlign?.("right");
                                  updateSelectedTextAnnotation({
                                    textAlign: "right",
                                  });
                                }}
                                className="h-8 px-1 text-xs"
                              >
                                R
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Background */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full border border-border"
                                style={{
                                  backgroundColor:
                                    textBackgroundColor === "transparent"
                                      ? "transparent"
                                      : textBackgroundColor,
                                }}
                              ></div>
                              Background
                            </Label>
                            {textBackgroundColor !== "transparent" && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-0.5"
                              >
                                {Math.round(textBackgroundOpacity * 100)}%
                                opacity
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                Color
                              </Label>
                              <div className="flex gap-2">
                                <div className="relative">
                                  <Input
                                    type="color"
                                    value={
                                      textBackgroundColor === "transparent"
                                        ? "#000000"
                                        : textBackgroundColor
                                    }
                                    onChange={(e) => {
                                      setTextBackgroundColor?.(e.target.value);
                                      updateSelectedTextAnnotation({
                                        backgroundColor: e.target.value,
                                      });
                                    }}
                                    className="w-10 h-8 p-1 cursor-pointer border-2 border-border rounded-md"
                                  />
                                  {textBackgroundColor === "transparent" && (
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-4 h-0.5 bg-muted-foreground rotate-45"></div>
                                    </div>
                                  )}
                                </div>
                                <Button
                                  variant={
                                    textBackgroundColor === "transparent"
                                      ? "default"
                                      : "outline"
                                  }
                                  size="sm"
                                  onClick={() => {
                                    setTextBackgroundColor?.("transparent");
                                    updateSelectedTextAnnotation({
                                      backgroundColor: "transparent",
                                    });
                                  }}
                                  className="h-8 flex-1 text-xs"
                                >
                                  None
                                </Button>
                              </div>
                            </div>

                            {textBackgroundColor !== "transparent" && (
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                  Opacity
                                </Label>
                                <div className="space-y-2">
                                  <Slider
                                    min={0}
                                    max={1}
                                    step={0.05}
                                    value={[textBackgroundOpacity]}
                                    onValueChange={(val) => {
                                      setTextBackgroundOpacity?.(val[0]);
                                      updateSelectedTextAnnotation({
                                        backgroundOpacity: val[0],
                                      });
                                    }}
                                    className="w-full"
                                  />
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>0%</span>
                                    <span>100%</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Text Outline */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">
                              Text Outline
                            </Label>
                            <Button
                              variant={textHasStroke ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const newValue = !textHasStroke;
                                setTextHasStroke?.(newValue);
                                updateSelectedTextAnnotation({
                                  hasStroke: newValue,
                                });
                              }}
                              className="h-6 px-2 text-xs"
                            >
                              {textHasStroke ? "On" : "Off"}
                            </Button>
                          </div>
                          {textHasStroke && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs text-muted-foreground">
                                  Width
                                </Label>
                                <Badge
                                  variant="outline"
                                  className="text-xs px-2 py-0.5"
                                >
                                  {textStrokeWidth}px
                                </Badge>
                              </div>
                              <Slider
                                min={1}
                                max={20}
                                step={0.5}
                                value={[textStrokeWidth]}
                                onValueChange={(val) => {
                                  setTextStrokeWidth?.(val[0]);
                                  updateSelectedTextAnnotation({
                                    strokeWidth: val[0],
                                  });
                                }}
                                className="w-full"
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>1px</span>
                                <span>20px</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Layers management */}
        <Collapsible open={isLayersOpen} onOpenChange={setIsLayersOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center">
                    <Layers className="w-5 h-5 mr-2 text-medical-blue" />
                    Layer Management
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isLayersOpen ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {layers.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No layers. Add one to start.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {layers.map((layer) => (
                        <div
                          key={layer.id}
                          className={`flex items-center justify-between p-2 rounded-md border ${selectedLayerId === layer.id ? "bg-accent border-accent-foreground" : layer.id === baseImageLayerId ? "bg-muted/50 border-muted-foreground/30" : "bg-card hover:bg-accent/50"}`}
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            {/* Layer type icon */}
                            {layer.id === baseImageLayerId ? (
                              <FileImage className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <Layers className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                            {/* Editable layer name */}
                            {editingLayerId === layer.id ? (
                              <Input
                                autoFocus
                                value={editingLayerName}
                                onChange={(e) =>
                                  setEditingLayerName(e.target.value)
                                }
                                onBlur={() => {
                                  if (editingLayerName.trim()) {
                                    onRenameLayer?.(
                                      layer.id,
                                      editingLayerName.trim(),
                                    );
                                  }
                                  setEditingLayerId(null);
                                  setEditingLayerName("");
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    if (editingLayerName.trim()) {
                                      onRenameLayer?.(
                                        layer.id,
                                        editingLayerName.trim(),
                                      );
                                    }
                                    setEditingLayerId(null);
                                    setEditingLayerName("");
                                  } else if (e.key === "Escape") {
                                    setEditingLayerId(null);
                                    setEditingLayerName("");
                                  }
                                }}
                                className="h-7 text-sm flex-1 min-w-0"
                                onClick={(e) => e.stopPropagation()}
                              />
                            ) : (
                              <div
                                className={`text-sm truncate flex-1 min-w-0 ${layer.id === baseImageLayerId ? "cursor-not-allowed opacity-60" : "cursor-pointer"} select-none`}
                                onClick={() => {
                                  if (layer.id !== baseImageLayerId) {
                                    onSelectLayer?.(layer.id);
                                  }
                                }}
                                onDoubleClick={(e) => {
                                  if (layer.id === baseImageLayerId) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setEditingLayerId(layer.id);
                                  setEditingLayerName(layer.name);
                                }}
                                title={
                                  layer.id === baseImageLayerId
                                    ? "Base image layer cannot be selected for annotations"
                                    : "Double-click to rename"
                                }
                              >
                                {layer.name}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingLayerId(layer.id);
                                setEditingLayerName(layer.name);
                              }}
                              title="Rename layer"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                onToggleLayerVisibility?.(layer.id);
                              }}
                              title={
                                layer.visible ? "Hide layer" : "Show layer"
                              }
                            >
                              {layer.visible ? (
                                <Eye className="w-3 h-3" />
                              ) : (
                                <EyeOff className="w-3 h-3" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLayerDeleteCandidate({
                                  id: layer.id,
                                  name: layer.name,
                                });
                              }}
                              title="Delete layer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div>
                    <Button
                      size="sm"
                      onClick={() => onAddLayer?.()}
                      className="w-full justify-center"
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Layer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Annotations List */}
        <Collapsible
          open={isAnnotationsOpen}
          onOpenChange={setIsAnnotationsOpen}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center">
                    <List className="w-5 h-5 mr-2 text-medical-blue" />
                    Annotations (
                    {hasActiveAnnotationFilters
                      ? `${filteredAnnotations.length}/${annotations.length}`
                      : annotations.length}
                    )
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isAnnotationsOpen ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Input
                    value={annotationSearchTerm}
                    onChange={(e) => setAnnotationSearchTerm(e.target.value)}
                    placeholder="Search annotations..."
                    className="h-9 text-sm"
                    aria-label="Search annotations"
                  />
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Select
                        value={annotationCategoryFilter}
                        onValueChange={setAnnotationCategoryFilter}
                      >
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="All categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_CATEGORIES_FILTER}>
                            All categories
                          </SelectItem>
                          {allCategories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {hasActiveAnnotationFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 px-3 text-xs"
                        onClick={() => {
                          setAnnotationSearchTerm("");
                          setAnnotationCategoryFilter(ALL_CATEGORIES_FILTER);
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {annotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No annotations yet. Start annotating the image above.
                  </p>
                ) : filteredAnnotations.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No annotations match the current search or filter.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                    {filteredAnnotations.map((annotation) => {
                      const displayName =
                        annotation.name ||
                        (annotation.type === "circle"
                          ? "Ellipse"
                          : annotation.type === "rectangle"
                            ? "Rectangle"
                            : annotation.type.charAt(0).toUpperCase() +
                              annotation.type.slice(1));
                      const rawNotes = annotation.properties?.notes?.trim();
                      const noteDisplay =
                        rawNotes && rawNotes.length > 0 ? rawNotes : "N/A";

                      // Get type icon
                      const getTypeIcon = () => {
                        switch (annotation.type) {
                          case "rectangle":
                            return <Square className="w-4 h-4" />;
                          case "circle":
                            return <Circle className="w-4 h-4" />;
                          case "freehand":
                            return <Pencil className="w-4 h-4" />;
                          case "text":
                            return <Type className="w-4 h-4" />;
                          case "measurement":
                            return <Ruler className="w-4 h-4" />;
                          default:
                            return <MousePointer className="w-4 h-4" />;
                        }
                      };

                      // Get measurement summary
                      const getMeasurementSummary = () => {
                        if (annotation.type === "measurement") {
                          const length = annotation.properties?.length;
                          const area = annotation.properties?.area;
                          const unit = annotation.properties?.unit || "px";
                          let summary = "";
                          if (length !== undefined) summary += `L: ${length.toFixed(2)} ${unit}`;
                          if (area !== undefined) summary += ` A: ${area.toFixed(2)} ${unit}²`;
                          return summary.trim();
                        }
                        return null;
                      };

                      const measurementSummary = getMeasurementSummary();

                      return (
                        <div
                          key={annotation.id}
                          ref={(el) => {
                            if (el) {
                              itemRefs.current[annotation.id] = el;
                            } else {
                              delete itemRefs.current[annotation.id];
                            }
                          }}
                          className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                            selectedAnnotationId === annotation.id
                              ? "bg-accent border-accent-foreground"
                              : "bg-card hover:bg-accent/50"
                          }`}
                          onClick={() =>
                            onSelectedAnnotationChange(
                              selectedAnnotationId === annotation.id
                                ? null
                                : annotation.id,
                            )
                          }
                        >
                          <div className="flex items-start gap-3">
                            {/* Type icon with color indicator */}
                            <div className="flex flex-col items-center gap-1 flex-shrink-0">
                              <div
                                className="p-1 rounded border"
                                style={{ color: annotation.color }}
                              >
                                {getTypeIcon()}
                              </div>
                            </div>

                            {/* Main content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium truncate">
                                  {displayName}
                                </span>
                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                  {annotation.category}
                                </Badge>
                              </div>

                              <p className="text-xs text-muted-foreground break-words mb-1">
                                Notes: {noteDisplay}
                              </p>

                              {measurementSummary && (
                                <p className="text-xs text-blue-600 font-mono">
                                  {measurementSummary}
                                </p>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center space-x-1 flex-shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAnnotationVisibilityToggle(annotation.id);
                                }}
                              >
                                {annotation.visible ? (
                                  <Eye className="w-3 h-3" />
                                ) : (
                                  <EyeOff className="w-3 h-3" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAnnotationDelete(annotation.id);
                                  if (selectedAnnotationId === annotation.id) {
                                    onSelectedAnnotationChange(null);
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {hasActiveAnnotationFilters &&
                  selectedAnnotationHiddenByFilters && (
                    <p className="text-xs text-muted-foreground text-center">
                      Selected annotation is hidden by current filters.
                    </p>
                  )}

                {/* Annotation Properties - shown when an annotation is selected */}
                {selectedAnnotationId &&
                  (() => {
                    const annotation = annotations.find(
                      (a) => a.id === selectedAnnotationId,
                    );
                    if (!annotation) return null;

                    return (
                      <div className="pt-3 border-t space-y-3">
                        <h4 className="text-sm font-semibold text-muted-foreground">
                          Properties
                        </h4>
                        <div>
                          <Label
                            htmlFor="annotation-name"
                            className="text-sm font-medium"
                          >
                            Name
                          </Label>
                          <Input
                            id="annotation-name"
                            placeholder="Annotation name"
                            value={annotation.name || ""}
                            onChange={(e) => {
                              const updatedAnnotation = {
                                ...annotation,
                                name: e.target.value,
                              };
                              onAnnotationUpdate(updatedAnnotation);
                            }}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label
                            htmlFor="annotation-notes"
                            className="text-sm font-medium"
                          >
                            Notes
                          </Label>
                          <Input
                            id="annotation-notes"
                            placeholder="Add notes..."
                            value={annotation.properties?.notes || ""}
                            onChange={(e) => {
                              const updatedAnnotation = {
                                ...annotation,
                                properties: {
                                  ...annotation.properties,
                                  notes: e.target.value,
                                },
                              };
                              onAnnotationUpdate(updatedAnnotation);
                            }}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Category
                          </Label>
                          <Select
                            value={annotation.category}
                            onValueChange={(value) => {
                              if (annotation.category !== value) {
                                onAnnotationUpdate({
                                  ...annotation,
                                  category: value,
                                });
                              }
                              setAnnotationCategory(value);
                            }}
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {allCategories.map((category) => (
                                <SelectItem
                                  key={`selected-annotation-category-${category}`}
                                  value={category}
                                >
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm font-medium">
                            Quick Colors
                          </Label>
                          <div className="grid grid-cols-6 gap-2 mt-2">
                            {annotationColors
                              .filter((c) => c.category === "primary")
                              .map((color) => (
                                <Button
                                  key={`selected-${color.value}`}
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  className={`h-8 w-8 p-0 rounded-md border-2 transition-all ${
                                    color.class
                                  } ${
                                    annotation.color === color.value
                                      ? "ring-2 ring-ring ring-offset-1"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    handleAnnotationColorChange(color.value)
                                  }
                                  title={color.name}
                                />
                              ))}
                          </div>
                        </div>

                        {/* Measurements Section */}
                        {(annotation.type === "measurement" ||
                          annotation.type === "rectangle" ||
                          annotation.type === "circle" ||
                          annotation.type === "freehand") && (
                          <div className="space-y-3 pt-3 border-t">
                            <Label className="text-sm font-medium">
                              Measurements
                            </Label>

                            {/* Length (for measurement tool) */}
                            {annotation.type === "measurement" &&
                              annotation.properties?.length !== undefined && (
                                <div>
                                  <Label className="text-xs text-muted-foreground">
                                    Length
                                  </Label>
                                  <div className="mt-1 text-sm font-medium">
                                    {formatMeasurementValue(
                                      annotation.properties.length,
                                      annotation.properties.unit || "px",
                                    )}
                                  </div>
                                </div>
                              )}

                            {/* Area (for shapes) */}
                            {annotation.properties?.area !== undefined && (
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Area
                                </Label>
                                <div className="mt-1 text-sm font-medium">
                                  {formatMeasurementValue(
                                    annotation.properties.area,
                                    annotation.properties.unit || "px",
                                    "area",
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Perimeter (for shapes) */}
                            {annotation.properties?.perimeter !== undefined && (
                              <div>
                                <Label className="text-xs text-muted-foreground">
                                  Perimeter
                                </Label>
                                <div className="mt-1 text-sm font-medium">
                                  {formatMeasurementValue(
                                    annotation.properties.perimeter,
                                    annotation.properties.unit || "px",
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Grid Settings */}
        <Collapsible open={isGridOpen} onOpenChange={setIsGridOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="pb-3 cursor-pointer hover:bg-accent/50 transition-colors">
                <CardTitle className="text-lg font-semibold flex items-center justify-between">
                  <div className="flex items-center">
                    <Grid3X3 className="w-5 h-5 mr-2 text-medical-blue" />
                    Grid Settings
                  </div>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${isGridOpen ? "rotate-180" : ""}`}
                  />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="grid-toggle" className="text-sm font-medium">
                    Show Grid
                  </Label>
                  <Button
                    id="grid-toggle"
                    variant={showGrid ? "default" : "outline"}
                    size="sm"
                    onClick={onToggleGrid}
                  >
                    {showGrid ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                {showGrid && (
                  <>
                    <div>
                      <Label
                        htmlFor="grid-color"
                        className="text-sm font-medium"
                      >
                        Grid Color
                      </Label>

                      {/* Preset colors for grid */}
                      <div className="grid grid-cols-6 gap-1 mt-2">
                        {gridColors.map((color) => (
                          <Button
                            key={color.value}
                            variant="outline"
                            size="sm"
                            className={`h-8 w-8 p-0 ${color.class} hover:scale-110 transition-transform ${
                              gridColor === color.value
                                ? "ring-2 ring-ring ring-offset-1"
                                : ""
                            }`}
                            onClick={() => handleGridColorChange(color.value)}
                            title={`${color.name} (${Math.round(color.opacity * 100)}% opacity)`}
                          />
                        ))}
                      </div>

                      {/* Custom color picker */}
                      <div className="mt-3 p-3 bg-muted/30 rounded-lg border">
                        <Label className="text-xs text-muted-foreground mb-2 block font-medium">
                          Custom Color
                        </Label>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center gap-1">
                            <Input
                              type="color"
                              value={gridColor}
                              onChange={(e) =>
                                handleGridColorChange(e.target.value)
                              }
                              className="w-12 h-10 p-1 cursor-pointer border-2 border-border rounded-md shadow-sm"
                            />
                            <span className="text-xs text-muted-foreground">
                              Picker
                            </span>
                          </div>
                          <div className="flex-1">
                            <Input
                              type="text"
                              value={gridColor}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                                  setGridColor?.(val);
                                }
                              }}
                              onBlur={(e) => {
                                const val = e.target.value;
                                if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                                  handleGridColorChange(val);
                                } else {
                                  setGridColor?.(gridColor);
                                }
                              }}
                              placeholder="#D3D3D3"
                              className="font-mono text-sm h-10"
                            />
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Hex code
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Color history */}
                      {gridColorHistory.length > 0 && (
                        <div className="mt-2">
                          <div
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() =>
                              setShowColorHistory(!showColorHistory)
                            }
                          >
                            <Label className="text-xs text-muted-foreground cursor-pointer">
                              Recent Colors (
                              {Math.min(
                                gridColorHistory.length,
                                MAX_COLOR_HISTORY,
                              )}
                              )
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowColorHistory(!showColorHistory);
                              }}
                            >
                              {showColorHistory ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          {showColorHistory && (
                            <div className="grid grid-cols-6 gap-2 mt-1">
                              {gridColorHistory
                                .slice(0, MAX_COLOR_HISTORY)
                                .map((color, index) => (
                                  <Button
                                    key={`${color}-${index}`}
                                    variant="outline"
                                    size="sm"
                                    style={{ backgroundColor: color }}
                                    className={`h-8 w-8 p-0 ${
                                      gridColor === color
                                        ? "ring-2 ring-ring"
                                        : ""
                                    }`}
                                    onClick={() => handleGridColorChange(color)}
                                  />
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="grid-opacity"
                        className="text-sm font-medium"
                      >
                        Opacity: {Math.round(gridOpacity * 100)}%
                      </Label>
                      <Slider
                        id="grid-opacity"
                        value={[gridOpacity]}
                        min={0}
                        max={1}
                        step={0.05}
                        onValueChange={(values) => setGridOpacity?.(values[0])}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="grid-size"
                        className="text-sm font-medium"
                      >
                        Grid Size: {gridSize}px
                      </Label>
                      <Slider
                        id="grid-size"
                        value={[gridSize]}
                        min={10}
                        max={100}
                        step={5}
                        onValueChange={(values) => setGridSize?.(values[0])}
                        className="mt-2"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
        <AlertDialog
          open={!!layerDeleteCandidate}
          onOpenChange={(open) => {
            if (!open) {
              setLayerDeleteCandidate(null);
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete layer?</AlertDialogTitle>
              <AlertDialogDescription>
                {layerDeleteCandidate
                  ? `Layer "${layerDeleteCandidate.name}" and all annotations on it will be permanently removed. This action cannot be undone.`
                  : null}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setLayerDeleteCandidate(null)}
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  if (layerDeleteCandidate) {
                    onDeleteLayer?.(layerDeleteCandidate.id);
                    setLayerDeleteCandidate(null);
                  }
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
