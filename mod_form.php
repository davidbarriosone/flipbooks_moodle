<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_flipbook_mod_form extends moodleform_mod {

    function definition() {
        global $CFG;

        $mform = $this->_form;

        // General settings
        $mform->addElement('header', 'general', get_string('general', 'form'));

        // Name
        $mform->addElement('text', 'name', get_string('name'), array('size' => '64'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');

        // Description
        $this->standard_intro_elements();

        // PDF File upload
        $mform->addElement('header', 'pdfheader', get_string('pdffile', 'mod_flipbook'));
        
        $filemanageroptions = array(
            'subdirs' => 0,
            'maxbytes' => $CFG->maxbytes,
            'areamaxbytes' => 10485760,
            'maxfiles' => 1,
            'accepted_types' => array('.pdf'),
            'return_types' => FILE_INTERNAL | FILE_EXTERNAL
        );
        
        $mform->addElement('filemanager', 'pdffile', get_string('pdffile', 'mod_flipbook'), null, $filemanageroptions);
        $mform->addHelpButton('pdffile', 'pdffile', 'mod_flipbook');

        // Display settings
        $mform->addElement('header', 'displaysettings', get_string('displaysettings', 'mod_flipbook'));

        // Width
        $mform->addElement('text', 'width', get_string('width', 'mod_flipbook'), array('size' => '10'));
        $mform->setType('width', PARAM_INT);
        $mform->setDefault('width', 800);
        $mform->addHelpButton('width', 'width', 'mod_flipbook');

        // Height
        $mform->addElement('text', 'height', get_string('height', 'mod_flipbook'), array('size' => '10'));
        $mform->setType('height', PARAM_INT);
        $mform->setDefault('height', 600);
        $mform->addHelpButton('height', 'height', 'mod_flipbook');

        // Zoom enabled
        $mform->addElement('advcheckbox', 'zoom', get_string('zoom', 'mod_flipbook'));
        $mform->setDefault('zoom', 1);
        $mform->addHelpButton('zoom', 'zoom', 'mod_flipbook');

        // Auto flip time (0 = disabled)
        $mform->addElement('text', 'autoflip', get_string('autoflip', 'mod_flipbook'), array('size' => '10'));
        $mform->setType('autoflip', PARAM_INT);
        $mform->setDefault('autoflip', 0);
        $mform->addHelpButton('autoflip', 'autoflip', 'mod_flipbook');

        // Show controls
        $mform->addElement('advcheckbox', 'showcontrols', get_string('showcontrols', 'mod_flipbook'));
        $mform->setDefault('showcontrols', 1);
        $mform->addHelpButton('showcontrols', 'showcontrols', 'mod_flipbook');

        // Show toolbar
        $mform->addElement('advcheckbox', 'showtoolbar', get_string('showtoolbar', 'mod_flipbook'));
        $mform->setDefault('showtoolbar', 1);
        $mform->addHelpButton('showtoolbar', 'showtoolbar', 'mod_flipbook');

        // Standard elements
        $this->standard_coursemodule_elements();
        $this->add_action_buttons();
    }

    function data_preprocessing(&$default_values) {
        // Initialize draft area for file manager
        $draftitemid = file_get_submitted_draft_itemid('pdffile');
        
        if ($this->current->instance) {
            // Editing existing instance
            file_prepare_draft_area(
                $draftitemid, 
                $this->context->id, 
                'mod_flipbook', 
                'content', 
                0,
                array('subdirs' => 0, 'maxfiles' => 1)
            );
        } else {
            // New instance - prepare empty draft area
            file_prepare_draft_area(
                $draftitemid,
                null,
                'mod_flipbook',
                'content',
                0,
                array('subdirs' => 0, 'maxfiles' => 1)
            );
        }
        
        $default_values['pdffile'] = $draftitemid;
    }

    function validation($data, $files) {
        $errors = parent::validation($data, $files);
        
        return $errors;
    }
}
