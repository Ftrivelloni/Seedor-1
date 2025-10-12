param (
    [switch]$Login,
    [switch]$Navegacion,
    [switch]$Simplificado,
    [int]$Usuarios = 0,
    [int]$Tasa = 0,
    [int]$Duracion = 0
)

$ErrorActionPreference = "Continue"

# Crear directorio para reportes si no existe
$reportDir = "./tests/artillery/reports"
if (-not (Test-Path $reportDir)) {
    New-Item -ItemType Directory -Path $reportDir | Out-Null
}

# Función para ejecutar un test de Artillery
function Ejecutar-Test {
    param (
        [string]$Nombre,
        [string]$ArchivoTest,
        [int]$NumUsuarios = 0,
        [int]$TasaUsuarios = 0,
        [int]$Tiempo = 0,
        [switch]$CrearArchivoTemporal = $false,
        [string]$ConfigPersonalizada = ""
    )
    
    $fecha = Get-Date -Format "yyyyMMdd-HHmmss"
    $reporteJson = "$reportDir/$Nombre-$fecha.json"
    $reporteHtml = "$reportDir/$Nombre-$fecha.html"
    
    if ($CrearArchivoTemporal -and $ConfigPersonalizada -ne "") {
        # Crear un archivo temporal con la configuración personalizada
        $tempConfigFile = [System.IO.Path]::GetTempFileName() + ".yml"
        $ConfigPersonalizada | Out-File -FilePath $tempConfigFile -Encoding utf8
        
        # Ejecutar Artillery con el archivo temporal
        artillery run --output $reporteJson $tempConfigFile
    }
    elseif ($NumUsuarios -gt 0 -and $TasaUsuarios -gt 0) {
        # Si se especifica número de usuarios y tasa, ejecutar con configuración personalizada
        $duracionTest = if ($Tiempo -gt 0) { $Tiempo } else { 60 }
        
        Write-Host "Ejecutando con $NumUsuarios usuarios a una tasa de $TasaUsuarios usuarios por segundo durante $duracionTest segundos"
        artillery run --output $reporteJson "tests/artillery/$ArchivoTest" --environment custom --config "{ ""environments"": { ""custom"": { ""phases"": [{ ""duration"": $duracionTest, ""arrivalRate"": $TasaUsuarios }] } } }"
    }
    else {
        # Ejecutar con la configuración estándar del archivo
        artillery run --output $reporteJson "tests/artillery/$ArchivoTest"
    }
    
    if ($LASTEXITCODE -eq 0) {
        # Generar reporte HTML
        artillery report $reporteJson --output $reporteHtml | Out-Null
        Write-Host "✅ Test '$Nombre' completado exitosamente"
        Write-Host "   Reporte JSON: $reporteJson"
        Write-Host "   Reporte HTML: $reporteHtml"
        return $true
    }
    else {
        Write-Host "❌ Test '$Nombre' falló con código: $LASTEXITCODE"
        return $false
    }
}

# Si no se especifica ningún test, mostrar ayuda
if (-not ($Login -or $Navegacion)) {
    Write-Host "`nUso: .\ejecutar-tests.ps1 [-Login] [-Navegacion] [-Simplificado] [-Usuarios n] [-Tasa n] [-Duracion n]"
    Write-Host "`nOpciones de tests:"
    Write-Host "  -Login: Ejecuta el test de login simple"
    Write-Host "  -Navegacion: Ejecuta el test de navegación completa"
    Write-Host "`nParametros opcionales:"
    Write-Host "  -Simplificado: Ejecuta una versión simplificada del test (solo para -Navegacion)"
    Write-Host "  -Usuarios: Número de usuarios virtuales (por defecto depende del test)"
    Write-Host "  -Tasa: Tasa de llegada de usuarios por segundo (por defecto depende del test)"
    Write-Host "  -Duracion: Duración del test en segundos (por defecto depende del test)"
    Write-Host "`nEjemplos:"
    Write-Host "  .\ejecutar-tests.ps1 -Login -Usuarios 5 -Tasa 2"
    Write-Host "  .\ejecutar-tests.ps1 -Navegacion -Simplificado"
    Write-Host "  .\ejecutar-tests.ps1 -Navegacion -Usuarios 10 -Tasa 5 -Duracion 120"
    return
}

