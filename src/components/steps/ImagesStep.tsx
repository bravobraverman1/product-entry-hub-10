import { useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_IMAGES = 8;
const URL_REGEX = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;
const MIN_SIZE = 650;

interface ImageStatus {
  loading: boolean;
  valid: boolean | null;
  error?: string;
  width?: number;
  height?: number;
}

interface Props {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
}

export function ImagesStep({ imageUrls, onChange }: Props) {
  const [statuses, setStatuses] = useState<Record<number, ImageStatus>>({});

  const validateImage = useCallback((url: string, index: number) => {
    if (!url.trim()) {
      setStatuses((prev) => ({ ...prev, [index]: { loading: false, valid: null } }));
      return;
    }
    if (!URL_REGEX.test(url)) {
      setStatuses((prev) => ({
        ...prev,
        [index]: { loading: false, valid: false, error: "URL must start with http(s) and end with jpg/jpeg/png/webp/gif" },
      }));
      return;
    }
    setStatuses((prev) => ({ ...prev, [index]: { loading: true, valid: null } }));
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (w < MIN_SIZE || h < MIN_SIZE) {
        setStatuses((prev) => ({
          ...prev,
          [index]: { loading: false, valid: false, error: `Image is ${w}×${h}. Minimum ${MIN_SIZE}×${MIN_SIZE} required.`, width: w, height: h },
        }));
      } else {
        setStatuses((prev) => ({
          ...prev,
          [index]: { loading: false, valid: true, width: w, height: h },
        }));
      }
    };
    img.onerror = () => {
      setStatuses((prev) => ({
        ...prev,
        [index]: { loading: false, valid: false, error: "Could not load image" },
      }));
    };
    img.src = url;
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      const next = [...imageUrls];
      next[index] = value;
      onChange(next);
    },
    [imageUrls, onChange]
  );

  const handleBlur = useCallback(
    (index: number) => {
      validateImage(imageUrls[index], index);
    },
    [imageUrls, validateImage]
  );

  const addField = () => {
    if (imageUrls.length < MAX_IMAGES) onChange([...imageUrls, ""]);
  };

  const removeField = (index: number) => {
    if (index === 0) return;
    onChange(imageUrls.filter((_, i) => i !== index));
    setStatuses((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  // Validate on mount for pre-existing URLs
  useEffect(() => {
    imageUrls.forEach((url, i) => {
      if (url.trim()) validateImage(url, i);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validImages = imageUrls.filter(
    (url, i) => url.trim() && statuses[i]?.valid === true
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Images</h2>
        <p className="text-sm text-muted-foreground">
          Add up to {MAX_IMAGES} image URLs. Images must be at least {MIN_SIZE}×{MIN_SIZE}px.
        </p>
      </div>

      <div className="space-y-3">
        {imageUrls.map((url, index) => {
          const status = statuses[index];
          return (
            <div key={index} className="space-y-1">
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-medium">
                    Image {index + 1}
                    {index === 0 && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  <div className="relative">
                    <Input
                      value={url}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onBlur={() => handleBlur(index)}
                      placeholder="https://example.com/image.jpg"
                    className={cn(
                        "pr-8",
                        status?.valid === false && "border-destructive",
                        status?.valid === true && "border-success"
                      )}
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                      {status?.loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                      {status?.valid === true && <CheckCircle2 className="h-4 w-4 text-success" />}
                      {status?.valid === false && <AlertCircle className="h-4 w-4 text-destructive" />}
                    </div>
                  </div>
                </div>
                {index > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive"
                    onClick={() => removeField(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {status?.valid === false && status.error && (
                <p className="text-destructive text-xs flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {status.error}
                </p>
              )}
              {status?.valid === true && status.width && (
                <p className="text-xs text-muted-foreground">
                  {status.width}×{status.height}px ✓
                </p>
              )}
            </div>
          );
        })}
      </div>

      {imageUrls.length < MAX_IMAGES && (
        <Button type="button" variant="outline" size="sm" onClick={addField} className="gap-1">
          <Plus className="h-3.5 w-3.5" /> Add another image
        </Button>
      )}

      {/* Thumbnail previews */}
      {validImages.length > 0 && (
        <div>
          <Label className="text-xs text-muted-foreground mb-2 block">Preview</Label>
          <div className="grid grid-cols-4 gap-3">
            {validImages.map((url, i) => (
              <div
                key={i}
                className="aspect-square rounded-lg border border-border overflow-hidden bg-muted/30"
              >
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
