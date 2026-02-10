# Google Sheets Integration Setup Guide

This guide explains how to link your Google Sheets file to the Product Entry Hub application using the **Google Service Account** method with Supabase Edge Functions.

## Overview

Follow these steps in order:
1. **STEP 1:** Create a Google Service Account
2. **STEP 2:** Share your Google Sheet with the service account
3. **STEP 3:** Configure credentials (Browser or Server)
4. **STEP 4:** Deploy the Edge Function (Server-side only)
5. **STEP 5:** Activate the Google Sheets Connection (GitHub Actions)

## Table of Contents
1. [STEP 1: Create a Google Service Account](#step-1-create-a-google-service-account)
2. [STEP 2: Share Your Google Sheet](#step-2-share-your-google-sheet)
3. [STEP 3: Configure Your Credentials](#step-3-configure-your-credentials)
4. [STEP 4: Deploy the Edge Function](#step-4-deploy-the-edge-function)
5. [STEP 5: Activate the Google Sheets Connection (GitHub Actions)](#step-5-activate-the-google-sheets-connection-github-actions)
6. [Sheet Structure Requirements](#sheet-structure-requirements)
7. [Configuration in Admin Panel](#configuration-in-admin-panel)
8. [Troubleshooting](#troubleshooting)

---

## STEP 1: Create a Google Service Account

### Navigate to Google Cloud Console

1. Visit https://console.cloud.google.com/
2. At the top, you'll see a dropdown showing your current project
3. Click that dropdown and select **"Select a Project"**
4. Click **"NEW PROJECT"** button
5. Enter a project name (e.g., "Product Entry Hub")
6. Click **"CREATE"**
7. Wait for the project to be created (usually takes 10-20 seconds)
8. Once created, the new project will be selected automatically

### Create a Service Account

1. On the left sidebar, look for the menu icon (☰)
2. Click it to expand the menu if needed
3. Look for **"IAM & Admin"** → click it
4. Click on **"Service Accounts"** in the submenu
5. Click **"+ CREATE SERVICE ACCOUNT"** button at the top
6. Fill in:
   - **Service account name:** `product-entry-hub-sheets`
   - Leave other fields as default
7. Click **"CREATE AND CONTINUE"** button
8. On the permissions screen, click **"CONTINUE"** (skip the role for now)
9. On the final screen, click **"DONE"**

### Download the Key File

1. You should now see your service account listed
2. Click on the service account name you just created
3. Go to the **"Keys"** tab at the top
4. Click **"ADD KEY"** → **"Create new key"**
5. A dialog will appear - select **"JSON"** format
6. Click **"CREATE"**
7. A JSON file will automatically download to your computer
8. **⚠️ Keep this file secure - never share it or commit it to version control**

---

## STEP 2: Share Your Google Sheet

### Get the Service Account Email

1. Open the JSON file you downloaded in a text editor
2. Look for the line that says `"client_email": "`
3. Copy the email address (looks like: `your-service@your-project.iam.gserviceaccount.com`)
4. Keep this copied

### Share Your Google Sheet

1. Open your Google Sheet in your browser
2. Click the **"Share"** button in the top-right corner
3. A dialog will appear
4. Paste the service account email you copied into the text field
5. Make sure the permission is set to **"Editor"**
6. Uncheck **"Notify people"** (optional)
7. Click **"Share"**

You've now given the service account permission to access your sheet!

---

## STEP 3: Configure Your Credentials

You have two options for configuring your Google Service Account credentials:

#### **Option A: Browser-Based Configuration (Recommended for Getting Started)**

This is the easiest way to get started. You can configure everything directly in the Admin tab of your application.

#### **Option B: Server-Side Configuration (Recommended for Production)**

For production environments or enhanced security, you can configure credentials server-side through Supabase:

### Navigate to Supabase Secrets

1. Visit https://supabase.com/dashboard
2. Click on your project name in the list
3. You'll see the project dashboard
4. On the left sidebar, click the menu icon (☰) if collapsed
5. Scroll down and find **"Edge Functions"** in the sidebar
6. Click **"Edge Functions"**
7. You'll see the **"google-sheets"** function listed
8. Click on it to open it
9. At the top, click the **"Secrets"** tab
10. Click **"New secret"** button

### Add the Secrets

You'll now add two secrets in order:

**Secret 1: GOOGLE_SERVICE_ACCOUNT_KEY**
1. In the "Name" field, type: `GOOGLE_SERVICE_ACCOUNT_KEY`
2. In the "Value" field, paste the **entire contents** of the JSON file you downloaded
3. Click **"Add secret"**

**Secret 2: GOOGLE_SHEET_ID**
1. Click **"New secret"** again
2. In the "Name" field, type: `GOOGLE_SHEET_ID`
3. In the "Value" field, paste your Google Sheet ID
   - To find it: Open your Google Sheet URL
   - Look for the part between `/d/` and `/edit`
   - Example: In `https://docs.google.com/spreadsheets/d/1abc123xyz/edit`, the ID is `1abc123xyz`
4. Click **"Add secret"**

---

## STEP 4: Deploy the Edge Function

**Skip this step if you're using Option A (Browser-Based Configuration above).**

The Edge Function in your repository at `supabase/functions/google-sheets/index.ts` handles the server-side connection to Google Sheets.

The Edge Function is already in your repository at `supabase/functions/google-sheets/index.ts`.

**This step will be activated via GitHub Actions in STEP 5 below.** No CLI commands are needed.

---

## STEP 5: Activate the Google Sheets Connection (GitHub Actions)

### What this step does

This step activates your pre-built Google Sheets connection configuration. You are not creating or editing any code—this is done by clicking a button in GitHub to run an automated workflow.

The workflow will:
- Automatically deploy your Edge Function to Supabase
- Securely activate your Google Sheets connection
- No software installation required
- No terminal access needed

### One-time setup (already done for you)

The project already includes an activation workflow in your GitHub repository. This workflow safely handles:
- Automatic Edge Function deployment
- Secure credential handling
- Connection verification

No credentials are exposed during this process.

### How to activate (click-only steps)

#### **Step 1: Open GitHub Repository**

1. Visit: `https://github.com/{{OWNER}}/{{REPO}}`
2. You should now see the repository main page
3. Look at the top navigation - you'll see several tabs: **Code**, **Issues**, **Pull requests**, etc.

#### **Step 2: Go to Actions Tab**

1. Click the **"Actions"** tab in the top navigation
2. You'll see a list of available workflows on the left side

#### **Step 3: Select the Deployment Workflow**

1. In the left sidebar, find and click **"Deploy Google Sheets Connection"**
2. This shows the workflow details

#### **Step 4: Run the Workflow**

1. On the right side, click the **"Run workflow"** button
2. A dropdown will appear
3. Leave the settings as default (or select "production" from the environment dropdown)
4. Click **"Run workflow"** to confirm

#### **Step 5: Wait for Completion**

1. The workflow will start running
2. You'll see it in the list with a yellow circle (🟡 running)
3. Wait 2-3 minutes for it to complete
4. When done, you'll see a green checkmark (✓) - this means success!

### How to confirm

Return to this application and click "**Test Connection**" in the Admin panel to verify your setup is complete.

1. Navigate to the **Admin** page in your application
2. Scroll to the **Google Sheets Connection** section
3. Click "**Test Connection**" button
4. If successful, you'll see a confirmation message
5. If you see actual SKU data (not mock data), the connection is working!

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

### Configuration in Admin Panel

The Admin panel provides configuration options for your application:

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
