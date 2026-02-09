import { CategoryTreeDropdown } from "@/components/CategoryTreeDropdown";
import type { CategoryLevel } from "@/data/categoryData";

interface Props {
  categories: CategoryLevel[];
  selectedPaths: string[];
  mainPath: string;
  onSelectedChange: (paths: string[]) => void;
  onMainChange: (path: string) => void;
}

export function CategoriesStep({ categories, selectedPaths, mainPath, onSelectedChange, onMainChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Categories</h2>
        <p className="text-sm text-muted-foreground">
          Select one or more categories. Mark exactly one as the <strong>Main</strong> category.
          Output format: Main;Extra;Extra
        </p>
      </div>
      <CategoryTreeDropdown
        categories={categories}
        selectedPaths={selectedPaths}
        mainPath={mainPath}
        onSelectedChange={onSelectedChange}
        onMainChange={onMainChange}
      />
    </div>
  );
}
