# Guía de Instalación Detallada - Flipbook para Moodle 4.5

## 📋 Requisitos previos

Antes de comenzar, asegúrate de tener:
- ✅ Moodle 4.5 o superior instalado
- ✅ Acceso FTP o SSH al servidor
- ✅ Permisos de administrador en Moodle
- ✅ PHP 7.4 o superior

## 📥 Paso 1: Descargar el plugin

1. Descarga todos los archivos del plugin
2. La estructura debe verse así:
```
flipbook/
├── version.php
├── lib.php
├── mod_form.php
├── view.php
├── README.md
├── db/
├── lang/
├── classes/
├── styles/
├── amd/
└── js/ (carpeta vacía por ahora)
```

## 📚 Paso 2: Descargar bibliotecas JavaScript

### Opción A: Descarga manual (Recomendado)

**1. PDF.js (Apache License 2.0)**

Visita: https://cdnjs.com/libraries/pdf.js

Descarga estos archivos:
- `pdf.min.js` (versión 3.11.174 o superior)
- `pdf.worker.min.js` (misma versión)

Guárdalos en: `mod/flipbook/js/`

**2. turn.js (BSD License)**

⚠️ **IMPORTANTE**: turn.js requiere licencia comercial para uso comercial.

**Opción 2a: Usar turn.js (requiere licencia comercial)**
- Visita: http://www.turnjs.com/
- Descarga la biblioteca
- Extrae `turn.min.js`
- Guárdalo en: `mod/flipbook/js/`

**Opción 2b: Alternativa GRATUITA - page-flip (MIT License)**
- Visita: https://github.com/Nodlik/StPageFlip
- Descarga `page-flip.min.js`
- Guárdalo en: `mod/flipbook/js/`
- ⚠️ Requiere modificar `amd/src/flipbook.js` (ver sección de personalización)

### Opción B: Descarga vía CDN (Para pruebas)

Si solo quieres probar el plugin, puedes usar CDN. Edita `view.php` y agrega:

```php
// Antes de la línea: $PAGE->requires->js(...)
$PAGE->requires->js(new moodle_url('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'));
$PAGE->requires->js(new moodle_url('https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js'));
```

⚠️ **Nota**: Para producción, es mejor descargar los archivos localmente.

## 📁 Paso 3: Subir el plugin a Moodle

### Método 1: FTP/SFTP

1. Conecta a tu servidor vía FTP
2. Navega a la carpeta de Moodle: `[ruta-moodle]/mod/`
3. Sube la carpeta completa `flipbook`
4. Verifica que la ruta final sea: `[ruta-moodle]/mod/flipbook/`

### Método 2: SSH

```bash
# Conecta a tu servidor
ssh usuario@tuservidor.com

# Navega al directorio de módulos
cd /ruta/a/moodle/mod/

# Sube el archivo ZIP (si lo tienes)
unzip flipbook.zip

# O clona desde git
git clone [tu-repositorio] flipbook

# Establece permisos correctos
chmod -R 755 flipbook
chown -R www-data:www-data flipbook
```

### Método 3: Interfaz web de Moodle

1. Comprime la carpeta `flipbook` en un archivo ZIP
2. En Moodle, ve a: **Administración del sitio → Plugins → Instalar plugins**
3. Arrastra el archivo ZIP o selecciónalo
4. Haz clic en "Instalar plugin desde el archivo ZIP"

## ⚙️ Paso 4: Instalar el plugin en Moodle

1. Accede a tu sitio Moodle como **administrador**
2. Moodle detectará el nuevo plugin automáticamente
3. Serás redirigido a: **Administración del sitio → Notificaciones**
4. Verás un mensaje sobre el nuevo plugin "Flipbook"
5. Haz clic en **"Actualizar base de datos de Moodle"**
6. Confirma la instalación
7. Espera a que se cree la tabla en la base de datos

## ✅ Paso 5: Verificar la instalación

1. Ve a: **Administración del sitio → Plugins → Resumen de plugins**
2. Busca "Flipbook" en la lista de módulos de actividad
3. Debes ver:
   - **Nombre**: Flipbook
   - **Versión**: 1.0.0
   - **Requiere**: Moodle 4.5

## 🎨 Paso 6: Configurar permisos (Opcional)

1. Ve a: **Administración del sitio → Usuarios → Permisos → Definir roles**
2. Edita el rol que desees (ej: "Profesor")
3. Busca las capacidades del Flipbook:
   - `mod/flipbook:addinstance` - Crear flipbooks
   - `mod/flipbook:view` - Ver flipbooks
