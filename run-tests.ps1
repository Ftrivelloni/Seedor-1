param(
    [switch]$All = $false,
    [switch]$Login = $false,
    [switch]$Ingreso = $false,
    [switch]$Preproceso = $false,
    [switch]$Pallets = $false,
    [switch]$Despacho = $false,
    [switch]$Egreso = $false,
    [switch]$Campo = $false,
    [switch]$Lote = $false,
    [switch]$RunAll = $false
)

$ErrorActionPreference = "Continue"

if (-not (Test-Path ".\screenshots")) {
    New-Item -ItemType Directory -Path ".\screenshots" | Out-Null
}

function Run-Test {
    param (
        [string]$TestName,
        [string]$TestFile
    )
    Write-Host "Ejecutando test: $TestName..." -ForegroundColor Cyan
    npx playwright test $TestFile --project=chromium
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Test $TestName completado exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Test $TestName falló con código: $LASTEXITCODE" -ForegroundColor Red
    }
}

function Run-All-Tests-Together {
    Write-Host "Ejecutando todos los tests de una tirada..." -ForegroundColor Cyan
    npx playwright test e2e/*.spec.ts --project=chromium
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Todos los tests completados exitosamente" -ForegroundColor Green
    } else {
        Write-Host "❌ Algunos tests fallaron con código: $LASTEXITCODE" -ForegroundColor Red
    }
}

# Si se especifica -RunAll, ejecutar todos los tests de una tirada
if ($RunAll) {
    Run-All-Tests-Together
    return
}

# De lo contrario, ejecutar los tests individuales según los parámetros
if ($All -or $Login) {
    Run-Test "Login" "e2e/login-test.spec.ts"
}

if ($All -or $Ingreso) {
    Run-Test "Ingreso Fruta" "e2e/ingreso-test.spec.ts"
}

if ($All -or $Preproceso) {
    Run-Test "Preproceso" "e2e/preproceso-test.spec.ts"
}

if ($All -or $Pallets) {
    Run-Test "Pallets" "e2e/pallets-test.spec.ts"
}

if ($All -or $Despacho) {
    Run-Test "Despacho" "e2e/despacho-test.spec.ts"
}

if ($All -or $Egreso) {
    Run-Test "Egreso Fruta" "e2e/egreso-test.spec.ts"
}

if ($All -or $Campo) {
    Run-Test "Campo" "e2e/campo-test.spec.ts"
}

if ($All -or $Lote) {
    Run-Test "Lote" "e2e/lote-test.spec.ts"
}

# Si no se especificó ningún test, mostrar ayuda
if (-not ($All -or $Login -or $Ingreso -or $Preproceso -or $Pallets -or $Despacho -or $Egreso -or $Campo -or $Lote -or $RunAll)) {
    Write-Host "Uso: .\run-tests.ps1 [-All] [-Login] [-Ingreso] [-Preproceso] [-Pallets] [-Despacho] [-Egreso] [-Campo] [-Lote] [-RunAll]" -ForegroundColor Yellow
    Write-Host "  -All: Ejecuta todos los tests secuencialmente" -ForegroundColor Yellow
    Write-Host "  -RunAll: Ejecuta todos los tests de una tirada" -ForegroundColor Yellow
    Write-Host "  -Login: Ejecuta solo el test de login" -ForegroundColor Yellow
    Write-Host "  -Ingreso: Ejecuta solo el test de ingreso de fruta" -ForegroundColor Yellow
    Write-Host "  -Preproceso: Ejecuta solo el test de preproceso" -ForegroundColor Yellow
    Write-Host "  -Pallets: Ejecuta solo el test de pallets" -ForegroundColor Yellow
    Write-Host "  -Despacho: Ejecuta solo el test de despacho" -ForegroundColor Yellow
    Write-Host "  -Egreso: Ejecuta solo el test de egreso de fruta" -ForegroundColor Yellow
    Write-Host "  -Campo: Ejecuta solo el test de campo" -ForegroundColor Yellow
    Write-Host "  -Lote: Ejecuta solo el test de lote" -ForegroundColor Yellow
}