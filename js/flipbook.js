// Usar jQuery de Moodle (modo no-conflict)
(function($) {
    'use strict';
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    let pdfDoc = null;
    let pageNum = 1;
    let totalPages = 0;
    const scale = 1.5;
    let isFullscreen = false;
    let normalDimensions = {};
    let multimediaMode = false;
    let hotspots = [];
    let currentAudio = null;
    let playingHotspotId = null;

    console.log('=== FLIPBOOK DEBUG ===');
    console.log('jQuery loaded:', typeof $ !== 'undefined');
    console.log('jQuery version:', $.fn ? $.fn.jquery : 'N/A');
    console.log('Turn.js loaded:', typeof $.fn.turn !== 'undefined');
    console.log('PDF.js loaded:', typeof pdfjsLib !== 'undefined');
    console.log('PDF URL:', typeof pdfUrl !== 'undefined' ? pdfUrl : 'UNDEFINED');
    console.log('Can manage multimedia:', typeof canManageMultimedia !== 'undefined' ? canManageMultimedia : false);

    // Verificar que todas las dependencias estén cargadas
    function checkDependencies() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkInterval = setInterval(() => {
                attempts++;
                
                if (typeof $ !== 'undefined' && typeof $.fn.turn !== 'undefined') {
                    console.log('✓ All dependencies loaded successfully (attempt ' + attempts + ')');
                    clearInterval(checkInterval);
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.error('Failed after ' + attempts + ' attempts');
                    clearInterval(checkInterval);
                    reject(new Error('Failed to load dependencies (jQuery or Turn.js)'));
                } else {
                    if (attempts % 10 === 0) {
                        console.log('Waiting for dependencies... attempt ' + attempts);
                    }
                }
            }, 100);
        });
    }

    // Inicializar el flipbook solo cuando las dependencias estén listas
    checkDependencies().then(() => {
        console.log('Starting PDF load...');
        loadPDF();
    }).catch((error) => {
        console.error('Dependency error:', error);
        document.getElementById('flipbook-container').innerHTML = 
            '<p style="color:red;">Error: No se pudieron cargar las librerías necesarias (jQuery o Turn.js).</p>' +
            '<p>Por favor, verifica tu conexión a internet y recarga la página.</p>';
    });

    // Load PDF
    function loadPDF() {
        if (typeof pdfUrl === 'undefined') {
            console.error('pdfUrl is not defined!');
            document.getElementById('flipbook-container').innerHTML = 
                '<p style="color:red;">Error: PDF URL no está definida.</p>';
            return;
        }

        pdfjsLib.getDocument(pdfUrl).promise.then(function(pdf) {
            console.log('PDF loaded successfully. Total pages:', pdf.numPages);
            pdfDoc = pdf;
            totalPages = pdf.numPages;
            
            const flipbook = document.getElementById('flipbook');
            const renderPromises = [];
            
            // Render all pages
            for (let i = 1; i <= totalPages; i++) {
                renderPromises.push(renderPage(i));
            }
            
            Promise.all(renderPromises).then(function(canvases) {
                console.log('All pages rendered:', canvases.length);
                
                // Clear flipbook container
                flipbook.innerHTML = '';
                
                // Add pages to flipbook
                canvases.forEach(function(canvas, index) {
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'page';
                    pageDiv.setAttribute('data-page', index + 1);
                    pageDiv.appendChild(canvas);
                    flipbook.appendChild(pageDiv);
                    console.log('Added page', index + 1);
                });
                
                // Get dimensions from first canvas
                const firstCanvas = canvases[0];
                const pageWidth = Math.round(firstCanvas.width / scale);
                const pageHeight = Math.round(firstCanvas.height / scale);
                
                // Guardar dimensiones normales (más pequeñas - 70% del tamaño original)
                normalDimensions = {
                    width: Math.round(pageWidth * 2 * 0.7),
                    height: Math.round(pageHeight * 0.7)
                };
                
                console.log('Page dimensions:', pageWidth, 'x', pageHeight);
                console.log('Normal view dimensions:', normalDimensions.width, 'x', normalDimensions.height);
                
                setTimeout(function() {
                    try {
                        console.log('Initializing Turn.js...');
                        
                        // Initialize Turn.js with smaller dimensions
                        $('#flipbook').turn({
                            width: normalDimensions.width,
                            height: normalDimensions.height,
                            autoCenter: true,
                            gradients: true,
                            acceleration: true,
                            elevation: 50,
                            pages: totalPages,
                            display: 'double',
                            when: {
                                turning: function(event, page, pageObject) {
                                    console.log('Turning to page:', page);
                                    pageNum = page;
                                    updatePageInfo();
                                },
                                turned: function(event, page, pageObject) {
                                    console.log('Turned to page:', page);
                                    updateButtons();
                                    renderHotspots();
                                }
                            }
                        });
                        
                        console.log('✓ Turn.js initialized successfully');
                        
                        updatePageInfo();
                        updateButtons();
                        setupEventListeners();
                        
                        // Load hotspots if user can manage multimedia
                        if (typeof canManageMultimedia !== 'undefined' && canManageMultimedia) {
                            loadHotspots();
                        }
                        
                    } catch (error) {
                        console.error('Error initializing Turn.js:', error);
                        document.getElementById('flipbook-container').innerHTML = 
                            '<p style="color:red;">Error al inicializar el flipbook.</p>' +
                            '<p>Detalles: ' + error.message + '</p>';
                    }
                }, 100);
            });
            
        }).catch(function(error) {
            console.error('Error loading PDF:', error);
            document.getElementById('flipbook-container').innerHTML = 
                '<p style="color:red;">Error al cargar el PDF.</p>' +
                '<p>Detalles: ' + error.message + '</p>';
        });
    }

    // Setup event listeners
    function setupEventListeners() {
        // Navigation buttons
        document.getElementById('prev-btn').addEventListener('click', function() {
            $('#flipbook').turn('previous');
        });
        
        document.getElementById('next-btn').addEventListener('click', function() {
            $('#flipbook').turn('next');
        });
        
        // Fullscreen button
        document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
        
        // Multimedia button
        if (typeof canManageMultimedia !== 'undefined' && canManageMultimedia) {
            const multimediaBtn = document.getElementById('multimedia-btn');
            if (multimediaBtn) {
                multimediaBtn.addEventListener('click', toggleMultimediaMode);
            }
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                $('#flipbook').turn('previous');
            } else if (e.key === 'ArrowRight') {
                $('#flipbook').turn('next');
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'Escape') {
                if (isFullscreen) {
                    exitFullscreen();
                } else if (multimediaMode) {
                    toggleMultimediaMode();
                }
            }
        });
        
        // Detectar salida de pantalla completa con ESC del navegador
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        // Click handler for multimedia mode
        $('#flipbook').on('click', '.page', function(e) {
            if (multimediaMode) {
                handlePageClick(e, this);
            }
        });
    }

    // Toggle multimedia mode
    function toggleMultimediaMode() {
        multimediaMode = !multimediaMode;
        const flipbook = document.getElementById('flipbook');
        const multimediaBtn = document.getElementById('multimedia-btn');
        
        if (multimediaMode) {
            flipbook.classList.add('multimedia-mode');
            multimediaBtn.classList.add('active');
            multimediaBtn.innerHTML = '✖ Cancelar';
            showInstructions();
        } else {
            flipbook.classList.remove('multimedia-mode');
            multimediaBtn.classList.remove('active');
            multimediaBtn.innerHTML = '♪ Agregar Multimedia';
            hideInstructions();
        }
    }

    // Show instructions
    function showInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'multimedia-instructions';
        instructions.id = 'multimedia-instructions';
        instructions.textContent = 'Haz clic en cualquier parte de la página para agregar un punto de audio';
        document.body.appendChild(instructions);
    }

    // Hide instructions
    function hideInstructions() {
        const instructions = document.getElementById('multimedia-instructions');
        if (instructions) {
            instructions.remove();
        }
    }

    // Handle page click in multimedia mode
    function handlePageClick(e, pageElement) {
        e.stopPropagation();
        
        const rect = pageElement.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        const page = parseInt(pageElement.getAttribute('data-page'));
        
        console.log('Adding hotspot at page:', page, 'x:', x, 'y:', y);
        
        // Add hotspot via Moodle AJAX API
        require(['core/ajax'], function(ajax) {
            var promises = ajax.call([{
                methodname: 'mod_flipbook_add_hotspot',
                args: {
                    cmid: cmid,
                    page: page,
                    x: x,
                    y: y
                }
            }]);
            
            promises[0].done(function(response) {
                if (response.success) {
                    console.log('Hotspot added:', response.hotspotid);
                    hotspots.push({
                        id: response.hotspotid,
                        page: page,
                        x: x,
                        y: y,
                        audiourl: '',
                        hasaudio: false
                    });
                    renderHotspots();
                    
                    // Redirect to upload audio
                    window.location.href = M.cfg.wwwroot + '/mod/flipbook/upload_audio.php?cmid=' + cmid + '&hotspotid=' + response.hotspotid;
                }
            }).fail(function(ex) {
                console.error('Error adding hotspot:', ex);
                alert('Error al agregar punto multimedia: ' + ex.message);
            });
        });
    }

    // Load hotspots
    function loadHotspots() {
        require(['core/ajax'], function(ajax) {
            var promises = ajax.call([{
                methodname: 'mod_flipbook_get_hotspots',
                args: {
                    cmid: cmid
                }
            }]);
            
            promises[0].done(function(response) {
                if (response.success) {
                    hotspots = response.hotspots;
                    console.log('Loaded hotspots:', hotspots.length);
                    renderHotspots();
                }
            }).fail(function(ex) {
                console.error('Error loading hotspots:', ex);
            });
        });
    }

    // Render hotspots on current page
    function renderHotspots() {
        // Remove all existing hotspot elements
        $('.hotspot').remove();
        
        // Get visible pages
        const visiblePages = $('#flipbook').turn('view');
        
        // Render hotspots for visible pages
        hotspots.forEach(function(hotspot) {
            if (visiblePages.includes(hotspot.page)) {
                const pageElement = $('[data-page="' + hotspot.page + '"]');
                if (pageElement.length > 0) {
                    createHotspotElement(hotspot, pageElement[0]);
                }
            }
        });
    }

    // Create hotspot element
    function createHotspotElement(hotspot, pageElement) {
        const hotspotEl = document.createElement('div');
        hotspotEl.className = 'hotspot';
        if (!hotspot.hasaudio) {
            hotspotEl.classList.add('no-audio');
        }
        hotspotEl.setAttribute('data-hotspot-id', hotspot.id);
        hotspotEl.style.left = hotspot.x + '%';
        hotspotEl.style.top = hotspot.y + '%';
        
        // Icon
        if (hotspot.hasaudio) {
            hotspotEl.innerHTML = '♪';
        } else {
            hotspotEl.innerHTML = '?';
        }
        
        // Click handler
        hotspotEl.addEventListener('click', function(e) {
            e.stopPropagation();
            if (hotspot.hasaudio) {
                playAudio(hotspot);
            }
        });
        
        // Delete button (only if can manage multimedia)
        if (typeof canManageMultimedia !== 'undefined' && canManageMultimedia) {
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteHotspot(hotspot.id);
            });
            hotspotEl.appendChild(deleteBtn);
            
            // Upload button (only if no audio)
            if (!hotspot.hasaudio) {
                const uploadBtn = document.createElement('div');
                uploadBtn.className = 'upload-btn';
                uploadBtn.innerHTML = '↑';
                uploadBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.location.href = M.cfg.wwwroot + '/mod/flipbook/upload_audio.php?cmid=' + cmid + '&hotspotid=' + hotspot.id;
                });
                hotspotEl.appendChild(uploadBtn);
            }
        }
        
        pageElement.appendChild(hotspotEl);
    }

    // Play audio
    function playAudio(hotspot) {
        // Stop current audio if playing
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            if (playingHotspotId) {
                $('[data-hotspot-id="' + playingHotspotId + '"]').removeClass('playing');
            }
        }
        
        // Play new audio
        if (hotspot.audiourl) {
            currentAudio = new Audio(hotspot.audiourl);
            playingHotspotId = hotspot.id;
            
            $('[data-hotspot-id="' + hotspot.id + '"]').addClass('playing');
            
            currentAudio.play().catch(function(error) {
                console.error('Error playing audio:', error);
                alert('Error al reproducir el audio');
            });
            
            currentAudio.addEventListener('ended', function() {
                $('[data-hotspot-id="' + hotspot.id + '"]').removeClass('playing');
                currentAudio = null;
                playingHotspotId = null;
            });
        }
    }

    // Delete hotspot
    function deleteHotspot(hotspotId) {
        if (!confirm('¿Estás seguro de que deseas eliminar este punto multimedia?')) {
            return;
        }
        
        require(['core/ajax'], function(ajax) {
            var promises = ajax.call([{
                methodname: 'mod_flipbook_delete_hotspot',
                args: {
                    cmid: cmid,
                    hotspotid: hotspotId
                }
            }]);
            
            promises[0].done(function(response) {
                if (response.success) {
                    console.log('Hotspot deleted:', hotspotId);
                    hotspots = hotspots.filter(h => h.id !== hotspotId);
                    renderHotspots();
                }
            }).fail(function(ex) {
                console.error('Error deleting hotspot:', ex);
                alert('Error al eliminar punto multimedia: ' + ex.message);
            });
        });
    }

    // Toggle fullscreen
    function toggleFullscreen() {
        if (!isFullscreen) {
            enterFullscreen();
        } else {
            exitFullscreen();
        }
    }

    // Enter fullscreen
    function enterFullscreen() {
        const container = document.getElementById('flipbook-container');
        
        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        } else if (container.mozRequestFullScreen) {
            container.mozRequestFullScreen();
        } else if (container.msRequestFullscreen) {
            container.msRequestFullscreen();
        }
        
        isFullscreen = true;
        container.classList.add('fullscreen-mode');
        
        // Resize flipbook para pantalla completa
        setTimeout(function() {
            const screenWidth = window.innerWidth - 100;
            const screenHeight = window.innerHeight - 150;
            
            // Calcular dimensiones proporcionales
            const aspectRatio = normalDimensions.width / normalDimensions.height;
            let newWidth = screenWidth;
            let newHeight = screenWidth / aspectRatio;
            
            if (newHeight > screenHeight) {
                newHeight = screenHeight;
                newWidth = newHeight * aspectRatio;
            }
            
            $('#flipbook').turn('size', newWidth, newHeight);
            console.log('Fullscreen dimensions:', newWidth, 'x', newHeight);
            renderHotspots();
            
            // Actualizar botón
            document.getElementById('fullscreen-btn').innerHTML = '🗙 Salir de pantalla completa';
        }, 100);
    }

    // Exit fullscreen
    function exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
        
        isFullscreen = false;
        document.getElementById('flipbook-container').classList.remove('fullscreen-mode');
        
        // Restaurar tamaño normal
        setTimeout(function() {
            $('#flipbook').turn('size', normalDimensions.width, normalDimensions.height);
            console.log('Normal dimensions restored:', normalDimensions.width, 'x', normalDimensions.height);
            renderHotspots();
            
            // Actualizar botón
            document.getElementById('fullscreen-btn').innerHTML = '⛶ Pantalla completa';
        }, 100);
    }

    // Handle fullscreen change (cuando se sale con ESC)
    function handleFullscreenChange() {
        const isCurrentlyFullscreen = !!(document.fullscreenElement || 
                                         document.webkitFullscreenElement || 
                                         document.mozFullScreenElement || 
                                         document.msFullscreenElement);
        
        if (!isCurrentlyFullscreen && isFullscreen) {
            exitFullscreen();
        }
    }

    // Render single page
    function renderPage(num) {
        return pdfDoc.getPage(num).then(function(page) {
            const viewport = page.getViewport({scale: scale});
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            return page.render(renderContext).promise.then(function() {
                console.log('Rendered page', num);
                return canvas;
            });
        });
    }

    // Update page info
    function updatePageInfo() {
        try {
            const currentPage = $('#flipbook').turn('page');
            document.getElementById('page-info').textContent = 'Página ' + currentPage + ' de ' + totalPages;
        } catch (error) {
            console.error('Error updating page info:', error);
        }
    }

    // Update button states
    function updateButtons() {
        try {
            const currentPage = $('#flipbook').turn('page');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            
            if (prevBtn && nextBtn) {
                prevBtn.disabled = (currentPage === 1);
                nextBtn.disabled = (currentPage === totalPages);
            }
        } catch (error) {
            console.error('Error updating buttons:', error);
        }
    }

})(jQuery);