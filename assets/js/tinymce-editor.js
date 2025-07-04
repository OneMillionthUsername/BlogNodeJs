// TinyMCE Editor Konfiguration und Funktionen
// Diese Datei enthält alle TinyMCE-spezifischen Funktionen für create.html

console.log('🔧 TinyMCE Editor Modul geladen');

// TinyMCE Editor initialisieren
function initializeTinyMCE() {
    console.log('🚀 initializeTinyMCE() aufgerufen');
    
    // Prüfen ob das Element existiert
    const contentElement = document.getElementById('content');
    if (!contentElement) {
        console.error('❌ TinyMCE: Content-Element #content nicht gefunden');
        return;
    }
    console.log('✅ Content-Element gefunden:', contentElement);
    
    // Prüfen ob TinyMCE verfügbar ist
    if (typeof tinymce === 'undefined') {
        console.error('❌ TinyMCE ist nicht verfügbar. CDN-Loading fehlgeschlagen?');
        return;
    }
    console.log('✅ TinyMCE verfügbar, Version:', tinymce.majorVersion);
    
    // Vorherige TinyMCE Instanz entfernen falls vorhanden
    if (tinymce.get('content')) {
        console.log('🔄 Entferne vorherige TinyMCE Instanz');
        tinymce.remove('#content');
    }
    
    console.log('⚙️ Initialisiere TinyMCE mit vereinfachter Konfiguration...');
    
    // Debugger-Statement für VS Code
    debugger; // Hier stoppt der Debugger automatisch
    tinymce.init({
        selector: '#content',
        height: 500,
        menubar: 'edit view insert format tools help',
        plugins: [
            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
            'insertdatetime', 'media', 'table', 'help', 'wordcount', 'autosave',
            'save', 'directionality', 'emoticons', 'template', 'paste',
            'textcolor', 'colorpicker', 'textpattern', 'codesample', 'toc',
            'nonbreaking', 'pagebreak', 'quickbars'
        ],
        toolbar: [
            'undo redo | bold italic underline strikethrough | fontsize forecolor backcolor',
            'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent',
            'link image media table | codesample blockquote hr pagebreak | emoticons charmap',
            'searchreplace visualblocks code fullscreen preview | save help'
        ],
        toolbar_mode: 'floating',
        quickbars_selection_toolbar: 'bold italic underline | quicklink blockquote',
        quickbars_insert_toolbar: 'image media table hr',
        contextmenu: 'link image table configurepermanentpen',
        
        // Autosave-Funktionalität
        autosave_interval: '20s',
        autosave_prefix: 'blogpost_draft_',
        autosave_restore_when_empty: true,
        autosave_retention: '1440m', // 24 Stunden
        
        // Erweiterte Formatierungsoptionen
        font_size_formats: '8pt 10pt 12pt 14pt 16pt 18pt 20pt 24pt 28pt 32pt 36pt 48pt 60pt 72pt',
        block_formats: 'Paragraph=p; Heading 1=h1; Heading 2=h2; Heading 3=h3; Heading 4=h4; Heading 5=h5; Heading 6=h6; Preformatted=pre; Address=address',
        
        // Stil-Definitionen
        style_formats: [
            {title: 'Headers', items: [
                {title: 'Header 1', block: 'h1'},
                {title: 'Header 2', block: 'h2'},
                {title: 'Header 3', block: 'h3'},
                {title: 'Header 4', block: 'h4'},
                {title: 'Header 5', block: 'h5'},
                {title: 'Header 6', block: 'h6'}
            ]},
            {title: 'Inline', items: [
                {title: 'Bold', inline: 'strong'},
                {title: 'Italic', inline: 'em'},
                {title: 'Underline', inline: 'u'},
                {title: 'Strikethrough', inline: 'del'},
                {title: 'Code', inline: 'code'}
            ]},
            {title: 'Blocks', items: [
                {title: 'Paragraph', block: 'p'},
                {title: 'Blockquote', block: 'blockquote'},
                {title: 'Div', block: 'div'},
                {title: 'Pre', block: 'pre'}
            ]},
            {title: 'Containers', items: [
                {title: 'Info Box', block: 'div', classes: 'info-box', wrapper: true},
                {title: 'Warning Box', block: 'div', classes: 'warning-box', wrapper: true},
                {title: 'Success Box', block: 'div', classes: 'success-box', wrapper: true}
            ]}
        ],
        
        // Erweiterte Inhalt-Stile
        content_style: `
            body { 
                font-family: 'Crimson Text', serif; 
                font-size: 16px; 
                line-height: 1.6;
                color: #2c3e50;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
                font-family: 'Playfair Display', serif;
                color: #2c3e50;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
            }
            h1 { font-size: 2.5em; }
            h2 { font-size: 2em; }
            h3 { font-size: 1.5em; }
            blockquote {
                border-left: 4px solid #3498db;
                padding-left: 20px;
                margin: 20px 0;
                font-style: italic;
                color: #555;
            }
            code {
                background-color: #f8f9fa;
                padding: 2px 4px;
                border-radius: 3px;
                font-family: 'Consolas', 'Monaco', monospace;
            }
            pre {
                background-color: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                overflow-x: auto;
            }
            .info-box {
                background-color: #e8f4f8;
                border: 1px solid #bee5eb;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
            }
            .warning-box {
                background-color: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
            }
            .success-box {
                background-color: #d4edda;
                border: 1px solid #c3e6cb;
                border-radius: 5px;
                padding: 15px;
                margin: 15px 0;
            }
            img {
                max-width: 100%;
                height: auto;
                border-radius: 5px;
                margin: 10px 0;
            }
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
            }
            table th, table td {
                border: 1px solid #ddd;
                padding: 8px;
                text-align: left;
            }
            table th {
                background-color: #f2f2f2;
            }
        `,
        
        // Erweiterte Funktionen
        paste_data_images: true,
        paste_as_text: false,
        paste_remove_styles: false,
        paste_webkit_styles: 'all',
        paste_retain_style_properties: 'color font-size font-family background-color',
        
        // Bild-Upload-Konfiguration (falls Server-Support vorhanden)
        images_upload_handler: function(blobInfo, success, failure) {
            // Hier könnte ein Bild-Upload zu Ihrem Server implementiert werden
            // Für jetzt verwenden wir Data URLs
            const reader = new FileReader();
            reader.onload = function() {
                success(reader.result);
            };
            reader.readAsDataURL(blobInfo.blob());
        },
        
        // Erweiterte Einstellungen
        convert_urls: false,
        relative_urls: false,
        remove_script_host: true,
        document_base_url: '/',
        
        // Event-Handler
        setup: function(editor) {
            editor.on('init', function() {
                console.log('TinyMCE Editor wurde initialisiert');
                // Prüfe auf gespeicherte Entwürfe
                checkForDrafts();
            });
            
            editor.on('input keyup paste', function() {
                updatePreview();
            });
            
            editor.on('SaveContent', function() {
                console.log('Inhalt wurde automatisch gespeichert');
                showNotification('Entwurf automatisch gespeichert', 'success');
            });
            
            editor.on('RestoredDraft', function() {
                console.log('Entwurf wurde wiederhergestellt');
                showNotification('Entwurf wiederhergestellt', 'info');
                updatePreview();
            });
        },
        
        // Branding entfernen
        branding: false,
        promotion: false,
        
        // Tastenkürzel
        custom_shortcuts: true,
        
        // Erweiterte Tabellen-Funktionen
        table_toolbar: 'tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol',
        table_appearance_options: true,
        table_grid: true,
        table_cell_advtab: true,
        table_row_advtab: true,
        
        // Link-Funktionen
        link_context_toolbar: true,
        link_quicklink: true,
        
        // Erweiterte Listen-Funktionen
        lists_indent_on_tab: true,
        
        // Sprache und Lokalisierung
        language: 'de',
        language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n@23.10.9/langs6/de.min.js'
    });
}

