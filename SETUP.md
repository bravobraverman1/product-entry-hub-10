# 🚀 Quick Start Setup Guide

This guide will help you set up the Product Entry Hub application **without touching any code**. Just follow these simple steps!

---

## 📋 What You'll Need

Before starting, gather these items from your Supabase project:

1. **Supabase Project URL** - Example: `https://oqaodtatfzcibpfmhejl.supabase.co`
2. **Supabase Publishable Key** - A long string starting with `eyJ...`
3. **Supabase Project Reference** - Example: `oqaodtatfzcibpfmhejl`

### Where to Find These:

1. Open your browser and go to: **https://supabase.com/dashboard**
2. Click on your project
3. Click the **Settings** icon (⚙️) in the left sidebar
4. Click **API** in the settings menu

You'll see:
- **Project URL** - Copy this entire URL
- **Project API keys** section - Copy the **anon** / **public** key (NOT the service_role key)

5. Now click **General** in the settings menu
6. Find **Reference ID** - Copy this

---

## ✨ Method 1: Automated Setup (Recommended)

This is the **easiest way** - the script asks you questions and sets everything up automatically!

### Step 1: Open Terminal

**On Windows:**
- Press `Windows + R`
- Type `cmd` and press Enter

**On Mac:**
- Press `Command + Space`
- Type `terminal` and press Enter

**On Linux:**
- Press `Ctrl + Alt + T`

### Step 2: Navigate to Project

In the terminal, type this command and press Enter:
```bash
cd /path/to/product-entry-hub-10
```

Replace `/path/to/product-entry-hub-10` with the actual location where you downloaded this project.

### Step 3: Run Setup Script

Copy this command and paste it into terminal, then press Enter:

```bash
npm run setup
```

### Step 4: Answer the Questions

The script will ask you three questions. Just **paste** the values you gathered earlier:

1. **"Supabase URL:"** → Paste your Project URL and press Enter
   - Example: `https://oqaodtatfzcibpfmhejl.supabase.co`

2. **"Publishable Key:"** → Paste your anon key and press Enter
   - Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (very long string)

3. **"Is 'xxx' correct?"** → Type `Y` and press Enter (or `n` to enter manually)

### Step 5: Done! ✅

The script will:
- ✓ Create your `.env` file
- ✓ Update configuration files
- ✓ Show you what to do next

**That's it!** Your Supabase is now configured.

---

## 📝 Method 2: Manual Setup (If Automated Setup Doesn't Work)

If you prefer to do it manually or the automated setup fails:

### Step 1: Create .env File

1. Open the project folder in your file explorer
2. Look for a file named `.env.example`
3. Right-click on `.env.example` and select **"Copy"**
4. Right-click in empty space and select **"Paste"**
5. Rename the copied file from `.env.example` to `.env` (remove the `.example` part)

### Step 2: Edit .env File

1. Right-click on the `.env` file
2. Select **"Open with"** → Choose **"Notepad"** (Windows) or **"TextEdit"** (Mac)
3. You'll see three lines that look like this:

```
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PROJECT_ID="your-project-ref"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here"
```

4. Replace the placeholder values:
   - Replace `https://your-project-ref.supabase.co` with YOUR Project URL
   - Replace `your-project-ref` with YOUR Project Reference ID
   - Replace `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-key-here` with YOUR anon key

5. **Save the file** (File → Save or Ctrl+S / Cmd+S)
6. **Close Notepad/TextEdit**

### Step 3: Update Supabase Config (Optional but Recommended)

1. In the project folder, open the `supabase` folder
2. Right-click on `config.toml` and open it with Notepad/TextEdit
3. Find the line that says: `project_id = "..."`
4. Replace the value between quotes with YOUR Project Reference ID
5. **Save the file**

---

## 🧪 Test Your Configuration

### Start the Application

In terminal:
```bash
npm run dev
```

