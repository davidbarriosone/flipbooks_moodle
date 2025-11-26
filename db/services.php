<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$functions = array(
    'mod_flipbook_add_hotspot' => array(
        'classname'   => 'mod_flipbook\external\hotspot_manager',
        'methodname'  => 'add_hotspot',
        'description' => 'Add a new multimedia hotspot to a flipbook page',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/flipbook:managemultimedia'
    ),
    'mod_flipbook_delete_hotspot' => array(
        'classname'   => 'mod_flipbook\external\hotspot_manager',
        'methodname'  => 'delete_hotspot',
        'description' => 'Delete a multimedia hotspot from a flipbook',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/flipbook:managemultimedia'
    ),
    'mod_flipbook_get_hotspots' => array(
        'classname'   => 'mod_flipbook\external\hotspot_manager',
        'methodname'  => 'get_hotspots',
        'description' => 'Get all multimedia hotspots for a flipbook',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'mod/flipbook:view'
    )
);