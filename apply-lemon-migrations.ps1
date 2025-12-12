# Apply Lemon Squeezy Database Migrations
# This script applies the necessary database migrations for Lemon Squeezy integration

Write-Host "🍋 Applying Lemon Squeezy Migrations..." -ForegroundColor Yellow
Write-Host ""

# Load environment variables from .env.local
$envFile = ".\.env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match '^([^=]+)=(.*)$') {
            $name = $matches[1]
            $value = $matches[2]
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ Error: .env.local file not found" -ForegroundColor Red
    exit 1
}

# Check if required environment variables are set
$requiredVars = @(
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
)

foreach ($var in $requiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        Write-Host "❌ Error: $var environment variable not set" -ForegroundColor Red
        exit 1
    }
}

# Get Supabase connection details
$supabaseUrl = [Environment]::GetEnvironmentVariable("NEXT_PUBLIC_SUPABASE_URL", "Process")
$serviceRoleKey = [Environment]::GetEnvironmentVariable("SUPABASE_SERVICE_ROLE_KEY", "Process")

# Extract project reference from URL (e.g., https://abcdefg.supabase.co -> abcdefg)
if ($supabaseUrl -match 'https://([^.]+)\.supabase\.co') {
    $projectRef = $matches[1]
} else {
    Write-Host "❌ Error: Could not extract project reference from Supabase URL" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📊 Project Reference: $projectRef" -ForegroundColor Cyan
Write-Host ""

# Read migration SQL
$migrationFile = ".\migrations\001_add_lemonsqueezy_fields.sql"
if (-not (Test-Path $migrationFile)) {
    Write-Host "❌ Error: Migration file not found: $migrationFile" -ForegroundColor Red
    exit 1
}

$migrationSQL = Get-Content $migrationFile -Raw

# Apply migration using Supabase REST API
Write-Host "🔄 Applying migration to database..." -ForegroundColor Yellow

try {
    # Create a temporary PowerShell script to execute SQL via psql
    # Note: This requires psql to be installed
    # Alternative: Use Supabase Management API or execute via Node.js script
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: To apply this migration, you have two options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Use Supabase Dashboard (Recommended)" -ForegroundColor Cyan
    Write-Host "  1. Go to: https://supabase.com/dashboard/project/$projectRef/editor" -ForegroundColor White
    Write-Host "  2. Open the SQL Editor" -ForegroundColor White
    Write-Host "  3. Copy the contents of: migrations\001_add_lemonsqueezy_fields.sql" -ForegroundColor White
    Write-Host "  4. Paste and execute the SQL" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Use Supabase CLI" -ForegroundColor Cyan
    Write-Host "  1. Install Supabase CLI: https://supabase.com/docs/guides/cli" -ForegroundColor White
    Write-Host "  2. Run: supabase db push --db-url 'your-connection-string'" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 3: Use this PowerShell script with psql" -ForegroundColor Cyan
    Write-Host "  1. Install PostgreSQL client tools (psql)" -ForegroundColor White
    Write-Host "  2. Get your database connection string from Supabase Dashboard > Project Settings > Database" -ForegroundColor White
    Write-Host "  3. Run: psql 'your-connection-string' -f migrations\001_add_lemonsqueezy_fields.sql" -ForegroundColor White
    Write-Host ""
    
    # For now, let's just open the migration file and the Supabase dashboard
    Write-Host "📋 Opening migration file and Supabase dashboard..." -ForegroundColor Cyan
    
    # Open migration file in default editor
    Start-Process $migrationFile
    
    # Open Supabase dashboard
    Start-Process "https://supabase.com/dashboard/project/$projectRef/editor"
    
    Write-Host ""
    Write-Host "✅ Migration file opened. Please apply it manually using one of the options above." -ForegroundColor Green
    
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ Done! After applying the migration, your database will be ready for Lemon Squeezy." -ForegroundColor Green
