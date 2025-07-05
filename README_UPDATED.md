# Blog-System - Aktualisierte Dokumentation mit JWT-Authentifizierung

## 🎯 PROJEKTÜBERSICHT

Das Blog-System wurde erfolgreich auf **JWT-basierte Authentifizierung** umgestellt und bietet jetzt eine sichere, moderne und skalierbare Lösung für die Admin-Verwaltung.

## 🔑 NEUE JWT-AUTHENTIFIZIERUNG

### Login-Credentials
- **Username**: `admin`
- **Passwort**: `admin123`
- **Session-Dauer**: 24 Stunden (automatische Verlängerung)

### Sicherheitsfeatures
- 🔐 **HTTPS-verschlüsselte Übertragung** (Port 3443)
- 🍪 **httpOnly-Cookies** für JWT-Token-Speicherung
- 🔄 **Automatische Token-Verlängerung** alle 30 Minuten
- 🛡️ **bcrypt-gehashte Passwörter** (10 Salt-Rounds)
- 🚫 **Session-Ablauf-Behandlung** mit automatischem Logout

## 🚀 SCHNELLSTART

### 1. Server starten
```bash
cd "d:\source\OneMillionthUsername\Blog"
node server/app.js
```

### 2. Blog öffnen
- **HTTPS (empfohlen)**: https://localhost:3443
- **HTTP (Fallback)**: http://localhost:3000

### 3. Als Admin anmelden
1. Klick auf das 👑-Symbol (Login-Button)
2. Username: `admin`
3. Passwort: `admin123`
4. Nach erfolgreichem Login erscheint die Admin-Toolbar

### 4. Admin-Funktionen nutzen
- ✏️ **Blogposts erstellen**: Create-Seite über Navigation
- 🗑️ **Posts löschen**: Delete-Button in Post-Listen oder Einzelansicht
- 📸 **Bilder hochladen**: TinyMCE-Editor mit Drag & Drop
- 💬 **Kommentare verwalten**: Delete-Button bei Kommentaren

## 📁 PROJEKT-STRUKTUR

```
d:\source\OneMillionthUsername\Blog\
├── 📄 index.html                 # Hauptseite
├── 📄 package.json               # Dependencies (jsonwebtoken, bcrypt, cookie-parser)
├── 📊 JWT_IMPLEMENTATION_REPORT.md # Technische Implementierungsdetails
├── 
├── 📁 assets/
│   ├── 📁 css/
│   │   └── style.css            # Responsive Design mit Admin-Styles
│   ├── 📁 js/
│   │   ├── admin.js             # 🔑 JWT-basierte Admin-Funktionen
│   │   ├── utils.js             # API-Utilities mit JWT-Support
│   │   ├── tinymce-editor.js    # WYSIWYG-Editor mit JWT-Upload
│   │   ├── comments.js          # Kommentar-System mit JWT-Löschung
│   │   └── ai-assistant.js      # Google Gemini AI-Integration
│   └── 📁 uploads/              # Hochgeladene Bilder
│
├── 📁 server/
│   ├── app.js                   # 🔑 Express-Server mit JWT-Endpunkten
│   ├── auth.js                  # 🔑 JWT-Authentifizierungs-Modul
│   └── app_backup.js            # Backup der localStorage-Version
│
├── 📁 ssl/
│   ├── certificate.pem          # 🔒 SSL-Zertifikat (self-signed)
│   ├── private-key.pem          # 🔒 SSL-Private-Key
│   └── generate-certs.js        # SSL-Zertifikat-Generator
│
├── 📁 pages/
│   ├── create.html              # 🔑 Post-Erstellung (JWT-geschützt)
│   ├── list_posts.html          # Post-Liste mit Admin-Controls
│   ├── read_post.html           # Einzelpost mit Admin-Delete
│   ├── archiv.html              # Archiv-Ansicht
│   └── most_read.html           # Meistgelesene Posts
│
├── 📁 posts/                    # JSON-Dateien der Blogposts
├── 📁 comments/                 # JSON-Dateien der Kommentare
└── 📁 config/                   # 🔑 JWT-Secret-Key (automatisch generiert)
```

## 🔒 SICHERHEITSFEATURES

### Transport Security
- **HTTPS-Verschlüsselung** mit selbstsignierten Zertifikaten
- **HTTP zu HTTPS Redirect** für sichere Verbindungen
- **Security Headers**: CSP, HSTS, X-Frame-Options, X-XSS-Protection

### Authentication & Authorization
- **JWT-Token** mit 24h Gültigkeit
- **httpOnly-Cookies** gegen XSS-Angriffe
- **SameSite-Cookies** gegen CSRF-Angriffe
- **bcrypt-Passwort-Hashing** mit hoher Verschlüsselung
- **Admin-only Middleware** für geschützte Endpunkte

### Input Validation
- **XSS-Schutz** bei Kommentar-Eingaben
- **File-Upload-Validierung** für Bilder
- **JSON-Schema-Validation** für API-Endpunkte

