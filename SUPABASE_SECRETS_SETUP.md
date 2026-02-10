# 🔐 SUPABASE SECRETS SETUP

**Complete guide to adding secrets in Supabase - Exact steps with copy-paste.**

---

## ⏱️ Time Required: 5 Minutes

You'll need:
1. Your Supabase account
2. Your Google Service Account JSON file (if using Google Sheets)
3. Your Google Sheet ID (if using Google Sheets)

---

## 📋 What Are Supabase Secrets?

Supabase secrets are environment variables that your Edge Functions can access. They're used to store:
- API keys
- Service account credentials
- Configuration values
- Any sensitive data your Edge Functions need

**In this project, secrets are used for:**
- ✅ Google Service Account Key (to access Google Sheets)
- ✅ Google Sheet ID (which sheet to read/write)

**Why use secrets:**
- ✅ Secure (encrypted by Supabase)
- ✅ Never exposed in code
- ✅ Easy to update
- ✅ Accessible only by your Edge Functions

---

## 🎯 PART 1: Access Supabase Secrets Dashboard (1 minute)

### Step 1.1: Go to Your Supabase Project

**OPEN:** [https://supabase.com/dashboard](https://supabase.com/dashboard)

**CLICK:** On your project to open it

### Step 1.2: Navigate to Edge Functions Settings

**LOOK AT THE LEFT SIDEBAR:**

**CLICK:** The **"Edge Functions"** icon
- It looks like a lightning bolt (⚡)

**YOU'LL SEE:** A list of your Edge Functions (if any exist)

**LOOK AT THE TOP RIGHT:**

**CLICK:** The **"Manage secrets"** button
- Or click the **gear icon** (⚙️) next to it

**YOU'LL SEE:** The Secrets management page

---

## 🎯 PART 2: Add Google Sheets Secrets (4 minutes)

### Secret #1: Google Sheet ID

This tells your app which Google Sheet to connect to.

#### Step 2.1: Get Your Sheet ID

**IF YOU DON'T HAVE IT YET:**

1. **OPEN** your Google Sheet in browser
2. **LOOK AT THE URL** in the address bar
3. **FIND** the ID between `/d/` and `/edit`

**Example URL:**
```
https://docs.google.com/spreadsheets/d/1ABC123xyz456DEF789/edit#gid=0
                                      ^^^^^^^^^^^^^^^^^^^^^^
                                      This is your Sheet ID
```

**COPY** this ID: `1ABC123xyz456DEF789`

#### Step 2.2: Add as Supabase Secret

**ON THE SECRETS PAGE:**

**CLICK:** The **"New secret"** button (green)

**A FORM APPEARS:**

**FILL IN:**
- **Name:** Copy this EXACTLY:
  ```
  GOOGLE_SHEET_ID
  ```
  ⚠️ **Must be exactly this - case sensitive!**

- **Value:** Paste your Sheet ID
  ```
  1ABC123xyz456DEF789
  ```

**CLICK:** The green **"Save"** or **"Add secret"** button

**✅ SECRET #1 ADDED!**

---

### Secret #2: Google Service Account Key

This gives your Edge Function permission to access Google Sheets.

#### Step 2.3: Get the JSON Key Content

**YOU NEED:** The JSON file you downloaded from Google Cloud Console
- If you don't have it, see [GOOGLE_SHEETS_COMPLETE.md](GOOGLE_SHEETS_COMPLETE.md) Part 1

**OPEN THE JSON FILE:**

**On Windows:**
1. **Right-click** the JSON file
2. **Choose:** "Open with" → "Notepad"

**On Mac:**
1. **Right-click** the JSON file
2. **Choose:** "Open With" → "TextEdit"

**YOU'LL SEE:** A file full of text that starts with:
```json
{
  "type": "service_account",
  "project_id": "...",
  "private_key_id": "...",
  ...
}
```

**SELECT ALL THE TEXT:**
- **Windows:** Press `Ctrl+A`
- **Mac:** Press `Command+A`

**COPY ALL THE TEXT:**
- **Windows:** Press `Ctrl+C`
- **Mac:** Press `Command+C`

**IMPORTANT:** Copy the ENTIRE file content, including the `{` and `}` at the start and end!

#### Step 2.4: Add as Supabase Secret

**BACK ON THE SUPABASE SECRETS PAGE:**

**CLICK:** The **"New secret"** button (green) again

**A FORM APPEARS:**

**FILL IN:**
- **Name:** Copy this EXACTLY:
  ```
  GOOGLE_SERVICE_ACCOUNT_KEY
  ```
  ⚠️ **Must be exactly this - case sensitive!**

- **Value:** Paste the ENTIRE JSON content you just copied
  - It should be a long block of text
  - Should start with `{` and end with `}`
  - Should contain "private_key", "client_email", etc.

**CLICK:** The green **"Save"** or **"Add secret"** button

**✅ SECRET #2 ADDED!**

---

## ✅ VERIFY YOUR SECRETS

### Check They're Listed

**ON THE SECRETS PAGE, YOU SHOULD SEE:**

```
GOOGLE_SHEET_ID                    [hidden value]    🗑️
GOOGLE_SERVICE_ACCOUNT_KEY         [hidden value]    🗑️
```

**Note:** The actual values are hidden for security - that's normal!

**✅ If you see both secrets listed, you're done!**

---

## 🎯 PART 3: Redeploy Edge Functions (Required!)

**IMPORTANT:** After adding secrets, you MUST redeploy your Edge Functions!

**Why?** Edge Functions only load secrets at deployment time.

### Step 3.1: Go to GitHub Actions

**OPEN:** Your GitHub repository
```
https://github.com/YOUR-USERNAME/product-entry-hub-10
```

**CLICK:** The **"Actions"** tab

### Step 3.2: Run Deployment

**IN THE LEFT SIDEBAR:**

**CLICK:** "Deploy Google Sheets Connection"

**ON THE RIGHT:**

**CLICK:** Blue **"Run workflow"** button

**IN THE DROPDOWN:**
1. Select **"production"**
2. **CLICK:** Green **"Run workflow"** button

**WAIT:** 1-2 minutes for deployment

**WHEN YOU SEE GREEN CHECKMARK (✅):**
- Your Edge Functions now have access to the secrets!

---

## 🧪 TEST IT WORKS

### Test in Your Application

1. **OPEN** your application URL
   ```
   https://your-username.github.io/product-entry-hub-10/
   ```

2. **GO TO** the Admin page

3. **SCROLL TO** "Google Sheets Connection" section

4. **CLICK** "Test Connection" button

**SUCCESS LOOKS LIKE:**
```
✅ Connected!
Successfully connected to your Google Sheet!
Found X products and Y categories.
```

**IF YOU SEE THIS:**
- 🎉 Perfect! Your secrets are working!
- Your Edge Function can access Google Sheets
- Everything is configured correctly

**IF YOU SEE AN ERROR:**
- See Troubleshooting section below

---

## 🆘 TROUBLESHOOTING

### "Cannot read secrets" error

**CAUSE:** Edge Function was deployed BEFORE you added secrets.

**SOLUTION:**
1. Make sure both secrets are added in Supabase
2. Go to GitHub Actions
3. Run "Deploy Google Sheets Connection" again
4. Wait for green checkmark
5. Test connection again

### "Authentication failed" error

**CAUSE:** The `GOOGLE_SERVICE_ACCOUNT_KEY` is incorrect or incomplete.

**SOLUTION:**
1. **CHECK:** Did you copy the ENTIRE JSON file?
   - Should include the `{` at start and `}` at end
   - Should be several lines long

2. **TRY AGAIN:**
   - Open the JSON file again
   - Select All (Ctrl+A / Command+A)
   - Copy (Ctrl+C / Command+C)
   - In Supabase, delete the old secret
   - Add a new secret with the copied content
   - Redeploy Edge Function

### "Sheet not found" error

**CAUSE:** The `GOOGLE_SHEET_ID` is incorrect.

**SOLUTION:**
1. Open your Google Sheet
2. Check the URL
3. Copy the ID correctly (between `/d/` and `/edit`)
4. Update the secret in Supabase
5. Redeploy Edge Function

### "I can't find the Manage Secrets button"

**SOLUTION:**
1. Make sure you're in your project (not the dashboard homepage)
2. Look for the Edge Functions section (⚡ icon)
3. The "Manage secrets" button is at the top right
4. If you don't see it, try refreshing the page

### "My secret name has a typo"

**SOLUTION:**
1. **DELETE** the incorrect secret:
   - Click the trash icon (🗑️) next to it
   - Confirm deletion

2. **ADD** a new secret with the correct name:
   - Use the exact names shown in this guide
   - Names are case-sensitive!

3. **REDEPLOY** Edge Function

---

## 📋 Secret Names Reference

**COPY THESE EXACTLY (case-sensitive):**

For Google Sheets:
```
GOOGLE_SHEET_ID
GOOGLE_SERVICE_ACCOUNT_KEY
```

For future use (if needed):
```
OPENAI_API_KEY           (if using AI features)
STRIPE_SECRET_KEY        (if using payments)
SENDGRID_API_KEY        (if using email)
```

**⚠️ IMPORTANT:** 
- Names must match EXACTLY
- Case-sensitive
- No spaces
- Underscores, not hyphens

---

## 🔄 To Update a Secret Later

**If you need to change a secret value:**

### Option 1: Delete and Recreate

1. **GO TO:** Supabase → Edge Functions → Manage secrets
2. **CLICK:** Trash icon (🗑️) next to the secret
3. **CONFIRM:** Deletion
4. **CLICK:** "New secret"
5. **ENTER:** Same name, new value
6. **SAVE**
7. **REDEPLOY:** Edge Function in GitHub Actions

### Option 2: Use Supabase CLI (Advanced)

```bash
supabase secrets set GOOGLE_SHEET_ID=new-value-here --project-ref your-ref
```

**After updating:**
- ✅ Always redeploy Edge Functions
- ✅ Test connection to verify

---

## 🔐 Security Best Practices

**DO:**
- ✅ Use secrets for sensitive data
- ✅ Rotate secrets periodically
- ✅ Use different secrets for dev/prod
- ✅ Keep a secure backup of important values

**DON'T:**
- ❌ Share secrets publicly
- ❌ Commit secrets to code
- ❌ Use production secrets in development
- ❌ Reuse secrets across projects

---

## 📊 What Secrets Do

```
Your Edge Function runs
    ↓
Needs to access Google Sheets
    ↓
Reads GOOGLE_SHEET_ID from Supabase secrets
    ↓
Reads GOOGLE_SERVICE_ACCOUNT_KEY from Supabase secrets
    ↓
Uses these to authenticate with Google
    ↓
Can now read/write your Google Sheet
```

**Without secrets:**
- ❌ Edge Function can't access Google Sheets
- ❌ Connection fails
- ❌ App shows "Cannot read secrets" error

**With secrets:**
- ✅ Edge Function has credentials
- ✅ Can connect to Google Sheets
- ✅ App works perfectly

---

## 📝 Secrets Checklist

**After completing this guide:**

**In Supabase Secrets:**
- [ ] `GOOGLE_SHEET_ID` - Added ✓
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` - Added ✓

**In GitHub Secrets (from other guides):**
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PROJECT_ID`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `SUPABASE_ACCESS_TOKEN`
- [ ] `SUPABASE_PROJECT_REF`
- [ ] `SUPABASE_DB_PASSWORD`
- [ ] `GOOGLE_SHEET_ID` (also in GitHub)
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` (also in GitHub)

**Note:** Some secrets exist in BOTH places!
- GitHub Secrets: Used by GitHub Actions for deployment
- Supabase Secrets: Used by Edge Functions at runtime

---

## 🎉 Success!

**You've now:**
1. ✅ Accessed Supabase Secrets dashboard
2. ✅ Added Google Sheet ID secret
3. ✅ Added Service Account Key secret
4. ✅ Redeployed Edge Functions
5. ✅ Verified it works

**Your Edge Functions can now:**
- ✅ Access your Google Sheets
- ✅ Read/write data securely
- ✅ Use secrets safely

---

## 📚 Related Guides

**Complete setup flow:**
1. **[GITHUB_SETUP.md](GITHUB_SETUP.md)** - Initial Supabase & deployment
2. **[SUPABASE_EDGE_FUNCTIONS.md](SUPABASE_EDGE_FUNCTIONS.md)** - Deploy Edge Functions
3. **[SUPABASE_SECRETS_SETUP.md](SUPABASE_SECRETS_SETUP.md)** - This guide (add secrets)
4. **[GOOGLE_SHEETS_COMPLETE.md](GOOGLE_SHEETS_COMPLETE.md)** - Complete Google Sheets setup

---

**🔐 Your secrets are now configured and secured in Supabase!**
