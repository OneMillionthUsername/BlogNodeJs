import mariadb from 'mariadb';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Environment-Variablen laden
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Environment-Variablen-Validierung
console.log('Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '[SET]' : '[NOT SET]');
console.log('ENABLE_DB_MIGRATION:', process.env.ENABLE_DB_MIGRATION);

// MariaDB Connection Pool konfigurieren
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10,
    acquireTimeout: 30000,
    timeout: 30000,
    reconnect: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
};

// Validierung der kritischen Variablen
const requiredDbVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingDbVars = requiredDbVars.filter(varName => !process.env[varName]);

if (missingDbVars.length > 0) {
    console.error('Missing required database environment variables:', missingDbVars);
    console.error('Create .env file with these variables before starting the server');
    throw new Error('Database configuration incomplete');
}

console.log('MariaDB Configuration loaded:');
console.log('Host:', dbConfig.host);
console.log('Port:', dbConfig.port);
console.log('User:', dbConfig.user);
console.log('Database:', dbConfig.database);

// Connection Pool erstellen
const pool = mariadb.createPool(dbConfig);

// Datenbankverbindung testen
export async function testConnection() {
    let conn;
    try {
        conn = await pool.getConnection();
        const result = await conn.query('SELECT VERSION() as version');
        console.log('MariaDB connection successful, Version:', result[0].version);
        return true;
    } catch (error) {
        console.error('MariaDB connection failed:', error.message);
        return false;
    } finally {
        if (conn) conn.release();
    }
}

