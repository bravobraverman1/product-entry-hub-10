import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useSheetData, useSubmitProduct } from "@/hooks/useSheetData";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, ChevronLeft, ChevronRight, Loader2, Send } from "lucide-react";
import { SkuStep } from "@/components/steps/SkuStep";
import { ChatGptStep } from "@/components/steps/ChatGptStep";
import { CategoriesStep } from "@/components/steps/CategoriesStep";
import { TitleDescStep } from "@/components/steps/TitleDescStep";
import { ImagesStep } from "@/components/steps/ImagesStep";
import { MasterFilterStep } from "@/components/steps/MasterFilterStep";
import { ReviewStep } from "@/components/steps/ReviewStep";

const STEPS = [
  { label: "SKU", key: "sku" },
  { label: "ChatGPT", key: "chatgpt" },
  { label: "Categories", key: "categories" },
  { label: "Title & Desc", key: "titledesc" },
  { label: "Images", key: "images" },
  { label: "Master Filter", key: "masterfilter" },
  { label: "Review", key: "review" },
] as const;

interface Props {
  onSkuChange: (sku: string) => void;
}

export function ProductStepper({ onSkuChange }: Props) {
  const { toast } = useToast();
  const { data: sheetData } = useSheetData();
  const submitMutation = useSubmitProduct();

  const [step, setStep] = useState(0);
  const [sku, setSku] = useState("");
  const [chatgptData, setChatgptData] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [mainCategory, setMainCategory] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([""]);
  const [masterFilterEnabled, setMasterFilterEnabled] = useState(false);
  const [masterFilterValues, setMasterFilterValues] = useState<Record<number, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Available SKUs: status=READY and visibility=1
  const availableSkus = sheetData.products
    .filter((p) => p.status === "READY" && p.visibility === 1)
    .map((p) => p.sku);

  useEffect(() => {
    onSkuChange(sku);
  }, [sku, onSkuChange]);

  const handleMasterFilterChange = useCallback((row: number, value: string) => {
    setMasterFilterValues((prev) => ({ ...prev, [row]: value }));
  }, []);

  // Step validation
  const validateStep = (s: number): string | null => {
    switch (s) {
      case 0: return sku ? null : "Select a SKU";
      case 1: return null; // ChatGPT is optional
      case 2:
        if (selectedCategories.length === 0) return "Select at least one category";
        if (!mainCategory) return "Choose a main category";
        return null;
      case 3:
        if (!title.trim()) return "Title is required";
        return null;
      case 4:
        if (!imageUrls[0]?.trim()) return "At least one image URL is required";
        for (const url of imageUrls.filter(Boolean)) {
          if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i.test(url)) {
            return `Invalid image URL: ${url}`;
          }
        }
        return null;
      default: return null;
    }
  };

  const goNext = () => {
    const err = validateStep(step);
    if (err) {
      toast({ variant: "destructive", title: "Validation", description: err });
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 0));

  const resetForm = () => {
    setStep(0);
    setSku("");
    setChatgptData("");
    setSelectedCategories([]);
    setMainCategory("");
    setTitle("");
    setDescription("");
    setImageUrls([""]);
    setMasterFilterEnabled(false);
    setMasterFilterValues({});
  };

  // Build category string: Main;Extra;Extra
  const categoryString = (() => {
    const others = selectedCategories.filter((p) => p !== mainCategory);
    return [mainCategory, ...others].filter(Boolean).join(";");
  })();

  const handleSubmit = async () => {
    // Final validation
    for (let i = 0; i < STEPS.length - 1; i++) {
      const err = validateStep(i);
      if (err) {
        toast({ variant: "destructive", title: "Validation Error", description: err });
        setStep(i);
        return;
      }
    }

    const mfValues = masterFilterEnabled
      ? sheetData.masterFilterLabels
          .filter((mf) => masterFilterValues[mf.row]?.trim())
          .map((mf) => ({ row: mf.row, value: masterFilterValues[mf.row] }))
      : undefined;

    submitMutation.mutate(
      {
        sku,
        chatgptData,
        categories: categoryString,
        title,
        description,
        imageUrls: imageUrls.filter(Boolean),
        masterFilterValues: mfValues,
      },
      {
        onSuccess: () => {
          setShowSuccess(true);
          toast({ title: "Submission saved!", description: `SKU ${sku} written to sheet.` });
          setTimeout(() => {
            setShowSuccess(false);
            resetForm();
          }, 2500);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to submit." });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => {
              // Allow clicking completed steps
              if (i < step) setStep(i);
            }}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
              i === step && "bg-primary text-primary-foreground",
              i < step && "bg-primary/10 text-primary cursor-pointer hover:bg-primary/20",
              i > step && "bg-muted/50 text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0",
                i === step && "bg-primary-foreground text-primary",
                i < step && "bg-primary text-primary-foreground",
                i > step && "bg-muted text-muted-foreground"
              )}
            >
              {i < step ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            {s.label}
          </button>
        ))}
      </div>

      {/* Step content */}
      <div className="border border-border rounded-xl bg-card p-6 min-h-[320px]">
        {step === 0 && (
          <SkuStep skus={availableSkus} value={sku} onChange={setSku} />
        )}
        {step === 1 && (
          <ChatGptStep value={chatgptData} onChange={setChatgptData} />
        )}
        {step === 2 && (
          <CategoriesStep
            categories={sheetData.categories}
            selectedPaths={selectedCategories}
            mainPath={mainCategory}
            onSelectedChange={setSelectedCategories}
            onMainChange={setMainCategory}
          />
        )}
        {step === 3 && (
          <TitleDescStep
            title={title}
            description={description}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
          />
        )}
        {step === 4 && (
          <ImagesStep imageUrls={imageUrls} onChange={setImageUrls} />
        )}
        {step === 5 && (
          <MasterFilterStep
            enabled={masterFilterEnabled}
            onToggle={setMasterFilterEnabled}
            labels={sheetData.masterFilterLabels}
            values={masterFilterValues}
            onChange={handleMasterFilterChange}
          />
        )}
        {step === 6 && (
          <ReviewStep
            sku={sku}
            chatgptData={chatgptData}
            categoryString={categoryString}
            title={title}
            description={description}
            imageUrls={imageUrls.filter(Boolean)}
            masterFilterEnabled={masterFilterEnabled}
            masterFilterLabels={sheetData.masterFilterLabels}
            masterFilterValues={masterFilterValues}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={goPrev}
          disabled={step === 0}
          className="gap-1"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </Button>

        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={goNext} className="gap-1">
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitMutation.isPending || showSuccess}
            className="gap-2 min-w-[160px]"
          >
            {showSuccess ? (
              <><Check className="h-4 w-4" /> Submitted!</>
            ) : submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
            ) : (
              <><Send className="h-4 w-4" /> Submit Product</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
