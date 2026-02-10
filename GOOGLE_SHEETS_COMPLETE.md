# 📊 GOOGLE SHEETS SETUP - COMPLETE GUIDE

**No technical knowledge needed. Just follow these exact steps.**

---

## ⏱️ Time Required: 10 Minutes

You'll need:
1. A Google account
2. Your web browser
3. A Google Sheet (or we'll create one)

**That's it!**

---

## 🎯 What You'll Accomplish

By the end of this guide:
- ✅ Your app will read/write data from YOUR Google Sheet
- ✅ Secure connection using Google Service Account
- ✅ Automatic updates when you change the sheet

---

## 📋 PART 1: Create Google Service Account (5 minutes)

This gives your app permission to access your Google Sheet.

### Step 1.1: Open Google Cloud Console

**Click this link:** 👉 [https://console.cloud.google.com](https://console.cloud.google.com)

- Sign in with your Google account
- Accept any terms if prompted

### Step 1.2: Create a New Project

**LOOK FOR:** A dropdown at the very top left (next to "Google Cloud")
- It might say "Select a project" or show a project name

**CLICK ON IT**

**In the popup that opens:**
1. Click the **"NEW PROJECT"** button (top right of popup)
2. You'll see a form

**Fill in the form:**
- **Project name:** Type `ProductEntryHub` (or any name you like)
- **Location:** Leave as "No organization"
- Click the blue **"CREATE"** button

**WAIT:** 10-20 seconds for it to create

**You'll see:** A notification bell (🔔) at top right - click it to see "Project created"

**NOW:** Click on the project dropdown again (top left)
- You should see your new project listed
- **CLICK ON IT** to select it

### Step 1.3: Enable Google Sheets API

**LOOK FOR:** The search bar at the very top (says "Search products and resources")

**TYPE:** `Google Sheets API`

**PRESS:** Enter

**YOU'LL SEE:** Search results appear

**CLICK ON:** "Google Sheets API" (should be the first result with a green sheets icon)

**ON THE NEW PAGE:**
- You'll see a blue **"ENABLE"** button
- **CLICK IT**

**WAIT:** 5-10 seconds

**YOU'LL SEE:** The API is now enabled (page will reload)

### Step 1.4: Create Service Account

**LOOK FOR:** The hamburger menu (☰) at the very top left

**CLICK IT**

**IN THE MENU THAT OPENS:**
1. Scroll down to find **"IAM & Admin"**
2. Hover over it (don't click yet)
3. A submenu appears on the right
4. **CLICK:** "Service Accounts" in that submenu

**ON THE SERVICE ACCOUNTS PAGE:**

**CLICK:** The blue **"+ CREATE SERVICE ACCOUNT"** button at the top

**YOU'LL SEE:** A form with 3 steps

**STEP 1 - Service account details:**
- **Service account name:** Type `sheets-access` (or any name)
- **Service account ID:** (auto-fills, leave it)
- **Description:** Type `Access to Google Sheets` (optional)
- Click blue **"CREATE AND CONTINUE"** button

**STEP 2 - Grant this service account access:**
- **Select a role:** Click the dropdown
- In the search box that appears, type: `Editor`
- **CLICK:** "Editor" from the results (under "Basic")
- Click blue **"CONTINUE"** button

**STEP 3 - Grant users access:**
- Leave everything blank
- Click blue **"DONE"** button

### Step 1.5: Download the JSON Key File

**YOU'LL SEE:** Your service account listed in a table

**FIND YOUR SERVICE ACCOUNT** in the list:
- It's the one you just created (sheets-access)
- Look for the email that ends with `@productentry...`

**CLICK:** The three dots (⋮) at the right end of that row

**IN THE MENU:**
- **CLICK:** "Manage keys"

**ON THE KEYS PAGE:**

**CLICK:** The **"ADD KEY"** dropdown button

**CLICK:** "Create new key" from the dropdown

**A POPUP APPEARS:**
- Make sure **"JSON"** is selected (it should be by default)
- Click blue **"CREATE"** button

**IMMEDIATELY:** A file downloads to your computer
- File name looks like: `productentry-abc123-xyz789.json`
- **IMPORTANT:** This file contains your credentials!

**SAVE THIS FILE SAFELY:**
1. Move it to a secure folder (like Documents)
2. **Never share this file** or upload it anywhere public
3. You'll need it in the next steps

**✅ PART 1 COMPLETE!** You now have your Google Service Account JSON file.

---

## 📋 PART 2: Get the Service Account Email (1 minute)

You need to share your Google Sheet with this email address.

### Step 2.1: Open the JSON File

**FIND:** The JSON file you just downloaded

**RIGHT-CLICK** on it

**CHOOSE:**
- **Windows:** "Open with" → "Notepad"
- **Mac:** "Open With" → "TextEdit"

**YOU'LL SEE:** A file full of text (looks complicated - that's normal!)

### Step 2.2: Find the Email

**LOOK FOR:** A line that says `"client_email":`

It looks like this:
```
"client_email": "sheets-access@productentry-123456.iam.gserviceaccount.com",
```

**SELECT AND COPY** the email address (the part between the quotes)
- Example: `sheets-access@productentry-123456.iam.gserviceaccount.com`

**PASTE IT** somewhere safe (like a notepad) - you'll need it in the next step

**CLOSE** the JSON file (don't save if asked)

---

## 📋 PART 3: Share Your Google Sheet (2 minutes)

Now you'll give your service account permission to access your sheet.

### Step 3.1: Open Your Google Sheet

**Option A - If you already have a sheet:**
- **Open it** in your browser

**Option B - If you need to create one:**
- **Go to:** [https://sheets.google.com](https://sheets.google.com)
- Click the **+ Blank** button to create a new sheet
- Give it a name (like "Product Entry Data")

### Step 3.2: Share with Service Account

**IN YOUR GOOGLE SHEET:**

**CLICK:** The green **"Share"** button (top right corner)

**A POPUP OPENS:**

**PASTE** the service account email you copied earlier
- Example: `sheets-access@productentry-123456.iam.gserviceaccount.com`

**IMPORTANT:** 
- Make sure the permission is set to **"Editor"** (not Viewer)
- There's a dropdown that says "Viewer" - click it and change to **"Editor"**

**UN-CHECK** the box that says "Notify people" (if you see it)
- Service accounts don't need notifications

**CLICK:** The blue **"Share"** or **"Send"** button

**YOU'LL SEE:** The email is now listed under "People with access"

**✅ DONE!** Your service account can now access this sheet.

### Step 3.3: Get Your Sheet ID

**LOOK AT:** The URL in your browser's address bar

It looks like:
```
https://docs.google.com/spreadsheets/d/1ABC123xyz456DEF789/edit#gid=0
```

**COPY** the part between `/d/` and `/edit`
- In the example above: `1ABC123xyz456DEF789`
- This is your **Sheet ID**

**PASTE IT** somewhere safe - you'll need it next

---

## 📋 PART 4: Add to GitHub Secrets (2 minutes)

Now you'll give your app access to Google Sheets.

### Step 4.1: Go to Your GitHub Repository

**YOUR REPO URL:**
```
https://github.com/YOUR-USERNAME/product-entry-hub-10
```

### Step 4.2: Open Settings

1. Click **"Settings"** tab (top of page)
2. Left sidebar: Click **"Secrets and variables"**
3. Click **"Actions"**

### Step 4.3: Add Sheet ID Secret

**CLICK:** Green **"New repository secret"** button

**ENTER:**
- **Name:** Copy this EXACTLY:
  ```
  GOOGLE_SHEET_ID
  ```
- **Secret:** Paste your Sheet ID (from Step 3.3)

**CLICK:** Green **"Add secret"** button

### Step 4.4: Add Service Account Key Secret

**CLICK:** Green **"New repository secret"** button again

**ENTER:**
- **Name:** Copy this EXACTLY:
  ```
  GOOGLE_SERVICE_ACCOUNT_KEY
  ```
- **Secret:** You need to paste the ENTIRE contents of the JSON file

**TO GET THE JSON CONTENTS:**

1. **OPEN** the JSON file again (Right-click → Open with Notepad/TextEdit)
2. **SELECT ALL** (Ctrl+A on Windows, Command+A on Mac)
3. **COPY** (Ctrl+C on Windows, Command+C on Mac)
4. **PASTE** into the Secret field on GitHub
5. **CLOSE** the JSON file

**CLICK:** Green **"Add secret"** button

**✅ YOU NOW HAVE TWO NEW SECRETS:**
- `GOOGLE_SHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_KEY`

---

## 📋 PART 5: Deploy Google Sheets Connection (1 minute)

This activates the connection between your app and Google Sheets.

### Step 5.1: Run the Deployment Workflow

**GO TO:** Your GitHub repository

**CLICK:** The **"Actions"** tab (top of page)

**YOU'LL SEE:** A list of workflows on the left

**FIND AND CLICK:** "Deploy Google Sheets Connection"

**CLICK:** The blue **"Run workflow"** button (top right)

**IN THE DROPDOWN:**
- Leave "production" selected
- **CLICK:** The green **"Run workflow"** button

**WAIT:** 2-3 minutes for it to complete

**YOU'LL SEE:** 
- A yellow dot (🟡) = running
- Changes to a green checkmark (✅) = success!
- Or a red X (❌) = something went wrong

### Step 5.2: Check the Results

**IF YOU SEE A GREEN CHECKMARK (✅):**
- **Click on it** to see details
- You'll see "Google Sheets Connection Activated"
- **You're done!** 🎉

**IF YOU SEE A RED X (❌):**
- **Click on it** to see what went wrong
- Common issues:
  - Missing Supabase secrets (see GITHUB_SETUP.md first)
  - Sheet ID is wrong (check Step 3.3)
  - JSON file copied incorrectly (check Step 4.4)
- Fix the issue and run the workflow again

---

## ✅ VERIFY IT WORKS

### Open Your Application

**GO TO:** Your application URL
- You got this from the GitHub Pages deployment
- Format: `https://YOUR-USERNAME.github.io/product-entry-hub-10/`

### Test the Connection

1. **CLICK:** "Admin" (in the app menu)
2. **SCROLL DOWN** to "Google Sheets Connection" section
3. **CLICK:** "Test Connection" button
4. **YOU SHOULD SEE:** "Connected ✅" with a count of your products/categories

**IF IT SAYS "Connected ✅":**
- 🎉 Perfect! Everything is working!

**IF YOU SEE AN ERROR:**
- Check the Troubleshooting section below

---

## 🆘 TROUBLESHOOTING

### "I can't find the Service Accounts page"

**Solution:**
1. Make sure you're in the correct Google Cloud project (check top left dropdown)
2. Navigate: ☰ Menu → IAM & Admin → Service Accounts
3. If you don't see "IAM & Admin", your project might not be selected

### "I can't download the JSON key"

**Solution:**
1. Make sure you clicked the three dots (⋮) next to YOUR service account
2. Click "Manage keys"
3. Click "ADD KEY" → "Create new key"
4. Select JSON
5. Click CREATE
6. The file should download immediately to your Downloads folder

### "My service account email is not being accepted"

**Solution:**
- Make sure you copied the ENTIRE email address
- It should end with: `.iam.gserviceaccount.com`
- Check for extra spaces at the beginning or end
- Try copying again from the JSON file

### "Test Connection fails with 404 error"

**Solution:**
- The Edge Function isn't deployed yet
- Go to Actions → "Deploy Google Sheets Connection"
- Run the workflow
- Wait for it to complete (green checkmark)
- Try Test Connection again

### "Test Connection says Cannot Read Secrets"

**Solution:**
- Your secrets were added AFTER deploying the function
- You need to redeploy the function:
  1. Go to Actions tab
  2. Click "Deploy Google Sheets Connection"
  3. Run workflow again
  4. Wait for green checkmark
  5. Try Test Connection again

### "I shared the sheet but the service account still can't access it"

**Solution:**
1. Open your Google Sheet
2. Click the "Share" button
3. Check that the service account email is listed
4. Check that its permission is "Editor" (not Viewer)
5. If not, remove it and re-add with Editor permission

### "The JSON file looks weird when I open it"

**That's normal!** The JSON file contains special formatting. Just:
1. Select all (Ctrl+A or Command+A)
2. Copy all (Ctrl+C or Command+C)
3. Paste into GitHub Secret
4. Don't try to edit or "fix" it

---

## 📊 Your Google Sheet Structure

For the app to work properly, your Google Sheet should have these tabs:

**Required tabs:**
- **PRODUCTS TO DO** - Products waiting to be entered
- **Categories** - Your product category hierarchy  
- **BRANDS** - Brand information
- **PROPERTIES** - Custom fields for products
- **LEGAL** - Allowed values for dropdown fields
- **OUTPUT** - Where completed product data goes

**Optional tabs:**
- **FILTER** - Rules for showing/hiding fields

You can configure the exact tab names in the Admin panel of your app.

---

## 🔐 Security Notes

**About the JSON file:**
- ✅ It's safe in GitHub Secrets (encrypted)
- ✅ Never appears in logs or code
- ❌ Don't commit it to your repository
- ❌ Don't share it publicly
- ❌ Don't email it

**About the service account:**
- ✅ It only has access to sheets you explicitly share with it
- ✅ It can't access your other Google Drive files
- ✅ You can revoke access anytime by unsharing the sheet

---

## 🎉 Success!

**You've now:**
1. ✅ Created a Google Service Account
2. ✅ Downloaded the JSON key file
3. ✅ Shared your Google Sheet with the service account
4. ✅ Added secrets to GitHub
5. ✅ Deployed the Google Sheets connection
6. ✅ Verified it works

**Your app can now:**
- Read data from your Google Sheet
- Write data to your Google Sheet
- Sync automatically when you make changes

---

## 🔄 To Use a Different Sheet Later

**If you want to connect to a different Google Sheet:**

1. Share that sheet with your service account email (Part 3)
2. Get the new Sheet ID (Step 3.3)
3. Update the `GOOGLE_SHEET_ID` secret in GitHub:
   - Settings → Secrets and variables → Actions
   - Click on `GOOGLE_SHEET_ID`
   - Click "Update secret"
   - Paste new Sheet ID
   - Click "Update secret"
4. Redeploy: Actions → "Deploy Google Sheets Connection" → Run workflow

---

**📱 Questions?** Check the troubleshooting section above or review the steps carefully. Every step shows exactly what to click and where!
