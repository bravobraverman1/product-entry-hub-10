import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { useSheetData, useSetVisibility } from "@/hooks/useSheetData";
import { useToast } from "@/hooks/use-toast";

export function VisibilityManager() {
  const { toast } = useToast();
  const { data: sheetData } = useSheetData();
  const setVisibility = useSetVisibility();
  const [search, setSearch] = useState("");
  const [pendingSku, setPendingSku] = useState<string | null>(null);

  const products = sheetData.products;

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter((p) => p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const handleToggle = (sku: string, currentlyVisible: boolean) => {
    const newVal = currentlyVisible ? 0 : 1;
    setPendingSku(sku);
    setVisibility.mutate(
      { sku, visible: newVal },
      {
        onSuccess: () => {
          toast({
            title: `${sku} ${newVal === 1 ? "visible" : "hidden"}`,
            description: `Visibility set to ${newVal}`,
          });
          setPendingSku(null);
        },
        onError: () => {
          toast({ variant: "destructive", title: "Error", description: "Failed to update visibility." });
          setPendingSku(null);
        },
      }
    );
  };

  const visibleCount = products.filter((p) => p.visibility === 1).length;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Visibility Manager</h2>
        <p className="text-sm text-muted-foreground">
          Toggle SKU visibility. Visible SKUs appear in the product entry dropdown.
        </p>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary">{visibleCount} visible</Badge>
          <Badge variant="outline">{products.length - visibleCount} hidden</Badge>
        </div>
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

      <div className="border border-border rounded-xl bg-card overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-2 bg-muted/40 text-xs font-medium text-muted-foreground border-b border-border">
          <span>SKU</span>
          <span>Status</span>
          <span>Visible</span>
          <span className="text-right">Toggle</span>
        </div>
        <ScrollArea className="h-[400px]">
          <div className="divide-y divide-border">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No products found</p>
            ) : (
              filtered.map((product) => {
                const isVisible = product.visibility === 1;
                const isPending = pendingSku === product.sku;
                return (
                  <div
                    key={product.sku}
                    className="grid grid-cols-[1fr_80px_80px_80px] gap-2 px-4 py-3 items-center hover:bg-muted/20 transition-colors"
                  >
                    <span className="font-mono text-sm font-medium truncate">{product.sku}</span>
                    <Badge
                      variant={product.status === "READY" ? "default" : "secondary"}
                      className="text-[10px] w-fit"
                    >
                      {product.status || "—"}
                    </Badge>
                    <Badge
                      variant={isVisible ? "default" : "outline"}
                      className="text-[10px] w-fit"
                    >
                      {isVisible ? "Yes" : "No"}
                    </Badge>
                    <div className="flex justify-end">
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <Switch
                          checked={isVisible}
                          onCheckedChange={() => handleToggle(product.sku, isVisible)}
                        />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
