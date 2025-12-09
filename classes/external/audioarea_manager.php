<?php
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

class audioarea_manager extends external_api {

    public static function add_audioarea_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course module ID'),
                'page' => new external_value(PARAM_INT, 'Page number'),
                'x' => new external_value(PARAM_FLOAT, 'X position (percentage)'),
                'y' => new external_value(PARAM_FLOAT, 'Y position (percentage)'),
                'width' => new external_value(PARAM_FLOAT, 'Width (percentage)'),
                'height' => new external_value(PARAM_FLOAT, 'Height (percentage)')
            )
        );
    }

    public static function add_audioarea($cmid, $page, $x, $y, $width, $height) {
        global $DB;

        $params = self::validate_parameters(
            self::add_audioarea_parameters(),
            array('cmid' => $cmid, 'page' => $page, 'x' => $x, 'y' => $y, 'width' => $width, 'height' => $height)
        );

        $cm = get_coursemodule_from_id('flipbook', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        
        self::validate_context($context);
        require_capability('mod/flipbook:managemultimedia', $context);

        $flipbook = $DB->get_record('flipbook', array('id' => $cm->instance), '*', MUST_EXIST);

        $audioareaid = flipbook_add_audio_area(
            $flipbook->id,
            $params['page'],
            $params['x'],
            $params['y'],
            $params['width'],
            $params['height']
        );

        return array(
            'success' => true,
            'audioareaid' => $audioareaid,
            'message' => get_string('audioareaadded', 'mod_flipbook')
        );
    }

    public static function add_audioarea_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'audioareaid' => new external_value(PARAM_INT, 'New audio area ID'),
                'message' => new external_value(PARAM_TEXT, 'Success message')
            )
        );
    }

    public static function delete_audioarea_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course module ID'),
                'audioareaid' => new external_value(PARAM_INT, 'Audio area ID')
            )
        );
    }

    public static function delete_audioarea($cmid, $audioareaid) {
        global $DB;

        $params = self::validate_parameters(
            self::delete_audioarea_parameters(),
            array('cmid' => $cmid, 'audioareaid' => $audioareaid)
        );

        $cm = get_coursemodule_from_id('flipbook', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        
        self::validate_context($context);
        require_capability('mod/flipbook:managemultimedia', $context);

        $fs = get_file_storage();
        $fs->delete_area_files($context->id, 'mod_flipbook', 'audio', $params['audioareaid']);

        flipbook_delete_audio_area($params['audioareaid']);

        return array(
            'success' => true,
            'message' => get_string('audioareadeleted', 'mod_flipbook')
        );
    }

    public static function delete_audioarea_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'message' => new external_value(PARAM_TEXT, 'Success message')
            )
        );
    }

    public static function get_audioareas_parameters() {
        return new external_function_parameters(
            array(
                'cmid' => new external_value(PARAM_INT, 'Course module ID')
            )
        );
    }

    public static function get_audioareas($cmid) {
        global $DB;

        $params = self::validate_parameters(
            self::get_audioareas_parameters(),
            array('cmid' => $cmid)
        );

        $cm = get_coursemodule_from_id('flipbook', $params['cmid'], 0, false, MUST_EXIST);
        $context = context_module::instance($cm->id);
        
        self::validate_context($context);
        require_capability('mod/flipbook:view', $context);

        $flipbook = $DB->get_record('flipbook', array('id' => $cm->instance), '*', MUST_EXIST);
        $audioareas = flipbook_get_audio_areas($flipbook->id);
        
        $result = array();
        foreach ($audioareas as $area) {
            $audiofile = flipbook_get_audio_area_audio($context->id, $area->id);
            $audiourl = '';
            
            if ($audiofile) {
                $audiourl = moodle_url::make_pluginfile_url(
                    $context->id,
                    'mod_flipbook',
                    'audio',
                    $area->id,
                    $audiofile->get_filepath(),
                    $audiofile->get_filename()
                )->out();
            }
            
            $result[] = array(
                'id' => $area->id,
                'page' => $area->pagenumber,
                'x' => $area->xposition,
                'y' => $area->yposition,
                'width' => $area->width,
                'height' => $area->height,
                'audiourl' => $audiourl,
                'hasaudio' => !empty($audiourl)
            );
        }

        return array(
            'success' => true,
            'audioareas' => $result
        );
    }

    public static function get_audioareas_returns() {
        return new external_single_structure(
            array(
                'success' => new external_value(PARAM_BOOL, 'Success status'),
                'audioareas' => new external_multiple_structure(
                    new external_single_structure(
                        array(
                            'id' => new external_value(PARAM_INT, 'Audio area ID'),
                            'page' => new external_value(PARAM_INT, 'Page number'),
                            'x' => new external_value(PARAM_FLOAT, 'X position'),
                            'y' => new external_value(PARAM_FLOAT, 'Y position'),
                            'width' => new external_value(PARAM_FLOAT, 'Width'),
                            'height' => new external_value(PARAM_FLOAT, 'Height'),
                            'audiourl' => new external_value(PARAM_URL, 'Audio file URL'),
                            'hasaudio' => new external_value(PARAM_BOOL, 'Has audio file')
                        )
                    )
                )
            )
        );
    }
}
