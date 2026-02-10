# Google Sheets Integration Setup Guide

This guide explains how to link your Google Sheets file to the Product Entry Hub application. The application supports two integration methods: **Google Service Account (Recommended)** or **Google Apps Script**.

## Quick Start (New!)

**The easiest way to get started is now through the Admin tab!** 

1. Create a Google Service Account (see Method 1, Steps 1-3 below)
2. Open your app's **Admin** tab
3. Paste your Service Account JSON key and Sheet ID
4. Click "Test Connection" → "Save"
5. Done! Your sheet is now connected.

For detailed instructions, see [Method 1: Google Service Account](#method-1-google-service-account-recommended) below.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Method 1: Google Service Account (Recommended)](#method-1-google-service-account-recommended)
3. [Method 2: Google Apps Script (Alternative)](#method-2-google-apps-script-alternative)
4. [Sheet Structure Requirements](#sheet-structure-requirements)
5. [Configuration in Admin Panel](#configuration-in-admin-panel)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- A Google Sheets spreadsheet with the required tabs (see [Sheet Structure Requirements](#sheet-structure-requirements))
- **For Method 1 (Browser-Based):** Just a web browser - no Supabase access required!
- **For Method 1 (Server-Side):** Access to Supabase project console for advanced configuration
- **For Method 2:** Ability to deploy Google Apps Script

---

## Method 1: Google Service Account (Recommended)

This method uses a Google Service Account to securely access your Google Sheets through the Supabase Edge Function.

### Step 1: Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **IAM & Admin** → **Service Accounts**
4. Click **Create Service Account**
5. Enter a name (e.g., "product-entry-hub-sheets-access")
6. Click **Create and Continue**
7. Grant the service account the **Editor** role (or more restrictive if preferred)
8. Click **Done**

### Step 2: Generate Service Account Key

1. Click on the newly created service account
2. Go to the **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** format
5. Click **Create** - this downloads a JSON file to your computer
6. **Keep this file secure** - it contains credentials to access your Google account

### Step 3: Share Your Google Sheet with the Service Account

1. Open the JSON key file you downloaded
2. Find the `client_email` field (looks like: `your-service-account@your-project.iam.gserviceaccount.com`)
3. Open your Google Sheet
4. Click **Share** button
5. Add the service account email as an **Editor**
6. Click **Share**

### Step 4: Configure Your Credentials

You have two options for configuring your Google Service Account credentials:

#### **Option A: Browser-Based Configuration (Recommended for Getting Started)**

This is the easiest way to get started. You can configure everything directly in the Admin tab of your application.

1. Open your application and navigate to the **Admin** tab
2. In the **Google Sheets Connection** section, find **Method 1: Google Service Account**
3. Paste your Service Account credentials:
   - **Google Service Account Key (JSON)**: Copy and paste the **entire contents** of the JSON key file you downloaded in Step 2
   - **Google Sheet ID**: Enter your Google Sheet ID (the long string in your sheet URL between `/d/` and `/edit`)
     - Example: In `https://docs.google.com/spreadsheets/d/1abc123xyz/edit`, the ID is `1abc123xyz`
4. Click **Test Connection** to verify your credentials work correctly
5. Click **Save Connection Settings**

**Note:** Your credentials are stored in your browser's localStorage. Only use this method on trusted devices. For production deployments, consider Option B below.

#### **Option B: Server-Side Configuration (Recommended for Production)**

For production environments or enhanced security, you can configure credentials server-side through Supabase:

1. Open your Supabase project dashboard
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add two secrets:

   **Secret Name:** `GOOGLE_SERVICE_ACCOUNT_KEY`  
   **Secret Value:** Copy the entire contents of the JSON key file you downloaded

   **Secret Name:** `GOOGLE_SHEET_ID`  
   **Secret Value:** Your Google Sheet ID (the long string in your sheet URL between `/d/` and `/edit`)

4. Save both secrets
5. Deploy the Edge Function (see Step 5 below)

### Step 5: Deploy the Edge Function (Option B Only)

**Note:** If you're using Option A (Browser-Based Configuration), the Edge Function is already deployed and you can skip this step.

If you're using Option B (Server-Side Configuration), deploy the Edge Function:

The Edge Function is already in your repository at `supabase/functions/google-sheets/index.ts`.

```bash
# Install Supabase CLI if you haven't already
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy the function
supabase functions deploy google-sheets
```

### Step 6: Verify the Connection

1. Navigate to the main page of your application
2. Click on the **SKU Selector** dropdown
3. If you see your actual SKU data (not mock data starting with "LED-"), the connection is working!
4. Try selecting a SKU and filling out a product form to verify full functionality
5. Check your OUTPUT sheet tab to confirm data is being written correctly

---

## Method 2: Google Apps Script (Alternative)

If you prefer not to use Supabase Edge Functions, you can create a Google Apps Script Web App instead.

### Step 1: Create Apps Script Project

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete any existing code in the editor
4. Copy the Apps Script code from your project documentation or create endpoints that match the API structure
5. Save the project with a name like "Product Entry Hub API"

### Step 2: Deploy as Web App

1. In the Apps Script editor, click **Deploy** → **New deployment**
2. Click the gear icon next to "Select type" and choose **Web app**
3. Configure:
   - **Description:** Product Entry Hub API
   - **Execute as:** Me
   - **Who has access:** Anyone (or your organization if using Google Workspace)
4. Click **Deploy**
5. Copy the **Web app URL** (it will look like: `https://script.google.com/macros/s/ABC123.../exec`)

### Step 3: Configure in Admin Panel

1. Open your Product Entry Hub application
2. Navigate to the **Admin** page
3. Find the **Connection Settings** section
4. Paste your Web App URL into the **Apps Script Web App URL** field
5. Click **Save Connection Settings**
6. **Reload the page** for changes to take effect

### Step 4: Implement Required Endpoints

Your Apps Script needs to handle these endpoints:

- `GET /skus?status=READY` - Returns list of products
- `GET /brand?sku=XXX` - Returns brand for a SKU
- `GET /categories` - Returns category tree
- `POST /categories/update` - Updates categories
- `GET /properties` - Returns property definitions and legal values
- `POST /legal/add` - Adds a new legal value
- `POST /submitProduct` - Submits a completed product
- `GET /recentSubmissions` - Returns recent submissions
- `GET /brands` - Returns brand list
- `POST /brands/update` - Updates brands
- `GET /filters` - Returns filter rules

---

## Sheet Structure Requirements

Your Google Sheet must contain the following tabs with the specified structure:

### 1. PRODUCTS TO DO (or your configured name)

Contains products to be processed.

| Column | Field | Description |
|--------|-------|-------------|
| A | SKU | Product SKU |
| B | Brand | Product brand |
| C | Status | READY, COMPLETE, or DEAD |
| D | Visibility | 1 (visible) or 0 (hidden) |

### 2. Categories (or your configured name)

Contains category hierarchy as full paths.

| Column | Field | Description |
|--------|-------|-------------|
| A | Path | Full category path (e.g., "Indoor Lights/Ceiling Lights/Downlights") |

### 3. BRANDS (or your configured name)

Contains brand and supplier information.

| Column | Field | Description |
|--------|-------|-------------|
| A | Brand | Brand name |
| B | Supplier | Supplier name |

### 4. PROPERTIES (or your configured name)

Defines custom properties/fields for products.

| Column | Field | Description |
|--------|-------|-------------|
| A | PropertyName | Display name of the property |
| B | Key | Internal key/identifier |
| C | InputType | text, dropdown, number, or boolean |
| D | Section | Grouping section name |

### 5. LEGAL (or your configured name)

Defines allowed values for dropdown properties.

| Column | Field | Description |
|--------|-------|-------------|
| A | PropertyName | Must match a property from PROPERTIES sheet |
| B | AllowedValue | A valid option for this dropdown |

### 6. OUTPUT (or your configured name)

Where completed product data is written. Structure should match your business requirements.

### 7. FILTER (or your configured name)

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

**Method 1: Google Service Account** (Browser-Based)
- Paste your Service Account JSON key directly in the browser
- Enter your Google Sheet ID
- Test the connection before saving
- Credentials stored in browser localStorage

**Method 2: Google Apps Script** (Alternative)
- Configure your Apps Script Web App URL
- Useful if you prefer not to use Supabase Edge Functions

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

### Data Not Loading

**Symptom:** Application shows mock data instead of your Google Sheets data

**Solutions:**
- **For Browser-Based Configuration:**
  - Navigate to Admin tab and verify your credentials are saved
  - Click "Test Connection" to check if credentials are valid
  - Check browser console for error messages (press F12)
  - Verify the JSON key is complete (starts with `{` and ends with `}`)
  - Ensure the Sheet ID is correct (no extra spaces or characters)
- **For Server-Side Configuration:**
  - Verify service account email is shared with Editor access on your sheet
  - Check that `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` are correctly set in Supabase dashboard
  - Confirm the Edge Function is deployed: check Supabase Functions dashboard
  - Look for errors in Supabase Function logs
- **For Both:**
  - Verify service account email has Editor access to your Google Sheet
  - Check that Google Sheets API is enabled in your Google Cloud project

### Permission Errors

**Symptom:** "Access denied" or "Permission denied" errors

**Solutions:**
- Ensure the service account has Editor access to the sheet
- Verify the service account JSON key is correctly copied into Supabase secrets
- Check that Google Sheets API is enabled in your Google Cloud project

### Sheet Structure Errors

**Symptom:** Data loads but is incomplete or incorrectly formatted

**Solutions:**
- Verify your sheet tabs match the names configured in Admin panel
- Check that column orders match the requirements above
- Ensure header rows are present and data starts from row 2

### Apps Script Web App Issues (Method 2)

**Symptom:** API calls fail or return errors

**Solutions:**
- Verify the Web App is deployed with "Execute as: Me" 
- Check access is set correctly (Anyone or your organization)
- Test the Web App URL directly in a browser
- Review Apps Script execution logs for errors

### Configuration Not Saving

**Symptom:** Changes in Admin panel don't persist

**Solutions:**
- **Browser-Based Configuration:** Credentials are stored in browser localStorage
  - Clearing browser data will reset your saved credentials
  - Try using the same browser consistently
  - Configuration should take effect immediately without page reload
  - Check browser console (F12) for any error messages
- **Server-Side Configuration:** Changes to Supabase secrets require Edge Function redeployment
  - Redeploy the Edge Function after changing secrets
  - Check Supabase dashboard to confirm secrets are saved

---

## Testing Your Setup

1. Navigate to the main page of the application
2. Click on **SKU Selector** dropdown
3. If you see your actual SKU data (not mock data), the connection is working
4. Try submitting a product to verify write access
5. Check your OUTPUT sheet tab to confirm data was written

---

## Security Notes

- **Never commit** your service account JSON key to version control
- **Browser-Based Configuration:** 
  - Credentials stored in browser localStorage are accessible to any script running on the page
  - Only use on trusted devices
  - Consider server-side configuration for production environments
  - Clear credentials from localStorage when done using shared computers
- **Server-Side Configuration:**
  - Store credentials only in Supabase secrets or as Apps Script properties
  - Credentials never exposed to the browser
  - Recommended for production deployments
- **General Best Practices:**
  - Limit service account permissions to only what's needed (Google Sheets access only)
  - Regularly rotate service account keys
  - Use Google Workspace organization restrictions if available
  - Monitor service account usage in Google Cloud Console

---

## Need Help?

If you're still having issues:
1. Use the "Test Connection" button in the Admin tab to diagnose issues
2. Check the browser console (F12) for JavaScript errors
3. Review Supabase Edge Function logs in the Supabase dashboard (if using server-side config)
4. Verify all sheet tab names match your configuration
5. Ensure your Google Sheet structure matches the requirements above
6. Confirm the service account has Editor access to your sheet
