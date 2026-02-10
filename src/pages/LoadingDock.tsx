import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchRecentSubmissions } from "@/lib/api";
import { FormSection } from "@/components/FormSection";

const PAGE_SIZE = 10;

const LoadingDock = () => {
  const { toast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [page, setPage] = useState(0);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["recent-submissions"],
    queryFn: fetchRecentSubmissions,
    staleTime: 30_000,
  });

  const totalPages = Math.max(1, Math.ceil(submissions.length / PAGE_SIZE));
  const paged = submissions.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.name.endsWith(".csv")) {
        // TODO: Implement CSV parsing
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

  return (
    <div className="space-y-6">
      {/* CSV Upload */}
      <FormSection title="CSV Upload" defaultOpen>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver ? "border-primary bg-muted/60" : "border-muted-foreground/30"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground mb-2">
            Drag & drop a CSV file here, or click to browse
          </p>
          <label>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileInput}
            />
            <Button type="button" variant="outline" size="sm" asChild>
              <span>
                <FileText className="h-3.5 w-3.5 mr-1" />
                Choose File
              </span>
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
                    <TableHead className="text-xs text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="font-mono text-xs">{sub.sku}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(sub.submittedAt).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleComingSoon}
                        >
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={handleComingSoon}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-3">
                <p className="text-xs text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </FormSection>
    </div>
  );
};

export default LoadingDock;
