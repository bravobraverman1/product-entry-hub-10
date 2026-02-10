# 📸 Visual Setup Guide

This guide provides detailed, step-by-step instructions with descriptions of what you'll see at each step. Perfect for users who want extra clarity!

---

## 🎯 Part 1: Finding Your Supabase Credentials

### Step 1: Go to Supabase Dashboard

1. Open your web browser
2. Go to: **https://supabase.com/dashboard**
3. Log in with your Supabase account

**What you'll see:**
- A list of your Supabase projects
- Each project shows as a card with the project name

### Step 2: Select Your Project

1. Click on the project you want to use
2. You'll be taken to the project dashboard

**What you'll see:**
- Project name at the top
- Left sidebar with menu items (Table Editor, SQL Editor, Database, etc.)
- Main dashboard area

### Step 3: Open Project Settings

1. Look at the left sidebar
2. Click the **⚙️ Settings** icon (usually near the bottom)
3. Click **API** in the settings submenu

**What you'll see:**
- Settings page with multiple sections
- "Project API keys" section
- "Configuration" section

### Step 4: Copy Your Credentials

You need THREE pieces of information:

#### A. Project URL

**Location:** Configuration section → "URL"

**What it looks like:**
```
https://oqaodtatfzcibpfmhejl.supabase.co
```

**How to copy:**
1. Find the URL field
2. Click the 📋 copy icon next to it
3. Paste somewhere safe (Notepad/TextEdit)

#### B. Publishable (anon) Key

**Location:** Project API keys section → "anon" / "public" key

**What it looks like:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xYW9kdGF0ZnpjaWJwZm1oZWpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NzQyMzQ1NjcsImV4cCI6MTk4OTgxMDU2N30.abcdefghijklmnopqrstuvwxyz123456789
```
(This is an example - your key will be different and MUCH longer)

**How to copy:**
1. Find the "anon" or "public" key row
2. Click "Reveal" if the key is hidden
3. Click the 📋 copy icon
4. Paste somewhere safe

**⚠️ IMPORTANT:** 
- Copy the **anon** key (NOT the service_role key)
- The key should start with `eyJ`
- It's very long (200+ characters)

#### C. Project Reference ID

**Location:** Settings → General → "Reference ID"

**What it looks like:**
```
oqaodtatfzcibpfmhejl
```
(20 characters, lowercase letters and numbers)

**How to copy:**
1. Click **General** in the settings sidebar (instead of API)
2. Find "Reference ID" in the General Settings section
3. Click the 📋 copy icon
4. Paste somewhere safe

---

## 🚀 Part 2: Running the Setup Script

### Step 1: Open Terminal

**On Windows:**
1. Press `Windows Key + R`
2. Type: `cmd`
3. Press Enter

**What you'll see:**
- A black window with text
- A prompt that looks like: `C:\Users\YourName>`

**On Mac:**
1. Press `Command + Space`
2. Type: `terminal`
3. Press Enter

**What you'll see:**
- A window with text
- A prompt that looks like: `username@macbook ~ %`

**On Linux:**
1. Press `Ctrl + Alt + T`

**What you'll see:**
- Terminal window
- A prompt with your username

### Step 2: Navigate to Project Directory

**Type this command** (replace with your actual path):

**On Windows:**
```bash
cd C:\Users\YourName\Documents\product-entry-hub-10
```

**On Mac/Linux:**
```bash
cd /Users/YourName/Documents/product-entry-hub-10
```

**Press Enter**

**What you'll see:**
- The prompt changes to show your project directory
- Example: `C:\...\product-entry-hub-10>`

**How to find your path:**
1. Open File Explorer (Windows) or Finder (Mac)
2. Navigate to the project folder
3. Click in the address bar and copy the path

### Step 3: Run Setup Command

**Type this command:**
```bash
npm run setup
```

**Press Enter**

**What you'll see:**
```
======================================================================
  🚀 Product Entry Hub - Supabase Configuration Setup
======================================================================

This setup wizard will help you configure your Supabase project.
No manual code editing required!

