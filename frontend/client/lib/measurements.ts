import type { CalibrationSettings } from "@/components/CalibrationDialog";

export interface Point {
  x: number;
  y: number;
}

export interface MeasurementResult {
  length?: number;
  area?: number;
  perimeter?: number;
  unit: string;
}

/**
 * Convert pixels to calibrated units
 */
export function pixelsToUnits(
  pixels: number,
  calibration: CalibrationSettings,
): number {
  if (calibration.unit === "px") {
    return pixels;
  }
  return pixels / calibration.pixelsPerUnit;
}

/**
 * Calculate distance between two points in pixels
 */
export function calculateDistance(p1: Point, p2: Point): number {
  return Math.hypot(p2.x - p1.x, p2.y - p1.y);
}

/**
 * Calculate length in calibrated units
 */
export function calculateLength(
  p1: Point,
  p2: Point,
  calibration: CalibrationSettings,
): number {
  const distanceInPixels = calculateDistance(p1, p2);
  return pixelsToUnits(distanceInPixels, calibration);
}

/**
 * Calculate area of a rectangle in calibrated units²
 */
export function calculateRectangleArea(
  start: Point,
  end: Point,
  calibration: CalibrationSettings,
): number {
  const widthPx = Math.abs(end.x - start.x);
  const heightPx = Math.abs(end.y - start.y);
  const areaPx = widthPx * heightPx;

  if (calibration.unit === "px") {
    return areaPx;
  }

  // Convert area: (pixels²) / (pixelsPerUnit²) = units²
  return areaPx / (calibration.pixelsPerUnit * calibration.pixelsPerUnit);
}

/**
 * Calculate perimeter of a rectangle in calibrated units
 */
export function calculateRectanglePerimeter(
  start: Point,
  end: Point,
  calibration: CalibrationSettings,
): number {
  const widthPx = Math.abs(end.x - start.x);
  const heightPx = Math.abs(end.y - start.y);
  const perimeterPx = 2 * (widthPx + heightPx);

  return pixelsToUnits(perimeterPx, calibration);
}

/**
 * Calculate area of a circle in calibrated units²
 */
export function calculateCircleArea(
  center: Point,
  edge: Point,
  calibration: CalibrationSettings,
): number {
  const radiusPx = calculateDistance(center, edge);
  const areaPx = Math.PI * radiusPx * radiusPx;

  if (calibration.unit === "px") {
    return areaPx;
  }

  return areaPx / (calibration.pixelsPerUnit * calibration.pixelsPerUnit);
}

/**
 * Calculate circumference of a circle in calibrated units
 */
export function calculateCirclePerimeter(
  center: Point,
  edge: Point,
  calibration: CalibrationSettings,
): number {
  const radiusPx = calculateDistance(center, edge);
  const circumferencePx = 2 * Math.PI * radiusPx;

  return pixelsToUnits(circumferencePx, calibration);
}

/**
 * Calculate area of a polygon (freehand) using shoelace formula
 */
export function calculatePolygonArea(
  points: Point[],
  calibration: CalibrationSettings,
): number {
  if (points.length < 3) return 0;

  let areaPx = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    areaPx += points[i].x * points[j].y;
    areaPx -= points[j].x * points[i].y;
  }
  areaPx = Math.abs(areaPx) / 2;

  if (calibration.unit === "px") {
    return areaPx;
  }

  return areaPx / (calibration.pixelsPerUnit * calibration.pixelsPerUnit);
}

/**
 * Calculate perimeter of a polygon (freehand)
 */
export function calculatePolygonPerimeter(
  points: Point[],
  calibration: CalibrationSettings,
): number {
  if (points.length < 2) return 0;

  let perimeterPx = 0;
  for (let i = 0; i < points.length - 1; i++) {
    perimeterPx += calculateDistance(points[i], points[i + 1]);
  }

  // Close the polygon if it's not already closed
  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  if (firstPoint.x !== lastPoint.x || firstPoint.y !== lastPoint.y) {
    perimeterPx += calculateDistance(lastPoint, firstPoint);
  }

  return pixelsToUnits(perimeterPx, calibration);
}

/**
 * Format measurement value with appropriate precision and unit
 */
export function formatMeasurement(
  value: number,
  unit: string,
  type: "length" | "area" | "perimeter" = "length",
): string {
  // Determine precision based on unit and value
  let precision = 2;
  if (unit === "μm") {
    precision = value < 10 ? 3 : value < 100 ? 2 : 1;
  } else if (unit === "mm" || unit === "cm") {
    precision = value < 1 ? 3 : 2;
  } else if (unit === "px") {
    precision = 0;
  }

  const formattedValue = value.toFixed(precision);

  if (type === "area") {
    return `${formattedValue} ${unit}²`;
  }

  return `${formattedValue} ${unit}`;
}

/**
 * Get unit label with superscript for area
 */
export function getUnitLabel(unit: string, isArea: boolean = false): string {
  if (isArea) {
    return `${unit}²`;
  }
  return unit;
}
