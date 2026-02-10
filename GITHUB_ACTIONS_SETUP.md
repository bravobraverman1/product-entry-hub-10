# GitHub Actions Setup for Google Sheets Connection

## Overview

This document explains how to set up GitHub Actions to automatically activate your Google Sheets connection. This eliminates the need for local CLI installation and provides a simple, click-only activation process.

## What is GitHub Actions?

GitHub Actions is a free CI/CD platform built into GitHub that allows you to automate tasks. In this case, we're using it to automatically deploy the Google Sheets Edge Function to your Supabase project.

**Benefits:**
- ✓ No local software installation required
- ✓ No terminal commands needed
- ✓ Secure handling of credentials
- ✓ Automatic deployment and verification
- ✓ One-time setup, then just click-to-deploy

## Prerequisites

Before running the workflow, you need:

1. A GitHub repository for your project
2. A Supabase project set up
3. Three pieces of information from Supabase (see below)

## Step 1: Gather Your Supabase Information

You'll need three pieces of information from Supabase:

### Get Your Supabase Access Token (Navigate from Front Page)

1. Visit https://supabase.com/dashboard
2. You'll see the main Supabase dashboard with your projects listed
3. Look at the top-right corner - you'll see your profile icon
4. Click on your profile icon → look for **"Account Settings"** or **"Preferences"**
5. In the left sidebar, click **"Access Tokens"**
6. Click **"Generate new token"** button
7. A dialog will appear:
   - **Token name:** Type "Product Entry Hub"
   - Leave other settings as default
8. Click **"Generate"**
9. The token will appear (starts with `sbp_`)
10. **Copy this token** and save it temporarily
11. ⚠️ You won't see it again, so keep it safe!

### Get Your Supabase Project Reference (Navigate from Front Page)

1. Visit https://supabase.com/dashboard
2. You'll see your projects listed
3. Click on the project you want to use
4. Once inside the project, look at the top-left
5. Click on the **project name** dropdown
6. In the dropdown, you'll see **"Project Settings"** option
7. Click **"Project Settings"**
8. You'll see several tabs at the top - look for **"General"**
9. Click the **"General"** tab
10. Scroll down to find **"Reference ID"** (looks like: `abcdefghijklmnop`)
11. **Copy this value**

### Get Your Database Password (Navigate from Front Page)

1. Visit https://supabase.com/dashboard
2. Click on your project to open it
3. Click on **"Project Settings"** (see steps above)
4. In the sidebar on the left, click **"Database"**
5. Look for the section labeled **"Database password"**
6. Click **"Reset password"** button
7. Confirm the action when prompted
8. A new password will be generated and displayed
9. **Copy this password** immediately

## Step 2: Add GitHub Secrets (Navigate from Front Page)

Now you'll add these three pieces of information as GitHub Secrets.

1. Visit https://github.com and log in
2. Navigate to your repository (or type the URL: `github.com/YOUR_USERNAME/product-entry-hub-10`)
3. At the top of the repository, you'll see several tabs: **Code**, **Issues**, **Pull requests**, etc.
4. Click the **Settings** tab on the far right
5. In the left sidebar, look for **"Security"** section
6. Click **"Secrets and variables"** → **"Actions"**
7. You'll see a blue button **"New repository secret"**

### Add Secret 1: SUPABASE_ACCESS_TOKEN

1. Click **"New repository secret"**
2. In the **"Name"** field, type: `SUPABASE_ACCESS_TOKEN`
3. In the **"Secret"** field, paste the token you copied (starts with `sbp_`)
4. Click **"Add secret"**

### Add Secret 2: SUPABASE_PROJECT_REF

1. Click **"New repository secret"** again
2. In the **"Name"** field, type: `SUPABASE_PROJECT_REF`
3. In the **"Secret"** field, paste your project reference ID
4. Click **"Add secret"**

### Add Secret 3: SUPABASE_DB_PASSWORD

1. Click **"New repository secret"** one more time
2. In the **"Name"** field, type: `SUPABASE_DB_PASSWORD`
3. In the **"Secret"** field, paste your database password
4. Click **"Add secret"**

## Step 3: Run the Workflow (Navigate from Front Page)

