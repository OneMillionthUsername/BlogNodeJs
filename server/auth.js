// JWT-Authentifizierungs-Modul
// Sichere Token-basierte Authentifizierung für das Blog-System

import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Cookie-Konfiguration
export const AUTH_COOKIE_NAME = 'auth_token';

// JWT-Secret Validation
if (!process.env.JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is required!');
    console.error('Please add JWT_SECRET to your .env file');
    console.error('Example: JWT_SECRET=your_64_character_secret_key_here');
    process.exit(1);
}

if (process.env.JWT_SECRET.length < 32) {
    console.error('FATAL ERROR: JWT_SECRET must be at least 32 characters long');
    console.error('Current length:', process.env.JWT_SECRET.length);
    console.error('Generate a secure key with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
    process.exit(1);
}

// JWT-Konfiguration
const JWT_CONFIG = {
    SECRET_KEY: process.env.JWT_SECRET,
    EXPIRES_IN: '24h', // Token-Lebensdauer
    ALGORITHM: 'HS256',
    ISSUER: 'blog-app',
    AUDIENCE: 'blog-users'
};

// JWT-Token generieren
export function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
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
        if (process.env.NODE_ENV === 'production') {
            console.error('JWT-Verifikation fehlgeschlagen');
        } else {
            console.error('JWT-Verifikation fehlgeschlagen:', error.message);
        }
        return null;
    }
}

// Token aus Request extrahieren
/**
 * Extracts the JWT token from an Express request object.
 * Checks the Authorization header and cookies for a token.
 * @param {import('express').Request} req - The Express request object.
 * @returns {string|null} The extracted JWT token, or null if not found.
 */
export function extractTokenFromRequest(req) {
    // Prüfe Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    
    // Prüfe Cookies (fallback)
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
        return req.cookies[AUTH_COOKIE_NAME];
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
        console.error('Fehler beim Passwort-Hashing:', error);
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

// JWT-Konfiguration für Debugging
export function getJWTConfig() {
    return {
        algorithm: JWT_CONFIG.ALGORITHM,
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE,
        secretPresent: !!JWT_CONFIG.SECRET_KEY,
        secretLength: JWT_CONFIG.SECRET_KEY ? JWT_CONFIG.SECRET_KEY.length : 0
    };
}

console.log('JWT authentication module loaded');
console.log('Configuration:', getJWTConfig());
console.log('Admin users must be created manually in the database');
console.log('Use SQL scripts to create admin users with bcrypt hashed passwords');