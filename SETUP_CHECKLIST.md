# Google Sheets Setup Checklist

Use this checklist to ensure you've completed all steps to link your Google Sheets.

## ✅ Method 1: Google Service Account (Recommended)

### Google Cloud Setup
- [ ] Created a Google Cloud project (or selected existing one)
- [ ] Created a Service Account in Google Cloud Console
- [ ] Downloaded the Service Account JSON key file
- [ ] **Kept the JSON key file secure** (never commit to version control)

### Google Sheets Setup
- [ ] Copied the service account email from JSON file (`client_email` field)
- [ ] Shared your Google Sheet with the service account email as Editor
- [ ] Copied your Google Sheet ID from the URL

### Supabase Configuration
- [ ] Opened Supabase project dashboard
- [ ] Added `GOOGLE_SERVICE_ACCOUNT_KEY` secret (entire JSON key contents)
- [ ] Added `GOOGLE_SHEET_ID` secret (the ID from your sheet URL)
- [ ] Deployed the Edge Function: `supabase functions deploy google-sheets`

### Verification
- [ ] Restarted the application
- [ ] Confirmed actual data loads (not mock data)
- [ ] Tested submitting a product
- [ ] Verified data appears in OUTPUT sheet

---

## ✅ Method 2: Google Apps Script (Alternative)

### Apps Script Setup
- [ ] Opened Google Sheet
- [ ] Created Apps Script project (Extensions → Apps Script)
- [ ] Implemented required API endpoints
- [ ] Deployed as Web App
- [ ] Copied Web App URL

### Application Configuration
- [ ] Opened Admin panel in the application
- [ ] Pasted Web App URL in "Apps Script Web App URL" field
- [ ] Saved Connection Settings
- [ ] Reloaded the application

### Verification
- [ ] Confirmed actual data loads (not mock data)
- [ ] Tested submitting a product
- [ ] Verified data appears in OUTPUT sheet

---

## ✅ Sheet Structure

Verify your Google Sheet has these tabs (names are configurable in Admin panel):

- [ ] **PRODUCTS TO DO** - Products to process (SKU, Brand, Status, Visibility)
- [ ] **Categories** - Category hierarchy paths
- [ ] **BRANDS** - Brand and supplier information
- [ ] **PROPERTIES** - Custom field definitions
- [ ] **LEGAL** - Allowed values for dropdown fields
- [ ] **OUTPUT** - Where completed product data is written
- [ ] **FILTER** (optional) - Field visibility rules per category

---

## ✅ Admin Panel Configuration

- [ ] Configured Connection Settings (if using Method 2)
- [ ] Set Sheet Tab Names to match your actual Google Sheet tabs
- [ ] Verified Categories are loaded correctly
- [ ] Reviewed LEGAL values for dropdown fields
- [ ] Tested the connection by loading a product

---

## 🆘 Troubleshooting

If data isn't loading:

1. **Check Supabase Function Logs** (Method 1)
   - Go to Supabase Dashboard → Edge Functions → google-sheets → Logs
   - Look for error messages

2. **Verify Service Account Permissions** (Method 1)
   - Confirm the service account email has Editor access to your sheet
   - Try accessing the sheet with that email to verify

3. **Test Apps Script Directly** (Method 2)
   - Open the Web App URL in a browser
   - Should return JSON data or error message

4. **Check Browser Console**
   - Open Developer Tools (F12)
   - Look for JavaScript errors or failed API calls

5. **Verify Sheet Structure**
   - Ensure tab names match configuration
   - Confirm header rows are in place
   - Check data starts from row 2

---

## 📚 Resources

- [Complete Setup Guide](./GOOGLE_SHEETS_SETUP.md) - Detailed instructions for both methods
- [Google Cloud Console](https://console.cloud.google.com/) - For service account creation
- [Supabase Dashboard](https://supabase.com/dashboard) - For environment variables and Edge Functions
- [Google Apps Script](https://script.google.com/) - For Apps Script method

---

## 🔒 Security Reminders

- [ ] Service account JSON key is stored **only** in Supabase secrets
- [ ] JSON key is **not** committed to version control
- [ ] Google Sheet permissions are limited to necessary users/accounts
- [ ] Regular key rotation schedule established (recommended: every 90 days)

---

**Need more help?** See the complete documentation in [GOOGLE_SHEETS_SETUP.md](./GOOGLE_SHEETS_SETUP.md)
