import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CalibrationDialog } from "@/components/CalibrationDialog";

describe("CalibrationDialog", () => {
  const openProps = {
    open: true,
    onOpenChange: vi.fn(),
    currentCalibration: { pixelsPerUnit: 2, unit: "mm" as const },
    onCalibrationChange: vi.fn(),
  };

  beforeEach(() => {
    openProps.onOpenChange.mockReset();
    openProps.onCalibrationChange.mockReset();
  });

  it("applies calibration with parsed values", () => {
    render(<CalibrationDialog {...openProps} />);

    fireEvent.change(screen.getByLabelText(/known distance/i), {
      target: { value: "50" },
    });
    fireEvent.change(screen.getByLabelText(/measured pixels/i), {
      target: { value: "250" },
    });

    fireEvent.click(screen.getByRole("button", { name: /apply calibration/i }));

    expect(openProps.onCalibrationChange).toHaveBeenCalledWith({
      pixelsPerUnit: 5,
      unit: "mm",
    });
    expect(openProps.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets calibration to pixels", () => {
    render(<CalibrationDialog {...openProps} />);

    fireEvent.click(screen.getByRole("button", { name: /reset to pixels/i }));

    expect(openProps.onCalibrationChange).toHaveBeenCalledWith({
      pixelsPerUnit: 1,
      unit: "px",
    });
    expect(screen.getByLabelText(/known distance/i)).toHaveValue(100);
    expect(screen.getByLabelText(/measured pixels/i)).toHaveValue(200);
  });
});
