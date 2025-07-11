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
    console.log('🔑 === TOKEN GENERATION DEBUG ===');
    console.log('🔑 Input user object:', user);
    
    const payload = {
        id: user.id,
        username: user.username,
        role: user.role,
        iss: JWT_CONFIG.ISSUER,
        aud: JWT_CONFIG.AUDIENCE
    };
    
    console.log('🔑 JWT Payload:', payload);
    console.log('🔑 JWT Config:');
    console.log('   SECRET_KEY length:', JWT_CONFIG.SECRET_KEY?.length);
    console.log('   EXPIRES_IN:', JWT_CONFIG.EXPIRES_IN);
    console.log('   ALGORITHM:', JWT_CONFIG.ALGORITHM);
    console.log('   ISSUER:', JWT_CONFIG.ISSUER);
    console.log('   AUDIENCE:', JWT_CONFIG.AUDIENCE);
    
    const token = jwt.sign(payload, JWT_CONFIG.SECRET_KEY, {
        expiresIn: JWT_CONFIG.EXPIRES_IN,
        algorithm: JWT_CONFIG.ALGORITHM
    });
    
    console.log('🔑 Generated token length:', token.length);
    console.log('🔑 Generated token (first 50 chars):', token.substring(0, 50) + '...');
    console.log('🔑 Full generated token (DEBUG):', token);
    console.log('🔑 === TOKEN GENERATION COMPLETE ===');
    
    return token;
}

// JWT-Token verifizieren
export function verifyToken(token) {
    console.log('🔓 === TOKEN VERIFICATION DEBUG ===');
    console.log('🔓 Input token length:', token?.length || 0);
    console.log('🔓 Input token (first 50 chars):', token ? token.substring(0, 50) + '...' : '[NO TOKEN]');
    console.log('🔓 Full input token (DEBUG):', token);
    
    try {
        console.log('🔓 Attempting JWT verification with config:');
        console.log('   algorithms:', [JWT_CONFIG.ALGORITHM]);
        console.log('   issuer:', JWT_CONFIG.ISSUER);
        console.log('   audience:', JWT_CONFIG.AUDIENCE);
        console.log('   secret length:', JWT_CONFIG.SECRET_KEY?.length);
        
        const decoded = jwt.verify(token, JWT_CONFIG.SECRET_KEY, {
            algorithms: [JWT_CONFIG.ALGORITHM],
            issuer: JWT_CONFIG.ISSUER,
            audience: JWT_CONFIG.AUDIENCE
        });
        
        console.log('✅ Token verification successful');
        console.log('🔓 Decoded payload:', decoded);
        console.log('🔓 === TOKEN VERIFICATION SUCCESS ===');
        return decoded;
    } catch (error) {
        console.error('❌ JWT-Verifikation fehlgeschlagen');
        console.error('   Error name:', error.name);
        console.error('   Error message:', error.message);
        console.error('   Error details:', error);
        
        if (process.env.NODE_ENV !== 'production') {
            console.error('   Full error stack:', error.stack);
        }
        
        console.log('🔓 === TOKEN VERIFICATION FAILED ===');
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
    console.log('🔍 === TOKEN EXTRACTION DEBUG ===');
    console.log('🔍 Request headers:', req.headers);
    console.log('🔍 Request cookies:', req.cookies);
    console.log('🔍 AUTH_COOKIE_NAME:', AUTH_COOKIE_NAME);
    
    // Prüfe Authorization Header
    const authHeader = req.headers.authorization;
    console.log('🔍 Authorization header:', authHeader);
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const headerToken = authHeader.substring(7);
        console.log('✅ Token found in Authorization header');
        console.log('🔍 Header token length:', headerToken.length);
        console.log('🔍 Header token (first 50):', headerToken.substring(0, 50) + '...');
        console.log('🔍 === TOKEN EXTRACTION SUCCESS (HEADER) ===');
        return headerToken;
    }
    
    // Prüfe Cookies (fallback)
    console.log('🔍 Checking cookies for:', AUTH_COOKIE_NAME);
    if (req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
        const cookieToken = req.cookies[AUTH_COOKIE_NAME];
        console.log('✅ Token found in cookie');
        console.log('🔍 Cookie token length:', cookieToken.length);
        console.log('🔍 Cookie token (first 50):', cookieToken.substring(0, 50) + '...');
        console.log('🔍 === TOKEN EXTRACTION SUCCESS (COOKIE) ===');
        return cookieToken;
    }
    
    console.log('❌ No token found in headers or cookies');
    console.log('🔍 Available cookie names:', req.cookies ? Object.keys(req.cookies) : 'none');
    console.log('🔍 === TOKEN EXTRACTION FAILED ===');
    return null;
}


