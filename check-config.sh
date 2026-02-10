#!/bin/bash

# Supabase Configuration Checker
# This script helps verify your .env configuration

echo "=================================="
echo "Supabase Configuration Checker"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ ERROR: .env file not found!"
    echo "   Please create a .env file in the project root."
    echo "   See .env.example for the required format."
    exit 1
fi

echo "✓ .env file found"
echo ""

# Read .env values
source .env

echo "Current Configuration:"
echo "-----------------------------------"
echo "Project ID: ${VITE_SUPABASE_PROJECT_ID:-<not set>}"
echo "URL: ${VITE_SUPABASE_URL:-<not set>}"
echo ""

# Check if values are set
if [ -z "$VITE_SUPABASE_PROJECT_ID" ]; then
    echo "❌ Project ID is not set"
    echo "   You need to add your Supabase project reference ID"
else
    echo "✓ Project ID is set: $VITE_SUPABASE_PROJECT_ID"
fi

if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ URL is not set"
    echo "   You need to add your Supabase project URL"
elif [[ "$VITE_SUPABASE_URL" =~ ^https://[a-z0-9-]+\.supabase\.co$ ]]; then
    echo "✓ URL is set and format looks correct"
    
    # Extract project ref from URL
    URL_PROJECT_REF=$(echo "$VITE_SUPABASE_URL" | grep -oP 'https://\K[^.]+')
    
    if [ -n "$VITE_SUPABASE_PROJECT_ID" ] && [ "$URL_PROJECT_REF" != "$VITE_SUPABASE_PROJECT_ID" ]; then
        echo "⚠️  WARNING: Project ID in URL ($URL_PROJECT_REF) doesn't match VITE_SUPABASE_PROJECT_ID ($VITE_SUPABASE_PROJECT_ID)"
        echo "   These should match. Update one to match the other."
    fi
else
    echo "⚠️  URL format looks incorrect"
    echo "   Expected format: https://your-project-ref.supabase.co"
    echo "   Got: $VITE_SUPABASE_URL"
fi

if [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "❌ Publishable Key is not set"
    echo "   You need to get your anon key from Supabase dashboard"
    echo "   See: GET_SUPABASE_KEY.md for instructions"
elif [[ "$VITE_SUPABASE_PUBLISHABLE_KEY" == eyJ* ]]; then
    echo "✓ Publishable Key is set (starts with eyJ - looks valid)"
    
    # Try to extract the project ref from the JWT
    PROJECT_FROM_KEY=$(echo "$VITE_SUPABASE_PUBLISHABLE_KEY" | cut -d. -f2 | base64 -d 2>/dev/null | grep -o '"ref":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$PROJECT_FROM_KEY" ]; then
        echo "   Project ref in key: $PROJECT_FROM_KEY"
        if [ -n "$VITE_SUPABASE_PROJECT_ID" ] && [ "$PROJECT_FROM_KEY" != "$VITE_SUPABASE_PROJECT_ID" ]; then
            echo "   ❌ WARNING: Key is for project '$PROJECT_FROM_KEY', but VITE_SUPABASE_PROJECT_ID is '$VITE_SUPABASE_PROJECT_ID'!"
            echo "   You need to get the key from the correct Supabase project"
        else
            echo "   ✓ Key matches the project ID!"
        fi
    fi
else
    echo "❌ Publishable Key format looks incorrect"
    echo "   Key should start with 'eyJ' (it's a JWT token)"
    echo "   Current value: ${VITE_SUPABASE_PUBLISHABLE_KEY:0:20}..."
fi

echo ""
echo "=================================="
echo "Next Steps:"
echo "=================================="

if [ -z "$VITE_SUPABASE_PROJECT_ID" ] || [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "1. Go to your Supabase dashboard: https://supabase.com/dashboard"
    echo "2. Select or create your project"
    echo "3. Go to Settings → API"
    echo "4. Copy your Project URL, Project Ref, and anon key"
    echo "5. Update your .env file with these values"
    echo "6. Run this script again to verify"
    echo "7. Restart your dev server: npm run dev"
else
    echo "✅ Configuration looks complete!"
    echo ""
    echo "1. Restart your dev server if it's running:"
    echo "   - Stop with Ctrl+C"
    echo "   - Start with: npm run dev"
    echo "2. Clear browser cache (Ctrl+Shift+Delete)"
    echo "3. Open your app and check the Admin page"
    echo "4. Verify the Project Check section shows the correct values"
fi

echo ""
