import express, { json } from 'express';
import { mkdir, writeFile, readFile, readdir, unlink } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// Environment-Variablen laden
dotenv.config();

// Environment-Variablen-Validierung
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PLESK_ENV:', process.env.PLESK_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '[SET]' : '[NOT SET]');
console.log('ENABLE_DB_MIGRATION:', process.env.ENABLE_DB_MIGRATION);

// Validierung der kritischen Variablen
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    console.error('Create .env file with these variables before starting the server');
    process.exit(1);
}

// Datenbank-Integration
import { 
    testConnection, 
    initializeDatabase, 
    migrateExistingData, 
    DatabaseService 
} from './database.js';

import { 
    generateToken, 
    verifyToken, 
    validateAdminLogin, 
    authenticateToken, 
    requireAdmin,
    extractTokenFromRequest
} from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDirectoryPath = join(__dirname, '..'); // Ein Ordner nach oben
const app = express();

// Plesk-Environment-Erkennung
const IS_PLESK = process.env.PLESK_ENV === 'true' || process.env.NODE_ENV === 'production';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

console.log(`Server mode: ${IS_PRODUCTION ? 'Production' : 'Development'}`);
console.log(`Plesk integration: ${IS_PLESK ? 'Enabled' : 'Disabled'}`);

// Datenbank initialisieren
async function initializeApp() {
    console.log('Initializing database...');
    
    // Datenbankverbindung testen
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('Database connection failed! Server will exit.');
        process.exit(1);
    }
    
    // Schema erstellen
    const schemaCreated = await initializeDatabase();
    if (!schemaCreated) {
        console.error('Database schema could not be created! Server will exit.');
        process.exit(1);
    }
    
    // Migration ausführen falls aktiviert
    if (process.env.ENABLE_DB_MIGRATION === 'true') {
        console.log('Running data migration...');
        await migrateExistingData();
    }
    
    console.log('Database successfully initialized');
}

// App initialisieren (asynchron)
await initializeApp();

// Speicher für Aufrufe (DEPRECATED - wird durch Datenbank ersetzt)
let postViews = {};

// SSL-Zertifikate nur in Development laden (Plesk übernimmt SSL in Production)
let httpsOptions = null;
if (!IS_PLESK && !IS_PRODUCTION) {
    try {
        const sslPath = join(__dirname, '..', 'ssl');
        httpsOptions = {
            key: readFileSync(join(sslPath, 'private-key.pem')),
            cert: readFileSync(join(sslPath, 'certificate.pem'))
        };
        console.log('SSL certificates loaded successfully (Development)');
    } catch (error) {
        console.warn('SSL certificates not found - HTTP only available');
        console.warn('   Run "node ssl/generate-certs.js" to enable HTTPS');
    }
} else {
    console.log('Production mode: SSL handled by Plesk/webserver');
}

console.log(`Serververzeichnis: ${__dirname}`);

// Security Headers Middleware
app.use((req, res, next) => {
    // HTTPS Strict Transport Security (nur in Production mit SSL)
    if (IS_PRODUCTION || httpsOptions) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // Erweiterte Content Security Policy für Production
    const domain = process.env.DOMAIN || req.header('host') || 'localhost';
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.tiny.cloud https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://generativelanguage.googleapis.com; " +
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://cdn.tiny.cloud; " +
        "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com; " +
        "img-src 'self' data: https: blob:; " +
        "connect-src 'self' https://generativelanguage.googleapis.com https://cdn.tiny.cloud; " +
        "frame-src 'none'; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "form-action 'self';" +
        (IS_PRODUCTION ? "" : " upgrade-insecure-requests;")
    );
    
    // Weitere Security Headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    next();
});

