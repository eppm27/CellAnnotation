import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ruler } from "lucide-react";

export type MeasurementUnit = "px" | "μm" | "mm" | "cm";

export interface CalibrationSettings {
  pixelsPerUnit: number; // How many pixels = 1 unit
  unit: MeasurementUnit;
}

interface CalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCalibration: CalibrationSettings;
  onCalibrationChange: (calibration: CalibrationSettings) => void;
}

export function CalibrationDialog({
  open,
  onOpenChange,
  currentCalibration,
  onCalibrationChange,
}: CalibrationDialogProps) {
  const [knownDistance, setKnownDistance] = useState<string>("100");
  const [measuredPixels, setMeasuredPixels] = useState<string>("200");
  const [selectedUnit, setSelectedUnit] = useState<MeasurementUnit>(
    currentCalibration.unit,
  );

  const handleApply = () => {
    const distance = parseFloat(knownDistance);
    const pixels = parseFloat(measuredPixels);

    if (!isNaN(distance) && !isNaN(pixels) && distance > 0 && pixels > 0) {
      const pixelsPerUnit = pixels / distance;
      onCalibrationChange({
        pixelsPerUnit,
        unit: selectedUnit,
      });
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    onCalibrationChange({
      pixelsPerUnit: 1,
      unit: "px",
    });
    setKnownDistance("100");
    setMeasuredPixels("200");
    setSelectedUnit("px");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ruler className="w-5 h-5" />
            Measurement Calibration
          </DialogTitle>
          <DialogDescription>
            Calibrate measurements by setting a known distance. Draw a line on a
            feature with a known size to get the pixel measurement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="unit">Unit of Measurement</Label>
            <Select
              value={selectedUnit}
              onValueChange={(value) =>
                setSelectedUnit(value as MeasurementUnit)
              }
            >
              <SelectTrigger id="unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="px">Pixels (px)</SelectItem>
                <SelectItem value="μm">Micrometers (μm)</SelectItem>
                <SelectItem value="mm">Millimeters (mm)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="known-distance">
              Known Distance ({selectedUnit})
            </Label>
            <Input
              id="known-distance"
              type="number"
              placeholder="e.g., 100"
              value={knownDistance}
              onChange={(e) => setKnownDistance(e.target.value)}
              step="0.01"
              min="0.01"
            />
            <p className="text-xs text-muted-foreground">
              Enter the real-world distance of your reference feature
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="measured-pixels">Measured Pixels</Label>
            <Input
              id="measured-pixels"
              type="number"
              placeholder="e.g., 200"
              value={measuredPixels}
              onChange={(e) => setMeasuredPixels(e.target.value)}
              step="1"
              min="1"
            />
            <p className="text-xs text-muted-foreground">
              Draw a measurement line on the reference feature to get this value
            </p>
          </div>

          <div className="rounded-lg bg-muted p-3 space-y-1">
            <p className="text-sm font-medium">Calculated Scale:</p>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const distance = parseFloat(knownDistance);
                const pixels = parseFloat(measuredPixels);
                if (
                  !isNaN(distance) &&
                  !isNaN(pixels) &&
                  distance > 0 &&
                  pixels > 0
                ) {
                  const scale = pixels / distance;
                  return `1 ${selectedUnit} = ${scale.toFixed(2)} pixels`;
                }
                return "Enter values to calculate";
              })()}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Pixels
          </Button>
          <Button onClick={handleApply}>Apply Calibration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
