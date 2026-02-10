# ⚠️ ACTION REQUIRED: Complete Supabase Configuration

## Current Status

✅ **What's Been Fixed:**
- All hardcoded project IDs removed
- Configuration is now fully modular
- Project reads from environment variables only

❌ **What You Need to Do:**
- Configure your Supabase project credentials
- Update the `.env` file
- Restart your development server

---

## Why Configuration is Needed

The application needs to connect to your Supabase project. Without configuration:
- ❌ No project URL set
- ❌ No publishable key set
- ❌ Connection tests will fail

---

## ✅ Solution: Complete These Steps

### Step 1: Get Your Supabase Credentials

1. **Go to Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Create a new project OR select your existing project

2. **Navigate to API Settings**
   - Click **Settings** (gear icon in sidebar)
   - Click **API**

3. **Copy These Values:**
   - **Project URL**: Found under "Project URL" (e.g., `https://abcdefg.supabase.co`)
   - **Project Reference ID**: The part before `.supabase.co` (e.g., `abcdefg`)
   - **anon/public key**: Under "Project API keys" - copy the **anon** key (NOT service_role)
     - This is a long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Update Your .env File

Open the `.env` file in your project root and add your credentials:

```bash
VITE_SUPABASE_PROJECT_ID="your-project-ref-id"
VITE_SUPABASE_URL="https://your-project-ref-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example:**
```bash
VITE_SUPABASE_PROJECT_ID="abcdefg123"
VITE_SUPABASE_URL="https://abcdefg123.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmcxMjMiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.abc123..."
```

**Important:** 
- Remove any quotes from your key if you copied them
- The key should be one long string (no line breaks)
- Make sure the Project ID in the URL matches the PROJECT_ID variable
- Save the file

### Step 3: Update supabase/config.toml (Optional)

If you plan to use Supabase CLI or deploy functions:

```toml
project_id = "your-project-ref-id"
```

### Step 4: Verify Your Configuration

Run the configuration checker:

```bash
./check-config.sh
```

Or manually check:
```bash
cat .env
```

Make sure you see your actual project values (not empty strings).

### Step 5: Clear Caches and Restart

**Clear Vite build cache:**
```bash
rm -rf node_modules/.vite
```

**Stop your dev server** (if running):
- Press `Ctrl+C` in the terminal where it's running

**Start the dev server again:**
```bash
npm run dev
```

### Step 6: Clear Browser Cache

In your browser:
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Or do a hard refresh: `Ctrl+F5` (or `Cmd+Shift+R` on Mac)

### Step 7: Verify in Admin Page

1. Open your application: http://localhost:5173 (or your dev server URL)
2. Navigate to the **Admin** page/tab
3. Scroll to **"Project Check (Important)"** section
4. You should see your project details displayed:
   ```
   Supabase URL: https://your-project.supabase.co
   Project Ref: your-project-ref
   Publishable Key: ✓ Detected
   ```

---

## 🔧 Troubleshooting

### Still seeing "Not configured"?

**Check 1: Is the .env file correct?**
```bash
cat .env
```
Should show your actual values, not empty strings or placeholders.

**Check 2: Did you restart the dev server?**
- Vite loads environment variables at startup
- You MUST stop (`Ctrl+C`) and restart (`npm run dev`)
- Just refreshing the browser is not enough

**Check 3: Are you editing the right .env file?**
- It should be in the project root, not in a subdirectory
- Path should be: `/path/to/product-entry-hub-10/.env`

**Check 4: Clear everything and start fresh**
```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### Can't find your Supabase project?

- Make sure you're logged in to the correct Supabase account
- Check https://supabase.com/dashboard for your projects
- If you deleted your old project, create a new one

### Key doesn't work / Getting errors?

**Verify the key matches the project:**
```bash
# This will decode the JWT and show which project it's for
echo "YOUR_KEY_HERE" | cut -d. -f2 | base64 -d | python3 -m json.tool
```

Should show `"ref": "your-project-id"` matching your project.

### Environment variables not loading?

```bash
# Check if they're being read
npm run dev
# Then in another terminal:
curl http://localhost:5173
```

If still not working:
- Make sure .env is in the project root (same level as package.json)
- Check that variable names start with `VITE_` (required for Vite)
- Verify no typos in variable names

---

## 🔄 Switching to a New Supabase Project

If you delete your project and create a new one:

1. **Get new credentials** from the new project (Steps 1-2 above)
2. **Update .env** with new values
3. **Update supabase/config.toml** with new project_id
4. **Restart dev server**
5. **Clear browser cache**

That's it! The application is fully modular and will work with any Supabase project.

---

## 📚 Additional Resources

- **[GET_SUPABASE_KEY.md](./GET_SUPABASE_KEY.md)** - Detailed guide to getting your key
- **[.env.example](./.env.example)** - Template for .env file
- **check-config.sh** - Script to verify your configuration

---

## ✅ Success Checklist

- [ ] Created or selected Supabase project
- [ ] Got project URL, ref ID, and anon key from Supabase dashboard  
- [ ] Updated `.env` file with actual values (not placeholders)
- [ ] Updated `supabase/config.toml` with project_id
- [ ] Ran `./check-config.sh` - all checks pass
- [ ] Cleared Vite cache (`rm -rf node_modules/.vite`)
- [ ] Restarted dev server (`Ctrl+C` then `npm run dev`)
- [ ] Cleared browser cache or hard refresh (`Ctrl+F5`)
- [ ] Admin page shows correct project configuration
- [ ] Publishable Key shows: ✓ Detected

---

**Once all steps are complete, your application will be connected to your Supabase project!**

