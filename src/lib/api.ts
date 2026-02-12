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
  writeBrandsToGoogleSheets,
  writeLegalValueToGoogleSheets,
} from "@/lib/supabaseGoogleSheets";

const BASE = () => config.APPS_SCRIPT_BASE_URL;

function isConfigured(): boolean {
  return Boolean(BASE());
}

// ── Global Sheet Sync Status ────────────────────────────────
// Tracks whether the last readGoogleSheets() call returned real data.
// ALL write operations check this before proceeding.
let _lastSheetReadSuccess = false;

export function isSheetSynced(): boolean {
  return _lastSheetReadSuccess;
}

/** Called internally after each readGoogleSheets() to update sync status */
function markSheetSynced(synced: boolean): void {
  _lastSheetReadSuccess = synced;
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
        markSheetSynced(true);
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
      if (data.useDefaults) markSheetSynced(false);
    } catch (error) {
      console.error("Error fetching from Supabase Google Sheets:", error);
      markSheetSynced(false);
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
        markSheetSynced(true);
        const found = data.products.find((p) => p.sku === sku);
        if (found) return found.brand;
      }
      if (data.useDefaults) markSheetSynced(false);
    } catch (error) {
      console.error("Error fetching brand from Supabase Google Sheets:", error);
      markSheetSynced(false);
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

/** Result wrapper that tracks whether data came from live Google Sheet */
export interface CategoriesFetchResult {
  categories: CategoryLevel[];
  source: "google-sheets" | "apps-script" | "defaults";
}

export async function fetchCategoriesWithSource(): Promise<CategoriesFetchResult> {
  // Always try the edge function first - it uses server-side Supabase secrets
  try {
    const data = await readGoogleSheets();
    if (!data.useDefaults && data.categories && data.categories.length > 0) {
      console.log("✓ Categories loaded from Google Sheets");
      markSheetSynced(true);
      return { categories: data.categories, source: "google-sheets" };
    }
    if (!data.useDefaults && (!data.categories || data.categories.length === 0)) {
      throw new Error("CATEGORIES tab is empty. Add category paths to the CATEGORIES sheet, starting at row 2.");
    }
    if (data.useDefaults) markSheetSynced(false);
  } catch (error) {
    console.error("Error fetching from Google Sheets:", error);
    markSheetSynced(false);
    // Fall through to fallback
  }

  // Fallback to Apps Script or defaults
  if (!isConfigured()) {
    console.log("No Apps Script URL configured, using default category tree");
    return { categories: categoryTree, source: "defaults" };
  }
  
  try {
    const cats = await apiFetch<CategoryLevel[]>("/categories");
    return { categories: cats, source: "apps-script" };
  } catch (error) {
    console.warn("Apps Script also failed, using defaults:", error);
    return { categories: categoryTree, source: "defaults" };
  }
}

/** Legacy wrapper – still used by non-admin pages that just need categories */
export async function fetchCategories(): Promise<CategoryLevel[]> {
  const result = await fetchCategoriesWithSource();
  return result.categories;
}

export async function updateCategories(
  paths: string[]
): Promise<void> {
  // SAFETY: Only allow writes when sheet connection is verified
  if (!isSheetSynced()) {
    throw new Error("Cannot save categories: not connected to Google Sheet. Reload the page and try again.");
  }

  // Always write via Supabase Edge Function (uses server-side secrets)
  try {
    const success = await writeCategoriesToGoogleSheets(paths);
    if (!success) {
      throw new Error("Failed to write categories to Google Sheets");
    }
    console.log("Categories successfully updated in Google Sheets");
  } catch (error) {
    console.error("FATAL: Error updating categories in Google Sheets:", error);
    throw new Error(
      `Failed to save categories to Google Sheet: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// ── Properties & Legal Values ───────────────────────────────

export async function fetchProperties(): Promise<{
  properties: PropertyDefinition[];
  legalValues: LegalValue[];
  categoryFilterMap?: Array<{ categoryKeyword: string; filterDefault: string }>;
  filterDefaultMap?: Array<{ name: string; allowedProperties: string[] }>;
}> {
  // Try Supabase Google Sheets first
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      const data = await readGoogleSheets();
      if (data.properties && data.legalValues && !data.useDefaults) {
        markSheetSynced(true);
        return {
          properties: data.properties,
          legalValues: data.legalValues,
          categoryFilterMap: data.categoryFilterMap,
          filterDefaultMap: data.filterDefaultMap,
        };
      }
      if (data.useDefaults) {
        markSheetSynced(false);
        return { properties: [], legalValues: [] };
      }
    } catch (error) {
      console.error("Error fetching properties from Supabase Google Sheets:", error);
      markSheetSynced(false);
    }
  }

  // Fall back to Apps Script or defaults
  if (!isConfigured()) {
    return { properties: [], legalValues: [] };
  }
  return apiFetch("/properties");
}

// ── Add Legal Value (for "Other…" option) ───────────────────

export async function addLegalValue(
  propertyName: string,
  value: string
): Promise<void> {
  // SAFETY: Only allow writes when sheet connection is verified
  if (!isSheetSynced()) {
    throw new Error("Cannot add legal value: not connected to Google Sheet. Reload the page and try again.");
  }

  if (isSupabaseGoogleSheetsConfigured()) {
    const success = await writeLegalValueToGoogleSheets(propertyName, value);
    if (!success) {
      throw new Error("Failed to write legal value to Google Sheets");
    }
    return;
  }

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

// ── Mark SKU Complete ───────────────────────────────────────

export async function markSkuComplete(
  sku: string
): Promise<{ success: boolean }> {
  if (!isConfigured()) {
    console.log("[mock] markSkuComplete:", sku);
    return { success: true };
  }
  return apiFetch("/markSkuComplete", {
    method: "POST",
    body: JSON.stringify({ sku }),
  });
}

// ── Mark SKU Incomplete ─────────────────────────────────────

export async function markSkuIncomplete(
  sku: string
): Promise<{ success: boolean }> {
  if (!isConfigured()) {
    console.log("[mock] markSkuIncomplete:", sku);
    return { success: true };
  }
  return apiFetch("/markSkuIncomplete", {
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
  brandName: string;
  website: string;
}

export interface BrandFetchResult {
  brands: BrandEntry[];
  source: "google-sheets" | "apps-script" | "defaults";
}

export async function fetchBrandsWithSource(): Promise<BrandFetchResult> {
  // Try Supabase Google Sheets first
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      const data = await readGoogleSheets();
      if (data.brands && !data.useDefaults) {
        markSheetSynced(true);
        return { brands: data.brands, source: "google-sheets" };
      }
      if (data.useDefaults) markSheetSynced(false);
    } catch (error) {
      console.error("Error fetching brands from Supabase Google Sheets:", error);
      markSheetSynced(false);
    }
  }

  // Fall back to Apps Script if configured
  if (!isConfigured()) {
    return {
      brands: [
        { brand: "Havit", brandName: "Havit Lighting", website: "https://www.havit.com.au" },
        { brand: "Domus", brandName: "Domus Lighting", website: "https://www.domuslighting.com.au" },
        { brand: "Telbix", brandName: "Telbix Australia", website: "https://www.telbix.com.au" },
        { brand: "Eglo", brandName: "Eglo Lighting", website: "https://www.eglo.com.au" },
        { brand: "CLA", brandName: "CLA Lighting", website: "https://www.clalighting.com.au" },
      ],
      source: "defaults",
    };
  }
  const brands = await apiFetch<BrandEntry[]>("/brands");
  return { brands, source: "apps-script" };
}

/** Legacy wrapper for non-admin pages */
export async function fetchBrands(): Promise<BrandEntry[]> {
  const result = await fetchBrandsWithSource();
  return result.brands;
}

export async function saveBrands(brands: BrandEntry[]): Promise<void> {
  // SAFETY: Only allow writes when sheet connection is verified
  if (!isSheetSynced()) {
    throw new Error("Cannot save brands: not connected to Google Sheet. Reload the page and try again.");
  }

  // Use Supabase Google Sheets integration
  if (isSupabaseGoogleSheetsConfigured()) {
    try {
      await writeBrandsToGoogleSheets(brands);
      return;
    } catch (error) {
      console.error("Error saving brands to Google Sheets:", error);
      throw error;
    }
  }

  // Fall back to Apps Script if configured
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
