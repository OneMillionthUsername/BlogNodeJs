import express, { json } from 'express';
import { mkdir, writeFile, readFile, readdir, unlink } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { unlink as unlinkAsync } from 'fs/promises';

// Define cookie name as a constant for easier maintenance
const AUTH_COOKIE_NAME = 'authToken';

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
const JSON_BODY_LIMIT = process.env.JSON_BODY_LIMIT || '2mb';
const URLENCODED_BODY_LIMIT = process.env.URLENCODED_BODY_LIMIT || '2mb';
app.use(express.json({ limit: JSON_BODY_LIMIT })); // JSON Bodies mit konfigurierbarem Limit
app.use(express.urlencoded({ limit: URLENCODED_BODY_LIMIT, extended: true })); // URL-encoded Bodies mit konfigurierbarem Limit
app.use(cookieParser()); // Cookie-Parser für Cookies, inkl. JWT im 'authToken'-Cookie

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

// Health Check Endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: IS_PRODUCTION ? 'production' : 'development',
        version: process.env.npm_package_version || '1.0.0'
    });
});

app.get('/', (req, res) => {
  res.sendFile(join(publicDirectoryPath, 'index.html'));
});

// GET /blogpost/:filename - Einzelnen Blogpost abrufen (Datenbank)
// Parameter: filename (string) - Der Dateiname des Blogposts, erwartet wird ein gültiger Slug oder Dateiname ohne Pfadangaben.
// Beispiel: /blogpost/my-first-post.md
// Constraints: Keine Schrägstriche, keine Pfadangaben, nur gültige Dateinamen/Slugs.
app.get('/blogpost/:filename', async (req, res) => {
  const fileName = req.params.filename;

  try {
    const post = await DatabaseService.getPost(fileName);
    
    if (!post) {
      return res.status(404).json({ error: 'Blogpost nicht gefunden' });
    }

    // View tracken in Datenbank
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.get('User-Agent');
    const referer = req.get('Referer');
    
    // Asynchron tracken (blockiert Response nicht)
    DatabaseService.incrementViews(fileName, ipAddress, userAgent, referer).catch(err => {
      console.error('Fehler beim Tracking:', err);
    });

    res.json(post);
  } catch (error) {
    console.error('Fehler beim Laden des Posts:', error);
    res.status(500).json({ error: 'Serverfehler beim Laden des Posts' });
  }
});

// GET /blogposts - Alle Blogposts auflisten (Datenbank)
// Query-Parameter:
//   - limit (optional): Anzahl der zurückgegebenen Blogposts (Standard: alle)
//   - offset (optional): Offset für Pagination (Standard: 0)
// Response:
//   - Array von Blogpost-Objekten:
//     [
//       {
//         id: number,
//         title: string,
//         content: string,
//         tags: array,
//         author: string,
//         created_at: string,
//         views: number
//       },
//       ...
//     ]
app.get('/blogposts', async (req, res) => {
  try {
    const posts = await DatabaseService.getAllPosts();
    res.json(posts || []);
  } catch (error) {
    console.error('Fehler beim Laden der Posts:', error);
    res.status(500).json({ error: 'Fehler beim Laden der Blogposts' });
  }
});

// GET /most-read - Meistgelesene Blogposts (Datenbank)
// Query-Parameter:
//   - limit (optional): Anzahl der zurückgegebenen Blogposts (Standard: 10)
    
//   - Array von Blogpost-Objekten
app.get('/most-read', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10);
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
    res.json(comments || []);
  } catch (error) {
    console.error('Fehler beim Laden der Kommentare für', postFilename, ':', error);
    res.status(500).json({ error: 'Fehler beim Laden der Kommentare' });
  }
});

