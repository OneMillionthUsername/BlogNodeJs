// Plesk-Konfigurationsdatei für Node.js Apps
// Diese Datei kann als Referenz für Plesk-Einstellungen verwendet werden

module.exports = {
    // Node.js Anwendungseinstellungen
    application: {
        nodeVersion: '24.x', // Node.js 24 für speculumx.at
        applicationRoot: '/',
        documentRoot: '/httpdocs',
        startupFile: 'server/app.js',
        applicationMode: 'production'
    },
    
    // Environment Variables für Plesk Control Panel
    environmentVariables: {
        NODE_ENV: 'production',
        PLESK_ENV: 'true',
        PORT: '8080',
        HTTPS_PORT: '8443',
        HOST: '0.0.0.0'
        // DOMAIN, JWT_SECRET, ADMIN_PASSWORD_HASH werden in .env gesetzt
    },
    
    // Empfohlene Nginx-Konfiguration (falls Custom Nginx Rules nötig)
    nginx: {
        rules: [
            // Cache für statische Assets
            {
                location: '~ ^/(assets|uploads)/',
                directives: [
                    'expires 1y;',
                    'access_log off;',
                    'add_header Cache-Control "public, immutable";'
                ]
            },
            // Sicherheitsheader für Admin-Bereich
            {
                location: '/pages/create.html',
                directives: [
                    'add_header X-Frame-Options "DENY";',
                    'add_header X-Content-Type-Options "nosniff";'
                ]
            }
        ]
    },
    
    // PHP-Einstellungen (falls benötigt)
    php: {
        // Blog läuft mit Node.js, kein PHP erforderlich
        disabled: true
    },
    
    // Empfohlene Plesk-Einstellungen
    plesk: {
        ssl: {
            letsEncrypt: true,
            redirectHttp: true,
            hstsEnabled: true
        },
        security: {
            modsecEnabled: true,
            failBanEnabled: true
        },
        performance: {
            compressionEnabled: true,
            cacheEnabled: true
        }
    }
};
