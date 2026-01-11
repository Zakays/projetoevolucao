# Script para gerar APK com Bubblewrap (TWA)
# Uso: .\build-apk.ps1 [HOST]
# Ex: .\build-apk.ps1 localhost:5173
#     .\build-apk.ps1 example.com

param(
    [string]$Host = "localhost:5173"
)

Write-Host "Gerando APK para host: $Host" -ForegroundColor Cyan

# Criar diretório de output se não existir
New-Item -ItemType Directory -Path "twa/output" -Force | Out-Null

# Executar Bubblewrap com configuração necessária
Write-Host "Executando Bubblewrap init..." -ForegroundColor Yellow

& bubblewrap init `
  --host "$Host" `
  --package-id "com.glowuporganizer.app" `
  --app-name "Glow Up" `
  --app-version "1.0.0" `
  --app-version-code 1 `
  --launcher-name "Glow Up Organizer" `
  --orientation "portrait-primary" `
  --min-sdk-version 24 `
  --target-sdk-version 34 `
  --start-url "/" `
  --display "standalone" `
  --theme-color "#6366f1" `
  --background-color "#ffffff" `
  --enable-notifications `
  --output twa/output

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ APK pode estar sendo gerada..." -ForegroundColor Green
    Write-Host ""
    Write-Host "Para gerar a APK final, você precisa:" -ForegroundColor Cyan
    Write-Host "1. Android SDK/NDK (via Android Studio)"
    Write-Host "2. Jave JDK 11+"
    Write-Host "3. Executar em twa/output: npm run build"
    Write-Host ""
    Write-Host "Próximos passos após build:" -ForegroundColor Green
    Write-Host "1. Copiar APK para o celular"
    Write-Host "2. Instalar: adb install twa/output/build/outputs/apk/release/app-release.apk"
    Write-Host "3. Testar offline/online: criar hábito, desabilitar internet, reconectar"
} else {
    Write-Host "❌ Erro ao executar Bubblewrap" -ForegroundColor Red
}
