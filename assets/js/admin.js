// Admin-System für den Blog
// Alle admin-bezogenen Funktionen sind hier zentralisiert

// Admin-Status Variable (muss vor allen Funktionen stehen)
let isAdminLoggedIn = false;

// Admin Login prüfen (einfaches System mit localStorage)
function checkAdminStatus() {
    const adminToken = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    const adminExpiry = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_EXPIRY);
    
    if (adminToken === 'admin_logged_in' && adminExpiry) {
        const expiryTime = parseInt(adminExpiry);
        if (Date.now() < expiryTime) {
            isAdminLoggedIn = true;
            return true;
        } else {
            // Token abgelaufen
            clearAdminToken();
        }
    }
    isAdminLoggedIn = false;
    return false;
}

// Admin Login (vereinheitlicht für alle Seiten)
async function adminLogin(reloadPage = true) {
    const password = prompt('Admin-Passwort eingeben:');
    
    // Hash des Passworts zur Sicherheit (SHA-256)
    // Standard-Passwort: "admin123" -> Hash: "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9"
    // Ändern Sie diesen Hash für Ihr eigenes Passwort!
    const expectedHash = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.PASSWORD_HASH) || 
                        ADMIN_CONFIG.DEFAULT_PASSWORD_HASH;
    
    if (password && await hashPassword(password) === expectedHash) {
        setAdminToken();
        updateNavigationVisibility();
        
        if (reloadPage) {
            reloadPageWithDelay(); // Verzögerter Reload für bessere UX
        }
        return true;
    } else {
        alert(ADMIN_MESSAGES.login.failed);
        return false;
    }
}

// Admin Logout
function adminLogout() {
    clearAdminToken();
    updateNavigationVisibility();
    reloadPageWithDelay(); // Verzögerter Reload für bessere UX
}

