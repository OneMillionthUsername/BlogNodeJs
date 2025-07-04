# 🔐 Blog Sicherheits-Konfiguration

## API-Schlüssel Sicherheit ✅

### Google Gemini API
- **Status**: ✅ SICHER
- **Speicherung**: Nur im Browser localStorage
- **Kein Serverversand**: ✅
- **Kein Hardcoding**: ✅

### TinyMCE Editor API (NEU)
- **Status**: ✅ SICHER (nach Korrektur)
- **Vorher**: ❌ Hardcodiert im HTML (Sicherheitsrisiko!)
- **Jetzt**: ✅ Dynamisches Laden mit localStorage
- **Setup**: Über "Editor Setup" Button im Editor
- **Fallback**: Development-Modus ohne API-Schlüssel

### Sicherheitsfeatures:
1. **Beide API-Schlüssel** werden vom Benutzer selbst eingegeben
2. Werden nur lokal im Browser gespeichert
3. Automatische Setup-Dialoge für bessere UX
4. Fehlerbehandlung bei ungültigen Schlüsseln
5. **TinyMCE**: Dynamisches Script-Loading basierend auf API-Schlüssel

## Admin-Passwort Sicherheit 🔧

### Neu implementiert:
- **SHA-256 Hash**: Passwort wird gehasht gespeichert
- **Kein Klartext**: Passwort nicht mehr im Code sichtbar
- **Setup-System**: Automatische Warnung bei Standard-Passwort
- **localStorage**: Hash wird sicher im Browser gespeichert

### Standard-Passwort:
- **Default**: `admin123` (nur für erste Einrichtung)
- **Hash**: `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`
- **Empfehlung**: Sofort ändern!

### Passwort ändern:
1. Beim ersten Admin-Login erscheint Setup-Dialog
2. Oder manuell: `setupAdminPassword()` in Konsole ausführen
3. Mindestens 8 Zeichen empfohlen

## Weitere Sicherheitsmaßnahmen

### Bereits implementiert:
- ✅ Content Security Policy (CSP) Header
- ✅ Input-Sanitization (Server & Client)
- ✅ TinyMCE Security-Konfiguration
- ✅ Image Upload Validierung
- ✅ Admin Token Ablaufzeit (24h)

### Für Produktion empfohlen:
- 🔧 HTTPS verwenden
- 🔧 Rate Limiting für API-Endpunkte
- 🔧 Session-basierte Authentifizierung statt localStorage
- 🔧 Regelmäßige Sicherheitsupdates
- 🔧 Backup-Strategie für Posts und Kommentare

## Deployment-Sicherheit

### Server-Konfiguration:
```bash
# Umgebungsvariablen setzen
export NODE_ENV=production
export PORT=3000

# PM2 für Prozessmanagement
npm install -g pm2
pm2 start server/app.js --name "blog"
```

### Reverse Proxy (nginx):
```nginx
server {
    listen 443 ssl;
    server_name ihr-domain.de;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Firewall-Regeln:
```bash
# Nur notwendige Ports öffnen
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

## Monitoring & Wartung

### Log-Monitoring:
- Server-Logs überwachen
- Fehlgeschlagene Login-Versuche protokollieren
- Ungewöhnliche API-Zugriffe beobachten

### Regelmäßige Aufgaben:
- Dependencies aktualisieren: `npm audit && npm update`
- Backup erstellen: Posts, Kommentare, Uploads
- SSL-Zertifikate erneuern

## Notfall-Zugänge

### Admin-Zugang wiederherstellen:
```javascript
// In Browser-Konsole ausführen:
localStorage.removeItem('blog_admin_password_hash');
// Dann mit "admin123" einloggen und neues Passwort setzen
```

### API-Schlüssel zurücksetzen:
```javascript
// In Browser-Konsole:
localStorage.removeItem('gemini_api_key');
localStorage.removeItem('tinymce_api_key');
// Dann neue Schlüssel in UI eingeben
```
