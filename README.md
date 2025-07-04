# Sub specie aeternitatis Blog

### 🔐 Admin-System
- **Vollständiges Admin-Management** in separatem Modul (`admin.js`)
- **Sichere Authentifizierung** mit localStorage-basiertem Login
- **Admin-Toolbar** mit Logout-Funktion und visuellen Indikatoren
- **Erweiterte Berechtigung-Checks** für alle Admin-Funktionen
- **Post-Verwaltung:**
  - Delete-Buttons nur für Admins sichtbar
  - Sichere Server-seitige Post-Löschung
  - Bestätigungsdialoge für kritische Aktionen
- **Admin-only Features:**
  - Zugriff auf Create-Seite nur für authentifizierte Admins
  - TinyMCE-Editor wird nur für Admins angezeigt
  - Erweiterte Content-Management-Funktionen

### 🛡️ Sicherheit & Robustheit
- **XSS-Schutz:**
  - Server-seitige Content-Sanitization mit Regex-basierter Bereinigung
  - Client-seitige Input-Validierung und -Sanitization
  - Content Security Policy (CSP) Headers im Server
- **TinyMCE Security:**
  - Hardened Konfiguration mit eingeschränkten Plugins
  - Sichere Paste-Optionen und Content-Filtering
  - Validierte HTML-Ausgabe mit Schutz vor Code-Injection
- **Dateiname-Sicherheit:**
  - Robuste Server-seitige Dateiname-Sanitization
  - Schutz vor Path-Traversal-Angriffen
  - Windows/Linux/Mac-kompatible Dateinamen
- **API-Sicherheit:**
  - Input-Validierung für alle Server-Endpunkte
  - Error-Handling ohne Informationslecks
  - Rate-Limiting-bereit (erweiterbar)

### 🐛 Vollständige Debugging-Unterstützung
- **VS Code Integration:**
  - Vorkonfigurierte `launch.json` für Node.js und Browser-Debugging
  - "Debug Full Stack" Compound-Konfiguration für gleichzeitiges Frontend/Backend-Debugging
  - Firefox-Unterstützung mit korrekter URL-Konfiguration
- **Browser-Debugging:**
  - Console.log und debugger-Statements in allen kritischen Funktionen
  - Detaillierte Fehlerbehandlung mit aussagekräftigen Meldungen
  - Breakpoint-freundlicher Code mit klarer Funktionsstruktur
- **Development Tools:**
  - `.gitignore` konfiguriert für VS Code und Development-Dateien
  - Debugging-Anweisungen in README für Firefox und Chrome
  - Strukturierter Code für einfache Fehlerdiagnose

### ⚙️ Modularisierte Architekturuter Blog über Philosophie, Wissenschaft und Künstliche Intelligenz mit professionellem WYSIWYG-Editor und vollständig modularisierter JavaScript-Architektur.

## Projektstruktur

```
Blog/
├── 📁 assets/                  # Statische Ressourcen
│   ├── 📁 css/                 # Stylesheets
│   │   └── style.css           # Haupt-CSS-Datei (erweitert & responsive)
│   └── 📁 js/                  # Modularisierte JavaScript-Dateien
│       ├── utils.js            # Blog-Utility-Funktionen (admin-agnostisch)
│       ├── admin.js            # Admin-System (Login, Delete, Verwaltung)
│       └── tinymce-editor.js   # TinyMCE Editor-Funktionalität (vollständig)
├── 📁 pages/                   # HTML-Seiten (alle modularisiert)
│   ├── about.html              # Über mich Seite
│   ├── archiv.html             # Archiv-Seite (Posts > 3 Monate)
│   ├── create.html             # Blogpost erstellen (TinyMCE Editor)
│   ├── list_posts.html         # Aktuelle Blogposts (letzte 3 Monate)
│   ├── most_read.html          # Meistgelesene Posts mit Analytics
│   └── read_post.html          # Einzelnen Blogpost lesen
├── 📁 posts/                   # Blogpost-Dateien (JSON)
│   ├── 2025-07-03-blogpost-3.json
│   ├── 2025-07-03-erster.json
│   └── ... (weitere Posts)
├── 📁 server/                  # Server-Code
│   └── app.js                  # Express.js Server mit View-Tracking, Analytics & Admin-API
├── 📁 .vscode/                 # VS Code Debugging-Konfiguration
│   └── launch.json             # Debug-Konfiguration für Node.js und Firefox
├── .gitignore                  # Git-Ignore-Datei
├── index.html                  # Startseite
├── package.json                # Node.js Abhängigkeiten
└── README.md                   # Diese Datei
```

