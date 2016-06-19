"use strict";

const electron = require('electron');
const {app} = electron; // Module to control application life.
const {BrowserWindow} = electron; // Module to create native browser window.
const {dialog} = electron;
const {ipcMain} = electron;

const $ = require('nodobjc');
const spawn = require('child_process').spawn;

$.import('Foundation');
$.import('Cocoa');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow = null;

const keyDownHandler = $((s, e) => {
    console.log(e);
    //console.log(e('keyCode'));
    function getHtml(keyInfo) {
        function getModSym(flags) {
            let modSym = "";
            if ((flags & $.NSCommandKeyMask) != 0) {
                modSym += "&#x2318;";
            }
            if ((flags & $.NSShiftKeyMask) != 0) {
                //console.log("NSShiftKeyMask");
                modSym += "&#x21E7;";
            }
            if ((flags & $.NSControlKeyMask) != 0) {
                modSym += "^";
            }
            if ((flags & $.NSAlternateKeyMask) != 0) {
                modSym += "&#x2325;";
            }

            return modSym;
        }
        const specialMap = {
            "36": "&#x23ce;",
            "53": "&#x238B;",
            "48": "&#x21E5;",
            "49": "&#x2423;",
            "51": "&#x232b;",
            // arrow
            "123": "&#x2190;",
            "124": "&#x2192;",
            "126": "&#x2191;",
            "125": "&#x2193;",
            // function
            "122": "[F1]",
            "120": "[F2]",
            "99": "[F3]",
            "118": "[F4]",
            "96": "[F5]",
            "97": "[F6]",
            "98": "[F7]",
            "100": "[F8]",
            "101": "[F9]",
            "109": "[F10]",
            "103": "[F11]",
            "111": "[F12]",
            "105": "[F13]",
            "107": "[F14]",
            "113": "[F15]",
            "106": "[F16]",
            "64": "[F17]",
            "79": "[F18]",
            "80": "[F19]",
        };
        //console.log($.NSShiftKeyMask);
        const specialKey = specialMap["" + keyInfo.keyCode]
        if (specialKey) {
            keyInfo.characters = specialKey;
            keyInfo.charactersIgnoringModifiers = specialKey;
        }

        const modSym = getModSym(keyInfo.flags);

        if ((keyInfo.flags & ($.NSControlKeyMask | $.NSAlternateKeyMask | $.NSCommandKeyMask)) == 0) {
            return keyInfo.characters;
        }
        return modSym + keyInfo.charactersIgnoringModifiers.toUpperCase();
    }

    const keyInfo = {
        "characters": e('characters')('UTF8String'),
        "flags": e('modifierFlags'),
        "charactersIgnoringModifiers": e('charactersIgnoringModifiers')('UTF8String'),
        "keyCode": e('keyCode')
    };
    keyInfo.html = getHtml(keyInfo);
    mainWindow.webContents.send('keydn',
        JSON.stringify(keyInfo));
}, ['v', ['?', '@']]);

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    if (process.platform != 'darwin')
        app.quit();
});

// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on('ready', () => {
    //app.commandLine.appendSwitch("js-flags","--harmony_collections");
    // Create the browser window.
    // 透明ウィンドウで表示
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        transparent: true,
        frame: false
    });

    ipcMain.on('openFileDialog', (event, arg) => {
        dialog.showOpenDialog({
            properties: ['openFile', 'multiSelections']
        }, (filePath) => {
            console.log("filePath = " + filePath);
            event.sender.send('asynchronous-reply', filePath);
        });
        event.returnValue = "OK";
    });

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/index.html');


    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
    mainWindow.webContents.on('did-finish-load', () => {
        if (!$.AXIsProcessTrusted()) {
            //mainWindow.toggleDevTools();
            spawn("open", ["/System/Library/PreferencePanes/Security.prefPane"]);
            app.quit();
        }

        $.NSEvent('addGlobalMonitorForEventsMatchingMask',
            $.NSKeyDownMask,
            'handler',
            keyDownHandler
        );
    });
});
