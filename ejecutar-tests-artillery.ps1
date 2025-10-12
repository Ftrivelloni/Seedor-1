param (
    [switch]$Basico,
    [switch]$Campo,
    [switch]$Empaque,
    [switch]$CargaAlta,
    [switch]$Picos,
    [switch]$Todos
)

$ErrorActionPreference = "Continue"

# Crear directorio para reportes si no existe
$reportDir = "./tests/artillery/reports"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

# Cargar variables de entorno del archivo .env.local
if (Test-Path "./.env.local") {
    $envContent = Get-Content ./.env.local
    foreach ($line in $envContent) {
        if ($line -match '^([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
}

function Ejecutar-Test {
    param (
        [string]$Nombre,
        [string]$ArchivoTest
    )
    Write-Host "Ejecutando test: $Nombre..."
    
    $fecha = Get-Date -Format "yyyyMMdd-HHmmss"
    $reporteJson = "$reportDir/$Nombre-$fecha.json"
    $reporteHtml = "$reportDir/$Nombre-$fecha.html"
    
    # Ejecutar el test y generar reporte JSON
    artillery run --output $reporteJson "tests/artillery/$ArchivoTest" | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        # Generar reporte HTML
        artillery report $reporteJson --output $reporteHtml | Out-Null
        Write-Host "✅ Test '$Nombre' completado exitosamente - Reporte: $reporteHtml"
        return $true
    } else {
        Write-Host "❌ Test '$Nombre' falló con código: $LASTEXITCODE"
        return $false
    }
}

$testsPasados = 0
$testsTotales = 0

# Ejecutar tests según parámetros
if ($Basico -or $Todos) {
    $testsTotales++
    if (Ejecutar-Test "Navegacion-Basica" "navegacion-basica.yml") {
        $testsPasados++
    }
}

if ($Campo -or $Todos) {
    $testsTotales++
    if (Ejecutar-Test "Modulo-Campo" "modulo-campo.yml") {
        $testsPasados++
    }
}

if ($Empaque -or $Todos) {
    $testsTotales++
    if (Ejecutar-Test "Modulo-Empaque" "modulo-empaque.yml") {
        $testsPasados++
    }
}

if ($CargaAlta -or $Todos) {
    $testsTotales++
    if (Ejecutar-Test "Carga-Alta" "carga-alta.yml") {
        $testsPasados++
    }
}

if ($Picos -or $Todos) {
    $testsTotales++
    if (Ejecutar-Test "Test-Picos" "test-picos.yml") {
        $testsPasados++
    }
}

# Mostrar resumen final
if ($testsTotales -gt 0) {
    Write-Host "`nResumen: $testsPasados de $testsTotales tests completados exitosamente"
} else {
    Write-Host "`nUso: .\ejecutar-tests-artillery.ps1 [-Basico] [-Campo] [-Empaque] [-CargaAlta] [-Picos] [-Todos]"
    Write-Host "  -Basico: Ejecuta el test de navegación básica"
    Write-Host "  -Campo: Ejecuta el test del módulo Campo"
    Write-Host "  -Empaque: Ejecuta el test del módulo Empaque" 
    Write-Host "  -CargaAlta: Ejecuta el test de carga alta"
    Write-Host "  -Picos: Ejecuta el test de picos de carga"
    Write-Host "  -Todos: Ejecuta todos los tests"
}