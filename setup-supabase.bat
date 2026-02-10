@echo off
setlocal enabledelayedexpansion

:: Interactive Supabase Configuration Setup for Windows
:: This script will guide you through setting up your Supabase configuration
:: NO technical knowledge required - just answer the questions!

echo ================================================================
echo   SUPABASE CONFIGURATION SETUP
echo ================================================================
echo.
echo This will help you configure your Supabase project.
echo You'll need 3 pieces of information from Supabase.
echo.
echo First, open https://supabase.com/dashboard in your browser
echo Then come back here to continue.
echo.
pause

echo.
echo ================================================================
echo.
echo STEP 1 of 3: Project URL
echo.
echo In your Supabase dashboard:
echo   1. Select or create your project
echo   2. Look at the project URL - it looks like:
echo      https://abcdefgh123.supabase.co
echo   3. Copy the ENTIRE URL (including https://)
echo.
set /p PROJECT_URL="Paste your Project URL here: "

:: Extract project ID from URL
for /f "tokens=3 delims=:/" %%a in ("%PROJECT_URL%") do (
    for /f "tokens=1 delims=." %%b in ("%%a") do set PROJECT_ID=%%b
)

if "%PROJECT_ID%"=="" (
    echo.
    echo WARNING: That doesn't look like a Supabase URL.
    echo          It should start with https:// and end with .supabase.co
    echo.
    echo Please run this script again and make sure to copy the full URL.
    pause
    exit /b 1
)

echo.
echo Got it! Your Project ID is: %PROJECT_ID%

echo.
echo ================================================================
echo.
echo STEP 2 of 3: Anon Key (the long key)
echo.
echo In your Supabase dashboard:
echo   1. Click 'Settings' (gear icon on the left)
echo   2. Click 'API'
echo   3. Find 'Project API keys'
echo   4. Copy the 'anon' or 'public' key (the long one)
echo      It starts with: eyJ...
echo.
echo IMPORTANT: Copy the 'anon' key, NOT the 'service_role' key!
echo.
set /p ANON_KEY="Paste your Anon Key here: "

:: Validate that it starts with eyJ
echo %ANON_KEY% | findstr /b "eyJ" > nul
if errorlevel 1 (
    echo.
    echo WARNING: That doesn't look like an anon key.
    echo          It should start with: eyJ
    echo.
    echo Please run this script again and make sure to copy the 'anon' key.
    pause
    exit /b 1
)

echo.
echo Got it! Key looks valid.

echo.
echo ================================================================
echo.
echo STEP 3 of 3: Review and Confirm
echo.
echo Here's what will be configured:
echo.
echo   Project ID:  %PROJECT_ID%
echo   Project URL: %PROJECT_URL%
echo   Anon Key:    (hidden for security)
echo.
set /p CONFIRM="Does this look correct? (yes/no): "

if /i not "%CONFIRM%"=="yes" if /i not "%CONFIRM%"=="y" (
    echo.
    echo Setup cancelled. Run this script again to start over.
    pause
    exit /b 0
)

echo.
echo ================================================================
echo.
echo Creating your configuration...

:: Create .env file
(
echo VITE_SUPABASE_PROJECT_ID="%PROJECT_ID%"
echo VITE_SUPABASE_URL="%PROJECT_URL%"
echo VITE_SUPABASE_PUBLISHABLE_KEY="%ANON_KEY%"
) > .env

if exist .env (
    echo Configuration file created successfully!
) else (
    echo Failed to create configuration file.
    echo You may need to create .env manually.
    pause
    exit /b 1
)

:: Update supabase/config.toml if it exists
if exist supabase\config.toml (
    echo Updating supabase\config.toml...
    
    :: Create temp file with updated project_id
    (
    echo project_id = "%PROJECT_ID%"
    echo.
    for /f "skip=1 delims=" %%i in (supabase\config.toml) do (
        set "line=%%i"
        if not "!line:project_id=!"=="!line!" (
            rem Skip old project_id line
        ) else (
            echo %%i
        )
    )
    ) > supabase\config.toml.tmp
    
    move /y supabase\config.toml.tmp supabase\config.toml > nul
    echo supabase\config.toml updated!
)

echo.
echo ================================================================
echo.
echo SUCCESS! Your Supabase configuration is complete!
echo.
echo Next steps:
echo.
echo   1. Start your development server:
echo      npm run dev
echo.
echo   2. Open your browser to:
echo      http://localhost:8080
echo.
echo   3. Check the Admin page to verify your configuration
echo.
echo ================================================================
echo.
echo You're all set!
echo.
pause