// Hilfsfunktionen für erweiterte Funktionalität
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'info'} notification`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i>
        ${message}
    `;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Draft-Management-Funktionen
function checkForDrafts() {
    const draftKey = 'blogpost_draft_content';
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
        if (confirm('Es wurde ein gespeicherter Entwurf gefunden. Möchten Sie ihn wiederherstellen?')) {
            const draftData = JSON.parse(savedDraft);
            document.getElementById('title').value = draftData.title || '';
            document.getElementById('tags').value = draftData.tags || '';
            // TinyMCE wird den Inhalt automatisch wiederherstellen
            showNotification('Entwurf wiederhergestellt', 'success');
            updatePreview();
        }
    }
}

function saveDraft() {
    if (!tinymce.get('content')) {
        return; // Editor noch nicht initialisiert
    }
    
    const title = document.getElementById('title').value;
    const content = tinymce.get('content').getContent();
    const tags = document.getElementById('tags').value;
    
    const draftData = {
        title: title,
        content: content,
        tags: tags,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('blogpost_draft_content', JSON.stringify(draftData));
}

function clearDraft() {
    localStorage.removeItem('blogpost_draft_content');
    showNotification('Entwurf gelöscht', 'info');
}

// Template-Funktionen
function insertTemplate(template) {
    const templates = {
        'blog-post': `
            <h1>Titel des Blogposts</h1>
            <p><em>Einleitungstext, der die Leser neugierig macht...</em></p>
            
            <h2>Hauptteil</h2>
            <p>Hier entwickeln Sie Ihre Hauptargumente...</p>
            
            <blockquote>
                <p>Ein inspirierendes Zitat oder eine wichtige Aussage.</p>
            </blockquote>
            
            <h2>Fazit</h2>
            <p>Zusammenfassung und Schlussfolgerungen...</p>
        `,
        'philosophy': `
            <h1>Philosophische Betrachtung</h1>
            <p><em>Sub specie aeternitatis - unter dem Gesichtspunkt der Ewigkeit</em></p>
            
            <h2>These</h2>
            <p>Formulierung der zentralen philosophischen These...</p>
            
            <h2>Argumentation</h2>
            <p>Entwicklung der Argumente...</p>
            
            <h2>Einwände und Diskussion</h2>
            <p>Auseinandersetzung mit möglichen Gegenargumenten...</p>
            
            <h2>Schlussfolgerung</h2>
            <p>Zusammenfassung und weiterführende Gedanken...</p>
        `,
        'science': `
            <h1>Wissenschaftliche Erörterung</h1>
            <p><em>Einführung in das Thema...</em></p>
            
            <h2>Hintergrund</h2>
            <p>Kontext und bisherige Forschung...</p>
            
            <h2>Methodik</h2>
            <p>Herangehensweise und Methoden...</p>
            
            <h2>Ergebnisse</h2>
            <p>Darstellung der Erkenntnisse...</p>
            
            <h2>Diskussion</h2>
            <p>Interpretation und Bedeutung...</p>
            
            <h2>Ausblick</h2>
            <p>Zukünftige Entwicklungen und Forschungsrichtungen...</p>
        `
    };
    
    if (templates[template]) {
        tinymce.get('content').setContent(templates[template]);
        updatePreview();
        showNotification('Vorlage eingefügt', 'success');
    }
}

// Tag-Funktionen
function addTag(tagName) {
    const tagsInput = document.getElementById('tags');
    const currentTags = tagsInput.value;
    
    if (currentTags === '') {
        tagsInput.value = tagName;
    } else if (!currentTags.split(',').map(t => t.trim()).includes(tagName)) {
        tagsInput.value = currentTags + ', ' + tagName;
    }
    
    updatePreview();
    saveDraft();
}

// Vorschau-Funktionen
function updatePreview() {
    const title = document.getElementById('title').value;
    const content = tinymce.get('content') ? tinymce.get('content').getContent() : '';
    const tags = document.getElementById('tags').value;
    
    const previewBox = document.getElementById('preview-content');
    
    if (!title && !content) {
        previewBox.innerHTML = '<p class="preview-placeholder">Die Vorschau wird hier angezeigt, sobald du schreibst...</p>';
        return;
    }
    
    let previewHtml = '';
    
    if (title) {
        previewHtml += `<h2 class="preview-post-title">${title}</h2>`;
    }
    
    if (content) {
        previewHtml += `<div class="preview-post-content">${content}</div>`;
    }
    
    if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        if (tagArray.length > 0) {
            previewHtml += `
                <div class="preview-tags">
                    🏷️ ${tagArray.map(tag => `<span class="preview-tag">${tag}</span>`).join(' ')}
                </div>
            `;
        }
    }
    
    previewBox.innerHTML = previewHtml;
}

