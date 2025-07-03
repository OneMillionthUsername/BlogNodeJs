# Sub specie aeternitatis Blog

Ein eleganter Blog über Philosophie, Wissenschaft und Künstliche Intelligenz.

## Projektstruktur

```
Blog/
├── 📁 assets/                  # Statische Ressourcen
│   ├── 📁 css/                 # Stylesheets
│   │   └── style.css           # Haupt-CSS-Datei
│   └── 📁 js/                  # JavaScript-Dateien
│       └── utils.js            # Utility-Funktionen
├── 📁 pages/                   # HTML-Seiten
│   ├── about.html              # Über mich Seite
│   ├── archiv.html             # Archiv-Seite
│   ├── create.html             # Blogpost erstellen
│   ├── list_posts.html         # Alle Blogposts anzeigen
│   ├── read_post.html          # Einzelnen Blogpost lesen
│   └── ...                     # Weitere Seiten
├── 📁 posts/                   # Blogpost-Dateien (JSON)
│   ├── 2025-07-03-blogpost-3.json
│   ├── 2025-07-03-erster.json
│   └── ...
├── 📁 server/                  # Server-Code
│   └── app.js                  # Express.js Server
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
- **Interaktive Navigationselemente**

### 📝 Funktionen
- **Blogposts erstellen** mit Titel, Inhalt und Tags
- **Alle Blogposts anzeigen** in einer übersichtlichen Liste
- **Einzelne Blogposts lesen** mit Datum und Tags
- **Über mich Seite** mit persönlichen Informationen
- **Archiv-Funktionalität** (in Entwicklung)

### 🔧 Technisch
- **Node.js** mit Express.js Server
- **ES Modules** für moderne JavaScript-Entwicklung
- **JSON-basierte** Blogpost-Speicherung
- **RESTful API** für Frontend-Backend-Kommunikation

## API-Endpunkte

- `GET /` - Startseite
- `GET /blogposts` - Alle Blogposts abrufen
- `GET /blogpost/:filename` - Einzelnen Blogpost abrufen
- `POST /blogpost` - Neuen Blogpost erstellen

## Entwicklung

### Neue Seite hinzufügen:
1. HTML-Datei in `pages/` erstellen
2. CSS-Pfad: `../assets/css/style.css`
3. Navigation in `index.html` aktualisieren

### Styling ändern:
- Alle Styles in `assets/css/style.css`
- Responsive Design mit Media Queries
- Konsistente Farbpalette und Typografie

### Server erweitern:
- Server-Code in `server/app.js`
- Neue Routen für zusätzliche Funktionalität
- Blogposts werden in `posts/` als JSON gespeichert

## Philosophie

> "Sub specie aeternitatis" - unter dem Gesichtspunkt der Ewigkeit

Dieser Blog verbindet philosophische Reflexion mit wissenschaftlicher Neugier und technologischer Innovation. Er ist ein Ort des Nachdenkens über die großen Fragen unserer Zeit.

## Lizenz

Dieses Projekt steht unter der ISC-Lizenz.
