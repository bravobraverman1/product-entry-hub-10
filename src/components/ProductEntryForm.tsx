import { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSection } from "@/components/FormSection";
import { CategoryTreeDropdown } from "@/components/CategoryTreeDropdown";
import { DynamicImageInputs } from "@/components/DynamicImageInputs";
import { DynamicSpecifications } from "@/components/DynamicSpecifications";
import { SkuSelector } from "@/components/SkuSelector";
import { ReopenSku } from "@/components/ReopenSku";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  fetchSkus,
  fetchCategories,
  fetchProperties,
  submitProduct,
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

  // Fetch data via API layer
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

  // Basic Info
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [title, setTitle] = useState("");

  // Random example title as placeholder
  const exampleTitle = useMemo(() => {
    const titles = skus.map((p) => p.exampleTitle).filter(Boolean);
    if (titles.length === 0) return "e.g. 10W LED Ceiling Spotlight - White";
    return titles[Math.floor(Math.random() * titles.length)];
  }, [skus]);

  // Categories
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mainCategory, setMainCategory] = useState("");

  // Images (start with 1)
  const [imageUrls, setImageUrls] = useState<string[]>([""]);

  // Specs (dynamic keys)
  const [specValues, setSpecValues] = useState<Record<string, string>>({});

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setSku("");
    setBrand("");
    setTitle("");
    setSelectedCategories([]);
    setMainCategory("");
    setImageUrls([""]);
    setSpecValues({});
    setErrors({});
    setIsReopened(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields.",
      });
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
        timestamp: new Date().toISOString(),
      };

      await submitProduct(payload);

      setShowSuccess(true);
      toast({
        title: "Product Submitted!",
        description: `SKU ${sku} has been added successfully.`,
      });

      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
      }, 2000);
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "There was an error submitting the product.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Reopen SKU */}
      <FormSection title="Reopen SKU" defaultOpen={false}>
        <ReopenSku onReopened={handleReopened} />
      </FormSection>

      {/* Basic Info */}
      <FormSection title="Basic Info" required defaultOpen>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">
                SKU <span className="text-destructive">*</span>
              </Label>
              <SkuSelector
                products={skus}
                value={sku}
                onSelect={handleSkuSelect}
                error={errors.sku}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Brand</Label>
              <Input
                value={brand}
                readOnly
                placeholder="Auto-filled from SKU"
                className="h-9 text-sm bg-muted/50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={exampleTitle}
              className="h-9 text-sm"
            />
            {errors.title && (
              <p className="text-destructive text-xs">{errors.title}</p>
            )}
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
        <DynamicImageInputs
          imageUrls={imageUrls}
          onChange={setImageUrls}
          error={errors.images}
        />
      </FormSection>

      {/* Fields / Specifications */}
      <FormSection title="Fields" defaultOpen={false}>
        <DynamicSpecifications
          properties={properties}
          legalValues={legalValues}
          values={specValues}
          onChange={handleSpecChange}
        />
      </FormSection>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || showSuccess}
          className="min-w-[160px] h-10"
        >
          {showSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" /> Submitted!
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Submit Product
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