// Admin-Login validieren (Datenbank-basiert)
export async function validateAdminLogin(username, password) {
    console.log('=== ADMIN LOGIN DEBUG START ===');
    console.log('🔍 Login attempt for username:', username);
    console.log('🔍 Password provided:', password ? `[${password.length} chars]` : '[NONE]');
    console.log('🔍 Raw password (DEBUG):', password);
    
    if (!username || !password) {
        console.log('❌ Missing username or password');
        console.log('   Username present:', !!username);
        console.log('   Password present:', !!password);
        return null;
    }
    
    try {
        console.log('🔗 Attempting to import DatabaseService...');
        // Importiere DatabaseService zur Laufzeit um zirkuläre Abhängigkeiten zu vermeiden
        const { DatabaseService } = await import('./database.js');
        console.log('✅ DatabaseService imported successfully');
        
        console.log('🔍 Querying database for admin user...');
        console.log('   SQL Query will be: SELECT * FROM admins WHERE username = ?');
        console.log('   Parameter:', username);
        
        // Admin-Benutzer aus Datenbank laden
        const admin = await DatabaseService.getAdminByUsername(username);
        console.log('📊 Database query result:', admin ? 'USER FOUND' : 'USER NOT FOUND');
        
        if (admin) {
            console.log('👤 Admin user details:');
            console.log('   ID:', admin.id);
            console.log('   Username:', admin.username);
            console.log('   Email:', admin.email);
            console.log('   Role:', admin.role);
            console.log('   Active:', admin.active);
            console.log('   Login attempts:', admin.login_attempts);
            console.log('   Locked until:', admin.locked_until);
            console.log('   Password hash:', admin.password_hash ? `[${admin.password_hash.length} chars]` : '[NONE]');
            console.log('   Full password hash (DEBUG):', admin.password_hash);
        }
        
        if (!admin) {
            console.log('❌ Admin user not found in database:', username);
            console.log('💡 Available usernames check needed via SQL: SELECT username FROM admins');
            return null;
        }
        
        // Prüfe ob Account gesperrt ist
        if (!admin.active) {
            console.log('❌ Admin account is disabled:', username);
            console.log('   Account active status:', admin.active);
            return null;
        }
        
        // Prüfe ob Account temporär gesperrt ist
        if (admin.locked_until && new Date() < new Date(admin.locked_until)) {
            console.log('❌ Admin account is temporarily locked:', username);
            console.log('   Current time:', new Date().toISOString());
            console.log('   Locked until:', admin.locked_until);
            return null;
        }
        
        console.log('🔐 Starting password comparison...');
        console.log('   Input password:', password);
        console.log('   Stored hash:', admin.password_hash);
        console.log('   bcrypt.compare parameters ready');
        
        // Passwort mit Hash vergleichen
        const isValidPassword = await bcrypt.compare(password, admin.password_hash);
        console.log('🔐 Password comparison result:', isValidPassword ? 'MATCH' : 'NO MATCH');
        
        if (isValidPassword) {
            console.log('✅ PASSWORD VALIDATED SUCCESSFULLY');
            
            // Login-Attempts zurücksetzen bei erfolgreichem Login
            console.log('📝 Updating login success in database...');
            await DatabaseService.updateAdminLoginSuccess(admin.id);
            console.log('✅ Database updated with successful login');
            
            const returnUser = {
                id: admin.id,
                username: admin.username,
                role: admin.role,
                email: admin.email,
                full_name: admin.full_name
            };
            
            console.log('👤 Returning user object:', returnUser);
            console.log('✅ Admin login successful:', username);
            console.log('=== ADMIN LOGIN DEBUG SUCCESS ===');
            return returnUser;
        } else {
            console.log('❌ PASSWORD VALIDATION FAILED');
            
            // Fehlgeschlagene Login-Versuche erhöhen
            console.log('📝 Updating login failure in database...');
            await DatabaseService.updateAdminLoginFailure(admin.id);
            console.log('✅ Database updated with failed login attempt');
            
            console.log('❌ Invalid password for admin:', username);
            console.log('=== ADMIN LOGIN DEBUG FAILED ===');
            return null;
        }
    } catch (error) {
        console.error('💥 ERROR during admin login validation:');
        console.error('   Error message:', error.message);
        console.error('   Error stack:', error.stack);
        console.error('   Error code:', error.code);
        console.error('   Error name:', error.name);
        console.log('=== ADMIN LOGIN DEBUG ERROR ===');
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