// HTTP zu HTTPS Redirect (Plesk-kompatibel)
app.use((req, res, next) => {
    // Plesk verwendet x-forwarded-proto Header
    if (IS_PLESK && req.header('x-forwarded-proto') === 'http') {
        return res.redirect(301, `https://${req.header('host')}${req.url}`);
    } 
    // Development HTTPS Redirect
    else if (!IS_PLESK && httpsOptions && req.header('x-forwarded-proto') !== 'https' && !req.secure) {
        return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
});

// Middleware
app.use(json({ limit: '50mb' })); // JSON-Body parsen mit erhöhtem Limit für Bilder
app.use(express.urlencoded({ limit: '50mb', extended: true })); // URL-encoded Bodies mit erhöhtem Limit
app.use(cookieParser()); // Cookie-Parser für JWT-Tokens

// Statische Dateien mit korrekten MIME-Types
app.use(express.static(publicDirectoryPath, {
    setHeaders: (res, path) => {
        // JavaScript-Dateien
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        // CSS-Dateien
        else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
        // JSON-Dateien
        else if (path.endsWith('.json')) {
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
        }
        // Cache-Control für statische Assets
        if (path.includes('/assets/js/tinymce/') || path.includes('/node_modules/')) {
            res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 Jahr
        }
    }
}));

// ===========================================
// ÖFFENTLICHE ENDPOINTS
// ===========================================

app.get('/', (req, res) => {
  res.sendFile(join(publicDirectoryPath, 'index.html'));
});

// GET /blogpost/:filename - Einzelnen Blogpost abrufen (Datenbank)
app.get('/blogpost/:filename', async (req, res) => {
  const fileName = req.params.filename;

  try {
    const post = await DatabaseService.getPost(fileName);
    
    if (!post) {
      return res.status(404).json({ error: 'Blogpost nicht gefunden' });
    }

    // View tracken in Datenbank
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referer');
    
    // Asynchron tracken (blockiert Response nicht)
    DatabaseService.incrementViews(fileName, ipAddress, userAgent, referer).catch(err => {
      console.error('Fehler beim Tracking:', err);
    });

    res.setHeader("Content-Type", "application/json");
    res.json(post);
  } catch (error) {
    console.error('Fehler beim Laden des Posts:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden des Posts' });
  }
});

// GET /blogposts - Alle Blogposts auflisten (Datenbank)
app.get('/blogposts', async (req, res) => {
  try {
    const posts = await DatabaseService.getAllPosts();
    res.json(posts);
  } catch (error) {
    console.error('Fehler beim Laden der Posts:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Blogposts' });
  }
});

// GET /most-read - Meistgelesene Blogposts (Datenbank)
app.get('/most-read', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const posts = await DatabaseService.getMostReadPosts(limit);
    res.json(posts);
  } catch (error) {
    console.error('Fehler beim Laden der meistgelesenen Posts:', error);
    res.status(500).json({ error: 'Fehler beim Laden der meistgelesenen Posts' });
  }
});

// GET /comments/:postFilename - Kommentare für einen Post abrufen (Datenbank)
app.get('/comments/:postFilename', async (req, res) => {
  const postFilename = req.params.postFilename;

  try {
    const comments = await DatabaseService.getCommentsByPost(postFilename);
    res.json(comments);
  } catch (error) {
    console.error('Fehler beim Laden der Kommentare:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kommentare' });
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
            secure: IS_PRODUCTION || httpsOptions ? true : false, // HTTPS in Production
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
        });
        
        console.log(`Admin login successful: ${user.username}`);
        
        res.json({
            success: true,
            message: 'Anmeldung erfolgreich',
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
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
                success: false,
                data: {
                    valid: false,
                    error: 'Kein Token gefunden' 
                }
            });
        }
        
        const user = verifyToken(token);
        
        if (!user) {
            return res.status(403).json({ 
                success: false,
                data: {
                    valid: false,
                    error: 'Token ungültig oder abgelaufen' 
                }
            });
        }
        
        res.json({
            success: true,
            data: {
                valid: true,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            }
        });
        
    } catch (error) {
        console.error('Token verification error:', error);
        res.status(500).json({ 
            success: false,
            data: {
                valid: false,
                error: 'Interner Serverfehler' 
            }
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

// POST /blogpost - Blogbeitrag speichern (JWT-geschützt, Datenbank)
app.post('/blogpost', authenticateToken, requireAdmin, async (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Titel und Inhalt sind erforderlich' });
  }

  try {
    const result = await DatabaseService.createPost({
      title,
      content,
      tags,
      author: req.user.username
    });

    console.log(`Post created by ${req.user.username}: ${result.filename}`);
    res.status(201).json({ 
      message: 'Blogpost gespeichert', 
      file: result.filename,
      postId: result.postId
    });
    
  } catch (error) {
    console.error('Fehler beim Erstellen des Posts:', error);
    if (error.message.includes('existiert bereits')) {
      res.status(409).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Fehler beim Speichern des Blogposts' });
    }
  }
});

// DELETE /blogpost/:filename - Blogpost löschen (JWT-geschützt, Datenbank)
app.delete('/blogpost/:filename', authenticateToken, requireAdmin, async (req, res) => {
  const fileName = req.params.filename;

  try {
    const deleted = await DatabaseService.deletePost(fileName, req.user.username);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Blogpost nicht gefunden' });
    }

    console.log(`Post deleted by ${req.user.username}: ${fileName}`);
    res.json({ message: 'Blogpost erfolgreich gelöscht', file: fileName });
    
  } catch (error) {
    console.error('Fehler beim Löschen des Posts:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Blogposts' });
  }
});

