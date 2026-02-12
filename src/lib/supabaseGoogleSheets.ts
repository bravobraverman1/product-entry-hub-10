// ============================================================
// Supabase Google Sheets Integration
// Calls the Supabase Edge Function to interact with Google Sheets
// using server-side Supabase secrets (never stored in the browser).
// ============================================================

import { config } from "@/config";
import type { CategoryLevel } from "@/data/categoryData";
import type { PropertyDefinition, LegalValue } from "@/data/defaultProperties";

interface GoogleSheetsReadResponse {
  useDefaults?: boolean;
  products?: Array<{
    sku: string;
    brand: string;
    exampleTitle: string;
  }>;
  brands?: Array<{
    brand: string;
    brandName: string;
    website: string;
  }>;
  categories?: CategoryLevel[];
  properties?: PropertyDefinition[];
  legalValues?: LegalValue[];
  categoryPathCount?: number;
  categoryFilterMap?: Array<{ categoryKeyword: string; filterDefault: string }>;
  filterDefaultMap?: Array<{ name: string; allowedProperties: string[] }>;
}

export interface CategoryFilterMap {
  categoryKeyword: string;
  filterDefault: string;
}

export interface FilterDefaultMap {
  name: string;
  allowedProperties: string[];
}

interface SheetTabNamesPayload {
  PRODUCTS: string;
  PRODUCTS_TODO: string;
  CATEGORIES: string;
  PROPERTIES: string;
  LEGAL: string;
  RESPONSES: string;
  BRANDS: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

const FUNCTIONS_BASE_URL =
  import.meta.env.VITE_SUPABASE_FUNCTIONS_URL ||
  (SUPABASE_URL ? `${SUPABASE_URL}/functions/v1` : "");

function getSheetTabNamesPayload(): SheetTabNamesPayload {
  return {
    PRODUCTS: config.SHEET_PRODUCTS,
    PRODUCTS_TODO: config.SHEET_PRODUCTS_TODO,
    CATEGORIES: config.SHEET_CATEGORIES,
    PROPERTIES: config.SHEET_PROPERTIES,
    LEGAL: config.SHEET_LEGAL,
    RESPONSES: config.SHEET_OUTPUT,
    BRANDS: config.SHEET_BRANDS,
  };
}

export async function invokeGoogleSheetsFunction<T>(body: Record<string, unknown>) {
  if (!FUNCTIONS_BASE_URL || !SUPABASE_KEY) {
    return {
      data: null as T | null,
      error: new Error(
        "Supabase environment variables are not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
      ),
    };
  }

  const res = await fetch(`${FUNCTIONS_BASE_URL}/google-sheets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: any = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }

  if (!res.ok) {
    return {
      data: parsed as T | null,
      error: new Error(`Edge function returned ${res.status}: ${parsed?.error || text}`),
    };
  }

  return { data: parsed as T, error: null as Error | null };
}

/**
 * Checks if Supabase Google Sheets integration is configured
 * Returns true if we can call the edge function (credentials are checked server-side)
 */
export function isSupabaseGoogleSheetsConfigured(): boolean {
  // Always return true - the edge function will check if Deno.env secrets are configured
  return true;
}

/**
 * Calls the Supabase Edge Function to read data from Google Sheets
 * Uses ONLY server-side Supabase secrets (GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID)
 * No credentials are sent from the browser
 */
export async function readGoogleSheets(): Promise<GoogleSheetsReadResponse> {
  try {
    const requestBody: any = {
      action: "read",
      tabNames: getSheetTabNamesPayload(),
    };

    const { data, error } = await invokeGoogleSheetsFunction<GoogleSheetsReadResponse>(requestBody);

    if (error) {
      console.error("Error calling google-sheets function:", error);
      return { useDefaults: true };
    }

    if (data?.useDefaults) {
      console.log("Edge function returned useDefaults - credentials not in Supabase secrets");
      return { useDefaults: true };
    }

    return data as GoogleSheetsReadResponse;
  } catch (error) {
    console.error("Exception calling google-sheets function:", error);
    return { useDefaults: true };
  }
}

/**
 * Writes a row to the Google Sheet via Supabase Edge Function
 * Uses ONLY server-side Supabase secrets. No credentials are sent from the browser
 */
export async function writeToGoogleSheets(rowData: string[]): Promise<boolean> {
  try {
    const requestBody: any = {
      action: "write",
      rowData,
      tabNames: getSheetTabNamesPayload(),
    };

    const { data, error } = await invokeGoogleSheetsFunction<{ success?: boolean }>(requestBody);

    if (error) {
      console.error("Error writing to google-sheets function:", error);
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error("Exception writing to google-sheets function:", error);
    return false;
  }
}
/**
 * Writes category paths to the Google Sheet via Supabase Edge Function
 * Uses ONLY server-side Supabase secrets. No credentials are sent from the browser
 */
export async function writeCategoriesToGoogleSheets(
  categoryPaths: string[]
): Promise<boolean> {
  try {
    const requestBody: any = {
      action: "write-categories",
      categoryPaths,
      tabNames: getSheetTabNamesPayload(),
    };

    const { data, error } = await invokeGoogleSheetsFunction<{ success?: boolean; error?: string; useDefaults?: boolean }>(requestBody);

    if (error) {
      console.error("Error writing categories to google-sheets function:", error);
      throw new Error(error.message || "Failed to write categories to Google Sheets");
    }

    if (data?.useDefaults) {
      throw new Error(
        "Google Sheets credentials not configured in Supabase secrets. Add GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEET_ID to your Supabase project, then redeploy the edge function."
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || "Failed to write categories to Google Sheets");
    }

    return true;
  } catch (error) {
    console.error("Exception writing categories to google-sheets function:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to write categories to Google Sheets");
  }
}

/**
 * Writes brands to the Google Sheet via Supabase Edge Function
 * Uses ONLY server-side Supabase secrets. No credentials are sent from the browser
 */
export async function writeBrandsToGoogleSheets(
  brands: Array<{ brand: string; brandName: string; website: string }>
): Promise<boolean> {
  try {
    const requestBody: any = {
      action: "write-brands",
      brands,
      tabNames: getSheetTabNamesPayload(),
    };

    const { data, error } = await invokeGoogleSheetsFunction<{ success?: boolean; error?: string; useDefaults?: boolean }>(requestBody);

    if (error) {
      console.error("Error writing brands to google-sheets function:", error);
      throw new Error(error.message || "Failed to write brands to Google Sheets");
    }

    if (data?.useDefaults) {
      throw new Error(
        "Edge function cannot read Supabase secrets. Redeploy the edge function after setting GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEET_ID."
      );
    }

    if (!data?.success) {
      throw new Error(data?.error || "Failed to write brands to Google Sheets");
    }

    return true;
  } catch (error) {
    console.error("Exception writing brands to google-sheets function:", error);
    throw error instanceof Error
      ? error
      : new Error("Failed to write brands to Google Sheets");
  }
}

/**
 * Writes a legal value to the LEGAL tab (row-based layout) via Supabase Edge Function
 */
export async function writeLegalValueToGoogleSheets(
  propertyName: string,
  value: string
): Promise<boolean> {
  try {
    const requestBody: any = {
      action: "write-legal",
      propertyName,
      value,
      tabNames: getSheetTabNamesPayload(),
    };

    const { data, error } = await invokeGoogleSheetsFunction<{ success?: boolean; error?: string; useDefaults?: boolean }>(requestBody);

    if (error) {
      console.error("Error writing legal value to google-sheets function:", error);
      return false;
    }

    if (data?.useDefaults) {
      console.error("Edge function cannot read Supabase secrets. Redeploy after setting secrets.");
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error("Exception writing legal value to google-sheets function:", error);
    return false;
  }
}