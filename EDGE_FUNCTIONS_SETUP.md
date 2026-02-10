# 🔧 Edge Functions Setup Guide

This guide explains how to set up and deploy Supabase Edge Functions for the Product Entry Hub application, specifically for Google Sheets integration.

## 📋 Prerequisites

Before setting up Edge Functions, make sure you have:

✅ Completed the [initial Supabase setup](./SETUP.md)  
✅ Your Supabase project is configured correctly  
✅ You have your Google Service Account credentials ready (if using Google Sheets)

---

## 🎯 What Are Edge Functions?

Edge Functions are serverless functions that run on Supabase's global network. For this project:

- **google-sheets** function: Securely accesses your Google Sheets without exposing credentials
- Runs server-side, keeping your API keys safe
- Automatically scales with your usage

---

## 🚀 Quick Setup (Recommended)

### Method 1: Automated via GitHub Actions (No Terminal Required!)

This is the **easiest way** - just click a few buttons!

#### Step 1: Set Up GitHub Secrets

1. Go to your GitHub repository: https://github.com/bravobraverman1/product-entry-hub-10
2. Click **Settings** (top menu)
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **"New repository secret"** button

Add these **three secrets** one by one:

##### Secret #1: SUPABASE_PROJECT_REF

- **Name:** `SUPABASE_PROJECT_REF`
- **Value:** Your Supabase project reference ID

**How to get it:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click Settings (⚙️) → General
4. Copy the **Reference ID**
5. Paste it as the secret value

Example: `oqaodtatfzcibpfmhejl`

---

##### Secret #2: SUPABASE_ACCESS_TOKEN

- **Name:** `SUPABASE_ACCESS_TOKEN`
- **Value:** Your personal Supabase access token

**How to get it:**
1. Go to https://supabase.com/dashboard/account/tokens
2. Click **"Generate new token"**
3. Name it: `GitHub Actions Deployment`
4. Click **"Generate token"**
5. **Copy the token immediately** (starts with `sbp_...`)
6. Paste it as the secret value

⚠️ **Important:** You can only see this token once! If you lose it, generate a new one.

---

##### Secret #3: SUPABASE_DB_PASSWORD

- **Name:** `SUPABASE_DB_PASSWORD`
- **Value:** Your Supabase database password

**How to get it:**
- This is the password you set when creating your Supabase project
- If you forgot it:
  1. Go to https://supabase.com/dashboard
  2. Select your project
  3. Click Settings (⚙️) → Database
  4. Click **"Reset database password"**
  5. Enter a new password
  6. Save and use this as the secret value

---

#### Step 2: Add Google Sheets Credentials to Supabase

Before deploying the Edge Function, you need to add your Google credentials to Supabase:

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (⚙️) → **Edge Functions** → **Add secret**

Add these **two secrets**:

##### Secret #1: GOOGLE_SERVICE_ACCOUNT_KEY

- **Name:** `GOOGLE_SERVICE_ACCOUNT_KEY`
- **Value:** The entire contents of your Google Service Account JSON file

**How to get it:**
1. Open the JSON key file you downloaded from Google Cloud
2. **Copy the ENTIRE file contents** (all the JSON text)
3. Paste it as the secret value

