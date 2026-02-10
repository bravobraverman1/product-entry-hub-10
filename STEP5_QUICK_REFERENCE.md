# STEP 5 Quick Reference: GitHub Actions Activation

## Activate Your Google Sheets Connection in 5 Clicks

> ✓ No terminal required  
> ✓ No software installation  
> ✓ No code editing  
> ✓ Completely safe to repeat  

---

## Prerequisites

You should have already completed:
- [x] STEP 1: Created Google Service Account
- [x] STEP 2: Shared your Google Sheet with the service account
- [x] STEP 3: Configured credentials in Supabase (Option B) or your browser (Option A)

If using **Option B (Server-Side)**, you also need to set up GitHub Secrets (one-time setup).

---

## One-Time Setup: Add GitHub Secrets

**Do this once, then you can activate anytime by running the workflow.**

### Gather Information from Supabase

1. **Access Token:**
### Get Supabase Access Token

1. Visit https://supabase.com/dashboard
2. Click your profile icon (top-right)
3. Click **"Account Settings"** → **"Access Tokens"** (in left sidebar)
4. Click **"Generate new token"**
5. Name it: "Product Entry Hub"
6. Click **"Generate"**
7. Copy the token (starts with `sbp_`)

### Get Project Reference

1. Visit https://supabase.com/dashboard
2. Click your project
3. Click **"Project Settings"** (or gear icon)
4. Go to **"General"** tab
5. Find **"Reference ID"** (e.g., `abcdefghijklmnop`)
6. Copy it

### Get Database Password

1. Visit https://supabase.com/dashboard
2. Click your project
3. Click **"Project Settings"**
4. Go to **"Database"** in left sidebar
5. Click **"Reset password"**
6. Copy the new password

### Add Secrets to GitHub

1. Visit GitHub: https://github.com/YOUR_USERNAME/product-entry-hub-10
2. Click **Settings** tab (top-right area)
3. Click **"Secrets and variables"** → **"Actions"** (left sidebar)
4. Click **"New repository secret"** and add each:
   - **Secret 1:**
     - Name: `SUPABASE_ACCESS_TOKEN`
     - Value: (your token from above)
     - Click **"Add secret"**
   - **Secret 2:**
     - Name: `SUPABASE_PROJECT_REF`
     - Value: (your project ID)
     - Click **"Add secret"**
   - **Secret 3:**
     - Name: `SUPABASE_DB_PASSWORD`
     - Value: (your database password)
     - Click **"Add secret"**

✓ **Done with setup!**

---

## Activate the Connection (Anytime)

### Click-Only Steps

1. **Open GitHub Repository**
   - Visit: https://github.com/YOUR_USERNAME/product-entry-hub-10
   - You'll see the main repository page

2. **Go to Actions Tab**
   - Click the **"Actions"** tab at the top
   - You'll see the list of workflows on the left

3. **Select the Workflow**
   - In the left sidebar, click **"Deploy Google Sheets Connection"**
   - You'll see the workflow details

4. **Run the Workflow**
   - On the right side, click **"Run workflow"** button
   - Select **"production"** from the dropdown
   - Click **"Run workflow"** to confirm

5. **Wait for Completion**
   - Watch the workflow in the list
   - Yellow circle = running (🟡)
   - Green checkmark = done (✓)
   - Takes 2-3 minutes

---

## Verify It Works

After the workflow completes (green checkmark):

1. Open your Product Entry Hub application
2. Go to **Admin** page
3. Scroll to **Google Sheets Connection**
4. Click **"Test Connection"**
5. You should see: ✓ Connection successful!

If you see actual SKU data (not mock data), you're all set! 🎉

---

## Troubleshooting

### Workflow Shows Red ❌

**Check your GitHub Secrets:**
- Settings → Secrets and variables → Actions
- Verify all three secrets are present and correct:
  - `SUPABASE_ACCESS_TOKEN` (starts with `sbp_`)
  - `SUPABASE_PROJECT_REF` (your project ID)
  - `SUPABASE_DB_PASSWORD` (your database password)

**If incorrect, update them and run the workflow again.**

### Test Connection Fails

**Clear your browser cache:**
- Press Ctrl+Shift+Delete (Windows) or Cmd+Shift+Delete (Mac)
- Reload the Admin page
- Click "Test Connection" again

**If still failing:**
- Verify service account email has Editor access to your Google Sheet
- Check Supabase Dashboard → Edge Functions → Logs for errors

---

## Common Questions

**Q: Do I need to run this workflow every time I use the app?**  
A: No! Run it once, then your connection stays active.

**Q: Is my data safe?**  
A: Yes! GitHub Secrets are encrypted. No credentials are exposed in logs.

**Q: What if something goes wrong?**  
A: Just run the workflow again. It's completely safe to repeat.

**Q: Do I need Supabase CLI installed?**  
A: No! GitHub Actions handles everything for you.

**Q: Can I use my browser-based credentials instead?**  
A: Yes! If you used Option A (browser-based config in STEP 3), you don't need this workflow. Skip it entirely.

---

## Next Steps

✓ Activation complete!

1. Load a product from SKU Selector
2. Fill out the form
3. Submit it
4. Check your OUTPUT sheet to verify it was written

**Need help?** See [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md) or [GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)
