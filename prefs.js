const Gettext = imports.gettext;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const _ = Gettext.gettext;
const SETTINGS_SCALING_MODE_KEY = 'scaling-mode';
const SETTINGS_EXTEND_DIRECTION_KEY = 'extend-direction';
const SETTINGS_MESSAGE_FADE_OUT_TIME_KEY = 'message-fade-out-time';
const SETTINGS_USE_BELOW_SETTINGS = 'use-below-settings';

let settings;

function init() {
    let extension = imports.misc.extensionUtils.getCurrentExtension();
    let convenience = extension.imports.convenience;
    convenience.initTranslations();
    settings = convenience.getSettings();
}

const Box = new Lang.Class({
    Name: 'Box',
    Extends: Gtk.Box,

    _init: function (grid) {
        this.parent({
            orientation: Gtk.Orientation.HORIZONTAL,
            border_width: 18
        });
        this.set_center_widget(grid);
        this.show_all();
    }
});

const Grid = new Lang.Class({
    Name: 'Grid',
    Extends: Gtk.Grid,

    _init: function (controls) {
        this.parent({
            column_spacing: 12,
            row_spacing: 18
        });
        let maxWidth = 0;
        for (let i in controls) {
            let width = controls[i].length;
            if (maxWidth < width) {
                maxWidth = width;
            }
        }
        for (let i in controls) {
            if (controls[i].length != 1) {
                for (let j in controls[i]) {
                    this.attach(controls[i][j], j, i, 1, 1);
                }
            } else {
                this.attach(controls[i][0], 0, i, maxWidth, 1);
            }
        }
    }
});

const Label = new Lang.Class({
    Name: 'Label',
    Extends: Gtk.Label,

    _init: function (label) {
        this.parent({
            label: label
        });
        this.set_alignment(1.0, 0.5);
    }
});

const CheckBox = new Lang.Class({
    Name: 'CheckBox',
    Extends: Gtk.CheckButton,

    _init: function (settings, settings_key, toggled_hook) {
        let state = settings.get_boolean(settings_key);
        this.parent({
            active: state
        });
        toggled_hook(state);
        this.connect('toggled', function (checkBox) {
            let state = checkBox.get_active();
            settings.set_boolean(settings_key, state);
            toggled_hook(state);
        });
    }
});

const Select = new Lang.Class({
    Name: 'Select',
    Extends: Gtk.ComboBoxText,

    _init: function (texts, settings, settingsKey) {
        this.parent();
        for (let i in texts) {
            this.append_text(texts[i]);
        }
        this.set_active(settings.get_enum(settingsKey));
        this.connect('changed', function (select) {
            settings.set_enum(settingsKey, select.get_active());
        });
    }
});

const NumberEdit = new Lang.Class({
    Name: 'NumberEdit',
    Extends: Gtk.SpinButton,

    _init: function (settings, settings_key) {
        this.parent({
            adjustment: new Gtk.Adjustment({
                value: settings.get_int(settings_key),
                lower: 0,
                upper: 8,
                'step-increment': 1
            })
        });
        this.connect('value-changed', function (numberEdit) {
            settings.set_int(settings_key, numberEdit.get_value());
        });
    }
});

function buildPrefsWidget() {
    let labelUseBelowSettings = new Label(_('Use below settings'));
    let labelScalingMode = new Label(_('Scaling mode') + ':');
    let labelExtendDirection = new Label(_('Display extend direction') + ':');
    let labelMessageFadeOutTime = new Label(_('Messages fade out time') + ' (s):');
    let scalingModes = [_('default'), _('native'), _('scaled'), _('centered'), _('aspect-scaled')];
    let scalingMode = new Select(scalingModes, settings, SETTINGS_SCALING_MODE_KEY);
    let extendDirections = [_('left'), _('right'), _('top'), _('bottom')];
    let extendDirection = new Select(extendDirections, settings, SETTINGS_EXTEND_DIRECTION_KEY);
    let useBelowSettings = new CheckBox(settings, SETTINGS_USE_BELOW_SETTINGS, function (state) {
        let belowSettings = [
            labelScalingMode, scalingMode,
            labelExtendDirection, extendDirection
        ];
        for (let i in belowSettings) {
            belowSettings[i].set_sensitive(state);
        }
    });
    let messageFadeOutTime = new NumberEdit(settings, SETTINGS_MESSAGE_FADE_OUT_TIME_KEY);
    let controls = [
        [labelMessageFadeOutTime, messageFadeOutTime],
        [labelUseBelowSettings, useBelowSettings],
        [new Gtk.HSeparator()],
        [labelScalingMode, scalingMode],
        [labelExtendDirection, extendDirection]
    ];
    let grid = new Grid(controls);
    let box = new Box(grid);
    return box;
}