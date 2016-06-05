"use strict";

const app = require('app'); // Module to control application life.
const BrowserWindow = require('browser-window'); // Module to create native browser window.
const dialog = require('dialog');
const ipc = require("electron").ipcMain;
const $ = require('nodobjc');

$.import('Foundation');
$.import('Cocoa');

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the javascript object is GCed.
let mainWindow = null;

const keyDownHandler = $((s,e)=>{
    console.log(e);
    //console.log(e('keyCode'));
    function getHtml(keyInfo) {
      function getModSym(keyInfo) {
          let modSym = "";
          if((keyInfo.flags & $.NSShiftKeyMask)!=0) {
            //console.log("NSShiftKeyMask");
            modSym += "&#x21E7;";
          }
          if((keyInfo.flags & $.NSControlKeyMask)!=0) {
            modSym += "^";
          }
          if((keyInfo.flags & $.NSAlternateKeyMask)!=0) {
            modSym += "&#x2325;";
          }
          if((keyInfo.flags & $.NSCommandKeyMask)!=0) {
            modSym += "&#x2318;";
          }
          return modSym;
      }
      const specialMap = {
        "36":"&#x23ce;",
        "53":"&#x238B;",
        "48":"&#x21E5;",
        "49":"&#x2423;",
        "51":"&#x232b;",
        // arrow
        "123":"&#x2190;",
        "124":"&#x2192;",
        "126":"&#x2191;",
        "125":"&#x2193;",
      };
      //console.log($.NSShiftKeyMask);
      const specialKey = specialMap[""+keyInfo.keyCode]
      if(specialKey) {
        keyInfo.characters = specialKey;
        keyInfo.charactersIgnoringModifiers = specialKey;
      }

      const modSym = getModSym(keyInfo);

      if((keyInfo.flags & ($.NSControlKeyMask|$.NSAlternateKeyMask|$.NSCommandKeyMask))==0) {
        return keyInfo.characters;
      }
      return modSym+keyInfo.charactersIgnoringModifiers.toUpperCase();
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
},['v',['?','@']]);

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});

// This method will be called when atom-shell has done everything
// initialization and ready for creating browser windows.
app.on('ready', function() {
  //app.commandLine.appendSwitch("js-flags","--harmony_collections");
  // Create the browser window.
  // 透明ウィンドウで表示
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    transparent: true, frame: false
  });

  ipc.on('openFileDialog', function(event, arg) {
    dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections']
    }, function(filePath) {
      console.log("filePath = " + filePath);
      event.sender.send('asynchronous-reply', filePath);
    });
    event.returnValue = "OK";
  });

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html');


  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
  mainWindow.webContents.on('did-finish-load', function() {
    if(!$.AXIsProcessTrusted()){
      mainWindow.toggleDevTools();
    }

    $.NSEvent('addGlobalMonitorForEventsMatchingMask',
      $.NSKeyDownMask,
      'handler',
      keyDownHandler
    );
  });
});
