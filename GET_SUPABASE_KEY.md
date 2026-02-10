# How to Get Your Supabase Publishable Key

## Quick Steps

This guide shows you how to get your Supabase publishable key (anon key) for any project.

### 1. Go to Supabase Dashboard
Visit: https://supabase.com/dashboard

Select your project from the list (or create a new one if needed)

### 2. Navigate to API Settings
- Click on **Settings** (gear icon in sidebar)
- Click on **API**

### 3. Find Your Publishable Key
Look for the section titled **Project API keys**

You'll see two keys:
- **`anon` / `public`** ← This is your **publishable key** (safe to use in frontend)
- **`service_role`** ← Do NOT use this one (it's for backend only)

### 4. Copy All Three Values

From the API page, copy:
1. **Project URL** - Example: `https://abcd1234.supabase.co`
2. **Project Reference ID** - Example: `abcd1234` (the part before .supabase.co)
3. **anon/public key** - Click the copy icon next to the **`anon`** key
   - It will look something like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 5. Update Your .env File

Open the `.env` file in your project root and add your values:

```bash
VITE_SUPABASE_PROJECT_ID="your-project-ref"
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Example with sample values:**
```bash
VITE_SUPABASE_PROJECT_ID="abcd1234"
VITE_SUPABASE_URL="https://abcd1234.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2QxMjM0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.example"
```

**Important:**
- Make sure the Project ID matches between the URL and PROJECT_ID variable
- The key should be one long string (no line breaks)
- Save the file

### 6. Verify Your Configuration

Run the configuration checker:

```bash
./check-config.sh
```

This will verify all values are set correctly and match each other.

### 7. Restart Your Development Server

**Important:** Environment variables are loaded when Vite starts, so you must restart:

```bash
# Stop your dev server (Ctrl+C if running)
# Then start it again:
npm run dev
```

### 8. Verify in the Application

1. Open your application in the browser
2. Navigate to the **Admin** page
3. Look at the **"Project Check"** section
4. You should now see your project details:
   ```
   Supabase URL: https://your-project.supabase.co
   Project Ref: your-project-ref
   Publishable Key: ✓ Detected
   ```

## Troubleshooting

### Still seeing "Not Configured"?
1. **Clear browser cache:**
   - Press `Ctrl+Shift+Delete` (or `Cmd+Shift+Delete` on Mac)
   - Clear cached images and files
   - Reload the page with `Ctrl+F5` (hard refresh)

2. **Clear Vite cache:**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

3. **Check your .env file is saved:**
   - Make sure you saved the file after updating
   - Verify the key is on one line (no line breaks)

4. **Verify no environment override:**
   - Check if you have environment variables set in your terminal
   - On Windows: `set | findstr VITE_SUPABASE`
   - On Mac/Linux: `env | grep VITE_SUPABASE`

### Can't access the Supabase dashboard?
- Make sure you're logged in to the Supabase account that owns the project
- The project reference `oqaodtatfzcibpfmhejl` should match your intended project

### Key looks wrong or doesn't work?
- The publishable key is a JWT token (starts with `eyJ`)
- It should be quite long (several hundred characters)
- Make sure you copied the entire key
- Don't add any quotes or spaces beyond what's in the .env format

## What This Key Does

The publishable key (anon key):
- ✅ Safe to use in frontend code
- ✅ Allows read/write based on your Row Level Security (RLS) policies
- ✅ Can be committed to version control (though we keep it in .env for flexibility)
- ❌ Does NOT give admin access to your database

## Security Note

Unlike the service role key, the publishable key is meant to be public. It only provides access that you've explicitly allowed through Supabase's Row Level Security policies.
