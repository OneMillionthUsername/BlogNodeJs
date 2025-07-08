// Hash-Generator für Production Admin-Passwort
import bcrypt from 'bcrypt';

async function generateHash() {
    // WICHTIG: Ändern Sie dieses Passwort für Production!
    const password = process.argv[2] || 'admin123';
    const saltRounds = 12; // Höhere Sicherheit für Production
    
    console.log('🔐 Generiere Hash für Admin-Passwort...');
    console.log(`📝 Passwort: ${password}`);
    
    if (password === 'admin123') {
        console.log('⚠️  WARNUNG: Verwenden Sie ein sicheres Passwort für Production!');
        console.log('   Beispiel: node generate-hash.js "MeinSicheresPasswort123!"');
    }
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('\n✅ Generierter Hash:');
        console.log(hash);
        
        console.log('\n📋 Kopieren Sie diesen Hash in Ihre .env Datei:');
        console.log(`ADMIN_PASSWORD_HASH=${hash}`);
        
        // Test der Verifikation
        const isValid = await bcrypt.compare(password, hash);
        console.log('\n🔍 Verifikation erfolgreich:', isValid ? '✅' : '❌');
        
        if (isValid) {
            console.log('\n🚀 Der Hash ist bereit für Production!');
        }
        
    } catch (error) {
        console.error('❌ Fehler:', error);
    }
}

generateHash();