// Post löschen
async function deletePost(filename) {
    if (!isAdminLoggedIn) {
        alert(ADMIN_MESSAGES.login.required);
        return false;
    }
    
    if (!confirm(ADMIN_MESSAGES.posts.deleteConfirm)) {
        return false;
    }
    
    const result = await makeApiRequest(`/blogpost/${filename}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        alert(ADMIN_MESSAGES.posts.deleteSuccess);
        // Je nach aktueller Seite entsprechende Funktion aufrufen
        refreshCurrentPage();
        return true;
    } else {
        const errorMsg = result.error || (result.data && result.data.error) || 'Unbekannter Fehler';
        if (result.status === 0) {
            alert(ADMIN_MESSAGES.posts.networkError);
        } else {
            alert(ADMIN_MESSAGES.posts.deleteError + errorMsg);
        }
        return false;
    }
}

// Funktion zum Aktualisieren der Navigation basierend auf Admin-Status
function updateNavigationVisibility() {
    // Hauptnavigation auf index.html
    const createNavItem = document.getElementById('create-nav-item');
    if (createNavItem) {
        createNavItem.style.display = isAdminLoggedIn ? 'block' : 'none';
    }
    
    // Create-Links auf anderen Seiten
    const createLinks = document.querySelectorAll('#create-link');
    createLinks.forEach(link => {
        link.style.display = isAdminLoggedIn ? 'inline-block' : 'none';
    });
    
    // Navigation auf create.html (Admin-geschützte vs. öffentliche Navigation)
    const publicNavigation = document.getElementById('public-navigation');
    if (publicNavigation) {
        publicNavigation.style.display = isAdminLoggedIn ? 'none' : 'block';
    }
}

// Admin-Toolbar erstellen
function createAdminToolbar() {
    if (!checkAdminStatus()) return;
    
    // Prüfen ob Toolbar bereits existiert
    if (elementExists('admin-toolbar')) return;
    
    const toolbar = createElement('div', {
        id: 'admin-toolbar',
        cssText: ADMIN_STYLES.toolbar
    }, `
        <span>👑 Admin-Modus aktiv</span>
        <button onclick="adminLogout()" style="${ADMIN_STYLES.logoutButton}">
            Logout
        </button>
    `);
    
    document.body.prepend(toolbar);
    
    // Body-Padding anpassen wegen der Toolbar
    document.body.style.paddingTop = ADMIN_CONFIG.TOOLBAR_HEIGHT;
}

// Admin Login Button erstellen
function createAdminLoginButton() {
    if (checkAdminStatus()) return; // Bereits eingeloggt
    
    // Prüfen ob Button bereits existiert
    if (elementExists('admin-login-btn')) return;
    
    const loginBtn = createElement('button', {
        id: 'admin-login-btn',
        cssText: ADMIN_STYLES.loginButton,
        title: 'Admin Login'
    }, '👑');
    
    // Event-Listener hinzufügen
    loginBtn.onclick = () => adminLogin(true);
    addHoverEffects(loginBtn);
    
    document.body.appendChild(loginBtn);
}

// Hover-Effekte für Buttons (wiederverwendbar)
function addHoverEffects(element, scaleUp = 1.1, scaleDown = 1) {
    element.addEventListener('mouseenter', () => {
        element.style.transform = `scale(${scaleUp})`;
    });
    
    element.addEventListener('mouseleave', () => {
        element.style.transform = `scale(${scaleDown})`;
    });
}

// Create Page Admin Protection und Initialisierung
function initializeCreatePage() {
    // Prüfe Admin-Status und zeige entsprechenden Inhalt
    if (checkAdminStatus()) {
        // Admin ist eingeloggt - zeige Create-Formular
        showElement('create-content');
        // Initialisiere TinyMCE Editor (falls die Funktion verfügbar ist)
        if (typeof initializeBlogEditor === 'function') {
            initializeBlogEditor();
        }
    } else {
        // Kein Admin - zeige Warnung
        showElement('admin-required');
    }
    
    // Navigation-Sichtbarkeit aktualisieren
    updateNavigationVisibility();
}

// Admin-Controls für read_post.html hinzufügen
function addReadPostAdminControls() {
    if (!checkAdminStatus()) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const postFilename = urlParams.get('post');
    
    if (postFilename) {
        const adminControls = document.getElementById('admin-controls');
        if (adminControls) {
            adminControls.innerHTML = `
                <button onclick="deletePostAndRedirect('${postFilename}')" class="btn btn-danger" style="${ADMIN_STYLES.deleteButton}">
                    🗑️ Diesen Post löschen
                </button>
            `;
        }
    }
}

// Post löschen und zur Post-Liste weiterleiten (spezifisch für read_post.html)
async function deletePostAndRedirect(filename) {
    const deleted = await deletePost(filename);
    if (deleted) {
        // Nach dem Löschen zur Post-Liste weiterleiten
        window.location.href = 'list_posts.html';
    }
}

// Passwort-Hash-Funktion (SHA-256)
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Passwort-Setup für Admin (erste Verwendung)
async function setupAdminPassword() {
    const currentHash = localStorage.getItem(ADMIN_CONFIG.STORAGE_KEYS.PASSWORD_HASH);
    if (currentHash && currentHash !== ADMIN_CONFIG.DEFAULT_PASSWORD_HASH) {
        // Bereits eigenes Passwort gesetzt
        return;
    }
    
    const answer = confirm(ADMIN_MESSAGES.password.setup);
    
    if (answer) {
        const newPassword = prompt(
            'Neues Admin-Passwort eingeben:\n' +
            '(Mindestens 8 Zeichen, speichern Sie es sicher!)'
        );
        
        if (newPassword && newPassword.length >= 8) {
            const hash = await hashPassword(newPassword);
            localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.PASSWORD_HASH, hash);
            alert(ADMIN_MESSAGES.password.changed);
        } else if (newPassword) {
            alert(ADMIN_MESSAGES.password.tooShort);
            setupAdminPassword(); // Nochmal versuchen
        }
    }
}

// Admin-System initialisieren
async function initializeAdminSystem() {
    checkAdminStatus();
    updateNavigationVisibility();
    
    // Setup-Warnung für Standard-Passwort anzeigen
    await setupAdminPassword();
    
    if (isAdminLoggedIn) {
        createAdminToolbar();
        // Kommentare mit Admin-Funktionen neu laden falls sie bereits angezeigt werden
        if (typeof initializeCommentsSystem === 'function') {
            setTimeout(initializeCommentsSystem, 100);
        }
    } else {
        createAdminLoginButton();
    }
}

// Admin Token-Management (zentralisiert)
function setAdminToken() {
    const expiryTime = Date.now() + (ADMIN_CONFIG.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
    localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_TOKEN, 'admin_logged_in');
    localStorage.setItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_EXPIRY, expiryTime.toString());
    isAdminLoggedIn = true;
}

function clearAdminToken() {
    localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(ADMIN_CONFIG.STORAGE_KEYS.ADMIN_EXPIRY);
    isAdminLoggedIn = false;
}

// UI-Element Sichtbarkeits-Utilities (zentralisiert)
function showElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = 'block';
        return true;
    }
    return false;
}

function hideElement(id) {
    const element = document.getElementById(id);
    if (element) {
        element.style.display = 'none';
        return true;
    }
    return false;
}

function toggleElementVisibility(id, show) {
    return show ? showElement(id) : hideElement(id);
}

// Seiten-Refresh-Utilities (zentralisiert)
function refreshCurrentPage() {
    // Intelligenter Refresh basierend auf verfügbaren Funktionen
    if (typeof loadAndDisplayRecentPosts === 'function') {
        loadAndDisplayRecentPosts();
    } else if (typeof loadAndDisplayArchivePosts === 'function') {
        loadAndDisplayArchivePosts();
    } else if (typeof loadAndDisplayMostReadPosts === 'function') {
        loadAndDisplayMostReadPosts();
    } else {
        location.reload();
    }
}

function reloadPageWithDelay(delay = ADMIN_CONFIG.RELOAD_DELAY) {
    setTimeout(() => location.reload(), delay);
}

// Globale Verfügbarmachung der checkAdminStatus Funktion für comments.js
window.checkAdminStatus = checkAdminStatus;

// Konfiguration und Konstanten
const ADMIN_CONFIG = {
    // Token-Einstellungen
    TOKEN_EXPIRY_HOURS: 24,
    DEFAULT_PASSWORD_HASH: '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', // admin123
    
    // UI-Einstellungen
    TOOLBAR_HEIGHT: '50px',
    RELOAD_DELAY: 100,
    ELEMENT_WAIT_TIMEOUT: 5000,
    
    // localStorage Keys
    STORAGE_KEYS: {
        ADMIN_TOKEN: 'blog_admin_token',
        ADMIN_EXPIRY: 'blog_admin_expiry',
        PASSWORD_HASH: 'blog_admin_password_hash'
    }
};

// CSS-Styles für Admin-UI (zentralisiert)
const ADMIN_STYLES = {
    toolbar: `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: #e74c3c;
        color: white;
        padding: 10px;
        text-align: center;
        z-index: 10000;
        font-family: 'Crimson Text', serif;
        box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    `,
    logoutButton: `
        background: #c0392b;
        color: white;
        border: none;
        padding: 5px 15px;
        border-radius: 15px;
        margin-left: 20px;
        cursor: pointer;
        font-family: 'Crimson Text', serif;
    `,
    loginButton: `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 15px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
        font-size: 1.2rem;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
    `,
    deleteButton: `
        background: #e74c3c;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 500;
        margin-top: 10px;
    `
};

// Benutzer-Nachrichten (zentralisiert)
const ADMIN_MESSAGES = {
    login: {
        success: 'Admin-Login erfolgreich!',
        failed: 'Falsches Passwort!',
        required: 'Sie müssen als Admin eingeloggt sein, um Posts zu löschen.'
    },
    password: {
        tooShort: 'Passwort muss mindestens 8 Zeichen lang sein!',
        changed: 'Neues Admin-Passwort wurde gesetzt!\nDas Standard-Passwort funktioniert nicht mehr.',
        setup: 'Sie verwenden noch das Standard-Passwort "admin123".\n\nMöchten Sie jetzt ein sicheres Admin-Passwort festlegen?\n\nEmpfohlen für die Sicherheit Ihres Blogs!'
    },
    posts: {
        deleteConfirm: 'Sind Sie sicher, dass Sie diesen Blogpost löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
        deleteSuccess: 'Blogpost wurde erfolgreich gelöscht.',
        deleteError: 'Fehler beim Löschen: ',
        networkError: 'Netzwerkfehler beim Löschen des Posts.'
    }
};

// API-Utilities (zentralisiert)
async function makeApiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    const mergedOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, mergedOptions);
        const result = await response.json();
        
        return {
            success: response.ok,
            data: result,
            status: response.status
        };
    } catch (error) {
        console.error(`API Request failed for ${url}:`, error);
        return {
            success: false,
            error: error.message,
            status: 0
        };
    }
}

// DOM-Utilities (erweitert)
function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Attribute setzen
    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'cssText') {
            element.style.cssText = value;
        } else {
            element.setAttribute(key, value);
        }
    });
    
    // Content setzen
    if (content) {
        element.innerHTML = content;
    }
    
    return element;
}

function elementExists(id) {
    return document.getElementById(id) !== null;
}

function waitForElement(id, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const element = document.getElementById(id);
        if (element) {
            resolve(element);
            return;
        }
        
        const observer = new MutationObserver((mutations) => {
            const element = document.getElementById(id);
            if (element) {
                observer.disconnect();
                resolve(element);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${id} not found within ${timeout}ms`));
        }, timeout);
    });
}
