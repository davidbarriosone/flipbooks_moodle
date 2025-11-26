<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

function xmldb_flipbook_upgrade($oldversion) {
    global $DB;
    $dbman = $DB->get_manager();

    if ($oldversion < 2024112501) {
        // Define table flipbook_hotspot to be created.
        $table = new xmldb_table('flipbook_hotspot');

        // Adding fields to table flipbook_hotspot.
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('flipbookid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('pagenumber', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('xposition', XMLDB_TYPE_NUMBER, '10, 2', null, XMLDB_NOTNULL, null, null);
        $table->add_field('yposition', XMLDB_TYPE_NUMBER, '10, 2', null, XMLDB_NOTNULL, null, null);
        $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');

        // Adding keys to table flipbook_hotspot.
        $table->add_key('primary', XMLDB_KEY_PRIMARY, array('id'));
        $table->add_key('flipbookid', XMLDB_KEY_FOREIGN, array('flipbookid'), 'flipbook', array('id'));

        // Adding indexes to table flipbook_hotspot.
        $table->add_index('flipbook_page', XMLDB_INDEX_NOTUNIQUE, array('flipbookid', 'pagenumber'));

        // Conditionally launch create table for flipbook_hotspot.
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        // Flipbook savepoint reached.
        upgrade_mod_savepoint(true, 2024112501, 'flipbook');
    }

    return true;
}