# 🔧 SUPABASE EDGE FUNCTIONS SETUP

**Complete guide to deploying Edge Functions - No coding required, just clicking and pasting.**

---

## ⏱️ Time Required: 10 Minutes

You'll need:
1. Your Supabase account
2. Your web browser
3. GitHub repository access

**That's it!**

---

## 📋 What Are Edge Functions?

Edge Functions run server-side code for your application. In this project, they're used to:
- Connect to Google Sheets securely
- Handle API calls
- Process data server-side

**You need this if:**
- ✅ You're using Google Sheets integration
- ✅ You need server-side processing
- ✅ You want secure API calls

---

## 🎯 PART 1: Get Supabase Access Token (3 minutes)

### Step 1.1: Go to Supabase Account Settings

**Click this link:** 👉 [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)

Or manually:
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click your **profile picture** (top right)
3. Click **"Account Settings"**
4. Click **"Access Tokens"** in the left sidebar

### Step 1.2: Create New Token

**ON THE ACCESS TOKENS PAGE:**

**CLICK:** The **"Generate New Token"** button

**A FORM APPEARS:**

**FILL IN:**
- **Name:** Type `GitHub Actions` (or any name you want)
- **Scopes:** Leave all checkboxes as default (all checked)

**CLICK:** The green **"Generate Token"** button

### Step 1.3: Copy Your Token

**IMMEDIATELY YOU'LL SEE:**
- A long token starting with `sbp_`
- Example: `sbp_abc123def456...`

**IMPORTANT:** This token is shown ONLY ONCE!

**CLICK:** The **copy icon** (📋) next to the token

**PASTE IT SOMEWHERE SAFE** (like a notepad)

**Label it:** "Supabase Access Token"

**✅ PART 1 COMPLETE!** You have your access token.

---

## 🎯 PART 2: Get Supabase Project Details (2 minutes)

### Step 2.1: Go to Your Project Settings

