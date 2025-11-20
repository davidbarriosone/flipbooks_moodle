<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_once($CFG->libdir.'/completionlib.php');

$id = required_param('id', PARAM_INT);

$cm = get_coursemodule_from_id('flipbook', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$flipbook = $DB->get_record('flipbook', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/flipbook:view', $context);

// Completion
$completion = new completion_info($course);
$completion->set_module_viewed($cm);

// Get PDF file BEFORE page setup
$fs = get_file_storage();
$files = $fs->get_area_files($context->id, 'mod_flipbook', 'content', 0, 'sortorder DESC, id ASC', false);
$pdfurl = '';

if (count($files) >= 1) {
    $file = reset($files);
    $pdfurl = moodle_url::make_pluginfile_url(
        $context->id,
        'mod_flipbook',
        'content',
        0,
        $file->get_filepath(),
        $file->get_filename()
    );
}

// Page setup
$PAGE->set_url('/mod/flipbook/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($flipbook->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Cargar jQuery de Moodle
$PAGE->requires->jquery();
$PAGE->requires->js_call_amd('core/first', 'init');

// Output starts here
echo $OUTPUT->header();
echo $OUTPUT->heading(format_string($flipbook->name));

if (!empty($flipbook->intro)) {
    echo $OUTPUT->box(format_module_intro('flipbook', $flipbook, $cm->id), 'generalbox', 'intro');
}

if ($pdfurl) {
    // Include CSS
    echo '<link rel="stylesheet" href="' . new moodle_url('/mod/flipbook/css/flipbook.css') . '?v=' . time() . '">';
    
    // Cargar Turn.js
    echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/turn.js/3/turn.min.js"></script>';
    
    // Cargar PDF.js
    echo '<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>';
    
    // Flipbook container con nuevo botón
    echo '<div id="flipbook-container">';
    echo '<div id="flipbook"></div>';
    echo '<div id="controls">';
    echo '<button id="prev-btn" disabled>← Anterior</button>';
    echo '<span id="page-info">Cargando...</span>';
    echo '<button id="next-btn" disabled>Siguiente →</button>';
    echo '<button id="fullscreen-btn">⛶ Pantalla completa</button>';
    echo '</div>';
    echo '</div>';
    
    // Definir la URL del PDF
    echo '<script>';
    echo 'var pdfUrl = ' . json_encode($pdfurl->out()) . ';';
    echo '</script>';
    
    // Cargar nuestro script
    echo '<script src="' . new moodle_url('/mod/flipbook/js/flipbook.js') . '?v=' . time() . '"></script>';
    
} else {
    echo $OUTPUT->notification(get_string('nopdfuploaded', 'mod_flipbook'), 'error');
}

echo $OUTPUT->footer();