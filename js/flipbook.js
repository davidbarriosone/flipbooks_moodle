// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

let pdfDoc = null;
let pageNum = 1;
let totalPages = 0;
const scale = 1.5;

console.log('Loading PDF from:', pdfUrl);

// Load PDF
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
        console.log('All pages rendered');
        
        // Add pages to flipbook
        canvases.forEach(function(canvas, index) {
            const page = document.createElement('div');
            page.className = 'page';
            page.appendChild(canvas);
            flipbook.appendChild(page);
        });
        
        // Initialize Turn.js
        jQuery('#flipbook').turn({
            width: 1000,
            height: 700,
            autoCenter: true,
            gradients: true,
            acceleration: true,
            elevation: 50,
            pages: totalPages,
            when: {
                turning: function(event, page, pageObject) {
                    pageNum = page;
                    updatePageInfo();
                }
            }
        });
        
        updatePageInfo();
        
        // Navigation buttons
        document.getElementById('prev-btn').addEventListener('click', function() {
            jQuery('#flipbook').turn('previous');
        });
        
        document.getElementById('next-btn').addEventListener('click', function() {
            jQuery('#flipbook').turn('next');
        });
        
        // Keyboard navigation
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') {
                jQuery('#flipbook').turn('previous');
            } else if (e.key === 'ArrowRight') {
                jQuery('#flipbook').turn('next');
            }
        });
    });
    
}).catch(function(error) {
    console.error('Error loading PDF:', error);
    document.getElementById('flipbook-container').innerHTML = '<p style="color:red;">Error al cargar el PDF. Por favor, verifica que el archivo sea un PDF válido.</p><p>Detalles: ' + error.message + '</p>';
});

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
            return canvas;
        });
    });
}

// Update page info
function updatePageInfo() {
    document.getElementById('page-info').textContent = 'Página ' + pageNum + ' de ' + totalPages;
}
