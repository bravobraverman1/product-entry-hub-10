# ⚡ Quick Start Guide

**Complete setup in 15 minutes - No coding required!**

This guide walks you through setting up the Product Entry Hub from scratch. Everything is automated with copy-paste steps.

---

## 📦 Prerequisites

Before you begin, make sure you have:

- ✅ Node.js installed (version 16 or higher)
  - Check: Open terminal and type `node --version`
  - Not installed? Download from: https://nodejs.org/
  
- ✅ A Supabase account
  - Sign up free at: https://supabase.com
  
- ✅ A Google account (if using Google Sheets integration)

---

## 🎯 Complete Setup Flow

### Part 1: Initial Setup (5 minutes)

#### 1. Download the Project

If you haven't already:
```bash
git clone https://github.com/bravobraverman1/product-entry-hub-10.git
cd product-entry-hub-10
```

#### 2. Install Dependencies

```bash
npm install
```

Wait for installation to complete (1-2 minutes).

#### 3. Configure Supabase

Run the automated setup:
```bash
npm run setup
```

Follow the prompts - just paste your Supabase credentials when asked!

**Where to find credentials:** [Detailed instructions](./SETUP.md#where-to-find-these)

#### 4. Start the Application

```bash
npm run dev
```

Open http://localhost:5173/ in your browser. You should see the app! 🎉

#### 5. Verify Setup

1. Click the **Admin** tab
2. Look at the **"Project Check"** section
3. Confirm your project URL is correct ✓

**See wrong project info?** → [Troubleshooting](./SETUP.md#-troubleshooting)

---

### Part 2: Google Sheets Integration (Optional, 10 minutes)

**Skip this if you don't need Google Sheets integration.**

#### 1. Create Google Service Account

📖 **Detailed steps:** [GOOGLE_SHEETS_SETUP.md - STEP 1](./GOOGLE_SHEETS_SETUP.md#step-1-create-a-google-service-account)

**Quick version:**
1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google Sheets API
4. Create Service Account
5. Download JSON key file

#### 2. Share Your Google Sheet

📖 **Detailed steps:** [GOOGLE_SHEETS_SETUP.md - STEP 2](./GOOGLE_SHEETS_SETUP.md#step-2-share-your-google-sheet)

**Quick version:**
1. Open your JSON key file
2. Copy the `client_email`
3. Share your Google Sheet with that email
4. Give it **Editor** access

#### 3. Deploy Edge Function

📖 **Detailed steps:** [EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md)

**Method A: Via GitHub Actions (Easiest - No Terminal!)**

1. Set up GitHub Secrets: [Instructions](./EDGE_FUNCTIONS_SETUP.md#step-1-set-up-github-secrets)
2. Add Supabase Secrets: [Instructions](./EDGE_FUNCTIONS_SETUP.md#step-2-add-google-sheets-credentials-to-supabase)
3. Run workflow: GitHub → Actions → "Deploy Google Sheets Connection" → Run workflow

**Method B: Via CLI (Alternative)**

```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy google-sheets
```

#### 4. Test Your Connection

1. Go to your app: http://localhost:5173/
2. Click **Admin** tab
3. Scroll to **"Google Sheets Connection"**
4. Click **"Test Connection"**
5. You should see: "Connected ✅"

---

## 🎓 Understanding the Setup

### What did we just set up?

```
┌─────────────────────────────────────────────────────────────┐
│                    Your Browser/Client                      │
│                    (Product Entry Hub)                      │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ API Calls
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase Platform                          │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Edge Function: google-sheets                      │    │
│  │  (Runs server-side, keeps secrets safe)            │    │
│  └────────────────────┬───────────────────────────────┘    │
└───────────────────────┼─────────────────────────────────────┘
                        │
                        │ Uses Service Account
                        ▼
┌─────────────────────────────────────────────────────────────┐
│               Google Sheets API                             │
│                (Your spreadsheet)                           │
└─────────────────────────────────────────────────────────────┘
```

### Key Files

- **`.env`** - Your Supabase credentials (created by setup script)
- **`supabase/config.toml`** - Supabase project configuration
- **`supabase/functions/google-sheets/`** - Edge Function code
- **`setup-supabase.js`** - Automated setup script

---

## 📋 Post-Setup Checklist

Make sure everything is working:

### Basic Setup
- [ ] `npm install` completed without errors
- [ ] `npm run setup` configured Supabase
- [ ] `npm run dev` starts the application
- [ ] Application opens at http://localhost:5173/
- [ ] Admin panel shows correct project info

### Google Sheets (if needed)
- [ ] Google Service Account created
- [ ] Sheet shared with service account email
- [ ] GitHub Secrets configured
- [ ] Supabase Secrets configured
- [ ] Edge Function deployed
- [ ] Test Connection shows success

---

## 🚀 Next Steps

Now that setup is complete:

### 1. Explore the Application

- **Products Tab** - Enter and manage product data
- **Admin Tab** - Configure settings and test connections
- **Sheet Structure** - View required Google Sheet format

### 2. Configure Your Sheet Structure

In the Admin panel:
1. Set your sheet tab names
2. Configure categories
3. Set up dropdown values
4. Define custom properties

### 3. Start Entering Products

1. Go to Products tab
2. Select a SKU from the dropdown
3. Fill in product details
4. Save to Google Sheets

---

## 🆘 Common Issues & Solutions

### Issue: "Cannot find module" when running setup

**Solution:**
```bash
npm install
npm run setup
```

### Issue: Still showing wrong Supabase project

**Solution:**
1. Delete the `.env` file
2. Run `npm run setup` again
3. Restart dev server: Stop (Ctrl+C) and run `npm run dev`
4. Clear browser cache (Ctrl+Shift+Delete)

### Issue: "Cannot Read Secrets" error

**Solution:**
- You added Supabase secrets AFTER deploying the Edge Function
- Redeploy: GitHub → Actions → Run workflow again

### Issue: GitHub Actions workflow fails

**Solution:**
1. Check GitHub Secrets are set correctly
2. Verify SUPABASE_ACCESS_TOKEN is valid (generate new one if needed)
3. Check SUPABASE_PROJECT_REF matches your project

### Issue: Test Connection fails with 404

**Solution:**
- Edge Function not deployed yet
- Deploy it via GitHub Actions or CLI

---

## 📚 Detailed Documentation

For more information, see these guides:

| Guide | Purpose |
|-------|---------|
| **[SETUP.md](./SETUP.md)** | Detailed Supabase setup with screenshots |
| **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)** | Complete Google Sheets integration guide |
| **[EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md)** | Edge Functions deployment and troubleshooting |
| **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** | Checkbox checklist to track progress |
| **[README.md](./README.md)** | General project information |

---

## 🎉 You're Ready!

Congratulations! Your Product Entry Hub is now configured and ready to use.

**Questions or issues?** Check the [troubleshooting section](#-common-issues--solutions) or refer to the detailed guides above.

**Happy product managing! 🚀**
