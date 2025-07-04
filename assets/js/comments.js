// Kommentarsystem für den Blog
// Serverbasiertes Kommentarsystem ohne Login-Pflicht

console.log('💬 Kommentarsystem-Modul geladen');

// Alle Kommentare für einen Post vom Server laden
async function loadComments(postFilename) {
    try {
        console.log(`📥 Lade Kommentare für Post: ${postFilename}`);
        const response = await fetch(`/comments/${postFilename}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                console.log('ℹ️ Keine Kommentare gefunden - leeres Array zurückgeben');
                return [];
            }
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const comments = await response.json();
        console.log(`✅ ${comments.length} Kommentare geladen`);
        return comments;
    } catch (error) {
        console.error('❌ Fehler beim Laden der Kommentare:', error);
        return [];
    }
}

// Neuen Kommentar zum Server senden
async function addComment(postFilename, username, commentText) {
    // Input-Validierung (client-seitig)
    if (!commentText || commentText.trim().length === 0) {
        alert('Bitte gib einen Kommentar ein.');
        return false;
    }
    
    if (commentText.trim().length > 1000) {
        alert('Kommentar ist zu lang (maximal 1000 Zeichen).');
        return false;
    }
    
    try {
        console.log(`📤 Sende neuen Kommentar für Post: ${postFilename}`);
        
        const response = await fetch(`/comments/${postFilename}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username && username.trim() !== '' ? username.trim() : '',
                text: commentText.trim()
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            alert('Fehler beim Speichern: ' + (result.error || 'Unbekannter Fehler'));
            return false;
        }
        
        console.log('✅ Kommentar erfolgreich gespeichert:', result.comment);
        
        // Kommentare neu laden und anzeigen
        await displayComments(postFilename);
        
        // Formular zurücksetzen
        resetCommentForm();
        
        // Erfolgs-Feedback
        showCommentFeedback('Kommentar erfolgreich hinzugefügt! 🎉', 'success');
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Hinzufügen des Kommentars:', error);
        alert('Netzwerkfehler beim Speichern des Kommentars. Bitte versuche es später erneut.');
        return false;
    }
}