## Installation

1. **Repository klonen:**
   ```bash
   git clone [repository-url]
   cd Blog
   ```

2. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

3. **TinyMCE API-Schlüssel konfigurieren:**
   - Gehe zu https://www.tiny.cloud/ und registriere dich
   - Ersetze in `pages/create.html` den Platzhalter-API-Schlüssel

4. **Server starten:**
   ```bash
   npm start
   ```

5. **Blog öffnen:**
   Öffne deinen Browser und gehe zu `http://localhost:3000`

## Features

### �️ Modularisierte Architektur
- **Vollständig modularisierte JavaScript-Funktionen:**
  - `utils.js`: Blog-Utility-Funktionen (admin-agnostisch)
  - `admin.js`: Komplettes Admin-System mit Login/Logout/Delete
  - `tinymce-editor.js`: TinyMCE Editor-Funktionalität mit Debugging
- **Saubere Trennung** von HTML-Struktur und JavaScript-Logik
- **Wiederverwendbare Funktionen** für konsistente Funktionalität
- **Wartbare Codebasis** mit zentralisierter Logik

### �🎨 Design & UX
- **Elegante Typografie** mit Google Fonts (Playfair Display, Crimson Text)
- **Vollständig responsive Design** für alle Geräte (Mobile-First)
- **Moderne UI** mit Bootstrap 4 und erweiterten Custom CSS
- **Interaktive Navigationselemente** mit Hover-Effekten und Animationen
- **Konsistente Benutzerführung** über alle Seiten hinweg
- **Loading-Spinner** und Feedback-Nachrichten für bessere UX
- **Elegante Typografie** mit Google Fonts (Playfair Display, Crimson Text)
- **Responsive Design** für alle Geräte
- **Moderne UI** mit Bootstrap und Custom CSS
- **Interaktive Navigationselemente** mit Hover-Effekten
- **Erweiterte Vorschau-Funktionalität**

### ✏️ Erweiterte Editor-Funktionen (vollständig modularisiert)
- **TinyMCE WYSIWYG-Editor** mit deutschsprachiger Oberfläche
- **Vollständig ausgelagerte Editor-Logik** in `tinymce-editor.js`
- **Umfangreiche Formatierungsoptionen:**
  - Textformatierung (Fett, Kursiv, Unterstrichen, Durchgestrichen)
  - Überschriften (H1-H6) mit konsistenter Typografie
  - Listen (Aufzählung, Nummerierung, verschachtelt)
  - Tabellen mit erweiterten Design-Optionen
  - Blockquotes und Code-Blöcke mit Syntax-Highlighting
  - Farben und Schriftgrößen (vollständig anpassbar)
  - Emoticons und Sonderzeichen
- **Intelligentes Vorlagen-System:**
  - Blog-Post-Vorlage (Standard-Struktur)
  - Philosophie-Vorlage (Akademische Gliederung)
  - Wissenschafts-Vorlage (Forschungsbasierte Struktur)
- **Auto-Save-Funktionalität** (alle 20 Sekunden + manuell)
- **Persistente Entwürfe** (localStorage + Wiederherstellung)
- **Live-Vorschau** mit Echtzeit-Updates während des Schreibens
- **Erweiterte Tastenkürzel** (Strg+S, Strg+Enter, etc.)
- **Drag & Drop Bild-Upload** mit Data-URL-Unterstützung
- **Intelligente Paste-Optionen** (behält Formatierung)