4. Asegúrate de que estén permitidas

## 🧪 Paso 7: Prueba el plugin

1. Ve a cualquier curso donde seas profesor
2. Activa la **edición**
3. Haz clic en **"Añadir una actividad o recurso"**
4. Debes ver **"Flipbook"** en la lista
5. Selecciónalo y haz clic en "Agregar"
6. Configura:
   - Nombre: "Mi primer flipbook"
   - Sube un PDF de prueba
   - Configura dimensiones: 800 x 600
   - Habilita zoom y controles
7. Guarda y visualiza

## 🔧 Configuración del servidor (Importante)

### Límites de PHP

Para PDFs grandes, edita `php.ini`:

```ini
upload_max_filesize = 50M
post_max_size = 50M
max_execution_time = 300
memory_limit = 256M
max_input_time = 300
```

Después de editar, reinicia el servidor web:
```bash
sudo service apache2 restart
# o
sudo service nginx restart
sudo service php7.4-fpm restart
```

### Permisos de archivos

```bash
# En el directorio de Moodle
cd /ruta/a/moodle

# Permisos para el plugin
chmod -R 755 mod/flipbook
chown -R www-data:www-data mod/flipbook

# Permisos para moodledata
chmod -R 770 /ruta/a/moodledata
chown -R www-data:www-data /ruta/a/moodledata
```

## 🐛 Solución de problemas comunes

### ❌ "Plugin no aparece en la lista de notificaciones"

**Solución:**
```bash
# Verifica la ubicación
ls -la /ruta/a/moodle/mod/flipbook/version.php

# Debe existir y tener permisos de lectura
```

### ❌ "Error: No se puede crear la tabla"

**Solución:**
1. Verifica permisos de base de datos
2. Revisa logs: `Administración → Informes → Registros`
3. Intenta reinstalar:
```sql
-- En phpMyAdmin o terminal MySQL
DROP TABLE IF EXISTS mdl_flipbook;
```
4. Vuelve a instalar desde notificaciones

### ❌ "El flipbook no se muestra, solo pantalla blanca"

**Solución:**
1. Abre consola del navegador (F12)
2. Busca errores JavaScript
3. Verifica que los archivos JS existan:
   - `/mod/flipbook/js/pdf.min.js`
   - `/mod/flipbook/js/pdf.worker.min.js`
   - `/mod/flipbook/js/turn.min.js`
4. Verifica rutas en `view.php`

### ❌ "Error 404 al cargar el PDF"

**Solución:**
1. Verifica función `flipbook_pluginfile()` en `lib.php`
2. Comprueba permisos de moodledata
3. Revisa que el PDF se haya subido correctamente

### ❌ "El plugin se instaló pero no aparece en 'Añadir actividad'"

**Solución:**
1. Limpia caché: **Administración → Desarrollo → Purgar cachés**
2. Verifica rol de profesor tenga capacidad `mod/flipbook:addinstance`
3. Reinicia sesión

## 🚀 Optimización para producción

### 1. Habilitar caché de JavaScript

En `config.php`:
```php
$CFG->cachejs = true;
```

### 2. Comprimir PDF antes de subir

Usa herramientas como:
- Adobe Acrobat Pro
- iLovePDF.com
- Ghostscript:
```bash
gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook \
   -dNOPAUSE -dQUIET -dBATCH -sOutputFile=output.pdf input.pdf
```

### 3. Configurar CDN (Opcional)

Para mejor rendimiento global, considera usar un CDN para archivos estáticos.

## 📞 Soporte adicional

Si sigues teniendo problemas:

1. **Revisa logs de Moodle**:
   - Administración → Informes → Registros
   - Busca errores relacionados con "flipbook"

2. **Revisa logs del servidor**:
```bash
tail -f /var/log/apache2/error.log
# o
tail -f /var/log/nginx/error.log
```

3. **Activa modo debug**:
   En `config.php`:
```php
$CFG->debug = E_ALL | E_STRICT;
$CFG->debugdisplay = 1;
```

4. **Consulta documentación**:
   - README.md del plugin
   - https://docs.moodle.org/

## ✨ ¡Listo!

Tu plugin Flipbook está instalado y listo para usar. Los profesores ahora pueden:
- ✅ Subir PDFs
- ✅ Crear flipbooks interactivos
- ✅ Compartir con estudiantes
- ✅ Configurar visualización personalizada

¡Disfruta de tu nuevo plugin!
