// ============================================================
// API Layer – wraps all backend calls.
// Priority order:
// 1. Supabase Edge Function (if Google Sheets credentials configured)
// 2. Apps Script URL (if APPS_SCRIPT_BASE_URL is set)
// 3. Mock/fallback data
// ============================================================

import { config } from "@/config";
import { defaultProducts, type Product } from "@/data/defaultProducts";
import {
  defaultProperties,
  defaultLegalValues,
  type PropertyDefinition,
  type LegalValue,
} from "@/data/defaultProperties";
import { categoryTree, type CategoryLevel } from "@/data/categoryData";
import {
  isSupabaseGoogleSheetsConfigured,
  readGoogleSheets,
  writeCategoriesToGoogleSheets,
} from "@/lib/supabaseGoogleSheets";

const BASE = () => config.APPS_SCRIPT_BASE_URL;

function isConfigured(): boolean {
  return Boolean(BASE());
}

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── SKUs ────────────────────────────────────────────────────

export interface SkuEntry {
  sku: string;
  brand: string;
  status: string;
  visibility?: number;
  exampleTitle?: string;
}

export async function fetchSkus(
  status?: string
): Promise<SkuEntry[]> {
  // Try Supabase Google Sheets first
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      const data = await readGoogleSheets();
      if (data.products && !data.useDefaults) {
        return data.products
          .map((p) => ({
            sku: p.sku,
            brand: p.brand,
            status: config.STATUS_READY,
            visibility: 1,
            exampleTitle: p.exampleTitle,
          }))
          .filter((s) => !status || s.status === status)
          .filter((s) => (s.visibility ?? 0) >= 1);
      }
    } catch (error) {
      console.error("Error fetching from Supabase Google Sheets:", error);
    }
  }

  // Fall back to Apps Script if configured
  if (!isConfigured()) {
    return defaultProducts
      .map((p) => ({
        sku: p.sku,
        brand: p.brand,
        status: config.STATUS_READY,
        visibility: 1,
        exampleTitle: p.exampleTitle,
      }))
      .filter((s) => !status || s.status === status)
      .filter((s) => (s.visibility ?? 0) >= 1);
  }
  return apiFetch<SkuEntry[]>(
    `/skus${status ? `?status=${encodeURIComponent(status)}` : ""}`
  );
}

// ── Brand Lookup ────────────────────────────────────────────

export async function fetchBrand(sku: string): Promise<string> {
  // Try Supabase Google Sheets first
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      const data = await readGoogleSheets();
      if (data.products && !data.useDefaults) {
        const found = data.products.find((p) => p.sku === sku);
        if (found) return found.brand;
      }
    } catch (error) {
      console.error("Error fetching brand from Supabase Google Sheets:", error);
    }
  }

  // Fall back to Apps Script or defaults
  if (!isConfigured()) {
    const found = defaultProducts.find((p) => p.sku === sku);
    return found?.brand ?? "";
  }
  const data = await apiFetch<{ brand: string }>(
    `/brand?sku=${encodeURIComponent(sku)}`
  );
  return data.brand;
}

// ── Categories ──────────────────────────────────────────────

export async function fetchCategories(): Promise<CategoryLevel[]> {
  // Try Supabase Google Sheets first
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      const data = await readGoogleSheets();
      if (data.categories && !data.useDefaults) {
        return data.categories;
      }
    } catch (error) {
      console.error("Error fetching categories from Supabase Google Sheets:", error);
    }
  }

  // Fall back to Apps Script or defaults
  if (!isConfigured()) {
    return categoryTree;
  }
  return apiFetch<CategoryLevel[]>("/categories");
}

export async function updateCategories(
  paths: string[]
): Promise<void> {
  // Try Supabase Google Sheets first
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      const success = await writeCategoriesToGoogleSheets(paths);
      if (success) {
        console.log("Categories updated in Google Sheets");
        return;
      }
    } catch (error) {
      console.error("Error updating categories in Supabase Google Sheets:", error);
    }
  }

  // Fall back to Apps Script
  if (!isConfigured()) {
    console.warn("[mock] updateCategories called with", paths.length, "paths");
    return;
  }
  await apiFetch("/categories/update", {
    method: "POST",
    body: JSON.stringify({ paths }),
  });
}

// ── Properties & Legal Values ───────────────────────────────

export async function fetchProperties(): Promise<{
  properties: PropertyDefinition[];
  legalValues: LegalValue[];
}> {
  // Try Supabase Google Sheets first
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      const data = await readGoogleSheets();
      if (data.properties && data.legalValues && !data.useDefaults) {
        return {
          properties: data.properties,
          legalValues: data.legalValues,
        };
      }
    } catch (error) {
      console.error("Error fetching properties from Supabase Google Sheets:", error);
    }
  }

  // Fall back to Apps Script or defaults
  if (!isConfigured()) {
    return {
      properties: defaultProperties,
      legalValues: defaultLegalValues,
    };
  }
  return apiFetch("/properties");
}

// ── Add Legal Value (for "Other…" option) ───────────────────

export async function addLegalValue(
  propertyName: string,
  value: string
): Promise<void> {
  if (!isConfigured()) {
    console.log("[mock] addLegalValue:", propertyName, value);
    return;
  }
  await apiFetch("/legal/add", {
    method: "POST",
    body: JSON.stringify({ propertyName, value }),
  });
}

