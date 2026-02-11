// ============================================================
// Supabase Google Sheets Integration
// Calls the Supabase Edge Function to interact with Google Sheets
// using server-side Supabase secrets (never stored in the browser).
// ============================================================

import { supabase } from "@/integrations/supabase/client";
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

    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: requestBody,
    });

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

    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: requestBody,
    });

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

    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: requestBody,
    });

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

    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: requestBody,
    });

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