let previewVisible = true;
function togglePreview() {
    const preview = document.querySelector('.form-preview');
    previewVisible = !previewVisible;
    preview.style.display = previewVisible ? 'block' : 'none';
    
    const toggleBtn = document.querySelector('.btn-outline-info');
    toggleBtn.innerHTML = previewVisible ? 
        '<span class="btn-icon">👁️</span> Vorschau verbergen' : 
        '<span class="btn-icon">👁️</span> Vorschau anzeigen';
}

// Formular-Funktionen
function resetForm() {
    if (confirm('Möchtest du wirklich alle Eingaben zurücksetzen?')) {
        document.getElementById('blogPostForm').reset();
        if (tinymce.get('content')) {
            tinymce.get('content').setContent('');
        }
        updatePreview();
        clearDraft();
        showNotification('Formular zurückgesetzt', 'info');
    }
}

// Initialisierung und Event Listener
function initializeBlogEditor() {
    console.log('🎬 initializeBlogEditor() aufgerufen');
    
    // TinyMCE initialisieren
    console.log('📝 Rufe initializeTinyMCE() auf...');
    initializeTinyMCE();
    
    // Event Listener für Titel und Tags
    const titleElement = document.getElementById('title');
    const tagsElement = document.getElementById('tags');
    
    if (titleElement) {
        console.log('✅ Title-Element gefunden, füge Event Listener hinzu');
        titleElement.addEventListener('input', function() {
            updatePreview();
            saveDraft();
        });
    } else {
        console.error('❌ Title-Element nicht gefunden');
    }
    
    if (tagsElement) {
        console.log('✅ Tags-Element gefunden, füge Event Listener hinzu');
        tagsElement.addEventListener('input', function() {
            updatePreview();
            saveDraft();
        });
    } else {
        console.error('❌ Tags-Element nicht gefunden');
    }
    
    console.log('✅ Blog Editor erfolgreich initialisiert');
}
