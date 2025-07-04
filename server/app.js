import express, { json } from 'express';
import { mkdir, writeFile, readFile, readdir, unlink } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDirectoryPath = join(__dirname, '..'); // Ein Ordner nach oben
const app = express();

// Speicher für Aufrufe (in Produktion sollte das in einer Datenbank gespeichert werden)
let postViews = {};

console.log(`Serververzeichnis: ${__dirname}`);
// Middleware fÃ¼r Content Security Policy und JSON-Body-Parsing
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

  // Funktion zur Bereinigung von Dateinamen
  function sanitizeFileName(fileName) {
    return fileName
      .toLowerCase()
      .replace(/[^\w\s-äöüß]/g, '') // Entferne alle ungültigen Zeichen, behalte nur Buchstaben, Zahlen, Leerzeichen, Bindestriche und Umlaute
      .replace(/\s+/g, '-') // Ersetze Leerzeichen durch Bindestriche
      .replace(/-+/g, '-') // Ersetze mehrere aufeinanderfolgende Bindestriche durch einen
      .replace(/^-+|-+$/g, ''); // Entferne Bindestriche am Anfang und Ende
  }

  const sanitizedTitle = sanitizeFileName(title);
  const fileName = `${blogPost.date.split('T')[0]}-${sanitizedTitle}.json`;
  const filePath = join(__dirname, '..', 'posts', fileName);

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
  const filePath = join(__dirname, '..', 'posts', fileName);

  // Aufruf zählen
  if (!postViews[fileName]) {
    postViews[fileName] = 0;
  }
  postViews[fileName]++;

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
  const postsDir = join(__dirname, '..', 'posts');
  
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

// GET /most-read - Meistgelesene Blogposts
app.get('/most-read', (req, res) => {
  const postsDir = join(__dirname, '..', 'posts');
  
  readdir(postsDir, (err, files) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Fehler beim Lesen der Blogposts' });
    }

    const jsonFiles = files.filter(file => file.endsWith('.json'));
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
              tags: post.tags || [],
              views: postViews[file] || 0
            });
          } catch (parseErr) {
            console.error(`Fehler beim Parsen von ${file}:`, parseErr);
          }
        }
        
        processedFiles++;
        if (processedFiles === jsonFiles.length) {
          // Sortiere nach Aufrufen (meistgelesene zuerst)
          blogPosts.sort((a, b) => b.views - a.views);
          res.json(blogPosts);
        }
      });
    });
  });
});

// DELETE /blogpost/:filename - Blogpost löschen
app.delete('/blogpost/:filename', (req, res) => {
  const fileName = req.params.filename;
  const filePath = join(__dirname, '..', 'posts', fileName);

  // Prüfen ob Datei existiert
  readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Fehler beim Lesen der Datei:', err);
      return res.status(404).json({ error: 'Blogpost nicht gefunden' });
    }

    // Datei löschen
    unlink(filePath, (unlinkErr) => {
      if (unlinkErr) {
        console.error('Fehler beim Löschen der Datei:', unlinkErr);
        return res.status(500).json({ error: 'Fehler beim Löschen des Blogposts' });
      }

      // View-Count auch entfernen
      delete postViews[fileName];

      // Auch zugehörige Kommentare löschen
      const commentsFileName = fileName.replace('.json', '_comments.json');
      const commentsFilePath = join(__dirname, '..', 'comments', commentsFileName);
      unlink(commentsFilePath, (commentsErr) => {
        // Ignoriere Fehler falls Kommentardatei nicht existiert
        if (commentsErr && commentsErr.code !== 'ENOENT') {
          console.warn('Warnung: Kommentardatei konnte nicht gelöscht werden:', commentsErr.message);
        }
      });

      console.log(`Blogpost gelöscht: ${fileName}`);
      res.json({ message: 'Blogpost erfolgreich gelöscht', file: fileName });
    });
  });
});

// === KOMMENTAR-API ===

// GET /comments/:postFilename - Kommentare für einen Post abrufen
app.get('/comments/:postFilename', (req, res) => {
  const postFilename = req.params.postFilename;
  const commentsFileName = postFilename.replace('.json', '_comments.json');
  const commentsFilePath = join(__dirname, '..', 'comments', commentsFileName);

  readFile(commentsFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // Datei existiert nicht - keine Kommentare vorhanden
        return res.json([]);
      }
      console.error('Fehler beim Lesen der Kommentardatei:', err);
      return res.status(500).json({ error: 'Fehler beim Laden der Kommentare' });
    }

    try {
      const comments = JSON.parse(data);
      res.json(comments);
    } catch (parseErr) {
      console.error('Fehler beim Parsen der Kommentardatei:', parseErr);
      res.status(500).json({ error: 'Fehler beim Verarbeiten der Kommentare' });
    }
  });
});

