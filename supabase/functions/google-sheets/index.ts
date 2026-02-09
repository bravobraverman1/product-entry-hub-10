import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Sheet name constants — change these if your tabs are renamed
const SHEET_PRODUCTS = "PRODUCTS TO DO";
const SHEET_INPUT = "INPUT";
const SHEET_CATEGORIES = "README-ERAN";

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
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    const sheetId = Deno.env.get("GOOGLE_SHEET_ID");

    if (!serviceAccountKey || !sheetId) {
      console.log("Google Sheets credentials not configured, using defaults");
      return new Response(
        JSON.stringify({ useDefaults: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { action } = body;
    const keyData = JSON.parse(serviceAccountKey);
    const accessToken = await getAccessToken(keyData);

    if (action === "readAll") {
      const result = await readAllData(accessToken, sheetId);
      return jsonResponse(result);
    }

    if (action === "writeSubmission") {
      await writeSubmission(accessToken, sheetId, body);
      return jsonResponse({ success: true });
    }

    if (action === "setVisibility") {
      const { sku, visible } = body;
      await setSkuVisibility(accessToken, sheetId, sku, visible);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);
  } catch (error) {
    console.error("Edge function error:", error);
    return jsonResponse({ error: error.message, useDefaults: true }, 500);
  }
});

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Read all data ──────────────────────────────────────────────

async function readAllData(token: string, sheetId: string) {
  const [productsRaw, categoriesRaw, masterFilterRaw] = await Promise.all([
    getSheetValues(token, sheetId, `'${SHEET_PRODUCTS}'!A:D`),
    getSheetValues(token, sheetId, `'${SHEET_CATEGORIES}'!G:G`),
    getSheetValues(token, sheetId, `'${SHEET_INPUT}'!C39:C77`),
  ]);

  // Parse products: A=SKU, B=?, C=Status, D=Visibility
  const products = productsRaw.slice(1).map((row) => ({
    sku: row[0] ?? "",
    status: row[2] ?? "",
    visibility: parseInt(row[3] ?? "0", 10) || 0,
  })).filter((p) => p.sku);

  // Parse category paths from column G
  const categoryPaths = categoriesRaw.slice(1).map((r) => r[0]).filter(Boolean);
  const categories = buildCategoryTree(categoryPaths);

  // Parse master filter labels (row 39-77, non-empty only)
  const masterFilterLabels: { label: string; row: number }[] = [];
  masterFilterRaw.forEach((row, i) => {
    const label = row[0]?.trim();
    if (label) {
      masterFilterLabels.push({ label, row: 39 + i });
    }
  });

  return { products, categories, masterFilterLabels };
}

// ── Write submission to INPUT sheet ───────────────────────────

async function writeSubmission(
  token: string,
  sheetId: string,
  body: {
    sku: string;
    chatgptData: string;
    categories: string;
    title: string;
    description: string;
    imageUrls: string[];
    masterFilterValues?: { row: number; value: string }[];
  }
) {
  const data: { range: string; values: string[][] }[] = [
    { range: `'${SHEET_INPUT}'!B2`, values: [[body.sku]] },
    { range: `'${SHEET_INPUT}'!B4`, values: [[body.chatgptData]] },
    { range: `'${SHEET_INPUT}'!B5`, values: [[body.categories]] },
    { range: `'${SHEET_INPUT}'!B6`, values: [[body.title]] },
    { range: `'${SHEET_INPUT}'!B7`, values: [[body.description]] },
  ];

  // Images B8:B15 (pad to 8)
  const imgs = [...(body.imageUrls || [])];
  while (imgs.length < 8) imgs.push("");
  const imageValues = imgs.map((u) => [u]);
  data.push({ range: `'${SHEET_INPUT}'!B8:B15`, values: imageValues });

  // Master filter values
  if (body.masterFilterValues) {
    for (const mf of body.masterFilterValues) {
      data.push({
        range: `'${SHEET_INPUT}'!D${mf.row}`,
        values: [[mf.value]],
      });
    }
  }

  await batchUpdate(token, sheetId, data);
  console.log("Submission written successfully");
}

// ── Set SKU visibility ────────────────────────────────────────

async function setSkuVisibility(
  token: string,
  sheetId: string,
  sku: string,
  visible: number
) {
  // Find the row of the SKU
  const rows = await getSheetValues(token, sheetId, `'${SHEET_PRODUCTS}'!A:A`);
  let targetRow = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0]?.trim() === sku.trim()) {
      targetRow = i + 1; // 1-indexed
      break;
    }
  }
  if (targetRow === -1) throw new Error(`SKU "${sku}" not found`);

  await updateCell(token, sheetId, `'${SHEET_PRODUCTS}'!D${targetRow}`, String(visible));
  console.log(`Visibility for ${sku} set to ${visible}`);
}

// ── Google Auth helpers ───────────────────────────────────────

async function getAccessToken(keyData: { client_email: string; private_key: string }): Promise<string> {
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
  const signature = await signData(key, signatureInput);
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

async function signData(key: CryptoKey, data: string): Promise<string> {
  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── Sheets API helpers ────────────────────────────────────────

async function getSheetValues(token: string, sheetId: string, range: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const errText = await res.text();
    console.error(`Sheets API error for range ${range}:`, errText);
    return [];
  }
  const data = await res.json();
  return data.values ?? [];
}

async function updateCell(token: string, sheetId: string, range: string, value: string) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ values: [[value]] }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to update ${range}: ${errText}`);
  }
}

async function batchUpdate(
  token: string,
  sheetId: string,
  data: { range: string; values: string[][] }[]
) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values:batchUpdate`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ valueInputOption: "USER_ENTERED", data }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Batch update failed: ${errText}`);
  }
}

// ── Category tree builder ─────────────────────────────────────

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
        if (i < parts.length - 1) existing.children = [];
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
