import express, { json } from 'express';
import { mkdir, writeFile, readFile, readdir } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDirectoryPath = __dirname;
const app = express();

console.log(`Serververzeichnis: ${__dirname}`);
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

// GET /blogposts - Alle Blogposts auflisten
app.get('/blogposts', (req, res) => {
  const postsDir = join(__dirname, 'posts');
  
  readdir(postsDir, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fehler beim Lesen der Blogposts' });
    }

    // Nur JSON-Dateien filtern
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Alle Blogposts lesen und deren Titel extrahieren
    const blogPosts = [];
    let processedFiles = 0;

    if (jsonFiles.length === 0) {
      return res.json([]);
    }

    jsonFiles.forEach(file => {
      const filePath = join(postsDir, file);
      
      readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          console.error(`Fehler beim Lesen von ${file}:`, err);
        } else {
          try {
            const post = JSON.parse(data);
            blogPosts.push({
              filename: file,
              title: post.title,
              date: post.date,
              tags: post.tags || []
            });
          } catch (parseErr) {
            console.error(`Fehler beim Parsen von ${file}:`, parseErr);
          }
        }
        
        processedFiles++;
        if (processedFiles === jsonFiles.length) {
          // Sortiere nach Datum (neueste zuerst)
          blogPosts.sort((a, b) => new Date(b.date) - new Date(a.date));
          res.json(blogPosts);
        }
      });
    });
  });
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});