Wait a few seconds. You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
```

### Open in Browser

1. Open your web browser (Chrome, Firefox, Safari, etc.)
2. Go to: **http://localhost:5173/**
3. You should see the Product Entry Hub application
4. Click on the **"Admin"** tab at the top
5. Scroll down to **"Google Sheets Connection"** section
6. Look at the **"Project Check"** box

You should see YOUR project URL and reference ID displayed there (not the old ones).

**If you see your correct project information:** ✅ Success!

**If you still see the wrong project:** ⚠️ See Troubleshooting below

---

## 🔧 Troubleshooting

### Problem: "Cannot find module"

**Solution:** Install dependencies first
```bash
npm install
```
Then try `npm run setup` again.

### Problem: Still showing wrong project after setup

**Solution:** Clear browser cache and restart dev server
1. Stop the dev server (press `Ctrl+C` in terminal)
2. In browser, press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
3. Select "Cached images and files" and clear
4. Start dev server again: `npm run dev`
5. Refresh the page with `Ctrl+F5` (or `Cmd+Shift+R` on Mac)

### Problem: ".env file not found"

**Solution:** Make sure you're in the right directory
```bash
# Check if you're in the project root
ls -la

# You should see these files:
# - package.json
# - setup-supabase.js
# - .env.example
```

If you don't see these, navigate to the correct folder first.

### Problem: "Permission denied" on Windows

**Solution:** Run terminal as Administrator
1. Close current terminal
2. Search for "Command Prompt" or "PowerShell"
3. Right-click and select "Run as Administrator"
4. Try setup again

### Problem: .env file not being read

**Solution:** Make sure file is named exactly `.env` (with a dot at the start)
- On Windows, you might need to enable "Show file extensions" in File Explorer
- Make sure it's not named `.env.txt` or `.env.example`

---

## 🎯 Next Steps After Setup

Once your Supabase is configured:

### 1. Set Up Google Sheets Integration

If you need to connect Google Sheets, follow: **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)**

That guide explains:
- ✓ How to create a Google Service Account
- ✓ How to share your sheet
- ✓ How to deploy edge functions
- ✓ How to test the connection

### 2. Configure GitHub Secrets for Deployment

For deploying edge functions via GitHub Actions:

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Add these three secrets:

**Secret 1: SUPABASE_PROJECT_REF**
- Name: `SUPABASE_PROJECT_REF`
- Value: Your project reference (Example: `oqaodtatfzcibpfmhejl`)

**Secret 2: SUPABASE_ACCESS_TOKEN**
- Name: `SUPABASE_ACCESS_TOKEN`
- Value: Get from https://supabase.com/dashboard/account/tokens
  - Click "Generate new token"
  - Give it a name like "GitHub Actions"
  - Copy the token (starts with `sbp_...`)
  - Paste as the secret value

**Secret 3: SUPABASE_DB_PASSWORD**
- Name: `SUPABASE_DB_PASSWORD`
- Value: Your database password (set when you created the project)
  - If you forgot it, you can reset it in Supabase Dashboard → Project Settings → Database

### 3. Deploy Edge Functions (for Google Sheets)

After setting up GitHub secrets:

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click **"Deploy Google Sheets Connection"** in the left sidebar
4. Click **"Run workflow"** button (on the right)
5. Click **"Run workflow"** in the popup
6. Wait 2-3 minutes for it to complete
7. You should see a green checkmark ✓

---

## 🔒 Security Notes

- **Never commit** the `.env` file to GitHub! It contains secret keys.
- The `.env` file is already in `.gitignore` to prevent accidental commits.
- Keep your Publishable Key private - don't share it publicly.
- For production deployments, use Supabase environment variables instead of `.env`.

---

## 📚 Additional Resources

- **[GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)** - Google Sheets integration
- **[SETUP_CHECKLIST.md](./SETUP_CHECKLIST.md)** - Checkbox checklist
- **[GITHUB_ACTIONS_SETUP.md](./GITHUB_ACTIONS_SETUP.md)** - Deployment automation
- **[README.md](./README.md)** - General project information

---

## ❓ Still Need Help?

If you're stuck or something isn't working:

1. Check the error message carefully
2. Try the troubleshooting steps above
3. Make sure you copied the credentials correctly (no extra spaces)
4. Verify your Supabase project is active and accessible
5. Try the manual setup method if automated setup fails

**Common Mistakes:**
- ❌ Copying service_role key instead of anon key
- ❌ Including extra characters when copying (spaces, newlines)
- ❌ File named `.env.txt` instead of `.env`
- ❌ Not restarting the dev server after making changes

---

**Ready to start?** Jump to [Method 1: Automated Setup](#-method-1-automated-setup-recommended) above! 🚀
