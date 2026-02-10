// ============================================================
// API Layer – wraps all backend calls.
// When APPS_SCRIPT_BASE_URL is set, calls the real backend.
// Otherwise, returns mock/fallback data.
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
  exampleTitle?: string;
}

export async function fetchSkus(
  status?: string
): Promise<SkuEntry[]> {
  if (!isConfigured()) {
    // Mock: return defaultProducts filtered by status
    return defaultProducts
      .map((p) => ({
        sku: p.sku,
        brand: p.brand,
        status: config.STATUS_READY,
        exampleTitle: p.exampleTitle,
      }))
      .filter((s) => !status || s.status === status);
  }
  return apiFetch<SkuEntry[]>(
    `/skus${status ? `?status=${encodeURIComponent(status)}` : ""}`
  );
}

// ── Brand Lookup ────────────────────────────────────────────

export async function fetchBrand(sku: string): Promise<string> {
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
  if (!isConfigured()) {
    return categoryTree;
  }
  return apiFetch<CategoryLevel[]>("/categories");
}

export async function updateCategories(
  paths: string[]
): Promise<void> {
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
  if (!isConfigured()) {
    return {
      properties: defaultProperties,
      legalValues: defaultLegalValues,
    };
  }
  return apiFetch("/properties");
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
    // Mock data
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

// ── Reopen SKU ──────────────────────────────────────────────

export interface ReopenedProduct {
  sku: string;
  brand: string;
  title: string;
  mainCategory: string;
  additionalCategories: string[];
  imageUrls: string[];
  specifications: Record<string, string>;
}

export async function reopenSku(
  sku: string
): Promise<ReopenedProduct> {
  if (!isConfigured()) {
    // Mock: validate as if COMPLETE and return sample data
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
