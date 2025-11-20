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

    console.log('=== FLIPBOOK DEBUG ===');
    console.log('jQuery loaded:', typeof $ !== 'undefined');
    console.log('jQuery version:', $.fn ? $.fn.jquery : 'N/A');
    console.log('Turn.js loaded:', typeof $.fn.turn !== 'undefined');
    console.log('PDF.js loaded:', typeof pdfjsLib !== 'undefined');
    console.log('PDF URL:', typeof pdfUrl !== 'undefined' ? pdfUrl : 'UNDEFINED');

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
                                }
                            }
                        });
                        
                        console.log('✓ Turn.js initialized successfully');
                        
                        updatePageInfo();
                        updateButtons();
                        setupEventListeners();
                        
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
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                $('#flipbook').turn('previous');
            } else if (e.key === 'ArrowRight') {
                $('#flipbook').turn('next');
            } else if (e.key === 'f' || e.key === 'F') {
                toggleFullscreen();
            } else if (e.key === 'Escape' && isFullscreen) {
                exitFullscreen();
            }
        });
        
        // Detectar salida de pantalla completa con ESC del navegador
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
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