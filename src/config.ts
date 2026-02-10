// ============================================================
// Application Configuration
// All backend URLs, sheet names, and column mappings live here.
// When connecting to a Google Apps Script Web App, set
// APPS_SCRIPT_BASE_URL to your deployed web app URL.
// ============================================================

export const config = {
  // ── Backend URL ──────────────────────────────────────────
  // Set to your deployed Google Apps Script Web App URL.
  // Leave empty to use local mock/fallback data.
  APPS_SCRIPT_BASE_URL: "",

  // ── Sheet / Tab Names ────────────────────────────────────
  SHEET_OUTPUT: "OUTPUT",
  SHEET_PRODUCTS_TODO: "PRODUCTS TO DO",
  SHEET_CATEGORIES: "Categories",
  SHEET_BRANDS: "BRANDS",
  SHEET_FILTERS: "FILTER",

  // ── Column Mappings (0-indexed) ──────────────────────────
  // PRODUCTS TO DO
  PRODUCTS_COL_SKU: 0,        // Column A
  PRODUCTS_COL_BRAND: 1,      // Column B
  PRODUCTS_COL_STATUS: 2,     // Column C  (READY, COMPLETE, DEAD…)

  // Categories
  CATEGORIES_COL_PATH: 6,     // Column G

  // ── Visibility Config ────────────────────────────────────
  VISIBILITY_SHEET_NAME: "PRODUCTS TO DO",
  VISIBILITY_COLUMN: "visibility",
  VISIBLE_VALUE: "1",
  HIDDEN_VALUE: "0",

  // ── Status Values ────────────────────────────────────────
  STATUS_READY: "READY",
  STATUS_COMPLETE: "COMPLETE",
  STATUS_DEAD: "DEAD",

  // ── Filter settings (future wiring) ──────────────────────
  FILTERS_TAB_NAME: "FILTER",
} as const;

export type AppConfig = typeof config;
