<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot.'/course/moodleform_mod.php');

class mod_flipbook_mod_form extends moodleform_mod {
    
    public function definition() {
        global $CFG;
        
        $mform = $this->_form;
        
        // Name
        $mform->addElement('text', 'name', get_string('flipbookname', 'mod_flipbook'), array('size' => '48'));
        if (!empty($CFG->formatstringstriptags)) {
            $mform->setType('name', PARAM_TEXT);
        } else {
            $mform->setType('name', PARAM_CLEANHTML);
        }
        $mform->addRule('name', null, 'required', null, 'client');
        $mform->addRule('name', get_string('maximumchars', '', 255), 'maxlength', 255, 'client');
        
        // Introduction
        $this->standard_intro_elements();
        
        // PDF File
        $filemanageroptions = array();
        $filemanageroptions['accepted_types'] = array('.pdf');
        $filemanageroptions['maxbytes'] = 0;
        $filemanageroptions['maxfiles'] = 1;
        $filemanageroptions['subdirs'] = 0;
        
        $mform->addElement('filemanager', 'pdffile', get_string('pdffile', 'mod_flipbook'), null, $filemanageroptions);
        
        // Standard elements
        $this->standard_coursemodule_elements();
        $this->add_action_buttons();
    }
    
    public function data_preprocessing(&$defaultvalues) {
        if ($this->current->instance) {
            $draftitemid = file_get_submitted_draft_itemid('pdffile');
            $options = array(
                'subdirs' => 0,
                'maxbytes' => 0,
                'maxfiles' => 1
            );
            file_prepare_draft_area($draftitemid, $this->context->id, 'mod_flipbook', 'content', 0, $options);
            $defaultvalues['pdffile'] = $draftitemid;
        }
    }
}
