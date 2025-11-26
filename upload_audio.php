<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_once($CFG->dirroot.'/mod/flipbook/lib.php');

$cmid = required_param('cmid', PARAM_INT);
$hotspotid = required_param('hotspotid', PARAM_INT);

$cm = get_coursemodule_from_id('flipbook', $cmid, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$flipbook = $DB->get_record('flipbook', array('id' => $cm->instance), '*', MUST_EXIST);
$hotspot = $DB->get_record('flipbook_hotspot', array('id' => $hotspotid), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/flipbook:managemultimedia', $context);

$PAGE->set_url('/mod/flipbook/upload_audio.php', array('cmid' => $cmid, 'hotspotid' => $hotspotid));
$PAGE->set_title(get_string('uploadaudio', 'mod_flipbook'));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['audiofile'])) {
    
    if ($_FILES['audiofile']['error'] === UPLOAD_ERR_OK) {
        $fs = get_file_storage();
        
        // Delete existing audio file
        $fs->delete_area_files($context->id, 'mod_flipbook', 'audio', $hotspotid);
        
        // Prepare file record
        $filerecord = array(
            'contextid' => $context->id,
            'component' => 'mod_flipbook',
            'filearea' => 'audio',
            'itemid' => $hotspotid,
            'filepath' => '/',
            'filename' => clean_filename($_FILES['audiofile']['name'])
        );
        
        // Create file from uploaded file
        $fs->create_file_from_pathname($filerecord, $_FILES['audiofile']['tmp_name']);
        
        // Update hotspot timestamp
        $hotspot->timemodified = time();
        $DB->update_record('flipbook_hotspot', $hotspot);
        
        // Redirect back to view page
        redirect(
            new moodle_url('/mod/flipbook/view.php', array('id' => $cmid)),
            get_string('hotspotsaved', 'mod_flipbook'),
            null,
            \core\output\notification::NOTIFY_SUCCESS
        );
    } else {
        $error = 'Error uploading file';
    }
}

echo $OUTPUT->header();
echo $OUTPUT->heading(get_string('uploadaudio', 'mod_flipbook'));

if (isset($error)) {
    echo $OUTPUT->notification($error, 'error');
}

echo '<div style="max-width: 600px; margin: 20px auto;">';
echo '<form method="post" enctype="multipart/form-data" style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">';
echo '<div style="margin-bottom: 20px;">';
echo '<label for="audiofile" style="display: block; font-weight: bold; margin-bottom: 10px;">' . get_string('audiofile', 'mod_flipbook') . ':</label>';
echo '<input type="file" name="audiofile" id="audiofile" accept="audio/mp3,audio/mpeg" required style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 4px;">';
echo '<small style="display: block; margin-top: 5px; color: #666;">Página ' . $hotspot->pagenumber . ' - Posición: (' . round($hotspot->xposition, 1) . '%, ' . round($hotspot->yposition, 1) . '%)</small>';
echo '</div>';
echo '<div style="display: flex; gap: 10px;">';
echo '<button type="submit" style="flex: 1; background: #0066cc; color: white; border: none; padding: 12px; border-radius: 5px; cursor: pointer; font-weight: bold;">Subir Audio</button>';
echo '<a href="' . new moodle_url('/mod/flipbook/view.php', array('id' => $cmid)) . '" style="flex: 1; background: #6c757d; color: white; border: none; padding: 12px; border-radius: 5px; text-align: center; text-decoration: none; font-weight: bold;">Cancelar</a>';
echo '</div>';
echo '</form>';
echo '</div>';

echo $OUTPUT->footer();