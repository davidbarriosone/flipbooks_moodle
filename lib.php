<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

/**
 * Add flipbook instance
 */
function flipbook_add_instance($flipbook, $moodleform = null) {
    global $DB;
    
    $flipbook->timecreated = time();
    $flipbook->timemodified = $flipbook->timecreated;
    
    $flipbook->id = $DB->insert_record('flipbook', $flipbook);
    
    // Save files after course module is created
    flipbook_after_add_or_update($flipbook);
    
    return $flipbook->id;
}

/**
 * Update flipbook instance
 */
function flipbook_update_instance($flipbook, $moodleform = null) {
    global $DB;
    
    $flipbook->timemodified = time();
    $flipbook->id = $flipbook->instance;
    
    $DB->update_record('flipbook', $flipbook);
    
    // Update files
    flipbook_after_add_or_update($flipbook);
    
    return true;
}

/**
 * Delete flipbook instance
 */
function flipbook_delete_instance($id) {
    global $DB;
    
    if (!$flipbook = $DB->get_record('flipbook', array('id' => $id))) {
        return false;
    }
    
    // Delete all hotspots
    $DB->delete_records('flipbook_hotspot', array('flipbookid' => $flipbook->id));
    
    // Delete flipbook
    $DB->delete_records('flipbook', array('id' => $flipbook->id));
    
    return true;
}

/**
 * Save files after add or update
 */
function flipbook_after_add_or_update($flipbook) {
    global $DB;
    
    $cmid = $flipbook->coursemodule;
    $draftitemid = $flipbook->pdffile;
    
    if ($draftitemid) {
        $context = context_module::instance($cmid);
        $options = array(
            'subdirs' => 0,
            'maxbytes' => 0,
            'maxfiles' => 1,
            'accepted_types' => array('.pdf')
        );
        file_save_draft_area_files($draftitemid, $context->id, 'mod_flipbook', 'content', 0, $options);
    }
}

/**
 * Supported features
 */
function flipbook_supports($feature) {
    switch($feature) {
        case FEATURE_MOD_INTRO:
            return true;
        case FEATURE_SHOW_DESCRIPTION:
            return true;
        case FEATURE_BACKUP_MOODLE2:
            return true;
        default:
            return null;
    }
}

/**
 * Serves the files
 */
function flipbook_pluginfile($course, $cm, $context, $filearea, $args, $forcedownload, array $options = array()) {

    if ($context->contextlevel != CONTEXT_MODULE) {
        send_file_not_found();
    }

    require_login($course, true, $cm);

    if (!has_capability('mod/flipbook:view', $context)) {
        send_file_not_found();
    }

    if ($filearea !== 'content' && $filearea !== 'audio') {
        send_file_not_found();
    }

    $fs = get_file_storage();

    $itemid  = (int) array_shift($args);
    $filename = array_pop($args);
    $filepath = $args ? '/'.implode('/', $args).'/' : '/';

    if (!$file = $fs->get_file($context->id, 'mod_flipbook', $filearea, $itemid, $filepath, $filename)) {
        send_file_not_found();
    }

    send_stored_file($file, null, 0, $forcedownload, $options);
}

/**
 * Get all hotspots for a flipbook
 */
function flipbook_get_hotspots($flipbookid) {
    global $DB;
    return $DB->get_records('flipbook_hotspot', array('flipbookid' => $flipbookid), 'pagenumber, id');
}

/**
 * Get hotspots for a specific page
 */
function flipbook_get_page_hotspots($flipbookid, $pagenumber) {
    global $DB;
    return $DB->get_records('flipbook_hotspot', array('flipbookid' => $flipbookid, 'pagenumber' => $pagenumber), 'id');
}

/**
 * Add a new hotspot
 */
function flipbook_add_hotspot($flipbookid, $pagenumber, $xposition, $yposition) {
    global $DB;
    
    $hotspot = new stdClass();
    $hotspot->flipbookid = $flipbookid;
    $hotspot->pagenumber = $pagenumber;
    $hotspot->xposition = $xposition;
    $hotspot->yposition = $yposition;
    $hotspot->timecreated = time();
    $hotspot->timemodified = time();
    
    return $DB->insert_record('flipbook_hotspot', $hotspot);
}

/**
 * Delete a hotspot
 */
function flipbook_delete_hotspot($hotspotid) {
    global $DB;
    return $DB->delete_records('flipbook_hotspot', array('id' => $hotspotid));
}

/**
 * Get audio file for a hotspot
 */
function flipbook_get_hotspot_audio($contextid, $hotspotid) {
    $fs = get_file_storage();
    $files = $fs->get_area_files($contextid, 'mod_flipbook', 'audio', $hotspotid, 'sortorder DESC, id ASC', false);
    
    if (count($files) >= 1) {
        return reset($files);
    }
    
    return null;
}