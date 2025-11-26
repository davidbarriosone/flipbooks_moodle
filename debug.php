<?php
// This file is part of Moodle - http://moodle.org/
// PÁGINA DE DIAGNÓSTICO - Eliminar después de resolver el problema

require_once('../../config.php');
require_login();
require_capability('moodle/site:config', context_system::instance());

$id = required_param('id', PARAM_INT);

$cm = get_coursemodule_from_id('flipbook', $id, 0, false, MUST_EXIST);
$context = context_module::instance($cm->id);

echo "<!DOCTYPE html><html><head><title>Diagnóstico Flipbook</title></head><body>";
echo "<h1>Diagnóstico de archivos - Flipbook ID: $id</h1>";

// Listar archivos en el área
$fs = get_file_storage();
$files = $fs->get_area_files($context->id, 'mod_flipbook', 'content');

echo "<h2>Archivos encontrados en el área 'content':</h2>";
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>ID</th><th>Nombre</th><th>Filepath</th><th>Filesize</th><th>Mimetype</th><th>Contenthash</th></tr>";

foreach ($files as $file) {
    if ($file->is_directory()) {
        continue;
    }
    
    echo "<tr>";
    echo "<td>" . $file->get_id() . "</td>";
    echo "<td>" . $file->get_filename() . "</td>";
    echo "<td>" . $file->get_filepath() . "</td>";
    echo "<td>" . $file->get_filesize() . "</td>";
    echo "<td>" . $file->get_mimetype() . "</td>";
    echo "<td>" . $file->get_contenthash() . "</td>";
    echo "</tr>";
}

echo "</table>";

// Intentar construir la URL
echo "<h2>URLs construidas:</h2>";
foreach ($files as $file) {
    if ($file->is_directory()) {
        continue;
    }
    
    $url = moodle_url::make_pluginfile_url(
        $context->id,
        'mod_flipbook',
        'content',
        0,
        $file->get_filepath(),
        $file->get_filename()
    );
    
    echo "<p><strong>Archivo:</strong> " . $file->get_filename() . "<br>";
    echo "<strong>URL:</strong> <a href='" . $url->out() . "' target='_blank'>" . $url->out() . "</a></p>";
}

// Info del contexto
echo "<h2>Información del contexto:</h2>";
echo "<p>Context ID: " . $context->id . "<br>";
echo "Context Level: " . $context->contextlevel . "<br>";
echo "Instance ID: " . $context->instanceid . "</p>";

echo "</body></html>";
