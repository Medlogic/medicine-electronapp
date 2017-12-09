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
const ping = require("ping")

//let config = require('./env.json');
env.app_list=[]
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

const replaceUrls = [
    [/^http(.*)\/application\/lib\/compatibility.js$/, '/application/scripts/compatibility.js'],
    [/^http(.*)\/application\/views\/print.html$/, '/application/scripts/print.html'],
    [/^http(.*)\/application\/directives\/Print.js$/, '/application/scripts/Print.js']
];

let args = process.argv.slice(process.platform == 'win32' ? 1 : 2)

const updateConfig = () => {
  for (var i in args) {
    var option = args[i].replace(/^--/, '').split('=')
    env[option[0]] = option[1]
  }

  if( env.app_list_version != store.get('app_list_version') ){
    store.delete('app_list')
    store.set('app_list_version', env.app_list_version)
  }

  if(store.has('app_list'))
    env.app_list = store.get('app_list')

  let apps =  env.app_list// store.get('applications') 
  for(let app in apps){
    if (apps[app].app_title == env.selected_app ){
      var app_url = URL.parse(apps[app].app_url)
      
      env.app_url = apps[app].app_url// 'http://' + apps[app].host + ':' + apps[app].port
      env.app_host = app_url.hostname
      env.app_port = app_url.port
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
    width: env.window_width,
    height: env.window_heigh,
    minWidth: env.window_min_width,
    minHeight: env.window_min_height,
    autoHideMenuBar: true,
    show: false
  })

  // and load the index.html of the app.
  mainWindow.webContents.session.clearCache(() => {});
  mainWindow.loadURL(env.app_url, {
    userAgent: 'electron'
  })

  printWindow = new BrowserWindow({
    show: false //(env.debug && env.debug != 'false')
  })

  if(env.selected_app !== undefined)
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();


      if (env.fullscreen && env.fullscreen != 'false')
        mainWindow.maximize()
        
      if (env.debug) 
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

  if (env.debug && env.debug != 'false') {
    printWindow.webContents.openDevTools()
    mainWindow.webContents.openDevTools()
  }

  let regexRedirect = /^file:.*\/(api|application)/
  session.defaultSession.webRequest.onBeforeRequest({}, (details, cb) => {
    if (regexRedirect.test(details['url'])) {
      let url = '/' + details['url'].replace(/^file:.*\/(api|application)/, '$1')
      details = {
        'redirectURL': env.app_url + url
      }
    }

    for (var i in replaceUrls) {
      var regex = replaceUrls[i][0]
      if (regex.test(details['url'])) {
        details = {
          'redirectURL': env.app_url + replaceUrls[i][1]
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

  updateConfig()
  welcome.createWelcomeWindow(store)
  autoUpdater.checkForUpdatesAndNotify();
  
  welcome.welcomeWindow.webContents.on('did-finish-load', () => {     
    if(env.name == 'development')    
      sendStatusToWindow('Нет новых обновлений');
    else
      sendStatusToWindow('Подключение');
  })

  if(!store.has('app_list') || store.get('app_list').length == 0 ){
    pingServers()
  }
})


// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

ipcMain.on('print-content', (event, arg) => {
  if(arg.layout.pdf_url !== undefined){
    let fileName =  path.join(os.tmpdir(), 'print' + new Date().getTime() + '.pdf')
    const file = fs.createWriteStream(fileName);
    const execFile = require('child_process').execFile;


    http.get(env.app_url + arg.layout.pdf_url, response =>
    {
      response.pipe(file);

      let sumatraPrintSettings = arg.layout.duplex == true ? ['-print-to-default', '-print-settings', '"duplexlong"', fileName] : ['-print-to-default', fileName]
      execFile(__dirname + '\\SumatraPDF.exe', sumatraPrintSettings, (error, stdout, stderr) =>
      {
        if (error)
        {
          fs.unlink(fileName)
          if(env.debug) throw error;
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
        hostname: env.app_host,
        port: env.app_port,
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
                if (env.debug) throw error;
            }

            fs.unlink(fileName)
        });

      })

      
    })
});

ipcMain.on('download', (event, args) => {
    download(BrowserWindow.getFocusedWindow(), env.app_url + args.url, {saveAs: true, openFolderWhenDone: true})
        .then(dl => console.log(dl.getSavePath()))
        .catch(console.error);
});

ipcMain.on('load-application', (event, args) => {
  env.selected_app = args;
  
  updateConfig()
  createMainWindow();
});

ipcMain.on('exit-application', (event, args) => {
  app.quit()
  welcome.welcomeWindow = null
  printWindow = null
  mainWindow = null
});

const pingServers = () => {
  var exec = require('child_process').exec;
  env.active_server_list = []
  let count = 0

  for(let arg in env.server_list ){    
    exec("ping -n 1 " + URL.parse(env.server_list[arg]).hostname, (error, stdout, stderr) => {      
      count += 1;
      if(error == null)
        env.active_server_list.push(env.server_list[arg])
      // else
      //   console.log(env.server_list[arg] + ' is dead')

      if(count == env.server_list.length)
        checkConnections()
    });
  }
}

const checkConnections = () => {
  let count = 0
  env.app_list = []

  for(let arg in env.active_server_list ){
    http.get(env.active_server_list[arg]+'/api/1/config/', (response) => {
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
            env.app_list.push({'app_url': env.active_server_list[arg], 'app_title': parsedData.APP_TITLE})
          }
          
          if(count == env.active_server_list.length){
            store.set('app_list', env.app_list)
            welcome.updateWelcomeWindow(store.get('app_list'));
          }
        } catch (e) {
          if(count == env.active_server_list.length){
            store.set('app_list', env.app_list)
            welcome.updateWelcomeWindow(store.get('app_list'));
          }
        }
      });
    }).on('error', (e) => {
      count += 1;
      if(count == env.active_server_list.length){
        store.set('app_list', env.app_list)
        welcome.updateWelcomeWindow(store.get('app_list')
      );
      }
    });
  }
}

function sendStatusToWindow(text, code) {
  welcome.welcomeWindow.webContents.send('message', {"text": text, "code": code});
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Поиск обновлений...');
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Доступны новые обновления');
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Нет новых обновлений');
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Ошибка при обновлении', err.message);  
})
autoUpdater.on('download-progress', (progressObj) => {
  sendStatusToWindow('Загрузка обновлений', progressObj.percent );
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Обновление загружено');

  autoUpdater.quitAndInstall();
});

