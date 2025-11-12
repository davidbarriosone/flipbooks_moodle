#!/bin/bash
# Script de instalación automática de bibliotecas JavaScript para Flipbook
# Uso: ./install_libraries.sh

echo "========================================="
echo "  Flipbook - Instalador de bibliotecas  "
echo "========================================="
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "version.php" ]; then
    echo "❌ Error: Ejecuta este script desde el directorio mod/flipbook/"
    exit 1
fi

# Crear directorio js si no existe
if [ ! -d "js" ]; then
    mkdir -p js
    echo "✓ Directorio js/ creado"
fi

cd js

echo ""
echo "📥 Descargando PDF.js..."
echo "--------------------------------"

# Descargar PDF.js
if command -v wget &> /dev/null; then
    wget -q --show-progress https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
    wget -q --show-progress https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
elif command -v curl &> /dev/null; then
    curl -L -o pdf.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
    curl -L -o pdf.worker.min.js https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
else
    echo "❌ Error: Se requiere wget o curl para descargar las bibliotecas"
    exit 1
fi

# Verificar descarga de PDF.js
if [ -f "pdf.min.js" ] && [ -f "pdf.worker.min.js" ]; then
    echo "✓ PDF.js descargado correctamente"
else
    echo "❌ Error al descargar PDF.js"
    exit 1
fi

echo ""
echo "📥 Descargando turn.js..."
echo "--------------------------------"

# Información sobre turn.js
echo ""
echo "⚠️  IMPORTANTE: turn.js"
echo "   turn.js requiere licencia comercial para uso comercial."
echo "   Licencia: BSD (uso comercial requiere licencia)"
echo "   Sitio oficial: http://www.turnjs.com/"
echo ""
echo "Opciones:"
echo "1) Descargar turn.js desde CDN (solo para pruebas)"
echo "2) Descargar alternativa GRATUITA: page-flip (MIT License)"
echo "3) Saltar (descargarlo manualmente después)"
echo ""
read -p "Selecciona una opción (1/2/3): " option

case $option in
    1)
        echo ""
        echo "Descargando turn.js desde CDN..."
        if command -v wget &> /dev/null; then
            wget -q --show-progress https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js
        else
            curl -L -o turn.min.js https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js
        fi
        
        if [ -f "turn.min.js" ]; then
            echo "✓ turn.js descargado"
            echo "⚠️  Recuerda: Solo para pruebas. Para producción necesitas licencia."
        else
            echo "❌ Error al descargar turn.js"
        fi
        ;;
    2)
        echo ""
        echo "Descargando page-flip (alternativa MIT License)..."
        if command -v wget &> /dev/null; then
            wget -q --show-progress -O page-flip.min.js https://unpkg.com/page-flip/dist/js/page-flip.browser.min.js
        else
            curl -L -o page-flip.min.js https://unpkg.com/page-flip/dist/js/page-flip.browser.min.js
        fi
        
        if [ -f "page-flip.min.js" ]; then
            echo "✓ page-flip descargado (100% gratis)"
            echo "⚠️  Nota: Deberás usar flipbook-pageflip.js en lugar de flipbook.js"
        else
            echo "❌ Error al descargar page-flip"
        fi
        ;;
    3)
        echo ""
        echo "⏭️  Saltando descarga de biblioteca de flip."
        echo "   Descarga manualmente desde:"
        echo "   - turn.js: http://www.turnjs.com/"
        echo "   - page-flip: https://github.com/Nodlik/StPageFlip"
        ;;
    *)
        echo "Opción no válida. Saltando..."
        ;;
esac

cd ..

echo ""
echo "========================================="
echo "  Instalación completada                "
echo "========================================="
echo ""
echo "✅ Archivos descargados en: mod/flipbook/js/"
echo ""
echo "📋 Siguiente paso:"
echo "   Sube la carpeta flipbook/ a tu Moodle en:"
echo "   [moodle]/mod/flipbook/"
echo ""
echo "   Luego ve a: Administración → Notificaciones"
echo "   para completar la instalación."
echo ""
echo "📖 Documentación completa en:"
echo "   - README.md"
echo "   - INSTALLATION.md"
echo "   - CUSTOMIZATION.md"
echo ""
