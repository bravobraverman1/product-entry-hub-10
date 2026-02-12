import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormSection } from "@/components/FormSection";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchBrandsWithSource, saveBrands, type BrandEntry, type BrandFetchResult } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Brands = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: brandsResult,
    isLoading,
    error: brandsError,
  } = useQuery<BrandFetchResult>({
    queryKey: ["brands-with-source"],
    queryFn: fetchBrandsWithSource,
    staleTime: 60_000,
  });

  const brands = useMemo(() => brandsResult?.brands ?? [], [brandsResult]);
  const brandsSource = brandsResult?.source;
  const loadedFromSheet = brandsSource === "google-sheets";

  // Editing is locked unless brands were loaded from the actual Google Sheet
  const editingLocked = !loadedFromSheet || isLoading || !!brandsError;

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editBrand, setEditBrand] = useState("");
  const [editBrandName, setEditBrandName] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [adding, setAdding] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newWebsite, setNewWebsite] = useState("");
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: (updated: BrandEntry[]) => {
      if (!loadedFromSheet) {
        throw new Error("Cannot save: brands not loaded from Google Sheet");
      }
      return saveBrands(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands-with-source"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast({ title: "Saved", description: "Brands updated." });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save brands." });
    },
  });

  const handleStartEdit = (index: number) => {
    if (editingLocked) return;
    setEditingIndex(index);
    setEditBrand(brands[index].brand);
    setEditBrandName(brands[index].brandName);
    setEditWebsite(brands[index].website);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editBrand.trim() || editingLocked) return;
    const updated = [...brands];
    updated[editingIndex] = { 
      brand: editBrand.trim(), 
      brandName: editBrandName.trim(),
      website: editWebsite.trim()
    };
    saveMutation.mutate(updated);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!newBrand.trim() || editingLocked) return;
    const updated = [...brands, { 
      brand: newBrand.trim(), 
      brandName: newBrandName.trim(),
      website: newWebsite.trim()
    }];
    saveMutation.mutate(updated);
    setNewBrand("");
    setNewBrandName("");
    setNewWebsite("");
    setAdding(false);
  };

  const handleDelete = useCallback(() => {
    if (deleteIndex === null || editingLocked) return;
    const updated = brands.filter((_, i) => i !== deleteIndex);
    saveMutation.mutate(updated);
    setDeleteIndex(null);
  }, [deleteIndex, brands, saveMutation, editingLocked]);

  return (
    <div className="space-y-6">
      {/* Sync Status Banner */}
      {!isLoading && (
        editingLocked ? (
          <Alert className="border-orange-300 bg-orange-50">
            <AlertDescription className="text-orange-800 text-sm">
              {brandsError
                ? `\u26a0\ufe0f Error loading brands: ${brandsError instanceof Error ? brandsError.message : "Unknown error"}. Editing disabled.`
                : brandsSource === "defaults"
                ? "\ud83d\udd12 Brands loaded from defaults (Google Sheet not connected). Editing disabled to prevent data loss."
                : brandsSource === "apps-script"
                ? "\ud83d\udd12 Brands loaded from Apps Script fallback. Editing disabled \u2014 connect via Google Sheets for full access."
                : "\ud83d\udd12 Loading..."}
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-green-300 bg-green-50">
            <AlertDescription className="text-green-800 text-sm">
              \u2705 Brands synced from Google Sheet. Editing enabled.
            </AlertDescription>
          </Alert>
        )
      )}

      <FormSection title="Brand List" defaultOpen>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden max-h-[70vh] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs">Brand</TableHead>
                    <TableHead className="text-xs">Brand Name</TableHead>
                    <TableHead className="text-xs">Website</TableHead>
                    <TableHead className="text-xs text-right w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((entry, i) => (
                    <TableRow key={i}>
                      {editingIndex === i ? (
                        <>
                          <TableCell>
                            <Input
                              value={editBrand}
                              onChange={(e) => setEditBrand(e.target.value)}
                              className="h-7 text-xs"
                              autoFocus
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editBrandName}
                              onChange={(e) => setEditBrandName(e.target.value)}
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={editWebsite}
                              onChange={(e) => setEditWebsite(e.target.value)}
                              className="h-7 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={handleSaveEdit}>
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setEditingIndex(null)}>
                              <X className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-xs font-medium">{entry.brand}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{entry.brandName}</TableCell>
                          <TableCell className="text-xs text-blue-600 hover:underline">
                            <a href={entry.website} target="_blank" rel="noopener noreferrer">
                              {entry.website}
                            </a>
                          </TableCell>
                          <TableCell className="text-right space-x-1">
                            {!editingLocked && (
                              <>
                                <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => handleStartEdit(i)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button type="button" variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteIndex(i)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  {brands.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-4">
                        No brands yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {adding && !editingLocked ? (
            <div className="flex items-center gap-2">
              <Input
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Brand"
                className="h-8 text-sm flex-1"
                autoFocus
              />
              <Input
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="Brand Name"
                className="h-8 text-sm flex-1"
              />
              <Input
                value={newWebsite}
                onChange={(e) => setNewWebsite(e.target.value)}
                placeholder="Website"
                className="h-8 text-sm flex-1"
              />
              <Button type="button" size="sm" className="h-8" onClick={handleAdd}>
                <Check className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          ) : !editingLocked ? (
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Brand
            </Button>
          ) : null}
        </div>
      </FormSection>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteIndex !== null} onOpenChange={(open) => !open && setDeleteIndex(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete brand?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{deleteIndex !== null ? brands[deleteIndex]?.brand : ""}" from the brand list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Brands;