Example format (don't use this - use YOUR file):
```json
{
  "type": "service_account",
  "project_id": "your-project",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "your-service-account@your-project.iam.gserviceaccount.com",
  ...
}
```

##### Secret #2: GOOGLE_SHEET_ID

- **Name:** `GOOGLE_SHEET_ID`
- **Value:** Your Google Sheet ID

**How to get it:**
1. Open your Google Sheet
2. Look at the URL: `https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`
3. Copy the part between `/d/` and `/edit`
4. Paste it as the secret value

Example: `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms`

---

#### Step 3: Deploy the Edge Function

Now deploy the function via GitHub Actions:

1. Go to your GitHub repository
2. Click the **Actions** tab (top menu)
3. In the left sidebar, click **"Deploy Google Sheets Connection"**
4. Click the **"Run workflow"** button (on the right side)
5. In the popup:
   - Environment: Select **production**
   - Click **"Run workflow"** (green button)
6. Wait 2-3 minutes
7. ✅ You should see a green checkmark when complete

**What to do if it fails:**
- Click on the failed run to see error details
- Common issues:
  - Wrong GitHub secret names (must match exactly)
  - Invalid SUPABASE_ACCESS_TOKEN (generate a new one)
  - Wrong SUPABASE_PROJECT_REF (double-check it matches your project)

---

#### Step 4: Test Your Connection

1. Open your application: http://localhost:5173 (or your deployed URL)
2. Go to the **Admin** tab
3. Scroll to **"Google Sheets Connection"** section
4. Click **"Test Connection"** button
5. ✅ You should see: "Connected ✅ Successfully connected to your Google Sheet!"

**If you see "Cannot Read Secrets":**
- This means the Edge Function was deployed BEFORE you added secrets to Supabase
- **Solution:** Run the GitHub Actions workflow again (Step 3)
- The function needs to be redeployed to pick up the new secrets

---

## 🛠️ Method 2: Manual Deployment via Supabase CLI

If GitHub Actions doesn't work or you prefer manual control:

### Step 1: Install Supabase CLI

**On Mac/Linux:**
```bash
brew install supabase/tap/supabase
```

**On Windows:**
```bash
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Or using npm (all platforms):**
```bash
npm install -g supabase
```

### Step 2: Login to Supabase

```bash
supabase login
```

This will open your browser. Click "Authorize" to continue.

### Step 3: Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

Replace `YOUR_PROJECT_REF` with your actual project reference ID.

When prompted, enter your database password.

### Step 4: Add Secrets (if not done via dashboard)

```bash
# Add Google Service Account Key
supabase secrets set GOOGLE_SERVICE_ACCOUNT_KEY="$(cat path/to/service-account.json)"

# Add Google Sheet ID
supabase secrets set GOOGLE_SHEET_ID="your-sheet-id-here"
```

### Step 5: Deploy the Function

```bash
cd /path/to/product-entry-hub-10
supabase functions deploy google-sheets
```

Wait for deployment to complete. You should see:
```
✓ Deployed google-sheets function
```

---

## 🧪 Verifying Edge Function Deployment

### Check Function is Deployed

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** in the left sidebar
4. You should see **"google-sheets"** in the list
5. It should show status: **Active** ✓

### Check Secrets are Set

1. In the same Edge Functions page
2. Click on **"google-sheets"** function
3. Go to the **Settings** tab
4. Scroll to **"Secrets"** section
5. Verify you see:
   - ✓ GOOGLE_SERVICE_ACCOUNT_KEY
   - ✓ GOOGLE_SHEET_ID

**Note:** You won't see the actual values (for security), just the names.

---

## 🔄 Updating Edge Functions

If you need to update the function code or secrets:

### Update Code

**Via GitHub Actions:**
1. Make your code changes in `supabase/functions/google-sheets/`
2. Commit and push to GitHub
3. Run the "Deploy Google Sheets Connection" workflow

**Via CLI:**
```bash
supabase functions deploy google-sheets
```

### Update Secrets

**Via Supabase Dashboard:**
1. Go to Edge Functions → Secrets
2. Click on the secret you want to update
3. Enter new value
4. **Important:** Redeploy the function after updating secrets!

**Via CLI:**
```bash
supabase secrets set SECRET_NAME="new-value"
supabase functions deploy google-sheets
```

---

## 🐛 Troubleshooting

### Error: "Function not found" (404)

**Problem:** Edge Function hasn't been deployed yet.

**Solution:** 
- Deploy it via GitHub Actions (Method 1, Step 3)
- Or use CLI: `supabase functions deploy google-sheets`

---

### Error: "Cannot Read Secrets"

**Problem:** Secrets were added AFTER the function was deployed.

**Solution:**
1. Verify secrets are set in Supabase Dashboard → Edge Functions → Secrets
2. Redeploy the function:
   - Via GitHub Actions: Run the workflow again
   - Via CLI: `supabase functions deploy google-sheets`

---

### Error: "Authentication failed" (401)

**Problem:** Google Service Account credentials are incorrect.

**Solution:**
1. Verify you copied the ENTIRE JSON file (check for truncation)
2. Make sure the JSON is valid (no syntax errors)
3. Update the secret in Supabase Dashboard
4. Redeploy the function

---

### Error: "Access denied" (403)

**Problem:** Google Sheet is not shared with the service account.

**Solution:**
1. Open the JSON key file
2. Copy the `client_email` value
3. Open your Google Sheet
4. Click **Share**
5. Add the service account email as **Editor**
6. Click **Share**
7. Test again

---

### GitHub Actions Workflow Fails

**Check the logs:**
1. Go to Actions tab
2. Click on the failed run
3. Expand the failed step
4. Read the error message

**Common fixes:**
- **"Invalid project reference"** → Check SUPABASE_PROJECT_REF secret
- **"Authentication failed"** → Regenerate SUPABASE_ACCESS_TOKEN
- **"Permission denied"** → Check your Supabase token has correct permissions

---

### Edge Function Times Out

**Problem:** Function takes too long to respond.

**Solution:**
1. Check your Google Sheet isn't too large (>10,000 rows may be slow)
2. Verify your internet connection is stable
3. Check Supabase function logs for errors:
   - Dashboard → Edge Functions → google-sheets → Logs

---

## 📊 Monitoring and Logs

### View Function Logs

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Edge Functions** → **google-sheets**
4. Click **Logs** tab
5. You'll see all function invocations and errors

**Tip:** Use logs to debug connection issues!

---

## 🔒 Security Best Practices

✅ **DO:**
- Store all credentials in Supabase secrets (never in code)
- Use GitHub secrets for deployment credentials
- Regularly rotate your access tokens (every 90 days)
- Use the anon key (not service_role) in client-side code

❌ **DON'T:**
- Commit .env file to GitHub
- Share your SUPABASE_ACCESS_TOKEN publicly
- Use service_role key in client-side code
- Expose Google Service Account JSON in logs

---

## 📚 Additional Resources

- **[SETUP.md](./SETUP.md)** - Initial Supabase setup
- **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)** - Complete Google Sheets guide
- **[Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)** - Official documentation
- **[GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)** - Managing GitHub secrets

---

## ✅ Setup Complete Checklist

Use this to verify everything is set up:

- [ ] GitHub Secrets configured (SUPABASE_PROJECT_REF, SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD)
- [ ] Supabase Secrets configured (GOOGLE_SERVICE_ACCOUNT_KEY, GOOGLE_SHEET_ID)
- [ ] Edge Function deployed (visible in Supabase Dashboard)
- [ ] Function status shows "Active"
- [ ] Test Connection shows success message
- [ ] Google Sheet data loads in application

**All checked?** 🎉 You're ready to use the application!

---

Need help? See the **[Troubleshooting](#-troubleshooting)** section above or check **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)** for more details.
