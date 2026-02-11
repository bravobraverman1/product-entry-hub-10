import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormSection } from "@/components/FormSection";
import { Eye, Ban, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tempMakeVisible, markNotForSale, markSkuComplete, markSkuIncomplete } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const ProductOptions = () => {
  const { toast } = useToast();

  // Temp Make Visible
  const [visSkU, setVisSku] = useState("");
  const [visLoading, setVisLoading] = useState(false);

  const handleMakeVisible = useCallback(async () => {
    if (!visSkU.trim()) {
      toast({ variant: "destructive", title: "SKU Required", description: "Enter a SKU." });
      return;
    }
    setVisLoading(true);
    try {
      await tempMakeVisible(visSkU.trim());
      toast({ title: "Success", description: `SKU ${visSkU} is now visible.` });
      setVisSku("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to update visibility.",
      });
    } finally {
      setVisLoading(false);
    }
  }, [visSkU, toast]);

  // Mark Not For Sale
  const [nfsSkU, setNfsSku] = useState("");
  const [nfsLoading, setNfsLoading] = useState(false);

  const handleMarkNotForSale = useCallback(async () => {
    if (!nfsSkU.trim()) {
      toast({ variant: "destructive", title: "SKU Required", description: "Enter a SKU." });
      return;
    }
    setNfsLoading(true);
    try {
      await markNotForSale(nfsSkU.trim());
      toast({ title: "Success", description: `SKU ${nfsSkU} marked as Not For Sale.` });
      setNfsSku("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to mark SKU.",
      });
    } finally {
      setNfsLoading(false);
    }
  }, [nfsSkU, toast]);

  // Mark SKU Complete
  const [completeSku, setCompleteSku] = useState("");
  const [completeLoading, setCompleteLoading] = useState(false);

  const handleMarkComplete = useCallback(async () => {
    if (!completeSku.trim()) {
      toast({ variant: "destructive", title: "SKU Required", description: "Enter a SKU." });
      return;
    }
    setCompleteLoading(true);
    try {
      await markSkuComplete(completeSku.trim());
      toast({ title: "Success", description: `SKU ${completeSku} marked as complete.` });
      setCompleteSku("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to mark SKU complete.",
      });
    } finally {
      setCompleteLoading(false);
    }
  }, [completeSku, toast]);

  // Mark SKU Incomplete
  const [incompleteSku, setIncompleteSku] = useState("");
  const [incompleteLoading, setIncompleteLoading] = useState(false);

  const handleMarkIncomplete = useCallback(async () => {
    if (!incompleteSku.trim()) {
      toast({ variant: "destructive", title: "SKU Required", description: "Enter a SKU." });
      return;
    }
    setIncompleteLoading(true);
    try {
      await markSkuIncomplete(incompleteSku.trim());
      toast({ title: "Success", description: `SKU ${incompleteSku} marked as incomplete (READY status).` });
      setIncompleteSku("");
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to mark SKU incomplete.",
      });
    } finally {
      setIncompleteLoading(false);
    }
  }, [incompleteSku, toast]);

  return (
    <div className="space-y-6">
      {/* Temp Make Visible */}
      <FormSection title="Temp Make Visible" defaultOpen>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Temporarily changes the visibility of a single SKU so it appears in the SKU dropdown menu and can be selected, filled in, and completed.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input
              value={visSkU}
              onChange={(e) => setVisSku(e.target.value)}
              placeholder="Enter SKU…"
              className="h-9 text-sm font-mono max-w-sm"
            />
          </div>
          <Button
            type="button"
            onClick={handleMakeVisible}
            disabled={visLoading}
            className="h-9"
          >
            {visLoading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-1.5" />
            )}
            Make Visible
          </Button>
        </div>
      </FormSection>

      {/* Mark SKU Complete */}
      <FormSection title="Mark SKU Complete" defaultOpen>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Use when Eran or another employee has already completed this SKU outside the system. Changes the status to COMPLETE without requiring data entry.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input
              value={completeSku}
              onChange={(e) => setCompleteSku(e.target.value)}
              placeholder="Enter SKU…"
              className="h-9 text-sm font-mono max-w-sm"
            />
          </div>
          <Button
            type="button"
            onClick={handleMarkComplete}
            disabled={completeLoading}
            className="h-9"
          >
            {completeLoading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1.5" />
            )}
            Mark Complete
          </Button>
        </div>
      </FormSection>

      {/* Mark SKU Incomplete */}
      <FormSection title="Mark SKU Incomplete" defaultOpen>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Resets a SKU's status to READY, returning it to the products to-do list for processing.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input
              value={incompleteSku}
              onChange={(e) => setIncompleteSku(e.target.value)}
              placeholder="Enter SKU…"
              className="h-9 text-sm font-mono max-w-sm"
            />
          </div>
          <Button
            type="button"
            onClick={handleMarkIncomplete}
            disabled={incompleteLoading}
            className="h-9"
          >
            {incompleteLoading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4 mr-1.5" />
            )}
            Mark Incomplete
          </Button>
        </div>
      </FormSection>

      {/* Mark Not For Sale */}
      <FormSection title="Mark SKU Not For Sale" defaultOpen>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            Changes the SKU status to DEAD and updates the system. Eran is notified when this occurs.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">
              SKU <span className="text-destructive">*</span>
            </Label>
            <Input
              value={nfsSkU}
              onChange={(e) => setNfsSku(e.target.value)}
              placeholder="Enter SKU…"
              className="h-9 text-sm font-mono max-w-sm"
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={nfsLoading || !nfsSkU.trim()}
                className="h-9"
              >
                {nfsLoading ? (
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <Ban className="h-4 w-4 mr-1.5" />
                )}
                Mark Not For Sale
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will mark SKU <strong className="font-mono">{nfsSkU}</strong> as
                  DEAD / Not For Sale. This action can be reversed from the Admin panel.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleMarkNotForSale}>
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </FormSection>
    </div>
  );
};

export default ProductOptions;
