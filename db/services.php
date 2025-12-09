<?php
defined('MOODLE_INTERNAL') || die();

$functions = array(
    'mod_flipbook_add_audioarea' => array(
        'classname'   => 'mod_flipbook\external\audioarea_manager',
        'methodname'  => 'add_audioarea',
        'description' => 'Add a new audio area to a flipbook page',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/flipbook:managemultimedia'
    ),
    'mod_flipbook_delete_audioarea' => array(
        'classname'   => 'mod_flipbook\external\audioarea_manager',
        'methodname'  => 'delete_audioarea',
        'description' => 'Delete an audio area from a flipbook',
        'type'        => 'write',
        'ajax'        => true,
        'capabilities' => 'mod/flipbook:managemultimedia'
    ),
    'mod_flipbook_get_audioareas' => array(
        'classname'   => 'mod_flipbook\external\audioarea_manager',
        'methodname'  => 'get_audioareas',
        'description' => 'Get all audio areas for a flipbook',
        'type'        => 'read',
        'ajax'        => true,
        'capabilities' => 'mod/flipbook:view'
    )
);
