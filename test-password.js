// Test-Skript für bcrypt Passwort-Verifikation
const bcrypt = require('bcrypt');

async function testPassword() {
    const password = 'admin123';
    const storedHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    
    console.log('Teste Passwort:', password);
    console.log('Gespeicherter Hash:', storedHash);
    
    try {
        const isValid = await bcrypt.compare(password, storedHash);
        console.log('Passwort ist gültig:', isValid);
        
        if (!isValid) {
            console.log('Generiere neuen Hash für admin123:');
            const newHash = await bcrypt.hash(password, 10);
            console.log('Neuer Hash:', newHash);
        }
    } catch (error) {
        console.error('Fehler:', error);
    }
}

testPassword();