// GET /assets/uploads/:filename - Bilder ausliefern
app.get('/assets/uploads/:filename', (req, res) => {
  const filename = req.params.filename;
  const uploadsDir = join(__dirname, '..', 'assets', 'uploads');
  const imagePath = join(uploadsDir, filename);

  // Sicherheitscheck: Nur erlaubte Dateierweiterungen
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
  const hasValidExtension = allowedExtensions.some(ext => 
    filename.toLowerCase().endsWith(ext)
  );

  if (!hasValidExtension) {
    return res.status(400).json({ error: 'Ungültiger Dateityp' });
  }

  // Pfadvalidierung: Stelle sicher, dass imagePath im uploadsDir liegt
  const resolvedImagePath = join(uploadsDir, filename);
  if (!resolvedImagePath.startsWith(uploadsDir)) {
    return res.status(400).json({ error: 'Ungültiger Dateipfad' });
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

  if (!contentTypes[extension]) {
    return res.status(400).json({ error: 'Nicht unterstütztes Bildformat' });
  }

  res.setHeader('Content-Type', contentTypes[extension]);
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 Jahr Cache

  // Datei ausliefern
  res.sendFile(resolvedImagePath, (err) => {
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
// Response:
//   - On success:
//       {
//         success: true,
//         message: 'Anmeldung erfolgreich',
//         user: {
//           id: number,
//           username: string,
//           role: string
//         }
//       }
//   - On error:
//       {
//         error: string,
//         success: false
//       }

// Helper for input validation
function validateLoginInput(body) {
    const { username, password } = body;
    if (!username || !password) {
        return { valid: false, error: 'Benutzername und Passwort erforderlich' };
    }
    return { valid: true, username, password };
}

// Utility: Sanitize filename for uploads
function sanitizeFilename(name) {
    return name
        .replace(/[^\w\.-]/g, '_') // Ersetze ungültige Zeichen durch Unterstriche
        .replace(/_{2,}/g, '_') // Mehrfache Unterstriche reduzieren
        .toLowerCase();
}

// Helper for authentication
async function authenticateAdmin(username, password) {
    const user = await validateAdminLogin(username, password);
    if (!user) {
        // Sicherheitsdelay bei fehlgeschlagener Anmeldung
        await new Promise(resolve => setTimeout(resolve, 1000));
        return null;
    }
    return user;
}

// Helper for response
function sendLoginResponse(res, user, token) {
    res.cookie(AUTH_COOKIE_NAME, token, {
        httpOnly: true,
        secure: Boolean(IS_PRODUCTION || httpsOptions),
        sameSite: 'strict',
    });
    console.log(`[AUTH AUDIT] Successful admin authentication for user: ID=${user.id}, username=${user.username}`);
    res.json({
        success: true,
        message: 'Anmeldung erfolgreich',
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    });
}

app.post('/auth/login', async (req, res) => {
    // Input validation
    const input = validateLoginInput(req.body);
    if (!input.valid) {
        return res.status(400).json({ 
            error: input.error,
            success: false 
        });
    }

    try {
        // Authentication
        const user = await authenticateAdmin(input.username, input.password);
        if (!user) {
            return res.status(401).json({ 
                error: 'Ungültige Anmeldedaten',
                success: false 
            });
        }

        // Token generation
        const { id, username, role } = user;
        const token = generateToken({ id, username, role });

        // Response
        sendLoginResponse(res, user, token);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            error: 'Interner Serverfehler',
            code: 'INTERNAL_SERVER_ERROR',
            success: false 
        });
    }
});

// POST /auth/verify - Token-Verifikation
// Response:
//   - On success:
app.post('/auth/verify', (req, res) => {
    try {
        const token = extractTokenFromRequest(req);
        let tokenSource = 'unknown';
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            tokenSource = 'Authorization header';
        } else if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
            tokenSource = 'auth_token cookie';
        } else if (req.body && req.body.token) {
            tokenSource = 'request body';
        }
        
        if (!token) {
            console.warn(`[AUTH AUDIT] Token verification failed: No token found (source: ${tokenSource})`);
            return res.status(401).json({ 
                success: false,
                data: {
                    valid: false,
                    error: 'Kein Token gefunden' 
                }
            });
        }
        
        let user;
        try {
            user = verifyToken(token);
        } catch (err) {
            console.error(`[AUTH AUDIT] Error during token verification (source: ${tokenSource}):`, err);
            return res.status(403).json({ 
                success: false,
                data: {
                    valid: false,
                    error: 'Token ungültig oder abgelaufen' 
                }
            });
        }
        
        if (!user) {
            console.warn(`[AUTH AUDIT] Token verification failed: Invalid or expired token (source: ${tokenSource})`);
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
    res.clearCookie(AUTH_COOKIE_NAME, {
        httpOnly: true
    });
    res.json({
        message: 'Logout erfolgreich',
        success: true
    });
});

// ===========================================
// ADMIN-GESCHÜTZTE ENDPOINTS (JWT erforderlich)
// ===========================================

// POST /blogpost - Blogbeitrag speichern (JWT-geschützt, Datenbank)
// Response:
//   - On success:
//       {
//         message: 'Blogpost gespeichert',
//         file: string,      // Dateiname des gespeicherten Blogposts
//         postId: number     // ID des gespeicherten Blogposts
//       }
//   - On error:
//       {
//         error: string
//       }
app.post('/blogpost', authenticateToken, requireAdmin, async (req, res) => {
  const { title, content, tags } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Titel und Inhalt sind erforderlich' });
  }

  if (!req.user || !req.user.username) {
    return res.status(401).json({ error: 'Nicht authentifiziert oder Benutzername fehlt' });
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
// Hinweis: Der Benutzername des löschenden Nutzers wird zur Datenbank für Audit-Zwecke übergeben.
// Response:
//   - On success:
//       {
//         message: 'Blogpost erfolgreich gelöscht',
//         file: string      // Dateiname des gelöschten Blogposts
//       }
//   - On error:
//       {
//         error: string
//       }
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
      username: username || 'Anonym',
      text: text.trim(),
      ipAddress: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress
    });

    console.log(`New comment for ${postFilename} by ${result.comment.username}`);
    res.status(201).json({ 
      message: 'Kommentar erfolgreich hinzugefügt',
      commentId: result.commentId,
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
  const numericCommentId = Number(commentId);

  // Validate commentId is a number
  if (isNaN(numericCommentId)) {
    return res.status(400).json({ error: 'Ungültige Kommentar-ID' });
  }

  try {
    const deleted = await DatabaseService.deleteComment(numericCommentId, postFilename);
    
    if (!deleted) {
      console.log(`Comment deletion attempted by ${req.user.username}: ${numericCommentId} in ${postFilename} - Result: FAILURE`);
      return res.status(404).json({ error: 'Kommentar nicht gefunden' });
    }

    res.json({ 
      message: 'Kommentar erfolgreich gelöscht',
      commentId
    });
    
  } catch (error) {
    console.error('Fehler beim Löschen des Kommentars:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Kommentars' });
  }
});

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
    const { mkdir: mkdirAsync, writeFile: writeFileAsync, stat: statAsync } = await import('fs/promises');
    try {
      await mkdirAsync(uploadDir, { recursive: true });
    } catch (mkdirErr) {
      console.error('Fehler beim Erstellen des Upload-Ordners:', mkdirErr);
      return res.status(500).json({ error: 'Fehler beim Erstellen des Upload-Ordners' });
    }
    
    // Bild-Datei schreiben
    const imagePath = join(uploadDir, uniqueFilename);
    try {
      await writeFileAsync(imagePath, base64Data, 'base64');
    } catch (writeErr) {
      console.error('Fehler beim Speichern des Bildes:', writeErr);
      return res.status(500).json({ error: 'Fehler beim Speichern des Bildes' });
    }
    
    try {
      // Dateisize ermitteln
      const stats = await statAsync(imagePath);
      
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
        // Parallel deletion für bessere Performance
        const [dbResult] = await Promise.allSettled([
            DatabaseService.deleteMedia(filename),
            unlinkAsync(imagePath)
        ]);
        
        // DB-Deletion muss erfolgreich sein
        if (dbResult.status === 'rejected') {
            throw new Error(`Database deletion failed: ${dbResult.reason}`);
        }
        
        console.log(`[AUDIT] Image deletion by user: ${req.user.username}, file: ${filename}, IP: ${req.ip}`);
        res.json({ 
            message: 'Bild erfolgreich gelöscht', 
            filename: filename 
        });
        
    } catch (error) {
        console.error('Deletion error:', error);
        
        if (error.code === 'ENOENT') {
            return res.status(404).json({ error: 'Bild nicht gefunden' });
        }
        
        res.status(500).json({ error: 'Fehler beim Löschen des Bildes' });
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

// Server-Timeouts konfigurieren
httpServer.setTimeout(30000); // 30 Sekunden
httpServer.headersTimeout = 31000; // Etwas höher als setTimeout

httpServer.listen(PORT, HOST, () => {
    const protocol = IS_PRODUCTION || httpsOptions ? 'https' : 'http';
    const domain = process.env.DOMAIN || 'localhost';
    const displayPort = (protocol === 'http' && PORT === 80) || (protocol === 'https' && PORT === 443) ? '' : `:${PORT}`;
    
    console.log(`HTTP Server running on ${HOST}:${PORT}`);
    console.log(`Server erreichbar unter: ${protocol}://${domain}${displayPort}`);
    
    if (IS_PLESK) {
        console.log('Plesk mode: SSL handled by Plesk');
    } else if (!httpsOptions) {
        console.log('HTTP only available - run "node ssl/generate-certs.js" for HTTPS');
    }
}).on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} bereits in Verwendung!`);
        console.error(`Tipp: Verwende einen anderen Port mit PORT=xxxx`);
    } else {
        console.error('Server-Fehler:', error);
    }
    process.exit(1);
});

// Graceful Shutdown Handler
function gracefulShutdown(signal) {
    console.log(`${signal} erhalten - starte Graceful Shutdown...`);
    
    httpServer.close((err) => {
        if (err) {
            console.error('Fehler beim Schließen des HTTP-Servers:', err);
            process.exit(1);
        }
        
        console.log('HTTP-Server geschlossen');
        console.log('Server erfolgreich beendet');
        process.exit(0);
    });
}

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
    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
        process.on(signal, () => {
            console.log(`${signal} erhalten - starte Graceful Shutdown...`);
            
            httpServer.close((httpErr) => {
                httpsServer.close((httpsErr) => {
                    if (httpErr || httpsErr) {
                        console.error('Fehler beim Schließen der Server:', httpErr || httpsErr);
                        process.exit(1);
                    }
                    console.log('Beide Server geschlossen');
                    console.log('Server erfolgreich beendet');
                    process.exit(0);
                });
            });
        });
    });
} else {
    // Graceful shutdown nur für HTTP
    ['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach(signal => {
        process.on(signal, () => gracefulShutdown(signal));
    });
}
