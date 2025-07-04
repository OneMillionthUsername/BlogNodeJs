// TinyMCE Editor Konfiguration und Funktionen
// Diese Datei enthält alle TinyMCE-spezifischen Funktionen für create.html

console.log('🔧 TinyMCE Editor Modul geladen');

// TinyMCE API-Schlüssel Konfiguration
const TINYMCE_CONFIG = {
    apiKey: '', // Wird vom Admin gesetzt
    defaultKey: 'no-api-key' // Fallback für Development
};

// TinyMCE API-Schlüssel laden
function loadTinyMceApiKey() {
    const savedKey = localStorage.getItem('tinymce_api_key');
    if (savedKey) {
        TINYMCE_CONFIG.apiKey = savedKey;
        console.log('✅ TinyMCE API-Schlüssel aus localStorage geladen');
    } else {
        console.log('⚠️ Kein TinyMCE API-Schlüssel gesetzt - verwende Development-Modus');
    }
}

// TinyMCE API-Schlüssel speichern
function saveTinyMceApiKey(apiKey) {
    localStorage.setItem('tinymce_api_key', apiKey);
    TINYMCE_CONFIG.apiKey = apiKey;
    console.log('💾 TinyMCE API-Schlüssel gespeichert');
}

// TinyMCE API-Schlüssel Setup-Dialog
function showTinyMceApiKeySetup() {
    const currentKey = TINYMCE_CONFIG.apiKey;
    const message = 
        `TinyMCE API-Schlüssel Setup:\n\n` +
        `1. Gehe zu: https://www.tiny.cloud/\n` +
        `2. Registriere dich (kostenlos für den Basis-Plan)\n` +
        `3. Kopiere deinen API-Schlüssel\n` +
        `4. Füge ihn hier ein\n\n` +
        `Aktueller Schlüssel: ${currentKey ? 'Gesetzt ✅' : 'Nicht gesetzt ❌'}\n\n` +
        `Neuen API-Schlüssel eingeben:`;
    
    const newKey = prompt(message, currentKey || '');
    if (newKey && newKey.trim()) {
        saveTinyMceApiKey(newKey.trim());
        alert('TinyMCE API-Schlüssel wurde gespeichert!\nBitte laden Sie die Seite neu.');
        return true;
    }
    return false;
}

// TinyMCE dynamisch laden
async function loadTinyMceScript() {
    // Prüfen ob TinyMCE bereits geladen ist
    if (typeof tinymce !== 'undefined') {
        console.log('✅ TinyMCE bereits geladen');
        return true;
    }
    
    const apiKey = TINYMCE_CONFIG.apiKey || TINYMCE_CONFIG.defaultKey;
    const scriptUrl = `https://cdn.tiny.cloud/1/${apiKey}/tinymce/6/tinymce.min.js`;
    
    console.log('📥 Lade TinyMCE Script:', scriptUrl);
    
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = scriptUrl;
        script.referrerPolicy = 'origin';
        
        script.onload = () => {
            console.log('✅ TinyMCE Script erfolgreich geladen');
            resolve(true);
        };
        
        script.onerror = () => {
            console.error('❌ Fehler beim Laden des TinyMCE Scripts');
            reject(false);
        };
        
        document.head.appendChild(script);
    });
}

