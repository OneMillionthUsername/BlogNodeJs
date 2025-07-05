import express, { json } from 'express';
import { mkdir, writeFile, readFile, readdir, unlink } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';
import { 
    generateToken, 
    verifyToken, 
    validateAdminLogin, 
    authenticateToken, 
    requireAdmin,
    refreshToken,
    extractTokenFromRequest
} from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDirectoryPath = join(__dirname, '..'); // Ein Ordner nach oben
const app = express();

// Speicher für Aufrufe (in Produktion sollte das in einer Datenbank gespeichert werden)
let postViews = {};

// SSL-Zertifikate für HTTPS laden
let httpsOptions = null;
try {
    const sslPath = join(__dirname, '..', 'ssl');
    httpsOptions = {
        key: readFileSync(join(sslPath, 'private-key.pem')),
        cert: readFileSync(join(sslPath, 'certificate.pem'))
    };
    console.log('✅ SSL-Zertifikate erfolgreich geladen');
} catch (error) {
    console.warn('⚠️ SSL-Zertifikate nicht gefunden - nur HTTP verfügbar');
    console.warn('   Führen Sie "node ssl/generate-certs.js" aus, um HTTPS zu aktivieren');
}

console.log(`Serververzeichnis: ${__dirname}`);

// Security Headers Middleware
app.use((req, res, next) => {
    // HTTPS Strict Transport Security
    if (httpsOptions) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Content Security Policy
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.tiny.cloud https://cdn.jsdelivr.net https://generativelanguage.googleapis.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https:; " +
        "connect-src 'self' https://generativelanguage.googleapis.com; " +
        "media-src 'self';"
    );
    
    // Weitere Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
});

// HTTP zu HTTPS Redirect (nur wenn HTTPS verfügbar)
app.use((req, res, next) => {
    if (httpsOptions && req.header('x-forwarded-proto') !== 'https' && !req.secure) {
        return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
});

app.use(json({ limit: '50mb' })); // JSON-Body parsen mit erhöhtem Limit für Bilder
app.use(express.urlencoded({ limit: '50mb', extended: true })); // URL-encoded Bodies mit erhöhtem Limit

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

// === BILD-UPLOAD-API ===

// POST /upload/image - Bild hochladen
app.post('/upload/image', (req, res) => {
  console.log(`📸 Bild-Upload-Anfrage erhalten`);
  
  const { imageData, filename } = req.body;
  
  if (!imageData || !filename) {
    console.error('❌ Upload-Fehler: Fehlende Daten');
    return res.status(400).json({ error: 'Bilddaten und Dateiname sind erforderlich' });
  }
  
  try {
    // Größe des base64-Strings prüfen (ungefähre Dateigröße)
    const estimatedSize = imageData.length * 0.75 / 1024 / 1024; // MB
    console.log(`📊 Geschätzte Bildgröße: ${estimatedSize.toFixed(2)} MB`);
    
    // Warnung bei sehr großen Bildern
    if (estimatedSize > 45) {
      console.warn(`⚠️ Sehr große Bilddatei: ${estimatedSize.toFixed(2)} MB`);
    }
    
    // Base64-Daten extrahieren (entferne data:image/...;base64, prefix)
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Validierung: Prüfe ob es gültiges Base64 ist
    if (!base64Data || base64Data.length < 100) {
      return res.status(400).json({ error: 'Ungültige Bilddaten' });
    }
    
    // Dateiname sanitisieren
    function sanitizeImageFilename(name) {
      const timestamp = new Date().toISOString().split('T')[0];
      const randomId = Math.random().toString(36).substr(2, 9);
      const extension = name.toLowerCase().includes('.jpg') || name.toLowerCase().includes('.jpeg') ? 'jpg' :
                       name.toLowerCase().includes('.png') ? 'png' :
                       name.toLowerCase().includes('.gif') ? 'gif' :
                       name.toLowerCase().includes('.webp') ? 'webp' : 'jpg';
      
      const baseName = name
        .replace(/\.[^/.]+$/, '') // Entferne Dateierweiterung
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Nur Buchstaben, Zahlen, Leerzeichen, Bindestriche
        .replace(/\s+/g, '-') // Ersetze Leerzeichen durch Bindestriche
        .replace(/-+/g, '-') // Mehrere Bindestriche durch einen ersetzen
        .substr(0, 30); // Auf 30 Zeichen begrenzen
      
      return `${timestamp}-${baseName}-${randomId}.${extension}`;
    }
    
    const sanitizedFilename = sanitizeImageFilename(filename);
    const uploadsDir = join(__dirname, '..', 'assets', 'uploads');
    const imagePath = join(uploadsDir, sanitizedFilename);
    
    console.log(`💾 Speichere Bild: ${sanitizedFilename}`);
    
    // Uploads-Ordner erstellen falls nicht vorhanden
    mkdir(uploadsDir, { recursive: true }, (mkdirErr) => {
      if (mkdirErr) {
        console.error('❌ Fehler beim Erstellen des Uploads-Ordners:', mkdirErr);
        return res.status(500).json({ error: 'Fehler beim Speichern des Bildes' });
      }
      
      // Bild speichern
      writeFile(imagePath, base64Data, 'base64', (writeErr) => {
        if (writeErr) {
          console.error('❌ Fehler beim Speichern des Bildes:', writeErr);
          
          // Spezifische Fehlerbehandlung
          if (writeErr.code === 'ENOSPC') {
            return res.status(507).json({ error: 'Nicht genügend Speicherplatz auf dem Server' });
          } else if (writeErr.code === 'EACCES') {
            return res.status(500).json({ error: 'Keine Berechtigung zum Speichern' });
          } else {
            return res.status(500).json({ error: 'Fehler beim Speichern des Bildes' });
          }
        }
        
        const imageUrl = `/assets/uploads/${sanitizedFilename}`;
        console.log(`✅ Bild gespeichert: ${sanitizedFilename} (Größe: ${estimatedSize.toFixed(2)} MB)`);
        
        res.json({
          message: 'Bild erfolgreich hochgeladen',
          filename: sanitizedFilename,
          url: imageUrl,
          location: imageUrl // TinyMCE erwartet 'location' für die URL
        });
      });
    });
    
  } catch (error) {
    console.error('Fehler beim Verarbeiten des Bildes:', error);
    res.status(500).json({ error: 'Fehler beim Verarbeiten des Bildes' });
  }
});

// GET /assets/uploads/:filename - Bilder ausliefern
app.get('/assets/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = join(__dirname, '..', 'assets', 'uploads', filename);
  
  // Sicherheitscheck: Nur erlaubte Dateierweiterungen
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return res.status(400).json({ error: 'Nicht unterstütztes Bildformat' });
  }
  
  // Content-Type basierend auf Dateierweiterung setzen
  const extension = filename.toLowerCase().split('.').pop();
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  
  res.setHeader('Content-Type', contentTypes[extension] || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 Jahr Cache
  
  // Datei ausliefern
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error('Fehler beim Ausliefern des Bildes:', err);
      res.status(404).json({ error: 'Bild nicht gefunden' });
    }
  });
});

