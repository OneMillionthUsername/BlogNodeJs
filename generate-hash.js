// Hash-Generator für admin123
import bcrypt from 'bcrypt';

async function generateHash() {
    const password = 'admin123';
    const saltRounds = 10;
    
    try {
        const hash = await bcrypt.hash(password, saltRounds);
        console.log('✅ Neuer Hash für "admin123":');
        console.log(hash);
        
        // Test der Verifikation
        const isValid = await bcrypt.compare(password, hash);
        console.log('✅ Verifikation erfolgreich:', isValid);
        
    } catch (error) {
        console.error('❌ Fehler:', error);
    }
}

generateHash();