// POST /comments/:postFilename - Neuen Kommentar hinzufügen (Datenbank)
app.post('/comments/:postFilename', async (req, res) => {
  const postFilename = req.params.postFilename;
  const { username, text } = req.body;

  // Input-Validierung
  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Kommentartext ist erforderlich' });
  }

  if (text.trim().length > 1000) {
    return res.status(400).json({ error: 'Kommentar ist zu lang (maximal 1000 Zeichen)' });
  }

  try {
    const result = await DatabaseService.addComment(postFilename, {
      username,
      text: text.trim(),
      ipAddress: req.ip || req.connection.remoteAddress
    });

    console.log(`New comment for ${postFilename} by ${result.comment.username}`);
    res.status(201).json({ 
      message: 'Kommentar erfolgreich hinzugefügt',
      comment: result.comment
    });
    
  } catch (error) {
    console.error('Fehler beim Hinzufügen des Kommentars:', error);
    res.status(500).json({ error: 'Fehler beim Speichern des Kommentars' });
  }
});

// DELETE /comments/:postFilename/:commentId - Kommentar löschen (JWT-geschützt, Datenbank)
app.delete('/comments/:postFilename/:commentId', authenticateToken, requireAdmin, async (req, res) => {
  const { postFilename, commentId } = req.params;
  
  try {
    const deleted = await DatabaseService.deleteComment(commentId, postFilename);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    }

    console.log(`Comment deleted by ${req.user.username}: ${commentId} in ${postFilename}`);
    res.json({ 
      message: 'Kommentar erfolgreich gelöscht',
      commentId: commentId
    });
    
  } catch (error) {
    console.error('Fehler beim Löschen des Kommentars:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Kommentars' });
  }
});