// TinyMCE Editor initialisieren
async function initializeTinyMCE() {
    console.log('🚀 initializeTinyMCE() aufgerufen');
    
    // Prüfen ob das Element existiert
    const contentElement = document.getElementById('content');
    if (!contentElement) {
        console.error('❌ TinyMCE: Content-Element #content nicht gefunden');
        return;
    }
    console.log('✅ Content-Element gefunden:', contentElement);
    
    // TinyMCE Script laden falls noch nicht verfügbar
    if (typeof tinymce === 'undefined') {
        console.log('📥 TinyMCE nicht verfügbar - lade Script...');
        try {
            await loadTinyMceScript();
        } catch (error) {
            console.error('❌ TinyMCE Script konnte nicht geladen werden:', error);
            
            // Fallback: API-Schlüssel Setup anbieten
            const setupNow = confirm(
                'TinyMCE konnte nicht geladen werden.\n\n' +
                'Möglicherweise ist kein gültiger API-Schlüssel gesetzt.\n\n' +
                'Möchten Sie jetzt den API-Schlüssel konfigurieren?'
            );
            
            if (setupNow) {
                showTinyMceApiKeySetup();
            }
            return;
        }
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
        
        // Bild-Upload-Konfiguration (Server-basiert mit Komprimierung)
        images_upload_handler: function(blobInfo, success, failure, progress) {
            console.log('📸 Lade Bild hoch:', blobInfo.filename());
            
            // Progress-Callback für Upload-Fortschritt
            if (progress) {
                progress(0);
            }
            
            // Bild komprimieren und hochladen
            compressAndUploadImage(blobInfo, success, failure, progress);
        },
        
        // Erweiterte Upload-Einstellungen
        images_upload_url: '/upload/image',
        images_upload_base_path: '/assets/uploads/',
        images_upload_credentials: false,
        file_picker_types: 'image',
        
        // Datei-Validierung
        images_file_types: 'jpg,jpeg,png,gif,webp,svg',
        
        // Drag & Drop Konfiguration
        paste_data_images: true,
        images_dataimg_filter: function(img) {
            // Filtere nur erlaubte Bildtypen
            return img.src.indexOf('data:image/') === 0;
        },
        
        // Automatische Upload-Funktionen
        automatic_uploads: true,
        images_reuse_filename: false,
        
        // Upload-Handler für verschiedene Szenarien
        file_picker_callback: function(callback, value, meta) {
            if (meta.filetype === 'image') {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                
                input.onchange = function() {
                    const file = this.files[0];
                    
                    // Größe prüfen (max 25MB vor Komprimierung)
                    if (file.size > 25 * 1024 * 1024) {
                        showNotification('Bild ist zu groß (max. 25MB). Bitte wählen Sie ein kleineres Bild.', 'error');
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onload = function() {
                        // Bild über Standard-Upload-Handler hochladen
                        const blobInfo = {
                            blob: () => file,
                            filename: () => file.name
                        };
                        
                        compressAndUploadImage(
                            blobInfo,
                            function(url) {
                                callback(url, { alt: file.name });
                            },
                            function(error) {
                                showNotification('Fehler beim Hochladen: ' + error, 'error');
                            },
                            function(progress) {
                                console.log('Upload-Fortschritt:', progress + '%');
                            }
                        );
                    };
                    reader.readAsDataURL(file);
                };
                
                input.click();
            }
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
                // Drag & Drop initialisieren
                setTimeout(initializeDragAndDrop, 500);
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
            
            // Bild-Upload Events
            editor.on('BeforeUpload', function() {
                console.log('🔄 Bild-Upload startet...');
                showNotification('Lade Bild hoch...', 'info');
            });
            
            editor.on('UploadComplete', function() {
                console.log('✅ Bild-Upload abgeschlossen');
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
        top: 60px;
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

// Erweiterte Bild-Management-Funktionen

// Alle hochgeladenen Bilder auflisten (für Admin)
async function listUploadedImages() {
    try {
        const response = await fetch('/api/images');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('Fehler beim Laden der Bilderliste:', error);
        return [];
    }
}

// Bild löschen (Admin-only)
async function deleteUploadedImage(filename) {
    if (!window.checkAdminStatus || !window.checkAdminStatus()) {
        alert('Nur Administratoren können Bilder löschen.');
        return false;
    }
    
    if (!confirm(`Möchten Sie das Bild "${filename}" wirklich löschen?`)) {
        return false;
    }
    
    try {
        const response = await fetch(`/assets/uploads/${filename}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Unbekannter Fehler');
        }
        
        const result = await response.json();
        showNotification(`Bild "${filename}" erfolgreich gelöscht.`, 'info');
        return true;
    } catch (error) {
        console.error('Fehler beim Löschen des Bildes:', error);
        alert('Fehler beim Löschen: ' + error.message);
        return false;
    }
}

// Drag & Drop für Bilder im Editor
function initializeDragAndDrop() {
    const editor = tinymce.get('content');
    if (!editor) return;
    
    // Drag & Drop Events
    editor.on('dragover', function(e) {
        e.preventDefault();
        editor.getContainer().style.borderColor = '#3498db';
    });
    
    editor.on('dragleave', function(e) {
        e.preventDefault();
        editor.getContainer().style.borderColor = '';
    });
    
    editor.on('drop', function(e) {
        e.preventDefault();
        editor.getContainer().style.borderColor = '';
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            Array.from(files).forEach(file => {
                if (file.type.startsWith('image/')) {
                    // TinyMCE wird automatisch den Upload-Handler aufrufen
                    console.log('📸 Bild via Drag & Drop:', file.name);
                }
            });
        }
    });
}

// Bild-Galerie für den Editor (erweiterte Funktion)
function showImageGallery() {
    if (!window.checkAdminStatus || !window.checkAdminStatus()) {
        alert('Nur Administratoren können die Bildergalerie verwenden.');
        return;
    }
    
    // Hier könnte eine Modal-Galerie implementiert werden
    // Für jetzt: einfacher Platzhalter
    alert('Bildergalerie wird in einer zukünftigen Version implementiert.');
}

// Bild-Komprimierung und Upload-Funktion
async function compressAndUploadImage(blobInfo, success, failure, progress) {
    try {
        const blob = blobInfo.blob();
        const filename = blobInfo.filename() || 'upload.jpg';
        const originalSize = blob.size / 1024 / 1024; // MB
        
        console.log(`📸 Komprimiere Bild: ${filename} (${originalSize.toFixed(2)} MB)`);
        
        // Bildvalidierung vor Upload
        try {
            validateImageBeforeUpload(blob);
        } catch (validationError) {
            failure(validationError.message, { remove: true });
            showNotification(`❌ ${validationError.message}`, 'error');
            return;
        }
        
        if (progress) {
            progress(10);
        }
        
        // Intelligente Komprimierung basierend auf Dateigröße
        let quality = 0.9;
        let maxWidth = 1920;
        let maxHeight = 1080;
        
        if (originalSize > 10) {
            quality = 0.6;
            maxWidth = 1280;
            maxHeight = 720;
        } else if (originalSize > 5) {
            quality = 0.7;
            maxWidth = 1600;
            maxHeight = 900;
        } else if (originalSize > 2) {
            quality = 0.8;
        }
        
        console.log(`🎯 Komprimierungseinstellungen: Qualität ${quality}, Max-Größe ${maxWidth}x${maxHeight}`);
        
        // Bild komprimieren
        const compressedBase64 = await compressImage(blob, quality, maxWidth, maxHeight);
        
        if (progress) {
            progress(30);
        }
        
        // Komprimierungsrate berechnen
        const compressedSize = compressedBase64.length * 0.75 / 1024 / 1024; // Ungefähre Größe nach Base64-Dekodierung
        const compressionRate = ((originalSize - compressedSize) / originalSize * 100);
        
        console.log(`🗜️ Bild komprimiert: ${originalSize.toFixed(2)} MB → ${compressedSize.toFixed(2)} MB (${compressionRate.toFixed(1)}% Reduktion)`);
        
        // Fallback: Wenn das Bild immer noch zu groß ist, aggressiver komprimieren
        let finalBase64 = compressedBase64;
        if (compressedSize > 40) { // Mehr als 40MB nach Komprimierung
            console.log('⚠️ Bild immer noch sehr groß - verwende aggressive Komprimierung...');
            finalBase64 = await compressImage(blob, 0.4, 1024, 768);
            
            if (progress) {
                progress(40);
            }
        }
        
        // Zu Server senden mit Retry-Logik - übergebe das ursprüngliche Blob für weitere Komprimierung
        await uploadWithRetry(finalBase64, filename, blob, success, failure, progress);
        
    } catch (error) {
        console.error('❌ Fehler beim Hochladen des Bildes:', error);
        await handleUploadError(error, blobInfo, success, failure);
    }
}

// Vereinfachte Upload-Fehlerbehandlung (hauptsächlich für nicht-komprimierbare Fehler)
async function handleUploadError(error, blobInfo, success, failure) {
    const filename = blobInfo.filename() || 'upload.jpg';
    
    console.error(`❌ Upload-Fehler für ${filename}:`, error);
    
    // Spezifische Fehlerbehandlung für verschiedene Fehlertypen
    if (error.message.includes('Network') || error.message.includes('fetch')) {
        failure('Netzwerkfehler beim Upload. Bitte prüfen Sie Ihre Internetverbindung.', { remove: true });
        showNotification('❌ Netzwerkfehler beim Upload - bitte Internetverbindung prüfen', 'error');
    } else if (error.message.includes('500')) {
        failure('Server-Fehler beim Upload. Bitte versuchen Sie es später erneut.', { remove: true });
        showNotification('❌ Server-Fehler beim Upload - bitte später versuchen', 'error');
    } else if (error.message.includes('413') || error.message.includes('Payload Too Large')) {
        failure('Bild ist zu groß. Bitte verwenden Sie ein kleineres Bild (empfohlen: < 2MB).', { remove: true });
        showNotification('❌ Bild zu groß - bitte verwenden Sie ein kleineres Bild', 'error');
    } else if (error.message.includes('400')) {
        failure('Ungültiges Bildformat. Unterstützt werden: JPG, PNG, GIF, WebP.', { remove: true });
        showNotification('❌ Ungültiges Bildformat', 'error');
    } else {
        failure('Unbekannter Fehler beim Upload: ' + error.message, { remove: true });
        showNotification('❌ Upload-Fehler: ' + error.message, 'error');
    }
}

// Upload-Fortschritts-Anzeige
function showUploadProgress(filename, progress) {
    let progressContainer = document.getElementById('upload-progress');
    
    if (!progressContainer) {
        progressContainer = document.createElement('div');
        progressContainer.id = 'upload-progress';
        progressContainer.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            z-index: 10000;
            background: white;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            min-width: 300px;
        `;
        document.body.appendChild(progressContainer);
    }
    
    progressContainer.innerHTML = `
        <div class="upload-item">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
                <i class="fas fa-upload" style="margin-right: 10px; color: #3498db;"></i>
                <span style="font-weight: 500;">${filename}</span>
            </div>
            <div class="progress" style="height: 8px; background-color: #f0f0f0; border-radius: 4px;">
                <div class="progress-bar" style="
                    width: ${progress}%; 
                    height: 100%; 
                    background-color: #3498db; 
                    border-radius: 4px;
                    transition: width 0.3s ease;
                "></div>
            </div>
            <div style="text-align: center; margin-top: 5px; font-size: 12px; color: #666;">
                ${progress}% hochgeladen
            </div>
        </div>
    `;
    
    if (progress >= 100) {
        setTimeout(() => {
            if (progressContainer.parentNode) {
                progressContainer.parentNode.removeChild(progressContainer);
            }
        }, 2000);
    }
}

// Bild-Komprimierungsfunktion
function compressImage(file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = function() {
            // Berechne neue Dimensionen unter Beibehaltung des Seitenverhältnisses
            let { width, height } = img;
            
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width *= ratio;
                height *= ratio;
            }
            
            // Canvas-Größe setzen
            canvas.width = width;
            canvas.height = height;
            
            // Bild auf Canvas zeichnen
            ctx.drawImage(img, 0, 0, width, height);
            
            // Als komprimiertes Base64 ausgeben
            try {
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            } catch (error) {
                reject(new Error('Fehler bei der Bild-Komprimierung: ' + error.message));
            }
        };
        
        img.onerror = function() {
            reject(new Error('Fehler beim Laden des Bildes für die Komprimierung'));
        };
        
        // FileReader für Blob-zu-Image Konvertierung
        const reader = new FileReader();
        reader.onload = function(e) {
            img.src = e.target.result;
        };
        reader.onerror = function() {
            reject(new Error('Fehler beim Lesen der Bilddatei'));
        };
        reader.readAsDataURL(file);
    });
}

// Upload mit Retry-Logik und progressiver Komprimierung
async function uploadWithRetry(base64Data, filename, originalBlob, success, failure, progress, attempt = 1) {
    const maxAttempts = 3;
    
    try {
        console.log(`📤 Upload-Versuch ${attempt}/${maxAttempts} für: ${filename}`);
        
        const response = await fetch('/upload/image', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                imageData: base64Data,
                filename: filename
            })
        });
        
        if (progress) {
            progress(50 + (attempt * 15));
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        
        if (progress) {
            progress(100);
        }
        
        console.log('✅ Bild erfolgreich hochgeladen:', result);
        success(result.location || result.url);
        showNotification(`Bild "${result.filename}" erfolgreich hochgeladen! 📸`, 'success');
        
    } catch (error) {
        console.error(`❌ Upload-Versuch ${attempt} fehlgeschlagen:`, error);
        
        // Bei 413 (Payload Too Large) oder ähnlichen Größen-Fehlern und wenn noch Versuche übrig sind
        if ((error.message.includes('413') || error.message.includes('Payload Too Large') || error.message.includes('entity too large')) && attempt < maxAttempts) {
            
            // Progressive Komprimierungseinstellungen für weitere Versuche
            const compressionSettings = [
                { quality: 0.6, width: 1280, height: 720 },  // Versuch 2
                { quality: 0.4, width: 1024, height: 576 },  // Versuch 3
            ];
            
            const settings = compressionSettings[attempt - 1];
            
            showNotification(`Bild zu groß - versuche stärkere Komprimierung (${Math.round(settings.quality * 100)}% Qualität)...`, 'info');
            
            try {
                // Mit dem ursprünglichen Blob neu komprimieren
                const newCompressed = await compressImage(
                    originalBlob, 
                    settings.quality, 
                    settings.width, 
                    settings.height
                );
                
                // Neue Größe berechnen und loggen
                const newSize = newCompressed.length * 0.75 / 1024 / 1024;
                console.log(`🗜️ Erneut komprimiert zu ${newSize.toFixed(2)} MB mit ${Math.round(settings.quality * 100)}% Qualität`);
                
                return await uploadWithRetry(newCompressed, filename, originalBlob, success, failure, progress, attempt + 1);
                
            } catch (compressionError) {
                console.error('Fehler bei der Rekomprimierung:', compressionError);
                failure(`Komprimierungsfehler: ${compressionError.message}`, { remove: true });
                showNotification('❌ Fehler bei der Bildkomprimierung', 'error');
                return;
            }
        } else {
            // Maximale Versuche erreicht oder anderer Fehler
            let errorMessage;
            
            if (error.message.includes('413') || error.message.includes('Payload Too Large') || error.message.includes('entity too large')) {
                errorMessage = 'Bild ist auch nach maximaler Komprimierung zu groß. Bitte verwenden Sie ein kleineres Bild (empfohlen: < 2MB)';
            } else if (error.message.includes('Network') || error.message.includes('fetch')) {
                errorMessage = 'Netzwerkfehler beim Upload. Bitte prüfen Sie Ihre Internetverbindung.';
            } else if (error.message.includes('500')) {
                errorMessage = 'Server-Fehler beim Upload. Bitte versuchen Sie es später erneut.';
            } else {
                errorMessage = `Upload-Fehler: ${error.message}`;
            }
            
            failure(errorMessage, { remove: true });
            showNotification(`❌ ${errorMessage}`, 'error');
        }
    }
}

// Bildvalidierung vor dem Upload
function validateImageBeforeUpload(file) {
    const maxSize = 100 * 1024 * 1024; // 100MB absolutes Maximum
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (file.size > maxSize) {
        throw new Error(`Bild ist zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: 100MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
        throw new Error(`Ungültiger Dateityp: ${file.type}. Unterstützt: JPG, PNG, GIF, WebP`);
    }
    
    return true;
}

// Initialisierung und Event Listener
async function initializeBlogEditor() {
    console.log('🎬 initializeBlogEditor() aufgerufen');
    
    // API-Schlüssel laden
    loadTinyMceApiKey();
    
    // TinyMCE initialisieren
    console.log('📝 Rufe initializeTinyMCE() auf...');
    await initializeTinyMCE();
    
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

// Globale Funktionen für TinyMCE Setup verfügbar machen
window.showTinyMceApiKeySetup = showTinyMceApiKeySetup;
