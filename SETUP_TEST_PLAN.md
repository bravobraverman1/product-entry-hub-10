# Setup Verification Test Plan

## ✅ Pre-Setup Verification

### 1. Check Initial State
```bash
# Current .env should have empty values
cat .env
# Expected: All values are ""

# Check config checker works
./check-config.sh
# Expected: Shows all values as "not set"
```

### 2. Verify Project Structure
```bash
# Essential files exist
ls -la .env .env.example package.json
ls -la src/pages/Admin.tsx
ls -la supabase/config.toml
ls -la check-config.sh

# Documentation exists
ls -la COMPLETE_SETUP.md QUICKSTART.txt GET_SUPABASE_KEY.md
```

## ✅ Setup Process Test

### Step 1: Get Supabase Credentials

**User Actions:**
1. Go to https://supabase.com/dashboard
2. Create/select project
3. Go to Settings → API
4. Copy three values:
   - Project URL: `https://xxxxx.supabase.co`
   - Project Ref: `xxxxx`
   - anon key: `eyJ...`

**Test Values (for verification):**
- Project ID: `testproject123`
- URL: `https://testproject123.supabase.co`
- Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0MTIzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.test123`

### Step 2: Update .env File

**User Actions:**
```bash
# Edit .env file
nano .env  # or vi, or your editor

# Add values (without extra quotes):
VITE_SUPABASE_PROJECT_ID="testproject123"
VITE_SUPABASE_URL="https://testproject123.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3Rwcm9qZWN0MTIzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.test123"

# Save and exit
```

**Verification:**
```bash
cat .env
# Should show your values (not empty strings)
```

### Step 3: Verify Configuration

**User Actions:**
```bash
./check-config.sh
```

**Expected Output:**
```
==================================
Supabase Configuration Checker
==================================

✓ .env file found

Current Configuration:
-----------------------------------
Project ID: testproject123
URL: https://testproject123.supabase.co

✓ Project ID is set: testproject123
✓ URL is set and format looks correct
✓ Publishable Key is set (starts with eyJ - looks valid)
   Project ref in key: testproject123
   ✓ Key matches the project ID!

==================================
Next Steps:
==================================
✅ Configuration looks complete!

1. Restart your dev server if it's running:
   - Stop with Ctrl+C
   - Start with: npm run dev
...
```

### Step 4: Update supabase/config.toml (Optional)

**User Actions:**
```bash
# Edit supabase/config.toml
nano supabase/config.toml

# Update project_id:
project_id = "testproject123"

# Save and exit
```

### Step 5: Start Dev Server

**User Actions:**
```bash
# If server is running, stop it first
# Press Ctrl+C

# Clear any cached builds
rm -rf node_modules/.vite

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:8080/
➜  Network: use --host to expose
```

### Step 6: Verify in Browser

**User Actions:**
1. Open browser: http://localhost:8080
2. Navigate to Admin page
3. Scroll to "Project Check (Important)" section

**Expected Display:**

When **NOT configured** (empty .env):
```
⚠️ Supabase Not Configured

Your Supabase project is not configured. Follow these steps:
1. Create or select your Supabase project at supabase.com/dashboard
2. Get your project URL and anon key from: Settings → API
3. Update your local .env file with your credentials
4. Restart your dev server (Ctrl+C then npm run dev)

See: COMPLETE_SETUP.md or QUICKSTART.txt for detailed instructions
```

When **properly configured**:
```
Project Check (Important)
Verify your Supabase project configuration before testing the connection.

Supabase URL: https://testproject123.supabase.co
Project Ref: testproject123
Publishable Key: ✓ Detected
```

## ✅ Post-Setup Verification

### 1. Test Connection Button (if using real Supabase project)
```
Click "Test Connection" button
- Should attempt to connect to edge function
- May show error if edge function not deployed (that's OK for now)
- Should NOT show old project ID anywhere
```

### 2. Verify No Hardcoded Values
```bash
# Search source code for old project IDs
grep -r "osiueywaplycxspbaadh\|oqaodtatfzcibpfmhejl" \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  --exclude-dir=node_modules

# Should only find matches in .md documentation files
```

### 3. Test Project Switching
```bash
# Update .env with different project
# Edit values to newproject456
# Save and restart dev server
# Check Admin page shows new project
```

## ✅ Common Issues & Solutions

### Issue 1: Config checker shows "not set" after updating .env
**Solution:**
- Make sure .env is saved
- Check .env is in project root (same dir as package.json)
- Run `cat .env` to verify values are there

### Issue 2: Admin page still shows "Not Configured"
**Solution:**
- Restart dev server (Ctrl+C then npm run dev)
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)

### Issue 3: Project ID mismatch warning
**Solution:**
- Make sure VITE_SUPABASE_PROJECT_ID matches the ref in VITE_SUPABASE_URL
- Make sure publishable key is from the same project

### Issue 4: Key doesn't start with "eyJ"
**Solution:**
- You might have copied the service_role key instead
- Go back to Supabase and copy the "anon" or "public" key

## ✅ Success Criteria

Setup is successful when:

- [ ] `.env` file contains your actual Supabase credentials
- [ ] `./check-config.sh` shows all green checkmarks
- [ ] Dev server starts without errors
- [ ] Admin page displays your project URL and ref correctly
- [ ] Admin page shows "✓ Detected" for publishable key
- [ ] No old project IDs visible anywhere
- [ ] Can switch to different project by updating .env

## 📋 Quick Reference Commands

```bash
# Check current configuration
cat .env

# Verify configuration
./check-config.sh

# Start dev server
npm run dev

# Stop dev server
# Press Ctrl+C

# Clear cache and restart
rm -rf node_modules/.vite && npm run dev

# Search for hardcoded values
grep -r "osiueywaplycxspbaadh" --include="*.ts" --exclude-dir=node_modules
```

## 🎯 End Result

After successful setup:
- Application connects to YOUR Supabase project
- No hardcoded project IDs anywhere
- Easy to switch projects in the future
- Clear instructions for team members
- Self-documenting configuration system