// POST /upload/image - Bild-Upload (JWT-geschützt, mit Datenbank-Tracking)
app.post('/upload/image', authenticateToken, requireAdmin, async (req, res) => {
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
    mkdir(uploadDir, { recursive: true }, async (mkdirErr) => {
      if (mkdirErr) {
        console.error('Fehler beim Erstellen des Upload-Ordners:', mkdirErr);
        return res.status(500).json({ error: 'Fehler beim Erstellen des Upload-Ordners' });
      }
      
      // Bild-Datei schreiben
      const imagePath = join(uploadDir, uniqueFilename);
      writeFile(imagePath, base64Data, 'base64', async (writeErr) => {
        if (writeErr) {
          console.error('Fehler beim Speichern des Bildes:', writeErr);
          return res.status(500).json({ error: 'Fehler beim Speichern des Bildes' });
        }
        
        try {
          // Dateisize ermitteln
          const { stat } = await import('fs/promises');
          const stats = await stat(imagePath);
          
          // Media-Eintrag in Datenbank erstellen
          await DatabaseService.addMedia({
            filename: uniqueFilename,
            original_name: filename,
            file_size: stats.size,
            mime_type: 'image/' + (sanitizedFilename.split('.').pop() || 'jpeg'),
            uploaded_by: req.user.username,
            upload_path: `/assets/uploads/${uniqueFilename}`
          });
          
        } catch (dbError) {
          console.error('Fehler beim Tracking des Uploads:', dbError);
          // Nicht kritisch, Upload war erfolgreich
        }
        
        const imageUrl = `/assets/uploads/${uniqueFilename}`;
        console.log(`Image uploaded by ${req.user.username}: ${uniqueFilename}`);
        
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

// DELETE /assets/uploads/:filename - Bild löschen (JWT-geschützt, mit Datenbank-Update)
app.delete('/assets/uploads/:filename', authenticateToken, requireAdmin, async (req, res) => {
  const filename = req.params.filename;
  const imagePath = join(__dirname, '..', 'assets', 'uploads', filename);
  
  try {
    // Aus Datenbank entfernen
    await DatabaseService.deleteMedia(filename);
    
    // Datei vom Dateisystem löschen
    unlink(imagePath, (err) => {
      if (err) {
        if (err.code === 'ENOENT') {
          return res.status(404).json({ error: 'Bild nicht gefunden' });
        }
        console.error('Fehler beim Löschen des Bildes:', err);
        return res.status(500).json({ error: 'Fehler beim Löschen des Bildes' });
      }
      
      console.log(`Image deleted by ${req.user.username}: ${filename}`);
      res.json({ message: 'Bild erfolgreich gelöscht', filename: filename });
    });
    
  } catch (error) {
    console.error('Fehler beim Löschen des Media-Eintrags:', error);
    // Trotzdem versuchen, die Datei zu löschen
    unlink(imagePath, (err) => {
      if (err && err.code !== 'ENOENT') {
        return res.status(500).json({ error: 'Fehler beim Löschen des Bildes' });
      }
      res.json({ message: 'Bild gelöscht (Datenbank-Fehler)', filename: filename });
    });
  }
});

// POST /upload/simple - Einfacher Bild-Upload ohne Komprimierung (JWT-geschützt)
app.post('/upload/simple', authenticateToken, requireAdmin, (req, res) => {
  try {
    // Für FormData-Upload direkt aus req.body (hier sollte Multer verwendet werden, aber für Einfachheit...)
    // Da TinyMCE meistens JSON sendet, verwenden wir den gleichen Ansatz wie bei /upload/image
    const { imageData, filename } = req.body;
    
    if (!imageData || !filename) {
      return res.status(400).json({ error: 'Bilddaten und Dateiname sind erforderlich' });
    }

    // Base64-Header entfernen falls vorhanden
    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    
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
        console.log(`Simple upload by ${req.user.username}: ${uniqueFilename}`);
        
        res.json({
          message: 'Bild erfolgreich hochgeladen (einfach)',
          filename: uniqueFilename,
          url: imageUrl,
          location: imageUrl // TinyMCE erwartet 'location' für die URL
        });
      });
    });
    
  } catch (error) {
    console.error('Fehler beim einfachen Upload:', error);
    res.status(500).json({ error: 'Fehler beim einfachen Upload' });
  }
});

// ===========================================
// SERVER STARTEN
// ===========================================

const PORT = process.env.PORT || (IS_PLESK ? 8080 : 3000);
const HTTPS_PORT = process.env.HTTPS_PORT || (IS_PLESK ? 8443 : 3443);
const HOST = process.env.HOST || '0.0.0.0';

console.log(`Server configuration:`);
console.log(`   HTTP Port: ${PORT}`);
console.log(`   HTTPS Port: ${HTTPS_PORT}`);
console.log(`   Host: ${HOST}`);
console.log(`   Domain: ${process.env.DOMAIN || 'not set'}`);

// HTTP Server (für Entwicklung und Redirects)
const httpServer = http.createServer(app);
httpServer.listen(PORT, HOST, () => {
    console.log(`HTTP Server running on ${HOST}:${PORT}`);
    if (IS_PLESK) {
        console.log('Plesk mode: SSL handled by Plesk');
        console.log(`Publicly accessible at: http${IS_PRODUCTION ? 's' : ''}://${process.env.DOMAIN || 'localhost'}`);
    } else if (!httpsOptions) {
        console.log('HTTP only available - run "node ssl/generate-certs.js" for HTTPS');
    }
});

// HTTPS Server nur in Development starten
if (!IS_PLESK && httpsOptions) {
    const httpsServer = https.createServer(httpsOptions, app);
    httpsServer.listen(HTTPS_PORT, HOST, () => {
        console.log(`HTTPS Server running on https://${HOST}:${HTTPS_PORT}`);
        console.log('SSL/TLS enabled - secure connection available');
        console.log('Certificate: Self-signed for development (browser warning normal)');
        console.log('JWT authentication enabled');
    });
    
    // Graceful shutdown für beide Server
    process.on('SIGTERM', () => {
        console.log('Shutting down servers...');
        httpServer.close();
        httpsServer.close();
    });
} else {
    // Graceful shutdown nur für HTTP
    process.on('SIGTERM', () => {
        console.log('Shutting down HTTP server...');
        httpServer.close();
    });
}