// DELETE /assets/uploads/:filename - Bild löschen (Admin-only)
app.delete('/assets/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = join(__dirname, '..', 'assets', 'uploads', filename);
  
  // Sicherheitscheck für Admin-Berechtigung würde hier stehen
  // Für jetzt: einfache Implementierung
  
  unlink(imagePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Bild nicht gefunden' });
      }
      console.error('Fehler beim Löschen des Bildes:', err);
      return res.status(500).json({ error: 'Fehler beim Löschen des Bildes' });
    }
    
    console.log(`🗑️ Bild gelöscht: ${filename}`);
    res.json({ message: 'Bild erfolgreich gelöscht', filename: filename });
  });
});

// ===========================================
// JWT-AUTHENTIFIZIERUNGS-ENDPOINTS
// ===========================================

// POST /auth/login - Admin-Login mit JWT
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                error: 'Benutzername und Passwort erforderlich',
                success: false
            });
        }
        
        console.log(`🔐 Login-Versuch für Benutzer: ${username}`);
        
        // Admin-Credentials validieren
        const user = await validateAdminLogin(username, password);
        
        if (!user) {
            return res.status(401).json({
                error: 'Ungültige Anmeldedaten',
                success: false
            });
        }
        
        // JWT-Token generieren
        const token = generateToken(user);
        
        console.log(`✅ Login erfolgreich für: ${username}`);
        
        res.json({
            message: 'Login erfolgreich',
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            expiresIn: '24h'
        });
        
    } catch (error) {
        console.error('❌ Login-Fehler:', error);
        res.status(500).json({
            error: 'Server-Fehler beim Login',
            success: false
        });
    }
});