✅ **What's Been Fixed:**
- Project ID updated from `osiueywaplycxspbaadh` → `oqaodtatfzcibpfmhejl`
- All configuration files updated (`.env`, `supabase/config.toml`, `src/pages/Admin.tsx`)
- Configuration templates created

❌ **What You Need to Do:**
- Get the publishable key from your Supabase project
- Add it to the `.env` file
- Restart your development server

---

## Why You're Still Seeing the Old Project

The application loads environment variables when the development server starts. If you're still seeing the wrong project ID (`osiueywaplycxspbaadh`), it's because:

1. **Missing Publishable Key**: The `.env` has a placeholder `YOUR_PUBLISHABLE_KEY_HERE` - you need the real key
2. **Server Not Restarted**: If your dev server is running, it's using old cached environment variables
3. **Browser Cache**: Your browser may have cached the old configuration

---

## ✅ Solution: Complete These Steps

### Step 1: Get Your Publishable Key

Follow the detailed instructions in **[GET_SUPABASE_KEY.md](./GET_SUPABASE_KEY.md)**

**Quick version:**
1. Go to https://supabase.com/dashboard/project/oqaodtatfzcibpfmhejl
2. Settings → API
3. Copy the **`anon / public`** key (NOT the service_role key)
4. It starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 2: Update Your .env File

Open `.env` and replace the placeholder:

```bash
VITE_SUPABASE_PROJECT_ID="oqaodtatfzcibpfmhejl"
VITE_SUPABASE_PUBLISHABLE_KEY="<PASTE_YOUR_ACTUAL_KEY_HERE>"
VITE_SUPABASE_URL="https://oqaodtatfzcibpfmhejl.supabase.co"
```

**Important:** 
- Remove the quotes from your key if you copied them
- The key should be one long string (no line breaks)
- Save the file

### Step 3: Verify Your Configuration

Run the configuration checker:

```bash
./check-config.sh
```

Or manually check:
```bash
cat .env
```

Make sure you see:
- ✓ Project ID: `oqaodtatfzcibpfmhejl`
- ✓ URL: `https://oqaodtatfzcibpfmhejl.supabase.co`
- ✓ Key: Starts with `eyJ` and is very long

### Step 4: Clear Caches and Restart

**Clear Vite build cache:**
```bash
rm -rf node_modules/.vite
```

**Stop your dev server** (if running):
- Press `Ctrl+C` in the terminal where it's running

**Start the dev server again:**
```bash
npm run dev
```

### Step 5: Clear Browser Cache

In your browser:
1. Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
2. Select "Cached images and files"
3. Click "Clear data"
4. Or do a hard refresh: `Ctrl+F5` (or `Cmd+Shift+R` on Mac)

### Step 6: Verify in Admin Page

1. Open your application: http://localhost:5173 (or your dev server URL)
2. Navigate to the **Admin** page/tab
3. Scroll to **"Project Check (Important)"** section
4. Verify you see:
   ```
   Supabase URL: https://oqaodtatfzcibpfmhejl.supabase.co
   Project Ref: oqaodtatfzcibpfmhejl
   Publishable Key: ✓ Detected
   ```

---

## 🔧 Troubleshooting

### Still seeing `osiueywaplycxspbaadh`?

**Check 1: Is the .env file correct?**
```bash
cat .env
```
Should show `oqaodtatfzcibpfmhejl`, not `osiueywaplycxspbaadh`

**Check 2: Did you restart the dev server?**
- Make sure you stopped (`Ctrl+C`) and restarted (`npm run dev`)
- Don't just refresh the browser - you MUST restart the server

**Check 3: Are you editing the right .env file?**
- It should be in the project root: `/home/runner/work/product-entry-hub-10/product-entry-hub-10/.env`
- Not in a subdirectory

**Check 4: Clear everything and start fresh**
```bash
# Stop dev server (Ctrl+C)
rm -rf node_modules/.vite
rm -rf dist
npm run dev
```

### Can't find the publishable key?

See the detailed guide: **[GET_SUPABASE_KEY.md](./GET_SUPABASE_KEY.md)**

If you don't have access to the Supabase project `oqaodtatfzcibpfmhejl`, you need to:
1. Verify this is your correct project
2. Make sure you're logged in to the right Supabase account
3. Ask the project owner for access if it's not your project

### Key doesn't work / Getting errors?

**Check the key matches the project:**
```bash
# This will decode the JWT and show which project it's for
echo "YOUR_KEY_HERE" | cut -d. -f2 | base64 -d | grep -o '"ref":"[^"]*"'
```

Should output: `"ref":"oqaodtatfzcibpfmhejl"`

If it shows a different ref, you're using the key from the wrong project.

---

## 📚 Additional Resources

- **[GET_SUPABASE_KEY.md](./GET_SUPABASE_KEY.md)** - Detailed guide to getting your key
- **[SUPABASE_CONFIGURATION_UPDATE.md](./SUPABASE_CONFIGURATION_UPDATE.md)** - What was changed
- **[.env.example](./.env.example)** - Template for .env file
- **check-config.sh** - Script to verify your configuration

---

## ✅ Success Checklist

- [ ] Got publishable key from Supabase dashboard
- [ ] Updated `.env` file with actual key
- [ ] Ran `./check-config.sh` - all checks pass
- [ ] Cleared Vite cache (`rm -rf node_modules/.vite`)
- [ ] Restarted dev server (`Ctrl+C` then `npm run dev`)
- [ ] Cleared browser cache or hard refresh (`Ctrl+F5`)
- [ ] Admin page shows correct project: `oqaodtatfzcibpfmhejl`
- [ ] Publishable Key shows: ✓ Detected

---

**Once all steps are complete, your application will be using the correct Supabase project!**
