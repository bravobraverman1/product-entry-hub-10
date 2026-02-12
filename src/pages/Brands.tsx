import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FormSection } from "@/components/FormSection";
import { fetchBrandsWithSource, type BrandFetchResult } from "@/lib/api";

const Brands = () => {
  const {
    data: brandsResult,
    isLoading,
  } = useQuery<BrandFetchResult>({
    queryKey: ["brands-with-source"],
    queryFn: fetchBrandsWithSource,
    staleTime: 60_000,
  });

  const brands = useMemo(() => brandsResult?.brands ?? [], [brandsResult]);

  return (
    <div className="space-y-6">
      <FormSection title="Brand List" defaultOpen>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Loading…</p>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden max-h-[70vh] overflow-y-auto max-w-5xl mx-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs text-center">Brand</TableHead>
                    <TableHead className="text-xs text-center">Brand Name</TableHead>
                    <TableHead className="text-xs text-center">Website</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brands.map((entry, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-medium text-center">{entry.brand}</TableCell>
                      <TableCell className="text-xs text-muted-foreground text-center">{entry.brandName}</TableCell>
                      <TableCell className="text-xs text-center">
                        <a
                          href={entry.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {entry.website}
                        </a>
                      </TableCell>
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
        </div>
      </FormSection>
    </div>
  );
};

export default Brands;
