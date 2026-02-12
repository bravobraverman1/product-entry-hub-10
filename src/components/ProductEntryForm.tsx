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
import { PdfViewer } from "@/components/PdfViewer";
import { CheckCircle, Loader2, Send, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSkus,
  fetchCategories,
  fetchProperties,
  submitProduct,
  addLegalValue,
  type SkuEntry,
  type ProductPayload,
} from "@/lib/api";
import { config } from "@/config";

interface FormErrors {
  sku?: string;
  title?: string;
  category?: string;
  images?: string;
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

  const { data: propData } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
    staleTime: 5 * 60_000,
  });

  const properties = propData?.properties ?? [];
  const legalValues = propData?.legalValues ?? [];
  const categoryFilterMap = propData?.categoryFilterMap ?? [];
  const filterDefaultMap = propData?.filterDefaultMap ?? [];

  // Local storage key for persisting form state
  const FORM_STATE_KEY = "productFormState";

  // Helper to load state from localStorage
  const loadFormState = () => {
    try {
      const stored = localStorage.getItem(FORM_STATE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  // Load initial state from localStorage
  const savedState = useMemo(() => loadFormState(), []);

  // Basic Info
  const [sku, setSku] = useState(savedState?.sku ?? "");
  const [brand, setBrand] = useState(savedState?.brand ?? "");
  const [title, setTitle] = useState(savedState?.title ?? "");
  const [chatgptData, setChatgptData] = useState(savedState?.chatgptData ?? "");
  const [chatgptDescription, setChatgptDescription] = useState(savedState?.chatgptDescription ?? "");

  // Supplier References (PDFs)
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [websitePdfFile, setWebsitePdfFile] = useState<File | null>(null);
  const [datasheetUrl, setDatasheetUrl] = useState(savedState?.datasheetUrl ?? "");
  const [webpageUrl, setWebpageUrl] = useState(savedState?.webpageUrl ?? "");
  const [pdfView, setPdfView] = useState<"datasheet" | "website">("datasheet");
  const [datasheetPreviewUrl, setDatasheetPreviewUrl] = useState<string | null>(null);
  const [websitePreviewUrl, setWebsitePreviewUrl] = useState<string | null>(null);
  const [datasheetPdfData, setDatasheetPdfData] = useState<ArrayBuffer | null>(null);
  const [websitePdfData, setWebsitePdfData] = useState<ArrayBuffer | null>(null);
  const datasheetInputRef = useRef<HTMLInputElement | null>(null);
  const websiteInputRef = useRef<HTMLInputElement | null>(null);

  // Random example title as placeholder
  const exampleTitle = useMemo(() => {
    const titles = skus.map((p) => p.exampleTitle).filter(Boolean);
    if (titles.length === 0) return "e.g. 10W LED Ceiling Spotlight - White";
    return titles[Math.floor(Math.random() * titles.length)];
  }, [skus]);

  // Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>(savedState?.selectedCategories ?? []);
  const [mainCategory, setMainCategory] = useState(savedState?.mainCategory ?? "");

  // Images
  const [imageUrls, setImageUrls] = useState<string[]>(savedState?.imageUrls ?? [""]);

  // Specs
  const [specValues, setSpecValues] = useState<Record<string, string>>(savedState?.specValues ?? {});
  // Track "Other" values to persist on submit
  const [otherValues, setOtherValues] = useState<Record<string, string>>(savedState?.otherValues ?? {});

  // Email Notes
  const [emailNotes, setEmailNotes] = useState(savedState?.emailNotes ?? "");

  // Form state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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

  // Save form state to localStorage whenever any value changes
  useEffect(() => {
    const formState = {
      sku,
      brand,
      title,
      chatgptData,
      chatgptDescription,
      datasheetUrl,
      webpageUrl,
      selectedCategories,
      mainCategory,
      imageUrls,
      specValues,
      otherValues,
      emailNotes,
    };
    localStorage.setItem(FORM_STATE_KEY, JSON.stringify(formState));
  }, [
    sku,
    brand,
    title,
    chatgptData,
    chatgptDescription,
    datasheetUrl,
    webpageUrl,
    selectedCategories,
    mainCategory,
    imageUrls,
    specValues,
    otherValues,
    emailNotes,
  ]);

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
    setEmailNotes("");
    setErrors({});
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
        // Keep form data - don't clear on submit, only "Clear Input" button clears
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
      <div className="flex items-center justify-center">
        <Button
          type="button"
          variant="outline"
          onClick={handleClearInput}
          className="h-12 px-8 text-sm font-semibold rounded-full border-2 border-border bg-white shadow-md hover:shadow-lg hover:bg-muted/40 transition-all"
          onBlur={() => setClearConfirm(false)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {clearConfirm ? "Are you sure?" : "Clear Input"}
        </Button>
      </div>

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

      {/* Images */}
      <FormSection title="Images" required defaultOpen>
        <div className="space-y-2">
          <DynamicImageInputs imageUrls={imageUrls} onChange={setImageUrls} error={errors.images} />
          <p className="text-xs text-muted-foreground">💡 Order: lifestyle/product images first, dimension image last. Min 700px wide.</p>
        </div>
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
            <div className="-mt-0.5">
              <PdfViewer
                datasheetData={datasheetPdfData}
                websiteData={websitePdfData}
                datasheetUrl={datasheetPreviewUrl}
                websiteUrl={websitePreviewUrl}
                pdfView={pdfView}
                onPdfViewChange={setPdfView}
              />
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

      {/* Filters */}
      <FormSection title="Filters" defaultOpen={true}>
        <div className="space-y-2">
          <DynamicSpecifications
            properties={properties}
            legalValues={legalValues}
            values={specValues}
            onChange={handleSpecChange}
            onOtherValue={handleOtherValue}
            selectedMainCategory={mainCategory}
            categoryFilterMap={categoryFilterMap}
            filterDefaultMap={filterDefaultMap}
          />
          <p className="text-xs text-muted-foreground">💡 Units: Dimensions in mm, angles in °, air movement in m³/h, Fan Cutout diameter/dimensions in cm. Indoor with no IP → default IP20.</p>
        </div>
      </FormSection>

      {/* Email Notes */}
      <FormSection title="Email Notes" defaultOpen={false}>
        <div className="space-y-2">
          <Label htmlFor="email-notes" className="text-sm font-medium">Notes for Email Body</Label>
          <Textarea
            id="email-notes"
            value={emailNotes}
            onChange={(e) => setEmailNotes(e.target.value)}
            placeholder="Add any notes or special instructions for the email communication..."
            className="min-h-24 text-sm"
          />
          <p className="text-xs text-muted-foreground">These notes will be included in email communications about this product.</p>
        </div>
      </FormSection>

      {/* Submit */}
      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={isSubmitting || showSuccess}
          className="h-12 px-8 text-sm font-semibold rounded-full shadow-md hover:shadow-lg transition-all"
        >
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
