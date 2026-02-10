import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, AlertCircle, CheckCircle2, Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface DynamicImageInputsProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}

const MAX_IMAGES = 8;
const MIN_DIMENSION = 650;
const VALID_EXTENSIONS = /\.(jpe?g|png|gif|webp)$/i;
const URL_PATTERN = /^https?:\/\/.+/i;

type ValidationState = "idle" | "loading" | "valid" | "error";

interface ImageValidation {
  state: ValidationState;
  message?: string;
  width?: number;
  height?: number;
}

function useImageValidation(url: string): ImageValidation {
  const [result, setResult] = useState<ImageValidation>({ state: "idle" });

  useEffect(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setResult({ state: "idle" });
      return;
    }

    // Check URL format
    if (!URL_PATTERN.test(trimmed)) {
      setResult({ state: "error", message: "URL must start with http:// or https://" });
      return;
    }

    // Check extension
    if (!VALID_EXTENSIONS.test(trimmed)) {
      setResult({
        state: "error",
        message: "Must end in .jpg, .jpeg, .png, .gif, or .webp",
      });
      return;
    }

    // Try loading image to check dimensions
    setResult({ state: "loading" });
    const img = new Image();
    let cancelled = false;

    img.onload = () => {
      if (cancelled) return;
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w < MIN_DIMENSION || h < MIN_DIMENSION) {
        setResult({
          state: "error",
          message: `Image is ${w}×${h}px — minimum is ${MIN_DIMENSION}×${MIN_DIMENSION}px`,
          width: w,
          height: h,
        });
      } else {
        setResult({ state: "valid", width: w, height: h });
      }
    };

    img.onerror = () => {
      if (cancelled) return;
      // CORS or unreachable — still accept the URL if format is valid
      setResult({
        state: "valid",
        message: "Preview unavailable due to host restrictions",
      });
    };

    img.src = trimmed;

    return () => {
      cancelled = true;
    };
  }, [url]);

  return result;
}

function ImageField({
  url,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  url: string;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const validation = useImageValidation(url);

  return (
    <div className="space-y-2">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor={`image-${index}`} className="text-xs font-medium">
            Image URL {index + 1}
            {index === 0 && <span className="text-destructive ml-1">*</span>}
          </Label>
          <div className="relative">
            <Input
              id={`image-${index}`}
              type="url"
              value={url}
              onChange={(e) => onChange(e.target.value)}
              placeholder={
                index === 0
                  ? "https://example.com/image1.jpg (required)"
                  : "https://example.com/image.jpg"
              }
              className={cn(
                "h-9 text-sm pr-8",
                validation.state === "error" && "border-destructive",
                validation.state === "valid" && url.trim() && "border-success"
              )}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              {validation.state === "loading" && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
              {validation.state === "valid" && url.trim() && (
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              )}
              {validation.state === "error" && (
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              )}
            </div>
          </div>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
            onClick={onRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Validation message */}
      {validation.state === "error" && validation.message && (
        <p className="text-destructive text-xs flex items-center gap-1">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {validation.message}
        </p>
      )}
      {validation.state === "valid" && validation.message && (
        <p className="text-muted-foreground text-xs">{validation.message}</p>
      )}

      {/* Image preview */}
      {url.trim() && URL_PATTERN.test(url.trim()) && VALID_EXTENSIONS.test(url.trim()) && (
        <div className="border border-border rounded-lg overflow-hidden bg-muted/30 w-32 h-32 flex items-center justify-center">
          {validation.state === "valid" && !validation.message?.includes("Preview unavailable") ? (
            <img
              src={url.trim()}
              alt={`Preview ${index + 1}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : validation.state === "loading" ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground p-2">
              <ImageOff className="h-5 w-5" />
              <span className="text-[10px] text-center leading-tight">
                {validation.state === "error" ? "Invalid" : "No preview"}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Dimensions badge */}
      {validation.width && validation.height && (
        <p className="text-xs text-muted-foreground">
          {validation.width} × {validation.height}px
        </p>
      )}
    </div>
  );
}

export function DynamicImageInputs({ imageUrls, onChange, error }: DynamicImageInputsProps) {
  const handleChange = useCallback(
    (index: number, value: string) => {
      const next = [...imageUrls];
      next[index] = value;
      onChange(next);
    },
    [imageUrls, onChange]
  );

  const addField = useCallback(() => {
    if (imageUrls.length < MAX_IMAGES) {
      onChange([...imageUrls, ""]);
    }
  }, [imageUrls, onChange]);

  const removeField = useCallback(
    (index: number) => {
      if (index === 0) return;
      onChange(imageUrls.filter((_, i) => i !== index));
    },
    [imageUrls, onChange]
  );

  return (
    <div className="space-y-4">
      {imageUrls.map((url, index) => (
        <ImageField
          key={index}
          url={url}
          index={index}
          onChange={(v) => handleChange(index, v)}
          onRemove={() => removeField(index)}
          canRemove={index > 0}
        />
      ))}

      {imageUrls.length < MAX_IMAGES && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={addField}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add another image
        </Button>
      )}

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