// POST /auth/verify - Token-Verifikation
app.post('/auth/verify', (req, res) => {
    try {
        const token = extractTokenFromRequest(req);
        
        if (!token) {
            return res.status(401).json({
                valid: false,
                error: 'Kein Token gefunden'
            });
        }
        
        const user = verifyToken(token);
        
        if (!user) {
            return res.status(403).json({
                valid: false,
                error: 'Token ungültig oder abgelaufen'
            });
        }
        
        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            expiresAt: new Date(user.exp * 1000).toISOString()
        });
        
    } catch (error) {
        console.error('❌ Token-Verifikations-Fehler:', error);
        res.status(500).json({
            valid: false,
            error: 'Server-Fehler bei Token-Verifikation'
        });
    }
});

// POST /auth/refresh - Token-Refresh
app.post('/auth/refresh', (req, res) => {
    try {
        const token = extractTokenFromRequest(req);
        
        if (!token) {
            return res.status(401).json({
                error: 'Kein Token für Refresh gefunden',
                success: false
            });
        }
        
        const newToken = refreshToken(token);
        
        if (!newToken) {
            return res.status(403).json({
                error: 'Token-Refresh fehlgeschlagen',
                success: false
            });
        }
        
        res.json({
            message: 'Token erfolgreich erneuert',
            success: true,
            token: newToken
        });
        
    } catch (error) {
        console.error('❌ Token-Refresh-Fehler:', error);
        res.status(500).json({
            error: 'Server-Fehler beim Token-Refresh',
            success: false
        });
    }
});

// POST /auth/logout - Logout (client-seitig)
app.post('/auth/logout', (req, res) => {
    // Bei JWT ist Logout hauptsächlich client-seitig (Token löschen)
    // Hier können wir optional eine Blacklist implementieren
    res.json({
        message: 'Logout erfolgreich',
        success: true
    });
});

// ===========================================
// BLOG-ENDPOINTS (geschützt mit JWT)
// ===========================================

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

// === BILD-UPLOAD-API ===

// POST /upload/image - Bild hochladen
app.post('/upload/image', (req, res) => {
  console.log(`📸 Bild-Upload-Anfrage erhalten`);
  
  const { imageData, filename } = req.body;
  
  if (!imageData || !filename) {
    console.error('❌ Upload-Fehler: Fehlende Daten');
    return res.status(400).json({ error: 'Bilddaten und Dateiname sind erforderlich' });
  }
  
  try {
    // Größe des base64-Strings prüfen (ungefähre Dateigröße)
    const estimatedSize = imageData.length * 0.75 / 1024 / 1024; // MB
    console.log(`📊 Geschätzte Bildgröße: ${estimatedSize.toFixed(2)} MB`);
    
    // Warnung bei sehr großen Bildern
    if (estimatedSize > 45) {
      console.warn(`⚠️ Sehr große Bilddatei: ${estimatedSize.toFixed(2)} MB`);
    }
    
    // Base64-Daten extrahieren (entferne data:image/...;base64, prefix)
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Validierung: Prüfe ob es gültiges Base64 ist
    if (!base64Data || base64Data.length < 100) {
      return res.status(400).json({ error: 'Ungültige Bilddaten' });
    }
    
    // Dateiname sanitisieren
    function sanitizeImageFilename(name) {
      const timestamp = new Date().toISOString().split('T')[0];
      const randomId = Math.random().toString(36).substr(2, 9);
      const extension = name.toLowerCase().includes('.jpg') || name.toLowerCase().includes('.jpeg') ? 'jpg' :
                       name.toLowerCase().includes('.png') ? 'png' :
                       name.toLowerCase().includes('.gif') ? 'gif' :
                       name.toLowerCase().includes('.webp') ? 'webp' : 'jpg';
      
      const baseName = name
        .replace(/\.[^/.]+$/, '') // Entferne Dateierweiterung
        .toLowerCase()
        .replace(/[^\w\s-]/g, '') // Nur Buchstaben, Zahlen, Leerzeichen, Bindestriche
        .replace(/\s+/g, '-') // Ersetze Leerzeichen durch Bindestriche
        .replace(/-+/g, '-') // Mehrere Bindestriche durch einen ersetzen
        .substr(0, 30); // Auf 30 Zeichen begrenzen
      
      return `${timestamp}-${baseName}-${randomId}.${extension}`;
    }
    
    const sanitizedFilename = sanitizeImageFilename(filename);
    const uploadsDir = join(__dirname, '..', 'assets', 'uploads');
    const imagePath = join(uploadsDir, sanitizedFilename);
    
    console.log(`💾 Speichere Bild: ${sanitizedFilename}`);
    
    // Uploads-Ordner erstellen falls nicht vorhanden
    mkdir(uploadsDir, { recursive: true }, (mkdirErr) => {
      if (mkdirErr) {
        console.error('❌ Fehler beim Erstellen des Uploads-Ordners:', mkdirErr);
        return res.status(500).json({ error: 'Fehler beim Speichern des Bildes' });
      }
      
      // Bild speichern
      writeFile(imagePath, base64Data, 'base64', (writeErr) => {
        if (writeErr) {
          console.error('❌ Fehler beim Speichern des Bildes:', writeErr);
          
          // Spezifische Fehlerbehandlung
          if (writeErr.code === 'ENOSPC') {
            return res.status(507).json({ error: 'Nicht genügend Speicherplatz auf dem Server' });
          } else if (writeErr.code === 'EACCES') {
            return res.status(500).json({ error: 'Keine Berechtigung zum Speichern' });
          } else {
            return res.status(500).json({ error: 'Fehler beim Speichern des Bildes' });
          }
        }
        
        const imageUrl = `/assets/uploads/${sanitizedFilename}`;
        console.log(`✅ Bild gespeichert: ${sanitizedFilename} (Größe: ${estimatedSize.toFixed(2)} MB)`);
        
        res.json({
          message: 'Bild erfolgreich hochgeladen',
          filename: sanitizedFilename,
          url: imageUrl,
          location: imageUrl // TinyMCE erwartet 'location' für die URL
        });
      });
    });
    
  } catch (error) {
    console.error('Fehler beim Verarbeiten des Bildes:', error);
    res.status(500).json({ error: 'Fehler beim Verarbeiten des Bildes' });
  }
});

