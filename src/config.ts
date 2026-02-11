// ============================================================
// Application Configuration
// All backend URLs, sheet names, and column mappings live here.
// When connecting to a Google Apps Script Web App, set
// APPS_SCRIPT_BASE_URL to your deployed web app URL.
// ============================================================

export interface SheetTabConfig {
  key: string;
  label: string;
  value: string;
}

// Default sheet tab names — all configurable in Admin
export const DEFAULT_SHEET_TABS: SheetTabConfig[] = [
  { key: "SHEET_OUTPUT", label: "OUTPUT", value: "OUTPUT" },
  { key: "SHEET_PRODUCTS", label: "PRODUCTS", value: "Products" },
  { key: "SHEET_PRODUCTS_TODO", label: "PRODUCTS TO DO", value: "PRODUCTS TO DO" },
  { key: "SHEET_TEMP", label: "TEMP", value: "TEMP" },
  { key: "SHEET_BRANDS", label: "Brands", value: "Brands" },
  { key: "SHEET_FILTER", label: "FILTER", value: "FILTER" },
  { key: "SHEET_FILTER_DEFAULTS", label: "FILTER_DEFAULTS", value: "FILTER_DEFAULTS" },
  { key: "SHEET_LEGAL", label: "LEGAL", value: "LEGAL" },
  { key: "SHEET_PROPERTIES", label: "PROPERTIES", value: "PROPERTIES" },
  { key: "SHEET_EXISTING_PRODS", label: "ExistingProds", value: "ExistingProds" },
  { key: "SHEET_NEW_NAMES", label: "NewNames", value: "NewNames" },
  { key: "SHEET_UPLOAD", label: "UPLOAD", value: "UPLOAD" },
  { key: "SHEET_CATEGORIES", label: "CATEGORIES", value: "Categories" },
];

// Stored config — persisted in localStorage for now, can be moved to backend
function loadStoredConfig(): Record<string, string> {
  try {
    const stored = localStorage.getItem("app_config");
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveStoredConfig(cfg: Record<string, string>) {
  localStorage.setItem("app_config", JSON.stringify(cfg));
}

export function getConfigValue(key: string, defaultValue: string): string {
  const stored = loadStoredConfig();
  return stored[key] ?? defaultValue;
}

export function setConfigValue(key: string, value: string) {
  const stored = loadStoredConfig();
  stored[key] = value;
  saveStoredConfig(stored);
}

export function getSheetTabName(key: string): string {
  const tab = DEFAULT_SHEET_TABS.find((t) => t.key === key);
  return getConfigValue(key, tab?.value ?? key);
}

export function setSheetTabName(key: string, value: string) {
  setConfigValue(key, value);
}

export const config = {
  // ── Backend URL ──────────────────────────────────────────
  get APPS_SCRIPT_BASE_URL() {
    return getConfigValue("APPS_SCRIPT_BASE_URL", "");
  },

  // ── Sheet / Tab Names (all configurable) ─────────────────
  get SHEET_OUTPUT() { return getSheetTabName("SHEET_OUTPUT"); },
  get SHEET_PRODUCTS_TODO() { return getSheetTabName("SHEET_PRODUCTS_TODO"); },
  get SHEET_CATEGORIES() { return getSheetTabName("SHEET_CATEGORIES"); },
  get SHEET_BRANDS() { return getSheetTabName("SHEET_BRANDS"); },
  get SHEET_FILTER() { return getSheetTabName("SHEET_FILTER"); },
  get SHEET_FILTER_DEFAULTS() { return getSheetTabName("SHEET_FILTER_DEFAULTS"); },
  get SHEET_LEGAL() { return getSheetTabName("SHEET_LEGAL"); },
  get SHEET_PROPERTIES() { return getSheetTabName("SHEET_PROPERTIES"); },
  get SHEET_TEMP() { return getSheetTabName("SHEET_TEMP"); },
  get SHEET_PRODUCTS() { return getSheetTabName("SHEET_PRODUCTS"); },
  get SHEET_EXISTING_PRODS() { return getSheetTabName("SHEET_EXISTING_PRODS"); },
  get SHEET_NEW_NAMES() { return getSheetTabName("SHEET_NEW_NAMES"); },
  get SHEET_UPLOAD() { return getSheetTabName("SHEET_UPLOAD"); },

  // ── Column Mappings (0-indexed) ──────────────────────────
  PRODUCTS_COL_SKU: 0,        // Column A
  PRODUCTS_COL_BRAND: 1,      // Column B
  PRODUCTS_COL_STATUS: 2,     // Column C
  PRODUCTS_COL_VISIBILITY: 3, // Column D

  // Categories
  CATEGORIES_COL_PATH: 6,     // Column G

  // ── Visibility Config ────────────────────────────────────
  get VISIBILITY_SHEET_NAME() { return getSheetTabName("SHEET_PRODUCTS_TODO"); },
  VISIBILITY_COLUMN: "visibility",
  VISIBLE_VALUE: "1",
  HIDDEN_VALUE: "0",

  // ── Status Values ────────────────────────────────────────
  STATUS_READY: "READY",
  STATUS_COMPLETE: "COMPLETE",
  STATUS_DEAD: "DEAD",

  // ── PDF Instructions ─────────────────────────────────────
  get INSTRUCTIONS_PDF_URL() {
    return getConfigValue("INSTRUCTIONS_PDF_URL", "/chatgpt-product-instructions.pdf");
  },

  // ── Google Drive CSV Folder ──────────────────────────────
  get DRIVE_CSV_FOLDER_ID() {
    return getConfigValue("DRIVE_CSV_FOLDER_ID", "");
  },

  // ── Supabase Google Sheets Configuration ─────────────────
  // NOTE: GOOGLE_SERVICE_ACCOUNT_KEY and GOOGLE_SHEET_ID are stored ONLY as Supabase secrets
  // They are NOT stored in browser localStorage for security reasons
  // The edge function uses Deno.env to access these secrets server-side
} as const;

export type AppConfig = typeof config;
