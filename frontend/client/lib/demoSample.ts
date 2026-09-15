import type { Annotation } from "@/components/AnnotationSidebar";

export const DEMO_IMAGE_ID = "demo-sample-cells";
export const DEMO_QUERY_VALUE = "sample";
export const DEMO_IMAGE_URL = "/demo/sample-cells.svg";

export const DEMO_LAYERS = [
  { id: "demo-base-layer", name: "Synthetic cell sample", visible: true },
  { id: "demo-annotation-layer", name: "Sample annotations", visible: true },
];

export const DEMO_ANNOTATIONS: Annotation[] = [
  {
    id: "demo-nucleus-01",
    type: "circle",
    name: "Nucleus boundary",
    category: "Nucleus",
    color: "#2563eb",
    visible: true,
    layerId: "demo-annotation-layer",
    coordinates: [
      { x: 248, y: 134 },
      { x: 330, y: 212 },
    ],
    properties: {
      geometry: "bounding-box",
      fillColor: "#2563eb",
      fillOpacity: 0.12,
      strokeColor: "#2563eb",
      strokeWidth: 3,
      notes: "Seeded demo annotation. Edit or delete it to try the workflow.",
    },
  },
  {
    id: "demo-cell-region-01",
    type: "rectangle",
    name: "Cell cluster",
    category: "Cell Body",
    color: "#dc2626",
    visible: true,
    layerId: "demo-annotation-layer",
    coordinates: [
      { x: 421, y: 246 },
      { x: 604, y: 389 },
    ],
    properties: {
      fillColor: "#dc2626",
      fillOpacity: 0.1,
      strokeColor: "#dc2626",
      strokeWidth: 3,
      notes: "Synthetic cluster used for the public portfolio demo.",
    },
  },
  {
    id: "demo-measurement-01",
    type: "measurement",
    name: "Example distance",
    category: "Other",
    color: "#059669",
    visible: true,
    layerId: "demo-annotation-layer",
    coordinates: [
      { x: 139, y: 369 },
      { x: 290, y: 466 },
    ],
    properties: {
      length: 179.4,
      unit: "px",
      notes: "Pixel measurement only; no microscope calibration is applied.",
    },
  },
];

export function isDemoImageId(imageId?: string | null) {
  return imageId === DEMO_IMAGE_ID;
}
