# Configuring Supabase in Lovable Cloud

## Understanding the Setup

You have **two environments** that need configuration:

1. **Local Development** (your computer) - uses `.env` file
2. **Lovable Cloud** (deployed app) - uses Lovable's environment variable settings

Both need to point to your custom Supabase project: `oqaodtatfzcibpfmhejl`

---

## 🌩️ STEP 1: Configure Lovable Cloud Environment

### Finding the Cloud Settings

In your Lovable interface:
1. Look for a **"Cloud"** tab or **"Environment"** tab
2. You should see environment variables or settings
3. Look for anything related to "google-sheets" or Supabase configuration

### Update These Lovable Cloud Variables

You need to set/update these environment variables in Lovable:

```
VITE_SUPABASE_PROJECT_ID = oqaodtatfzcibpfmhejl
VITE_SUPABASE_URL = https://oqaodtatfzcibpfmhejl.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY = <YOUR_ACTUAL_KEY_FROM_SUPABASE>
```

### Where to Get Your Publishable Key

1. Go to: https://supabase.com/dashboard/project/oqaodtatfzcibpfmhejl
2. Navigate to: **Settings** → **API**
3. Find **Project API keys** section
4. Copy the **`anon / public`** key (starts with `eyJ`)
5. Paste it into Lovable's cloud settings

### After Updating in Lovable

- **Save** the environment variables in Lovable
- **Redeploy** or **Restart** your application in Lovable (if there's a button)
- The deployed app should now use your custom Supabase project

---

## 💻 STEP 2: Configure Local Development

### Update Your Local .env File

Open the `.env` file in your project and update:

```bash
VITE_SUPABASE_PROJECT_ID="oqaodtatfzcibpfmhejl"
VITE_SUPABASE_PUBLISHABLE_KEY="<SAME_KEY_FROM_ABOVE>"
VITE_SUPABASE_URL="https://oqaodtatfzcibpfmhejl.supabase.co"
```

### Restart Local Dev Server

```bash
# Stop the server (Ctrl+C)
npm run dev
```

---

## 🔍 Verification

### For Lovable Cloud (Deployed App):
1. Open your deployed app URL (from Lovable)
2. Go to the **Admin** page
3. Check the **"Project Check"** section
4. Should show:
   ```
   Supabase URL: https://oqaodtatfzcibpfmhejl.supabase.co
   Project Ref: oqaodtatfzcibpfmhejl
   Publishable Key: ✓ Detected
   ```

### For Local Development:
1. Run: `npm run dev`
2. Open: http://localhost:5173 (or your local URL)
3. Go to **Admin** page
4. Check the same **"Project Check"** section
5. Should show the same correct values

---

## 🎯 Why This Matters

### The Problem You Were Experiencing:
- Lovable's cloud environment was configured with the old project: `osiueywaplycxspbaadh`
- Even though you updated local files, the deployed app uses Lovable's settings
- That's why you kept seeing the wrong project ID

### The Solution:
- **Local .env** → Controls local development environment
- **Lovable Cloud Settings** → Controls deployed/production environment
- Both need to be updated to use your custom Supabase project

---

## 📋 Configuration Checklist

### In Lovable Cloud:
- [ ] Found the Cloud/Environment settings tab
- [ ] Set `VITE_SUPABASE_PROJECT_ID` = `oqaodtatfzcibpfmhejl`
- [ ] Set `VITE_SUPABASE_URL` = `https://oqaodtatfzcibpfmhejl.supabase.co`
- [ ] Set `VITE_SUPABASE_PUBLISHABLE_KEY` = your actual key
- [ ] Saved the settings
- [ ] Redeployed/restarted the app in Lovable
- [ ] Verified deployed app shows correct project

### In Local Development:
- [ ] Updated `.env` file with same values
- [ ] Restarted dev server (`Ctrl+C` then `npm run dev`)
- [ ] Verified local app shows correct project

---

## 🔐 About the Publishable Key

**Important:** The publishable key (anon key) is:
- ✅ Safe to use in frontend code
- ✅ Safe to put in environment variables
- ✅ Different for each Supabase project
- ⚠️ Must match the project URL (they're linked)

**The key from project `osiueywaplycxspbaadh` will NOT work with project `oqaodtatfzcibpfmhejl`**

You MUST get the key from your target project: `oqaodtatfzcibpfmhejl`

---

## 🆘 Troubleshooting

### Still seeing the old project in deployed app?
1. **Double-check Lovable settings** - Make sure you saved the changes
2. **Redeploy** - Some platforms need a manual redeploy after env var changes
3. **Clear browser cache** - The old values might be cached
4. **Check Lovable logs** - See if there are any deployment errors

### Getting "Invalid API Key" errors?
- Your key doesn't match the project URL
- Go back to Supabase dashboard and copy the correct key for `oqaodtatfzcibpfmhejl`

### Local works but deployed doesn't (or vice versa)?
- They use different configurations
- Make sure BOTH are set to the same project and key
- Local uses `.env`, deployed uses Lovable cloud settings

---

## 💡 Best Practice

**Keep them synchronized:**
- Whenever you change Supabase projects, update BOTH:
  1. Local `.env` file
  2. Lovable cloud environment settings

**Document your configuration:**
- Keep a note of which Supabase project you're using
- Save the publishable key somewhere secure (it's safe, but keep track of it)

---

## ✅ Success State

When properly configured, you should see:

**Both locally AND in deployed app:**
```
Project Check (Important)
✓ Supabase URL: https://oqaodtatfzcibpfmhejl.supabase.co
✓ Project Ref: oqaodtatfzcibpfmhejl
✓ Publishable Key: ✓ Detected
```

🎉 Once you see this in both environments, you're all set!