// Kommentar löschen (nur für Admins)
async function deleteComment(postFilename, commentId) {
    if (!window.checkAdminStatus || !window.checkAdminStatus()) {
        alert('Nur Administratoren können Kommentare löschen.');
        return false;
    }
    
    if (!confirm('Möchten Sie diesen Kommentar wirklich löschen?')) {
        return false;
    }
    
    try {
        console.log(`🗑️ Lösche Kommentar: ${commentId} aus Post: ${postFilename}`);
        
        const response = await fetch(`/comments/${postFilename}/${commentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            alert('Fehler beim Löschen: ' + (result.error || 'Unbekannter Fehler'));
            return false;
        }
        
        console.log('✅ Kommentar erfolgreich gelöscht:', result.deletedComment);
        
        // Kommentare neu laden und anzeigen
        await displayComments(postFilename);
        
        // Erfolgs-Feedback
        showCommentFeedback('Kommentar erfolgreich gelöscht.', 'info');
        
        return true;
    } catch (error) {
        console.error('❌ Fehler beim Löschen des Kommentars:', error);
        alert('Netzwerkfehler beim Löschen des Kommentars.');
        return false;
    }
}

// Feedback-Nachrichten anzeigen
function showCommentFeedback(message, type = 'info') {
    const feedbackContainer = document.getElementById('comment-feedback');
    if (!feedbackContainer) {
        // Falls kein Container vorhanden ist, erstelle einen
        const container = document.createElement('div');
        container.id = 'comment-feedback';
        container.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(container);
    }
    
    const alertClass = type === 'success' ? 'alert-success' : 
                      type === 'error' ? 'alert-danger' : 'alert-info';
    
    const feedback = document.createElement('div');
    feedback.className = `alert ${alertClass} alert-dismissible fade show`;
    feedback.innerHTML = `
        ${message}
        <button type="button" class="close" data-dismiss="alert">
            <span>&times;</span>
        </button>
    `;
    feedback.style.animation = 'slideInRight 0.3s ease-out';
    
    const container = document.getElementById('comment-feedback');
    container.appendChild(feedback);
    
    // Auto-remove nach 4 Sekunden
    setTimeout(() => {
        if (feedback.parentNode) {
            feedback.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                if (feedback.parentNode) {
                    feedback.parentNode.removeChild(feedback);
                }
            }, 300);
        }
    }, 4000);
}

// Relative Zeit formatieren
function formatCommentTime(timestamp) {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffMs = now - commentTime;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
        return 'vor wenigen Sekunden';
    } else if (diffMinutes < 60) {
        return `vor ${diffMinutes} Minute${diffMinutes === 1 ? '' : 'n'}`;
    } else if (diffHours < 24) {
        return `vor ${diffHours} Stunde${diffHours === 1 ? '' : 'n'}`;
    } else if (diffDays < 30) {
        return `vor ${diffDays} Tag${diffDays === 1 ? '' : 'en'}`;
    } else {
        return commentTime.toLocaleDateString('de-DE');
    }
}

// Kommentare anzeigen
async function displayComments(postFilename) {
    const commentsContainer = document.getElementById('comments-list');
    if (!commentsContainer) return;
    
    // Loading-Spinner anzeigen
    commentsContainer.innerHTML = `
        <div class="text-center">
            <div class="spinner-border" role="status">
                <span class="sr-only">Lade Kommentare...</span>
            </div>
            <p class="mt-2 text-muted">Lade Kommentare...</p>
        </div>
    `;
    
    try {
        const comments = await loadComments(postFilename);
        
        if (comments.length === 0) {
            commentsContainer.innerHTML = `
                <div class="no-comments">
                    <p class="text-muted text-center">
                        <em>💭 Noch keine Kommentare vorhanden. Sei der erste, der kommentiert!</em>
                    </p>
                </div>
            `;
            updateCommentCount(0);
            return;
        }
        
        // Kommentare nach Datum sortieren (neueste zuerst)
        comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        const commentsHtml = comments.map(comment => `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <span class="comment-username">
                        <i class="fas fa-user-circle"></i> ${comment.username}
                    </span>
                    <span class="comment-time">${formatCommentTime(comment.timestamp)}</span>
                    ${window.checkAdminStatus && window.checkAdminStatus() ? 
                        `<button onclick="deleteComment('${postFilename}', '${comment.id}')" 
                                 class="btn btn-sm btn-outline-danger comment-delete-btn" 
                                 title="Kommentar löschen">
                            <i class="fas fa-trash"></i>
                         </button>` : ''
                    }
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `).join('');
        
        commentsContainer.innerHTML = commentsHtml;
        
        // Kommentarzähler aktualisieren
        updateCommentCount(comments.length);
        
        console.log(`✅ ${comments.length} Kommentare angezeigt`);
    } catch (error) {
        console.error('❌ Fehler beim Anzeigen der Kommentare:', error);
        commentsContainer.innerHTML = `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle"></i>
                Fehler beim Laden der Kommentare. Bitte versuche es später erneut.
                <button onclick="displayComments('${postFilename}')" class="btn btn-sm btn-outline-danger ml-2">
                    <i class="fas fa-redo"></i> Erneut versuchen
                </button>
            </div>
        `;
        updateCommentCount(0);
    }
}

// Kommentarzähler aktualisieren
function updateCommentCount(count) {
    const commentCount = document.getElementById('comment-count');
    if (commentCount) {
        commentCount.textContent = count;
    }
    
    const commentTitle = document.getElementById('comments-title');
    if (commentTitle) {
        commentTitle.innerHTML = `
            💬 Kommentare <span class="badge badge-secondary">${count}</span>
        `;
    }
}

// Kommentar-Formular zurücksetzen
function resetCommentForm() {
    const form = document.getElementById('comment-form');
    if (form) {
        form.reset();
    }
    
    // Character Counter zurücksetzen
    const charCounter = document.getElementById('char-counter');
    if (charCounter) {
        charCounter.textContent = '0/1000';
        charCounter.className = 'char-counter';
    }
}

// Character Counter für Kommentar-Textarea
function updateCharCounter() {
    const textarea = document.getElementById('comment-text');
    const charCounter = document.getElementById('char-counter');
    
    if (textarea && charCounter) {
        const length = textarea.value.length;
        charCounter.textContent = `${length}/1000`;
        
        // Farbe basierend auf Länge ändern
        if (length > 900) {
            charCounter.className = 'char-counter text-danger';
        } else if (length > 700) {
            charCounter.className = 'char-counter text-warning';
        } else {
            charCounter.className = 'char-counter text-muted';
        }
    }
}

// Kommentar-Formular Submit Handler
async function handleCommentSubmit(event) {
    event.preventDefault();
    
    const urlParams = new URLSearchParams(window.location.search);
    const postFilename = urlParams.get('post');
    
    if (!postFilename) {
        alert('Fehler: Post-ID nicht gefunden.');
        return;
    }
    
    const username = document.getElementById('comment-username').value.trim();
    const commentText = document.getElementById('comment-text').value.trim();
    
    // Submit-Button deaktivieren während des Sendens
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Wird gesendet...';
    
    try {
        const success = await addComment(postFilename, username, commentText);
        if (success) {
            // Username für nächstes Mal speichern
            saveUsername();
        }
    } finally {
        // Submit-Button wieder aktivieren
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// Kommentarsystem initialisieren
async function initializeCommentsSystem() {
    console.log('🚀 Kommentarsystem wird initialisiert...');
    
    // Post-Filename aus URL extrahieren
    const urlParams = new URLSearchParams(window.location.search);
    const postFilename = urlParams.get('post');
    
    if (!postFilename) {
        console.warn('⚠️ Keine Post-ID gefunden, Kommentarsystem wird nicht geladen.');
        return;
    }
    
    // Kommentare laden und anzeigen
    await displayComments(postFilename);
    
    // Event Listener für Formular
    const commentForm = document.getElementById('comment-form');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
    
    // Event Listener für Character Counter
    const commentTextarea = document.getElementById('comment-text');
    if (commentTextarea) {
        commentTextarea.addEventListener('input', updateCharCounter);
        commentTextarea.addEventListener('keyup', updateCharCounter);
    }
    
    console.log('✅ Kommentarsystem erfolgreich initialisiert für Post:', postFilename);
}

// Username aus localStorage laden/speichern (für Benutzerfreundlichkeit)
function loadSavedUsername() {
    const savedUsername = localStorage.getItem('blog_comment_username');
    const usernameInput = document.getElementById('comment-username');
    
    if (savedUsername && usernameInput) {
        usernameInput.value = savedUsername;
    }
}

function saveUsername() {
    const usernameInput = document.getElementById('comment-username');
    if (usernameInput && usernameInput.value.trim()) {
        localStorage.setItem('blog_comment_username', usernameInput.value.trim());
    }
}

// Username speichern wenn sich der Wert ändert
document.addEventListener('DOMContentLoaded', function() {
    loadSavedUsername();
    
    const usernameInput = document.getElementById('comment-username');
    if (usernameInput) {
        usernameInput.addEventListener('blur', saveUsername);
    }
});
