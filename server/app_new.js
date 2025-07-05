import express, { json } from 'express';
import { mkdir, writeFile, readFile, readdir, unlink } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';
import cookieParser from 'cookie-parser';
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

// Middleware
app.use(json({ limit: '50mb' })); // JSON-Body parsen mit erhöhtem Limit für Bilder
app.use(express.urlencoded({ limit: '50mb', extended: true })); // URL-encoded Bodies mit erhöhtem Limit
app.use(cookieParser()); // Cookie-Parser für JWT-Tokens

// Statische Dateien
app.use(express.static(publicDirectoryPath));

// ===========================================
// ÖFFENTLICHE ENDPOINTS
// ===========================================

app.get('/', (req, res) => {
  res.sendFile(join(publicDirectoryPath, 'index.html'));
});

// GET /blogpost/:filename - Einzelnen Blogpost abrufen
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
              tags: post.tags || [],
              author: post.author || 'Unbekannt'
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
              views: postViews[file] || 0,
              author: post.author || 'Unbekannt'
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

// ===========================================
// AUTHENTIFIZIERUNGS-ENDPOINTS
// ===========================================

// POST /auth/login - Admin-Anmeldung
app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Input-Validierung
        if (!username || !password) {
            return res.status(400).json({ 
                error: 'Benutzername und Passwort erforderlich',
                success: false 
            });
        }
        
        // Admin-Anmeldedaten validieren
        const user = await validateAdminLogin(username, password);
        
        if (!user) {
            // Sicherheitsdelay bei fehlgeschlagener Anmeldung
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            return res.status(401).json({ 
                error: 'Ungültige Anmeldedaten',
                success: false 
            });
        }
        
        // JWT-Token generieren
        const token = generateToken(user);
        
        // Token als httpOnly Cookie setzen (sicherer als localStorage)
        res.cookie('authToken', token, {
            httpOnly: true,
            secure: httpsOptions ? true : false, // Nur HTTPS in Produktion
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
        });
        
        console.log(`✅ Admin-Login erfolgreich: ${user.username}`);
        
        res.json({
            success: true,
            message: 'Anmeldung erfolgreich',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            },
            token: token // Auch im Response für Frontend
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Login:', error);
        res.status(500).json({ 
            error: 'Interner Serverfehler',
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
            }
        });
        
    } catch (error) {
        console.error('❌ Fehler bei Token-Verifikation:', error);
        res.status(500).json({ 
            valid: false,
            error: 'Interner Serverfehler' 
        });
    }
});

// POST /auth/refresh - Token erneuern
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
        
        // Neuen Token als Cookie setzen
        res.cookie('authToken', newToken, {
            httpOnly: true,
            secure: httpsOptions ? true : false,
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000
        });
        
        res.json({
            success: true,
            message: 'Token erfolgreich erneuert',
            token: newToken
        });
        
    } catch (error) {
        console.error('❌ Fehler beim Token-Refresh:', error);
        res.status(500).json({ 
            error: 'Interner Serverfehler',
            success: false 
        });
    }
});

// POST /auth/logout - Abmeldung
app.post('/auth/logout', (req, res) => {
    // Cookie löschen
    res.clearCookie('authToken');
    
    // Hier können wir optional eine Blacklist implementieren
    res.json({
        message: 'Logout erfolgreich',
        success: true
    });
});

// ===========================================
// ADMIN-GESCHÜTZTE ENDPOINTS (JWT erforderlich)
// ===========================================

// POST /blogpost - Blogbeitrag speichern (JWT-geschützt)
app.post('/blogpost', authenticateToken, requireAdmin, (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title und content sind erforderlich' });
  }

  const blogPost = {
    title,
    content,
    tags: tags || [],
    date: new Date().toISOString(),
    author: req.user.username // Author aus JWT-Token hinzufügen
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

      console.log(`✅ Blogpost erstellt von ${req.user.username}: ${fileName}`);
      res.status(201).json({ message: 'Blogpost gespeichert', file: fileName });
    });
  });
});

// DELETE /blogpost/:filename - Blogpost löschen (JWT-geschützt)
app.delete('/blogpost/:filename', authenticateToken, requireAdmin, (req, res) => {
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

      console.log(`🗑️ Blogpost gelöscht von ${req.user.username}: ${fileName}`);
      res.json({ message: 'Blogpost erfolgreich gelöscht', file: fileName });
    });
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

  // XSS-Schutz: HTML-Tags entfernen/escapen
  function sanitizeText(input) {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  const newComment = {
    id: Date.now().toString(),
    username: sanitizeText(username || 'Anonym'),
    text: sanitizeText(text.trim()),
    date: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress // Für Moderation
  };

  // Kommentardatei-Pfad bestimmen
  const commentsFileName = postFilename.replace('.json', '_comments.json');
  const commentsFilePath = join(__dirname, '..', 'comments', commentsFileName);

  // Bestehende Kommentare laden oder leeres Array erstellen
  readFile(commentsFilePath, 'utf8', (err, data) => {
    let comments = [];
    
    if (!err) {
      try {
        comments = JSON.parse(data);
      } catch (parseErr) {
        console.error('Fehler beim Parsen der Kommentardatei:', parseErr);
        comments = [];
      }
    }

    // Neuen Kommentar hinzufügen
    comments.push(newComment);

    // Kommentare-Verzeichnis erstellen falls nötig
    mkdir(dirname(commentsFilePath), { recursive: true }, (mkdirErr) => {
      if (mkdirErr) {
        console.error('Fehler beim Erstellen des Kommentare-Ordners:', mkdirErr);
        return res.status(500).json({ error: 'Fehler beim Speichern des Kommentars' });
      }

      // Kommentare speichern
      writeFile(commentsFilePath, JSON.stringify(comments, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Fehler beim Speichern der Kommentare:', writeErr);
          return res.status(500).json({ error: 'Fehler beim Speichern des Kommentars' });
        }

        console.log(`💬 Neuer Kommentar für ${postFilename} von ${newComment.username}`);
        res.status(201).json({ 
          message: 'Kommentar erfolgreich hinzugefügt',
          comment: newComment
        });
      });
    });
  });
});

