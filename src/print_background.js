import path from "path";
import URL from "url";
import {
  app,
  BrowserWindow,
  ipcMain,
  session,
  screen,
  Menu, MenuItem
} from 'electron';

import { autoUpdater } from "electron-updater"

const {download} = require('electron-dl');
const fs = require('fs')
const os = require('os')

//const path = require('path')
const http = require("http")


let config = require('./config.json');
config.app_list=[]
const storeOptions = {"name": "app_config" }
const Store = require('electron-store');
const store = new Store(storeOptions);

//import { devMenuTemplate } from "./menu/dev_menu_template";
//import { editMenuTemplate } from "./menu/edit_menu_template";
import createWindow from "./helpers/window";
// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";

let mainWindow
let printWindow
let welcomeWindow

const replaceUrls = [
    [/^http(.*)\/application\/lib\/compatibility.js$/, '/application/scripts/compatibility.js'],
    [/^http(.*)\/application\/views\/print.html$/, '/application/scripts/print.html'],
    [/^http(.*)\/application\/directives\/Print.js$/, '/application/scripts/Print.js']
];

let args = process.argv.slice(process.platform == 'win32' ? 1 : 2)

const updateConfig = () => {
  for (var i in args) {
    var option = args[i].replace(/^--/, '').split('=')
    config[option[0]] = option[1]
  }
  if(store.has('app_list'))
    config.app_list = store.get('app_list')

  let apps =  config.app_list// store.get('applications') 
  for(let app in apps){
    if (apps[app].app_title == config.selected_app ){
      var app_url = URL.parse(apps[app].app_url)
      
      config.app_url = apps[app].app_url// 'http://' + apps[app].host + ':' + apps[app].port
      config.app_host = app_url.hostname
      config.app_port = app_url.port
    }
  }
}


const createWelcomeWindow = () => {
  welcomeWindow = new BrowserWindow({
    width: 600,
    height: 440, 
    frame: false,
    resizable: false
  })

  welcomeWindow.webContents.openDevTools()
  welcomeWindow.loadURL(
    URL.format({
      pathname: path.join(__dirname, "welcomeApp.html"),
      protocol: "file:",
      slashes: true
    })
  )
  
  welcomeWindow.webContents.on('did-finish-load', () => {
    if(!store.has('app_list') || store.get('app_list').length == 0)
      welcomeWindow.webContents.send('check_connections' );
    else
      updateWelcomeWindow()
    //welcomeWindow.webContents.send('load' , {msg:store.get('applications')});
  })
}

const updateWelcomeWindow = () => {
  welcomeWindow.webContents.send('load' , {msg:config.app_list});
}