### 📝 Content-Management (vollständig modularisiert)
- **Modularisierte Seiten-Funktionalität:**
  - `loadAndDisplayRecentPosts()` für aktuelle Posts (list_posts.html)
  - `loadAndDisplayArchivePosts()` für Archiv-Posts (archiv.html)
  - `loadAndDisplayMostReadPosts()` für Statistiken (most_read.html)
  - `loadAndDisplayBlogPost()` für Einzelansicht (read_post.html)
- **Intelligente Blogpost-Erstellung** mit Titel, Inhalt und Tags
- **Erweiterte Tag-Verwaltung** mit Vorschlägen und Auto-Vervollständigung
- **Robuste Dateiname-Bereinigung** (entfernt alle ungültigen Zeichen für Windows/Mac/Linux)
- **Zeitbasierte Content-Filterung:**
  - Aktuelle Posts (letzte 3 Monate) mit "NEU"-Badges
  - Archiv-Posts (älter als 3 Monate)
  - Detaillierte Zeitangaben ("vor X Tagen", "Heute", etc.)
- **Erweiterte Post-Metadaten** mit Lesezeit-Berechnung

### 📊 Analytics & Performance
- **Erweiterte View-Tracking-Funktionalität:**
  - Automatisches Zählen aller Seitenaufrufe
  - Ranking nach Beliebtheit mit visuellen Indikatoren
  - Persistente Statistiken (In-Memory, erweiterbar auf Datenbank)
- **Performance-Optimierungen:**
  - Modulare JavaScript-Architektur für schnellere Ladezeiten
  - Optimierte Fehlerbehandlung mit Retry-Funktionalität
  - Responsive Design für bessere Mobile-Performance
- **Benutzerfreundliche Error-States:**
  - Detaillierte Fehlermeldungen mit Retry-Buttons
  - Loading-Spinner für alle Async-Operationen
  - Graceful Fallbacks bei Netzwerkfehlern

### 🔧 Technische Architektur
- **Backend:**
  - Node.js mit Express.js Server
  - ES Modules für moderne JavaScript-Entwicklung
  - RESTful API mit vollständiger CRUD-Funktionalität
  - JSON-basierte Blogpost-Speicherung (erweiterbar auf Datenbank)
- **Frontend:**
  - Vollständig modularisierte JavaScript-Architektur
  - Zentrale Utility-Funktionen in `utils.js`
  - Separierte Editor-Logik in `tinymce-editor.js`
  - Konsistente Error-Handling und User-Feedback
- **Code-Qualität:**
  - Saubere Trennung von Concerns (HTML/CSS/JS)
  - Wiederverwendbare und testbare Funktionen
  - Konsistente Namenskonventionen
  - Erweiterte Dokumentation und Kommentierung

## API-Endpunkte

### Öffentliche Endpunkte:
- `GET /` - Startseite (index.html)
- `GET /blogposts` - Alle Blogposts abrufen (JSON Array)
- `GET /blogpost/:filename` - Einzelnen Blogpost abrufen (mit automatischem View-Tracking)
- `GET /most-read` - Meistgelesene Blogposts abrufen (sortiert nach Views)

### Content-Management:
- `POST /blogpost` - Neuen Blogpost erstellen (Admin-only)
- `DELETE /blogpost/:filename` - Blogpost löschen (Admin-only mit Sicherheitschecks)
  ```json
  {
    "title": "Titel des Blogposts",
    "content": "HTML-Content des Posts",
    "tags": ["tag1", "tag2", "tag3"]
  }
  ```

### Response-Formate:
- **Blogpost-Objekt:**
  ```json
  {
    "title": "Titel",
    "content": "HTML-Content",
    "tags": ["tag1", "tag2"],
    "date": "ISO-Datum",
    "filename": "dateiname.json",
    "views": 42
  }
  ```

## Admin-System

### Admin-Anmeldung:
1. Klicke auf "Admin" in der Navigation (jede Seite)
2. Gib das Admin-Passwort ein (Standard: "admin123" - **SOFORT ÄNDERN!**)
3. Admin-Toolbar erscheint mit Logout-Option
4. Create-Seite und Delete-Buttons werden verfügbar

