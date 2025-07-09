# 🔐 SSL/TLS Development Certificates

## ⚠️ **SICHERHEITSHINWEIS**

**NIEMALS** SSL-Zertifikate oder private Keys in Git committen!

### 🚨 **Sensible Dateien (NICHT committen):**
- `*.pem` - Private Keys & Zertifikate
- `*.key` - Private Schlüssel  
- `*.crt` - Zertifikate
- `openssl.cnf` - Konfigurationsdateien mit Metadaten

### ✅ **Sichere Dateien (committen OK):**
- `generate-certs.js` - Generator-Script (nur Code)
- `README.md` - Diese Dokumentation

## 🛠️ **Development Setup**

1. **SSL-Zertifikate generieren:**
   ```bash
   cd ssl/
   node generate-certs.js
   ```

2. **Generierte Dateien (automatisch in .gitignore):**
   - `private-key.pem` - Privater Schlüssel (GEHEIM!)
   - `certificate.pem` - Self-signed Zertifikat

3. **HTTPS-Server startet automatisch** (wenn Zertifikate vorhanden)

## 🏭 **Production (Plesk)**

**Keine eigenen SSL-Zertifikate nötig!**
- Plesk übernimmt SSL-Management
- Let's Encrypt automatisch aktiviert
- Professionelle Zertifikate vom CA

## 🔒 **Sicherheits-Best-Practices**

1. **Development:**
   - Self-signed Zertifikate nur lokal
   - Regelmäßig regenerieren (jährlich)
   - Niemals außerhalb des Projekts verwenden

2. **Production:**
   - Nur vertrauenswürdige CAs (Let's Encrypt, etc.)
   - Automatische Renewal aktivieren
   - SSL-Labs Test regelmäßig durchführen

## ⚡ **Troubleshooting**

### Browser-Warnung "Nicht sicher"
```
Normal bei self-signed Zertifikaten!
Chrome: "Erweitert" → "Weiter zu localhost"
Firefox: "Erweitert" → "Ausnahme hinzufügen"
```

### OpenSSL nicht gefunden
```bash
# Windows (über Chocolatey)
choco install openssl

# Oder OpenSSL für Windows downloaden
# https://slproweb.com/products/Win32OpenSSL.html
```

---
**⚠️ WICHTIG:** Diese Zertifikate sind nur für Development!  
**🏭 Production:** Plesk/Let's Encrypt verwenden!