const createMainWindow = () => {
  mainWindow = null

  let shouldQuit = app.makeSingleInstance(function (commandLine, workingDirectory) {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  if (shouldQuit) {
    app.quit();
    return;
  }

  const electron = require('electron');
  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().workAreaSize
  let w = Math.round((height / 100 * 27) * 0.9);
  let h = Math.round(height / 100 * 27);
  

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: config.window_width,
    height: config.window_heigh,
    minWidth: config.window_min_width,
    minHeight: config.window_min_height,
    autoHideMenuBar: true,
    show: false
  })

  // and load the index.html of the app.
  mainWindow.webContents.session.clearCache(() => {});
  mainWindow.loadURL(config.app_url, {
    userAgent: 'electron'
  })

  printWindow = new BrowserWindow({
    show: false
  })

  if(config.selected_app !== undefined)
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();


      if (config.fullscreen && config.fullscreen != 'false')
        mainWindow.maximize()
        
      if (config.debug) 
        printWindow.show();

      welcomeWindow.hide();
    })

  printWindow.loadURL( 
    URL.format({
      pathname: path.join(__dirname, "print.html"),
      protocol: "file:",
      slashes: true
    })
  )
    //'file://' + __dirname + '/print.html')

  mainWindow.webContents.on('context-menu', (e, props) => {
    const editFlags = props.editFlags;
    e.preventDefault();
    const template = [{
        label: "Копировать",
        role: 'copy',
        accelerator: 'CmdOrCtrl+C',
        enabled: props.isEditable
      },
      {
        label: 'Вставить',
        role: 'paste',
        accelerator: 'CmdOrCtrl+V',
        enabled: editFlags.canPaste
      },
      {
        type: 'separator'
      },
      {
        label: 'Вырезать',
        role: 'cut',
        accelerator: 'CmdOrCtrl+X',
        enabled: props.isEditable
      }
    ];
    const menu = Menu.buildFromTemplate(template);
    if (props.isEditable) menu.popup(mainWindow);
  });

  if (config.debug && config.debug != 'false') {
    printWindow.webContents.openDevTools()
    mainWindow.webContents.openDevTools()
  }

  let regexRedirect = /^file:.*\/(api|application)/
  session.defaultSession.webRequest.onBeforeRequest({}, (details, cb) => {
    if (regexRedirect.test(details['url'])) {
      let url = '/' + details['url'].replace(/^file:.*\/(api|application)/, '$1')
      details = {
        'redirectURL': config.app_url + url
      }
    }

    for (var i in replaceUrls) {
      var regex = replaceUrls[i][0]
      if (regex.test(details['url'])) {
        details = {
          'redirectURL': config.app_url + replaceUrls[i][1]
        }
        break;
      }
    }

    cb(details)
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    app.quit()
    welcomeWindow = null
    printWindow = null
    mainWindow = null
  });
};

ipcMain.on('print-content', (event, arg) => {
  if(arg.layout.pdf_url !== undefined){
    let fileName =  path.join(os.tmpdir(), 'print' + new Date().getTime() + '.pdf')
    const file = fs.createWriteStream(fileName);
    const execFile = require('child_process').execFile;


    http.get(config.app_url + arg.layout.pdf_url, response =>
    {
      response.pipe(file);

      let sumatraPrintSettings = arg.layout.duplex == true ? ['-print-to-default', '-print-settings', '"duplexlong"', fileName] : ['-print-to-default', fileName]
      execFile(__dirname + '\\SumatraPDF.exe', sumatraPrintSettings, (error, stdout, stderr) =>
      {
        if (error)
        {
          fs.unlink(fileName)
          if(config.debug) throw error;
        }else{
          fs.unlink(fileName)
        }
      });

    })
  } else {
    printWindow.webContents.send('content', arg)
  }

});

ipcMain.on('print', (event, arg) => {
    let fileName = path.join(os.tmpdir(), 'print' + new Date().getTime() + '.pdf');
    const file = fs.createWriteStream(fileName);
    const execFile = require('child_process').execFile;
    
    let sessionid
    let csrftoken
    session.defaultSession.cookies.get({}, (error, cookies) => {
      
      for(var cookie in cookies)
        if(cookies[cookie].name == 'sessionid'){
          sessionid = cookies[cookie].value
        }else if(cookies[cookie].name == 'csrftoken'){
          csrftoken = cookies[cookie].value
        }

      let httpOptions = {
        hostname: config.app_host,
        port: config.app_port,
        path: arg.url,
        method: 'GET',
        headers: {
          'Cookie': 'sessionid=' + sessionid + ';csrftoken=' + csrftoken
        }
      }; 
      
      http.get(httpOptions, (response) => {
        
        response.pipe(file);

        let sumatraPrintSettings = arg.duplex === true ? ['-print-to-default', '-print-settings', 'duplexlong', fileName] : ['-print-to-default', fileName]
        execFile(__dirname + '\\SumatraPDF.exe', sumatraPrintSettings, (error, stdout, stderr) => {
            if (error) {
                if (config.debug) throw error;
            }

            fs.unlink(fileName)
        });

      })

      
    })
});

ipcMain.on('download', (event, args) => {
    download(BrowserWindow.getFocusedWindow(), config.app_url + args.url, {saveAs: true, openFolderWhenDone: true})
        .then(dl => console.log(dl.getSavePath()))
        .catch(console.error);
});
