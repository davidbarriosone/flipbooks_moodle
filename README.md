# Flipbook para Moodle 4.5

Plugin de actividad que permite a los profesores subir documentos PDF y mostrarlos como flipbooks interactivos con efecto de página giratoria, similar a Heyzine.

## Características principales

✨ **Efecto de página giratoria realista** - Usa turn.js para crear un efecto de libro físico
📄 **Renderizado PDF de alta calidad** - PDF.js convierte cada página en imagen de alta resolución
🎨 **Interfaz moderna y atractiva** - Diseño profesional similar a Heyzine
🔍 **Zoom interactivo** - Los usuarios pueden acercar y alejar las páginas
📱 **Responsive** - Se adapta a dispositivos móviles y tablets
🖥️ **Pantalla completa** - Modo de pantalla completa para mejor experiencia
⚙️ **Configurable** - Múltiples opciones de personalización
🔄 **Auto-flip** - Opción para pasar páginas automáticamente
📥 **Descarga** - Los estudiantes pueden descargar el PDF original
🌐 **Multiidioma** - Soporta español e inglés

## Requisitos

- Moodle 4.5 o superior
- PHP 7.4 o superior
- Permisos de escritura en el directorio de plugins

## Instalación

### Método 1: Instalación manual

1. Descarga el plugin y descomprime el archivo
2. Copia la carpeta `flipbook` a `[moodle]/mod/`
3. Descarga las bibliotecas JavaScript necesarias:
   - **PDF.js**: Descarga desde https://github.com/mozilla/pdf.js/releases
     - Extrae `pdf.min.js` y `pdf.worker.min.js` a `mod/flipbook/js/`
   - **turn.js**: Descarga desde http://www.turnjs.com/
     - Extrae `turn.min.js` a `mod/flipbook/js/`
4. Accede a tu sitio Moodle como administrador
5. Ve a "Administración del sitio" → "Notificaciones"
6. Sigue las instrucciones para completar la instalación

### Método 2: Instalación vía Git

```bash
cd [moodle]/mod
git clone [tu-repositorio] flipbook
cd flipbook
# Descarga las bibliotecas JS según las instrucciones del Método 1
```

### Descargar bibliotecas JavaScript

Las siguientes bibliotecas deben descargarse por separado debido a licencias:

**PDF.js (Apache License 2.0)**
```bash
cd mod/flipbook/js
wget https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js
wget https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
```

**turn.js (BSD License - requiere licencia comercial para uso comercial)**
```bash
# Visita http://www.turnjs.com/ y descarga la biblioteca
# Copia turn.min.js a mod/flipbook/js/
```

**Alternativa a turn.js**: Si prefieres una biblioteca completamente libre, puedes usar:
- **flip.js** (MIT License): https://github.com/pedersenok/flipjs
- **page-flip** (MIT License): https://github.com/Nodlik/StPageFlip

## Uso

### Para profesores

1. Activa la edición en tu curso
2. Haz clic en "Añadir una actividad o recurso"
3. Selecciona "Flipbook"
4. Configura tu flipbook:
   - **Nombre**: Dale un título descriptivo
   - **Descripción**: Agrega información sobre el contenido
   - **Archivo PDF**: Sube tu documento PDF
   - **Configuración de visualización**:
     - Ancho y alto del visor
     - Habilitar zoom
     - Auto-flip (segundos entre páginas, 0 = desactivado)
     - Mostrar controles de navegación
     - Mostrar barra de herramientas
5. Guarda los cambios

### Para estudiantes

1. Haz clic en el flipbook en tu curso
2. Usa los controles para navegar:
   - **Botones anterior/siguiente**: Navega entre páginas
   - **Campo de página**: Salta a una página específica
   - **Zoom +/-**: Acerca o aleja el contenido
   - **Pantalla completa**: Amplía el visor
   - **Descargar**: Obtén el PDF original
3. También puedes:
   - Usar las flechas del teclado para navegar
   - Hacer clic en las esquinas de las páginas para girarlas
   - Arrastrar las esquinas para efecto de página giratoria

## Configuración avanzada

### Personalización de estilos

Puedes personalizar los colores y estilos editando `styles/flipbook.css`:

```css
/* Cambiar el color principal */
.flipbook-btn {
    background: linear-gradient(135deg, #TU_COLOR_1 0%, #TU_COLOR_2 100%);
}
```

### Ajustes de rendimiento

Para PDFs muy grandes, considera:
- Reducir la escala de renderizado en `amd/src/flipbook.js`:
  ```javascript
  var scale = 1.5; // Reducir a 1.2 o 1.0 para mejor rendimiento
  ```
- Limitar el tamaño máximo de archivo en `mod_form.php`

### Configuración del servidor

Para archivos PDF grandes, asegúrate de que tu servidor tenga:
```php
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
```

## Estructura de archivos

```
mod/flipbook/
├── version.php              # Metadatos del plugin
├── lib.php                  # Funciones principales
├── mod_form.php            # Formulario de configuración
├── view.php                # Página de visualización
├── db/
│   ├── install.xml         # Esquema de base de datos
│   └── access.php          # Permisos
├── lang/
│   ├── en/flipbook.php     # Strings en inglés
│   └── es/flipbook.php     # Strings en español
├── classes/
│   └── event/              # Eventos del sistema
├── styles/
│   └── flipbook.css        # Estilos CSS
├── amd/src/
│   └── flipbook.js         # JavaScript principal
└── js/
    ├── pdf.min.js          # Biblioteca PDF.js (descargar)
    ├── pdf.worker.min.js   # Worker de PDF.js (descargar)
    └── turn.min.js         # Biblioteca turn.js (descargar)
```

## Solución de problemas

### El flipbook no se muestra
- Verifica que las bibliotecas JS estén en `mod/flipbook/js/`
- Revisa la consola del navegador para errores
- Asegúrate de que el archivo PDF sea válido

### Páginas en blanco
- El PDF puede estar protegido o corrupto
- Intenta con un PDF diferente
- Verifica los permisos de archivo

### Rendimiento lento
- Reduce el tamaño del PDF
- Comprime las imágenes del PDF
- Ajusta la escala de renderizado

### Error de carga
- Verifica los límites de upload_max_filesize
- Comprueba los permisos de escritura en moodledata
- Revisa los logs de Moodle

## Licencia

Este plugin está licenciado bajo GPL v3 o posterior, igual que Moodle.

**Nota sobre bibliotecas de terceros:**
- PDF.js: Apache License 2.0
- turn.js: BSD License (requiere licencia comercial para uso comercial)

## Soporte

Para reportar bugs o solicitar características:
- Crea un issue en el repositorio
- Contacta al equipo de desarrollo

## Créditos

Desarrollado para Moodle 4.5
Utiliza PDF.js (Mozilla) y turn.js

## Changelog

### Versión 1.0.0 (2024-11-06)
- Lanzamiento inicial
- Soporte para Moodle 4.5
- Renderizado de PDF con turn.js
- Controles de navegación interactivos
- Zoom y pantalla completa
- Auto-flip configurable
- Multiidioma (ES/EN)