### Admin-Funktionen:
- **Post-Erstellung:** Zugriff auf `/pages/create.html` nur für Admins
- **Post-Löschung:** Delete-Buttons erscheinen nur für angemeldete Admins
- **Content-Management:** Vollständige CRUD-Operationen für alle Posts
- **Sichere Abmeldung:** Logout entfernt alle Admin-Berechtigungen
- **Passwort-Management:** Automatische Warnung beim ersten Login

### 🔐 Sicherheitsverbesserungen (NEU):
- **SHA-256 Hash-Passwörter:** Kein Klartext mehr im Code
- **Automatisches Setup:** Warnung bei Standard-Passwort
- **Sichere Speicherung:** Nur gehashte Passwörter in localStorage
- **API-Schlüssel-Sicherheit:** Keine hardcodierten Schlüssel

## Debugging & Development

### VS Code Debugging:
1. **Setup:** `.vscode/launch.json` ist bereits konfiguriert
2. **Node.js Debugging:**
   - F5 drücken oder "Debug: Launch Node.js" auswählen
   - Breakpoints in `server/app.js` setzen
3. **Firefox Debugging:**
   - "Debug: Launch Firefox" auswählen
   - Breakpoints in Browser-DevTools oder VS Code setzen
4. **Full Stack Debugging:**
   - "Debug Full Stack" für gleichzeitiges Frontend/Backend-Debugging

### Browser-Debugging (Firefox/Chrome):
1. **DevTools öffnen:** F12 oder Rechtsklick → "Element untersuchen"
2. **Breakpoints setzen:**
   - Sources-Tab → Datei auswählen → Zeilennummer anklicken
   - Oder `debugger;` Statement im Code verwenden
3. **Console verwenden:**
   - Variablen inspizieren mit `console.log()`
   - Live-Code ausführen in der Console
4. **Netzwerk-Tab:** API-Calls und Responses überwachen

### Debugging-Features im Code:
- **Console-Logs:** Detaillierte Ausgaben in allen kritischen Funktionen
- **Debugger-Statements:** In `tinymce-editor.js` und `admin.js` für Breakpoints
- **Error-Handling:** Aussagekräftige Fehlermeldungen mit Stack-Traces
- **Modular Structure:** Einzelne Funktionen einfach isoliert testbar

## TinyMCE-Konfiguration

### API-Schlüssel einrichten:
1. Gehe zu https://www.tiny.cloud/
2. Registriere dich für ein kostenloses Konto
3. Erstelle ein neues Projekt
4. Kopiere den API-Schlüssel
5. Ersetze in `pages/create.html`:
   ```html
   <script src="https://cdn.tiny.cloud/1/IHR_API_SCHLÜSSEL/tinymce/6/tinymce.min.js"></script>
   ```

### Kostenlose Limits:
- 1.000 Ladevorgänge pro Monat
- Alle Standard-Plugins inklusive
- Perfekt für kleine bis mittelgroße Blogs

## Verwendung

### Blogpost erstellen (Admin-only):
1. **Admin-Anmeldung:** Zuerst über "Admin" in der Navigation anmelden
2. **Create-Seite:** Navigiere zu `/pages/create.html` (nur für Admins zugänglich)
3. **Editor verwenden:** TinyMCE lädt automatisch mit vollständiger Toolbar
4. **Debugging:** Bei Problemen F12 drücken und Console auf Fehlermeldungen prüfen

### Blogpost löschen (Admin-only):
1. **Admin-Anmeldung:** Stelle sicher, dass du als Admin angemeldet bist
2. **Delete-Buttons:** Erscheinen automatisch neben jedem Post (rot)
3. **Bestätigung:** Sicherheitsabfrage vor dem Löschen
4. **Server-Validation:** Server prüft Berechtigung und Dateiname-Sicherheit
2. Nutze die Editor-Toolbar für Formatierungen
3. Verwende Vorlagen für strukturierte Posts
4. Speichere Entwürfe automatisch oder manuell
5. Veröffentliche mit einem Klick

### Tastenkürzel:
- `Strg + S` - Entwurf speichern
- `Strg + Enter` - Blogpost veröffentlichen
- `Strg + Z` - Rückgängig machen
- `Strg + Y` - Wiederholen

