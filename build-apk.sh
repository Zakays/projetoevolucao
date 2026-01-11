#!/bin/bash
# Script para gerar APK com Bubblewrap (TWA)
# Uso: bash build-apk.sh [HOST]
# Ex: bash build-apk.sh localhost:5173
#     bash build-apk.sh example.com

HOST=${1:-projetoevolucao.vercel.app}
echo "Gerando APK para host: $HOST"

# Criar diretório de output se não existir
mkdir -p twa/output

# Executar Bubblewrap com configuração do twa-manifest.json
bubblewrap init \
  --host "$HOST" \
  --package-id "com.glowuporganizer.app" \
  --app-name "Glow Up" \
  --app-version "1.0.0" \
  --app-version-code 1 \
  --launcher-name "Glow Up Organizer" \
  --orientation "portrait-primary" \
  --min-sdk-version 24 \
  --target-sdk-version 34 \
  --start-url "/" \
  --display "standalone" \
  --theme-color "#6366f1" \
  --background-color "#ffffff" \
  --enable-notifications \
  --output twa/output

echo "✅ APK gerada em: twa/output/app-release.apk"
echo "Próximos passos:"
echo "1. Copiar APK para o celular"
echo "2. Instalar: adb install twa/output/app-release.apk"
echo "3. Testar offline/online: criar hábito, desabilitar internet, reconectar"
