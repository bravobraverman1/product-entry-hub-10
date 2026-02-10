import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, Eye, FileText, Trash2, Send, Loader2, Pencil, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchRecentSubmissions, deleteSubmission, sendAllAndClearDock } from "@/lib/api";
import { FormSection } from "@/components/FormSection";
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

const PAGE_SIZE = 10;

const LoadingDock = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState(false);
  const [page, setPage] = useState(0);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [sendingAll, setSendingAll] = useState(false);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["recent-submissions"],
    queryFn: fetchRecentSubmissions,
    staleTime: 30_000,
  });

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const paged = submissions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSubmission(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recent-submissions"] });
      toast({ title: "Removed", description: "Entry removed from dock." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to remove entry." });
    },
  });

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        toast({ title: "CSV Received", description: `File "${file.name}" ready for processing.` });
      } else {
        toast({ variant: "destructive", title: "Invalid File", description: "Please upload a .csv file." });
      }
    },
    [toast]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith(".csv")) {
        toast({ title: "CSV Received", description: `File "${file.name}" ready for processing.` });
      } else if (file) {
        toast({ variant: "destructive", title: "Invalid File", description: "Please upload a .csv file." });
      }
    },
    [toast]
  );

  const handleComingSoon = useCallback(() => {
    toast({ title: "Coming Soon", description: "This feature is not yet available." });
  }, [toast]);

  const handleSendAll = useCallback(async () => {
    setSendingAll(true);
    try {
      await sendAllAndClearDock();
      queryClient.invalidateQueries({ queryKey: ["recent-submissions"] });
      toast({ title: "Sent", description: "All dock entries sent and cleared." });
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to send." });
    } finally {
      setSendingAll(false);
    }
  }, [queryClient, toast]);

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <FormSection title="CSV Upload" defaultOpen>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? "border-primary bg-muted/60" : "border-muted-foreground/30"
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">Drag & drop a CSV file here, or click to browse</p>
          <label>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
            <Button type="button" variant="outline" size="sm" asChild>
              <span><FileText className="h-3.5 w-3.5 mr-1" /> Choose File</span>
            </Button>
          </label>
        </div>
      </FormSection>

      {/* Recent Submissions */}
      <FormSection title="Recent Submissions" defaultOpen>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Loading…</p>
        ) : submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No submissions yet.</p>
        ) : (
          <>
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">SKU</TableHead>
                    <TableHead className="text-xs">Date / Time</TableHead>
                    <TableHead className="text-xs text-right pr-56">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs">{sub.sku}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="flex justify-end gap-1 pr-0">
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleComingSoon}>
                          <Pencil className="h-3 w-3 mr-1" /> Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleComingSoon}>
                          <Download className="h-3 w-3 mr-1" /> Download
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleComingSoon}>
                          <Eye className="h-3 w-3 mr-1" /> View
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={handleComingSoon}>
                          <Mail className="h-3 w-3 mr-1" /> Compose Email
                        </Button>
                        <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-destructive" onClick={() => setDeleteId(sub.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <p className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</p>
                <div className="flex gap-1">
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            )}
          </>
        )}
      </FormSection>

      {/* Send All & Clear */}
      {submissions.length > 0 && (
        <div className="flex justify-end">
          <Button type="button" onClick={handleSendAll} disabled={sendingAll} className="h-9">
            {sendingAll ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Send className="h-4 w-4 mr-1.5" />}
            Send All & Clear Dock
          </Button>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove entry?</AlertDialogTitle>
            <AlertDialogDescription>This will remove the submission from the dock list.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteMutation.mutate(deleteId); setDeleteId(null); }}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default LoadingDock;
