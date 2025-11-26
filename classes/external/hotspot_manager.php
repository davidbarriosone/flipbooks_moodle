<?php
// This file is part of Moodle - http://moodle.org/

namespace mod_flipbook\external;

use external_api;
use external_function_parameters;
use external_value;
use external_single_structure;
use external_multiple_structure;
use context_module;
use moodle_url;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->libdir . '/externallib.php');
require_once($CFG->dirroot . '/mod/flipbook/lib.php');

/**
 * External API for flipbook hotspot management
 */
class hotspot_manager extends external_api {

    /**
     * Returns description of method parameters for add_hotspot
     */
    public static function add_hotspot_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course module ID'),
                'page' => new external_value(PARAM_INT, 'Page number'),
                'x' => new external_value(PARAM_FLOAT, 'X position (percentage)'),
                'y' => new external_value(PARAM_FLOAT, 'Y position (percentage)')
            )
        );
    }

    /**
     * Add a new hotspot
     */
    public static function add_hotspot($cmid, $page, $x, $y) {
        global $DB;

        $params = self::validate_parameters(
            self::add_hotspot_parameters(),
            array('cmid' => $cmid, 'page' => $page, 'x' => $x, 'y' => $y)
        );

        $cm = get_coursemodule_from_id('flipbook', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        
        self::validate_context($context);
        require_capability('mod/flipbook:managemultimedia', $context);

        $flipbook = $DB->get_record('flipbook', array('id' => $cm->instance), '*', MUST_EXIST);

        $hotspotid = flipbook_add_hotspot(
            $flipbook->id,
            $params['page'],
            $params['x'],
            $params['y']
        );

        return array(
            'success' => true,
            'hotspotid' => $hotspotid,
            'message' => get_string('hotspotadded', 'mod_flipbook')
        );
    }

    /**
     * Returns description of method result value for add_hotspot
     */
    public static function add_hotspot_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'hotspotid' => new external_value(PARAM_INT, 'New hotspot ID'),
                'message' => new external_value(PARAM_TEXT, 'Success message')
            )
        );
    }

    /**
     * Returns description of method parameters for delete_hotspot
     */
    public static function delete_hotspot_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course module ID'),
                'hotspotid' => new external_value(PARAM_INT, 'Hotspot ID')
            )
        );
    }

    /**
     * Delete a hotspot
     */
    public static function delete_hotspot($cmid, $hotspotid) {
        global $DB;

        $params = self::validate_parameters(
            self::delete_hotspot_parameters(),
            array('cmid' => $cmid, 'hotspotid' => $hotspotid)
        );

        $cm = get_coursemodule_from_id('flipbook', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        
        self::validate_context($context);
        require_capability('mod/flipbook:managemultimedia', $context);

        // Delete audio file
        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'mod_flipbook', 'audio', $params['hotspotid']);

        // Delete hotspot record
        flipbook_delete_hotspot($params['hotspotid']);

        return array(
            'success' => true,
            'message' => get_string('hotspotdeleted', 'mod_flipbook')
        );
    }

    /**
     * Returns description of method result value for delete_hotspot
     */
    public static function delete_hotspot_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'message' => new external_value(PARAM_TEXT, 'Success message')
            )
        );
    }

    /**
     * Returns description of method parameters for get_hotspots
     */
    public static function get_hotspots_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course module ID')
            )
        );
    }

    /**
     * Get all hotspots for a flipbook
     */
    public static function get_hotspots($cmid) {
        global $DB;

        $params = self::validate_parameters(
            self::get_hotspots_parameters(),
            array('cmid' => $cmid)
        );

        $cm = get_coursemodule_from_id('flipbook', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        
        self::validate_context($context);
        require_capability('mod/flipbook:view', $context);

        $flipbook = $DB->get_record('flipbook', array('id' => $cm->instance), '*', MUST_EXIST);
        $hotspots = flipbook_get_hotspots($flipbook->id);
        
        $result = array();
        foreach ($hotspots as $hotspot) {
            $audiofile = flipbook_get_hotspot_audio($context->id, $hotspot->id);
            $audiourl = '';
            
            if ($audiofile) {
                $audiourl = moodle_url::make_pluginfile_url(
                    $context->id,
                    'mod_flipbook',
                    'audio',
                    $hotspot->id,
                    $audiofile->get_filepath(),
                    $audiofile->get_filename()
                )->out();
            }
            
            $result[] = array(
                'id' => $hotspot->id,
                'page' => $hotspot->pagenumber,
                'x' => $hotspot->xposition,
                'y' => $hotspot->yposition,
                'audiourl' => $audiourl,
                'hasaudio' => !empty($audiourl)
            );
        }

        return array(
            'success' => true,
            'hotspots' => $result
        );
    }

    /**
     * Returns description of method result value for get_hotspots
     */
    public static function get_hotspots_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'hotspots' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Hotspot ID'),
                            'page' => new external_value(PARAM_INT, 'Page number'),
                            'x' => new external_value(PARAM_FLOAT, 'X position'),
                            'y' => new external_value(PARAM_FLOAT, 'Y position'),
                            'audiourl' => new external_value(PARAM_URL, 'Audio file URL'),
                            'hasaudio' => new external_value(PARAM_BOOL, 'Has audio file')
                        )
                    )
                )
            )
        );
    }
}