### Vorlagen verwenden:
- **Blog-Vorlage**: Standard-Blogpost-Struktur
- **Philosophie-Vorlage**: Akademische Gliederung
- **Wissenschafts-Vorlage**: Forschungsbasierte Struktur

## Entwicklung & Erweiterung

### Modularisierte Struktur nutzen:
Die gesamte JavaScript-Funktionalität ist in zwei Hauptdateien organisiert:

#### `assets/js/utils.js` - Blog-Utility-Funktionen (admin-agnostisch):
- `initializeBlogUtilities()` - Haupt-Initialisierungsfunktion für alle Seiten
- `loadAllBlogPosts()` - Basisfunktion zum Laden aller Posts
- `loadBlogPost(filename)` - Einzelnen Post laden
- `loadAndDisplayRecentPosts()` - Für list_posts.html
- `loadAndDisplayArchivePosts()` - Für archiv.html  
- `loadAndDisplayMostReadPosts()` - Für most_read.html
- `loadAndDisplayBlogPost()` - Für read_post.html
- Hilfsfunktionen: `formatPostDate()`, `calculateReadingTime()`, etc.

#### `assets/js/admin.js` - Vollständiges Admin-System:
- `initializeAdminSystem()` - Admin-System-Initialisierung für alle Seiten
- `showAdminLogin()` - Admin-Login-Dialog anzeigen
- `performAdminLogin()` - Login-Validierung und Session-Setup
- `showAdminToolbar()` - Admin-Toolbar mit Logout-Option
- `addDeleteButtonsToPosts()` - Delete-Buttons zu Post-Listen hinzufügen
- `deletePost(filename)` - Sichere Post-Löschung mit Bestätigung
- `isAdminLoggedIn()` - Admin-Status prüfen
- `logoutAdmin()` - Sichere Abmeldung und Session-Cleanup

#### `assets/js/tinymce-editor.js` - Editor-Funktionalität mit Debugging:
- `initializeCreatePage()` - Vollständige Editor-Initialisierung mit Admin-Check
- `initializeTinyMCE()` - TinyMCE-Setup mit Debugging und Error-Handling
- Template-Funktionen für verschiedene Post-Typen
- Draft-Management (speichern/laden/löschen)
- Auto-Save und Tastenkürzel
- Form-Validierung und -Submission

### Neue Seite hinzufügen:
1. HTML-Datei in `pages/` erstellen
2. Beide JavaScript-Module einbinden:
   ```html
   <script src="../assets/js/utils.js"></script>
   <script src="../assets/js/admin.js"></script>
   ```
3. Initialisierung aufrufen:
   ```javascript
   document.addEventListener('DOMContentLoaded', function() {
       initializeBlogUtilities();
       initializeAdminSystem();
   });
   ```
4. Navigation in relevanten Seiten aktualisieren

### Neue Editor-Funktionen:
1. Funktionen in `tinymce-editor.js` erweitern
2. TinyMCE-Konfiguration anpassen
3. Neue Templates oder Toolbar-Buttons hinzufügen

### Styling erweitern:
- Alle Styles zentral in `assets/css/style.css`
- Responsive Design mit Mobile-First-Ansatz
- Konsistente Farbpalette und Typografie
- Erweiterte Editor-Styles für TinyMCE-Integration

### Server-Funktionalität erweitern:
- Neue Routen in `server/app.js` hinzufügen
- Admin-Berechtigungen für neue Endpunkte implementieren
- View-Tracking für zusätzliche Metriken erweitern
- Datenbankintegration für persistente Speicherung
- API-Endpunkte für erweiterte Funktionalität
- Sicherheits-Middleware für neue Features

## Erweiterte Funktionen

### Vollständig modularisierte Architektur:
- **Saubere Code-Trennung:** 
  - `utils.js`: Blog-Funktionen ohne Admin-Abhängigkeiten
  - `admin.js`: Komplettes Admin-System isoliert
  - `tinymce-editor.js`: Editor mit Debugging und Error-Handling
