// Admin-System für den Blog
// Alle admin-bezogenen Funktionen sind hier zentralisiert

// Admin-Status Variable (muss vor allen Funktionen stehen)
let isAdminLoggedIn = false;

// Admin Login prüfen (einfaches System mit localStorage)
function checkAdminStatus() {
    const adminToken = localStorage.getItem('blog_admin_token');
    const adminExpiry = localStorage.getItem('blog_admin_expiry');
    
    if (adminToken === 'admin_logged_in' && adminExpiry) {
        const expiryTime = parseInt(adminExpiry);
        if (Date.now() < expiryTime) {
            isAdminLoggedIn = true;
            return true;
        } else {
            // Token abgelaufen
            localStorage.removeItem('blog_admin_token');
            localStorage.removeItem('blog_admin_expiry');
        }
    }
    isAdminLoggedIn = false;
    return false;
}

// Admin Login
function adminLogin() {
    const password = prompt('Admin-Passwort eingeben:');
    if (password === 'admin123') { // Einfaches Passwort - in Produktion sollte das sicherer sein
        // Token für 24 Stunden setzen
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('blog_admin_token', 'admin_logged_in');
        localStorage.setItem('blog_admin_expiry', expiryTime.toString());
        isAdminLoggedIn = true;
        updateNavigationVisibility();
        location.reload(); // Seite neu laden um Admin-Buttons anzuzeigen
        return true;
    } else {
        alert('Falsches Passwort!');
        return false;
    }
}

// Admin Logout
function adminLogout() {
    localStorage.removeItem('blog_admin_token');
    localStorage.removeItem('blog_admin_expiry');
    isAdminLoggedIn = false;
    updateNavigationVisibility();
    location.reload(); // Seite neu laden um Admin-Buttons zu verstecken
}

// Post löschen
async function deletePost(filename) {
    if (!isAdminLoggedIn) {
        alert('Sie müssen als Admin eingeloggt sein, um Posts zu löschen.');
        return false;
    }
    
    if (!confirm('Sind Sie sicher, dass Sie diesen Blogpost löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        return false;
    }
    
    try {
        const response = await fetch(`/blogpost/${filename}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (response.ok) {
            alert('Blogpost wurde erfolgreich gelöscht.');
            // Je nach aktueller Seite entsprechende Funktion aufrufen
            if (typeof loadAndDisplayRecentPosts === 'function') {
                loadAndDisplayRecentPosts();
            } else if (typeof loadAndDisplayArchivePosts === 'function') {
                loadAndDisplayArchivePosts();
            } else if (typeof loadAndDisplayMostReadPosts === 'function') {
                loadAndDisplayMostReadPosts();
            } else {
                location.reload();
            }
            return true;
        } else {
            alert('Fehler beim Löschen: ' + (result.error || 'Unbekannter Fehler'));
            return false;
        }
    } catch (error) {
        console.error('Fehler beim Löschen des Posts:', error);
        alert('Netzwerkfehler beim Löschen des Posts.');
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
}

// Admin-Toolbar erstellen
function createAdminToolbar() {
    if (!checkAdminStatus()) return;
    
    // Prüfen ob Toolbar bereits existiert
    if (document.getElementById('admin-toolbar')) return;
    
    const toolbar = document.createElement('div');
    toolbar.id = 'admin-toolbar';
    toolbar.style.cssText = `
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
    `;
    
    toolbar.innerHTML = `
        <span>👑 Admin-Modus aktiv</span>
        <button onclick="adminLogout()" style="
            background: #c0392b;
            color: white;
            border: none;
            padding: 5px 15px;
            border-radius: 15px;
            margin-left: 20px;
            cursor: pointer;
            font-family: 'Crimson Text', serif;
        ">Logout</button>
    `;
    
    document.body.prepend(toolbar);
    
    // Body-Padding anpassen wegen der Toolbar
    document.body.style.paddingTop = '50px';
}

// Admin Login Button erstellen
function createAdminLoginButton() {
    if (checkAdminStatus()) return; // Bereits eingeloggt
    
    // Prüfen ob Button bereits existiert
    if (document.getElementById('admin-login-btn')) return;
    
    const loginBtn = document.createElement('button');
    loginBtn.id = 'admin-login-btn';
    loginBtn.onclick = adminLogin;
    loginBtn.style.cssText = `
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
    `;
    loginBtn.innerHTML = '👑';
    loginBtn.title = 'Admin Login';
    
    loginBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
    });
    
    loginBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
    });
    
    document.body.appendChild(loginBtn);
}

// Create Page Admin Protection und Initialisierung
function initializeCreatePage() {
    // Prüfe Admin-Status und zeige entsprechenden Inhalt
    if (checkAdminStatus()) {
        // Admin ist eingeloggt - zeige Create-Formular
        const createContent = document.getElementById('create-content');
        if (createContent) {
            createContent.style.display = 'block';
        }
        // Initialisiere TinyMCE Editor (falls die Funktion verfügbar ist)
        if (typeof initializeBlogEditor === 'function') {
            initializeBlogEditor();
        }
    } else {
        // Kein Admin - zeige Warnung
        const adminRequired = document.getElementById('admin-required');
        if (adminRequired) {
            adminRequired.style.display = 'block';
        }
    }
}

// Admin Login speziell für Create-Seite (mit Reload)
function adminLoginForCreatePage() {
    const password = prompt('Admin-Passwort eingeben:');
    if (password === 'admin123') {
        const expiryTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('blog_admin_token', 'admin_logged_in');
        localStorage.setItem('blog_admin_expiry', expiryTime.toString());
        location.reload(); // Seite neu laden
        return true;
    } else {
        alert('Falsches Passwort!');
        return false;
    }
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
                <button onclick="deletePostAndRedirect('${postFilename}')" class="btn btn-danger" style="
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: 500;
                    margin-top: 10px;
                ">
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

// Admin-System initialisieren
function initializeAdminSystem() {
    checkAdminStatus();
    updateNavigationVisibility();
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

// Globale Verfügbarmachung der checkAdminStatus Funktion für comments.js
window.checkAdminStatus = checkAdminStatus;
