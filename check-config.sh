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
    exit 1
fi

echo "✓ .env file found"
echo ""

# Read .env values
source .env

echo "Current Configuration:"
echo "-----------------------------------"
echo "Project ID: $VITE_SUPABASE_PROJECT_ID"
echo "URL: $VITE_SUPABASE_URL"
echo ""

# Check if values are set
if [ "$VITE_SUPABASE_PROJECT_ID" = "oqaodtatfzcibpfmhejl" ]; then
    echo "✓ Project ID is correct (oqaodtatfzcibpfmhejl)"
else
    echo "❌ Project ID is incorrect!"
    echo "   Expected: oqaodtatfzcibpfmhejl"
    echo "   Got: $VITE_SUPABASE_PROJECT_ID"
fi

if [ "$VITE_SUPABASE_URL" = "https://oqaodtatfzcibpfmhejl.supabase.co" ]; then
    echo "✓ URL is correct"
else
    echo "❌ URL is incorrect!"
    echo "   Expected: https://oqaodtatfzcibpfmhejl.supabase.co"
    echo "   Got: $VITE_SUPABASE_URL"
fi

if [ "$VITE_SUPABASE_PUBLISHABLE_KEY" = "YOUR_PUBLISHABLE_KEY_HERE" ] || [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "⚠️  Publishable Key is not set (using placeholder)"
    echo "   You need to get your key from Supabase dashboard"
    echo "   See: GET_SUPABASE_KEY.md for instructions"
elif [[ "$VITE_SUPABASE_PUBLISHABLE_KEY" == eyJ* ]]; then
    echo "✓ Publishable Key is set (starts with eyJ - looks valid)"
    
    # Try to extract the project ref from the JWT
    PROJECT_FROM_KEY=$(echo "$VITE_SUPABASE_PUBLISHABLE_KEY" | cut -d. -f2 | base64 -d 2>/dev/null | grep -o '"ref":"[^"]*"' | cut -d'"' -f4)
    
    if [ -n "$PROJECT_FROM_KEY" ]; then
        echo "   Project ref in key: $PROJECT_FROM_KEY"
        if [ "$PROJECT_FROM_KEY" = "oqaodtatfzcibpfmhejl" ]; then
            echo "   ✓ Key matches the project ID!"
        else
            echo "   ❌ WARNING: Key is for project '$PROJECT_FROM_KEY', not 'oqaodtatfzcibpfmhejl'!"
            echo "   You need to get the key from the correct Supabase project"
        fi
    fi
else
    echo "❌ Publishable Key format looks incorrect"
    echo "   Key should start with 'eyJ' (it's a JWT token)"
fi

echo ""
echo "=================================="
echo "Next Steps:"
echo "=================================="

if [ "$VITE_SUPABASE_PUBLISHABLE_KEY" = "YOUR_PUBLISHABLE_KEY_HERE" ] || [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
    echo "1. Get your publishable key from Supabase (see GET_SUPABASE_KEY.md)"
    echo "2. Update the .env file with your actual key"
    echo "3. Run this script again to verify"
    echo "4. Restart your dev server: npm run dev"
else
    echo "1. Restart your dev server if it's running:"
    echo "   - Stop with Ctrl+C"
    echo "   - Start with: npm run dev"
    echo "2. Open your app and check the Admin page"
    echo "3. Verify the Project Check section shows the correct values"
fi

echo ""