- **Admin-System Integration:** Alle Seiten initialisieren sowohl Blog- als auch Admin-Funktionen
- **Debugging-freundlich:** Console-Logs und Breakpoints in allen kritischen Funktionen
- **Wiederverwendbarkeit:** Funktionen können einfach in neuen Seiten verwendet werden  
- **Wartbarkeit:** Änderungen an der Kernfunktionalität wirken sich automatisch auf alle Seiten aus
- **Testbarkeit:** Einzelne Funktionen können isoliert getestet werden
- **Sicherheit:** Admin-Funktionen sind klar getrennt und geschützt

### Intelligente Content-Verwaltung:
- **Zeitbasierte Filterung:** Automatische Trennung zwischen aktuellen Posts und Archiv
- **Smart Badges:** "NEU"-Kennzeichnung für Posts der letzten 7 Tage
- **Relative Zeitangaben:** "vor X Tagen", "vor X Wochen", etc.
- **Lesezeit-Berechnung:** Automatische Schätzung basierend auf Wortanzahl

### Auto-Save & Draft-Management:
- **Persistente Entwürfe:** Automatisches Speichern in localStorage alle 20-30 Sekunden
- **Crash-Recovery:** Wiederherstellung bei Browser-Neustart oder Verbindungsabbruch
- **Version-Management:** Timestamp-basierte Entwurf-Verwaltung
- **Warnung vor Datenverlust:** Browser-seitige Bestätigung beim Verlassen mit ungespeicherten Änderungen

### Erweiterte Dateiname-Bereinigung:
- **Cross-Platform-Kompatibilität:** Entfernung aller problematischen Zeichen für Windows, Mac, Linux
- **Konsistente Namensgebung:** Automatische Normalisierung zu URL-freundlichen Namen
- **Konfliktvermeidung:** Intelligente Behandlung von Sonderzeichen und Leerzeichen

### Performance & UX-Optimierungen:
- **Lazy Loading:** Effiziente Datenladung nur bei Bedarf
- **Error Recovery:** Retry-Buttons und graceful Fallbacks bei Netzwerkfehlern
- **Loading States:** Visuelle Indikatoren für alle Async-Operationen
- **Responsive Design:** Optimiert für alle Bildschirmgrößen und Touch-Geräte

## Philosophie & Vision

> "Sub specie aeternitatis" - unter dem Gesichtspunkt der Ewigkeit

Dieser Blog verbindet philosophische Reflexion mit wissenschaftlicher Neugier und technologischer Innovation. Er ist ein Ort des Nachdenkens über die großen Fragen unserer Zeit, ausgestattet mit modernen Werkzeugen für professionelles Content-Management.

### Technische Philosophie:
- **Modularität:** Saubere Code-Architektur für nachhaltige Entwicklung
- **Benutzerfreundlichkeit:** Intuitive Bedienung ohne technische Hürden  
- **Erweiterbarkeit:** Flexible Basis für zukünftige Features
- **Performance:** Optimierte Ladezeiten und responsives Design
- **Zugänglichkeit:** Barrierefreie Gestaltung für alle Nutzer

### Content-Philosophie:
- **Tiefe vor Breite:** Fokus auf durchdachte, substanzielle Beiträge
- **Interdisziplinarität:** Verbindung von Philosophie, Wissenschaft und Technologie
- **Zeitlosigkeit:** Inhalte, die auch langfristig relevant bleiben
- **Interaktivität:** Moderne Tools für lebendige Diskussionen

## Zukunftspläne

### Geplante Erweiterungen:
- **Erweiterte Admin-Authentifizierung:** JWT-Token, Session-Management, Rollen-System
- **Datenbank-Integration:** Persistente Speicherung für Posts, Analytics und Benutzer
- **Kommentar-System:** Interaktive Diskussionen zu Blogposts mit Moderation
- **Benutzer-Management:** Multi-User-Support mit verschiedenen Rollen (Admin, Editor, Autor)
- **Erweiterte Analytics:** Detaillierte Besucherstatistiken, Engagement-Metriken, A/B-Testing
- **SEO-Optimierung:** Meta-Tags, Sitemaps, strukturierte Daten, Open Graph
- **Progressive Web App:** Offline-Funktionalität, Service Worker, App-Manifest
- **Backup & Export:** Automatisierte Backups, Import/Export-Funktionen
- **Media-Management:** Bild-Upload, Galerie-System, CDN-Integration

