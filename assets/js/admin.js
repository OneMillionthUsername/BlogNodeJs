// Admin-System für den Blog - JWT-basierte Authentifizierung
// Alle admin-bezogenen Funktionen sind hier zentralisiert

// Admin-Status Variable (muss vor allen Funktionen stehen)
let isAdminLoggedIn = false;
let currentJwtToken = null;
let currentUser = null;

// API-Request mit JWT-Authorization Header
async function makeApiRequestWithAuth(url, options = {}) {
    const token = currentJwtToken || getJwtTokenFromCookie();
    
    if (token) {
        options.headers = {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
    }
    
    return await makeApiRequest(url, options);
}

// Admin-Status über JWT-Token prüfen
async function checkAdminStatus() {
    try {
        const result = await makeApiRequest('/auth/verify', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (result.success && result.data && result.data.valid) {
            isAdminLoggedIn = true;
            currentUser = result.data.user;
            currentJwtToken = getJwtTokenFromCookie(); // Token aus Cookie lesen
            console.log('✅ Admin-Session aktiv:', currentUser.username);
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Admin-Status-Prüfung fehlgeschlagen:', error);
    }
    
    isAdminLoggedIn = false;
    currentUser = null;
    currentJwtToken = null;
    return false;
}

// JWT-basiertes Admin Login
async function adminLogin(reloadPage = true) {
    const username = prompt('Benutzername:') || 'admin';
    const password = prompt('Admin-Passwort eingeben:');
    
    if (!password) {
        return false;
    }
    
    console.log('Attempting login with:', username); // Debug output
    
    try {
        const result = await makeApiRequest('/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });
        
        console.log('Login response:', result); // Debug output
        console.log('Response status:', result.status); // Status code
        console.log('Response data:', result.data); // Response body
        
        if (result.success && result.data && result.data.success) {
            isAdminLoggedIn = true;
            currentUser = result.data.user;
            currentJwtToken = result.data.token; // Token aus Response speichern
            
            console.log('✅ Admin-Login erfolgreich:', currentUser.username);
            updateNavigationVisibility();
            
            if (reloadPage) {
                reloadPageWithDelay(); // Verzögerter Reload für bessere UX
            }
            return true;
        } else {
            const errorMsg = result.data ? result.data.error : 'Login failed';
            console.error('Login failed:', errorMsg); // Debug output
            alert('Login failed: ' + errorMsg);
            return false;
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Login fehlgeschlagen: Netzwerkfehler');
        return false;
    }
}

// JWT-basiertes Admin Logout
async function adminLogout() {
    try {
        await makeApiRequest('/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.warn('⚠️ Logout-Request fehlgeschlagen:', error);
    }
    
    // Lokale Variablen zurücksetzen
    isAdminLoggedIn = false;
    currentUser = null;
    currentJwtToken = null;
    
    updateNavigationVisibility();
    reloadPageWithDelay(); // Verzögerter Reload für bessere UX
}

// Post löschen mit JWT-Authentifizierung
async function deletePost(filename) {
    if (!isAdminLoggedIn) {
        alert(ADMIN_MESSAGES.login.required);
        return false;
    }
    
    if (!confirm(ADMIN_MESSAGES.posts.deleteConfirm)) {
        return false;
    }
    
    const result = await makeApiRequestWithAuth(`/blogpost/${filename}`, {
        method: 'DELETE'
    });
    
    if (result.success) {
        alert(ADMIN_MESSAGES.posts.deleteSuccess);
        // Je nach aktueller Seite entsprechende Funktion aufrufen
        refreshCurrentPage();
        return true;
    } else {
        const errorMsg = result.error || (result.data && result.data.error) || 'Unbekannter Fehler';
        
        // Bei 401/403 - Session abgelaufen
        if (result.status === 401 || result.status === 403) {
            alert('Session abgelaufen. Bitte melden Sie sich erneut an.');
            await adminLogout();
            return false;
        }
        
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
    
    // Admin-Toolbar und Login-Button entsprechend ein-/ausblenden
    if (isAdminLoggedIn) {
        createAdminToolbar();
        hideElement('admin-login-btn');
    } else {
        hideElement('admin-toolbar');
        createAdminLoginButton();
    }
}

// Admin-Toolbar erstellen
function createAdminToolbar() {
    if (!isAdminLoggedIn) return;
    
    // Prüfen ob Toolbar bereits existiert
    if (elementExists('admin-toolbar')) return;
    
    const userDisplay = currentUser ? ` (${currentUser.username})` : '';
    
    const toolbar = createElement('div', {
        id: 'admin-toolbar',
        cssText: ADMIN_STYLES.toolbar
    }, `
        <span>👑 Admin-Modus aktiv${userDisplay}</span>
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
    if (isAdminLoggedIn) return; // Bereits eingeloggt
    
    // Prüfen ob Button bereits existiert
    if (elementExists('admin-login-btn')) return;
    
    const loginBtn = createElement('button', {
        id: 'admin-login-btn',
        cssText: ADMIN_STYLES.loginButton,
        title: 'Admin Login (JWT)'
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
async function initializeCreatePage() {
    // Prüfe Admin-Status und zeige entsprechenden Inhalt
    if (await checkAdminStatus()) {
        // Admin ist eingeloggt - zeige Create-Formular
        showElement('create-content');
        console.log('✅ Admin-Status bestätigt - Create-Formular wird angezeigt');
    } else {
        // Kein Admin - zeige Warnung
        showElement('admin-required');
        console.log('⚠️ Kein Admin-Status - Anmeldung erforderlich');
    }
    
    // Navigation-Sichtbarkeit aktualisieren
    updateNavigationVisibility();
}

// Admin-Controls für read_post.html hinzufügen (JWT-basiert)
async function addReadPostAdminControls() {
    if (!await checkAdminStatus()) return;
    
    const postFilename = getUrlParameter('post');
    
    if (postFilename) {
        const adminControls = document.getElementById('admin-controls');
        if (adminControls) {
            adminControls.innerHTML = `
                <button onclick="deletePostAndRedirect('${postFilename}')" class="btn btn-danger" style="${ADMIN_STYLES.deleteButton}">
                    🗑️ Diesen Post löschen (Admin: ${currentUser?.username || 'JWT'})
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

// Admin-System initialisieren (JWT-basiert)
async function initializeAdminSystem() {
    console.log('🔐 Initialisiere JWT-basiertes Admin-System...');
    
    // JWT-Status prüfen
    await checkAdminStatus();
    updateNavigationVisibility();
    
    if (isAdminLoggedIn) {
        console.log('✅ Admin eingeloggt:', currentUser?.username);
        createAdminToolbar();
        // Kommentare mit Admin-Funktionen neu laden falls sie bereits angezeigt werden
        if (typeof initializeCommentsSystem === 'function') {
            setTimeout(initializeCommentsSystem, 100);
        }
    } else {
        console.log('ℹ️ Kein Admin eingeloggt - Login-Button anzeigen');
        createAdminLoginButton();
    }
    
    // Automatisches Token-Refresh alle 30 Minuten
    if (isAdminLoggedIn) {
        setInterval(async () => {
            const refreshed = await refreshTokenIfNeeded();
            if (!refreshed && currentJwtToken) {
                console.log('🔄 Token-Refresh übersprungen - Token noch gültig');
            }
        }, 30 * 60 * 1000); // 30 Minuten
    }
}

// JWT Token-Refresh (optional - automatische Verlängerung)
async function refreshTokenIfNeeded() {
    if (!currentJwtToken) return false;
    
    try {
        const result = await makeApiRequest('/auth/refresh', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentJwtToken}`
            }
        });
        
        if (result.success && result.data && result.data.success) {
            currentJwtToken = result.data.token;
            console.log('🔄 JWT-Token erfolgreich erneuert');
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Token-Refresh fehlgeschlagen:', error);
    }
    
    return false;
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
        ADMIN_EXPIRY: 'blog_admin_expiry'
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