## 🌐 API-ENDPUNKTE

### 🔓 Öffentliche Endpunkte
```
GET  /                           # Hauptseite
GET  /blogpost/:filename         # Einzelnen Post abrufen
GET  /blogposts                  # Alle Posts auflisten
GET  /most-read                  # Meistgelesene Posts
GET  /comments/:postFilename     # Kommentare zu einem Post
POST /comments/:postFilename     # Neuen Kommentar hinzufügen
GET  /assets/uploads/:filename   # Bilder ausliefern
```

### 🔑 JWT-geschützte Admin-Endpunkte
```
POST   /blogpost                      # Post erstellen (Admin only)
DELETE /blogpost/:filename            # Post löschen (Admin only)
DELETE /comments/:postFilename/:id    # Kommentar löschen (Admin only)
POST   /upload/image                  # Bild hochladen (Admin only)
DELETE /assets/uploads/:filename      # Bild löschen (Admin only)
```

### 🔐 Authentifizierungs-Endpunkte
```
POST /auth/login     # Admin-Anmeldung (Username/Passwort → JWT)
POST /auth/verify    # Token-Verifikation
POST /auth/refresh   # Token-Verlängerung
POST /auth/logout    # Abmeldung (Cookie löschen)
```

## 💻 ENTWICKLER-HINWEISE

### JWT-Token im Frontend verwenden
```javascript
// Token aus Cookie automatisch gelesen
const result = await makeApiRequestWithAuth('/admin-endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
});
```

### Neue Admin-Funktionen hinzufügen
1. **Server**: Endpunkt mit `authenticateToken, requireAdmin` Middleware schützen
2. **Frontend**: `makeApiRequestWithAuth()` für API-Aufrufe verwenden
3. **UI**: `isAdminLoggedIn` Variable für Sichtbarkeit prüfen

### Passwort ändern
Das Admin-Passwort wird in `server/auth.js` gehashed gespeichert:
```javascript
// Neues Passwort hashen
const newHash = await bcrypt.hash('NEUES_PASSWORT', 10);
// Hash in ADMIN_CONFIG.passwordHash ersetzen
```

## 🎨 FEATURES

### ✅ Blog-Funktionen
- 📝 **WYSIWYG-Editor** (TinyMCE) mit Drag & Drop-Bildern
- 🏷️ **Tag-System** für Kategorisierung
- 📊 **Aufruf-Statistiken** (Most Read)
- 💬 **Kommentar-System** mit Moderation
- 📱 **Responsive Design** für alle Geräte

### ✅ Admin-Funktionen
- 👑 **Sichere JWT-Authentifizierung**
- ✏️ **Post-Erstellung und -Bearbeitung**
- 🗑️ **Post- und Kommentar-Löschung**
- 📸 **Bild-Upload mit automatischer Komprimierung**
- 📊 **Admin-Toolbar mit Session-Anzeige**

### ✅ AI-Integration
- 🤖 **Google Gemini AI-Assistant**
- 💡 **Content-Vorschläge und -Optimierung**
- 🔧 **Modular integriert und optional**

### ✅ Sicherheit
- 🔒 **HTTPS-Verschlüsselung**
- 🛡️ **JWT-basierte Authentifizierung**
- 🍪 **Sichere Cookie-Verwaltung**
- 🚫 **XSS- und CSRF-Schutz**

## 🔧 TROUBLESHOOTING

### Server startet nicht
```bash
# Abhängigkeiten installieren
npm install

# SSL-Zertifikate generieren
node ssl/generate-certs.js

# Server starten
node server/app.js
```

### Login funktioniert nicht
- **Prüfen**: HTTPS-Verbindung verwenden (localhost:3443)
- **Credentials**: admin / admin123
- **Browser**: Cookies aktiviert?
- **Console**: Fehler in Browser-Entwicklertools prüfen

### JWT-Token-Probleme
- **Session abgelaufen**: Automatischer Logout nach 24h
- **Cookie-Probleme**: Browser-Cache leeren
- **HTTPS-Warnung**: Selbstsigniertes Zertifikat akzeptieren

## 📈 PERFORMANCE & MONITORING

- **Bild-Komprimierung**: Automatisch für Upload-Optimierung
- **Caching**: Browser-Cache für statische Assets
- **Session-Management**: Automatische Token-Verlängerung
- **Logging**: Console-Ausgaben für Debugging

## 🎉 ZUSAMMENFASSUNG

Das Blog-System ist jetzt **produktionsbereit** mit:
- ✅ **Moderner JWT-Authentifizierung**
- ✅ **HTTPS-Sicherheit**
- ✅ **Vollständiger Admin-Funktionalität**
- ✅ **Responsive Design**
- ✅ **AI-Integration**
- ✅ **Skalierbare Architektur**

**Viel Spaß beim Bloggen! 🚀**