📋 Before you start, have these ready:

  1. Your Supabase Project URL
     Example: https://oqaodtatfzcibpfmhejl.supabase.co
     Find it: Supabase Dashboard → Project Settings → API

  2. Your Supabase Publishable (anon) Key
     Find it: Supabase Dashboard → Project Settings → API

  3. Your Supabase Project Reference ID
     Find it: Supabase Dashboard → Project Settings → General

----------------------------------------------------------------------

📌 Step 1: Enter your Supabase Project URL
   (Example: https://oqaodtatfzcibpfmhejl.supabase.co)

Supabase URL: 
```

The script is waiting for your input!

### Step 4: Enter Your Supabase URL

1. Go back to where you saved your Supabase URL
2. **Copy** the URL (Ctrl+C or Cmd+C)
3. Go back to the terminal
4. **Paste** the URL (Right-click → Paste, or Ctrl+V, or Cmd+V)
5. **Press Enter**

**What you'll see:**
```
Supabase URL: https://oqaodtatfzcibpfmhejl.supabase.co
   ✓ Valid URL. Detected Project Ref: oqaodtatfzcibpfmhejl

📌 Step 2: Enter your Supabase Publishable (anon) Key
   (A long string starting with "eyJ...")

Publishable Key: 
```

### Step 5: Enter Your Publishable Key

1. Go back to where you saved your anon key
2. **Copy** the entire key (it's very long!)
3. Go back to the terminal
4. **Paste** the key
5. **Press Enter**

**What you'll see:**
```
Publishable Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBh...
   ✓ Valid key format

📌 Step 3: Confirm your Project Reference ID
   (We detected: oqaodtatfzcibpfmhejl)

Is "oqaodtatfzcibpfmhejl" correct? (Y/n): 
```

### Step 6: Confirm Project Reference

**If the detected ID is correct:**
1. Type: `Y`
2. Press Enter

**If it's wrong (rare):**
1. Type: `n`
2. Press Enter
3. Paste your correct Project Reference ID
4. Press Enter

**What you'll see:**
```
   ✓ Using detected project reference

💾 Saving configuration...

   ✓ Created .env file
   ✓ Updated supabase/config.toml

======================================================================
  ✅ Configuration Complete!
======================================================================

Your Supabase project is now configured:

  • Project URL: https://oqaodtatfzcibpfmhejl.supabase.co
  • Project Ref: oqaodtatfzcibpfmhejl
  • API Key: Configured ✓

📋 NEXT STEPS:

1️⃣  Start the development server:
   npm run dev

2️⃣  Set up Google Sheets Integration (if needed):
   Follow the guide at: ./GOOGLE_SHEETS_SETUP.md

3️⃣  Configure GitHub Secrets for deployments:
   Go to: GitHub → Settings → Secrets and variables → Actions
   Add these secrets:
   • SUPABASE_PROJECT_REF = oqaodtatfzcibpfmhejl
   • SUPABASE_ACCESS_TOKEN = (from https://supabase.com/dashboard/account/tokens)
   • SUPABASE_DB_PASSWORD = (your database password)

4️⃣  Deploy Edge Functions (if using Google Sheets):
   GitHub → Actions → "Deploy Google Sheets Connection" → Run workflow

💡 TIP: All configuration is saved in the .env file.
   Keep this file secure and never commit it to version control!

======================================================================
```

**Success!** Your configuration is complete.

---

## 🎮 Part 3: Starting the Application

### Step 1: Start Dev Server

**In the same terminal, type:**
```bash
npm run dev
```

**Press Enter**

**What you'll see:**
```
  VITE v5.4.19  ready in 532 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Success!** The server is running.

### Step 2: Open in Browser

1. Open your web browser (Chrome, Firefox, Safari, Edge)
2. Go to: **http://localhost:5173/**

**What you'll see:**
- The Product Entry Hub application
- Navigation menu at the top: Products | Admin
- The Products page by default

### Step 3: Verify Configuration

1. Click the **Admin** tab at the top
2. Scroll down to find **"Google Sheets Connection"** section
3. Look for the **"Project Check (Important)"** box

**What you should see:**
```
Project Check (Important)
Verify your Supabase project configuration before testing the connection.

Supabase URL: https://oqaodtatfzcibpfmhejl.supabase.co
Project Ref: oqaodtatfzcibpfmhejl
Publishable Key: ✓ Detected
```

**✅ If you see YOUR project URL and Ref:** Success! Configuration is correct.

**❌ If you see different/wrong values:**
1. Stop the dev server (press `Ctrl+C` in terminal)
2. Delete the `.env` file from the project folder
3. Run `npm run setup` again
4. Make sure you paste the correct values
5. Start dev server again: `npm run dev`
6. Refresh browser with `Ctrl+F5` (or `Cmd+Shift+R` on Mac)

---

## 📱 What Each Part of the Interface Looks Like

### Products Tab

**What you'll see:**
- **SKU Selector** at the top - dropdown to select a product
- **Product Form** below - fields for entering product data
- **Categories** section - expandable tree to select product category
- **Save Button** at the bottom

### Admin Tab

**What you'll see:**
- **Google Sheets Connection** - test and configure connection
- **Project Check** box - shows your Supabase configuration
- **Sheet Tab Names** - configure Google Sheet tab names
- **Categories Management** - add/edit/delete categories
- **LEGAL Values** - manage dropdown options
- **Filter Rules** - configure field visibility

---

## 🔧 Troubleshooting Visual Guide

### Problem: Terminal says "command not found"

**What you see:**
```
'npm' is not recognized as an internal or external command
```

**Solution:**
1. You need to install Node.js first
2. Go to: https://nodejs.org/
3. Download the LTS (recommended) version
4. Run the installer
5. Restart your terminal
6. Try again

---

### Problem: "Cannot find module"

**What you see:**
```
Error: Cannot find module '/path/to/setup-supabase.js'
```

**Solution:**
1. Make sure you're in the correct directory
2. Check current directory: type `pwd` (Mac/Linux) or `cd` (Windows)
3. Navigate to project: `cd /path/to/product-entry-hub-10`
4. Install dependencies first: `npm install`
5. Try `npm run setup` again

---

### Problem: Port 5173 already in use

**What you see:**
```
Error: Port 5173 is already in use
```

**Solution:**
1. Another process is using that port
2. Close any other instances of the app
3. Or use a different port: `npm run dev -- --port 3000`
4. Then go to: http://localhost:3000/

---

### Problem: Wrong project showing in Admin panel

**What you see:**
- Admin panel shows old project ID
- URL doesn't match your project

**Solution:**
1. **Stop the server** - In terminal, press `Ctrl+C`
2. **Delete .env** - In project folder, delete the `.env` file
3. **Run setup again** - `npm run setup` and enter correct values
4. **Clear browser cache**:
   - Chrome/Firefox: Press `Ctrl+Shift+Delete`
   - Select "Cached images and files"
   - Click "Clear data"
5. **Restart server** - `npm run dev`
6. **Hard refresh browser** - `Ctrl+F5` (or `Cmd+Shift+R` on Mac)

---

## 📚 Next Steps

After successful setup:

1. **Read** [QUICK_START.md](./QUICK_START.md) for overview
2. **Configure** Google Sheets integration (optional) - [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)
3. **Set up** Edge Functions - [EDGE_FUNCTIONS_SETUP.md](./EDGE_FUNCTIONS_SETUP.md)
4. **Start** entering product data!

---

## 🆘 Still Having Issues?

If you're still stuck:

1. **Check all steps above** - make sure you didn't skip anything
2. **Read error messages carefully** - they often tell you what's wrong
3. **Try manual setup** - see [SETUP.md](./SETUP.md) for alternative method
4. **Check troubleshooting sections** in other guide files

**Common mistakes:**
- ❌ Not installing Node.js first
- ❌ Wrong directory in terminal
- ❌ Copying service_role key instead of anon key
- ❌ Not restarting dev server after config changes
- ❌ Browser cache showing old configuration

---

**Ready to start?** Go to [Part 1](#-part-1-finding-your-supabase-credentials)! 🚀
