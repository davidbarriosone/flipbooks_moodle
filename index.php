<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');

$id = required_param('id', PARAM_INT);
redirect(new moodle_url('/course/view.php', array('id' => $id)));
