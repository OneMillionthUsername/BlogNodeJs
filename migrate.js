#!/usr/bin/env node
/**
 * Migrations-Script für Blog-Datenbank
 * Führt die Migration von JSON-Dateien zur MariaDB durch
 */

import { 
    testConnection, 
    initializeDatabase, 
    migrateExistingData 
} from './server/database.js';

console.log('🔄 Blog-Datenbank Migration gestartet...\n');

async function runMigration() {
    try {
        // 1. Datenbankverbindung testen
        console.log('1️⃣ Teste Datenbankverbindung...');
        const connected = await testConnection();
        if (!connected) {
            console.error('❌ Migration abgebrochen: Keine Datenbankverbindung');
            process.exit(1);
        }
        console.log('✅ Datenbankverbindung erfolgreich\n');

        // 2. Schema erstellen/prüfen
        console.log('2️⃣ Erstelle/Prüfe Datenbank-Schema...');
        const schemaOk = await initializeDatabase();
        if (!schemaOk) {
            console.error('❌ Migration abgebrochen: Schema-Erstellung fehlgeschlagen');
            process.exit(1);
        }
        console.log('✅ Datenbank-Schema bereit\n');

        // 3. Bestehende Daten migrieren
        console.log('3️⃣ Migriere bestehende JSON-Daten...');
        const migrationOk = await migrateExistingData();
        if (!migrationOk) {
            console.error('❌ Migration teilweise fehlgeschlagen');
            process.exit(1);
        }
        console.log('✅ Datenmigration abgeschlossen\n');

        console.log('🎉 Migration erfolgreich abgeschlossen!');
        console.log('\n📋 Nächste Schritte:');
        console.log('   1. Setzen Sie ENABLE_DB_MIGRATION=false in der .env');
        console.log('   2. Starten Sie den Server mit: npm start');
        console.log('   3. Testen Sie alle Funktionen');
        console.log('   4. Optional: Backup der JSON-Dateien erstellen und löschen');
        
    } catch (error) {
        console.error('❌ Unerwarteter Fehler bei der Migration:', error);
        process.exit(1);
    }
}

// Migration ausführen
runMigration();
