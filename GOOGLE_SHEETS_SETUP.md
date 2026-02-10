# Google Sheets Integration Setup Guide

This guide explains how to link your Google Sheets file to the Product Entry Hub application using a secure Google Service Account connected through Supabase Edge Functions.

## Overview

Follow these steps in order:
1. **STEP 1:** Create a Google Service Account
2. **STEP 2:** Share your Google Sheet with the service account
3. **STEP 3:** Create and Deploy the Edge Function (Required for new projects)
4. **STEP 4:** Add credentials to Supabase (server-side security)
5. **STEP 5:** Activate the Google Sheets Connection (GitHub Actions)
6. **STEP 6:** Test your connection

## Table of Contents
1. [STEP 1: Create a Google Service Account](#step-1-create-a-google-service-account)
2. [STEP 2: Share Your Google Sheet](#step-2-share-your-google-sheet)
3. [STEP 3: Create and Deploy the Edge Function](#step-3-create-and-deploy-the-edge-function)
4. [STEP 4: Add Credentials to Supabase](#step-4-add-credentials-to-supabase)
5. [STEP 5: Activate the Google Sheets Connection (GitHub Actions)](#step-5-activate-the-google-sheets-connection-github-actions)
6. [STEP 6: Test Your Connection](#step-6-test-your-connection)
7. [New Project Checklist](#new-project-checklist)
8. [Sheet Structure Requirements](#sheet-structure-requirements)
9. [Configuration in Admin Panel](#configuration-in-admin-panel)
10. [Troubleshooting](#troubleshooting)

---

## STEP 1: Create a Google Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
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

## STEP 3: Create and Deploy the Edge Function

**Important:** Before you can add secrets to your Edge Function in the next step, the `google-sheets` function must first be deployed to your Supabase project. If you haven't deployed the function yet, you won't see it in the Functions list, and you won't be able to add secrets to it.

### Why this step is necessary

On a brand-new Supabase project, the Edge Functions page will only show templates and sample functions. The `google-sheets` function doesn't exist until you create and deploy it. This step ensures the function is ready to receive your secrets in Step 4.

### Choose one deployment method:

#### **Option 1: Deploy via Supabase Dashboard (Recommended for beginners)**

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and log in
2. Select your project
3. In the left sidebar, click **"Edge Functions"**
4. Click the **"Deploy a new function"** button (or **"Open Editor"** if you see that instead)
5. When prompted for a function name, enter exactly: `google-sheets`
6. Paste the Edge Function code:
   - The code is located in your repository at: `supabase/functions/google-sheets/index.ts`
   - Copy the entire contents of that file
   - Paste it into the function editor in the Supabase dashboard
7. Click **"Deploy"** or **"Save and Deploy"**
8. Wait for the deployment to complete (usually takes 10-30 seconds)
9. Confirm the function appears in your Edge Functions list

**Copy/Paste Helper:** You can find the Edge Function code at:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/blob/main/supabase/functions/google-sheets/index.ts
```

#### **Option 2: Deploy via Supabase CLI (For advanced users)**

If you're comfortable using the command line:

1. Install the Supabase CLI (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. Log in to Supabase:
   ```bash
   supabase login
   ```

3. Link to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   
   **Where to find PROJECT_REF:**
   - Go to Supabase Dashboard → Your Project → Settings → General
   - Copy the **Reference ID** (looks like: `abcdefghijklmnop`)

4. Deploy the function:
   ```bash
   supabase functions deploy google-sheets
   ```
   
5. Confirm deployment:
   - Check your Supabase Dashboard → Edge Functions
   - You should now see `google-sheets` in the list

### Verify the function is deployed

Before moving to Step 4, confirm:
- ✅ You can see `google-sheets` listed in Supabase Dashboard → Edge Functions
- ✅ The function status shows as "Active" or "Deployed"
- ✅ You can click on the function name to open its details

---

## STEP 4: Add Credentials to Supabase

Your credentials will be stored securely on Supabase's server, which is more secure than keeping them in your browser.

### What is Supabase?

Supabase is a secure backend service that hosts your application's server-side functionality. When you add secrets to Supabase, they are encrypted and stored on Supabase's servers—never exposed to the browser or to the public.

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

4. **Open the Secrets section**
   - Look for a tab or section labeled one of the following:
     - **"Secrets"**
     - **"Environment Variables"**
     - **"Settings"** (may contain a Secrets subsection)
   - Click on it to open the secrets/environment configuration

**Workaround / Manual Navigation:**
If buttons or links aren't working, manually navigate using this URL pattern:
```
https://supabase.com/dashboard/project/YOUR_PROJECT_REF/functions/google-sheets
```
Replace `YOUR_PROJECT_REF` with your actual project reference ID (found in Settings → General).

Once on the function page, look for the Secrets/Environment Variables tab in the navigation.

**Important Note:** Secrets are stored per-project and per-function. The secrets you add to the `google-sheets` function are only accessible to that specific function in that specific project.

#### Step 4.2: Add the first secret: GOOGLE_SERVICE_ACCOUNT_KEY
#### Step 4.2: Add the first secret: GOOGLE_SERVICE_ACCOUNT_KEY

   - Click **"Add secret"** or **"New secret"** button
   - **Name:** Enter exactly: `GOOGLE_SERVICE_ACCOUNT_KEY` (case-sensitive)
   - **Value:** Paste the entire JSON file contents from Step 2
     - The value should start with `{` and end with `}`
     - Copy everything—don't modify it
     - It should look something like:
       ```json
       {"type":"service_account","project_id":"your-project",...}
       ```
   - Click **"Save"** or **"Add Secret"**

#### Step 4.3: Add the second secret: GOOGLE_SHEET_ID

   - Click **"Add secret"** or **"New secret"** button again
   - **Name:** Enter exactly: `GOOGLE_SHEET_ID` (case-sensitive)
   - **Value:** Your Google Sheet ID (found in your sheet's URL)
     - Open your Google Sheet
     - Look at the URL: `https://docs.google.com/spreadsheets/d/`**XXXX-YOUR-ID**`/edit`
     - Copy only the ID part (the long string between `/d/` and `/edit`)
     - Example: `1abc2def3ghi4jkl5mno6pqr7stu8vwxyz`
   - Click **"Save"** or **"Add Secret"**

**Copy/Paste Tip:** To avoid typos, copy these secret names directly:
```
GOOGLE_SERVICE_ACCOUNT_KEY
GOOGLE_SHEET_ID
```

### Verify both secrets are saved

- You should see both `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` listed in the Secrets section
- Both should show a green checkmark indicating they're saved

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

## STEP 6: Test Your Connection

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
- [ ] GitHub secrets configured: `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` (Step 5)

### ✅ Activation & Testing Checklist
- [ ] GitHub Actions workflow "Deploy Google Sheets Connection" run successfully (Step 5)
- [ ] Workflow shows green checkmark ✓ in Actions tab
- [ ] Connection test passed in Admin panel (Step 6)
- [ ] SKU Selector shows actual products (not mock data)

### 🔍 Quick Troubleshooting
If any step fails, refer to the [Troubleshooting](#troubleshooting) section below for detailed solutions.

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
- Go back to [Step 3: Create and Deploy the Edge Function](#step-3-create-and-deploy-the-edge-function)
- Follow either the Dashboard method (Option 1) or CLI method (Option 2) to deploy the function
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

### After adding secrets, function still uses defaults

**Symptom:** I added the secrets, but the connection test still fails or uses mock data.

**Solutions:**
1. **Verify secrets are saved:**
   - Go back to the Secrets section of the `google-sheets` function
   - Confirm both `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` are listed
   - Both should show a green checkmark or "Saved" status

2. **Check secret names are exact:**
   - Secret names are case-sensitive
   - Must be exactly: `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID`
   - No extra spaces or typos

3. **Verify JSON key format:**
   - The `GOOGLE_SERVICE_ACCOUNT_KEY` value should be valid JSON
   - Should start with `{` and end with `}`
   - Copy the entire contents of your downloaded JSON key file

4. **Redeploy if needed (rare):**
   - In most cases, secrets are applied immediately
   - If problems persist after 5 minutes, try redeploying the function via GitHub Actions (Step 5)

5. **Check function logs:**
   - Go to Supabase Dashboard → Edge Functions → google-sheets → Logs
   - Look for error messages that might indicate the issue
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
