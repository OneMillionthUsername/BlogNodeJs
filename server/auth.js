// JWT-Authentifizierungs-Modul
// Sichere Token-basierte Authentifizierung für das Blog-System

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// JWT-Konfiguration
const JWT_CONFIG = {
    SECRET_KEY: process.env.JWT_SECRET || generateSecretKey(),
    EXPIRES_IN: '24h', // Token-Lebensdauer
    ALGORITHM: 'HS256',
    ISSUER: 'blog-app',
    AUDIENCE: 'blog-users'
};

// Admin-Benutzer-Konfiguration (in Produktion aus Datenbank)
const ADMIN_CONFIG = {
    username: 'admin',
    // Temporär: Klartext-Passwort für Debugging (NICHT für Produktion!)
    passwordHash: 'admin123',
    role: 'admin',
    id: 'admin-001'
};

// Secret Key generieren und persistent speichern
function generateSecretKey() {
    const configPath = join(__dirname, '..', 'config', 'jwt-secret.txt');
    
    try {
        // Versuche bestehenden Key zu laden
        if (existsSync(configPath)) {
            const existingKey = readFileSync(configPath, 'utf8').trim();
            if (existingKey.length >= 32) {
                console.log('✅ JWT-Secret aus Datei geladen');
                return existingKey;
            }
        }
    } catch (error) {
        console.warn('⚠️ Konnte bestehenden JWT-Secret nicht laden');
    }
    
    // Neuen Secret Key generieren
    const newSecret = crypto.randomBytes(64).toString('hex');
    
    try {
        // Config-Verzeichnis erstellen falls nötig
        const configDir = join(__dirname, '..', 'config');
        if (!existsSync(configDir)) {
            mkdirSync(configDir, { recursive: true });
        }
        
        // Secret Key speichern
        writeFileSync(configPath, newSecret, 'utf8');
        console.log('🔑 Neuer JWT-Secret generiert und gespeichert');
    } catch (error) {
        console.warn('⚠️ Konnte JWT-Secret nicht speichern, verwende temporären Key');
    }
    
    return newSecret;
}

// JWT-Token generieren
export function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        iss: JWT_CONFIG.ISSUER,
        aud: JWT_CONFIG.AUDIENCE
    };
    
    return jwt.sign(payload, JWT_CONFIG.SECRET_KEY, {
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        algorithm: JWT_CONFIG.ALGORITHM
    });
}

// JWT-Token verifizieren
export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_CONFIG.SECRET_KEY, {
            algorithms: [JWT_CONFIG.ALGORITHM],
            issuer: JWT_CONFIG.ISSUER,
            audience: JWT_CONFIG.AUDIENCE
        });
    } catch (error) {
        console.error('❌ JWT-Verifikation fehlgeschlagen:', error.message);
        return null;
    }
}

// Token aus Request extrahieren
export function extractTokenFromRequest(req) {
    // Prüfe Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // Prüfe Cookies (fallback)
    if (req.cookies && req.cookies.authToken) {
        return req.cookies.authToken;
    }
    
    return null;
}

// Admin-Login validieren (temporär mit Klartext für Debugging)
export async function validateAdminLogin(username, password) {
    console.log('🔍 Login-Versuch:', { username, password: password ? '[VORHANDEN]' : '[LEER]' });
    
    if (username !== ADMIN_CONFIG.username) {
        console.log('❌ Ungültiger Benutzername:', username, 'erwartet:', ADMIN_CONFIG.username);
        return null;
    }
    
    try {
        // Temporär: Direkter String-Vergleich für Debugging
        const isValidPassword = password === ADMIN_CONFIG.passwordHash;
        console.log('📝 Passwort-Vergleich (Klartext):', { eingegeben: password, erwartet: ADMIN_CONFIG.passwordHash, gueltig: isValidPassword });
        
        if (isValidPassword) {
            console.log('✅ Admin-Login erfolgreich');
            return {
                id: ADMIN_CONFIG.id,
                username: ADMIN_CONFIG.username,
                role: ADMIN_CONFIG.role
            };
        } else {
            console.log('❌ Ungültiges Passwort für Admin');
            return null;
        }
    } catch (error) {
        console.error('❌ Fehler bei Passwort-Validierung:', error);
        return null;
    }
}

// Passwort hashen (für Admin-Passwort-Update)
export async function hashPassword(password) {
    try {
        const saltRounds = 12; // Höhere Sicherheit
        return await bcrypt.hash(password, saltRounds);
    } catch (error) {
        console.error('❌ Fehler beim Passwort-Hashing:', error);
        throw error;
    }
}

// JWT-Middleware für Express
export function authenticateToken(req, res, next) {
    const token = extractTokenFromRequest(req);
    
    if (!token) {
        return res.status(401).json({ 
            error: 'Zugriff verweigert',
            message: 'JWT-Token erforderlich' 
        });
    }
    
    const user = verifyToken(token);
    if (!user) {
        return res.status(403).json({ 
            error: 'Ungültiger Token',
            message: 'Token ist abgelaufen oder ungültig' 
        });
    }
    
    // Benutzer-Informationen an Request anhängen
    req.user = user;
    next();
}

// Admin-Only Middleware
export function requireAdmin(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ 
            error: 'Admin-Berechtigung erforderlich',
            message: 'Nur Administratoren haben Zugriff auf diese Funktion' 
        });
    }
    next();
}

// Token-Refresh (für automatische Verlängerung)
export function refreshToken(token) {
    const decoded = verifyToken(token);
    if (!decoded) {
        return null;
    }
    
    // Prüfe ob Token bald abläuft (weniger als 1 Stunde)
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = decoded.exp - now;
    
    if (timeToExpiry < 3600) { // 1 Stunde
        // Generiere neuen Token mit selben Daten
        return generateToken({
            id: decoded.id,
            username: decoded.username,
            role: decoded.role
        });
    }
    
    return token; // Token ist noch gültig
}

// JWT-Konfiguration für Debugging
export function getJWTConfig() {
    return {
        algorithm: JWT_CONFIG.ALGORITHM,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
        hasSecret: !!JWT_CONFIG.SECRET_KEY
    };
}

console.log('🔐 JWT-Authentifizierungs-Modul geladen');
console.log('⚙️ Konfiguration:', getJWTConfig());