// Datenbank-Schema erstellen
export async function initializeDatabase() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Initializing MariaDB schema...');

        // Posts-Tabelle
        await conn.query(`
            CREATE TABLE IF NOT EXISTS posts (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                title VARCHAR(500) NOT NULL,
                content LONGTEXT NOT NULL,
                tags JSON DEFAULT NULL,
                author VARCHAR(100) DEFAULT 'admin',
                views BIGINT DEFAULT 0,
                published BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_posts_created_at (created_at DESC),
                INDEX idx_posts_views (views DESC),
                INDEX idx_posts_author (author),
                INDEX idx_posts_published (published),
                INDEX idx_posts_filename (filename)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Comments-Tabelle
        await conn.query(`
            CREATE TABLE IF NOT EXISTS comments (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                post_filename VARCHAR(255) NOT NULL,
                comment_id VARCHAR(50) UNIQUE NOT NULL,
                username VARCHAR(100) NOT NULL DEFAULT 'Anonym',
                text TEXT NOT NULL,
                ip_address VARCHAR(45) DEFAULT NULL,
                approved BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_comments_post_filename (post_filename),
                INDEX idx_comments_created_at (created_at DESC),
                INDEX idx_comments_approved (approved),
                INDEX idx_comments_comment_id (comment_id),
                
                FOREIGN KEY (post_filename) REFERENCES posts(filename) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Uploads/Media-Tabelle
        await conn.query(`
            CREATE TABLE IF NOT EXISTS media (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) UNIQUE NOT NULL,
                original_name VARCHAR(255) NOT NULL,
                file_size BIGINT DEFAULT NULL,
                mime_type VARCHAR(100) DEFAULT NULL,
                uploaded_by VARCHAR(100) DEFAULT NULL,
                upload_path VARCHAR(500) DEFAULT NULL,
                alt_text VARCHAR(255) DEFAULT NULL,
                used_in_posts JSON DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_media_uploaded_by (uploaded_by),
                INDEX idx_media_created_at (created_at DESC),
                INDEX idx_media_mime_type (mime_type),
                INDEX idx_media_filename (filename)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Analytics/Views-Tabelle
        await conn.query(`
            CREATE TABLE IF NOT EXISTS post_analytics (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                post_filename VARCHAR(255) NOT NULL,
                event_type ENUM('view', 'comment', 'share', 'download') DEFAULT 'view',
                ip_address VARCHAR(45) DEFAULT NULL,
                user_agent TEXT DEFAULT NULL,
                referer VARCHAR(500) DEFAULT NULL,
                country VARCHAR(50) DEFAULT NULL,
                city VARCHAR(100) DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                
                INDEX idx_analytics_post_filename (post_filename),
                INDEX idx_analytics_event_type (event_type),
                INDEX idx_analytics_created_at (created_at DESC),
                INDEX idx_analytics_ip (ip_address),
                
                FOREIGN KEY (post_filename) REFERENCES posts(filename) 
                    ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Admin-Benutzer Tabelle (für zukünftige Multi-Admin-Unterstützung)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS admins (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                email VARCHAR(255) DEFAULT NULL,
                full_name VARCHAR(255) DEFAULT NULL,
                role ENUM('admin', 'editor', 'viewer') DEFAULT 'admin',
                active BOOLEAN DEFAULT 1,
                last_login DATETIME DEFAULT NULL,
                login_attempts INT DEFAULT 0,
                locked_until DATETIME DEFAULT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                
                INDEX idx_admins_username (username),
                INDEX idx_admins_active (active),
                INDEX idx_admins_role (role),
                INDEX idx_admins_last_login (last_login)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        // Backup-Tabelle für gelöschte Posts (Wiederherstellung)
        await conn.query(`
            CREATE TABLE IF NOT EXISTS deleted_posts (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                original_id BIGINT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                title VARCHAR(500) NOT NULL,
                content LONGTEXT NOT NULL,
                tags JSON DEFAULT NULL,
                author VARCHAR(100) DEFAULT NULL,
                views BIGINT DEFAULT 0,
                original_created_at DATETIME NOT NULL,
                deleted_by VARCHAR(100) NOT NULL,
                deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                reason TEXT DEFAULT NULL,
                
                INDEX idx_deleted_posts_filename (filename),
                INDEX idx_deleted_posts_deleted_at (deleted_at DESC),
                INDEX idx_deleted_posts_author (author),
                INDEX idx_deleted_posts_deleted_by (deleted_by)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);

        console.log('MariaDB schema created/verified successfully');
        return true;
    } catch (error) {
        console.error('Error creating MariaDB schema:', error);
        return false;
    } finally {
        if (conn) conn.release();
    }
}

// Migration der bestehenden JSON-Dateien zur MariaDB
export async function migrateExistingData() {
    let conn;
    try {
        const { readdir, readFile, stat } = await import('fs/promises');
        
        conn = await pool.getConnection();
        console.log('Starting migration of existing data to MariaDB...');

        // Posts migrieren
        const postsDir = join(__dirname, '..', 'posts');
        try {
            const files = await readdir(postsDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));
            
            console.log(`Migrating ${jsonFiles.length} posts to MariaDB...`);
            
            let migratedPosts = 0;
            let skippedPosts = 0;
            
            for (const file of jsonFiles) {
                try {
                    // Prüfen ob Post bereits existiert
                    const existing = await conn.query(
                        'SELECT id FROM posts WHERE filename = ?',
                        [file]
                    );
                    
                    if (existing.length === 0) {
                        const filePath = join(postsDir, file);
                        const data = await readFile(filePath, 'utf8');
                        const post = JSON.parse(data);
                        
                        // Post zur Datenbank hinzufügen
                        await conn.query(`
                            INSERT INTO posts (filename, title, content, tags, author, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        `, [
                            file,
                            post.title,
                            post.content,
                            JSON.stringify(post.tags || []),
                            post.author || 'admin',
                            post.date || new Date().toISOString(),
                            post.date || new Date().toISOString()
                        ]);
                        
                        migratedPosts++;
                        console.log(`Post migrated: ${file}`);
                    } else {
                        skippedPosts++;
                        console.log(`Post already exists: ${file}`);
                    }
                } catch (error) {
                    console.error(`Error migrating ${file}:`, error.message);
                }
            }
            
            console.log(`Posts migration completed: ${migratedPosts} migrated, ${skippedPosts} skipped`);
            
        } catch (error) {
            console.log('No posts found to migrate');
        }

        // Kommentare migrieren
        const commentsDir = join(__dirname, '..', 'comments');
        try {
            const commentFiles = await readdir(commentsDir);
            const commentJsonFiles = commentFiles.filter(file => file.endsWith('_comments.json'));
            
            console.log(`Migrating comments from ${commentJsonFiles.length} files...`);
            
            let migratedComments = 0;
            let skippedComments = 0;
            
            for (const file of commentJsonFiles) {
                try {
                    const filePath = join(commentsDir, file);
                    const data = await readFile(filePath, 'utf8');
                    const comments = JSON.parse(data);
                    const postFilename = file.replace('_comments.json', '.json');
                    
                    for (const comment of comments) {
                        // Prüfen ob Kommentar bereits existiert
                        const existing = await conn.query(
                            'SELECT id FROM comments WHERE comment_id = ?',
                            [comment.id]
                        );
                        
                        if (existing.length === 0) {
                            await conn.query(`
                                INSERT INTO comments (post_filename, comment_id, username, text, ip_address, created_at)
                                VALUES (?, ?, ?, ?, ?, ?)
                            `, [
                                postFilename,
                                comment.id,
                                comment.username || 'Anonym',
                                comment.text,
                                comment.ip || null,
                                comment.date || comment.timestamp || new Date().toISOString()
                            ]);
                            migratedComments++;
                        } else {
                            skippedComments++;
                        }
                    }
                    console.log(`Comments migrated: ${file}`);
                } catch (error) {
                    console.error(`Error migrating ${file}:`, error.message);
                }
            }
            
            console.log(`Comments migration completed: ${migratedComments} migrated, ${skippedComments} skipped`);
            
        } catch (error) {
            console.log('No comments found to migrate');
        }

        // Views-Daten migrieren (aus dem postViews-Objekt, falls verfügbar)
        console.log('Initializing analytics data...');
        
        console.log('Data migration to MariaDB completed');
        return true;
    } catch (error) {
        console.error('Error during MariaDB migration:', error);
        return false;
    } finally {
        if (conn) conn.release();
    }
}

// Database Service Functions
export const DatabaseService = {
    // Posts
    async createPost(postData) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { title, content, tags, author } = postData;
            
            // Filename generieren
            const sanitizedTitle = title
                .toLowerCase()
                .replace(/[^\w\s-äöüß]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-+|-+$/g, '');
                
            const date = new Date().toISOString();
            const filename = `${date.split('T')[0]}-${sanitizedTitle}.json`;
            
            const result = await conn.query(`
                INSERT INTO posts (filename, title, content, tags, author, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                filename,
                title,
                content,
                JSON.stringify(tags || []),
                author,
                date,
                date
            ]);
            
            return {
                success: true,
                filename,
                postId: result.insertId
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Ein Post mit diesem Titel existiert bereits');
            }
            throw error;
        } finally {
            if (conn) conn.release();
        }
    },

    async getPost(filename) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query('SELECT * FROM posts WHERE filename = ?', [filename]);
            
            if (result.length === 0) return null;
            
            const post = result[0];
            // Tags von JSON String zu Array konvertieren
            if (post.tags) {
                post.tags = JSON.parse(post.tags);
            }
            
            return post;
        } finally {
            if (conn) conn.release();
        }
    },

    async getAllPosts() {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(`
                SELECT filename, title, tags, author, created_at, views, published
                FROM posts 
                WHERE published = 1 
                ORDER BY created_at DESC
            `);
            
            return result.map(post => ({
                ...post,
                tags: post.tags ? JSON.parse(post.tags) : []
            }));
        } finally {
            if (conn) conn.release();
        }
    },

    async getMostReadPosts(limit = 10) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(`
                SELECT filename, title, tags, author, created_at, views
                FROM posts 
                WHERE published = 1 
                ORDER BY views DESC
                LIMIT ?
            `, [limit]);
            
            return result.map(post => ({
                ...post,
                tags: post.tags ? JSON.parse(post.tags) : []
            }));
        } finally {
            if (conn) conn.release();
        }
    },

    async deletePost(filename, deletedBy = 'admin') {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Post-Daten für Backup holen
            const postResult = await conn.query('SELECT * FROM posts WHERE filename = ?', [filename]);
            if (postResult.length === 0) return false;
            
            const post = postResult[0];
            
            // Backup in deleted_posts erstellen
            await conn.query(`
                INSERT INTO deleted_posts (original_id, filename, title, content, tags, author, views, original_created_at, deleted_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                post.id,
                post.filename,
                post.title,
                post.content,
                post.tags,
                post.author,
                post.views,
                post.created_at,
                deletedBy
            ]);
            
            // Post löschen (CASCADE löscht automatisch Kommentare und Analytics)
            const deleteResult = await conn.query('DELETE FROM posts WHERE filename = ?', [filename]);
            
            return deleteResult.affectedRows > 0;
        } finally {
            if (conn) conn.release();
        }
    },

    async incrementViews(filename, ipAddress, userAgent, referer) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Analytics-Eintrag erstellen
            await conn.query(`
                INSERT INTO post_analytics (post_filename, event_type, ip_address, user_agent, referer)
                VALUES (?, 'view', ?, ?, ?)
            `, [filename, ipAddress, userAgent, referer]);
            
            // View-Counter in Posts-Tabelle incrementieren
            await conn.query('UPDATE posts SET views = views + 1 WHERE filename = ?', [filename]);
        } finally {
            if (conn) conn.release();
        }
    },

    // Comments
    async addComment(postFilename, commentData) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { username, text, ipAddress } = commentData;
            
            // XSS-Schutz
            const sanitizedText = text
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#x27;')
                .replace(/\//g, '&#x2F;');
                
            const sanitizedUsername = (username || 'Anonym')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
            
            const commentId = Date.now().toString();
            
            const result = await conn.query(`
                INSERT INTO comments (post_filename, comment_id, username, text, ip_address)
                VALUES (?, ?, ?, ?, ?)
            `, [
                postFilename,
                commentId,
                sanitizedUsername,
                sanitizedText,
                ipAddress
            ]);
            
            // Analytics-Eintrag für Kommentar
            await conn.query(`
                INSERT INTO post_analytics (post_filename, event_type, ip_address)
                VALUES (?, 'comment', ?)
            `, [postFilename, ipAddress]);
            
            return {
                success: true,
                commentId: result.insertId,
                comment: {
                    id: commentId,
                    username: sanitizedUsername,
                    text: sanitizedText,
                    created_at: new Date().toISOString()
                }
            };
        } finally {
            if (conn) conn.release();
        }
    },

    async getCommentsByPost(postFilename) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(`
                SELECT comment_id as id, username, text, created_at
                FROM comments 
                WHERE post_filename = ? AND approved = 1
                ORDER BY created_at ASC
            `, [postFilename]);
            
            return result;
        } finally {
            if (conn) conn.release();
        }
    },

    async deleteComment(commentId, postFilename) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'DELETE FROM comments WHERE comment_id = ? AND post_filename = ?',
                [commentId, postFilename]
            );
            
            return result.affectedRows > 0;
        } finally {
            if (conn) conn.release();
        }
    },

    // Media
    async addMedia(mediaData) {
        let conn;
        try {
            conn = await pool.getConnection();
            const { filename, original_name, file_size, mime_type, uploaded_by, upload_path, alt_text } = mediaData;
            
            const result = await conn.query(`
                INSERT INTO media (filename, original_name, file_size, mime_type, uploaded_by, upload_path, alt_text)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [filename, original_name, file_size, mime_type, uploaded_by, upload_path, alt_text]);
            
            return {
                success: true,
                mediaId: result.insertId
            };
        } finally {
            if (conn) conn.release();
        }
    },

    async deleteMedia(filename) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query('DELETE FROM media WHERE filename = ?', [filename]);
            return result.affectedRows > 0;
        } finally {
            if (conn) conn.release();
        }
    },

    // Admin-Benutzer-Verwaltung
    async getAdminByUsername(username) {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'SELECT * FROM admins WHERE username = ? LIMIT 1',
                [username]
            );
            return result.length > 0 ? result[0] : null;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAdminLoginSuccess(adminId) {
        let conn;
        try {
            conn = await pool.getConnection();
            await conn.query(
                'UPDATE admins SET last_login = NOW(), login_attempts = 0, locked_until = NULL WHERE id = ?',
                [adminId]
            );
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAdminLoginFailure(adminId) {
        let conn;
        try {
            conn = await pool.getConnection();
            
            // Aktuelle Login-Attempts abrufen
            const result = await conn.query(
                'SELECT login_attempts FROM admins WHERE id = ?',
                [adminId]
            );
            
            if (result.length > 0) {
                const currentAttempts = result[0].login_attempts + 1;
                let locked_until = null;
                
                // Account nach 5 fehlgeschlagenen Versuchen für 30 Minuten sperren
                if (currentAttempts >= 5) {
                    locked_until = new Date(Date.now() + 30 * 60 * 1000); // 30 Minuten
                }
                
                await conn.query(
                    'UPDATE admins SET login_attempts = ?, locked_until = ? WHERE id = ?',
                    [currentAttempts, locked_until, adminId]
                );
            }
        } finally {
            if (conn) conn.release();
        }
    },

    async createAdmin(username, password_hash, email = null, full_name = null, role = 'admin') {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'INSERT INTO admins (username, password_hash, email, full_name, role) VALUES (?, ?, ?, ?, ?)',
                [username, password_hash, email, full_name, role]
            );
            return result.insertId;
        } finally {
            if (conn) conn.release();
        }
    },

    async getAllAdmins() {
        let conn;
        try {
            conn = await pool.getConnection();
            const result = await conn.query(
                'SELECT id, username, email, full_name, role, active, last_login, login_attempts, locked_until, created_at FROM admins ORDER BY created_at DESC'
            );
            return result;
        } finally {
            if (conn) conn.release();
        }
    },

    async updateAdminStatus(adminId, active) {
        let conn;
        try {
            conn = await pool.getConnection();
            await conn.query(
                'UPDATE admins SET active = ? WHERE id = ?',
                [active, adminId]
            );
        } finally {
            if (conn) conn.release();
        }
    }
};

// Graceful Shutdown
process.on('SIGINT', async () => {
    console.log('Closing MariaDB connections...');
    await pool.end();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Closing MariaDB connections...');
    await pool.end();
    process.exit(0);
});

export { pool };
export default pool;