Now you can activate your Google Sheets connection with just a few clicks:

1. Visit https://github.com and log in
2. Navigate to your repository: `github.com/YOUR_USERNAME/product-entry-hub-10`
3. You'll see the repository main page with several tabs at the top
4. Click the **"Actions"** tab
5. You'll see the list of available workflows on the left side
6. Look for **"Deploy Google Sheets Connection"** in the list
7. Click on it
8. You'll see the workflow details
9. On the right side, click the blue **"Run workflow"** button
10. A dropdown section will appear
11. You can leave the settings as default, or select your environment:
    - **production** (for your live setup)
    - **staging** (for testing)
12. Click **"Run workflow"** button to confirm

### Monitor the Workflow

1. You'll see the workflow appear in the list
2. It will show a **yellow circle** (🟡) while running
3. Wait 2-3 minutes
4. When it completes, you'll see a **green checkmark** (✓) - success!
5. If there's a red X (❌), click the workflow to see error details

When it's done, you'll see a green checkmark (✓) indicating success.

## Step 4: Verify the Connection

After the workflow completes successfully:

1. Go back to your Product Entry Hub application
2. Navigate to the **Admin** page
3. Scroll to **Google Sheets Connection**
4. Click **"Test Connection"**
5. You should see a success message

That's it! Your Google Sheets connection is now active.

## What the Workflow Does

When you run the workflow, it:

1. **Authenticates** with Supabase using your access token
2. **Links** to your specific Supabase project
3. **Deploys** the Google Sheets Edge Function
4. **Verifies** the deployment was successful
5. **Reports** the status back to you

All of this happens automatically—no CLI commands needed!

## Troubleshooting

### Workflow Failed with "Authentication failed"

**Cause:** The GitHub Secrets are incorrect or missing.

**Solution:**
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Verify all three secrets are present:
   - `SUPABASE_ACCESS_TOKEN` (starts with `sbp_`)
   - `SUPABASE_PROJECT_REF` (your project ID)
   - `SUPABASE_DB_PASSWORD` (your database password)
3. If any are missing or invalid, update them
4. Run the workflow again

### Workflow Failed with "Project not found"

**Cause:** The `SUPABASE_PROJECT_REF` is incorrect.

**Solution:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **General**
4. Copy the correct **Reference ID**
5. Go to GitHub → **Settings** → **Secrets and variables** → **Actions**
6. Update `SUPABASE_PROJECT_REF` with the correct value
7. Run the workflow again

### Workflow Failed with "Unable to connect to database"

**Cause:** The `SUPABASE_DB_PASSWORD` is incorrect.

**Solution:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** → **Database**
4. Click **Reset password**
5. Copy the new password
6. Go to GitHub → **Settings** → **Secrets and variables** → **Actions**
7. Update `SUPABASE_DB_PASSWORD` with the new password
8. Run the workflow again

### Test Connection Fails in Admin Panel

Even if the workflow succeeded, the Test Connection might fail. This usually means:

1. **Browser-based config:** Your credentials in the browser might be wrong
2. **Server-side config:** Edge Function deployed, but needs verification

Try:
1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Reload the Admin page
3. Click **Test Connection** again

If still failing:
1. Verify service account email has Editor access to your Google Sheet
2. Check that `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` are set in Supabase secrets
3. Go to Supabase Dashboard → Edge Functions → Logs to check for deployment errors

## Manual Alternative

If you prefer not to use GitHub Actions, you can deploy manually with the CLI:

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy google-sheets
```

However, GitHub Actions is recommended as it requires no local setup.

## Security Notes

- **GitHub Secrets are encrypted** - They're never visible in logs or on screen
- **Access token is limited-scope** - It only allows deploying Edge Functions
- **No credentials in version control** - Nothing is committed to your repository
- **Automatic cleanup** - Old access tokens can be revoked anytime in Supabase dashboard

## Next Steps

After successful activation:

1. ✓ Test the connection in Admin panel
2. ✓ Load a product from the SKU Selector
3. ✓ Verify your real data loads (not mock data)
4. ✓ Submit a test product to verify write access
5. ✓ Check your OUTPUT sheet to confirm data was written

---

**Questions?** See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) for complete documentation.
