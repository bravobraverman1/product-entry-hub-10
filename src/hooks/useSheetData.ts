import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultProducts } from "@/data/defaultProducts";
import { categoryTree, type CategoryLevel } from "@/data/categoryData";

export interface ProductRecord {
  sku: string;
  status: string;
  visibility: number;
}

export interface MasterFilterLabel {
  label: string;
  row: number;
}

export interface SheetData {
  products: ProductRecord[];
  categories: CategoryLevel[];
  masterFilterLabels: MasterFilterLabel[];
}

const defaultData: SheetData = {
  products: defaultProducts.map((p) => ({
    sku: p.sku,
    status: "READY",
    visibility: 1,
  })),
  categories: categoryTree,
  masterFilterLabels: [
    { label: "Wattage", row: 39 },
    { label: "Voltage", row: 40 },
    { label: "Lumens", row: 41 },
    { label: "CRI", row: 42 },
    { label: "IP Rating", row: 43 },
  ],
};

async function fetchSheetData(): Promise<SheetData> {
  const { data, error } = await supabase.functions.invoke("google-sheets", {
    body: { action: "readAll" },
  });
  if (error) throw error;
  if (data?.useDefaults) return defaultData;
  return {
    products: data.products ?? defaultData.products,
    categories: data.categories ?? defaultData.categories,
    masterFilterLabels: data.masterFilterLabels ?? defaultData.masterFilterLabels,
  };
}

export function useSheetData() {
  return useQuery<SheetData>({
    queryKey: ["sheet-data"],
    queryFn: fetchSheetData,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    initialData: defaultData,
  });
}

export function useSubmitProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      sku: string;
      chatgptData: string;
      categories: string;
      title: string;
      description: string;
      imageUrls: string[];
      masterFilterValues?: { row: number; value: string }[];
    }) => {
      const { error } = await supabase.functions.invoke("google-sheets", {
        body: { action: "writeSubmission", ...payload },
      });
      if (error) {
        console.warn("Sheet write failed:", error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheet-data"] });
    },
  });
}

export function useSetVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ sku, visible }: { sku: string; visible: number }) => {
      const { error } = await supabase.functions.invoke("google-sheets", {
        body: { action: "setVisibility", sku, visible },
      });
      if (error) console.warn("Visibility update failed:", error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheet-data"] });
    },
  });
}
