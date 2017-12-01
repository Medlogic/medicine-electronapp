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

import * as welcome from "./welcomeBackground.js"
let mainWindow
let printWindow
//process.env.GH_TOKEN = {}

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
    show: false //(config.debug && config.debug != 'false')
  })

  if(config.selected_app !== undefined)
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();


      if (config.fullscreen && config.fullscreen != 'false')
        mainWindow.maximize()
        
      if (config.debug) 
        printWindow.show();

      welcome.welcomeWindow.hide();
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
    welcome.welcomeWindow = null
    printWindow = null
    mainWindow = null
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {  
  autoUpdater.checkForUpdatesAndNotify();

  updateConfig()
  welcome.createWelcomeWindow(store)
  if(!store.has('app_list') || store.get('app_list').length == 0)
    checkConnections()
  //createWelcomeWindow()
})


// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// app.on('activate', () => {
//   // On OS X it's common to re-create a window in the app when the
//   // dock icon is clicked and there are no other windows open.
//   if (mainWindow === null) {
//     updateConfig()
//     welcome.createWelcomeWindow();
//   }
// });

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

ipcMain.on('load-application', (event, args) => {
  //console.log(args)
  config.selected_app = args;
  
  updateConfig()
  createMainWindow();
});

ipcMain.on('exit-application', (event, args) => {
  app.quit()
  welcome.welcomeWindow = null
  printWindow = null
  mainWindow = null
});



const checkConnections = () => {
 
  let count = 0
  for(let arg in config.server_list ){
    http.get(config.server_list[arg]+'/api/1/config/', (response) => {
      count += 1; 
      response.setEncoding('utf8');
      let rawData = '';

      response.on('data', (chunk) => { 
        rawData += chunk; 
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          if(parsedData !== undefined && parsedData.APP_TITLE !== undefined){
            config.app_list.push({'app_url': config.server_list[arg], 'app_title': parsedData.APP_TITLE})
          }
          
          if(count == config.server_list.length){
            store.set('app_list', config.app_list)
            welcome.updateWelcomeWindow(store.get('app_list'));
          }
        } catch (e) {
          if(count == config.server_list.length){
            store.set('app_lis', config.app_list)
            welcome.updateWelcomeWindow(store.get('app_list'));
          }
        }
      });
    }).on('error', (e) => {
      count += 1;
      if(count == config.server_list.length){
        store.set('app_list', config.app_list)
        welcome.updateWelcomeWindow(store.get('app_list')
      );
      }
    });
  }
}

function sendStatusToWindow(text) {
  //log.info(text);
  welcome.welcomeWindow.webContents.send('message', text);
}


autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Checking for update...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Error in auto-updater. ' + err);
})
autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  sendStatusToWindow(log_message);
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Update downloaded');
});

