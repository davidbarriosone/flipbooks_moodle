<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Add flipbook instance.
 */
function flipbook_add_instance($data, $mform = null) {
    global $DB;

    $data->timecreated = time();
    $data->timemodified = time();

    $data->id = $DB->insert_record('flipbook', $data);

    // Save the PDF file
    if ($mform) {
        flipbook_save_pdf($data, $mform);
    }

    return $data->id;
}

/**
 * Update flipbook instance.
 */
function flipbook_update_instance($data, $mform = null) {
    global $DB;

    $data->timemodified = time();
    $data->id = $data->instance;

    if ($mform) {
        flipbook_save_pdf($data, $mform);
    }

    return $DB->update_record('flipbook', $data);
}

/**
 * Delete flipbook instance.
 */
function flipbook_delete_instance($id) {
    global $DB;

    if (!$flipbook = $DB->get_record('flipbook', array('id' => $id))) {
        return false;
    }

    // Get the course module to obtain context
    $cm = get_coursemodule_from_instance('flipbook', $id);
    if ($cm) {
        $context = context_module::instance($cm->id);
        
        // Delete the PDF file
        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'mod_flipbook', 'content');
    }

    $DB->delete_records('flipbook', array('id' => $flipbook->id));

    return true;
}

/**
 * Save PDF file.
 */
function flipbook_save_pdf($data, $mform) {
    global $DB;

    $context = context_module::instance($data->coursemodule);
    
    // Save files
    file_save_draft_area_files(
        $data->pdffile,
        $context->id,
        'mod_flipbook',
        'content',
        0,
        array('subdirs' => 0, 'maxfiles' => 1)
    );

    // Get the saved file name
    $fs = get_file_storage();
    $files = $fs->get_area_files($context->id, 'mod_flipbook', 'content', 0, 'filename', false);
    
    if (!empty($files)) {
        $file = reset($files);
        $data->pdffile = $file->get_filename();
        $DB->update_record('flipbook', $data);
    }
}

/**
 * Supported features.
 */
function flipbook_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        default:
            return null;
    }
}

/**
 * File serving.
 */
function flipbook_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = array()) {
    if ($context->contextlevel != CONTEXT_MODULE) {
        return false;
    }

    require_login($course, true, $cm);

    if ($filearea !== 'content') {
        return false;
    }

    $fs = get_file_storage();
    $relativepath = implode('/', $args);
    $fullpath = "/$context->id/mod_flipbook/$filearea/0/$relativepath";
    
    $file = $fs->get_file_by_hash(sha1($fullpath));
    
    if (!$file || $file->is_directory()) {
        return false;
    }

    send_stored_file($file, 0, 0, $forcedownload, $options);
}

/**
 * List of view style log actions
 */
function flipbook_get_view_actions() {
    return array('view', 'view all');
}

/**
 * List of update style log actions
 */
function flipbook_get_post_actions() {
    return array('update', 'add');
}