import { describe, expect, it } from "vitest";
import {
  calculateCircleArea,
  calculateCirclePerimeter,
  calculateLength,
  calculatePolygonArea,
  calculatePolygonPerimeter,
  calculateRectangleArea,
  calculateRectanglePerimeter,
  formatMeasurement,
  getUnitLabel,
  pixelsToUnits,
} from "@/lib/measurements";

const pxCalibration = { pixelsPerUnit: 1, unit: "px" as const };
const umCalibration = { pixelsPerUnit: 2, unit: "μm" as const };

describe("measurements utilities", () => {
  it("converts pixels using calibration", () => {
    expect(pixelsToUnits(10, pxCalibration)).toBe(10);
    expect(pixelsToUnits(10, umCalibration)).toBe(5);
  });

  it("computes linear metrics", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(calculateLength(p1, p2, pxCalibration)).toBeCloseTo(5);
    expect(calculateLength(p1, p2, umCalibration)).toBeCloseTo(2.5);
  });

  it("computes rectangle metrics", () => {
    const start = { x: 0, y: 0 };
    const end = { x: 4, y: 3 };
    expect(calculateRectangleArea(start, end, pxCalibration)).toBe(12);
    expect(calculateRectanglePerimeter(start, end, pxCalibration)).toBe(14);
    expect(calculateRectangleArea(start, end, umCalibration)).toBe(3);
  });

  it("computes circle metrics", () => {
    const center = { x: 0, y: 0 };
    const edge = { x: 3, y: 4 };
    expect(calculateCircleArea(center, edge, pxCalibration)).toBeCloseTo(
      Math.PI * 25,
    );
    expect(calculateCirclePerimeter(center, edge, umCalibration)).toBeCloseTo(
      (2 * Math.PI * 5) / 2,
    );
  });

  it("computes polygon metrics", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
    ];
    expect(calculatePolygonArea(square, pxCalibration)).toBe(16);
    expect(calculatePolygonPerimeter(square, pxCalibration)).toBe(16);
  });

  it("formats measurement labels", () => {
    expect(formatMeasurement(12.345, "μm", "length")).toBe("12.35 μm");
    expect(formatMeasurement(12.345, "px", "length")).toBe("12 px");
    expect(formatMeasurement(3.456, "mm", "area")).toBe("3.46 mm²");
    expect(getUnitLabel("μm", true)).toBe("μm²");
  });
});
