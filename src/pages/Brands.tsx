import { useState, useCallback } from "react";
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
import { fetchBrands, saveBrands, type BrandEntry } from "@/lib/api";
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

const Brands = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: brands = [], isLoading } = useQuery<BrandEntry[]>({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    staleTime: 60_000,
  });

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editBrand, setEditBrand] = useState("");
  const [editSupplier, setEditSupplier] = useState("");
  const [adding, setAdding] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [newSupplier, setNewSupplier] = useState("");
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const saveMutation = useMutation({
    mutationFn: (updated: BrandEntry[]) => saveBrands(updated),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      toast({ title: "Saved", description: "Brands updated." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to save brands." });
    },
  });

  const handleStartEdit = (index: number) => {
    setEditingIndex(index);
    setEditBrand(brands[index].brand);
    setEditSupplier(brands[index].supplier);
  };

  const handleSaveEdit = () => {
    if (editingIndex === null || !editBrand.trim()) return;
    const updated = [...brands];
    updated[editingIndex] = { brand: editBrand.trim(), supplier: editSupplier.trim() };
    saveMutation.mutate(updated);
    setEditingIndex(null);
  };

  const handleAdd = () => {
    if (!newBrand.trim()) return;
    const updated = [...brands, { brand: newBrand.trim(), supplier: newSupplier.trim() }];
    saveMutation.mutate(updated);
    setNewBrand("");
    setNewSupplier("");
    setAdding(false);
  };

  const handleDelete = useCallback(() => {
    if (deleteIndex === null) return;
    const updated = brands.filter((_, i) => i !== deleteIndex);
    saveMutation.mutate(updated);
    setDeleteIndex(null);
  }, [deleteIndex, brands, saveMutation]);

  return (
    <div className="space-y-6">
      <FormSection title="Brand List" defaultOpen>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Brand</TableHead>
                    <TableHead className="text-xs">Supplier</TableHead>
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
                              value={editSupplier}
                              onChange={(e) => setEditSupplier(e.target.value)}
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
                          <TableCell className="text-xs text-muted-foreground">{entry.supplier}</TableCell>
                          <TableCell className="text-right space-x-1">
                            <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => handleStartEdit(i)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button type="button" variant="ghost" size="sm" className="h-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteIndex(i)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))}
                  {brands.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground py-4">
                        No brands yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {adding ? (
            <div className="flex items-center gap-2">
              <Input
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                placeholder="Brand name"
                className="h-8 text-sm flex-1"
                autoFocus
              />
              <Input
                value={newSupplier}
                onChange={(e) => setNewSupplier(e.target.value)}
                placeholder="Supplier"
                className="h-8 text-sm flex-1"
              />
              <Button type="button" size="sm" className="h-8" onClick={handleAdd}>
                <Check className="h-3.5 w-3.5 mr-1" /> Add
              </Button>
              <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => setAdding(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setAdding(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Add Brand
            </Button>
          )}
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
