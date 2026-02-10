# Placeholder Replacement Guide

## What to Replace

There is **one placeholder** that needs to be replaced with your actual GitHub repository information:

### Placeholder: `{{OWNER}}/{{REPO}}`

Replace with your actual GitHub organization/user and repository name.

**Example:**
- If your repo is: `https://github.com/lightingcompany/product-entry-hub-10`
- Replace `{{OWNER}}/{{REPO}}` with: `lightingcompany/product-entry-hub-10`

---

## Files to Update

### 1. GOOGLE_SHEETS_SETUP.md

**Location:** STEP 5 section, under "How to activate (click-only steps)"

**Current:**
```
https://github.com/{{OWNER}}/{{REPO}}
```

**Replace with:**
```
https://github.com/YOUR_GITHUB_ORG/product-entry-hub-10
```

**Also in the HTML button:**
```html
<a href="https://github.com/{{OWNER}}/{{REPO}}" ...>
```

Replace the `href` with your actual repository URL.

---

### 2. STEP5_QUICK_REFERENCE.md

**Location:** "Activate the Connection (Anytime)" section, step 1

**Current:**
```
Go to your GitHub repository
- Go to your GitHub repository
- Go to https://github.com/{{OWNER}}/{{REPO}}
```

**Replace with:**
```
- Go to https://github.com/YOUR_GITHUB_ORG/product-entry-hub-10
```

---

## How to Find These in Your Editor

### Using VS Code Find & Replace:

1. Press `Ctrl+H` (or `Cmd+H` on Mac)
2. In "Find" field, enter: `{{OWNER}}/{{REPO}}`
3. In "Replace" field, enter: `lightingcompany/product-entry-hub-10`
   - Replace `lightingcompany` with your actual GitHub org/user
4. Click "Replace All"

### Manual Method:

Search for the files and manually update:
- GOOGLE_SHEETS_SETUP.md (line ~129)
- STEP5_QUICK_REFERENCE.md (line ~46)

---

## Verification

After replacing:

1. Open GOOGLE_SHEETS_SETUP.md
2. Go to STEP 5 section
3. Verify the GitHub links show your actual repository
4. Click the link to verify it works

---

## Common Values

**If your repository is at:** `https://github.com/lightingcompany/product-entry-hub-10`

Then replace `{{OWNER}}/{{REPO}}` with: **`lightingcompany/product-entry-hub-10`**

---

That's it! No other placeholders need to be replaced.
