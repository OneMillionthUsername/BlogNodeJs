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
    SECRET_KEY: getJWTSecret(),
    EXPIRES_IN: '24h', // Token-Lebensdauer
    ALGORITHM: 'HS256',
    ISSUER: 'blog-app',
    AUDIENCE: 'blog-users'
};

// JWT-Secret sicher laden (Environment-Variable oder generieren)
function getJWTSecret() {
    // 1. Priorität: Environment-Variable (Production)
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length >= 32) {
        console.log('✅ JWT-Secret aus Environment-Variable geladen');
        return process.env.JWT_SECRET;
    }
    
    // 2. Fallback: Bestehende Datei lesen (Development)
    const configPath = join(__dirname, '..', 'config', 'jwt-secret.txt');
    try {
        if (existsSync(configPath)) {
            const existingKey = readFileSync(configPath, 'utf8').trim();
            if (existingKey.length >= 32) {
                console.log('⚠️ JWT-Secret aus Datei geladen (Development)');
                return existingKey;
            }
        }
    } catch (error) {
        console.warn('⚠️ Konnte JWT-Secret-Datei nicht lesen');
    }
    
    // 3. Letzter Fallback: Neuen Secret generieren und warnen
    console.warn('🚨 WARNUNG: Kein JWT-Secret gefunden! Generiere temporären Secret...');
    console.warn('🔧 Setzen Sie JWT_SECRET in der .env für Production!');
    
    const tempSecret = crypto.randomBytes(64).toString('hex');
    
    // Nur in Development-Modus in Datei speichern
    if (process.env.NODE_ENV !== 'production') {
        try {
            const configDir = join(__dirname, '..', 'config');
            if (!existsSync(configDir)) {
                mkdirSync(configDir, { recursive: true });
            }
            writeFileSync(configPath, tempSecret, 'utf8');
            console.log('� Temporärer JWT-Secret für Development gespeichert');
        } catch (error) {
            console.warn('⚠️ Konnte temporären JWT-Secret nicht speichern');
        }
    }
    
    return tempSecret;
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

// Admin-Login validieren (Datenbank-basiert)
export async function validateAdminLogin(username, password) {
    console.log('Login attempt for username:', username);
    
    if (!username || !password) {
        console.log('Missing username or password');
        return null;
    }
    
    try {
        // Importiere DatabaseService zur Laufzeit um zirkuläre Abhängigkeiten zu vermeiden
        const { DatabaseService } = await import('./database.js');
        
        // Admin-Benutzer aus Datenbank laden
        const admin = await DatabaseService.getAdminByUsername(username);
        if (!admin) {
            console.log('Admin user not found:', username);
            return null;
        }
        
        // Prüfe ob Account gesperrt ist
        if (!admin.active) {
            console.log('Admin account is disabled:', username);
            return null;
        }
        
        // Prüfe ob Account temporär gesperrt ist
        if (admin.locked_until && new Date() < new Date(admin.locked_until)) {
            console.log('Admin account is temporarily locked:', username);
            return null;
        }
        
        // Passwort mit Hash vergleichen
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        
        if (isValidPassword) {
            // Login-Attempts zurücksetzen bei erfolgreichem Login
            await DatabaseService.updateAdminLoginSuccess(admin.id);
            
            console.log('Admin login successful:', username);
            return {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                email: admin.email,
                full_name: admin.full_name
            };
        } else {
            // Fehlgeschlagene Login-Versuche erhöhen
            await DatabaseService.updateAdminLoginFailure(admin.id);
            
            console.log('Invalid password for admin:', username);
            return null;
        }
    } catch (error) {
        console.error('Error during admin login validation:', error);
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

console.log('JWT authentication module loaded');
console.log('Configuration:', getJWTConfig());
console.log('Admin users must be created manually in the database');
console.log('Use SQL scripts to create admin users with bcrypt hashed passwords');
