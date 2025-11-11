// This file is part of Moodle - http://moodle.org/

define(['jquery'], function($) {
    return {
        init: function(config) {
            $(document).ready(function() {
                var pdfUrl = config.pdfUrl;
                var width = config.width;
                var height = config.height;
                var zoomEnabled = config.zoom;
                var autoflip = config.autoflip;
                
                var currentZoom = 1;
                var minZoom = 0.5;
                var maxZoom = 2;
                var zoomStep = 0.2;
                var autoflipInterval = null;
                var totalPages = 0;
                var pdfDoc = null;

                // Initialize PDF.js
                pdfjsLib.GlobalWorkerOptions.workerSrc = M.cfg.wwwroot + '/mod/flipbook/js/pdf.worker.min.js';

                // Load PDF
                var loadingTask = pdfjsLib.getDocument(pdfUrl);
                
                loadingTask.promise.then(function(pdf) {
                    pdfDoc = pdf;
                    totalPages = pdf.numPages;
                    
                    // Create pages
                    var promises = [];
                    for (var i = 1; i <= totalPages; i++) {
                        promises.push(renderPage(i));
                    }
                    
                    return Promise.all(promises);
                }).then(function() {
                    // Hide loading message
                    $('#loading-message').hide();
                    
                    // Initialize turn.js
                    $('#flipbook').turn({
                        width: width * 2,
                        height: height,
                        autoCenter: true,
                        acceleration: true,
                        elevation: 50,
                        gradients: true,
                        duration: 1000
                    });
                    
                    // Update page info
                    updatePageInfo();
                    
                    // Setup event handlers
                    setupEventHandlers();
                    
                    // Start autoflip if enabled
                    if (autoflip > 0) {
                        startAutoflip(autoflip);
                    }
                }).catch(function(error) {
                    console.error('Error loading PDF:', error);
                    $('#loading-message').html('<i class="fa fa-exclamation-triangle fa-3x" style="color: red;"></i><p>Error al cargar el PDF</p>');
                });

                // Render individual page
                function renderPage(pageNum) {
                    return pdfDoc.getPage(pageNum).then(function(page) {
                        var scale = 1.5;
                        var viewport = page.getViewport({scale: scale});
                        
                        var canvas = document.createElement('canvas');
                        var context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        
                        var renderContext = {
                            canvasContext: context,
                            viewport: viewport
                        };
                        
                        return page.render(renderContext).promise.then(function() {
                            var img = canvas.toDataURL('image/png');
                            var pageDiv = $('<div class="page"><img src="' + img + '" /></div>');
                            $('#flipbook').append(pageDiv);
                        });
                    });
                }

                // Setup event handlers
                function setupEventHandlers() {
                    // Previous page
                    $('#prev-page').on('click', function() {
                        $('#flipbook').turn('previous');
                    });
                    
                    // Next page
                    $('#next-page').on('click', function() {
                        $('#flipbook').turn('next');
                    });
                    
                    // Page input
                    $('#page-input').on('change', function() {
                        var page = parseInt($(this).val());
                        if (page >= 1 && page <= totalPages) {
                            $('#flipbook').turn('page', page);
                        }
                    });
                    
                    // Zoom in
                    $('#zoom-in').on('click', function() {
                        if (zoomEnabled && currentZoom < maxZoom) {
                            currentZoom += zoomStep;
                            applyZoom();
                        }
                    });
                    
                    // Zoom out
                    $('#zoom-out').on('click', function() {
                        if (zoomEnabled && currentZoom > minZoom) {
                            currentZoom -= zoomStep;
                            applyZoom();
                        }
                    });
                    
                    // Fullscreen
                    $('#fullscreen').on('click', toggleFullscreen);
                    
                    // Download PDF
                    $('#download-pdf').on('click', function() {
                        window.open(pdfUrl, '_blank');
                    });
                    
                    // Turn events
                    $('#flipbook').bind('turning', function(event, page, view) {
                        updatePageInfo();
                    });
                    
                    // Keyboard navigation
                    $(document).on('keydown', function(e) {
                        if (e.keyCode === 37) { // Left arrow
                            $('#flipbook').turn('previous');
                        } else if (e.keyCode === 39) { // Right arrow
                            $('#flipbook').turn('next');
                        }
                    });
                }

                // Update page info
                function updatePageInfo() {
                    var page = $('#flipbook').turn('page');
                    $('#page-input').val(page);
                    $('#total-pages').text(' / ' + totalPages);
                    $('#page-info').text('Página ' + page + ' de ' + totalPages);
                    
                    // Update button states
                    $('#prev-page').prop('disabled', page === 1);
                    $('#next-page').prop('disabled', page === totalPages);
                }

                // Apply zoom
                function applyZoom() {
                    var newWidth = width * 2 * currentZoom;
                    var newHeight = height * currentZoom;
                    
                    $('#flipbook').turn('size', newWidth, newHeight);
                    $('#flipbook-viewer').addClass('zoom-in');
                    
                    setTimeout(function() {
                        $('#flipbook-viewer').removeClass('zoom-in');
                    }, 300);
                }

                // Toggle fullscreen
                function toggleFullscreen() {
                    $('#flipbook-container').toggleClass('flipbook-fullscreen');
                    
                    if ($('#flipbook-container').hasClass('flipbook-fullscreen')) {
                        $('#fullscreen i').removeClass('fa-expand').addClass('fa-compress');
                    } else {
                        $('#fullscreen i').removeClass('fa-compress').addClass('fa-expand');
                    }
                    
                    // Resize turn.js after fullscreen toggle
                    setTimeout(function() {
                        $('#flipbook').turn('resize');
                    }, 100);
                }

                // Start auto-flip
                function startAutoflip(seconds) {
                    autoflipInterval = setInterval(function() {
                        var currentPage = $('#flipbook').turn('page');
                        if (currentPage < totalPages) {
                            $('#flipbook').turn('next');
                        } else {
                            stopAutoflip();
                        }
                    }, seconds * 1000);
                }

                // Stop auto-flip
                function stopAutoflip() {
                    if (autoflipInterval) {
                        clearInterval(autoflipInterval);
                        autoflipInterval = null;
                    }
                }

                // Stop autoflip on user interaction
                $('#flipbook-controls button, #flipbook').on('click', function() {
                    if (autoflip > 0) {
                        stopAutoflip();
                    }
                });
            });
        }
    };
});
