# Guía de Personalización Avanzada - Flipbook

## 🎨 Personalización de Estilos

### Cambiar colores del tema

Edita `styles/flipbook.css`:

```css
/* Cambiar el gradiente de los botones */
.flipbook-btn {
    /* Tu gradiente personalizado */
    background: linear-gradient(135deg, #FF6B6B 0%, #FFE66D 100%);
}

.flipbook-btn:hover {
    background: linear-gradient(135deg, #FFE66D 0%, #FF6B6B 100%);
}

/* Cambiar color del borde de entrada */
#page-input {
    border: 2px solid #FF6B6B;
}

/* Cambiar color del spinner de carga */
#loading-message i {
    color: #FF6B6B;
}
```

### Temas predefinidos

**Tema Oscuro:**
```css
#flipbook-container {
    background: #2d2d2d;
}

#flipbook-toolbar,
#flipbook-controls {
    background: #1a1a1a;
    border-color: #404040;
}

#flipbook-viewer {
    background: #1a1a1a;
}

#page-info,
#total-pages {
    color: #ffffff;
}
```

**Tema Minimalista:**
```css
#flipbook-container {
    background: transparent;
    box-shadow: none;
}

.flipbook-btn {
    background: #ffffff;
    color: #333;
    border: 1px solid #ddd;
}

.flipbook-btn:hover {
    background: #f5f5f5;
}
```

## 🔧 Configuración JavaScript

### Cambiar velocidad de animación

Edita `amd/src/flipbook.js`, línea ~75:

```javascript
$('#flipbook').turn({
    width: width * 2,
    height: height,
    autoCenter: true,
    acceleration: true,
    elevation: 50,
    gradients: true,
    duration: 800  // Cambia a 600 para más rápido, 1200 para más lento
});
```

### Ajustar calidad de renderizado

Línea ~65:

```javascript
function renderPage(pageNum) {
    return pdfDoc.getPage(pageNum).then(function(page) {
        var scale = 2.0; // Aumenta para mejor calidad (más memoria)
        // 1.0 = baja calidad, rápido
        // 1.5 = media calidad (predeterminado)
        // 2.0 = alta calidad, más lento
        // 3.0 = muy alta calidad, requiere mucha memoria
```

### Cambiar efecto de sombra

Línea ~72:

```javascript
$('#flipbook').turn({
    // ...
    elevation: 100,  // 0-100, mayor = sombra más pronunciada
    gradients: true, // false para sin gradientes
});
```

## 🔄 Usar biblioteca alternativa a turn.js

Si prefieres usar **page-flip** (MIT License, gratis):

### 1. Descargar page-flip

```bash
cd mod/flipbook/js/
wget https://raw.githubusercontent.com/Nodlik/StPageFlip/master/dist/page-flip.browser.min.js
```

### 2. Reemplazar código JavaScript

Crea nuevo archivo `amd/src/flipbook-pageflip.js`:

