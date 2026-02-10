import { useState, useCallback, useMemo } from "react";
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
import { CheckCircle, Loader2, Send, FileText, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

  // Supplier References
  const [datasheetFile, setDatasheetFile] = useState<File | null>(null);
  const [datasheetUrl, setDatasheetUrl] = useState("");
  const [webpageUrl, setWebpageUrl] = useState("");

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
        <div className="space-y-3">
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
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={exampleTitle} className="h-9 text-sm" />
            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chatgpt-data" className="text-xs font-medium">ChatGPT-Data</Label>
            <Textarea
              id="chatgpt-data"
              value={chatgptData}
              onChange={(e) => setChatgptData(e.target.value)}
              placeholder="Product data for AI processing (editable now, will be auto-filled later)"
              className="text-sm min-h-[80px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="chatgpt-desc" className="text-xs font-medium">ChatGPT-Description</Label>
            <Textarea
              id="chatgpt-desc"
              value={chatgptDescription}
              onChange={(e) => setChatgptDescription(e.target.value)}
              placeholder="AI-generated product description (editable now, will be auto-filled later)"
              className="text-sm min-h-[80px]"
            />
            <p className="text-xs text-muted-foreground">⚠ Do not blindly rely on AI descriptions — always verify against supplier data.</p>
          </div>
        </div>
      </FormSection>

      {/* Supplier References */}
      <FormSection title="Supplier References" defaultOpen={false}>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Supplier Datasheet (PDF)
            </Label>
            <div className="flex items-center gap-2">
              <label className="flex-1">
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
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
                <Button type="button" variant="ghost" size="sm" className="h-9 text-xs" onClick={() => { setDatasheetFile(null); setDatasheetUrl(""); }}>
                  Clear
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5" /> Supplier Webpage URL
            </Label>
            <Input
              type="url"
              value={webpageUrl}
              onChange={(e) => setWebpageUrl(e.target.value)}
              placeholder="https://supplier.com/product-page"
              className="h-9 text-sm"
            />
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

      {/* Fields / Specifications */}
      <FormSection title="Fields" defaultOpen={false}>
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
      <div className="flex justify-end pt-2">
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
