// This hook is kept for backward compatibility but the app now uses
// the modular api.ts layer with individual react-query hooks.
// If you need a unified hook, you can still import this.

import { useQuery } from "@tanstack/react-query";
import { fetchSkus, fetchCategories, fetchProperties, type SkuEntry } from "@/lib/api";
import type { CategoryLevel } from "@/data/categoryData";
import type { PropertyDefinition, LegalValue } from "@/data/defaultProperties";

export interface SheetData {
  products: SkuEntry[];
  categories: CategoryLevel[];
  properties: PropertyDefinition[];
  legalValues: LegalValue[];
}

async function fetchAll(): Promise<SheetData> {
  const [products, categories, propData] = await Promise.all([
    fetchSkus(),
    fetchCategories(),
    fetchProperties(),
  ]);
  return {
    products,
    categories,
    properties: propData.properties,
    legalValues: propData.legalValues,
  };
}

export function useSheetData() {
  return useQuery<SheetData>({
    queryKey: ["sheet-data"],
    queryFn: fetchAll,
    staleTime: 5 * 60 * 1000,
  });
}
