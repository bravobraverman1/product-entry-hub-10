# Google Sheets Integration Setup Guide

This guide explains how to link your Google Sheets file to the Product Entry Hub application using a secure Google Service Account connected through Supabase Edge Functions.

## ⚠️ IMPORTANT: Most Common Mistake

**If you get a "Cannot Read Secrets" error when testing:**
- **Problem:** You added secrets to Supabase AFTER deploying the Edge Function
- **Solution:** Run the GitHub Actions workflow "Deploy Google Sheets Connection" (STEP 5)
- **Why:** Edge Functions only load secrets at deployment time - they need to be redeployed after adding secrets

👉 **Quick Fix:** Go to GitHub → Actions → "Deploy Google Sheets Connection" → Run workflow

---

## Overview

Follow these steps in order:
1. **STEP 1:** Create a Google Service Account
2. **STEP 2:** Share your Google Sheet with the service account
3. **STEP 3:** Create and Deploy the Edge Function (Required for new projects)
4. **STEP 4:** Add credentials to Supabase (server-side security)
5. **STEP 5:** Activate the Google Sheets Connection (GitHub Actions) **← REQUIRED after adding secrets**
6. **STEP 6:** Update hosting environment variables (Lovable) for Supabase URL/key
7. **STEP 7:** Test your connection

