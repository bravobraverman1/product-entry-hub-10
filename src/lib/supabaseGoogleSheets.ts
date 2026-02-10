// ============================================================
// Supabase Google Sheets Integration
// Calls the Supabase Edge Function to interact with Google Sheets
// using the Service Account credentials stored in the browser.
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
  categories?: CategoryLevel[];
  properties?: PropertyDefinition[];
  legalValues?: LegalValue[];
}

/**
 * Checks if Supabase Google Sheets integration is configured
 */
export function isSupabaseGoogleSheetsConfigured(): boolean {
  const key = config.GOOGLE_SERVICE_ACCOUNT_KEY;
  const sheetId = config.GOOGLE_SHEET_ID;
  return Boolean(key && key.trim() && sheetId && sheetId.trim());
}

/**
 * Calls the Supabase Edge Function to read data from Google Sheets
 * Sends credentials in the request body for browser-based configuration
 */
export async function readGoogleSheets(): Promise<GoogleSheetsReadResponse> {
  if (!isSupabaseGoogleSheetsConfigured()) {
    console.log("Google Sheets credentials not configured in browser");
    return { useDefaults: true };
  }

  try {
    // Send credentials from browser config in request body
    // The edge function also supports server-side env vars as fallback
    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: {
        action: "read",
        serviceAccountKey: config.GOOGLE_SERVICE_ACCOUNT_KEY,
        sheetId: config.GOOGLE_SHEET_ID,
      },
    });

    if (error) {
      console.error("Error calling google-sheets function:", error);
      return { useDefaults: true };
    }

    if (data?.useDefaults) {
      console.log("Edge function returned useDefaults flag");
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
 */
export async function writeToGoogleSheets(rowData: string[]): Promise<boolean> {
  if (!isSupabaseGoogleSheetsConfigured()) {
    console.log("Google Sheets credentials not configured, skipping write");
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: {
        action: "write",
        rowData,
        serviceAccountKey: config.GOOGLE_SERVICE_ACCOUNT_KEY,
        sheetId: config.GOOGLE_SHEET_ID,
      },
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
 */
export async function writeCategoriesToGoogleSheets(
  categoryPaths: string[]
): Promise<boolean> {
  if (!isSupabaseGoogleSheetsConfigured()) {
    console.log("Google Sheets credentials not configured, skipping write");
    return false;
  }

  try {
    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: {
        action: "write-categories",
        categoryPaths,
        serviceAccountKey: config.GOOGLE_SERVICE_ACCOUNT_KEY,
        sheetId: config.GOOGLE_SHEET_ID,
      },
    });

    if (error) {
      console.error("Error writing categories to google-sheets function:", error);
      return false;
    }

    return data?.success ?? false;
  } catch (error) {
    console.error("Exception writing categories to google-sheets function:", error);
    return false;
  }
