import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, Check, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SkuEntry } from "@/lib/api";

interface SkuSelectorProps {
  products: SkuEntry[];
  value: string;
  onSelect: (sku: string, brand: string) => void;
  error?: string;
}

export function SkuSelector({ products, value, onSelect, error }: SkuSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
    );
  }, [products, search]);

  // Group filtered products by brand - only recalculate when filtered changes
  const grouped = useMemo(() => {
    const groups: Record<string, SkuEntry[]> = {};
    filtered.forEach((product) => {
      if (!groups[product.brand]) {
        groups[product.brand] = [];
      }
      groups[product.brand].push(product);
    });
    return Object.entries(groups)
      .sort(([brandA], [brandB]) => brandA.localeCompare(brandB))
      .map(([brand, skus]) => ({ brand, skus, count: skus.length }));
  }, [filtered]);

  const toggleBrand = useCallback((brand: string) => {
    setExpandedBrands((prev) => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(brand)) {
        newExpanded.delete(brand);
      } else {
        newExpanded.add(brand);
      }
      return newExpanded;
    });
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    else setSearch("");
  }, [open]);

  // Auto-expand all brands when search length > 2
  useEffect(() => {
    if (search.length > 2) {
      const allBrands = new Set(grouped.map(({ brand }) => brand));
      setExpandedBrands(allBrands);
    } else {
      setExpandedBrands(new Set());
    }
  }, [search.length, grouped]);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            className="w-full justify-between h-9 text-sm font-normal"
          >
            <span className={cn("truncate font-mono", !value && "text-muted-foreground")}>
              {value || "Search & select SKU..."}
            </span>
            <ChevronDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 z-50 bg-popover"
          align="start"
          sideOffset={4}
        >
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Search SKU or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 text-sm"
              />
            </div>
          </div>
          <div className="max-h-[250px] overflow-y-auto">
            {grouped.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-3">No SKUs found</p>
            ) : (
              <div className="p-1">
                {grouped.map(({ brand, skus }) => (
                  <div key={brand}>
                    {/* Brand header (collapsible) */}
                    <button
                      type="button"
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded-sm text-sm text-left hover:bg-muted/60 transition-colors font-semibold"
                      onClick={() => toggleBrand(brand)}
                    >
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 transition-transform",
                          expandedBrands.has(brand) && "rotate-90"
                        )}
                      />
                      <span>{brand}</span>
                    </button>

                    {/* Expanded SKU list */}
                    {expandedBrands.has(brand) && (
                      <div className="bg-muted/20">
                        {skus.map((product) => (
                          <button
                            key={product.sku}
                            type="button"
                            className={cn(
                              "w-full flex items-center gap-2 px-2 py-1.5 pl-8 rounded-sm text-sm text-left hover:bg-muted/60 transition-colors",
                              value === product.sku && "bg-muted"
                            )}
                            onClick={() => {
                              onSelect(product.sku, product.brand);
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                value === product.sku ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <span className="font-mono text-xs">{product.sku}</span>
                            <span className="text-muted-foreground text-xs">— {product.brand}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}
