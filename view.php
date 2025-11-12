<?php
// This file is part of Moodle - http://moodle.org/

require_once('../../config.php');
require_once('lib.php');

$id = required_param('id', PARAM_INT); // Course Module ID

$cm = get_coursemodule_from_id('flipbook', $id, 0, false, MUST_EXIST);
$course = $DB->get_record('course', array('id' => $cm->course), '*', MUST_EXIST);
$flipbook = $DB->get_record('flipbook', array('id' => $cm->instance), '*', MUST_EXIST);

require_login($course, true, $cm);
$context = context_module::instance($cm->id);
require_capability('mod/flipbook:view', $context);

// Trigger module viewed event
$event = \mod_flipbook\event\course_module_viewed::create(array(
    'objectid' => $flipbook->id,
    'context' => $context
));
$event->add_record_snapshot('course', $course);
$event->add_record_snapshot('flipbook', $flipbook);
$event->trigger();

// Page setup
$PAGE->set_url('/mod/flipbook/view.php', array('id' => $cm->id));
$PAGE->set_title(format_string($flipbook->name));
$PAGE->set_heading(format_string($course->fullname));
$PAGE->set_context($context);

// Get PDF file
$fs = get_file_storage();
$files = $fs->get_area_files($context->id, 'mod_flipbook', 'content', 0, 'filename', false);
$pdfurl = '';

if (!empty($files)) {
    $file = reset($files);
    $pdfurl = moodle_url::make_pluginfile_url(
        $context->id,
        'mod_flipbook',
        'content',
        0,
        '/',
        $file->get_filename()
    );
}

// Add CSS and JS
$PAGE->requires->css('/mod/flipbook/styles/flipbook.css');
$PAGE->requires->js('/mod/flipbook/js/pdf.min.js', true);
$PAGE->requires->js('/mod/flipbook/js/turn.min.js', true);
$PAGE->requires->js_call_amd('mod_flipbook/flipbook', 'init', array(
    'pdfUrl' => $pdfurl->out(false),
    'width' => $flipbook->width,
    'height' => $flipbook->height,
    'zoom' => $flipbook->zoom,
    'autoflip' => $flipbook->autoflip,
    'showcontrols' => $flipbook->showcontrols,
    'showtoolbar' => $flipbook->showtoolbar
));

echo $OUTPUT->header();

// Display intro
echo $OUTPUT->box_start('generalbox boxaligncenter', 'intro');
echo format_module_intro('flipbook', $flipbook, $cm->id);
echo $OUTPUT->box_end();

// Display flipbook container
?>
<div id="flipbook-container">
    <?php if ($flipbook->showtoolbar): ?>
    <div id="flipbook-toolbar">
        <button id="zoom-in" class="flipbook-btn" title="<?php echo get_string('zoomin', 'mod_flipbook'); ?>">
            <i class="fa fa-search-plus"></i> +
        </button>
        <button id="zoom-out" class="flipbook-btn" title="<?php echo get_string('zoomout', 'mod_flipbook'); ?>">
            <i class="fa fa-search-minus"></i> -
        </button>
        <button id="fullscreen" class="flipbook-btn" title="<?php echo get_string('fullscreen', 'mod_flipbook'); ?>">
            <i class="fa fa-expand"></i>
        </button>
        <span id="page-info"></span>
        <button id="download-pdf" class="flipbook-btn" title="<?php echo get_string('download', 'mod_flipbook'); ?>">
            <i class="fa fa-download"></i>
        </button>
    </div>
    <?php endif; ?>
    
    <div id="flipbook-viewer">
        <div id="flipbook"></div>
    </div>
    
    <?php if ($flipbook->showcontrols): ?>
    <div id="flipbook-controls">
        <button id="prev-page" class="flipbook-btn">
            <i class="fa fa-chevron-left"></i> <?php echo get_string('previous', 'mod_flipbook'); ?>
        </button>
        <input type="text" id="page-input" size="3" />
        <span id="total-pages"></span>
        <button id="next-page" class="flipbook-btn">
            <?php echo get_string('next', 'mod_flipbook'); ?> <i class="fa fa-chevron-right"></i>
        </button>
    </div>
    <?php endif; ?>
    
    <div id="loading-message" style="text-align: center; padding: 50px;">
        <i class="fa fa-spinner fa-spin fa-3x"></i>
        <p><?php echo get_string('loading', 'mod_flipbook'); ?></p>
    </div>
</div>

<?php
echo $OUTPUT->footer();
