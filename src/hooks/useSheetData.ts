import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { defaultProducts, type Product } from "@/data/defaultProducts";
import { defaultProperties, defaultLegalValues, type PropertyDefinition, type LegalValue } from "@/data/defaultProperties";
import { categoryTree, type CategoryLevel } from "@/data/categoryData";

export interface SheetData {
  products: Product[];
  categories: CategoryLevel[];
  properties: PropertyDefinition[];
  legalValues: LegalValue[];
}

async function fetchSheetData(): Promise<SheetData> {
  const { data, error } = await supabase.functions.invoke("google-sheets", {
    body: { action: "read" },
  });

  if (error) throw error;

  // If the edge function returns that credentials are not configured, use defaults
  if (data?.useDefaults) {
    return {
      products: defaultProducts,
      categories: categoryTree,
      properties: defaultProperties,
      legalValues: defaultLegalValues,
    };
  }

  return {
    products: data.products ?? defaultProducts,
    categories: data.categories ?? categoryTree,
    properties: data.properties ?? defaultProperties,
    legalValues: data.legalValues ?? defaultLegalValues,
  };
}

export function useSheetData() {
  return useQuery<SheetData>({
    queryKey: ["sheet-data"],
    queryFn: fetchSheetData,
    staleTime: 5 * 60 * 1000, // 5 min cache
    retry: 1,
    // On error, still provide defaults via initialData
    initialData: {
      products: defaultProducts,
      categories: categoryTree,
      properties: defaultProperties,
      legalValues: defaultLegalValues,
    },
  });
}