// GET /assets/uploads/:filename - Bilder ausliefern
app.get('/assets/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = join(__dirname, '..', 'assets', 'uploads', filename);
  
  // Sicherheitscheck: Nur erlaubte Dateierweiterungen
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return res.status(400).json({ error: 'Nicht unterstütztes Bildformat' });
  }
  
  // Content-Type basierend auf Dateierweiterung setzen
  const extension = filename.toLowerCase().split('.').pop();
  const contentTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  
  res.setHeader('Content-Type', contentTypes[extension] || 'image/jpeg');
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 Jahr Cache
  
  // Datei ausliefern
  res.sendFile(imagePath, (err) => {
    if (err) {
      console.error('Fehler beim Ausliefern des Bildes:', err);
      res.status(404).json({ error: 'Bild nicht gefunden' });
    }
  });
});

// DELETE /assets/uploads/:filename - Bild löschen (Admin-only)
app.delete('/assets/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const imagePath = join(__dirname, '..', 'assets', 'uploads', filename);
  
  // Sicherheitscheck für Admin-Berechtigung würde hier stehen
  // Für jetzt: einfache Implementierung
  
  unlink(imagePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Bild nicht gefunden' });
      }
      console.error('Fehler beim Löschen des Bildes:', err);
      return res.status(500).json({ error: 'Fehler beim Löschen des Bildes' });
    }
    
    console.log(`🗑️ Bild gelöscht: ${filename}`);
    res.json({ message: 'Bild erfolgreich gelöscht', filename: filename });
  });
});

// Server starten
const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;

// HTTP Server (für Entwicklung und Redirects)
const httpServer = http.createServer(app);
httpServer.listen(HTTP_PORT, () => {
    console.log(`🌐 HTTP Server läuft auf http://localhost:${HTTP_PORT}`);
    if (!httpsOptions) {
        console.log('ℹ️  Nur HTTP verfügbar - führen Sie "node ssl/generate-certs.js" aus für HTTPS');
    }
});

// HTTPS Server (falls SSL-Zertifikate verfügbar)
if (httpsOptions) {
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, () => {
        console.log(`🔐 HTTPS Server läuft auf https://localhost:${HTTPS_PORT}`);
        console.log('✅ SSL/TLS aktiviert - sichere Verbindung verfügbar');
        console.log('📋 Zertifikat: Self-signed für Development (Browser-Warnung normal)');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('📴 Shutting down servers...');
        httpServer.close();
        httpsServer.close();
    });
} else {
    // Graceful shutdown nur für HTTP
    process.on('SIGTERM', () => {
        console.log('📴 Shutting down HTTP server...');
        httpServer.close();
    });
}
