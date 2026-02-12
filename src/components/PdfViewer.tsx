import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ZoomIn, ZoomOut } from "lucide-react";

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

interface PdfViewerProps {
  datasheetData: ArrayBuffer | null;
  websiteData: ArrayBuffer | null;
  datasheetUrl: string | null;
  websiteUrl: string | null;
  pdfView: "datasheet" | "website";
  onPdfViewChange: (view: "datasheet" | "website") => void;
}

const BASE_SCALE = 1.5; // Render at 150% for crisp zooming

export function PdfViewer({
  datasheetData,
  websiteData,
  datasheetUrl,
  websiteUrl,
  pdfView,
  onPdfViewChange,
}: PdfViewerProps) {
  const [pdfjsReady, setPdfjsReady] = useState(!!window.pdfjsLib);
  const [pdfLoadTimedOut, setPdfLoadTimedOut] = useState(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);

  // Per-PDF cached canvases & scroll positions
  const datasheetCanvasRef = useRef<HTMLDivElement | null>(null);
  const websiteCanvasRef = useRef<HTMLDivElement | null>(null);
  const datasheetRendered = useRef(false);
  const websiteRendered = useRef(false);
  const datasheetScroll = useRef({ top: 0, left: 0 });
  const websiteScroll = useRef({ top: 0, left: 0 });

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Pan/drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);

  // Load pdf.js
  useEffect(() => {
    if (window.pdfjsLib) { setPdfjsReady(true); return; }
    const script = document.createElement("script");
    script.src = "/pdfjs/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = "";
        setPdfjsReady(true);
      }
    };
    script.onerror = () => setPdfRenderError("Failed to load PDF viewer");
    document.body.appendChild(script);
    return () => { if (script.parentNode) script.parentNode.removeChild(script); };
  }, []);

  useEffect(() => {
    if (pdfjsReady) return;
    setPdfLoadTimedOut(false);
    const timer = setTimeout(() => setPdfLoadTimedOut(true), 3000);
    return () => clearTimeout(timer);
  }, [pdfjsReady]);

  // Render a PDF into a container (once per data change)
  const renderPdf = useCallback(async (data: ArrayBuffer, container: HTMLDivElement) => {
    const pdfjs = window.pdfjsLib;
    if (!pdfjs || !data) return;
    container.innerHTML = "";
    try {
      const buffer = data.slice(0);
      const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
      const pdf = await loadingTask.promise;
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: BASE_SCALE });
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) continue;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = "block";
        canvas.style.marginBottom = i < pdf.numPages ? "12px" : "0";
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;
        container.appendChild(canvas);
        await page.render({ canvasContext: ctx, viewport }).promise;
      }
    } catch (err) {
      console.error("PDF render error:", err);
      setPdfRenderError("PDF preview unavailable");
    }
  }, []);

  // Render datasheet when data changes
  useEffect(() => {
    if (!pdfjsReady || !datasheetData || !datasheetCanvasRef.current) {
      datasheetRendered.current = false;
      if (datasheetCanvasRef.current) datasheetCanvasRef.current.innerHTML = "";
      return;
    }
    datasheetRendered.current = false;
    renderPdf(datasheetData, datasheetCanvasRef.current).then(() => {
      datasheetRendered.current = true;
    });
  }, [datasheetData, pdfjsReady, renderPdf]);

  // Render website when data changes
  useEffect(() => {
    if (!pdfjsReady || !websiteData || !websiteCanvasRef.current) {
      websiteRendered.current = false;
      if (websiteCanvasRef.current) websiteCanvasRef.current.innerHTML = "";
      return;
    }
    websiteRendered.current = false;
    renderPdf(websiteData, websiteCanvasRef.current).then(() => {
      websiteRendered.current = true;
    });
  }, [websiteData, pdfjsReady, renderPdf]);

  // Save scroll position before switching, restore after
  const handleViewSwitch = useCallback((newView: "datasheet" | "website") => {
    const sc = scrollContainerRef.current;
    if (sc) {
      // Save current
      if (pdfView === "datasheet") {
        datasheetScroll.current = { top: sc.scrollTop, left: sc.scrollLeft };
      } else {
        websiteScroll.current = { top: sc.scrollTop, left: sc.scrollLeft };
      }
    }
    onPdfViewChange(newView);
    // Restore after DOM update
    requestAnimationFrame(() => {
      const sc2 = scrollContainerRef.current;
      if (!sc2) return;
      const saved = newView === "datasheet" ? datasheetScroll.current : websiteScroll.current;
      sc2.scrollTop = saved.top;
      sc2.scrollLeft = saved.left;
    });
  }, [pdfView, onPdfViewChange]);

  // Drag to pan
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, left: sc.scrollLeft, top: sc.scrollTop };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragStart.current || !scrollContainerRef.current) return;
    scrollContainerRef.current.scrollLeft = dragStart.current.left - (e.clientX - dragStart.current.x);
    scrollContainerRef.current.scrollTop = dragStart.current.top - (e.clientY - dragStart.current.y);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragStart.current = null;
  }, []);

  const clampZoom = useCallback((value: number) => Math.max(50, Math.min(300, Math.round(value))), []);

  // Zoom with center-point preservation
  const applyZoom = useCallback((nextZoom: number) => {
    setZoom((prev) => {
      const next = clampZoom(nextZoom);
      const sc = scrollContainerRef.current;
      if (sc && prev !== next) {
        const prevScale = prev / 100;
        const nextScale = next / 100;
        // Calculate the center point of the visible area
        const centerX = sc.scrollLeft + sc.clientWidth / 2;
        const centerY = sc.scrollTop + sc.clientHeight / 2;
        // Convert the visible center to content coordinates
        const contentX = prevScale > 0 ? centerX / prevScale : centerX;
        const contentY = prevScale > 0 ? centerY / prevScale : centerY;
        requestAnimationFrame(() => {
          // After scale change, restore so the same content point is centered
          const targetLeft = contentX * nextScale - sc.clientWidth / 2;
          const targetTop = contentY * nextScale - sc.clientHeight / 2;
          const maxLeft = Math.max(0, sc.scrollWidth - sc.clientWidth);
          const maxTop = Math.max(0, sc.scrollHeight - sc.clientHeight);
          sc.scrollLeft = Math.max(0, Math.min(targetLeft, maxLeft));
          sc.scrollTop = Math.max(0, Math.min(targetTop, maxTop));
        });
      }
      return next;
    });
  }, [clampZoom]);

  const handleZoom = useCallback((delta: number) => {
    applyZoom(zoom + delta);
  }, [applyZoom, zoom]);

  // Pinch-to-zoom via wheel
  useEffect(() => {
    const sc = scrollContainerRef.current;
    if (!sc) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        handleZoom(e.deltaY > 0 ? -10 : 10);
      }
    };
    sc.addEventListener("wheel", onWheel, { passive: false });
    return () => sc.removeEventListener("wheel", onWheel);
  }, [handleZoom]);

  const cssScale = zoom / 100;
  const hasDatasheet = !!datasheetData && !!datasheetUrl;
  const hasWebsite = !!websiteData && !!websiteUrl;
  const activeUrl = pdfView === "website" ? websiteUrl : datasheetUrl;
  const hasContent = pdfView === "website" ? hasWebsite : hasDatasheet;

  return (
    <div className="space-y-1.5">
      {/* Header - always show zoom, conditionally show PDF switcher */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">
          {hasDatasheet || hasWebsite
            ? `PDF: ${pdfView === "website" ? "Website" : "Datasheet"}`
            : "PDF"}
        </span>
        <div className="flex items-center gap-2">
          {hasDatasheet && hasWebsite && (
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 p-0.5 shadow-sm">
              <button
                type="button"
                onClick={() => handleViewSwitch("datasheet")}
                className={cn(
                  "px-3 py-1 text-[11px] rounded-full transition-colors",
                  pdfView === "datasheet"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Datasheet
              </button>
              <button
                type="button"
                onClick={() => handleViewSwitch("website")}
                className={cn(
                  "px-3 py-1 text-[11px] rounded-full transition-colors",
                  pdfView === "website"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Website
              </button>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleZoom(-10)}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <Input
              type="text"
              inputMode="numeric"
              value={zoom}
              onChange={(e) => {
                const val = e.target.value.replace(/[^\d]/g, "");
                if (val === "") {
                  setZoom(100);
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num)) {
                    applyZoom(num);
                  }
                }
              }}
              className="h-7 w-14 px-2 text-center text-xs tabular-nums"
            />
            <span className="text-[10px] text-muted-foreground">%</span>
            <Button type="button" variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => handleZoom(10)}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Viewer */}
      <div className="border border-border rounded-lg bg-muted/20 h-[360px] overflow-hidden">
        {!hasContent ? (
          <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
            Upload a PDF to preview
          </div>
        ) : !pdfjsReady ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{pdfLoadTimedOut ? "PDF viewer blocked by browser" : "Loading PDF viewer…"}</span>
            {activeUrl && (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={activeUrl} target="_blank" rel="noreferrer">Open PDF</a>
              </Button>
            )}
          </div>
        ) : pdfRenderError ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>{pdfRenderError}</span>
            {activeUrl && (
              <Button type="button" variant="outline" size="sm" asChild>
                <a href={activeUrl} target="_blank" rel="noreferrer">Open PDF</a>
              </Button>
            )}
          </div>
        ) : (
          <div
            ref={scrollContainerRef}
            className={cn(
              "relative h-full w-full overflow-auto bg-white select-none",
              isDragging ? "cursor-grabbing" : "cursor-grab"
            )}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseUp}
            onMouseUp={handleMouseUp}
          >
            <div
              style={{
                transform: `scale(${cssScale})`,
                transformOrigin: "top left",
                transition: "transform 0.15s ease-out",
              }}
            >
              <div
                ref={datasheetCanvasRef}
                className="p-3"
                style={{ display: pdfView === "datasheet" ? "block" : "none" }}
              />
              <div
                ref={websiteCanvasRef}
                className="p-3"
                style={{ display: pdfView === "website" ? "block" : "none" }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
