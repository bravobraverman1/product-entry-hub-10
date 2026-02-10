# Supabase Project Configuration Fixed

## What Was Changed

The application was pointing to the wrong Supabase project. The following files have been updated to use the correct project:

### Files Updated:
1. **`.env`** - Updated project ID, URL, and placeholder for publishable key
2. **`supabase/config.toml`** - Updated project ID
3. **`src/pages/Admin.tsx`** - Updated fallback project ID

### Changes Made:
- ❌ Old Project: `osiueywaplycxspbaadh`
- ✅ New Project: `oqaodtatfzcibpfmhejl`

## ⚠️ ACTION REQUIRED: Update Publishable Key

The `.env` file currently has a placeholder for the publishable key. You need to replace it with your actual key from Supabase.

### Steps to Get Your Publishable Key:

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `oqaodtatfzcibpfmhejl`
3. Navigate to: **Project Settings** → **API**
4. Find the **Project API keys** section
5. Copy the **`anon` / `public`** key (this is your publishable key)
6. Replace `YOUR_PUBLISHABLE_KEY_HERE` in the `.env` file with your actual key

### Update .env File:

```bash
VITE_SUPABASE_PROJECT_ID="oqaodtatfzcibpfmhejl"
VITE_SUPABASE_PUBLISHABLE_KEY="<PASTE_YOUR_ACTUAL_KEY_HERE>"
VITE_SUPABASE_URL="https://oqaodtatfzcibpfmhejl.supabase.co"
```

## Verification

After updating the publishable key, you can verify the configuration:

1. **Run the application**
   ```bash
   npm run dev
   ```

2. **Navigate to the Admin page**

3. **Check the "Project Check" section** - it should now show:
   - Supabase URL: `https://oqaodtatfzcibpfmhejl.supabase.co`
   - Project Ref: `oqaodtatfzcibpfmhejl`
   - Publishable Key: ✓ Detected

4. **Test the connection** - Click the "Test Connection" button

## Additional Configuration

If you're using GitHub Actions for deployment, make sure to also update:

### GitHub Secrets:
Go to: **Repository Settings** → **Secrets and variables** → **Actions**

Update the following secret:
- **`SUPABASE_PROJECT_REF`** = `oqaodtatfzcibpfmhejl`

## Troubleshooting

### If the wrong project still appears:
1. Clear your browser cache and local storage
2. Restart the development server
3. Verify the `.env` file has been saved with your actual publishable key

### If you get authentication errors:
- Make sure the publishable key matches the project `oqaodtatfzcibpfmhejl`
- The key should be a JWT token starting with `eyJ`

### Need help finding your publishable key?
The publishable key is also called the "anon key" or "public key" in Supabase documentation. It's safe to commit to version control as it's meant to be public (unlike service role keys).

## Security Note

The `.env` file is not tracked in git (it's in `.gitignore`), but as a reference, there's now a `.env.example` file that shows the required structure without sensitive values.