**GO TO:** [https://supabase.com/dashboard](https://supabase.com/dashboard)

**CLICK:** On your project to open it

**CLICK:** The **gear icon** (⚙️) at the bottom of the left sidebar (Settings)

**CLICK:** **"General"** in the settings menu

### Step 2.2: Copy Project Reference ID

**SCROLL DOWN** to find **"Reference ID"**

**YOU'LL SEE:**
- A short ID like: `abcdefgh123`
- Under "Reference ID" label

**CLICK:** The **copy icon** (📋) next to it

**PASTE IT SOMEWHERE SAFE**

**Label it:** "Project Ref"

### Step 2.3: Get Database Password

**IMPORTANT:** This is the password you set when you created the project.

**IF YOU DON'T REMEMBER IT:**

1. Still in Settings
2. **CLICK:** "Database" in the left menu
3. **SCROLL DOWN** to "Database Settings"
4. **CLICK:** "Reset Database Password" (if needed)
5. Enter a new password
6. **SAVE IT SECURELY**

**PASTE IT SOMEWHERE SAFE**

**Label it:** "Database Password"

**✅ PART 2 COMPLETE!** You have all 3 values:
- Access Token
- Project Ref
- Database Password

---

## 🎯 PART 3: Add Secrets to GitHub (3 minutes)

### Step 3.1: Go to Your GitHub Repository

**YOUR REPO URL:**
```
https://github.com/YOUR-USERNAME/product-entry-hub-10
```

**CLICK:** The **"Settings"** tab (top of page)

**IN THE LEFT SIDEBAR:**
1. **CLICK:** "Secrets and variables"
2. **CLICK:** "Actions"

### Step 3.2: Add the Three Secrets

**For each secret below, do this:**
1. **CLICK:** Green **"New repository secret"** button
2. **ENTER** the Name (copy exactly)
3. **PASTE** the Value you saved earlier
4. **CLICK:** Green **"Add secret"** button

**SECRET #1:**
```
Name: SUPABASE_ACCESS_TOKEN
Value: [Paste your Access Token - starts with sbp_]
```

**SECRET #2:**
```
Name: SUPABASE_PROJECT_REF
Value: [Paste your Project Ref - short ID like abcdefgh123]
```

**SECRET #3:**
```
Name: SUPABASE_DB_PASSWORD
Value: [Paste your Database Password]
```

**✅ YOU SHOULD NOW HAVE 3 NEW SECRETS:**
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_DB_PASSWORD`

---

## 🎯 PART 4: Deploy Edge Functions (2 minutes)

### Step 4.1: Run the Deployment Workflow

**STILL IN YOUR GITHUB REPO:**

**CLICK:** The **"Actions"** tab (top of page)

**IN THE LEFT SIDEBAR:**

**FIND AND CLICK:** "Deploy Google Sheets Connection"
- This deploys the Edge Function

**ON THE RIGHT SIDE:**

**CLICK:** The blue **"Run workflow"** dropdown button

**IN THE DROPDOWN:**
1. Make sure **"Branch: main"** is selected
2. **"Environment"** should be set to **"production"**
3. **CLICK:** The green **"Run workflow"** button

### Step 4.2: Wait for Deployment

**YOU'LL SEE:**
- A new workflow run appears at the top
- Yellow dot (🟡) = running
- This takes about 1-2 minutes

**REFRESH THE PAGE** after 2 minutes

**WHEN YOU SEE:**
- Green checkmark (✅) = **Success!**
- Red X (❌) = Something went wrong (see troubleshooting)

### Step 4.3: Verify Deployment

**IF YOU SEE A GREEN CHECKMARK:**

**CLICK ON IT** to see details

**YOU'LL SEE:**
- ✅ "Edge Function deployed successfully"
- ✅ "Google Sheets connection is now active"

**✅ DONE! Your Edge Function is deployed!**

---

## ✅ VERIFY IT WORKS

### Test in Your Application

1. **OPEN** your live application URL
   - Format: `https://your-username.github.io/product-entry-hub-10/`

2. **GO TO** the Admin page

3. **SCROLL DOWN** to "Google Sheets Connection" section

4. **CLICK** the **"Test Connection"** button

**IF IT WORKS:**
- You'll see: "Connected ✅"
- Shows count of products/categories
- **Perfect!** Your Edge Function is working!

**IF YOU SEE AN ERROR:**
- See Troubleshooting section below

---

## 🆘 TROUBLESHOOTING

### "Workflow run failed with red X"

**SOLUTION:**

**CLICK** on the red X to see details

**Common issues:**

**Issue: "supabase login failed"**
- Your `SUPABASE_ACCESS_TOKEN` is wrong
- Go back to Part 1 and generate a new token
- Update the secret in GitHub
- Run the workflow again

**Issue: "supabase link failed"**
- Your `SUPABASE_PROJECT_REF` or `SUPABASE_DB_PASSWORD` is wrong
- Check the values are correct
- Update the secrets in GitHub
- Run the workflow again

**Issue: "Permission denied"**
- Your access token doesn't have the right permissions
- Generate a new token with all scopes checked
- Update the secret in GitHub
- Run the workflow again

### "I can't find the Access Tokens page"

**SOLUTION:**
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click your profile picture (top right corner)
3. Click "Account Settings" (not "Profile")
4. Click "Access Tokens" in the left sidebar

### "I don't remember my database password"

**SOLUTION:**
1. Go to your project in Supabase
2. Click Settings (⚙️ gear icon at bottom left)
3. Click "Database"
4. Scroll to "Database Settings"
5. Click "Reset Database Password"
6. Enter a new password
7. Click "Save"
8. Use this new password

### "The Edge Function deployed but test connection fails"

**SOLUTION:**

**This usually means Google Sheets secrets aren't set yet.**

You need to set up Google Sheets secrets first:
- See [GOOGLE_SHEETS_COMPLETE.md](GOOGLE_SHEETS_COMPLETE.md)
- Specifically Part 4 about adding `GOOGLE_SHEET_ID` and `GOOGLE_SERVICE_ACCOUNT_KEY`

**After adding those secrets:**
1. Run the "Deploy Google Sheets Connection" workflow again
2. Test connection should work

### "Cannot read secrets" error

**SOLUTION:**

**This means Edge Function can't access your Supabase secrets.**

You need to add secrets IN SUPABASE (not GitHub):
- See [SUPABASE_SECRETS_SETUP.md](SUPABASE_SECRETS_SETUP.md)
- Add `GOOGLE_SERVICE_ACCOUNT_KEY` and `GOOGLE_SHEET_ID` in Supabase
- Redeploy the Edge Function

---

## 🔄 To Redeploy Edge Functions Later

**If you make changes or need to redeploy:**

1. **GO TO:** GitHub repo → Actions tab
2. **CLICK:** "Deploy Google Sheets Connection"
3. **CLICK:** "Run workflow"
4. **WAIT:** 1-2 minutes
5. **DONE!** New version deployed

**When to redeploy:**
- ✅ After adding/updating Supabase secrets
- ✅ After changing Edge Function code
- ✅ If connection stops working
- ✅ After Supabase project changes

---

## 📊 What Just Happened?

**Behind the scenes:**

```
GitHub Actions
    ↓
Authenticates with Supabase (using your token)
    ↓
Links to your project (using project ref)
    ↓
Uploads Edge Function code (from supabase/functions/)
    ↓
Deploys to Supabase (makes it live)
    ↓
Your app can now call the function
```

**Your Edge Function URL:**
```
https://[YOUR-PROJECT-REF].supabase.co/functions/v1/google-sheets
```

**Your app calls this URL to:**
- Read from Google Sheets
- Write to Google Sheets
- Process data securely

---

## 🔐 Security Notes

**About Access Tokens:**
- ✅ Stored encrypted in GitHub Secrets
- ✅ Never visible in logs
- ✅ Can be revoked anytime in Supabase
- ❌ Don't share with anyone
- ❌ Don't commit to code

**About Database Password:**
- ✅ Encrypted in GitHub Secrets
- ✅ Only used by GitHub Actions
- ✅ Can be reset in Supabase settings

**About Edge Functions:**
- ✅ Run on Supabase servers (secure)
- ✅ Can access Supabase secrets
- ✅ Isolated from client code
- ✅ Protected by CORS

---

## 📋 Secrets Checklist

**After completing this guide, you should have these GitHub Secrets:**

- [ ] `VITE_SUPABASE_URL` (from main setup)
- [ ] `VITE_SUPABASE_PROJECT_ID` (from main setup)
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` (from main setup)
- [ ] `SUPABASE_ACCESS_TOKEN` ← NEW (from this guide)
- [ ] `SUPABASE_PROJECT_REF` ← NEW (from this guide)
- [ ] `SUPABASE_DB_PASSWORD` ← NEW (from this guide)

**For Google Sheets (if using):**
- [ ] `GOOGLE_SHEET_ID` (from Google Sheets setup)
- [ ] `GOOGLE_SERVICE_ACCOUNT_KEY` (from Google Sheets setup)

---

## 🎉 Success!

**You've now:**
1. ✅ Generated a Supabase access token
2. ✅ Got your project details
3. ✅ Added secrets to GitHub
4. ✅ Deployed Edge Functions
5. ✅ Verified it works

**Your Edge Functions are:**
- ✅ Deployed to Supabase
- ✅ Accessible by your app
- ✅ Secured with proper authentication
- ✅ Ready for production use

---

## 📚 Related Guides

**Next steps:**
- **[SUPABASE_SECRETS_SETUP.md](SUPABASE_SECRETS_SETUP.md)** - Add secrets IN Supabase
- **[GOOGLE_SHEETS_COMPLETE.md](GOOGLE_SHEETS_COMPLETE.md)** - Complete Google Sheets setup
- **[COMPLETE_CLOUD_SETUP.md](COMPLETE_CLOUD_SETUP.md)** - Master setup guide

---

**🎊 Your Edge Functions are now deployed and ready to use!**
