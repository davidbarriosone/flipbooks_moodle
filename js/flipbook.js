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
    let audioAreas = [];
    let currentAudio = null;
    let playingAreaId = null;
    let currentAreaElement = null;
    
    // Drawing state
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let drawingPreview = null;

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
                                    // Stop audio when turning page
                                    if (currentAudio) {
                                        stopAudio();
                                    }
                                },
                                turned: function(event, page, pageObject) {
                                    console.log('Turned to page:', page);
                                    updateButtons();
                                    // Pequeño delay para que Turn.js termine de animar
                                    setTimeout(renderAudioAreas, 100);
                                }
                            }
                        });
                        
                        console.log('✓ Turn.js initialized successfully');
                        
                        updatePageInfo();
                        updateButtons();
                        setupEventListeners();
                        
                        // Load audio areas
                        loadAudioAreas();
                        
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
        
        // Drawing event handlers for multimedia mode
        $('#flipbook').on('mousedown', '.page', function(e) {
            if (multimediaMode) {
                startDrawing(e, this);
            }
        });
        
        $('#flipbook').on('mousemove', '.page', function(e) {
            if (multimediaMode && isDrawing) {
                updateDrawing(e, this);
            }
        });
        
        $('#flipbook').on('mouseup', '.page', function(e) {
            if (multimediaMode && isDrawing) {
                finishDrawing(e, this);
            }
        });
        
        $('#flipbook').on('mouseleave', '.page', function(e) {
            if (multimediaMode && isDrawing) {
                cancelDrawing();
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
            cancelDrawing();
        }
    }

    // Show instructions
    function showInstructions() {
        const instructions = document.createElement('div');
        instructions.className = 'multimedia-instructions';
        instructions.id = 'multimedia-instructions';
        instructions.textContent = 'Arrastra para dibujar un área de audio en la página';
        document.body.appendChild(instructions);
    }

    // Hide instructions
    function hideInstructions() {
        const instructions = document.getElementById('multimedia-instructions');
        if (instructions) {
            instructions.remove();
        }
    }

    // Start drawing
    function startDrawing(e, pageElement) {
        e.stopPropagation();
        e.preventDefault();
        
        isDrawing = true;
        const rect = pageElement.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;
        
        // Create preview element
        drawingPreview = document.createElement('div');
        drawingPreview.className = 'drawing-area';
        drawingPreview.style.left = startX + 'px';
        drawingPreview.style.top = startY + 'px';
        drawingPreview.style.width = '0px';
        drawingPreview.style.height = '0px';
        pageElement.appendChild(drawingPreview);
        
        console.log('Started drawing at:', startX, startY);
    }

    // Update drawing
    function updateDrawing(e, pageElement) {
        if (!drawingPreview) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        const rect = pageElement.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);
        
        drawingPreview.style.left = left + 'px';
        drawingPreview.style.top = top + 'px';
        drawingPreview.style.width = width + 'px';
        drawingPreview.style.height = height + 'px';
    }

    // Finish drawing
    function finishDrawing(e, pageElement) {
        if (!drawingPreview) return;
        
        e.stopPropagation();
        e.preventDefault();
        
        const rect = pageElement.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const width = Math.abs(currentX - startX);
        const height = Math.abs(currentY - startY);
        
        // Minimum size check (10px)
        if (width < 10 || height < 10) {
            console.log('Area too small, canceling');
            cancelDrawing();
            return;
        }
        
        const left = Math.min(currentX, startX);
        const top = Math.min(currentY, startY);
        
        // Convert to percentages
        const x = (left / rect.width) * 100;
        const y = (top / rect.height) * 100;
        const widthPercent = (width / rect.width) * 100;
        const heightPercent = (height / rect.height) * 100;
        
        const page = parseInt(pageElement.getAttribute('data-page'));
        
        console.log('Finished drawing area:', {page, x, y, width: widthPercent, height: heightPercent});
        
        // Remove preview
        drawingPreview.remove();
        drawingPreview = null;
        isDrawing = false;
        
        // Add audio area via Moodle AJAX API
        require(['core/ajax'], function(ajax) {
            var promises = ajax.call([{
                methodname: 'mod_flipbook_add_audioarea',
                args: {
                    cmid: cmid,
                    page: page,
                    x: x,
                    y: y,
                    width: widthPercent,
                    height: heightPercent
                }
            }]);
            
            promises[0].done(function(response) {
                if (response.success) {
                    console.log('Audio area added:', response.audioareaid);
                    audioAreas.push({
                        id: response.audioareaid,
                        page: page,
                        x: x,
                        y: y,
                        width: widthPercent,
                        height: heightPercent,
                        audiourl: '',
                        hasaudio: false
                    });
                    renderAudioAreas();
                    
                    // Redirect to upload audio
                    window.location.href = M.cfg.wwwroot + '/mod/flipbook/upload_audio.php?cmid=' + cmid + '&audioareaid=' + response.audioareaid;
                }
            }).fail(function(ex) {
                console.error('Error adding audio area:', ex);
                alert('Error al agregar área de audio: ' + ex.message);
            });
        });
    }

    // Cancel drawing
    function cancelDrawing() {
        if (drawingPreview) {
            drawingPreview.remove();
            drawingPreview = null;
        }
        isDrawing = false;
    }

    // Load audio areas
    function loadAudioAreas() {
        require(['core/ajax'], function(ajax) {
            var promises = ajax.call([{
                methodname: 'mod_flipbook_get_audioareas',
                args: {
                    cmid: cmid
                }
            }]);
            
            promises[0].done(function(response) {
                if (response.success) {
                    audioAreas = response.audioareas;
                    console.log('Loaded audio areas:', audioAreas.length);
                    renderAudioAreas();
                }
            }).fail(function(ex) {
                console.error('Error loading audio areas:', ex);
            });
        });
    }

    // Render audio areas on current page
    function renderAudioAreas() {
        // Remove all existing audio area elements
        $('.audio-area').remove();
        
        // Get visible pages
        const visiblePages = $('#flipbook').turn('view');
        
        console.log('Rendering audio areas for pages:', visiblePages);
        
        // Render audio areas for visible pages
        audioAreas.forEach(function(area) {
            if (visiblePages.includes(area.page)) {
                const pageElement = $('[data-page="' + area.page + '"]');
                if (pageElement.length > 0) {
                    createAudioAreaElement(area, pageElement[0]);
                }
            }
        });
    }

    // Create audio area element
    function createAudioAreaElement(area, pageElement) {
        const areaEl = document.createElement('div');
        areaEl.className = 'audio-area';
        if (!area.hasaudio) {
            areaEl.classList.add('no-audio');
        }
        areaEl.setAttribute('data-audioarea-id', area.id);
        areaEl.style.left = area.x + '%';
        areaEl.style.top = area.y + '%';
        areaEl.style.width = area.width + '%';
        areaEl.style.height = area.height + '%';
        
        // Click handler
        areaEl.addEventListener('click', function(e) {
            e.stopPropagation();
            if (area.hasaudio) {
                playAudio(area, areaEl);
            }
        });
        
        // Delete button (only if can manage multimedia)
        if (typeof canManageMultimedia !== 'undefined' && canManageMultimedia) {
            const deleteBtn = document.createElement('div');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteAudioArea(area.id);
            });
            areaEl.appendChild(deleteBtn);
            
            // Upload button (only if no audio)
            if (!area.hasaudio) {
                const uploadBtn = document.createElement('div');
                uploadBtn.className = 'upload-btn';
                uploadBtn.innerHTML = '↑';
                uploadBtn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    window.location.href = M.cfg.wwwroot + '/mod/flipbook/upload_audio.php?cmid=' + cmid + '&audioareaid=' + area.id;
                });
                areaEl.appendChild(uploadBtn);
            }
        }
        
        pageElement.appendChild(areaEl);
    }

    // Play audio with control bar INSIDE the area
    function playAudio(area, areaElement) {
        // Stop current audio if playing
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            hideControlBar();
        }
        
        // Play new audio
        if (area.audiourl) {
            currentAudio = new Audio(area.audiourl);
            playingAreaId = area.id;
            currentAreaElement = areaElement;
            
            $(areaElement).addClass('playing');
            
            showControlBar(areaElement);
            
            currentAudio.play().catch(function(error) {
                console.error('Error playing audio:', error);
                alert('Error al reproducir el audio');
                hideControlBar();
            });
            
            // Update progress bar
            currentAudio.addEventListener('timeupdate', updateProgressBar);
            
            currentAudio.addEventListener('ended', function() {
                $(areaElement).removeClass('playing');
                hideControlBar();
                currentAudio = null;
                playingAreaId = null;
                currentAreaElement = null;
            });
        }
    }

    // Show control bar INSIDE the area
    function showControlBar(areaElement) {
        let controlBar = document.getElementById('audio-control-bar');
        
        if (!controlBar) {
            controlBar = document.createElement('div');
            controlBar.id = 'audio-control-bar';
            controlBar.className = 'audio-control-bar';
            controlBar.innerHTML = `
                <button class="play-pause-btn" id="play-pause-btn">⏸</button>
                <div class="progress-container">
                    <div class="progress-bar" id="audio-progress-bar">
                        <div class="progress-bar-fill" id="progress-bar-fill"></div>
                    </div>
                    <div class="time-display">
                        <span id="current-time">0:00</span>
                        <span id="total-time">0:00</span>
                    </div>
                </div>
                <button class="close-btn" id="close-audio-btn">×</button>
            `;
            
            // Play/Pause button
            controlBar.querySelector('#play-pause-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                togglePlayPause();
            });
            
            // Progress bar click
            controlBar.querySelector('#audio-progress-bar').addEventListener('click', function(e) {
                e.stopPropagation();
                seekAudio(e);
            });
            
            // Close button
            controlBar.querySelector('#close-audio-btn').addEventListener('click', function(e) {
                e.stopPropagation();
                stopAudio();
            });
        }
        
        // Append to the audio area element
        areaElement.appendChild(controlBar);
        controlBar.style.display = 'flex';
        updateTotalTime();
    }

    // Hide control bar
    function hideControlBar() {
        const controlBar = document.getElementById('audio-control-bar');
        if (controlBar && controlBar.parentNode) {
            controlBar.parentNode.removeChild(controlBar);
        }
        
        if (playingAreaId) {
            $('[data-audioarea-id="' + playingAreaId + '"]').removeClass('playing');
            playingAreaId = null;
            currentAreaElement = null;
        }
    }

    // Toggle play/pause
    function togglePlayPause() {
        if (!currentAudio) return;
        
        const btn = document.getElementById('play-pause-btn');
        
        if (currentAudio.paused) {
            currentAudio.play();
            btn.innerHTML = '⏸';
        } else {
            currentAudio.pause();
            btn.innerHTML = '▶';
        }
    }

    // Stop audio
    function stopAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
        hideControlBar();
    }

    // Update progress bar
    function updateProgressBar() {
        if (!currentAudio) return;
        
        const progress = (currentAudio.currentTime / currentAudio.duration) * 100;
        const progressFill = document.getElementById('progress-bar-fill');
        const currentTimeEl = document.getElementById('current-time');
        
        if (progressFill) {
            progressFill.style.width = progress + '%';
        }
        
        if (currentTimeEl) {
            currentTimeEl.textContent = formatTime(currentAudio.currentTime);
        }
    }

    // Update total time
    function updateTotalTime() {
        if (!currentAudio) return;
        
        const totalTimeEl = document.getElementById('total-time');
        
        if (currentAudio.duration && !isNaN(currentAudio.duration)) {
            totalTimeEl.textContent = formatTime(currentAudio.duration);
        } else {
            currentAudio.addEventListener('loadedmetadata', function() {
                totalTimeEl.textContent = formatTime(currentAudio.duration);
            });
        }
    }

    // Seek audio
    function seekAudio(e) {
        if (!currentAudio) return;
        
        const progressBar = document.getElementById('audio-progress-bar');
        const rect = progressBar.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        currentAudio.currentTime = percent * currentAudio.duration;
    }

    // Format time
    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    // Delete audio area
    function deleteAudioArea(areaId) {
        if (!confirm('¿Estás seguro de que deseas eliminar esta área de audio?')) {
            return;
        }
        
        require(['core/ajax'], function(ajax) {
            var promises = ajax.call([{
                methodname: 'mod_flipbook_delete_audioarea',
                args: {
                    cmid: cmid,
                    audioareaid: areaId
                }
            }]);
            
            promises[0].done(function(response) {
                if (response.success) {
                    console.log('Audio area deleted:', areaId);
                    audioAreas = audioAreas.filter(a => a.id !== areaId);
                    renderAudioAreas();
                }
            }).fail(function(ex) {
                console.error('Error deleting audio area:', ex);
                alert('Error al eliminar área de audio: ' + ex.message);
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
            
            // Re-render areas after resize completes
            setTimeout(renderAudioAreas, 200);
            
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
            
            // Re-render areas after resize completes
            setTimeout(renderAudioAreas, 200);
            
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
