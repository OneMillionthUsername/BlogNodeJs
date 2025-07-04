document.getElementById('blogPostForm').addEventListener('submit', async function(event) {
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
            const response = await fetch('/blogpost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json' // <-- HIER IST DIE WICHTIGE ÄNDERUNG!
                },
                body: JSON.stringify(postData) // <-- Hier werden die Daten als JSON-String verpackt
            });

            const result = await response.json(); // Oder response.text(), je nachdem was dein Server zurückgibt
            document.getElementById('responseMessage').textContent = `Status: ${response.status} - ${result.message || result.error}`;

            if (response.ok) { // Prüfe auf erfolgreichen HTTP-Status (2xx)
                console.log('Blogpost erfolgreich erstellt:', result);
                // Optional: Formular zurücksetzen oder Seite aktualisieren
                document.getElementById('blogPostForm').reset();
            } else {
                console.error('Fehler beim Erstellen des Blogposts:', result);
            }

        } catch (error) {
            console.error('Netzwerk- oder unerwarteter Fehler:', error);
            document.getElementById('responseMessage').textContent = `Fehler: ${error.message}`;
        }
    });

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
        document.getElementById('loading').innerHTML = '<p class="error-message">❌ Kein Blogpost ausgewählt.</p>';
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
        document.getElementById('loading').innerHTML = '<p class="error-message">❌ Fehler beim Laden des Blogposts.</p>';
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
        <div class="post-date">📅 Veröffentlicht am ${postDate} um ${postTime}</div>
        <div class="post-reading-time">⏱️ Lesezeit: ca. ${readingTime} Min.</div>
    `;
    
    // Inhalt formatieren und einfügen
    const formattedContent = formatContent(post.content);
    document.getElementById('content').innerHTML = `<p>${formattedContent}</p>`;
    
    // Tags anzeigen (nur wenn vorhanden)
    if (post.tags && post.tags.length > 0) {
        const tagsHtml = post.tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        document.getElementById('tags').innerHTML = `
            <div class="tags-label">🏷️ Tags:</div>
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
                    <div class="no-posts-icon">📚</div>
                    <h3>Kein Archiv vorhanden</h3>
                    <p>Es sind noch keine Blogposts älter als 3 Monate vorhanden.</p>
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
                    <p class="post-meta">📅 ${postDate}</p>
                </div>
            `;
        });
        html += '</div>';
        
        listContainer.innerHTML = html;
        
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
                    <div class="no-posts-icon">📝</div>
                    <h3>Keine aktuellen Blogposts</h3>
                    <p>In den letzten 3 Monaten wurden keine Blogposts veröffentlicht.</p>
                    <a href="create.html" class="btn btn-outline-primary mt-3">✍️ Ersten Post erstellen</a>
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
                            <span class="post-date">📅 ${formattedDate}</span>
                            <span class="post-time-ago">${timeAgo}</span>
                        </div>
                    </div>
                    
                    <div class="post-card-content">
                        ${post.tags.length > 0 ? `
                            <div class="post-card-tags">
                                🏷️ ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join(' ')}
                            </div>
                        ` : ''}
                        
                        <div class="post-card-actions">
                            <a href="read_post.html?post=${post.filename}" class="read-more-btn">
                                📖 Weiterlesen
                            </a>
                        </div>
                    </div>
                </article>
            `;
        });
        
        html += '</div>';
        listContainer.innerHTML = html;
        
    } catch (error) {
        console.error('Fehler beim Laden der Blogposts:', error);
        document.getElementById('blogPostsList').innerHTML = `
            <div class="error-message">
                <div class="error-icon">❌</div>
                <h3>Fehler beim Laden</h3>
                <p>Die Blogposts konnten nicht geladen werden.</p>
                <button onclick="loadAndDisplayRecentPosts()" class="btn btn-outline-primary mt-3">🔄 Erneut versuchen</button>
            </div>
        `;
    }
}

// Utility-Funktion zum Abrufen von URL-Parametern
function getUrlParameter(paramName) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}