```javascript
define(['jquery'], function($) {
    return {
        init: function(config) {
            $(document).ready(function() {
                var pdfUrl = config.pdfUrl;
                
                pdfjsLib.GlobalWorkerOptions.workerSrc = M.cfg.wwwroot + '/mod/flipbook/js/pdf.worker.min.js';
                
                var loadingTask = pdfjsLib.getDocument(pdfUrl);
                var pageFlip;
                
                loadingTask.promise.then(function(pdf) {
                    var totalPages = pdf.numPages;
                    var promises = [];
                    
                    for (var i = 1; i <= totalPages; i++) {
                        promises.push(renderPage(pdf, i));
                    }
                    
                    return Promise.all(promises).then(function(images) {
                        $('#loading-message').hide();
                        
                        // Inicializar page-flip
                        pageFlip = new St.PageFlip(
                            document.getElementById('flipbook'),
                            {
                                width: config.width,
                                height: config.height,
                                size: 'fixed',
                                minWidth: 315,
                                maxWidth: 1000,
                                minHeight: 420,
                                maxHeight: 1350,
                                maxShadowOpacity: 0.5,
                                showCover: true,
                                mobileScrollSupport: true
                            }
                        );
                        
                        pageFlip.loadFromImages(images);
                        
                        setupControls(pageFlip, totalPages);
                    });
                });
                
                function renderPage(pdf, pageNum) {
                    return pdf.getPage(pageNum).then(function(page) {
                        var scale = 1.5;
                        var viewport = page.getViewport({scale: scale});
                        var canvas = document.createElement('canvas');
                        var context = canvas.getContext('2d');
                        
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        return page.render({
                            canvasContext: context,
                            viewport: viewport
                        }).promise.then(function() {
                            return canvas.toDataURL('image/png');
                        });
                    });
                }
                
                function setupControls(pageFlip, totalPages) {
                    $('#prev-page').on('click', function() {
                        pageFlip.flipPrev();
                    });
                    
                    $('#next-page').on('click', function() {
                        pageFlip.flipNext();
                    });
                    
                    pageFlip.on('flip', function(e) {
                        $('#page-input').val(e.data + 1);
                        $('#total-pages').text(' / ' + totalPages);
                    });
                }
            });
        }
    };
});
```

### 3. Actualizar view.php

Cambia la línea:
```php
$PAGE->requires->js('/mod/flipbook/js/turn.min.js', true);
```

Por:
```php
$PAGE->requires->js('/mod/flipbook/js/page-flip.browser.min.js', true);
```

Y:
```php
$PAGE->requires->js_call_amd('mod_flipbook/flipbook', 'init', ...);
```

Por:
```php
$PAGE->requires->js_call_amd('mod_flipbook/flipbook-pageflip', 'init', ...);
```

## 🎯 Agregar funcionalidades personalizadas

### Agregar sonido al girar páginas

1. Descarga un sonido de página (ej: `page-flip.mp3`)
2. Guárdalo en `mod/flipbook/sounds/`
3. En `amd/src/flipbook.js`, agrega:

```javascript
// Después de inicializar turn.js
var pageSound = new Audio(M.cfg.wwwroot + '/mod/flipbook/sounds/page-flip.mp3');

$('#flipbook').bind('turning', function(event, page, view) {
    pageSound.currentTime = 0;
    pageSound.play();
    updatePageInfo();
});
```

### Agregar búsqueda de texto

En `view.php`, agrega después de la toolbar:

```php
<div id="search-container" style="padding: 10px; text-align: center;">
    <input type="text" id="search-text" placeholder="Buscar en el documento..." 
           style="width: 300px; padding: 8px; border: 2px solid #667eea; border-radius: 5px;" />
    <button id="search-btn" class="flipbook-btn">Buscar</button>
</div>
```

En JavaScript:

```javascript
$('#search-btn').on('click', function() {
    var searchTerm = $('#search-text').val();
    // Implementa búsqueda usando PDF.js textContent
    searchInPDF(searchTerm);
});
```

### Agregar marcadores/favoritos

Agrega tabla en `db/install.xml`:

```xml
<TABLE NAME="flipbook_bookmarks">
    <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="flipbookid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="userid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="page" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="timecreated" TYPE="int" LENGTH="10" NOTNULL="true"/>
    </FIELDS>
</TABLE>
```

## 📊 Agregar estadísticas de lectura

### Tracking de páginas vistas

1. Crea tabla en `db/install.xml`:

```xml
<TABLE NAME="flipbook_tracking">
    <FIELDS>
        <FIELD NAME="id" TYPE="int" LENGTH="10" NOTNULL="true" SEQUENCE="true"/>
        <FIELD NAME="flipbookid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="userid" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="page" TYPE="int" LENGTH="10" NOTNULL="true"/>
        <FIELD NAME="timespent" TYPE="int" LENGTH="10" NOTNULL="true" DEFAULT="0"/>
        <FIELD NAME="timeaccessed" TYPE="int" LENGTH="10" NOTNULL="true"/>
    </FIELDS>
</TABLE>
```

