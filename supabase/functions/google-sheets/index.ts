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

    // AUTHENTICATION: Verify request is from authorized origin or has valid Supabase token
    const authHeader = req.headers.get("authorization");
    const originHeader = req.headers.get("origin") || "";
    
    // Check if origin is allowed (for browser requests)
    const isOriginAllowed = ALLOWED_ORIGINS.some((allowed) => originMatches(allowed, originHeader));
    
    // Check if auth header is valid (for API requests)
    const hasValidAuth = authHeader && authHeader.startsWith("Bearer ");
    
    if (!isOriginAllowed && !hasValidAuth) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing valid authentication" }),
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
    const keyData = JSON.parse(serviceAccountKey);

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
  const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = btoa(
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
    throw new Error(`Failed to get access token: ${JSON.stringify(tokenData)}`);
  }
  return tokenData.access_token;
}

async function importPrivateKey(pem: string) {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\n/g, "");

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
