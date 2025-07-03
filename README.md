# Sub specie aeternitatis Blog

Ein eleganter Blog über Philosophie, Wissenschaft und Künstliche Intelligenz mit professionellem WYSIWYG-Editor.

## Projektstruktur

```
Blog/
├── 📁 assets/                  # Statische Ressourcen
│   ├── 📁 css/                 # Stylesheets
│   │   └── style.css           # Haupt-CSS-Datei (erweitert)
│   └── 📁 js/                  # JavaScript-Dateien
│       └── utils.js            # Utility-Funktionen
├── 📁 pages/                   # HTML-Seiten
│   ├── about.html              # Über mich Seite
│   ├── archiv.html             # Archiv-Seite (Posts > 3 Monate)
│   ├── create.html             # Blogpost erstellen (TinyMCE Editor)
│   ├── list_posts.html         # Aktuelle Blogposts (letzte 3 Monate)
│   ├── most_read.html          # Meistgelesene Posts
│   ├── read_post.html          # Einzelnen Blogpost lesen
│   └── actual_post.html        # Post-Ansicht
├── 📁 posts/                   # Blogpost-Dateien (JSON)
│   ├── 2025-07-03-blogpost-3.json
│   ├── 2025-07-03-erster.json
│   └── ...
├── 📁 server/                  # Server-Code
│   └── app.js                  # Express.js Server mit View-Tracking
├── index.html                  # Startseite
├── package.json                # Node.js Abhängigkeiten
└── README.md                   # Diese Datei
```

## Installation

1. **Abhängigkeiten installieren:**
   ```bash
   npm install
   ```

2. **Server starten:**
   ```bash
   npm start
   ```

3. **Blog öffnen:**
   Öffne deinen Browser und gehe zu `http://localhost:3000`

## Features

### 🎨 Design
- **Elegante Typografie** mit Google Fonts (Playfair Display, Crimson Text)
- **Responsive Design** für alle Geräte
- **Moderne UI** mit Bootstrap und Custom CSS
- **Interaktive Navigationselemente** mit Hover-Effekten
- **Erweiterte Vorschau-Funktionalität**

### ✏️ Erweiterte Editor-Funktionen
- **TinyMCE WYSIWYG-Editor** mit deutschsprachiger Oberfläche
- **Umfangreiche Formatierungsoptionen:**
  - Textformatierung (Fett, Kursiv, Unterstrichen, etc.)
  - Überschriften (H1-H6)
  - Listen (Aufzählung, Nummerierung)
  - Tabellen mit erweiterten Optionen
  - Blockquotes und Code-Blöcke
  - Farben und Schriftgrößen
  - Emoticons und Sonderzeichen
- **Vorlagen-System:**
  - Blog-Post-Vorlage
  - Philosophie-Vorlage
  - Wissenschafts-Vorlage
- **Auto-Save-Funktionalität** (alle 20 Sekunden)
- **Entwürfe speichern und wiederherstellen**
- **Live-Vorschau** während des Schreibens
- **Tastenkürzel** (Strg+S zum Speichern, Strg+Enter zum Veröffentlichen)
- **Bild-Upload** mit Drag & Drop
- **Erweiterte Paste-Optionen**

### 📝 Content-Management
- **Blogposts erstellen** mit Titel, Inhalt und Tags
- **Tag-System** mit Vorschlägen
- **Intelligente Dateiname-Bereinigung** (entfernt ungültige Zeichen)
- **Alle Blogposts anzeigen** in einer übersichtlichen Liste
- **Archiv-Funktionalität** für Posts älter als 3 Monate
- **Meistgelesene Posts** mit View-Tracking
- **Einzelne Blogposts lesen** mit Datum und Tags

### 📊 Analytics & Verwaltung
- **View-Tracking** für alle Blogposts
- **Popularity-Ranking** der meistgelesenen Posts
- **Zeitbasierte Filterung** (Aktuelle vs. Archiv)
- **Automatische Sortierung** nach Datum oder Aufrufen

### 🔧 Technisch
- **Node.js** mit Express.js Server
- **ES Modules** für moderne JavaScript-Entwicklung
- **JSON-basierte** Blogpost-Speicherung
- **RESTful API** für Frontend-Backend-Kommunikation
- **In-Memory View-Tracking** (kann auf Datenbank erweitert werden)
- **Verbesserte Fehlerbehandlung**

## API-Endpunkte

- `GET /` - Startseite
- `GET /blogposts` - Alle Blogposts abrufen
- `GET /blogpost/:filename` - Einzelnen Blogpost abrufen (mit View-Tracking)
- `POST /blogpost` - Neuen Blogpost erstellen
- `GET /most-read` - Meistgelesene Blogposts abrufen

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

## Entwicklung

### Neue Seite hinzufügen:
1. HTML-Datei in `pages/` erstellen
2. CSS-Pfad: `../assets/css/style.css`
3. Navigation in `index.html` aktualisieren

### Styling ändern:
- Alle Styles in `assets/css/style.css`
- Responsive Design mit Media Queries
- Konsistente Farbpalette und Typografie
- Erweiterte Editor-Styles für TinyMCE

### Server erweitern:
- Server-Code in `server/app.js`
- Neue Routen für zusätzliche Funktionalität
- Blogposts werden in `posts/` als JSON gespeichert
- View-Tracking in `postViews` Object

### Editor anpassen:
- TinyMCE-Konfiguration in `pages/create.html`
- Plugins und Toolbar-Optionen anpassen
- Eigene Vorlagen hinzufügen
- Content-Styles erweitern

## Erweiterte Funktionen

### Auto-Save:
- Automatisches Speichern alle 20 Sekunden
- Entwürfe werden in LocalStorage gespeichert
- Wiederherstellung beim nächsten Besuch

### Dateiname-Bereinigung:
- Automatische Entfernung ungültiger Zeichen
- Sonderzeichen werden entfernt oder ersetzt
- Konsistente Dateinamen für alle Betriebssysteme

### View-Tracking:
- Automatisches Zählen von Seitenaufrufen
- Ranking nach Beliebtheit
- Basis für Analytics und Empfehlungen

## Philosophie

> "Sub specie aeternitatis" - unter dem Gesichtspunkt der Ewigkeit

Dieser Blog verbindet philosophische Reflexion mit wissenschaftlicher Neugier und technologischer Innovation. Er ist ein Ort des Nachdenkens über die großen Fragen unserer Zeit, ausgestattet mit modernen Werkzeugen für professionelles Content-Management.

## Lizenz

Dieses Projekt steht unter der ISC-Lizenz.
