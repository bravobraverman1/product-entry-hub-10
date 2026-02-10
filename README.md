# Product Entry Hub

A comprehensive product data entry and management system built with React, TypeScript, and Google Sheets integration.

---

## 🚀 ZERO-CODE CLOUD SETUP

**✨ Get your app running in 20 minutes - no installations, no coding**

### 👉 [START HERE: COMPLETE_CLOUD_SETUP.md](COMPLETE_CLOUD_SETUP.md)

**This complete guide shows you:**
- ✅ **No installations** - Everything through your web browser
- ✅ **No coding** - Just click buttons and paste values
- ✅ **Free hosting** - App runs on GitHub Pages
- ✅ **Live URL** - Access from anywhere, share with anyone
- ✅ **Automatic updates** - Push changes and they deploy automatically

**Perfect for:**
- 🎯 Quick client deployments
- 🎯 Non-technical users
- 🎯 No local setup needed
- 🎯 Production-ready in minutes

---

## 📋 What You'll Set Up

**3 Simple Steps:**

### 1️⃣ Supabase (5 min)
Connect your database
- **Guide:** [GITHUB_SETUP.md](GITHUB_SETUP.md)

### 2️⃣ Deploy App (5 min)
Get your live URL
- **Guide:** Built into [GITHUB_SETUP.md](GITHUB_SETUP.md)

### 3️⃣ Google Sheets (10 min)
Connect your data source
- **Guide:** [GOOGLE_SHEETS_COMPLETE.md](GOOGLE_SHEETS_COMPLETE.md)

**Total: ~20 minutes** ⏱️

---

## 🎯 End Result

After setup you'll have:
- ✅ A live web application with your own URL
- ✅ Connected to your Supabase database
- ✅ Syncing with your Google Sheets
- ✅ Accessible from any device
- ✅ Shareable with your team

**Example URL:**
```
https://your-username.github.io/product-entry-hub-10/
```

---

## 🔄 Alternative: Local Development

<details>
<summary>Click here if you need to run locally (requires Node.js installation)</summary>

### Prerequisites
- Node.js 18+ installed
- Git installed
- Terminal access

### Quick Start

1. **Clone and install:**
   ```bash
   git clone https://github.com/your-username/product-entry-hub-10.git
   cd product-entry-hub-10
   npm install
   ```

2. **Configure:**
   - Get Supabase credentials: [GITHUB_SETUP.md - Step 1](GITHUB_SETUP.md#-step-1-get-your-supabase-credentials-2-minutes)
   - Run setup: `./setup-supabase.sh` (Mac/Linux) or `setup-supabase.bat` (Windows)
   - Or manually edit `.env` file

3. **Start:**
   ```bash
   npm run dev
   ```

4. **Open:** http://localhost:8080

**Detailed local setup:** [START_HERE.md](START_HERE.md)

</details>

---

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## 🔗 Google Sheets Integration

This application connects to Google Sheets to manage product data. To link your Google Sheets file:

### Quick Start (6 Steps)

1. **STEP 1-2:** [Create service account and share your sheet](./GOOGLE_SHEETS_SETUP.md)

2. **STEP 3:** [Create and Deploy the Edge Function](./GOOGLE_SHEETS_SETUP.md#step-3-create-and-deploy-the-edge-function) (Required for new projects)

3. **STEP 4:** [Add credentials to Supabase](./GOOGLE_SHEETS_SETUP.md#step-4-add-credentials-to-supabase) (server-side security)

4. **STEP 5:** [Activate via GitHub Actions](./GOOGLE_SHEETS_SETUP.md#step-5-activate-the-google-sheets-connection-github-actions)
   - ✓ No terminal required
   - ✓ Just click a few buttons
   - ✓ Takes 2-3 minutes
   - 📖 [Quick Reference Guide](./STEP5_QUICK_REFERENCE.md)

5. **STEP 6:** [Test Your Connection](./GOOGLE_SHEETS_SETUP.md#step-6-test-your-connection)

### Documentation

- **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)** - Complete step-by-step guide for all 5 steps
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Checkbox checklist to track your progress
- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** - Detailed GitHub Actions and secrets configuration
- **[STEP5_QUICK_REFERENCE.md](./STEP5_QUICK_REFERENCE.md)** - Quick reference for Step 5 activation
- **[.github/README.md](./.github/README.md)** - Information about GitHub Actions workflows

### What you'll need

- A Google Sheet with required tabs (PRODUCTS, Categories, BRANDS, PROPERTIES, LEGAL, OUTPUT)
- Google Cloud Project with Service Account
- Supabase project (for server-side configuration)
- GitHub repository with proper secrets configured (for GitHub Actions activation)

### Configuration

After setup, configure your connection in the **Admin** panel:
- Set sheet tab names to match your Google Sheet
- Manage categories and properties
- Configure dropdown values
- Test the connection

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
