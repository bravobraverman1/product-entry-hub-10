# Finding Supabase Settings in Lovable

## Where to Look in Lovable Interface

Lovable typically provides environment variable configuration in one of these locations:

### Option 1: Cloud Tab
```
Lovable Interface
└── Your Project
    └── Cloud (tab)  ← Look here first
        └── Environment Variables
            └── Add/Edit Variables
```

### Option 2: Settings Tab
```
Lovable Interface
└── Your Project
    └── Settings (tab)
        └── Environment
            └── Environment Variables
```

### Option 3: Deploy/Build Settings
```
Lovable Interface
└── Your Project
    └── Deploy or Build (tab)
        └── Environment Configuration
```

---

## What You're Looking For

You should see a section labeled one of these:
- **"Environment Variables"**
- **"Environment Configuration"**
- **"Env Vars"**
- **"Configuration"**
- **"Secrets"** (less common for frontend vars)

### Current (Wrong) Configuration

You might see existing variables like:
```
VITE_SUPABASE_PROJECT_ID = osiueywaplycxspbaadh  ❌
VITE_SUPABASE_URL = https://osiueywaplycxspbaadh.supabase.co  ❌
```

Or you might see:
- A reference to "google-sheets" 
- Supabase integration settings
- API configuration

---

## What to Change

### Variables to Update/Add:

| Variable Name | New Value |
|--------------|-----------|
| `VITE_SUPABASE_PROJECT_ID` | `oqaodtatfzcibpfmhejl` |
| `VITE_SUPABASE_URL` | `https://oqaodtatfzcibpfmhejl.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Get from Supabase dashboard ⬇️ |

### Getting Your Publishable Key:

1. Go to: https://supabase.com/dashboard/project/oqaodtatfzcibpfmhejl
2. Click: **Settings** (gear icon)
3. Click: **API**
4. Find: **Project API keys**
5. Copy: The **`anon / public`** key (long string starting with `eyJ`)

---

## Step-by-Step in Lovable

### 1. Find the Environment Variables Section
- Open your project in Lovable
- Look for "Cloud", "Settings", or "Deploy" tab
- Find "Environment Variables" or similar

### 2. Edit or Add Each Variable

**For VITE_SUPABASE_PROJECT_ID:**
- If it exists: Click **Edit** or pencil icon
- If it doesn't exist: Click **Add Variable** or **+ New**
- Name: `VITE_SUPABASE_PROJECT_ID`
- Value: `oqaodtatfzcibpfmhejl`
- Save

**For VITE_SUPABASE_URL:**
- Name: `VITE_SUPABASE_URL`
- Value: `https://oqaodtatfzcibpfmhejl.supabase.co`
- Save

**For VITE_SUPABASE_PUBLISHABLE_KEY:**
- Name: `VITE_SUPABASE_PUBLISHABLE_KEY`
- Value: Paste your actual key from Supabase (starts with `eyJ`)
- Save

### 3. Save and Redeploy

- Click **Save** or **Apply** to save the environment variables
- Look for a **Deploy**, **Redeploy**, or **Restart** button
- Click it to apply the changes
- Wait for the deployment to complete (usually 1-3 minutes)

### 4. Verify the Changes

- Open your deployed app URL (from Lovable)
- Navigate to the **Admin** page
- Scroll to **"Project Check (Important)"**
- Should now show:
  ```
  Supabase URL: https://oqaodtatfzcibpfmhejl.supabase.co
  Project Ref: oqaodtatfzcibpfmhejl
  Publishable Key: ✓ Detected
  ```

---

## Common Lovable Interface Patterns

### Pattern 1: Inline Editing
```
┌─────────────────────────────────────────────┐
│ Environment Variables                       │
├─────────────────────────────────────────────┤
│ Name: VITE_SUPABASE_URL                    │
│ Value: [...........................]  [Edit]│
│                                             │
│ Name: VITE_SUPABASE_PUBLISHABLE_KEY        │
│ Value: [...........................]  [Edit]│
└─────────────────────────────────────────────┘
```

### Pattern 2: Modal/Dialog Editing
```
Click "Add Variable" → Modal opens:
┌──────────────────────────┐
│ Add Environment Variable │
├──────────────────────────┤
│ Key:   [................]│
│ Value: [................]│
│        [Cancel]  [Save]  │
└──────────────────────────┘
```

### Pattern 3: Key-Value List
```
┌──────────────────────────────────────┐
│ VITE_SUPABASE_PROJECT_ID = osiu...  │ [×]
│ VITE_SUPABASE_URL = https://...     │ [×]
│ [+ Add Variable]                     │
└──────────────────────────────────────┘
```

---

## If You Can't Find Environment Variables in Lovable

### Option A: Check Lovable Documentation
- Look for their documentation on environment variables
- Search for "environment variables" or "env vars"

### Option B: Check Lovable Support
- Contact Lovable support
- Ask: "How do I configure environment variables for my React app?"

### Option C: Alternative Configuration
Some platforms integrate directly with Supabase:
- Look for "Integrations" or "Supabase" settings
- You might be able to connect your Supabase project directly

---

## 🎯 Expected Outcome

After updating in Lovable and redeploying:

✅ Deployed app shows: `oqaodtatfzcibpfmhejl`  
✅ Admin page displays correct project  
✅ Connection test works  

---

## 📸 Take a Screenshot

If you can, take a screenshot of:
1. The Lovable environment variables section (before changes)
2. The Admin page showing the wrong project
3. The Admin page showing the correct project (after changes)

This helps verify the fix worked!

---

## Need Help?

If you can't find where to set environment variables in Lovable:
1. Check what you see in the "Cloud" tab
2. Look for any section mentioning "google-sheets" 
3. Share what options/tabs you see in Lovable

We can guide you to the exact location based on your Lovable interface.
