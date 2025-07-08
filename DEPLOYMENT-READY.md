# speculumx.at - Blog Deployment Anleitung

## 🚀 **Deployment-Status: READY FOR PLESK**

### ✅ **Konfiguriert für:**
- **Domain**: speculumx.at
- **Node.js**: 24.3.0
- **Admin-Username**: admin
- **Admin-Passwort**: ✅ Hash generiert
- **Platform**: Plesk bei easyname.at

---

## 📦 **Schnell-Deployment**

### 1. **Dateien nach Plesk hochladen**
```bash
# Alle Projektdateien in /httpdocs/ hochladen
# Ausgenommen: .git/, node_modules/, ssl/
```

### 2. **Deployment ausführen**
```bash
# Im Plesk Terminal:
chmod +x deploy.sh
./deploy.sh
```

### 3. **Plesk Node.js konfigurieren**
- **Node.js Version**: 24.x
- **Document Root**: `/httpdocs`
- **Application Startup File**: `server/app.js`
- **Application Mode**: `production`

### 4. **Environment Variables in Plesk**
```
NODE_ENV=production
PLESK_ENV=true
PORT=8080
HOST=0.0.0.0
DOMAIN=speculumx.at
JWT_SECRET=SpeculumX2025_SecureJWT_Token_Secret_Key_Change_This_In_Production
ADMIN_PASSWORD_HASH=$2b$12$XGlbmOuZJbh/rg8cHPNKBebjMXSvgoLDs1Bi2nsk58C8UMgNcarrq
```

### 5. **SSL/TLS aktivieren**
- Plesk: **Domain** → **SSL/TLS Certificates** → **Let's Encrypt**
- ✅ **Secure www and non-www domains**
- ✅ **Redirect from HTTP to HTTPS**

---

## 🌐 **Nach dem Deployment erreichbar:**

### **Hauptseite:**
- https://speculumx.at

### **Admin-Bereich:**
- https://speculumx.at/pages/create.html
- **Username**: `admin`
- **Password**: `mwUAbR7NS]F3.AK`

---

## 🔧 **Troubleshooting**

### **App startet nicht:**
```bash
# Logs prüfen
tail -f /var/www/vhosts/speculumx.at/logs/nodejs_*

# Dependencies installieren
npm install --production

# Environment Variables prüfen
echo $NODE_ENV
```

### **Admin-Login funktioniert nicht:**
1. Password-Hash prüfen: `node generate-hash.js "mwUAbR7NS]F3.AK"`
2. Browser-Cookies aktiviert?
3. HTTPS aktiv?

### **Upload-Probleme:**
```bash
# Berechtigungen setzen
chmod 777 assets/uploads
```

---

## 📋 **Deployment-Checkliste:**

- [ ] ✅ Dateien in `/httpdocs/` hochgeladen
- [ ] ✅ Node.js 24.x in Plesk aktiviert
- [ ] ✅ Environment Variables gesetzt
- [ ] ✅ Admin-Hash konfiguriert
- [ ] ⏳ SSL-Certificate einrichten
- [ ] ⏳ `deploy.sh` ausführen
- [ ] ⏳ App testen

---

**Ihr Blog ist bereit für speculumx.at! 🎉**
