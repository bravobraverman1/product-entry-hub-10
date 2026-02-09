import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";

interface DynamicImageInputsProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  error?: string;
}

const MAX_IMAGES = 8;

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
      if (index === 0) return; // Can't remove first
      onChange(imageUrls.filter((_, i) => i !== index));
    },
    [imageUrls, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {imageUrls.map((url, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1 space-y-1">
              <Label htmlFor={`image-${index}`} className="text-xs font-medium">
                Image URL {index + 1}
                {index === 0 && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                id={`image-${index}`}
                type="url"
                value={url}
                onChange={(e) => handleChange(index, e.target.value)}
                placeholder={
                  index === 0
                    ? "https://example.com/image1.jpg (required)"
                    : "https://example.com/image.jpg"
                }
                className="h-9 text-sm"
              />
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
        ))}
      </div>

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
