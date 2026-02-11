import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FormSection } from "@/components/FormSection";
import { CategoryTreeDropdown } from "@/components/CategoryTreeDropdown";
import { DynamicImageInputs } from "@/components/DynamicImageInputs";
import { DynamicSpecifications } from "@/components/DynamicSpecifications";
import { SkuSelector } from "@/components/SkuSelector";
import { ReopenSku } from "@/components/ReopenSku";
import { CheckCircle, Loader2, Send, FileText, Trash2, ZoomIn, ZoomOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  fetchSkus,
  fetchCategories,
  fetchProperties,
  fetchRecentSubmissions,
  submitProduct,
  addLegalValue,
  type SkuEntry,
  type ReopenedProduct,
  type ProductPayload,
} from "@/lib/api";
import { config } from "@/config";

interface FormErrors {
  sku?: string;
  title?: string;
  category?: string;
  images?: string;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export function ProductEntryForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: skus = [] } = useQuery<SkuEntry[]>({
    queryKey: ["skus", config.STATUS_READY],
    queryFn: () => fetchSkus(config.STATUS_READY),
    staleTime: 5 * 60_000,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
    staleTime: 5 * 60_000,
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ["recent-submissions"],
    queryFn: fetchRecentSubmissions,
    staleTime: 30_000,
  });

  const { data: propData } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
    staleTime: 5 * 60_000,
  });

  const properties = propData?.properties ?? [];
  const legalValues = propData?.legalValues ?? [];

  // Basic Info
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [title, setTitle] = useState("");
  const [chatgptData, setChatgptData] = useState("");
  const [chatgptDescription, setChatgptDescription] = useState("");

  // Supplier References (PDFs)
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [websitePdfFile, setWebsitePdfFile] = useState<File | null>(null);
  const [datasheetUrl, setDatasheetUrl] = useState("");
  const [webpageUrl, setWebpageUrl] = useState("");
  const [pdfView, setPdfView] = useState<"datasheet" | "website">("datasheet");
  const [datasheetPreviewUrl, setDatasheetPreviewUrl] = useState<string | null>(null);
  const [websitePreviewUrl, setWebsitePreviewUrl] = useState<string | null>(null);
  const [datasheetPdfData, setDatasheetPdfData] = useState<ArrayBuffer | null>(null);
  const [websitePdfData, setWebsitePdfData] = useState<ArrayBuffer | null>(null);
  const [pdfZoom, setPdfZoom] = useState(100);
  const [pdfRenderZoom, setPdfRenderZoom] = useState(100);
  const [pdfjsReady, setPdfjsReady] = useState(false);
  const [pdfRenderError, setPdfRenderError] = useState<string | null>(null);
  const [pdfIsRendering, setPdfIsRendering] = useState(false);
  const [pdfLoadTimedOut, setPdfLoadTimedOut] = useState(false);
  const [pdfIsZooming, setPdfIsZooming] = useState(false);
  const [pdfDocumentKey, setPdfDocumentKey] = useState(0);
  const pdfScrollRef = useRef<HTMLDivElement | null>(null);
  const datasheetInputRef = useRef<HTMLInputElement | null>(null);
  const websiteInputRef = useRef<HTMLInputElement | null>(null);
  const [isDraggingPdf, setIsDraggingPdf] = useState(false);
  const dragStart = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const pdfCanvasRef = useRef<HTMLDivElement | null>(null);
  const pdfDocRef = useRef<any>(null);

  // Random example title as placeholder
  const exampleTitle = useMemo(() => {
    const titles = skus.map((p) => p.exampleTitle).filter(Boolean);
    if (titles.length === 0) return "e.g. 10W LED Ceiling Spotlight - White";
    return titles[Math.floor(Math.random() * titles.length)];
  }, [skus]);

  // Dock SKUs for reopen dropdown
  const dockSkus = useMemo(() => {
    return submissions.map((sub) => sub.sku).filter(Boolean);
  }, [submissions]);

  // Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mainCategory, setMainCategory] = useState("");

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  // Specs
  const [specValues, setSpecValues] = useState<Record<string, string>>({});
  // Track "Other" values to persist on submit
  const [otherValues, setOtherValues] = useState<Record<string, string>>({});

  // Form state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isReopened, setIsReopened] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleSkuSelect = useCallback((selectedSku: string, selectedBrand: string) => {
    setSku(selectedSku);
    setBrand(selectedBrand);
  }, []);

  const handleSpecChange = useCallback((key: string, value: string) => {
    setSpecValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleOtherValue = useCallback((propertyName: string, value: string) => {
    setOtherValues((prev) => ({ ...prev, [propertyName]: value }));
  }, []);

  const handleReopened = useCallback((data: ReopenedProduct) => {
    setSku(data.sku);
    setBrand(data.brand);
    setTitle(data.title);
    setMainCategory(data.mainCategory);
    setSelectedCategories(
      data.additionalCategories.length > 0
        ? [data.mainCategory, ...data.additionalCategories]
        : [data.mainCategory]
    );
    setImageUrls(data.imageUrls.length > 0 ? data.imageUrls : [""]);
    setSpecValues(data.specifications);
    setChatgptData(data.chatgptData || "");
    setChatgptDescription(data.chatgptDescription || "");
    setIsReopened(true);
  }, []);

  useEffect(() => {
    if (datasheetFile) {
      const url = URL.createObjectURL(datasheetFile);
      setDatasheetPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setDatasheetPreviewUrl(null);
  }, [datasheetFile]);

  useEffect(() => {
    if (!datasheetFile) {
      setDatasheetPdfData(null);
      return;
    }
    let cancelled = false;
    datasheetFile.arrayBuffer().then((buf) => {
      if (!cancelled) setDatasheetPdfData(buf);
    }).catch(() => {
      if (!cancelled) setDatasheetPdfData(null);
    });
    return () => {
      cancelled = true;
    };
  }, [datasheetFile]);

  useEffect(() => {
    if (websitePdfFile) {
      const url = URL.createObjectURL(websitePdfFile);
      setWebsitePreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setWebsitePreviewUrl(null);
  }, [websitePdfFile]);

  useEffect(() => {
    if (!websitePdfFile) {
      setWebsitePdfData(null);
      return;
    }
    let cancelled = false;
    websitePdfFile.arrayBuffer().then((buf) => {
      if (!cancelled) setWebsitePdfData(buf);
    }).catch(() => {
      if (!cancelled) setWebsitePdfData(null);
    });
    return () => {
      cancelled = true;
    };
  }, [websitePdfFile]);

  useEffect(() => {
    if (datasheetPreviewUrl && !websitePreviewUrl) {
      setPdfView("datasheet");
    } else if (!datasheetPreviewUrl && websitePreviewUrl) {
      setPdfView("website");
    }
  }, [datasheetPreviewUrl, websitePreviewUrl]);

  useEffect(() => {
    if (window.pdfjsLib) {
      setPdfjsReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "/pdfjs/pdf.min.js";
    script.async = true;
    script.onload = () => {
      if (window.pdfjsLib) {
        // Don't set worker at all - use internal fallback
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = '';
        setPdfjsReady(true);
      }
    };
    script.onerror = () => setPdfRenderError("Failed to load PDF viewer");
    document.body.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (pdfjsReady) return;
    setPdfLoadTimedOut(false);
    const timer = window.setTimeout(() => setPdfLoadTimedOut(true), 3000);
    return () => window.clearTimeout(timer);
  }, [pdfjsReady]);

  useEffect(() => {
    const timer = window.setTimeout(() => setPdfRenderZoom(pdfZoom), 150);
    return () => window.clearTimeout(timer);
  }, [pdfZoom]);

  useEffect(() => {
    setPdfIsZooming(true);
    const timer = window.setTimeout(() => setPdfIsZooming(false), 350);
    return () => window.clearTimeout(timer);
  }, [pdfZoom]);

  const handlePdfMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!pdfScrollRef.current) return;
    setIsDraggingPdf(true);
    dragStart.current = {
      x: e.clientX,
      y: e.clientY,
      left: pdfScrollRef.current.scrollLeft,
      top: pdfScrollRef.current.scrollTop,
    };
  }, []);

  const handlePdfMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingPdf || !dragStart.current || !pdfScrollRef.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    pdfScrollRef.current.scrollLeft = dragStart.current.left - dx;
    pdfScrollRef.current.scrollTop = dragStart.current.top - dy;
  }, [isDraggingPdf]);

  const handlePdfMouseUp = useCallback(() => {
    setIsDraggingPdf(false);
    dragStart.current = null;
  }, []);

  const activePdfUrl = useMemo(() => {
    return pdfView === "website" ? websitePreviewUrl : datasheetPreviewUrl;
  }, [pdfView, websitePreviewUrl, datasheetPreviewUrl]);

  const activePdfData = useMemo(() => {
    return pdfView === "website" ? websitePdfData : datasheetPdfData;
  }, [pdfView, websitePdfData, datasheetPdfData]);

  useEffect(() => {
    if (!activePdfData || !pdfjsReady) {
      pdfDocRef.current = null;
      return;
    }

    let cancelled = false;
    setPdfIsRendering(true);
    setPdfRenderError(null);

    (async () => {
      try {
        const pdfjs = window.pdfjsLib;
        if (!pdfjs) throw new Error("PDF viewer not available");
        
        // Create a fresh copy of the ArrayBuffer to avoid detachment
        const buffer = activePdfData.slice(0);
        const uint8Array = new Uint8Array(buffer);
        
        // Use getDocument with minimal options - let PDF.js handle internally
        const loadingTask = pdfjs.getDocument({
          data: uint8Array,
          // Don't specify any worker options - use internal handling
        });
        
        const pdf = await loadingTask.promise;
        if (!cancelled) {
          pdfDocRef.current = pdf;
          setPdfDocumentKey(prev => prev + 1);
        }
      } catch (err) {
        console.error("PDF loading error:", err);
        if (!cancelled) {
          setPdfRenderError(err instanceof Error ? err.message : "PDF preview unavailable");
        }
      } finally {
        if (!cancelled) setPdfIsRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      pdfDocRef.current = null;
    };
  }, [activePdfData, pdfjsReady]);

  useEffect(() => {
    const container = pdfCanvasRef.current;
    const scrollEl = pdfScrollRef.current;
    const pdf = pdfDocRef.current;
    if (!container || !scrollEl || !pdf) return;

    const prevScrollTop = scrollEl.scrollTop;
    const prevScrollLeft = scrollEl.scrollLeft;
    const prevScrollHeight = scrollEl.scrollHeight || 1;
    const prevScrollWidth = scrollEl.scrollWidth || 1;
    const topRatio = prevScrollTop / prevScrollHeight;
    const leftRatio = prevScrollLeft / prevScrollWidth;

    let cancelled = false;
    setPdfIsRendering(true);
    
    // Don't clear container if zooming - we'll update in place
    if (!pdfIsZooming) {
      container.innerHTML = "";
    }

    (async () => {
      try {
        const scale = pdfIsZooming ? pdfZoom / 100 : pdfRenderZoom / 100;
        
        if (pdfIsZooming) {
          // During zoom: render only the first visible page at new zoom level
          const firstPage = Math.max(1, Math.floor(prevScrollTop / 600) + 1);
          container.innerHTML = "";
          
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
            if (cancelled) break;
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) continue;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.className = "mb-3 last:mb-0";
            container.appendChild(canvas);
            
            // Only render the visible page during zoom
            if (pageNum === firstPage) {
              const renderTask = page.render({ canvasContext: context, viewport });
              await renderTask.promise;
            }
          }
        } else {
          // After zoom: render all pages at final zoom level
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum += 1) {
            if (cancelled) break;
            const page = await pdf.getPage(pageNum);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) continue;
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.className = "mb-3 last:mb-0";
            container.appendChild(canvas);
            const renderTask = page.render({ canvasContext: context, viewport });
            await renderTask.promise;
          }
        }
      } catch (err) {
        if (!cancelled) setPdfRenderError("PDF preview unavailable");
      } finally {
        if (!cancelled) {
          setPdfIsRendering(false);
          const newScrollHeight = scrollEl.scrollHeight || 1;
          const newScrollWidth = scrollEl.scrollWidth || 1;
          scrollEl.scrollTop = Math.round(topRatio * newScrollHeight);
          scrollEl.scrollLeft = Math.round(leftRatio * newScrollWidth);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pdfRenderZoom, pdfZoom, pdfIsZooming, pdfDocumentKey]);

  const handleGenerateTitleAndData = useCallback(() => {
    toast({ title: "Coming Soon", description: "AI title and data generation will be available soon." });
  }, [toast]);

  const handleGenerateDescription = useCallback(() => {
    toast({ title: "Coming Soon", description: "AI description generation will be available soon." });
  }, [toast]);

  const handleVerifyAiEntries = useCallback(() => {
    toast({ title: "Coming Soon", description: "AI verification will be available soon." });
  }, [toast]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!sku.trim()) newErrors.sku = "SKU is required";
    if (!title.trim()) newErrors.title = "Title is required";
    if (selectedCategories.length === 0) {
      newErrors.category = "At least one category must be selected";
    } else if (!mainCategory) {
      newErrors.category = "Select a MAIN category.";
    }
    if (!imageUrls[0]?.trim()) {
      newErrors.images = "At least one image URL is required";
    }

    // Check for duplicate images
    const trimmedUrls = imageUrls.map((u) => u.trim()).filter(Boolean);
    const uniqueUrls = new Set(trimmedUrls);
    if (uniqueUrls.size < trimmedUrls.length) {
      newErrors.images = "Duplicate image URLs detected. Remove duplicates before submitting.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setSku("");
    setBrand("");
    setTitle("");
    setChatgptData("");
    setChatgptDescription("");
    setDatasheetFile(null);
    setWebsitePdfFile(null);
    setDatasheetUrl("");
    setWebpageUrl("");
    setSelectedCategories([]);
    setMainCategory("");
    setImageUrls([""]);
    setSpecValues({});
    setOtherValues({});
    setErrors({});
    setIsReopened(false);
  };

  const handleClearInput = useCallback(() => {
    if (!clearConfirm) {
      setClearConfirm(true);
      return;
    }
    // Clear all inputs
    resetForm();
    setClearConfirm(false);
    toast({ title: "Cleared", description: "All input fields have been cleared." });
  }, [clearConfirm, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({ variant: "destructive", title: "Validation Error", description: "Please fill in all required fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      const otherPaths = selectedCategories.filter((p) => p !== mainCategory);

      const payload: ProductPayload = {
        sku: sku.trim(),
        brand,
        title: title.trim(),
        mainCategory,
        additionalCategories: otherPaths,
        imageUrls: imageUrls.map((u) => u.trim()).filter(Boolean),
        specifications: specValues,
        chatgptData: chatgptData.trim() || undefined,
        chatgptDescription: chatgptDescription.trim() || undefined,
        datasheetUrl: datasheetUrl.trim() || undefined,
        webpageUrl: webpageUrl.trim() || undefined,
        timestamp: new Date().toISOString(),
      };

      await submitProduct(payload);

      // Persist "Other" values to LEGAL
      for (const [propertyName, value] of Object.entries(otherValues)) {
        if (value.trim()) {
          await addLegalValue(propertyName, value.trim());
        }
      }

      setShowSuccess(true);
      toast({ title: "Product Submitted!", description: `SKU ${sku} has been added to ${config.SHEET_OUTPUT}.` });

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ["properties"] });

      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      toast({ variant: "destructive", title: "Submission Failed", description: "There was an error submitting the product." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Reopen SKU */}
      <FormSection title="Reopen SKU" defaultOpen={false}>
        <ReopenSku onReopened={handleReopened} dockSkus={dockSkus} />
      </FormSection>

      {/* Basic Info */}
      <FormSection title="Basic Info" required defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              SKU <span className="text-destructive">*</span>
            </Label>
            <SkuSelector products={skus} value={sku} onSelect={handleSkuSelect} error={errors.sku} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Brand</Label>
            <Input value={brand} readOnly placeholder="Auto-filled from SKU" className="h-9 text-sm bg-muted/50" />
          </div>
        </div>
      </FormSection>

      {/* Categories */}
      <FormSection title="Categories" required defaultOpen>
        <CategoryTreeDropdown
          categories={categories}
          selectedPaths={selectedCategories}
          mainPath={mainCategory}
          onSelectedChange={setSelectedCategories}
          onMainChange={setMainCategory}
          error={errors.category}
        />
      </FormSection>

      {/* AI and Data */}
      <FormSection title="AI and Data" defaultOpen>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Supplier Datasheet (PDF)
              </Label>
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <input
                    ref={datasheetInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onClick={(e) => {
                      (e.currentTarget as HTMLInputElement).value = "";
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDatasheetFile(file);
                        setDatasheetUrl(file.name);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 border border-border rounded-md px-3 h-9 text-sm cursor-pointer hover:bg-muted/30 transition-colors">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={datasheetFile ? "text-foreground" : "text-muted-foreground"}>
                      {datasheetFile ? datasheetFile.name : "Choose PDF file…"}
                    </span>
                  </div>
                </label>
                {datasheetFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => {
                      setDatasheetFile(null);
                      setDatasheetUrl("");
                      if (datasheetInputRef.current) datasheetInputRef.current.value = "";
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Supplier Website (PDF)
              </Label>
              <div className="flex items-center gap-2">
                <label className="flex-1">
                  <input
                    ref={websiteInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onClick={(e) => {
                      (e.currentTarget as HTMLInputElement).value = "";
                    }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setWebsitePdfFile(file);
                        setWebpageUrl(file.name);
                      }
                    }}
                  />
                  <div className="flex items-center gap-2 border border-border rounded-md px-3 h-9 text-sm cursor-pointer hover:bg-muted/30 transition-colors">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={websitePdfFile ? "text-foreground" : "text-muted-foreground"}>
                      {websitePdfFile ? websitePdfFile.name : "Choose PDF file…"}
                    </span>
                  </div>
                </label>
                {websitePdfFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-9 text-xs"
                    onClick={() => {
                      setWebsitePdfFile(null);
                      setWebpageUrl("");
                      if (websiteInputRef.current) websiteInputRef.current.value = "";
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleGenerateTitleAndData}>
            Generate Title and Data
          </Button>

          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={exampleTitle} className="h-9 text-sm" />
            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className="space-y-1.5">
              <Label htmlFor="ai-data" className="text-xs font-medium">AI-Data</Label>
              <Textarea
                id="ai-data"
                value={chatgptData}
                onChange={(e) => setChatgptData(e.target.value)}
                placeholder="AI-generated product data (editable)"
                className="text-sm min-h-[360px]"
              />
            </div>
            <div className="space-y-1.5 -mt-0.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">
                  {datasheetPreviewUrl || websitePreviewUrl
                    ? `PDF: ${pdfView === "website" ? "Website" : "Datasheet"}`
                    : "PDF"}
                </Label>
                <div className="flex items-center gap-2">
                  {datasheetPreviewUrl && websitePreviewUrl && (
                    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-background/70 p-0.5 shadow-sm">
                      <button
                        type="button"
                        onClick={() => setPdfView("datasheet")}
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
                        onClick={() => setPdfView("website")}
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
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
                    >
                      <ZoomOut className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
                    >
                      <ZoomIn className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="border border-border rounded-lg bg-muted/20 h-[360px] overflow-hidden">
                {(() => {
                  const activeUrl = pdfView === "website" ? websitePreviewUrl : datasheetPreviewUrl;
                  const hasData = Boolean(activePdfData);
                  if (!activeUrl || !hasData) {
                    return (
                      <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                        Upload a PDF to preview
                      </div>
                    );
                  }
                  if (!pdfjsReady) {
                    return (
                      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                        <span>{pdfLoadTimedOut ? "PDF viewer blocked by browser" : "Loading PDF viewer…"}</span>
                        <Button type="button" variant="outline" size="sm" asChild>
                          <a href={activeUrl} target="_blank" rel="noreferrer">Open PDF</a>
                        </Button>
                      </div>
                    );
                  }
                  return (
                    <div
                      ref={pdfScrollRef}
                      className={cn(
                        "relative h-full w-full overflow-auto bg-white select-none",
                        isDraggingPdf ? "cursor-grabbing" : "cursor-grab"
                      )}
                      onMouseDown={handlePdfMouseDown}
                      onMouseMove={handlePdfMouseMove}
                      onMouseLeave={handlePdfMouseUp}
                      onMouseUp={handlePdfMouseUp}
                    >
                      <div 
                        ref={pdfCanvasRef} 
                        className="p-3 transition-transform origin-top-left"
                        style={{
                          transform: pdfIsZooming ? `scale(${pdfZoom / pdfRenderZoom})` : undefined,
                        }}
                      />
                      {pdfIsRendering && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                          Rendering…
                        </div>
                      )}
                      {pdfRenderError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
                          <span>{pdfRenderError}</span>
                          <Button type="button" variant="outline" size="sm" asChild>
                            <a href={activeUrl} target="_blank" rel="noreferrer">Open PDF</a>
                          </Button>
                        </div>
                      )}
                      {!pdfIsRendering && !pdfRenderError && pdfCanvasRef.current?.childElementCount === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                          PDF preview unavailable
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>

          <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleGenerateDescription}>
            Generate Description
          </Button>

          <div className="space-y-1.5">
            <Label htmlFor="ai-description" className="text-xs font-medium">AI-Description</Label>
            <Textarea
              id="ai-description"
              value={chatgptDescription}
              onChange={(e) => setChatgptDescription(e.target.value)}
              placeholder="AI-generated product description (editable)"
              className="text-sm min-h-[80px]"
            />
          </div>

          <Button type="button" variant="outline" size="sm" className="h-9" onClick={handleVerifyAiEntries}>
            Verify AI Entries
          </Button>
        </div>
      </FormSection>

      {/* Images */}
      <FormSection title="Images" required defaultOpen>
        <div className="space-y-2">
          <DynamicImageInputs imageUrls={imageUrls} onChange={setImageUrls} error={errors.images} />
          <p className="text-xs text-muted-foreground">💡 Order: lifestyle/product images first, dimension image last. Min 700px wide.</p>
        </div>
      </FormSection>

      {/* Filters */}
      <FormSection title="Filters" defaultOpen={false}>
        <div className="space-y-2">
          <DynamicSpecifications
            properties={properties}
            legalValues={legalValues}
            values={specValues}
            onChange={handleSpecChange}
            onOtherValue={handleOtherValue}
          />
          <p className="text-xs text-muted-foreground">💡 Measurements: no units — all lengths in mm (e.g. 1m = 1000). Indoor with no IP → default IP20.</p>
        </div>
      </FormSection>

      {/* Submit */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={handleClearInput} className="h-10" onBlur={() => setClearConfirm(false)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {clearConfirm ? "Are you sure?" : "Clear Input"}
        </Button>
        <Button type="submit" disabled={isSubmitting || showSuccess} className="min-w-[160px] h-10">
          {showSuccess ? (
            <><CheckCircle className="mr-2 h-4 w-4" /> Submitted!</>
          ) : isSubmitting ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</>
          ) : (
            <><Send className="mr-2 h-4 w-4" /> Submit Product</>
          )}
        </Button>
      </div>
    </form>
  );
}
