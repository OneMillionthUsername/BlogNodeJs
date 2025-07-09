// Blog Utility Funktionen
// Alle allgemeinen Blog-Funktionen sind hier zentralisiert

// ===========================================
// JWT-TOKEN VERWALTUNG (Zentrale Funktion)
// ===========================================

/**
 * JWT-Token aus Cookie lesen (zentrale Funktion für alle Module)
 * 
 * Diese Funktion ersetzt die redundanten getTokenFromCookie(), 
 * getTokenFromCookieForUpload() und getTokenFromCookieForComments() 
 * Funktionen in allen anderen Modulen.
 * 
 * @returns {string|null} JWT-Token oder null falls nicht gefunden
 */
function getJwtTokenFromCookie() {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'authToken') {
            return value;
        }
    }
    return null;
}

// Global verfügbar machen für alle Module
window.getJwtTokenFromCookie = getJwtTokenFromCookie;

// Zentrale Funktion zur Überprüfung der Entwicklungsumgebung
function isLocalDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

// Global verfügbar machen
window.isLocalDevelopment = isLocalDevelopment;

console.log('Central JWT token function loaded and globally available');

// ===========================================
// BLOG POST FORM HANDLING
// ===========================================

// Blog Post Form Handler (wird nur ausgeführt wenn das Element existiert)
function initializeBlogPostForm() {
    const form = document.getElementById('blogPostForm');
    if (!form) return; // Element existiert nicht auf dieser Seite
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault(); // Verhindert das Standard-Formular-Senden

        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const tagsInput = document.getElementById('tags').value;

        // Tags in ein Array umwandeln (optional, falls Tags als Array erwartet werden)
        const tags = tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

        const postData = {
            title: title,
            content: content,
            tags: tags
        };

        try {
            // JWT-Token für Authentifizierung holen
            const token = (typeof currentJwtToken !== 'undefined' && currentJwtToken) || 
                         getJwtTokenFromCookie();
            
            const headers = {
                'Content-Type': 'application/json'
            };
            
            // Authorization Header hinzufügen falls Token verfügbar
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const response = await fetch('/blogpost', {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(postData)
            });

            const result = await response.json();
            
            // Bei 401/403 - Session abgelaufen
            if (response.status === 401 || response.status === 403) {
                document.getElementById('responseMessage').textContent = 'Session abgelaufen. Bitte melden Sie sich erneut an.';
                // Optional: Admin-Logout aufrufen falls verfügbar
                if (typeof adminLogout === 'function') {
                    await adminLogout();
                }
                return;
            }
            
            document.getElementById('responseMessage').textContent = `Status: ${response.status} - ${result.message || result.error}`;

            if (response.ok) {
                console.log('Blogpost created successfully:', result);
                // Optional: Formular zurücksetzen oder Seite aktualisieren
                document.getElementById('blogPostForm').reset();
                
                // TinyMCE-Editor zurücksetzen falls vorhanden
                if (typeof tinymce !== 'undefined' && tinymce.activeEditor) {
                    tinymce.activeEditor.setContent('');
                }
            } else {
                console.error('Error creating blogpost:', result);
            }

        } catch (error) {
            console.error('Network or unexpected error:', error);
            document.getElementById('responseMessage').textContent = `Fehler: ${error.message}`;
        }
    });
}

// Funktion zum Laden aller Blogposts
async function loadAllBlogPosts() {
    try {
        const response = await fetch('/blogposts');
        const posts = await response.json();
        return posts;
    } catch (error) {
        console.error('Fehler beim Laden der Blogposts:', error);
        return [];
    }
}

