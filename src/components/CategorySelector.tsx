import { useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  categoryTree,
  getChoice2Options,
  getChoice3Options,
  hasChoice3,
  buildCategoryPath,
} from "@/data/categoryData";

interface CategorySelectorProps {
  choice1: string;
  choice2: string;
  choice3: string;
  onChoice1Change: (value: string) => void;
  onChoice2Change: (value: string) => void;
  onChoice3Change: (value: string) => void;
  error?: string;
}

export function CategorySelector({
  choice1,
  choice2,
  choice3,
  onChoice1Change,
  onChoice2Change,
  onChoice3Change,
  error,
}: CategorySelectorProps) {
  const choice2Options = choice1 ? getChoice2Options(choice1) : [];
  const choice3Options = choice1 && choice2 ? getChoice3Options(choice1, choice2) : [];
  const showChoice3 = choice1 && choice2 && hasChoice3(choice1, choice2);
  const categoryPath = buildCategoryPath(choice1, choice2, choice3);

  // Reset lower levels when higher level changes
  useEffect(() => {
    if (!choice1) {
      onChoice2Change("");
      onChoice3Change("");
    }
  }, [choice1, onChoice2Change, onChoice3Change]);

  useEffect(() => {
    if (!choice2) {
      onChoice3Change("");
    }
  }, [choice2, onChoice3Change]);

  const handleChoice1Change = (value: string) => {
    onChoice1Change(value);
    onChoice2Change("");
    onChoice3Change("");
  };

  const handleChoice2Change = (value: string) => {
    onChoice2Change(value);
    onChoice3Change("");
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Choice 1 */}
        <div className="space-y-1.5">
          <Label htmlFor="choice1" className="text-xs font-medium">
            Choice 1 (Level 1) <span className="text-destructive">*</span>
          </Label>
          <Select value={choice1} onValueChange={handleChoice1Change}>
            <SelectTrigger id="choice1" className="h-9">
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {categoryTree.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Choice 2 */}
        <div className="space-y-1.5">
          <Label htmlFor="choice2" className="text-xs font-medium">
            Choice 2 (Level 2) <span className="text-destructive">*</span>
          </Label>
          <Select
            value={choice2}
            onValueChange={handleChoice2Change}
            disabled={!choice1 || choice2Options.length === 0}
          >
            <SelectTrigger id="choice2" className="h-9">
              <SelectValue placeholder={choice1 ? "Select subcategory..." : "Select Choice 1 first"} />
            </SelectTrigger>
            <SelectContent>
              {choice2Options.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Choice 3 */}
        <div className="space-y-1.5">
          <Label htmlFor="choice3" className="text-xs font-medium">
            Choice 3 (Level 3) {showChoice3 && <span className="text-destructive">*</span>}
          </Label>
          <Select
            value={choice3}
            onValueChange={onChoice3Change}
            disabled={!showChoice3}
          >
            <SelectTrigger id="choice3" className="h-9">
              <SelectValue
                placeholder={
                  !choice2
                    ? "Select Choice 2 first"
                    : showChoice3
                    ? "Select type..."
                    : "N/A for this category"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {choice3Options.map((cat) => (
                <SelectItem key={cat.name} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Final Category Path */}
      <div className="space-y-1.5">
        <Label htmlFor="categoryPath" className="text-xs font-medium text-muted-foreground">
          Final Category Path (Preview)
        </Label>
        <Input
          id="categoryPath"
          value={categoryPath}
          readOnly
          placeholder="Category path will appear here..."
          className="h-9 bg-muted/50 font-mono text-sm"
        />
      </div>

      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