// ── Submit Product ──────────────────────────────────────────

export interface ProductPayload {
  sku: string;
  brand: string;
  title: string;
  mainCategory: string;
  additionalCategories: string[];
  imageUrls: string[];
  specifications: Record<string, string>;
  chatgptData?: string;
  chatgptDescription?: string;
  datasheetUrl?: string;
  webpageUrl?: string;
  timestamp: string;
}

export async function submitProduct(
  payload: ProductPayload
): Promise<{ success: boolean }> {
  if (!isConfigured()) {
    console.log("[mock] submitProduct payload:", payload);
    return { success: true };
  }
  return apiFetch("/submitProduct", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ── Recent Submissions ──────────────────────────────────────

export interface RecentSubmission {
  id: string;
  sku: string;
  submittedAt: string;
}

export async function fetchRecentSubmissions(): Promise<
  RecentSubmission[]
> {
  if (!isConfigured()) {
    return [
      { id: "1", sku: "LED-DL-001", submittedAt: new Date(Date.now() - 3600000).toISOString() },
      { id: "2", sku: "LED-SP-001", submittedAt: new Date(Date.now() - 7200000).toISOString() },
      { id: "3", sku: "LED-PD-001", submittedAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "4", sku: "LED-WL-001", submittedAt: new Date(Date.now() - 172800000).toISOString() },
      { id: "5", sku: "LED-FL-001", submittedAt: new Date(Date.now() - 259200000).toISOString() },
    ];
  }
  return apiFetch("/recentSubmissions");
}

// ── Delete Submission ───────────────────────────────────────

export async function deleteSubmission(id: string): Promise<void> {
  if (!isConfigured()) {
    console.log("[mock] deleteSubmission:", id);
    return;
  }
  await apiFetch("/submissions/delete", {
    method: "POST",
    body: JSON.stringify({ id }),
  });
}

// ── Send All & Clear Dock ───────────────────────────────────

export async function sendAllAndClearDock(): Promise<void> {
  if (!isConfigured()) {
    console.log("[mock] sendAllAndClearDock");
    return;
  }
  await apiFetch("/dock/sendAll", { method: "POST" });
}

// ── Reopen SKU ──────────────────────────────────────────────

export interface ReopenedProduct {
  sku: string;
  brand: string;
  title: string;
  mainCategory: string;
  additionalCategories: string[];
  imageUrls: string[];
  specifications: Record<string, string>;
  chatgptData?: string;
  chatgptDescription?: string;
}

export async function reopenSku(
  sku: string
): Promise<ReopenedProduct> {
  if (!isConfigured()) {
    const found = defaultProducts.find((p) => p.sku === sku);
    if (!found) throw new Error(`SKU "${sku}" not found`);
    return {
      sku: found.sku,
      brand: found.brand,
      title: found.exampleTitle,
      mainCategory: "Indoor Lights/Ceiling Lights/Downlights",
      additionalCategories: [],
      imageUrls: ["https://via.placeholder.com/800x800.jpg"],
      specifications: {},
    };
  }
  return apiFetch("/reopenSku", {
    method: "POST",
    body: JSON.stringify({ sku }),
  });
}

// ── Temp Make Visible ───────────────────────────────────────

export async function tempMakeVisible(
  sku: string
): Promise<{ success: boolean }> {
  if (!isConfigured()) {
    console.log("[mock] tempMakeVisible:", sku);
    return { success: true };
  }
  return apiFetch("/tempMakeVisible", {
    method: "POST",
    body: JSON.stringify({ sku }),
  });
}

// ── Mark Not For Sale ───────────────────────────────────────

export async function markNotForSale(
  sku: string
): Promise<{ success: boolean }> {
  if (!isConfigured()) {
    console.log("[mock] markNotForSale:", sku);
    return { success: true };
  }
  return apiFetch("/markNotForSale", {
    method: "POST",
    body: JSON.stringify({ sku }),
  });
}

// ── Brands ──────────────────────────────────────────────────

export interface BrandEntry {
  brand: string;
  supplier: string;
}

export async function fetchBrands(): Promise<BrandEntry[]> {
  if (!isConfigured()) {
    return [
      { brand: "Havit", supplier: "LED World" },
      { brand: "Domus", supplier: "Beacon Lighting" },
      { brand: "Telbix", supplier: "Telbix Australia" },
      { brand: "Eglo", supplier: "Eglo Lighting" },
      { brand: "CLA", supplier: "CLA Lighting" },
    ];
  }
  return apiFetch("/brands");
}

export async function saveBrands(brands: BrandEntry[]): Promise<void> {
  if (!isConfigured()) {
    console.log("[mock] saveBrands:", brands);
    return;
  }
  await apiFetch("/brands/update", {
    method: "POST",
    body: JSON.stringify({ brands }),
  });
}

// ── Filter Rules ────────────────────────────────────────────

export interface FilterRule {
  categoryPath: string;
  visibleFields: string[];
  requiredFields: string[];
}

export async function fetchFilterRules(): Promise<FilterRule[]> {
  if (!isConfigured()) {
    return [];
  }
  return apiFetch("/filters");
}

export async function saveFilterRules(rules: FilterRule[]): Promise<void> {
  if (!isConfigured()) {
    console.log("[mock] saveFilterRules:", rules);
    return;
  }
  await apiFetch("/filters/update", {
    method: "POST",
    body: JSON.stringify({ rules }),
  });
}
