import { render, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import OsdViewer from "@/components/OsdViewer";

const handlerRegistry: Record<string, ((...args: any[]) => void)[]> = {};
let currentZoom = 2;
let homeZoom = 1;

const addHandler = vi.fn((name: string, handler: (...args: any[]) => void) => {
  handlerRegistry[name] = handlerRegistry[name] || [];
  handlerRegistry[name].push(handler);
});
const destroy = vi.fn();
const setRotation = vi.fn();
const zoomTo = vi.fn((value: number) => {
  currentZoom = value;
});
const goHome = vi.fn(() => {
  currentZoom = homeZoom;
});
const getZoom = vi.fn(() => currentZoom);
const getHomeZoom = vi.fn(() => homeZoom);

const viewport = {
  setRotation,
  getZoom,
  getHomeZoom,
  zoomTo,
  goHome,
  pointFromPixel: vi.fn((point) => point),
  viewportToImageCoordinates: vi.fn(() => ({ x: 25, y: 30 })),
  imageToViewportCoordinates: vi.fn((x: number, y: number) => ({ x, y })),
  pixelFromPoint: vi.fn(() => ({ x: 50, y: 60 })),
};

var openSeadragonMock: ReturnType<typeof vi.fn>;

vi.mock("openseadragon", () => {
  class Point {
    constructor(public x: number, public y: number) {}
  }
  openSeadragonMock = vi.fn(() => ({
    addHandler,
    destroy,
    viewport,
  }));
  return {
    __esModule: true,
    default: openSeadragonMock,
    Point,
  };
});

describe("OsdViewer", () => {
  const raf = vi.spyOn(window, "requestAnimationFrame");
  const caf = vi.spyOn(window, "cancelAnimationFrame");

  beforeEach(() => {
    openSeadragonMock.mockClear();
    addHandler.mockClear();
    destroy.mockClear();
    setRotation.mockClear();
    zoomTo.mockClear();
    goHome.mockClear();
    getZoom.mockClear();
    getHomeZoom.mockClear();
    viewport.pointFromPixel.mockClear();
    viewport.viewportToImageCoordinates.mockClear();
    viewport.imageToViewportCoordinates.mockClear();
    viewport.pixelFromPoint.mockClear();
    Object.keys(handlerRegistry).forEach((key) => delete handlerRegistry[key]);
    currentZoom = 2;
    homeZoom = 1;
    raf.mockImplementation((cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    caf.mockImplementation(() => {});
  });

  afterEach(() => {
    raf.mockReset();
    caf.mockReset();
  });

  it("initialises viewer and forwards lifecycle events", () => {
    const ready = vi.fn();
    const zoomChange = vi.fn();

    render(
      <OsdViewer
        dziUrl="/tiles/sample.dzi"
        brightness={120}
        contrast={80}
        rotation={15}
        onReady={ready}
        onZoomChange={zoomChange}
      />,
    );

    expect(openSeadragonMock).toHaveBeenCalledWith(
      expect.objectContaining({ tileSources: "http://127.0.0.1:5001/tiles/sample.dzi" }),
    );

    act(() => {
      handlerRegistry.open.forEach((handler) => handler());
    });

    expect(ready).toHaveBeenCalled();
    const api = ready.mock.calls[0][0];

    api.zoomIn();
    expect(zoomTo).toHaveBeenCalledWith(2.6);

    api.zoomOut();
    expect(zoomTo).toHaveBeenLastCalledWith(2);

    api.resetZoom();
    expect(goHome).toHaveBeenCalled();

    act(() => {
      handlerRegistry.animation?.forEach((handler) => handler({} as any));
      handlerRegistry["animation-finish"]?.forEach((handler) => handler({} as any));
    });

    expect(zoomChange).toHaveBeenCalledWith(expect.any(Number));
  });

  it("updates brightness, contrast and rotation on prop change", () => {
    const { rerender, container } = render(
      <OsdViewer dziUrl="/tiles/sample.dzi" rotation={0} brightness={100} contrast={100} />,
    );

    act(() => {
      handlerRegistry.open.forEach((handler) => handler());
    });

    rerender(
      <OsdViewer dziUrl="/tiles/sample.dzi" rotation={45} brightness={110} contrast={90} />,
    );

    expect(setRotation).toHaveBeenCalledWith(45);
    expect(container.firstChild).toHaveStyle(
      "filter: brightness(110%) contrast(90%)",
    );
  });
});