// POST /comments/:postFilename - Neuen Kommentar hinzufügen
app.post('/comments/:postFilename', (req, res) => {
  const postFilename = req.params.postFilename;
  const { username, text } = req.body;

  // Input-Validierung
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Kommentartext ist erforderlich' });
  }

  if (text.trim().length > 1000) {
    return res.status(400).json({ error: 'Kommentar ist zu lang (maximal 1000 Zeichen)' });
  }

  // Sanitize Input (XSS-Schutz)
  function sanitizeText(inputText) {
    return inputText
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }

  const sanitizedText = sanitizeText(text);
  const sanitizedUsername = username && username.trim() !== '' ? 
    sanitizeText(username.trim()) : 'Anonym';

  const newComment = {
    id: Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9),
    username: sanitizedUsername,
    text: sanitizedText,
    timestamp: new Date().toISOString(),
    postFilename: postFilename
  };

  const commentsFileName = postFilename.replace('.json', '_comments.json');
  const commentsFilePath = join(__dirname, '..', 'comments', commentsFileName);
  const commentsDir = join(__dirname, '..', 'comments');

  // Comments-Ordner erstellen falls nicht vorhanden
  mkdir(commentsDir, { recursive: true }, (mkdirErr) => {
    if (mkdirErr) {
      console.error('Fehler beim Erstellen des Comments-Ordners:', mkdirErr);
      return res.status(500).json({ error: 'Fehler beim Speichern des Kommentars' });
    }

    // Bestehende Kommentare laden oder leeres Array erstellen
    readFile(commentsFilePath, 'utf8', (readErr, data) => {
      let comments = [];
      
      if (!readErr) {
        try {
          comments = JSON.parse(data);
        } catch (parseErr) {
          console.error('Fehler beim Parsen bestehender Kommentare:', parseErr);
          comments = [];
        }
      }

      // Neuen Kommentar hinzufügen
      comments.push(newComment);

      // Kommentare speichern
      writeFile(commentsFilePath, JSON.stringify(comments, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Fehler beim Speichern der Kommentare:', writeErr);
          return res.status(500).json({ error: 'Fehler beim Speichern des Kommentars' });
        }

        console.log(`Neuer Kommentar gespeichert für Post: ${postFilename}`);
        res.status(201).json({ 
          message: 'Kommentar erfolgreich gespeichert',
          comment: newComment
        });
      });
    });
  });
});

// DELETE /comments/:postFilename/:commentId - Kommentar löschen (Admin-only)
app.delete('/comments/:postFilename/:commentId', (req, res) => {
  const postFilename = req.params.postFilename;
  const commentId = req.params.commentId;
  
  const commentsFileName = postFilename.replace('.json', '_comments.json');
  const commentsFilePath = join(__dirname, '..', 'comments', commentsFileName);

  readFile(commentsFilePath, 'utf8', (readErr, data) => {
    if (readErr) {
      if (readErr.code === 'ENOENT') {
        return res.status(404).json({ error: 'Keine Kommentare gefunden' });
      }
      console.error('Fehler beim Lesen der Kommentardatei:', readErr);
      return res.status(500).json({ error: 'Fehler beim Laden der Kommentare' });
    }

    try {
      const comments = JSON.parse(data);
      const commentIndex = comments.findIndex(comment => comment.id === commentId);
      
      if (commentIndex === -1) {
        return res.status(404).json({ error: 'Kommentar nicht gefunden' });
      }

      // Kommentar entfernen
      const deletedComment = comments.splice(commentIndex, 1)[0];

      // Aktualisierte Kommentare speichern
      writeFile(commentsFilePath, JSON.stringify(comments, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Fehler beim Speichern der aktualisierten Kommentare:', writeErr);
          return res.status(500).json({ error: 'Fehler beim Löschen des Kommentars' });
        }

        console.log(`Kommentar gelöscht: ${commentId} aus Post: ${postFilename}`);
        res.json({ 
          message: 'Kommentar erfolgreich gelöscht',
          deletedComment: deletedComment
        });
      });
    } catch (parseErr) {
      console.error('Fehler beim Parsen der Kommentardatei:', parseErr);
      res.status(500).json({ error: 'Fehler beim Verarbeiten der Kommentare' });
    }
  });
});

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server lÃ¤uft auf http://localhost:${PORT}`);
});
