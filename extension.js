const Gettext = imports.gettext;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const St = imports.gi.St;
const Tweener = imports.ui.tweener;

let _;
let settings, metadata;
let disperMenu, errorMessage;

function init(extension) {
    const Convenience = extension.imports.convenience;
    Convenience.initTranslations();
    _ = Gettext.domain(extension.metadata['gettext-domain']).gettext;
    settings = Convenience.getSettings();
    metadata = {
        name: extension.metadata.name,
        path: extension.path
    };
}

function enable() {
    if (!disperMenu) {
        disperMenu = new DisperMenu();
    }
    let role = settings.get_string('role');
    Main.panel.addToStatusArea(role, disperMenu);
}

function disable() {
    disperMenu.destroy();
    disperMenu = null;
}

function hideMessage(message) {
    Main.uiGroup.remove_actor(message);
    message = null;
}

function showMessage(message, messageText) {
    if (!message) {
        message = new St.Label({
            style_class: 'message-label',
            text: messageText.trim()
        });
        Main.uiGroup.add_actor(message);
    }
    message.opacity = 255;
    let monitor = Main.layoutManager.primaryMonitor;
    message.set_position(Math.floor(monitor.width / 2 - message.width / 2),
        Math.floor(monitor.height / 2 - message.height / 2));
    Tweener.addTween(message, {
        opacity: 0,
        time: settings.get_int('message-fade-out-time'),
        transition: 'easeOutQuad',
        onComplete: hideMessage,
        onCompleteParams: [message]
    });
}

const LabelMenuItem = new Lang.Class({
    Name: 'LabelMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function (text) {
        this.parent();
        let label = new St.Label({
            text: text
        });
        this.actor.add(label);
        this.actor.label_actor = label;
    }
});

const DisperMenuItem = new Lang.Class({
    Name: 'DisperMenuItem',
    Extends: LabelMenuItem,

    _init: function (text, action) {
        this.parent(text);
        this.connect('activate', function () {
            try {
                let command = disperMenu.commands[action];
                let [result, stdout, stderr] = GLib.spawn_command_line_sync(command);
                let message = stderr.toString();
                if (message != '') {
                    showMessage(errorMessage, message);
                }
            } catch (error) {
                let message = error.message;
                if (message != '') {
                    log('Disper Menu error: ' + message);
                    showMessage(errorMessage, _('Disper not found or other error'));
                }
            }
        });
    }
});

const DisperMenu = new Lang.Class({
    Name: 'DisperMenu',
    Extends: PanelMenu.Button,

    _init: function () {
        this._menuAlignment = 0.0;
        this.parent(this._menuAlignment, metadata.name);
        this._settingsId = settings.connect('changed', Lang.bind(this, this._reload));
        this._actionsSingle = {
            'primary': _('Primary display'),
            'secondary': _('Secondary display')
        };
        this._actionsOther = {
            'clone': _('Clone display'),
            'extend': _('Extend display'),
            'cycle': _('Cycle between setups')
        };
        let hbox = new St.BoxLayout({
            style_class: 'panel-status-menu-box'
        });
        let icon = new St.Icon({
            gicon: new Gio.FileIcon({
                file: Gio.File.new_for_path(metadata.path + '/images/disper-menu.svg')
            }),
            style_class: 'system-status-icon'
        });
        hbox.add_child(icon);
        hbox.add_child(PopupMenu.arrowIcon(St.Side.BOTTOM));
        this.actor.add_child(hbox);
        this._reload();
        this._addDisperMenuItemsToMenu(this._actionsSingle, this.commands);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this._addDisperMenuItemsToMenu(this._actionsOther, this.commands);
    },

    _addDisperMenuItemsToMenu: function (actions, commands) {
        for (let action in actions) {
            let text = actions[action];
            let menuItem = new DisperMenuItem(text, action);
            this.menu.addMenuItem(menuItem);
        }
    },

    _buildCommands: function () {
        let commands = [];
        let useBelowSettings = settings.get_boolean('use-below-settings');
        let scalingMode = settings.get_string('scaling-mode');
        let extendDirection = settings.get_string('extend-direction');
        let disper = ['disper'];
        let actions = {
            primary: '-s',
            secondary: '-S',
            clone: '-c',
            extend: '-e',
            cycle: '-C'
        };
        let options = {
            scalingMode: '--scaling=',
            extendDirection: '--direction='
        };
        for (let action in actions) {
            let command = disper.slice(0);
            command.push(actions[action]);
            if (useBelowSettings) {
                command.push(options.scalingMode + scalingMode);
                if (action == 'extend') {
                    command.push(options.extendDirection + extendDirection);
                }
            }
            commands.push(command);
        }
        let result = {};
        let i = 0;
        for (let action in actions) {
            result[action] = commands[i++].join(' ');
        }
        return result;
    },

    destroy: function () {
        settings.disconnect(this._settingsId);
        this.parent();
    },

    _reload: function () {
        this.commands = this._buildCommands();
    }
});