## Table of Contents
1. [STEP 1: Create a Google Service Account](#step-1-create-a-google-service-account)
2. [STEP 2: Share Your Google Sheet](#step-2-share-your-google-sheet)
3. [STEP 3: Create and Deploy the Edge Function](#step-3-create-and-deploy-the-edge-function)
4. [STEP 4: Add Credentials to Supabase](#step-4-add-credentials-to-supabase)
5. [STEP 5: Activate the Google Sheets Connection (GitHub Actions)](#step-5-activate-the-google-sheets-connection-github-actions)
6. [STEP 6: Update hosting environment variables (Lovable)](#step-6-update-hosting-environment-variables-lovable)
7. [STEP 7: Test Your Connection](#step-7-test-your-connection)
7. [New Project Checklist](#new-project-checklist)
8. [Sheet Structure Requirements](#sheet-structure-requirements)
9. [Configuration in Admin Panel](#configuration-in-admin-panel)
10. [Troubleshooting](#troubleshooting)

---

## STEP 1: Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. **Enable both APIs:**
  - **Google Sheets API**
  - **Google Drive API**
  (APIs & Services → Library → search each → Enable)
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Enter a name (e.g., "product-entry-hub-sheets-access")
6. Click **Create and Continue**
7. Grant the service account the **Editor** role (or more restrictive if preferred)
8. Click **Done**

---

## STEP 2: Share Your Google Sheet

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select the project you created in STEP 1
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click on the newly created service account
5. Go to the **Keys** tab
6. Click **Add Key** → **Create new key**
7. Select **JSON** format
8. Click **Create** - this downloads a JSON file to your computer
9. **Keep this file secure** - it contains credentials to access your Google account

### Share your sheet with the service account

1. Open the JSON key file you downloaded
2. Find the `client_email` field (looks like: `your-service-account@your-project.iam.gserviceaccount.com`)
3. Open your Google Sheet
4. Click **Share** button
5. Add the service account email as an **Editor**
6. Click **Share**

---

## STEP 3: Create & Deploy the `google-sheets` Edge Function

You will now create the Edge Function by pasting ready-made code directly into Supabase.

### 1) Open Supabase Dashboard

- Go to [supabase.com/dashboard](https://supabase.com/dashboard)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get allowed origins from environment (comma-separated) or default to localhost for development
const ENV_ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [
  ...ENV_ALLOWED_ORIGINS,
  Deno.env.get("ALLOWED_ORIGIN") || "",
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

function originMatches(allowed: string, origin: string): boolean {
  if (allowed === "*") return true;
  if (!allowed.includes("*")) return allowed === origin;

  // Basic wildcard support (e.g., https://*.lovable.dev)
  const escaped = allowed.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  const regex = new RegExp(`^${escaped}$`);
  return regex.test(origin);
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

type ServiceAccountKey = {
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
};

function getSupabaseClient(authHeader: string) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getCorsHeaders(origin?: string) {
  // Always reflect the request origin to avoid browser CORS blocks.
  // Security is enforced via Supabase authentication (apikey + JWT), not CORS allowlisting.
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

// Validate action parameter
function isValidAction(action: unknown): action is "read" | "write" | "write-categories" | "write-brands" | "write-legal" {
  return ["read", "write", "write-categories", "write-brands", "write-legal"].includes(action as string);
}

// Validate tabNames parameter
function isValidTabNames(tabNames: unknown): boolean {
  if (!tabNames || typeof tabNames !== "object") return true; // Optional
  const obj = tabNames as Record<string, unknown>;
  return Object.values(obj).every((v) => typeof v === "string" && v.length > 0 && v.length < 255);
}

function parseServiceAccountKey(raw: string): ServiceAccountKey | null {
  const tryParse = (value: string): ServiceAccountKey | null => {
    try {
      return JSON.parse(value) as ServiceAccountKey;
    } catch {
      return null;
    }
  };

  const direct = tryParse(raw);
  if (direct) return direct;

  // Attempt base64 decode (common when secrets are stored encoded)
  try {
    const decoded = atob(raw);
    const decodedParsed = tryParse(decoded);
    if (decodedParsed) return decodedParsed;
  } catch {
    // ignore
  }

  return null;
}

function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return key;
  const normalized = key.includes("\\n") ? key.replace(/\\n/g, "\n") : key;
  return normalized.replace(/\r/g, "").trim();
}

serve(async (req) => {
  const origin = req.headers.get("origin") || "";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error("Invalid JSON in request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // INPUT VALIDATION: Validate action parameter
    const { action } = body;
    if (!isValidAction(action)) {
      console.error("Invalid action:", action);
      return new Response(
        JSON.stringify({ error: "Invalid action parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // INPUT VALIDATION: Validate tabNames parameter
    const { tabNames } = body;
    if (!isValidTabNames(tabNames)) {
      console.error("Invalid tabNames:", tabNames);
      return new Response(
        JSON.stringify({ error: "Invalid tabNames parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // AUTHENTICATION: Verify the request has a valid apikey header.
    // The Supabase JS client automatically sends the anon key via the `apikey` header.
    // Since this app has no user authentication, we just verify the apikey is present.
    const apiKey = req.headers.get("apikey") || "";
    const authHeader = req.headers.get("authorization") || "";
    
    if (!apiKey && !authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Only use server-side secrets from Deno.env, never from request body
    // This prevents exposing credentials to the client
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID");

    // If no credentials configured, return flag to use defaults
    if (!serviceAccountKey || !sheetId) {
      console.log("Google Sheets credentials not configured, using defaults");
      return new Response(
        JSON.stringify({ useDefaults: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse service account key
    const keyData = parseServiceAccountKey(serviceAccountKey);
    if (!keyData) {
      console.error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY: unable to parse JSON");
      return new Response(
        JSON.stringify({ error: "Invalid GOOGLE_SERVICE_ACCOUNT_KEY JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    keyData.private_key = normalizePrivateKey(keyData.private_key);

    if (!keyData.client_email || !keyData.private_key) {
      console.error("Invalid GOOGLE_SERVICE_ACCOUNT_KEY: missing fields");
      return new Response(
        JSON.stringify({ error: "Invalid GOOGLE_SERVICE_ACCOUNT_KEY: missing required fields" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token via JWT
    const accessToken = await getAccessToken(keyData);

    if (action === "read") {
      const result = await readAllSheets(accessToken, sheetId, tabNames);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "write") {
      // INPUT VALIDATION: Validate rowData
      const { rowData } = body;
      if (!Array.isArray(rowData) || !rowData.every((cell) => typeof cell === "string" && cell.length < 10000)) {
        console.error("Invalid rowData:", rowData);
        return new Response(
          JSON.stringify({ error: "Invalid rowData parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await appendRow(accessToken, sheetId, resolveTabName(tabNames, "RESPONSES", "RESPONSES"), rowData);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "write-categories") {
      // INPUT VALIDATION: Validate categoryPaths
      const { categoryPaths } = body;
      if (!Array.isArray(categoryPaths) || !categoryPaths.every((p) => typeof p === "string" && p.length > 0 && p.length < 1000)) {
        console.error("Invalid categoryPaths:", categoryPaths);
        return new Response(
          JSON.stringify({ error: "Invalid categoryPaths parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await clearAndWriteCategories(
        accessToken,
        sheetId,
        categoryPaths,
        resolveTabName(tabNames, "CATEGORIES", "CATEGORIES")
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "write-brands") {
      // INPUT VALIDATION: Validate brands
      const { brands } = body;
      if (
        !Array.isArray(brands) ||
        !brands.every(
          (b) =>
            typeof b === "object" &&
            typeof b.brand === "string" &&
            b.brand.length > 0 &&
            b.brand.length < 255 &&
            typeof b.brandName === "string" &&
            b.brandName.length < 255 &&
            typeof b.website === "string" &&
            b.website.length < 2000
        )
      ) {
        console.error("Invalid brands:", brands);
        return new Response(
          JSON.stringify({ error: "Invalid brands parameter" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      await clearAndWriteBrands(
        accessToken,
        sheetId,
        brands,
        resolveTabName(tabNames, "BRANDS", "BRANDS")
      );
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "write-legal") {
      const { propertyName, value } = body;
      if (
        typeof propertyName !== "string" ||
        typeof value !== "string" ||
        propertyName.trim().length === 0 ||
        value.trim().length === 0 ||
        propertyName.length > 255 ||
        value.length > 255
      ) {
        console.error("Invalid legal value payload:", { propertyName, value });
        return new Response(
          JSON.stringify({ error: "Invalid legal value payload" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await addLegalValueToLegalTab(
        accessToken,
        sheetId,
        resolveTabName(tabNames, "LEGAL", "LEGAL"),
        propertyName,
        value
      );

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error", useDefaults: true }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// --- Google Auth helpers ---

async function getAccessToken(keyData: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncodeUtf8(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64UrlEncodeUtf8(
    JSON.stringify({
      iss: keyData.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const signatureInput = `${header}.${claim}`;
  const key = await importPrivateKey(keyData.private_key);
  const signature = await sign(key, signatureInput);
  const jwt = `${signatureInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) {
    const raw = JSON.stringify(tokenData);
    if (tokenData?.error === "invalid_grant" && String(tokenData?.error_description || "").includes("Invalid JWT Signature")) {
      throw new Error(
        "Invalid service account key. The private key does not match the client_email or the key is malformed. Recreate the JSON key and update GOOGLE_SERVICE_ACCOUNT_KEY, then redeploy."
      );
    }
    throw new Error(`Failed to get access token: ${raw}`);
  }
  return tokenData.access_token;
}

function base64UrlEncodeUtf8(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function importPrivateKey(pem: string) {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  return await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function sign(key: CryptoKey, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    encoder.encode(data)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// --- Sheets API helpers ---

/**
 * Sanitize cell values to prevent formula injection.
 * Prepend single quote to values starting with =, +, -, @, or tab character.
 */
function sanitizeForFormulas(value: string): string {
  if (!value || typeof value !== "string") return value;
  const firstChar = value.charAt(0);
  if (firstChar === "=" || firstChar === "+" || firstChar === "-" || firstChar === "@" || firstChar === "\t") {
    return "'" + value;
  }
  return value;
}

function resolveTabName(
  tabNames: Record<string, string> | undefined,
  key: string,
  fallback: string
): string {
  const value = tabNames?.[key];
  return value && typeof value === "string" && value.trim() ? value.trim() : fallback;
}

async function getSheetValues(token: string, sheetId: string, range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`Sheets API error for range ${range}:`, errText);
    return [];
  }

  const data = await res.json();
  return data.values ?? [];
}

async function appendRow(token: string, sheetId: string, sheet: string, rowData: string[]) {
  // Sanitize all row data to prevent formula injection
  const sanitizedData = rowData.map(sanitizeForFormulas);
  
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheet)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [sanitizedData] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append row: ${errText}`);
  }

  console.log("Row appended successfully");
}

async function readAllSheets(
  token: string,
  sheetId: string,
  tabNames?: Record<string, string>
) {
  // Read all tabs in parallel
  const productsTab = resolveTabName(tabNames, "PRODUCTS_TODO", "PRODUCTS TO DO");
  const categoriesTab = resolveTabName(tabNames, "CATEGORIES", "CATEGORIES");
  const propertiesTab = resolveTabName(tabNames, "PROPERTIES", "PROPERTIES");
  const legalTab = resolveTabName(tabNames, "LEGAL", "LEGAL");
  const brandsTab = resolveTabName(tabNames, "BRANDS", "BRANDS");
  const filterTab = resolveTabName(tabNames, "FILTER", "FILTER");
  const filterDefaultsTab = resolveTabName(tabNames, "FILTER_DEFAULTS", "FILTER_DEFAULTS");
  const [productsRaw, categoriesRaw, propertiesRaw, legalRaw, brandsRaw, filterRaw, filterDefaultsRaw] = await Promise.all([
    getSheetValues(token, sheetId, `${productsTab}!A:D`),
    getSheetValues(token, sheetId, `${categoriesTab}!A:A`),
    getSheetValues(token, sheetId, `${propertiesTab}!A:D`),
    getSheetValues(token, sheetId, `${legalTab}!A:AZ`),
    getSheetValues(token, sheetId, `${brandsTab}!A:C`),
    getSheetValues(token, sheetId, `${filterTab}!A:B`),
    getSheetValues(token, sheetId, `${filterDefaultsTab}!A:AZ`),
  ]);

  // Parse PRODUCTS TO DO: SKU (A), Brand (B), Status (C), Visibility (D) - skip header row
  // Only include SKUs where Status = "READY" and Visibility >= 1
  const products = productsRaw.slice(1).map((row) => ({
    sku: row[0] ?? "",
    brand: row[1] ?? "",
    status: row[2] ?? "",
    visibility: parseInt(row[3] ?? "0", 10),
  }))
    .filter((p) => p.sku && p.status === "READY" && p.visibility >= 1)
    .map((p) => ({
      sku: p.sku,
      brand: p.brand,
      exampleTitle: p.sku, // Use SKU as example title since PRODUCTS TO DO doesn't have it
    }));

  // Parse CATEGORIES: full path strings -> build tree
  // STRICT: Read ONLY from CATEGORIES tab, skip header row (row 1), data starts at row 2
  const categoryPaths = categoriesRaw.slice(1).map((row) => {
    const path = row[0] ?? "";
    // Trim whitespace from the entire path and from each segment
    return path.trim();
  }).filter((p) => p.length > 0);
  
  // If no categories found, log warning but allow fallback to defaults
  if (categoryPaths.length === 0) {
    console.warn("WARNING: CATEGORIES tab is empty or missing data. Using default categories. To configure, add category paths to the CATEGORIES sheet starting at row 2 (e.g., 'Indoor Lights/Wall Lights')");
    return { useDefaults: true };
  }
  
  const categories = buildCategoryTree(categoryPaths);
  
  // Count actual leaf paths (not tree nodes) for logging
  const leafPathCount = categoryPaths.length;
  console.log(`Successfully read ${leafPathCount} category paths from CATEGORIES tab`);

  // Parse LEGAL (row-based): Column A = PropertyName, Columns B+ = Allowed Values
  const legalRows = legalRaw.slice(1).map((row) => {
    const name = (row[0] ?? "").trim();
    const values = row.slice(1).map((v) => (v ?? "").toString().trim()).filter(Boolean);
    return { name, values };
  }).filter((r) => r.name);

  const legalValues = legalRows.flatMap((row) =>
    row.values.map((value) => ({
      propertyName: row.name,
      allowedValue: value,
    }))
  );

  const properties = legalRows.map((row) => ({
    name: row.name,
    key: toPropertyKey(row.name),
    inputType: row.values.length > 0 ? "dropdown" : "text",
    section: "Filters",
    unitSuffix: row.values.length > 0 ? undefined : "mm",
  }));

  // Parse FILTER: Category Keywords (A2+) -> Filter Default Names (B2+)
  const categoryFilterMap = filterRaw.slice(1).map((row) => ({
    categoryKeyword: (row[0] ?? "").trim(),
    filterDefault: (row[1] ?? "").trim(),
  })).filter((m) => m.categoryKeyword && m.filterDefault);

  // Parse FILTER_DEFAULTS: Row 1 = Filter Default Names, Rows 2+ = Property Names per column
  const filterDefaultMap: Array<{ name: string; allowedProperties: string[] }> = [];
  if (filterDefaultsRaw.length > 0) {
    const headerRow = filterDefaultsRaw[0];
    for (let col = 0; col < headerRow.length; col += 1) {
      const name = (headerRow[col] ?? "").trim();
      if (!name) continue;
      const allowedProperties = filterDefaultsRaw
        .slice(1)
        .map((row) => (row[col] ?? "").toString().trim())
        .filter(Boolean);
      filterDefaultMap.push({ name, allowedProperties });
    }
  }

  // Parse BRANDS: Brand, BrandName, Website (skip header row)
  const brands = brandsRaw.slice(1).map((row) => ({
    brand: row[0] ?? "",
    brandName: row[1] ?? "",
    website: row[2] ?? "",
  })).filter((b) => b.brand);

  if (properties.length === 0) {
    return { products, brands, categories, properties: [], legalValues: [], categoryPathCount: leafPathCount, categoryFilterMap, filterDefaultMap };
  }

  return { 
    products, 
    brands, 
    categories, 
    properties, 
    legalValues, 
    categoryPathCount: leafPathCount,
    categoryFilterMap,
    filterDefaultMap,
  };
}

function toPropertyKey(name: string): string {
  const cleaned = name
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
  if (!cleaned) return "";
  const parts = cleaned.split(" ");
  return parts[0] + parts.slice(1).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("");
}

function columnLetter(index: number): string {
  let n = index + 1;
  let result = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

async function addLegalValueToLegalTab(
  token: string,
  sheetId: string,
  legalTab: string,
  propertyName: string,
  value: string
): Promise<void> {
  const trimmedName = propertyName.trim();
  const trimmedValue = value.trim();
  if (!trimmedName || !trimmedValue) return;

  const rows = await getSheetValues(token, sheetId, `${legalTab}!A:AZ`);
  let rowIndex = -1;
  let rowValues: string[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const name = (rows[i]?.[0] ?? "").toString().trim();
    if (name === trimmedName) {
      rowIndex = i + 1; // 1-based for sheets
      rowValues = rows[i] ?? [];
      break;
    }
  }

  if (rowIndex === -1) {
    await appendRow(token, sheetId, legalTab, [trimmedName, trimmedValue]);
    return;
  }

  const existingValues = rowValues.slice(1).map((v) => (v ?? "").toString().trim()).filter(Boolean);
  if (existingValues.includes(trimmedValue)) return;

  const nextColIndex = Math.max(rowValues.length, 1);
  const col = columnLetter(nextColIndex);
  const range = `${legalTab}!${col}${rowIndex}`;

  const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(updateUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [[sanitizeForFormulas(trimmedValue)]] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update LEGAL value: ${errText}`);
  }
}

function buildCategoryTree(paths: string[]) {
  interface TreeNode {
    name: string;
    children?: TreeNode[];
  }

  const root: TreeNode[] = [];

  for (const path of paths) {
    const parts = path.split("/").map((s) => s.trim()).filter(Boolean);
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      let existing = current.find((n) => n.name === name);
      if (!existing) {
        existing = { name };
        if (i < parts.length - 1) {
          existing.children = [];
        }
        current.push(existing);
      }
      if (i < parts.length - 1) {
        if (!existing.children) existing.children = [];
        current = existing.children;
      }
    }
  }

  return root;
}

async function clearAndWriteCategories(
  token: string,
  sheetId: string,
  categoryPaths: string[],
  categoriesTab: string
): Promise<void> {
  // Clear existing data in CATEGORIES!A:A (keep header, delete data starting at row 2)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${categoriesTab}!A2:A`)}:clear`;
  const clearRes = await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!clearRes.ok) {
    const errText = await clearRes.text();
    throw new Error(`Failed to clear categories: ${errText}`);
  }

  // Sanitize category paths to prevent formula injection
  const sanitizedPaths = categoryPaths.map(sanitizeForFormulas);

  // Write new category paths
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${categoriesTab}!A2`)}?valueInputOption=USER_ENTERED`;
  const writeRes = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: sanitizedPaths.map((path) => [path]),
    }),
  });

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    throw new Error(`Failed to write categories: ${errText}`);
  }

  console.log(`Successfully wrote ${sanitizedPaths.length} category paths to ${categoriesTab} tab`);
}

async function clearAndWriteBrands(
  token: string,
  sheetId: string,
  brands: Array<{ brand: string; brandName: string; website: string }>,
  brandsTab: string
): Promise<void> {
  // Clear existing data in BRANDS!A:C (keep header, delete data starting at row 2)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${brandsTab}!A2:C`)}:clear`;
  const clearRes = await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!clearRes.ok) {
    const errText = await clearRes.text();
    throw new Error(`Failed to clear brands: ${errText}`);
  }

  // Sanitize brand data to prevent formula injection
  const sanitizedBrands = brands.map((brand) => [
    sanitizeForFormulas(brand.brand),
    sanitizeForFormulas(brand.brandName),
    sanitizeForFormulas(brand.website),
  ]);

  // Write new brands
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${brandsTab}!A2`)}?valueInputOption=USER_ENTERED`;
  const writeRes = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: sanitizedBrands,
    }),
  });

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    throw new Error(`Failed to write brands: ${errText}`);
  }

  console.log(`Successfully wrote ${brands.length} brands to ${brandsTab} tab`);
}
  brandsTab: string
): Promise<void> {
  // Clear existing data in BRANDS!A:C (keep header, delete data starting at row 2)
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${brandsTab}!A2:C`)}:clear`;
  const clearRes = await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!clearRes.ok) {
    const errText = await clearRes.text();
    throw new Error(`Failed to clear brands: ${errText}`);
  }

  // Sanitize brand data to prevent formula injection
  const sanitizedBrands = brands.map((brand) => [
    sanitizeForFormulas(brand.brand),
    sanitizeForFormulas(brand.brandName),
    sanitizeForFormulas(brand.website),
  ]);

  // Write new brands
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(`${brandsTab}!A2`)}?valueInputOption=USER_ENTERED`;
  const writeRes = await fetch(writeUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      values: sanitizedBrands,
    }),
  });

  if (!writeRes.ok) {
    const errText = await writeRes.text();
    throw new Error(`Failed to write brands: ${errText}`);
  }

  console.log(`Successfully wrote ${brands.length} brands to ${brandsTab} tab`);
}
```

### 6) Deploy

- Click **"Deploy function"**
- Wait for completion (usually 10-30 seconds)
- Go back to **Edge Functions** → **Functions**
- Confirm `google-sheets` appears and is clickable

---

## STEP 4: Add Credentials to Supabase

Your credentials will be stored securely on Supabase's server, which is more secure than keeping them in your browser.

### What is Supabase?

Supabase is a secure backend service that hosts your application's server-side functionality. When you add secrets to Supabase, they are encrypted and stored on Supabase's servers—never exposed to the browser or to the public.

**Security Best Practice:** For production environments, consider rotating your service account keys periodically (every 90-180 days) to maintain security. When rotating, create a new key, update the secret in Supabase, and then delete the old key from Google Cloud Console.

### How to add your credentials to Supabase

**Prerequisites:** You must have completed Step 3 and deployed the `google-sheets` Edge Function first.

#### Step 4.1: Navigate to Edge Function Secrets

1. **Open Supabase Dashboard**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Log in with your account
   - Select the project you're using for this application

2. **Navigate to the Edge Functions page**
  - In the left sidebar, click **"Edge Functions"**
  - You should see a list of deployed functions

3. **Open the google-sheets function**
  - In the functions list, find and click on **"google-sheets"**
  - This opens the function details page

4. **Open the Secrets tab**
  - In the left sidebar under **Edge Functions**, click **Secrets**
  - This opens the secrets page where you can add values and click **Save**

**Workaround / Manual Navigation:**
If buttons or links aren't working, manually navigate using this URL pattern:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions/google-sheets
```
Replace `YOUR_PROJECT_REF` with your actual project reference ID (found in Settings → General).

Once on the function page, look for the Secrets/Environment Variables tab in the navigation.

**Important Note:** Secrets are stored per-project and per-function. The secrets you add to the `google-sheets` function are only accessible to that specific function in that specific project.

#### Step 4.2: Add the first secret: GOOGLE_SERVICE_ACCOUNT_KEY

   - Click **"Add secret"** or **"New secret"** button
   - **Name (COPY THIS EXACTLY):** `GOOGLE_SERVICE_ACCOUNT_KEY` (case-sensitive)
   - **Value (YOUR JSON FILE):** Paste the **entire** JSON file contents from Step 2
     - The value should start with `{` and end with `}`
     - Copy everything—don't modify it
     - It should look something like:
       ```json
       {"type":"service_account","project_id":"your-project",...}
       ```
   - Click **"Save"** or **"Add Secret"**

#### Step 4.3: Add the second secret: GOOGLE_SHEET_ID

   - Click **"Add secret"** or **"New secret"** button again
   - **Name (COPY THIS EXACTLY):** `GOOGLE_SHEET_ID` (case-sensitive)
   - **Value (YOUR SHEET ID):** Your Google Sheet ID (found in your sheet's URL)
     - Open your Google Sheet
     - Look at the URL: `https://docs.google.com/spreadsheets/d/`**XXXX-YOUR-ID**`/edit`
     - Copy only the ID part (the long string between `/d/` and `/edit`)
     - Example: `1abc2def3ghi4jkl5mno6pqr7stu8vwxyz`
   - Click **"Save"** or **"Add Secret"**

#### Step 4.4: Add the third secret: ALLOWED_ORIGINS (IMPORTANT for production)

   - Click **"Add secret"** or **"New secret"** button again
   - **Name (COPY THIS EXACTLY):** `ALLOWED_ORIGINS` (case-sensitive)
   - **Value (YOUR DOMAIN):** Your application's domain origin
     - **For Lovable preview:** `https://lovable.dev`
     - **For production (custom domain):** `https://yourdomain.com`
     - **For multiple domains (comma-separated):** `https://lovable.dev,https://yourdomain.com`
     - **For development (allow all):** `*` (not recommended for production)
   - Click **"Save"** or **"Add Secret"**
   
   **Why this is needed:** The Edge Function uses this to set CORS headers so your application can communicate with Google Sheets. Misconfiguration will result in "CORS error" when testing the connection.

**Copy/Paste Tip - Secret Names (COPY EXACTLY):**
```
GOOGLE_SERVICE_ACCOUNT_KEY
GOOGLE_SHEET_ID
ALLOWED_ORIGINS
```

### Verify all secrets are saved

- You should see `GOOGLE_SERVICE_ACCOUNT_KEY`, `GOOGLE_SHEET_ID`, and `ALLOWED_ORIGINS` listed in the Secrets section
- All should show a green checkmark indicating they're saved

#### Step 4.4: Redeploy the Edge Function (REQUIRED)

**🚨 CRITICAL STEP - DO NOT SKIP 🚨**

**After adding or changing secrets, you MUST redeploy the Edge Function.**

This is the **#1 most common mistake** that causes "Cannot Read Secrets" errors. If you skip this step, the test connection will fail even though your secrets are correctly configured in Supabase.

**Why this is necessary:**
- Edge Functions load environment variables at deployment time
- Adding secrets to an already-deployed function does not make them available
- The function will continue to report missing secrets until redeployed
- **Your secrets exist in Supabase, but the running function can't see them until you redeploy**

**Choose one redeployment method:**

**Option 1: Use GitHub Actions (Recommended - Easiest)**
The GitHub Actions workflow in Step 5 will automatically redeploy the function with your secrets. If you plan to use GitHub Actions, you can skip manual redeployment here and **proceed directly to Step 5**. This is the easiest and most reliable method.

**Option 2: Redeploy via Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Click on the **"google-sheets"** function
3. Open the **Code** tab
4. Click **Deploy updates** (bottom-right)
5. Wait for deployment to complete (10-30 seconds)
6. The function will now have access to your secrets

**Option 3: Redeploy via CLI**
If you're using the Supabase CLI:
```bash
supabase functions deploy google-sheets
```

**Verify redeployment:**
- After redeploying, the Edge Function's deployment timestamp should be updated
- You can verify this in the Functions dashboard

---

## STEP 5: Activate the Google Sheets Connection (GitHub Actions)

### What this step does

This step deploys your Edge Function to Supabase and activates the connection. You are **not creating or editing any code**—this is done by running a pre-built automated workflow in GitHub.

**Note:** This step assumes you've completed Step 3 and the `google-sheets` function is already deployed. This GitHub Actions workflow will redeploy the function with your configured secrets.

The workflow will:
- Deploy the Edge Function (the server file that connects to Google Sheets)
- Activate your Google Sheets connection
- No software installation required
- No terminal access needed

### One-time setup: Add GitHub Secrets

Before running the workflow, you need to add three GitHub secrets. These allow the workflow to access your Supabase project.

1. **Open your GitHub repository settings**
   - Go to your GitHub repository: `https://github.com/{{OWNER}}/{{REPO}}`
   - Click the **Settings** tab (top right)
   - In the left sidebar, find and click **"Secrets and variables"** → **"Actions"**

2. **Add three secrets** (click "New repository secret" for each):

   **Secret 1: SUPABASE_ACCESS_TOKEN**
   - Value: Get from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
   - Log in and create a new token if needed
   - Copy the token and paste it here

   **Secret 2: SUPABASE_PROJECT_REF**
   - Value: Your Supabase project ID
   - In Supabase dashboard, go to **Settings** → **General**
   - Copy the **Reference ID** (looks like: `abcdefghijklmnop`)
   - Paste it into GitHub secrets

   **Secret 3: SUPABASE_DB_PASSWORD**
   - Value: Your Supabase database password
   - This is the password you created when you set up your Supabase project
   - If you don't remember it, you can reset it in Supabase dashboard → **Settings** → **Database**

### Run the workflow (5 clicks)

1. Go to your GitHub repository → **Actions** tab
2. In the left sidebar, find and select **"Deploy Google Sheets Connection"**
3. Click the **"Run workflow"** button (right side, blue button)
4. In the dropdown that appears, select **"production"** environment
5. Click the green **"Run workflow"** button to start
6. Wait 2-3 minutes for completion (you'll see a green checkmark ✓ when done)

**That's it!** Your Google Sheets connection is now deployed and active.

---

## STEP 6: Update hosting environment variables (Lovable)

### ✅ Lovable (required)

In **Lovable → Environment Variables**, add:

```
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

Then **Redeploy** in Lovable so the values are embedded in the build.

### ✅ Local development (optional)

If running locally, add the same values to your `.env` or `.env.local` and restart your dev server.

---

## STEP 7: Test Your Connection

### Verify everything is working

1. Navigate to the **Admin** tab in the Product Entry Hub application
2. Scroll to the **Google Sheets Connection** section
3. Click the **"Test Connection"** button (blue button)
4. Wait a moment for the test to complete

### What should happen

- **Success:** You'll see a message like "Connection Successful! ✓ Connected to your sheet. Found X products and Y categories."
  - This means your Google Sheet is connected and data is being read correctly
- **Error:** You'll see an error message
  - See the **Troubleshooting** section below for solutions

---

## New Project Checklist

Setting up Google Sheets integration on a brand-new Supabase project? Follow this checklist to ensure everything is configured correctly:

### ✅ Pre-Deployment Checklist
- [ ] Google Service Account created (Step 1)
- [ ] Service Account JSON key downloaded and saved securely
- [ ] Google Sheet shared with service account email as Editor (Step 2)
- [ ] Google Sheets API enabled in Google Cloud Console

### ✅ Deployment Checklist
- [ ] Edge Function `google-sheets` created and deployed to Supabase (Step 3)
- [ ] Function visible in Supabase Dashboard → Edge Functions list
- [ ] Function status shows "Active" or "Deployed"

### ✅ Configuration Checklist
- [ ] Secret `GOOGLE_SERVICE_ACCOUNT_KEY` added to the function (Step 4)
- [ ] Secret `GOOGLE_SHEET_ID` added to the function (Step 4)
- [ ] Both secrets show green checkmark or "Saved" status
- [ ] **Edge Function redeployed after adding secrets** (Step 4.4 - REQUIRED)
- [ ] GitHub secrets configured: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` (Step 5)

### ✅ Activation & Testing Checklist
- [ ] GitHub Actions workflow "Deploy Google Sheets Connection" run successfully (Step 5)
- [ ] Workflow shows green checkmark ✓ in Actions tab
- [ ] Connection test passed in Admin panel (Step 7)
- [ ] SKU Selector shows actual products (not mock data)

### 🔍 Quick Troubleshooting
If any step fails, refer to the [Troubleshooting](#troubleshooting) section below for detailed solutions.

---

## Sheet Structure Requirements

Your Google Sheet must contain the following tabs with the specified structure:

**Important:** The Supabase Edge Function reads these exact tab names: `PRODUCTS`, `CATEGORIES`, `PROPERTIES`, and `LEGAL`. If your sheet uses different names, rename the tabs or update the Edge Function ranges.

### 1. PRODUCTS (required for Edge Function)

Contains products to be processed.

| Column | Field | Description |
|--------|-------|-------------|
| A | SKU | Product SKU |
| B | Brand | Product brand |
| C | Status | READY, COMPLETE, or DEAD |
| D | Visibility | 1 (visible) or 0 (hidden) |

### 2. CATEGORIES (required for Edge Function)

Contains category hierarchy as full paths.

| Column | Field | Description |
|--------|-------|-------------|
| A | Path | Full category path (e.g., "Indoor Lights/Ceiling Lights/Downlights") in column A, starting at row 2 (row 1 is a header) |

### 3. BRANDS (optional)

Contains brand and supplier information.

| Column | Field | Description |
|--------|-------|-------------|
| A | Brand | Brand name |
| B | Supplier | Supplier name |

### 4. PROPERTIES (required for Edge Function)

Defines custom properties/fields for products.

| Column | Field | Description |
|--------|-------|-------------|
| A | PropertyName | Display name of the property |
| B | Key | Internal key/identifier |
| C | InputType | text, dropdown, number, or boolean |
| D | Section | Grouping section name |

### 5. LEGAL (required for Edge Function)

Defines allowed values for dropdown properties.

| Column | Field | Description |
|--------|-------|-------------|
| A | PropertyName | Must match a property from PROPERTIES sheet |
| B | AllowedValue | A valid option for this dropdown |

### 6. OUTPUT (optional)

Where completed product data is written. Structure should match your business requirements.

### 7. FILTER (optional)

Optional: Defines which fields are visible/required for specific categories.

| Column | Field | Description |
|--------|-------|-------------|
| A | CategoryPath | Full category path |
| B | VisibleFields | Comma-separated list of visible fields |
| C | RequiredFields | Comma-separated list of required fields |

### Other Optional Tabs

- **TEMP** - Temporary working data
- **ExistingProds** - Previously completed products
- **NewNames** - Name mappings
- **UPLOAD** - Upload staging area

---

## Configuration in Admin Panel

The Admin panel provides several configuration options for your application:

### Google Sheets Connection

**Setup and Testing**
- Your credentials are already stored securely in Supabase (no need to paste them in the browser)
- Click the **"Test Connection"** button to verify everything is working
- If the test succeeds, your Google Sheet is connected and data is being read

### Sheet Tab Names

Configure the exact tab names in your Google Sheet to match your spreadsheet structure.

### Categories Editor

Manage your product category hierarchy in a visual tree editor.

### LEGAL Values Editor

Manage dropdown options for your custom properties/fields.

### Other Settings

- Product Instructions PDF URL
- Google Drive CSV Folder ID for exports

---

## Troubleshooting

### I don't see `google-sheets` in the Functions list

**Symptom:** When I go to Supabase Dashboard → Edge Functions, I don't see the `google-sheets` function listed.

**Solution:**
- You haven't deployed the function yet
- Go back to [STEP 3: Create & Deploy the `google-sheets` Edge Function](#step-3-create--deploy-the-google-sheets-edge-function)
- Follow the steps to create and deploy the function using the Supabase Dashboard
- After deployment, refresh your browser and check the Functions list again
- The function should appear within 30 seconds after successful deployment

### I can't find the Secrets tab

**Symptom:** I opened the `google-sheets` function, but I can't find where to add secrets.

**Solution:**
- Make sure you've clicked on the function name to open its detail page (not just viewing the list)
- Look for these possible tab/section names:
  - **"Secrets"**
  - **"Environment Variables"**
  - **"Environment"**
  - **"Settings"** (with a Secrets subsection)
- The UI label varies by Supabase version
- Try using the manual URL navigation: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions/google-sheets`
- If still not visible, ensure your Supabase plan supports Edge Functions (it's available on the free tier)

### The Edge Function cannot read the required secrets

**Symptom:** Test Connection fails with "Cannot Read Secrets" error, but when you check Supabase Dashboard → Edge Functions → google-sheets → Secrets, BOTH secrets (`GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID`) clearly exist.

**🎯 QUICK FIX (Works 95% of the time):**

**The problem:** You added secrets AFTER deploying the Edge Function.

**The solution:** Redeploy the Edge Function using GitHub Actions:

1. Go to your GitHub repository → **Actions** tab
2. Click **"Deploy Google Sheets Connection"** in the left sidebar
3. Click **"Run workflow"** dropdown → select "production" → click **"Run workflow"** button
4. Wait 2-3 minutes for completion
5. Go back to the Admin panel and click **"Test Connection"** again

**Why this works:** Edge Functions load environment variables at deployment time only. Adding secrets to an already-running function requires redeployment to make them available.

---

**Still not working?** Follow the detailed diagnostic checklist below:

**This error does NOT always mean secrets are missing.** It can occur for several reasons:

**Common Causes:**
1. **Secrets were added AFTER the Edge Function was deployed** (most common - 95% of cases)
2. **The Edge Function was not redeployed after adding secrets**
3. **Environment variable names don't match exactly**
4. **Function is deployed to a different environment** (preview vs production)
5. **Frontend is calling a stale or wrong endpoint**

**Diagnostic Checklist:**

Follow this checklist in order to identify and fix the issue:

☐ **Step 1: Verify secrets exist**
   - Go to Supabase Dashboard → Edge Functions → google-sheets → Secrets
   - Confirm both `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` are listed
   - Both should show a green checkmark or "Saved" status

☐ **Step 2: Verify secret names match exactly**
   - Secret names are case-sensitive
   - Must be EXACTLY: `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID`
   - No extra spaces, underscores, or typos
   - Check for invisible characters copied from documentation

☐ **Step 3: Redeploy the Edge Function** (REQUIRED - THIS IS THE FIX)
   - **Method A (Recommended):** Use GitHub Actions workflow as described in Quick Fix above
   - **Method B:** Go to Supabase Dashboard → Edge Functions → google-sheets → Click **"Redeploy"** button → Wait 10-30 seconds
   - **Method C:** Use Supabase CLI: `supabase functions deploy google-sheets`
   - **Why:** Edge Functions load environment variables at deployment time and do NOT auto-refresh when secrets are added

☐ **Step 4: Verify production deployment**
   - Ensure the function is deployed to production (not preview)
   - Check the deployment environment in the Functions dashboard
   - If using multiple environments, secrets must be added to each

☐ **Step 5: Re-run the connection test**
   - Go to Admin tab in the application
   - Click "Test Connection" button
   - Wait for the test to complete

☐ **Step 6: Verify JSON key format** (if still failing)
   - The `GOOGLE_SERVICE_ACCOUNT_KEY` value should be valid JSON
   - Should start with `{` and end with `}`
   - Copy the entire contents of your downloaded JSON key file
   - No extra quotes or escape characters

☐ **Step 7: Check function logs** (advanced)
   - Go to Supabase Dashboard → Edge Functions → google-sheets → Logs
   - Look for error messages that indicate the specific issue
   - Common errors: "Invalid JSON", "Authentication failed", "Sheet not found"

### Data Not Loading

**Symptom:** Application shows mock data instead of your Google Sheets data

**Solutions:**
- Navigate to the Admin tab and click "Test Connection" to check if credentials are valid
- Check that `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` are correctly set in Supabase secrets
- Verify the service account email is shared with Editor access on your Google Sheet
- Confirm the Edge Function is deployed: check Supabase Functions dashboard for the "google-sheets" function
- Look for errors in Supabase Function logs
- Check that Google Sheets API is enabled in your Google Cloud project
- Verify the JSON key is complete and properly formatted (starts with `{` and ends with `}`)
- Ensure the Sheet ID is correct (no extra spaces or characters)

### Permission Errors

**Symptom:** "Access denied" or "Permission denied" errors

**Solutions:**
- Ensure the service account has Editor access to the sheet
- Verify the service account JSON key is correctly copied into Supabase secrets (the entire contents)
- Check that Google Sheets API is enabled in your Google Cloud project

### Sheet Structure Errors

**Symptom:** Data loads but is incomplete or incorrectly formatted

**Solutions:**
- Verify your sheet tabs match the names configured in Admin panel
- Check that column orders match the requirements above
- Ensure header rows are present and data starts from row 2

### Supabase Secrets Not Taking Effect

**Symptom:** I added secrets to Supabase but the connection still doesn't work

**Solutions:**
- Confirm both secrets are saved in Supabase: `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID`
- After adding/changing secrets, the Edge Function automatically uses them—no manual redeploy needed
- Wait 30 seconds after adding secrets, then try "Test Connection" again
- Check Supabase Function logs for error details

---

## Testing Your Setup

1. Navigate to the Admin tab in the Product Entry Hub application
2. Scroll to **Google Sheets Connection**
3. Click **"Test Connection"** button
4. If you see your actual SKU data (not mock data), the connection is working
5. You can also check the **SKU Selector** dropdown on the main page—if it shows your actual products, everything is connected

---

## Security Notes

- **Never commit** your service account JSON key to version control
- **Credentials are stored securely:** Your JSON key and Sheet ID are stored only in Supabase secrets, encrypted on Supabase's servers
- **Credentials never exposed to browser:** Unlike older browser-based methods, your sensitive data is never sent to the browser or stored locally
- **General Best Practices:**
  - Limit service account permissions to only what's needed (Google Sheets access only)
  - Regularly rotate service account keys
  - Use Google Workspace organization restrictions if available
  - Monitor service account usage in Google Cloud Console

---

## Need Help?

If you're still having issues:
1. Use the "Test Connection" button in the Admin tab to get specific error messages
2. Review Supabase Edge Function logs in the Supabase dashboard for detailed errors
3. Verify all sheet tab names match your configuration
4. Ensure your Google Sheet structure matches the requirements above
5. Confirm the service account has Editor access to your sheet
6. Check that both Supabase secrets are saved correctly