# Ejecutar test de login
if ($Login) {
    Write-Host "`n===== Ejecutando test de login simple ====="
    
    if ($Usuarios -gt 0 -and $Tasa -gt 0) {
        $duracionLogin = if ($Duracion -gt 0) { $Duracion } else { 60 }
        Ejecutar-Test "login-simple" "config.yml" $Usuarios $Tasa $duracionLogin
    }
    else {
        Write-Host "Ejecutando con la configuración estándar (2 usuarios/seg durante 60 seg)"
        Ejecutar-Test "login-simple" "config.yml"
    }
}

# Ejecutar test de navegación
if ($Navegacion) {
    Write-Host "`n===== Ejecutando test de navegación completa ====="
    
    if ($Simplificado) {
        Write-Host "Ejecutando versión simplificada del test de navegación"
        
        $tasaNav = if ($Tasa -gt 0) { $Tasa } else { 5 }
        $usuariosNav = if ($Usuarios -gt 0) { $Usuarios } else { 5 }
        $duracionNav = if ($Duracion -gt 0) { $Duracion } else { 60 }
        
        $configSimplificada = @"
config:
  target: "https://seedor-1.vercel.app/"
  phases:
    - duration: $duracionNav
      arrivalRate: $tasaNav
      name: Test simplificado
  plugins:
    expect: {}
  
scenarios:
  - name: "Test de Navegación Completa"
    weight: 70
    flow:
      - get:
          url: "/login"
          expect:
            - statusCode: 200
      - think: 1
      - post:
          url: "/api/auth/login"
          json:
            email: "demo@seedor.com"
            password: "demo123"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/home"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/campo"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/empaque"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/inventario"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/ajustes"
          expect:
            - statusCode: 200

  - name: "Test Enfocado en Empaque"
    weight: 30
    flow:
      - get:
          url: "/login"
          expect:
            - statusCode: 200
      - think: 1
      - post:
          url: "/api/auth/login"
          json:
            email: "demo@seedor.com"
            password: "demo123"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/empaque"
          expect:
            - statusCode: 200
      - think: 2
      - get:
          url: "/empaque/ingreso-fruta"
          expect:
            - statusCode: 200
"@
        
        Ejecutar-Test "navegacion-simplificada" "" 0 0 0 $true $configSimplificada
    }
    else {
        # Configuración personalizada para el test de navegación completa
        if ($Usuarios -gt 0 -and $Tasa -gt 0 -and $Duracion -gt 0) {
            Write-Host "Ejecutando con configuración personalizada: $Usuarios usuarios, tasa $Tasa, durante $Duracion segundos"
            $configPersonalizada = @"
config:
  target: "https://seedor-1.vercel.app/"
  phases:
    - duration: $Duracion
      arrivalRate: $Tasa
      name: Test navegación personalizado
  plugins:
    expect: {}
"@
            
            # Obtener el contenido de los escenarios del archivo navegacion-completa.yml
            $navegacionCompleta = Get-Content -Path "tests/artillery/navegacion-completa.yml" -Raw
            $escenarios = $navegacionCompleta -split "scenarios:" | Select-Object -Last 1
            
            $configCompleta = $configPersonalizada + "`nscenarios:" + $escenarios
            
            Ejecutar-Test "navegacion-completa-personalizada" "" 0 0 0 $true $configCompleta
        }
        else {
            Write-Host "Ejecutando con la configuración completa del archivo (3 fases: baja, media y alta carga)"
            Write-Host "Fase 1: 2 usuarios/seg durante 60 seg"
            Write-Host "Fase 2: 5-10 usuarios/seg durante 60 seg"
            Write-Host "Fase 3: 10 usuarios/seg durante 60 seg"
            Write-Host "Duración total: 3 minutos"
            
            Ejecutar-Test "navegacion-completa" "navegacion-completa.yml"
        }
    }
}