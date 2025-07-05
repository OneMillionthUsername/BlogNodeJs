// SSL-Zertifikate für Development generieren
// Dieses Script erstellt self-signed certificates für localhost

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

console.log('🔐 Generiere SSL-Zertifikate für HTTPS-Development...');

try {
    // Erstelle OpenSSL-Konfigurationsdatei
    const opensslConfig = `
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C=DE
ST=NRW
L=Dortmund
O=Blog Development
OU=IT Department
CN=localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
DNS.2 = 127.0.0.1
IP.1 = 127.0.0.1
IP.2 = ::1
`;

    writeFileSync('./openssl.cnf', opensslConfig);
    console.log('✅ OpenSSL-Konfiguration erstellt');

    // Generiere private key
    execSync('openssl genrsa -out private-key.pem 2048', { stdio: 'inherit' });
    console.log('✅ Privater Schlüssel erstellt');

    // Generiere self-signed certificate
    execSync('openssl req -new -x509 -key private-key.pem -out certificate.pem -days 365 -config openssl.cnf', { stdio: 'inherit' });
    console.log('✅ SSL-Zertifikat erstellt');

    // Aufräumen
    unlinkSync('./openssl.cnf');
    
    // Verify certificates
    console.log('\n📋 Zertifikat-Informationen:');
    try {
        execSync('openssl x509 -in certificate.pem -text -noout | findstr "Subject:"', { stdio: 'inherit' });
    } catch (e) {
        console.log('ℹ️ Zertifikat-Details können nicht angezeigt werden (Windows-spezifisch)');
    }
    
    console.log('\n🎉 SSL-Zertifikate erfolgreich erstellt!');
    console.log('📁 Dateien:');
    console.log('   - private-key.pem (Privater Schlüssel)');
    console.log('   - certificate.pem (Öffentliches Zertifikat)');
    
} catch (error) {
    console.error('❌ Fehler beim Erstellen der Zertifikate:', error.message);
    process.exit(1);
}
