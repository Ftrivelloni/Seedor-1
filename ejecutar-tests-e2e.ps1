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
    [switch]$RunAll = $false,
    [switch]$ReporteHTML = $false,
    [string]$Navegador = "firefox"  # Opciones: chromium, firefox, webkit
)

$ErrorActionPreference = "Continue"

# Crear directorio para capturas de pantalla si no existe
if (-not (Test-Path ".\screenshots")) {
    New-Item -ItemType Directory -Path ".\screenshots" | Out-Null
}

# Crear directorio para reportes si no existe
$reportDir = "./playwright-report"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

function Run-Test {
    param (
        [string]$TestName,
        [string]$TestFile
    )
    Write-Host "`n===== Ejecutando test: $TestName =====" -ForegroundColor Cyan
    
    # Opciones para Playwright
    $options = @("--project=$Navegador")
    
    if ($ReporteHTML) {
        $options += "--reporter=html"
    }
    
    npx playwright test $TestFile $options
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Test $TestName completado exitosamente" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Test $TestName falló con código: $LASTEXITCODE" -ForegroundColor Red
        return $false
    }
}

function Run-All-Tests-Together {
    Write-Host "`n===== Ejecutando todos los tests juntos =====" -ForegroundColor Cyan
    
    # Opciones para Playwright
    $options = @("--project=$Navegador")
    
    if ($ReporteHTML) {
        $options += "--reporter=html"
    }
    
    npx playwright test e2e/*.spec.ts $options
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Todos los tests completados exitosamente" -ForegroundColor Green
        return $true
    } else {
        Write-Host "❌ Algunos tests fallaron con código: $LASTEXITCODE" -ForegroundColor Red
        return $false
    }
}

Write-Host "Navegador seleccionado: $Navegador"

if ($RunAll) {
    $resultado = Run-All-Tests-Together
    
    if ($resultado -and $ReporteHTML) {
        Write-Host "Reporte HTML generado en: $reportDir/index.html" -ForegroundColor Green
    }
    
    exit
}

# Variables para seguimiento
$testsPasados = 0
$testsTotales = 0

if ($All -or $Login) {
    $testsTotales++
    if (Run-Test "Login" "e2e/login-test.spec.ts") {
        $testsPasados++
    }
}

if ($All -or $Ingreso) {
    $testsTotales++
    if (Run-Test "Ingreso Fruta" "e2e/ingreso-test.spec.ts") {
        $testsPasados++
    }
}

if ($All -or $Preproceso) {
    $testsTotales++
    if (Run-Test "Preproceso" "e2e/preproceso-test.spec.ts") {
        $testsPasados++
    }
}

if ($All -or $Pallets) {
    $testsTotales++
    if (Run-Test "Pallets" "e2e/pallets-test.spec.ts") {
        $testsPasados++
    }
}

if ($All -or $Despacho) {
    $testsTotales++
    if (Run-Test "Despacho" "e2e/despacho-test.spec.ts") {
        $testsPasados++
    }
}

if ($All -or $Egreso) {
    $testsTotales++
    if (Run-Test "Egreso Fruta" "e2e/egreso-test.spec.ts") {
        $testsPasados++
    }
}

if ($All -or $Campo) {
    $testsTotales++
    if (Run-Test "Campo" "e2e/campo-test.spec.ts") {
        $testsPasados++
    }
}

if ($All -or $Lote) {
    $testsTotales++
    if (Run-Test "Lote" "e2e/lote-test.spec.ts") {
        $testsPasados++
    }
}

# Mostrar resumen si se ejecutó algún test
if ($testsTotales -gt 0) {
    Write-Host "`n===== Resumen de Tests =====" -ForegroundColor Cyan
    Write-Host "$testsPasados de $testsTotales tests completados exitosamente" -ForegroundColor $(if ($testsPasados -eq $testsTotales) { "Green" } else { "Yellow" })
    
    if ($ReporteHTML) {
        Write-Host "Reporte HTML generado en: $reportDir/index.html" -ForegroundColor Green
    }
}
# Si no se especificó ningún test, mostrar ayuda
else {
    Write-Host "`n===== Ejecutor de Tests Playwright =====" -ForegroundColor Cyan
    
    Write-Host "`nUso: .\ejecutar-tests-e2e.ps1 [opciones]`n" -ForegroundColor Yellow
    
    Write-Host "Opciones de Tests:" -ForegroundColor Yellow
    Write-Host "  -All             Ejecuta todos los tests secuencialmente"
    Write-Host "  -RunAll          Ejecuta todos los tests en paralelo (más rápido)"
    Write-Host "  -Login           Ejecuta solo el test de login"
    Write-Host "  -Ingreso         Ejecuta solo el test de ingreso de fruta"
    Write-Host "  -Preproceso      Ejecuta solo el test de preproceso"
    Write-Host "  -Pallets         Ejecuta solo el test de pallets"
    Write-Host "  -Despacho        Ejecuta solo el test de despacho"
    Write-Host "  -Egreso          Ejecuta solo el test de egreso de fruta"
    Write-Host "  -Campo           Ejecuta solo el test de campo"
    Write-Host "  -Lote            Ejecuta solo el test de lote"
    
    Write-Host "`nOpciones adicionales:" -ForegroundColor Yellow
    Write-Host "  -ReporteHTML     Genera un reporte HTML detallado"
    Write-Host "  -Navegador       Especifica el navegador a usar: chromium (default), firefox, webkit"
    
    Write-Host "`nEjemplos:" -ForegroundColor Yellow
    Write-Host "  .\ejecutar-tests-e2e.ps1 -Login -ReporteHTML"
    Write-Host "  .\ejecutar-tests-e2e.ps1 -All -Navegador firefox"
    Write-Host "  .\ejecutar-tests-e2e.ps1 -RunAll -ReporteHTML"
}