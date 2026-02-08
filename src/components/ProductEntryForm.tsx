import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSection } from "@/components/FormSection";
import { CategoryTreeDropdown } from "@/components/CategoryTreeDropdown";
import { ImageUrlInputs } from "@/components/ImageUrlInputs";
import { SpecificationsInputs, Specifications } from "@/components/SpecificationsInputs";
import { useCategories } from "@/hooks/useCategories";
import { CheckCircle, Loader2, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormErrors {
  sku?: string;
  title?: string;
  category?: string;
  images?: string;
}

const initialSpecs: Specifications = {
  colour1: "",
  colour2: "",
  beamAngle: "",
  colourTemp: "",
  diameter: "",
  height: "",
  width: "",
  cutoutSize: "",
  depth: "",
  material1: "",
  material2: "",
  mounting: "",
  ipRating: "",
  globeType: "",
  dimmable: "",
  lowVoltageOptions: "",
};

export function ProductEntryForm() {
  const { toast } = useToast();
  const { categories } = useCategories();

  // Basic Info
  const [sku, setSku] = useState("");
  const [title, setTitle] = useState("");

  // Categories (new tree-based)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mainCategory, setMainCategory] = useState("");

  // Images (8 slots)
  const [imageUrls, setImageUrls] = useState<string[]>(Array(8).fill(""));

  // Specifications
  const [specs, setSpecs] = useState<Specifications>(initialSpecs);

  // Form state
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleImageUrlChange = useCallback((index: number, value: string) => {
    setImageUrls((prev) => {
      const newUrls = [...prev];
      newUrls[index] = value;
      return newUrls;
    });
  }, []);

  const handleSpecChange = useCallback((field: keyof Specifications, value: string) => {
    setSpecs((prev) => ({ ...prev, [field]: value === "none" ? "" : value }));
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!sku.trim()) {
      newErrors.sku = "SKU is required";
    }

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }

    // Category validation
    if (selectedCategories.length === 0) {
      newErrors.category = "At least one category must be selected";
    } else if (!mainCategory) {
      newErrors.category = "Please set one selected category as the MAIN category.";
    }

    // At least one image URL required
    if (!imageUrls[0]?.trim()) {
      newErrors.images = "At least one image URL is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetForm = () => {
    setSku("");
    setTitle("");
    setSelectedCategories([]);
    setMainCategory("");
    setImageUrls(Array(8).fill(""));
    setSpecs(initialSpecs);
    setErrors({});
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
      const allPaths = [mainCategory, ...otherPaths];

      const formData = {
        timestamp: new Date().toISOString(),
        sku: sku.trim(),
        title: title.trim(),
        MainCategoryPath: mainCategory,
        OtherCategoryPaths: otherPaths.join(";"),
        AllCategoryPaths: allPaths.join(";"),
        imageUrl1: imageUrls[0] || "",
        imageUrl2: imageUrls[1] || "",
        imageUrl3: imageUrls[2] || "",
        imageUrl4: imageUrls[3] || "",
        imageUrl5: imageUrls[4] || "",
        imageUrl6: imageUrls[5] || "",
        imageUrl7: imageUrls[6] || "",
        imageUrl8: imageUrls[7] || "",
        ...specs,
      };

      // TODO: Replace with your Google Sheets Web App URL
      console.log("Form data to submit:", formData);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

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
        description: "There was an error submitting the product. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Info Section */}
      <FormSection title="Basic Info" required defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="sku" className="text-xs font-medium">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input
              id="sku"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. LED-SPOT-001"
              className="h-9 text-sm font-mono"
            />
            {errors.sku && <p className="text-destructive text-xs">{errors.sku}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. 10W LED Ceiling Spotlight - White"
              className="h-9 text-sm"
            />
            {errors.title && <p className="text-destructive text-xs">{errors.title}</p>}
          </div>
        </div>
      </FormSection>

      {/* Categories Section */}
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

      {/* Images Section */}
      <FormSection title="Images" required defaultOpen>
        <ImageUrlInputs
          imageUrls={imageUrls}
          onImageUrlChange={handleImageUrlChange}
          error={errors.images}
        />
      </FormSection>

      {/* Specifications Section */}
      <FormSection title="Specifications" defaultOpen={false}>
        <SpecificationsInputs specs={specs} onSpecChange={handleSpecChange} />
      </FormSection>

      {/* Submit Button */}
      <div className="flex justify-end pt-2">
        <Button
          type="submit"
          disabled={isSubmitting || showSuccess}
          className="min-w-[160px] h-10"
        >
          {showSuccess ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Submitted!
            </>
          ) : isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Submit Product
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
