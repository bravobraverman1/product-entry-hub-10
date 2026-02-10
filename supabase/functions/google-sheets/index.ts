import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
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

    const { action, serviceAccountKey: requestServiceAccountKey, sheetId: requestSheetId } = body;

    // Check for credentials in request body first, then environment
    const serviceAccountKey = requestServiceAccountKey || Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const sheetId = requestSheetId || Deno.env.get("GOOGLE_SHEET_ID");

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
      const result = await readAllSheets(accessToken, sheetId);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "write") {
      const { rowData } = body;
      await appendRow(accessToken, sheetId, "RESPONSES", rowData);
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
      JSON.stringify({ error: error.message, useDefaults: true }),
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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(sheet)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [rowData] }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to append row: ${errText}`);
  }

  console.log("Row appended successfully");
}

async function readAllSheets(token: string, sheetId: string) {
  // Read all tabs in parallel
  const [productsRaw, categoriesRaw, propertiesRaw, legalRaw] = await Promise.all([
    getSheetValues(token, sheetId, "PRODUCTS!A:C"),
    getSheetValues(token, sheetId, "CATEGORIES!A:A"),
    getSheetValues(token, sheetId, "PROPERTIES!A:D"),
    getSheetValues(token, sheetId, "LEGAL!A:B"),
  ]);

  // Parse PRODUCTS: SKU, Brand, ExampleTitle (skip header row)
  const products = productsRaw.slice(1).map((row) => ({
    sku: row[0] ?? "",
    brand: row[1] ?? "",
    exampleTitle: row[2] ?? "",
  })).filter((p) => p.sku);

  // Parse CATEGORIES: full path strings -> build tree
  // STRICT: Read ONLY from CATEGORIES tab, skip header row (row 1), data starts at row 2
  const categoryPaths = categoriesRaw.slice(1).map((row) => {
    const path = row[0] ?? "";
    // Trim whitespace from the entire path and from each segment
    return path.trim();
  }).filter((p) => p.length > 0);
  
  // Fail loudly if no categories found
  if (categoryPaths.length === 0) {
    console.error("ERROR: CATEGORIES tab is empty or missing data. Expected at least one category path in column A, row 2+");
    throw new Error("CATEGORIES tab has no data. Add category paths to the CATEGORIES sheet starting at row 2 (e.g., 'Indoor Lights/Wall Lights')");
  }
  
  const categories = buildCategoryTree(categoryPaths);
  
  // Count actual leaf paths (not tree nodes) for logging
  const leafPathCount = categoryPaths.length;
  console.log(`Successfully read ${leafPathCount} category paths from CATEGORIES tab`);

  // Parse PROPERTIES: PropertyName, Key, InputType, Section
  const properties = propertiesRaw.slice(1).map((row) => ({
    name: row[0] ?? "",
    key: row[1] ?? "",
    inputType: (row[2] ?? "text") as "dropdown" | "text" | "number" | "boolean",
    section: row[3] ?? "Other",
  })).filter((p) => p.name && p.key);

  // Parse LEGAL: PropertyName, AllowedValue
  const legalValues = legalRaw.slice(1).map((row) => ({
    propertyName: row[0] ?? "",
    allowedValue: row[1] ?? "",
  })).filter((l) => l.propertyName && l.allowedValue);

  return { products, categories, properties, legalValues, categoryPathCount: leafPathCount };
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
