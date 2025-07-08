# Blog App - Plesk Deployment Guide

Dieses Repository ist für die Bereitstellung auf **Plesk** bei **easyname.at** optimiert.

## 🚀 Schnell-Deployment

### 1. Repository hochladen
Laden Sie alle Dateien in Ihr Plesk-Verzeichnis `/httpdocs/` hoch.

### 2. Environment-Konfiguration
```bash
# .env aus Template erstellen
cp .env.template .env

# Admin-Hash generieren
node generate-hash.js "IhrSicheresPasswort123!"

# .env Datei anpassen
nano .env
```

### 3. Deployment ausführen
```bash
chmod +x deploy.sh
./deploy.sh
```

## ⚙️ Plesk-Konfiguration

### Node.js Settings in Plesk:
- **Node.js Version**: 18.x oder höher
- **Document Root**: `/httpdocs`
- **Application Root**: `/`
- **Application Startup File**: `server/app.js`
- **Application Mode**: `production`

### Environment Variables in Plesk:
```
NODE_ENV=production
PLESK_ENV=true
PORT=8080
HOST=0.0.0.0
DOMAIN=speculumx.at
JWT_SECRET=SpeculumX2025SecureJWTSecret!PleaseChangeThis
ADMIN_PASSWORD_HASH=$2b$12$...IhrGenerierterHash...
```

## 🔐 SSL/TLS Einrichtung

### Let's Encrypt in Plesk:
1. **Domain** → **SSL/TLS Certificates**
2. **Let's Encrypt** → **Get it free**
3. ✅ **Secure www and non-www domains**
4. ✅ **Redirect from HTTP to HTTPS**

## 📁 Dateistruktur
```
/httpdocs/                  # Plesk Document Root
├── server/
│   ├── app.js             # Hauptserver (Startup File)
│   └── auth.js            # JWT-Authentifizierung
├── assets/                # Statische Dateien
│   ├── css/
│   ├── js/
│   └── uploads/           # Hochgeladene Bilder
├── pages/                 # HTML-Seiten
├── posts/                 # Blog-Posts (JSON)
├── comments/              # Kommentare (JSON)
├── package.json           # Dependencies
├── .env                   # Environment-Variablen
├── deploy.sh              # Deployment-Script
└── index.html             # Startseite
```

## 🛡️ Sicherheit

### Admin-Zugang:
- **URL**: `https://speculumx.at/pages/create.html`
- **Username**: `admin`
- **Password**: Ihr gewähltes Passwort
- **Authentifizierung**: JWT mit HttpOnly Cookies

### Sichere Passwort-Hash-Generierung:
```bash
# Neuen Hash generieren
npm run generate-hash "MeinSicheresPasswort123!"

# Hash in .env eintragen
ADMIN_PASSWORD_HASH=$2b$12$...GenerierterHash...
```

## 🔧 Wartung

### Logs einsehen:
```bash
# Plesk Node.js Logs
tail -f /var/www/vhosts/speculumx.at/logs/nodejs_*

# Application Logs
tail -f logs/*.log
```

### App neu starten:
In Plesk: **Node.js** → **Restart App**

### Dependencies aktualisieren:
```bash
npm update
npm audit fix
```

## 🐛 Troubleshooting

### Häufige Probleme:

#### App startet nicht:
1. Node.js Version prüfen (≥18.x)
2. Environment Variables prüfen
3. Plesk Logs einsehen
4. `npm install` ausführen

#### SSL-Probleme:
1. Let's Encrypt Certificate prüfen
2. HTTPS-Redirect in Plesk aktivieren
3. Mixed Content vermeiden

#### Upload-Probleme:
1. Ordner-Berechtigungen: `chmod 777 assets/uploads`
2. File Size Limits in Plesk prüfen
3. PHP Memory Limit erhöhen

#### Admin-Login funktioniert nicht:
1. Passwort-Hash prüfen: `npm run generate-hash`
2. JWT_SECRET konfiguriert?
3. Browser-Cookies aktiviert?

## 📞 Support

Bei Problemen:
1. **Plesk Logs** prüfen
2. **Browser Console** prüfen
3. **Environment Variables** validieren
4. **easyname.at Support** kontaktieren

## 🔄 Updates

```bash
# Repository aktualisieren
git pull origin main

# Dependencies aktualisieren
npm install

# App neu starten
# In Plesk: Node.js → Restart App
```

---

**Entwickelt für Plesk auf easyname.at**  
**Letzte Aktualisierung**: Juli 2025
