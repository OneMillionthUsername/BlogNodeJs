import express, { json } from 'express';
import { mkdir, writeFile, readFile } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDirectoryPath = __dirname;
const app = express();

// Middleware für Content Security Policy und JSON-Body-Parsing
// app.use((req, res, next) => {
//   res.setHeader("Content-Security-Policy", "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self';");
//   next();
// });
app.use(json()); // JSON-Body parsen

app.use(express.static(publicDirectoryPath)); // Statische Dateien aus dem 'posts'-Ordner bereitstellen

app.get('/', (req, res) => {
  res.sendFile(join(publicDirectoryPath, 'index.html'));
});

// POST /blogpost - Blogbeitrag speichern
app.post('/blogpost', (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title und content sind erforderlich' });
  }

  const blogPost = {
    title,
    content,
    tags: tags || [],
    date: new Date().toISOString()
  };

  const fileName = `${blogPost.date.split('T')[0]}-${title.toLowerCase().replace(/\s+/g, '-')}.json`;
  const filePath = join(__dirname, 'posts', fileName);

  // Ordner anlegen, falls nicht vorhanden
  mkdir(dirname(filePath), { recursive: true }, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fehler beim Anlegen des Ordners' });
    }

    writeFile(filePath, JSON.stringify(blogPost, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Fehler beim Speichern des Blogposts' });
      }

      res.status(201).json({ message: 'Blogpost gespeichert', file: fileName });
    });
  });
});

app.get('/blogpost/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = join(__dirname, 'posts', fileName);

  readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(404).json({ error: 'Blogpost nicht gefunden' });
    }

    res.setHeader("Content-Type", "application/json");
    res.send(data);
  });
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});