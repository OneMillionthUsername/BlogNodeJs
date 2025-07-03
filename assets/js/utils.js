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
        const post = await response.json();
        return post;
    } catch (error) {
        console.error('Fehler beim Laden des Blogposts:', error);
        return null;
    }
}