### Technische Roadmap:
- **Sicherheit:** HTTPS, erweiterte XSS-/CSRF-Schutz, Rate-Limiting, Input-Validation
- **API-Erweiterung:** GraphQL für komplexere Datenabfragen, RESTful API v2
- **Testing-Framework:** Automatisierte Tests für Frontend, Backend und Integration
- **CI/CD-Pipeline:** Automatisierte Deployments, Quality Gates, Staging-Umgebung
- **Microservices:** Modularisierung des Backends für bessere Skalierbarkeit
- **Containerization:** Docker-Setup für Development und Production
- **Monitoring:** Logging, Error-Tracking, Performance-Monitoring
- **Documentation:** API-Docs, JSDoc, erweiterte Entwickler-Dokumentation

## Lizenz

Dieses Projekt steht unter der ISC-Lizenz. Es ist frei verfügbar für Bildungs- und persönliche Zwecke.

---

---

## Aktuelle Version: Highlights

### ✅ Vollständig implementiert:
- **Modularisierte JavaScript-Architektur** mit getrennten Verantwortlichkeiten
- **Vollständiges Admin-System** mit sicherer Authentifizierung und CRUD-Operationen
- **TinyMCE WYSIWYG-Editor** mit erweiterten Features und Debugging
- **Responsive Design** für alle Geräte mit modernem UI/UX
- **View-Tracking und Analytics** mit Echtzeit-Statistiken
- **Vollständige Debugging-Unterstützung** für VS Code und Browser
- **Sicherheitsfeatures** gegen XSS, Code-Injection und Path-Traversal
- **Cross-Platform-Kompatibilität** für Windows, Mac und Linux

### 🛠️ Development-Ready:
- **VS Code Integration:** Vorkonfigurierte Debug-Setups für Full-Stack-Development
- **Browser-Debugging:** Strukturierter Code mit Console-Logs und Breakpoints
- **Git-Integration:** `.gitignore` konfiguriert für saubere Repositories
- **Modular Testing:** Jede Komponente einzeln testbar und debuggbar
- **Error-Handling:** Robuste Fehlerbehandlung mit aussagekräftigen Meldungen

**Entwickelt mit ❤️ für tiefgehende Gedanken und moderne Webtechnologien.**

## 🔐 Sicherheit

### API-Schlüssel-Sicherheit
- **Google Gemini API**: ✅ Sicher - Nur lokale Browser-Speicherung
- **TinyMCE API**: ✅ Sicher - Öffentlicher Editor-Schlüssel
- **Keine hardcodierten Secrets**: ✅ Alle sensiblen Daten benutzergesteuert

### Admin-Sicherheit (NEU)
- **SHA-256 Hash-Passwörter**: ✅ Kein Klartext im Code
- **Automatisches Setup**: ✅ Warnung bei unsicherem Standard-Passwort
- **Session-Management**: 24h Ablaufzeit mit sicherer Token-Speicherung
- **Browser-only Authentifizierung**: Keine Server-side Session-Speicherung

### Content-Sicherheit
- **Input-Sanitization**: Server- und Client-seitige Bereinigung
- **XSS-Schutz**: Content Security Policy Headers
- **Path-Traversal-Schutz**: Sichere Dateinamen-Validierung
- **File-Upload-Sicherheit**: Typ- und Größen-Validierung

### Erste Schritte nach Installation:
1. **Admin-Passwort ändern**: Beim ersten Login werden Sie automatisch gewarnt
2. **Gemini API-Schlüssel**: Über den "AI Setup" Button in der Editor-Toolbar eingeben
3. **HTTPS verwenden**: In Produktionsumgebungen unbedingt SSL aktivieren

### Detaillierte Sicherheitsinformationen:
Siehe `SECURITY.md` für vollständige Sicherheitsrichtlinien und Deployment-Empfehlungen.

---
