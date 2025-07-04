# Sub specie aeternitatis Blog

Ein eleganter, modular aufgebauter Blog über Philosophie, Wissenschaft und Künstliche Intelligenz mit professionellem WYSIWYG-Editor und vollständig modularisierter JavaScript-Architektur.

## Projektstruktur

```
Blog/
├── 📁 assets/                  # Statische Ressourcen
│   ├── 📁 css/                 # Stylesheets
│   │   └── style.css           # Haupt-CSS-Datei (erweitert & responsive)
│   └── 📁 js/                  # Modularisierte JavaScript-Dateien
│       ├── utils.js            # Utility-Funktionen für alle Seiten
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
│   └── app.js                  # Express.js Server mit View-Tracking & Analytics
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
  - `utils.js`: Zentrale Utility-Funktionen für alle Seiten
  - `tinymce-editor.js`: Komplette TinyMCE Editor-Funktionalität
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
- `POST /blogpost` - Neuen Blogpost erstellen
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

### Blogpost erstellen:
1. Navigiere zu `/pages/create.html`
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

#### `assets/js/utils.js` - Zentrale Utility-Funktionen:
- `loadAllBlogPosts()` - Basisfunktion zum Laden aller Posts
- `loadBlogPost(filename)` - Einzelnen Post laden
- `loadAndDisplayRecentPosts()` - Für list_posts.html
- `loadAndDisplayArchivePosts()` - Für archiv.html  
- `loadAndDisplayMostReadPosts()` - Für most_read.html
- `loadAndDisplayBlogPost()` - Für read_post.html
- Hilfsfunktionen: `formatPostDate()`, `calculateReadingTime()`, etc.

#### `assets/js/tinymce-editor.js` - Editor-Funktionalität:
- `initializeBlogEditor()` - Vollständige Editor-Initialisierung
- Template-Funktionen für verschiedene Post-Typen
- Draft-Management (speichern/laden/löschen)
- Auto-Save und Tastenkürzel
- Form-Validierung und -Submission

### Neue Seite hinzufügen:
1. HTML-Datei in `pages/` erstellen
2. `<script src="../assets/js/utils.js"></script>` einbinden
3. Entsprechende Funktion aus utils.js aufrufen
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
- View-Tracking für zusätzliche Metriken erweitern
- Datenbankintegration für persistente Speicherung
- API-Endpunkte für erweiterte Funktionalität

## Erweiterte Funktionen

### Vollständig modularisierte Architektur:
- **Saubere Code-Trennung:** Jede Seite nutzt spezifische Funktionen aus den zentralen JS-Modulen
- **Wiederverwendbarkeit:** Funktionen können einfach in neuen Seiten verwendet werden  
- **Wartbarkeit:** Änderungen an der Kernfunktionalität wirken sich automatisch auf alle Seiten aus
- **Testbarkeit:** Einzelne Funktionen können isoliert getestet werden

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
- **Datenbank-Integration:** Persistente Speicherung für Posts und Analytics
- **Kommentar-System:** Interaktive Diskussionen zu Blogposts
- **Benutzer-Management:** Authentifizierung und Rollen-Management
- **Erweiterte Analytics:** Detaillierte Besucherstatistiken und Engagement-Metriken
- **SEO-Optimierung:** Meta-Tags, Sitemaps und strukturierte Daten
- **Progressive Web App:** Offline-Funktionalität und App-ähnliche Erfahrung

### Technische Roadmap:
- **API-Erweiterung:** GraphQL für komplexere Datenabfragen
- **Testing-Framework:** Automatisierte Tests für alle Module
- **CI/CD-Pipeline:** Automatisierte Deployments und Quality Gates
- **Microservices:** Modularisierung des Backends für bessere Skalierbarkeit

## Lizenz

Dieses Projekt steht unter der ISC-Lizenz. Es ist frei verfügbar für Bildungs- und persönliche Zwecke.

---

**Entwickelt mit ❤️ für tiefgehende Gedanken und moderne Webtechnologien.**
