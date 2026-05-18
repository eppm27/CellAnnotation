import OpenSeadragon from "openseadragon";
import { useEffect, useRef } from "react";

type Props = {
  dziUrl: string;
  brightness?: number;
  contrast?: number;
  rotation?: number;
  onZoomChange?: (zoom: number) => void;
  onViewportChange?: () => void; // New: trigger on any viewport change
  onReady?: (x: {
    screenToImage: (p: { x: number; y: number }) => { x: number; y: number };
    imageToScreen: (p: { x: number; y: number }) => { x: number; y: number };
    zoomIn: () => void;
    zoomOut: () => void;
    resetZoom: () => void;
    getZoom: () => number;
  }) => void;
};

// Update this to match your backend port
const BACKEND_BASE = "http://127.0.0.1:5001";

export default function OsdViewer({
  dziUrl,
  brightness = 100,
  contrast = 100,
  rotation = 0,
  onReady,
  onZoomChange,
  onViewportChange,
}: Props) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<OpenSeadragon.Viewer | null>(null);

  // Convert relative path /tiles/xxx.dzi to full backend URL
  const src = /^\w+:\/\//.test(dziUrl) ? dziUrl : `${BACKEND_BASE}${dziUrl}`;

  useEffect(() => {
    if (!elRef.current) return;

    // Create viewer
    const viewer = OpenSeadragon({
      element: elRef.current,
      prefixUrl: "/openseadragon-images/",
      tileSources: src,
      showNavigator: false, // Hide built-in navigator
      showNavigationControl: false, // Hide built-in zoom/home buttons
      zoomPerClick: 1.3,
      zoomPerScroll: 1.2,
      maxZoomPixelRatio: 2,
      preserveDrawingBuffer: true,
      visibilityRatio: 1,
      drawer: "canvas",
      crossOriginPolicy: "Anonymous",
      gestureSettingsMouse: {
        clickToZoom: false, // Disable click to zoom since we have toolbar buttons
        dblClickToZoom: true,
        scrollToZoom: true,
      },
    });
    viewerRef.current = viewer;

    // Apply brightness/contrast/rotation
    const applyView = () => {
      try {
        viewer.viewport.setRotation(rotation);
        (elRef.current as HTMLDivElement).style.filter =
          `brightness(${brightness}%) contrast(${contrast}%)`;
      } catch {}
    };

    viewer.addHandler("open", () => {
      applyView();
      if (onReady) {
        const screenToImage = (p: { x: number; y: number }) => {
          const webPoint = new OpenSeadragon.Point(p.x, p.y);
          const viewportPoint = viewer.viewport.pointFromPixel(webPoint, true);
          const imagePoint =
            viewer.viewport.viewportToImageCoordinates(viewportPoint);
          return { x: imagePoint.x, y: imagePoint.y };
        };
        const imageToScreen = (p: { x: number; y: number }) => {
          const viewportPoint = viewer.viewport.imageToViewportCoordinates(
            p.x,
            p.y,
          );
          const webPoint = viewer.viewport.pixelFromPoint(viewportPoint, true);
          return { x: webPoint.x, y: webPoint.y };
        };
        const zoomIn = () => {
          const currentZoom = viewer.viewport.getZoom();
          viewer.viewport.zoomTo(currentZoom * 1.3);
        };
        const zoomOut = () => {
          const currentZoom = viewer.viewport.getZoom();
          viewer.viewport.zoomTo(currentZoom / 1.3);
        };
        const resetZoom = () => {
          viewer.viewport.goHome();
        };
        const getZoom = () => {
          const zoom = viewer.viewport.getZoom();
          const homeZoom = viewer.viewport.getHomeZoom();
          return Math.round((zoom / homeZoom) * 100);
        };
        onReady({
          screenToImage,
          imageToScreen,
          zoomIn,
          zoomOut,
          resetZoom,
          getZoom,
        });
      }
    });

    // Listen for zoom changes to update the toolbar display
    let rafId: number | null = null;

    if (onZoomChange || onViewportChange) {
      const updateZoom = () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }

        rafId = requestAnimationFrame(() => {
          if (onZoomChange) {
            const zoom = viewer.viewport.getZoom();
            const homeZoom = viewer.viewport.getHomeZoom();
            const zoomPercent = Math.round((zoom / homeZoom) * 100);
            onZoomChange(zoomPercent);
          }
          if (onViewportChange) {
            onViewportChange();
          }
          rafId = null;
        });
      };

      viewer.addHandler("animation-finish", updateZoom);
      viewer.addHandler("animation", updateZoom);
      viewer.addHandler("zoom", updateZoom);
      viewer.addHandler("pan", updateZoom);
      viewer.addHandler("resize", updateZoom);
      viewer.addHandler("update-viewport", updateZoom);
    }

    return () => {
      try {
        viewer.destroy();
      } catch {}
      viewerRef.current = null;
    };
  }, [src]);

  // Update brightness/contrast/rotation when they change
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !elRef.current) return;
    try {
      viewer.viewport.setRotation(rotation);
      elRef.current.style.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
    } catch {}
  }, [brightness, contrast, rotation]);

  return <div ref={elRef} className="w-full h-full" />;
}