// Funktion zum Laden eines einzelnen Blogposts
async function loadBlogPost(filename) {
    try {
        const response = await fetch(`/blogpost/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const post = await response.json();
        return post;
    } catch (error) {
        console.error('Fehler beim Laden des Blogposts:', error);
        return null;
    }
}

// Funktion zum Formatieren eines Datums
function formatPostDate(dateString) {
    const date = new Date(dateString);
    const postDate = date.toLocaleDateString('de-DE', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const postTime = date.toLocaleTimeString('de-DE', {
        hour: '2-digit',
        minute: '2-digit'
    });
    return { postDate, postTime };
}

// Funktion zur Berechnung der Lesezeit
function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.split(' ').length;
    return Math.ceil(words / wordsPerMinute);
}

// Funktion zum Formatieren von HTML-Content
function formatContent(content) {
    return content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');
}

// Hauptfunktion zum Laden und Anzeigen eines Blogposts (für read_post.html)
async function loadAndDisplayBlogPost() {
    // URL-Parameter auslesen
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    
    // Prüfen, ob ein Post-Parameter in der URL vorhanden ist
    if (!postId) {
        document.getElementById('loading').innerHTML = '<p class="error-message">No blogpost selected.</p>';
        return;
    }

    try {
        // Blogpost laden
        const post = await loadBlogPost(postId);
        
        if (!post) {
            throw new Error('Blogpost konnte nicht geladen werden');
        }
        
        // UI aktualisieren
        updateBlogPostUI(post);
        
    } catch (error) {
        console.error('Fehler beim Laden des Blogposts:', error);
        document.getElementById('loading').innerHTML = '<p class="error-message">Error loading blogpost.</p>';
    }
}

// Funktion zum Aktualisieren der UI mit Blogpost-Daten
function updateBlogPostUI(post) {
    // Titel setzen
    document.getElementById('title').textContent = post.title;
    document.title = `${post.title} - Sub specie aeternitatis`;
    
    // Datum und Meta-Informationen
    const { postDate, postTime } = formatPostDate(post.date);
    const readingTime = calculateReadingTime(post.content);
    
    document.getElementById('meta').innerHTML = `
        <div class="post-date">Published on ${postDate} at ${postTime}</div>
        <div class="post-reading-time">Reading time: approx. ${readingTime} min.</div>
    `;
    
    // Inhalt formatieren und einfügen
    const formattedContent = formatContent(post.content);
    document.getElementById('content').innerHTML = `<p>${formattedContent}</p>`;
    
    // Tags anzeigen (nur wenn vorhanden)
    if (post.tags && post.tags.length > 0) {
        const tagsHtml = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        document.getElementById('tags').innerHTML = `
            <div class="tags-label">Tags:</div>
            <div class="tags-list">${tagsHtml}</div>
        `;
        document.getElementById('tags').style.display = 'block';
    }
    
    // Elemente sichtbar machen
    document.getElementById('loading').style.display = 'none';
    document.getElementById('post-article').style.display = 'block';
}

// Funktion zum Laden und Anzeigen von Archiv-Posts (für archiv.html)
async function loadAndDisplayArchivePosts() {
    try {
        const response = await fetch('/blogposts');
        const posts = await response.json();
        
        const listContainer = document.getElementById('archivePosts');
        
        // Filtere Posts älter als 3 Monate
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const archivePosts = posts.filter(post => {
            const postDate = new Date(post.date);
            return postDate < threeMonthsAgo;
        });
        
        if (archivePosts.length === 0) {
            listContainer.innerHTML = `
                <div class="no-posts">
                    <div class="no-posts-icon">Archive</div>
                    <h3>No archive available</h3>
                    <p>There are no blog posts older than 3 months yet.</p>
                </div>
            `;
            return;
        }

        let html = `<div class="archive-posts-list">`;
        archivePosts.forEach(post => {
            const postDate = new Date(post.date).toLocaleDateString('de-DE');
            html += `
                <div class="archive-post-item">
                    <h3><a href="read_post.html?post=${post.filename}">${post.title}</a></h3>
                    <p class="post-meta">${postDate}</p>
                </div>
            `;
        });
        html += '</div>';
        
        listContainer.innerHTML = html;
        
        // Admin-Delete-Buttons hinzufügen (falls verfügbar)
        if (typeof addDeleteButtonsToPosts === 'function') {
            setTimeout(addDeleteButtonsToPosts, 50);
        }
        
    } catch (error) {
        console.error('Fehler beim Laden des Archivs:', error);
        document.getElementById('archivePosts').innerHTML = '<p>Fehler beim Laden des Archivs.</p>';
    }
}

// Funktion zum Laden und Anzeigen von aktuellen Posts (für list_posts.html)
async function loadAndDisplayRecentPosts() {
    try {
        const response = await fetch('/blogposts');
        const posts = await response.json();
        
        const listContainer = document.getElementById('blogPostsList');
        
        // Filtere Posts der letzten 3 Monate
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        const recentPosts = posts.filter(post => {
            const postDate = new Date(post.date);
            return postDate >= threeMonthsAgo;
        });
        
        if (recentPosts.length === 0) {
            listContainer.innerHTML = `
                <div class="no-posts">
                    <div class="no-posts-icon">Posts</div>
                    <h3>No recent blog posts</h3>
                    <p>No blog posts have been published in the last 3 months.</p>
                    <a href="create.html" class="btn btn-outline-primary mt-3">Create first post</a>
                </div>
            `;
            return;
        }

        let html = `
            <div class="posts-count">
                <span class="count-number">${recentPosts.length}</span> 
                <span class="count-text">Blogpost${recentPosts.length !== 1 ? 's' : ''} in den letzten 3 Monaten</span>
            </div>
            <div class="blog-posts-grid">
        `;
        
        recentPosts.forEach((post, index) => {
            const postDate = new Date(post.date);
            const formattedDate = postDate.toLocaleDateString('de-DE', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Zeitabstand berechnen
            const timeDiff = new Date() - postDate;
            const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
            let timeAgo = '';
            
            if (daysDiff < 1) {
                timeAgo = 'Heute';
            } else if (daysDiff < 7) {
                timeAgo = `vor ${daysDiff} Tag${daysDiff !== 1 ? 'en' : ''}`;
            } else if (daysDiff < 30) {
                const weeksDiff = Math.floor(daysDiff / 7);
                timeAgo = `vor ${weeksDiff} Woche${weeksDiff !== 1 ? 'n' : ''}`;
            } else {
                const monthsDiff = Math.floor(daysDiff / 30);
                timeAgo = `vor ${monthsDiff} Monat${monthsDiff !== 1 ? 'en' : ''}`;
            }
            
            const isNew = daysDiff <= 7;
            
            html += `
                <article class="post-card ${isNew ? 'post-card-new' : ''}">
                    ${isNew ? '<div class="new-badge">NEU</div>' : ''}
                    <div class="post-card-header">
                        <h3 class="post-card-title">
                            <a href="read_post.html?post=${post.filename}">${post.title}</a>
                        </h3>
                        <div class="post-card-meta">
                            <span class="post-date">${formattedDate}</span>
                            <span class="post-time-ago">${timeAgo}</span>
                        </div>
                    </div>
                    
                    <div class="post-card-content">
                        ${post.tags.length > 0 ? `
                            <div class="post-card-tags">
                                Tags: ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                            </div>
                        ` : ''}
                        
                        <div class="post-card-actions">
                            <a href="read_post.html?post=${post.filename}" class="read-more-btn">
                                Read more
                            </a>
                        </div>
                    </div>
                </article>
            `;
        });
        
        html += '</div>';
        listContainer.innerHTML = html;
        
        // Admin-Delete-Buttons hinzufügen (falls verfügbar)
        if (typeof addDeleteButtonsToPosts === 'function') {
            setTimeout(addDeleteButtonsToPosts, 50);
        }
        
    } catch (error) {
        console.error('Fehler beim Laden der Blogposts:', error);
        document.getElementById('blogPostsList').innerHTML = `
            <div class="error-message">
                <div class="error-icon">Error</div>
                <h3>Loading failed</h3>
                <p>The blog posts could not be loaded.</p>
                <button onclick="loadAndDisplayRecentPosts()" class="btn btn-outline-primary mt-3">Try again</button>
            </div>
        `;
    }
}

// Funktion zum Laden und Anzeigen der meistgelesenen Posts (für most_read.html)
async function loadAndDisplayMostReadPosts() {
    try {
        const response = await fetch('/most-read');
        const posts = await response.json();
        
        const listContainer = document.getElementById('mostReadPosts');
        
        if (posts.length === 0) {
            listContainer.innerHTML = `
                <div class="no-posts">
                    <div class="no-posts-icon">Statistics</div>
                    <h3>No statistics available</h3>
                    <p>There are no blog post views available yet.</p>
                </div>
            `;
            return;
        }

        let html = '<div class="most-read-list">';
        posts.forEach((post, index) => {
            const rank = index + 1;
            const postDate = new Date(post.date).toLocaleDateString('de-DE');
            html += `
                <div class="most-read-item">
                    <span class="rank">#${rank}</span>
                    <h3><a href="read_post.html?post=${post.filename}">${post.title}</a></h3>
                    <p>${post.views} views | ${postDate}</p>
                </div>
            `;
        });
        html += '</div>';
        
        listContainer.innerHTML = html;
        
        // Admin-Delete-Buttons hinzufügen (falls verfügbar)
        if (typeof addDeleteButtonsToPosts === 'function') {
            setTimeout(addDeleteButtonsToPosts, 50);
        }
        
    } catch (error) {
        console.error('Fehler beim Laden der Statistiken:', error);
        document.getElementById('mostReadPosts').innerHTML = `
            <div class="error-message">
                <div class="error-icon">Error</div>
                <h3>Loading failed</h3>
                <p>The statistics could not be loaded.</p>
                <button onclick="loadAndDisplayMostReadPosts()" class="btn btn-outline-primary mt-3">Try again</button>
            </div>
        `;
    }
}

// Blog Utilities initialisieren
function initializeBlogUtilities() {
    // Blog Post Form initialisieren (falls vorhanden)
    initializeBlogPostForm();
}

// Utility-Funktion zum Abrufen von URL-Parametern
function getUrlParameter(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}
