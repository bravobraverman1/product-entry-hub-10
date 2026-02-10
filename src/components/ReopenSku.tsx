import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { reopenSku, type ReopenedProduct } from "@/lib/api";

interface ReopenSkuProps {
  onReopened: (data: ReopenedProduct) => void;
}

export function ReopenSku({ onReopened }: ReopenSkuProps) {
  const { toast } = useToast();
  const [sku, setSku] = useState("");
  const [loading, setLoading] = useState(false);
  const [reopened, setReopened] = useState(false);

  const handleReopen = useCallback(async () => {
    const trimmed = sku.trim();
    if (!trimmed) {
      toast({ variant: "destructive", title: "SKU Required", description: "Enter a SKU to reopen." });
      return;
    }

    setLoading(true);
    try {
      const data = await reopenSku(trimmed);
      setReopened(true);
      onReopened(data);
      toast({ title: "SKU Reopened", description: `${trimmed} has been reopened for editing.` });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Reopen Failed",
        description: err instanceof Error ? err.message : "Could not reopen SKU.",
      });
    } finally {
      setLoading(false);
    }
  }, [sku, toast, onReopened]);

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5 max-w-sm">
          <Label className="text-xs font-medium">Reopen SKU</Label>
          <Input
            value={sku}
            onChange={(e) => {
              setSku(e.target.value);
              setReopened(false);
            }}
            placeholder="Enter SKU to reopen…"
            className="h-9 text-sm font-mono"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleReopen}
          disabled={loading || !sku.trim()}
          className="h-9"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4 mr-1.5" />
          )}
          Reopen
        </Button>
      </div>

      {reopened && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/60 border border-border">
          <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            This SKU was reopened. After editing, it must be resubmitted to be completed again.
          </p>
        </div>
      )}
    </div>
  );
}