2. En JavaScript, agrega:

```javascript
var pageStartTime = Date.now();

$('#flipbook').bind('turned', function(event, page, view) {
    var timeSpent = Math.floor((Date.now() - pageStartTime) / 1000);
    
    // Enviar a servidor vía AJAX
    $.ajax({
        url: M.cfg.wwwroot + '/mod/flipbook/ajax/track.php',
        method: 'POST',
        data: {
            flipbookid: <?php echo $flipbook->id; ?>,
            page: page,
            timespent: timeSpent
        }
    });
    
    pageStartTime = Date.now();
});
```

3. Crea `ajax/track.php`:

```php
<?php
require_once('../../../config.php');

$flipbookid = required_param('flipbookid', PARAM_INT);
$page = required_param('page', PARAM_INT);
$timespent = required_param('timespent', PARAM_INT);

require_login();

$record = new stdClass();
$record->flipbookid = $flipbookid;
$record->userid = $USER->id;
$record->page = $page;
$record->timespent = $timespent;
$record->timeaccessed = time();

$DB->insert_record('flipbook_tracking', $record);

echo json_encode(['success' => true]);
```

## 🌐 Integración con otros plugins

### Integrar con mod_quiz

Agrega preguntas al final de secciones específicas.

### Integrar con completion

Marca como completado cuando se leen todas las páginas:

En `lib.php`:

```php
function flipbook_get_completion_state($course, $cm, $userid, $type) {
    global $DB;
    
    $flipbook = $DB->get_record('flipbook', array('id' => $cm->instance));
    
    // Verificar si el usuario vio todas las páginas
    $sql = "SELECT COUNT(DISTINCT page) 
            FROM {flipbook_tracking} 
            WHERE flipbookid = ? AND userid = ?";
    
    $pagesviewed = $DB->count_records_sql($sql, array($flipbook->id, $userid));
    
    // Obtener total de páginas del PDF
    // (necesitarías almacenar esto en la tabla flipbook)
    
    return $pagesviewed >= $flipbook->totalpages;
}
```

## 🔐 Seguridad adicional

### Prevenir descarga del PDF

En `view.php`, elimina:

```php
<button id="download-pdf" ...>
```

Y en `lib.php`, en `flipbook_pluginfile()`:

```php
// Verificar rol antes de servir archivo
$context = context_module::instance($cm->id);
if (!has_capability('mod/flipbook:download', $context)) {
    return false;
}
```

Agrega capacidad en `db/access.php`:

```php
'mod/flipbook:download' => array(
    'captype' => 'read',
    'contextlevel' => CONTEXT_MODULE,
    'archetypes' => array(
        'teacher' => CAP_ALLOW,
        'editingteacher' => CAP_ALLOW,
        'manager' => CAP_ALLOW
    )
),
```

### Marca de agua

Agrega marca de agua con nombre del usuario en cada página (JavaScript):

```javascript
function addWatermark(canvas, username) {
    var ctx = canvas.getContext('2d');
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.rotate(-45 * Math.PI / 180);
    ctx.fillText(username, 50, canvas.height / 2);
    ctx.rotate(45 * Math.PI / 180);
}
```

## 📱 Optimización móvil

### Gestos táctiles mejorados

```javascript
// Agregar soporte para gestos de deslizamiento
var touchStartX = 0;
var touchEndX = 0;

$('#flipbook-viewer').on('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
});

$('#flipbook-viewer').on('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    if (touchEndX < touchStartX - 50) {
        $('#flipbook').turn('next');
    }
    if (touchEndX > touchStartX + 50) {
        $('#flipbook').turn('previous');
    }
}
```

¡Con estas personalizaciones puedes adaptar el plugin completamente a tus necesidades!
