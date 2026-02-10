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
  categoryPathCount?: number;
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
 * Uses server-side Supabase secrets (GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID)
 */
export async function readGoogleSheets(): Promise<GoogleSheetsReadResponse> {
  try {
    // Always call the edge function - it uses server-side env vars
    // Only send browser creds if they exist, otherwise function uses Deno.env
    const requestBody: any = {
      action: "read",
    };
    
    // Include browser credentials if available (optional, for backward compatibility)
    if (isSupabaseGoogleSheetsConfigured()) {
      requestBody.serviceAccountKey = config.GOOGLE_SERVICE_ACCOUNT_KEY;
      requestBody.sheetId = config.GOOGLE_SHEET_ID;
    }

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
 * Uses server-side Supabase secrets
 */
export async function writeToGoogleSheets(rowData: string[]): Promise<boolean> {
  try {
    const requestBody: any = {
      action: "write",
      rowData,
    };
    
    // Include browser credentials if available (optional, for backward compatibility)
    if (isSupabaseGoogleSheetsConfigured()) {
      requestBody.serviceAccountKey = config.GOOGLE_SERVICE_ACCOUNT_KEY;
      requestBody.sheetId = config.GOOGLE_SHEET_ID;
    }

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
 * Uses server-side Supabase secrets
 */
export async function writeCategoriesToGoogleSheets(
  categoryPaths: string[]
): Promise<boolean> {
  try {
    const requestBody: any = {
      action: "write-categories",
      categoryPaths,
    };
    
    // Include browser credentials if available (optional, for backward compatibility)
    if (isSupabaseGoogleSheetsConfigured()) {
      requestBody.serviceAccountKey = config.GOOGLE_SERVICE_ACCOUNT_KEY;
      requestBody.sheetId = config.GOOGLE_SHEET_ID;
    }

    const { data, error } = await supabase.functions.invoke("google-sheets", {
      body: requestBody,
    });

    if (error) {
      console.error("Error writing categories to google-sheets function:", error);
      throw new Error(error.message || "Failed to write categories to Google Sheets");
    }

    if (data?.useDefaults) {
      throw new Error(
        "Edge function cannot read Supabase secrets. Redeploy the edge function after setting GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEET_ID."
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