// DELETE /comments/:postFilename/:commentId - Kommentar löschen (JWT-geschützt)
app.delete('/comments/:postFilename/:commentId', authenticateToken, requireAdmin, (req, res) => {
  const postFilename = req.params.postFilename;
  const commentId = req.params.commentId;
  
  const commentsFileName = postFilename.replace('.json', '_comments.json');
  const commentsFilePath = join(__dirname, '..', 'comments', commentsFileName);

  // Kommentare laden
  readFile(commentsFilePath, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Keine Kommentare gefunden' });
      }
      console.error('Fehler beim Lesen der Kommentardatei:', err);
      return res.status(500).json({ error: 'Fehler beim Laden der Kommentare' });
    }

    try {
      let comments = JSON.parse(data);
      const originalLength = comments.length;
      
      // Kommentar mit der angegebenen ID entfernen
      comments = comments.filter(comment => comment.id !== commentId);
      
      if (comments.length === originalLength) {
        return res.status(404).json({ error: 'Kommentar nicht gefunden' });
      }

      // Aktualisierte Kommentare speichern
      writeFile(commentsFilePath, JSON.stringify(comments, null, 2), (writeErr) => {
        if (writeErr) {
          console.error('Fehler beim Speichern der Kommentare:', writeErr);
          return res.status(500).json({ error: 'Fehler beim Löschen des Kommentars' });
        }

        console.log(`🗑️ Kommentar gelöscht von ${req.user.username}: ${commentId} in ${postFilename}`);
        res.json({ 
          message: 'Kommentar erfolgreich gelöscht',
          commentId: commentId
        });
      });
      
    } catch (parseErr) {
      console.error('Fehler beim Parsen der Kommentardatei:', parseErr);
      res.status(500).json({ error: 'Fehler beim Verarbeiten der Kommentare' });
    }
  });
});

// POST /upload/image - Bild-Upload (JWT-geschützt)
app.post('/upload/image', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { image, filename } = req.body;
    
    if (!image || !filename) {
      return res.status(400).json({ error: 'Bild und Dateiname sind erforderlich' });
    }

    // Base64-Header entfernen falls vorhanden
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Sicherheitsvalidierung: Prüfe ob es valide Base64-Daten sind
    try {
      Buffer.from(base64Data, 'base64');
    } catch (bufferError) {
      return res.status(400).json({ error: 'Ungültiges Bildformat' });
    }
    
    // Dateiname bereinigen
    function sanitizeFilename(name) {
      return name
        .replace(/[^\w\.-]/g, '_') // Ersetze ungültige Zeichen durch Unterstriche
        .replace(/_{2,}/g, '_') // Mehrfache Unterstriche reduzieren
        .toLowerCase();
    }
    
    const sanitizedFilename = sanitizeFilename(filename);
    const timestamp = Date.now();
    const uniqueFilename = `${timestamp}-${sanitizedFilename}`;
    
    // Upload-Ordner erstellen falls nötig
    const uploadDir = join(__dirname, '..', 'assets', 'uploads');
    mkdir(uploadDir, { recursive: true }, (mkdirErr) => {
      if (mkdirErr) {
        console.error('Fehler beim Erstellen des Upload-Ordners:', mkdirErr);
        return res.status(500).json({ error: 'Fehler beim Erstellen des Upload-Ordners' });
      }
      
      // Bild-Datei schreiben
      const imagePath = join(uploadDir, uniqueFilename);
      writeFile(imagePath, base64Data, 'base64', (writeErr) => {
        if (writeErr) {
          console.error('Fehler beim Speichern des Bildes:', writeErr);
          return res.status(500).json({ error: 'Fehler beim Speichern des Bildes' });
        }
        
        const imageUrl = `/assets/uploads/${uniqueFilename}`;
        console.log(`📸 Bild hochgeladen von ${req.user.username}: ${uniqueFilename}`);
        
        res.json({
          message: 'Bild erfolgreich hochgeladen',
          filename: uniqueFilename,
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

// DELETE /assets/uploads/:filename - Bild löschen (JWT-geschützt)
app.delete('/assets/uploads/:filename', authenticateToken, requireAdmin, (req, res) => {
  const filename = req.params.filename;
  const imagePath = join(__dirname, '..', 'assets', 'uploads', filename);
  
  unlink(imagePath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.status(404).json({ error: 'Bild nicht gefunden' });
      }
      console.error('Fehler beim Löschen des Bildes:', err);
      return res.status(500).json({ error: 'Fehler beim Löschen des Bildes' });
    }
    
    console.log(`🗑️ Bild gelöscht von ${req.user.username}: ${filename}`);
    res.json({ message: 'Bild erfolgreich gelöscht', filename: filename });
  });
});

// ===========================================
// SERVER STARTEN
// ===========================================

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
        console.log('🔑 JWT-Authentifizierung aktiviert');
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
