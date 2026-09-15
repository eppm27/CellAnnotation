import {
  DEMO_ANNOTATIONS,
  DEMO_IMAGE_ID,
  DEMO_IMAGE_URL,
  DEMO_LAYERS,
  isDemoImageId,
} from "@/lib/demoSample";

describe("demo sample workspace", () => {
  it("provides a browser-local sample image and editable annotation layer", () => {
    expect(DEMO_IMAGE_ID).toBe("demo-sample-cells");
    expect(DEMO_IMAGE_URL).toBe("/demo/sample-cells.svg");
    expect(isDemoImageId(DEMO_IMAGE_ID)).toBe(true);
    expect(isDemoImageId("uploaded-image")).toBe(false);

    expect(DEMO_LAYERS).toHaveLength(2);
    expect(DEMO_LAYERS[0].name).toContain("Synthetic");
    expect(DEMO_LAYERS[1].name).toContain("Sample");

    const annotationLayerId = DEMO_LAYERS[1].id;
    expect(DEMO_ANNOTATIONS.length).toBeGreaterThanOrEqual(3);
    expect(
      DEMO_ANNOTATIONS.every(
        (annotation) => annotation.layerId === annotationLayerId,
      ),
    ).toBe(true);
  });
});
