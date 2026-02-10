#!/bin/bash

# Interactive Supabase Configuration Setup
# This script will guide you through setting up your Supabase configuration
# NO technical knowledge required - just answer the questions!

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🚀 SUPABASE CONFIGURATION SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This will help you configure your Supabase project."
echo "You'll need 3 pieces of information from Supabase."
echo ""
echo "First, open https://supabase.com/dashboard in your browser"
echo "Then come back here to continue."
echo ""
read -p "Press ENTER when you're ready to continue..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "STEP 1 of 3: Project URL"
echo ""
echo "In your Supabase dashboard:"
echo "  1. Select or create your project"
echo "  2. Look at the project URL - it looks like:"
echo "     https://abcdefgh123.supabase.co"
echo "  3. Copy the ENTIRE URL (including https://)"
echo ""
read -p "Paste your Project URL here: " PROJECT_URL

# Extract project ID from URL
if [[ "$PROJECT_URL" =~ https://([a-z0-9-]+)\.supabase\.co ]]; then
    PROJECT_ID="${BASH_REMATCH[1]}"
    echo ""
    echo "✓ Got it! Your Project ID is: $PROJECT_ID"
else
    echo ""
    echo "⚠️  That doesn't look like a Supabase URL."
    echo "   It should start with https:// and end with .supabase.co"
    echo ""
    echo "Please run this script again and make sure to copy the full URL."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "STEP 2 of 3: Anon Key (the long key)"
echo ""
echo "In your Supabase dashboard:"
echo "  1. Click 'Settings' (gear icon on the left)"
echo "  2. Click 'API'"
echo "  3. Find 'Project API keys'"
echo "  4. Copy the 'anon' or 'public' key (the long one)"
echo "     It starts with: eyJ..."
echo ""
echo "⚠️  IMPORTANT: Copy the 'anon' key, NOT the 'service_role' key!"
echo ""
read -p "Paste your Anon Key here: " ANON_KEY

# Validate that it looks like a JWT
if [[ "$ANON_KEY" =~ ^eyJ ]]; then
    echo ""
    echo "✓ Got it! Key looks valid."
else
    echo ""
    echo "⚠️  That doesn't look like an anon key."
    echo "   It should start with: eyJ"
    echo ""
    echo "Please run this script again and make sure to copy the 'anon' key."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "STEP 3 of 3: Review and Confirm"
echo ""
echo "Here's what will be configured:"
echo ""
echo "  Project ID:  $PROJECT_ID"
echo "  Project URL: $PROJECT_URL"
echo "  Anon Key:    ${ANON_KEY:0:20}... (truncated for security)"
echo ""
read -p "Does this look correct? (yes/no): " CONFIRM

if [[ "$CONFIRM" != "yes" && "$CONFIRM" != "y" && "$CONFIRM" != "YES" ]]; then
    echo ""
    echo "Setup cancelled. Run this script again to start over."
    exit 0
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Creating your configuration..."

# Create .env file
cat > .env << EOF
VITE_SUPABASE_PROJECT_ID="$PROJECT_ID"
VITE_SUPABASE_URL="$PROJECT_URL"
VITE_SUPABASE_PUBLISHABLE_KEY="$ANON_KEY"
EOF

if [ $? -eq 0 ]; then
    echo "✓ Configuration file created successfully!"
else
    echo "✗ Failed to create configuration file."
    echo "  You may need to create .env manually."
    exit 1
fi

# Update supabase/config.toml if it exists
if [ -f "supabase/config.toml" ]; then
    echo "✓ Updating supabase/config.toml..."
    
    # Check if project_id line exists
    if grep -q "^project_id = " supabase/config.toml; then
        # Replace existing project_id
        sed -i.bak "s/^project_id = .*/project_id = \"$PROJECT_ID\"/" supabase/config.toml
        rm -f supabase/config.toml.bak
    else
        # Add project_id at the beginning
        sed -i.bak "1i\\
project_id = \"$PROJECT_ID\"\\
" supabase/config.toml
        rm -f supabase/config.toml.bak
    fi
    
    echo "✓ supabase/config.toml updated!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ SUCCESS! Your Supabase configuration is complete!"
echo ""
echo "Next steps:"
echo ""
echo "  1. Start your development server:"
echo "     npm run dev"
echo ""
echo "  2. Open your browser to:"
echo "     http://localhost:8080"
echo ""
echo "  3. Check the Admin page to verify your configuration"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 You're all set!"
echo ""
