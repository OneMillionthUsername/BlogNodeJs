#!/bin/bash
# Deployment-Script für Plesk auf easyname.at
# Ausführen mit: bash deploy.sh

echo "🚀 Blog App Deployment für Plesk gestartet..."
echo "=========================================="

# Prüfe ob wir uns im richtigen Verzeichnis befinden
if [ ! -f "package.json" ]; then
    echo "❌ package.json nicht gefunden. Bitte im Projekt-Wurzelverzeichnis ausführen."
    exit 1
fi

# Prüfe Node.js Version
NODE_VERSION=$(node --version 2>/dev/null || echo "nicht installiert")
echo "📋 Node.js Version: $NODE_VERSION"

if [ "$NODE_VERSION" = "nicht installiert" ]; then
    echo "❌ Node.js nicht gefunden. Bitte Node.js 18+ installieren."
    exit 1
fi

# Environment-Konfiguration prüfen
if [ ! -f ".env" ]; then
    echo "⚠️  .env Datei fehlt! Erstelle Template..."
    cp .env.template .env
    echo "📝 .env Template aus .env.template erstellt"
    echo "🔧 Bitte bearbeiten Sie die .env Datei mit Ihren Production-Werten:"
    echo "   - DOMAIN=ihredomain.at"
    echo "   - JWT_SECRET=IhrSicheresGeheimnis"
    echo "   - ADMIN_PASSWORD_HASH=..."
    echo ""
    echo "🔑 Führen Sie 'npm run generate-hash IhrPasswort' aus für den Hash."
    exit 1
fi

# Dependencies installieren
echo "📦 Installiere Dependencies..."
npm install --production

if [ $? -ne 0 ]; then
    echo "❌ npm install fehlgeschlagen"
    exit 1
fi

# Notwendige Verzeichnisse erstellen
echo "📁 Erstelle notwendige Verzeichnisse..."
mkdir -p posts comments assets/uploads logs

# Berechtigungen setzen
echo "🔐 Setze Berechtigungen..."
chmod 755 posts comments assets logs
chmod 777 assets/uploads

# .gitignore erweitern falls nötig
if ! grep -q "\.env$" .gitignore 2>/dev/null; then
    echo "🔒 Erweitere .gitignore für Production..."
    echo -e "\n# Production Environment\n.env\nlogs/\n*.log" >> .gitignore
fi

# Prüfe Environment-Variablen
echo "🔍 Prüfe Environment-Konfiguration..."
source .env

if [ -z "$DOMAIN" ] || [ "$DOMAIN" = "speculumx.at" ]; then
    echo "✅ DOMAIN ist konfiguriert: $DOMAIN"
else
    echo "⚠️  DOMAIN in .env entspricht nicht speculumx.at!"
fi

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "SpeculumX2025SecureJWTSecret!PleaseChangeThis" ]; then
    echo "⚠️  JWT_SECRET in .env sollte geändert werden!"
fi

if [ -z "$ADMIN_PASSWORD_HASH" ] || [ "$ADMIN_PASSWORD_HASH" = '$2b$12$...GenerierteDurchGenerateHashScript...' ]; then
    echo "⚠️  ADMIN_PASSWORD_HASH in .env nicht gesetzt!"
    echo "🔑 Führen Sie aus: npm run generate-hash IhrSicheresPasswort"
fi

# Test-Start des Servers
echo "🧪 Teste Server-Start..."
timeout 10s npm start &
SERVER_PID=$!
sleep 3

if kill -0 $SERVER_PID 2>/dev/null; then
    echo "✅ Server startet erfolgreich"
    kill $SERVER_PID
else
    echo "❌ Server-Start fehlgeschlagen - prüfen Sie die Logs"
    exit 1
fi

echo ""
echo "✅ Deployment abgeschlossen!"
echo "=========================================="
echo "📋 Nächste Schritte in Plesk:"
echo "1. Node.js aktivieren (Version 18+)"
echo "2. Document Root: /httpdocs"
echo "3. Application Startup File: server/app.js"
echo "4. Environment Variables aus .env übertragen"
echo "5. SSL/TLS Certificate einrichten (Let's Encrypt)"
echo ""
echo "🌐 Ihre App wird verfügbar sein unter:"
echo "   https://speculumx.at"
echo ""
echo "🔑 Admin-Login unter:"
echo "   https://speculumx.at/pages/create.html"
