import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Package } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  skus: string[];
  value: string;
  onChange: (sku: string) => void;
}

export function SkuStep({ skus, value, onChange }: Props) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return skus;
    const q = search.toLowerCase();
    return skus.filter((s) => s.toLowerCase().includes(q));
  }, [skus, search]);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Select SKU</h2>
        <p className="text-sm text-muted-foreground">Choose the product SKU to create content for.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search SKUs..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-[280px] border border-border rounded-lg">
        <div className="p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No SKUs found</p>
          ) : (
            filtered.map((sku) => (
              <button
                key={sku}
                type="button"
                onClick={() => onChange(sku)}
                className={cn(
                  "w-full text-left px-3 py-2.5 rounded-md text-sm font-mono transition-colors flex items-center gap-2",
                  value === sku
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted/60 text-foreground"
                )}
              >
                <Package className="h-3.5 w-3.5 shrink-0 opacity-60" />
                {sku}
              </button>
            ))
          )}
        </div>
      </ScrollArea>

      {value && (
        <div className="flex items-center gap-2 text-sm">
          <Label className="text-muted-foreground">Selected:</Label>
          <span className="font-mono font-semibold text-primary">{value}</span>
        </div>
      )}
    </div>
  );
}
