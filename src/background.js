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


const {download} = require('electron-dl');
const fs = require('fs')
const os = require('os')

const http = require("http")
const ping = require("ping")

//let config = require('./env.json');
const storeOptions = {"name": "app_config" }
const Store = require('electron-store');
export const store = new Store(storeOptions);

let SerialPort = require('serialport');

//import { devMenuTemplate } from "./menu/dev_menu_template";
//import { editMenuTemplate } from "./menu/edit_menu_template";
import createWindow from "./helpers/window";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";
env.app_list=[]

import * as welcome from "./welcomeBackground.js"
let mainWindow
let printWindow
let haveUpdates = false

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
      
      env.app_url = apps[app].app_url // 'http://' + apps[app].host + ':' + apps[app].port
      env.app_host = app_url.hostname
      env.app_port = app_url.port
    }
  }
}


const createMainWindow = () => {
  updateConfig()
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

  const {
    width,
    height
  } = screen.getPrimaryDisplay().workAreaSize
  
  //
  // просмотр ком-портов и выбор сканера-штрихкодов
  ScanSerialPort();   

  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: env.window_width,
    height: env.window_height,
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
  welcome.createWelcomeWindow(store)
  welcome.welcomeWindow.webContents.on('did-finish-load', () => {    
    welcome.checkUpdates()
    if(env.name == 'development')
      welcome.welcomeWindow.webContents.send('message', {"text": 'Ошибка при обновлении', "code": 0});
  })
})



ipcMain.on('load-application', (event, args) => {
  env.selected_app = args
  //console.log('load-application')
  createMainWindow()
});

ipcMain.on('test-connection', (event, args) => {
  haveUpdates = args
  //console.log('test-connection')
  updateConfig()
  pingServers()
});

const pingServers = () => {
  var exec = require('child_process').exec;
  env.active_server_list = []
  let count = 0
  let server_list = !store.has('app_list') ? env.server_list : [store.get('app_list')[0].app_url]
  //console.log('server_list')
  //console.log(env.server_list)
  //console.log('app_list')
  //console.log(store.has('app_list') ? store.get('app_list') : 'none')
  
  asyncLoop(server_list.length, function(loop) {    
        // log the iteration
        //console.log(loop.iteration());
        exec("ping -w 25 -n 1 " + URL.parse(server_list[loop.iteration()]).hostname, (error, stdout, stderr) => {      
          if(error == null){
            env.active_server_list.push(server_list[loop.iteration()])
          }
          loop.next();
        })
    },
    function(){
      //console.log('cycle ended')
      //console.log(env.active_server_list)
      checkConnections()
    }
  )
}

const checkConnections = () => {
  env.app_list = []
  let haveError = true
  let count = 0
  //for(let arg in env.active_server_list ){
    
  asyncLoop(env.active_server_list.length, function(loop) {    
    // log the iteration
    //console.log(loop.iteration());
    http.get(env.active_server_list[loop.iteration()]+'/api/1/config/', (response) => {
      let rawData = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { 
        rawData += chunk; 
      });

      response.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          if(parsedData !== undefined && parsedData.APP_TITLE !== undefined){
            haveError = false
            env.app_list.push({'app_url': env.active_server_list[loop.iteration()], 'app_title': parsedData.APP_TITLE})
            store.set('app_list', env.app_list)
            if(haveUpdates){
              welcome.updateWelcomeWindow(store)
            }else{
              env.selected_app = parsedData.APP_TITLE
              createMainWindow()
            }
            loop.break();
          }
        } catch (e) {
          //console.log('error_2')
          loop.next();
        }
      });
    }).on('error', (e) => {
      loop.next();
      //console.log('error_1')
    });

    },
    function(){
      if(haveError){
        welcome.welcomeWindow.webContents.send('message', {"text": 'Проверка соединения', "code": 0})
        if(store.has('app_list'))
          store.delete('app_list')
      }
      //console.log('cycle2 ended')
    }
  );
}

function asyncLoop(iterations, func, callback) {
  var index = 0;
  var done = false;
  var loop = {
      next: function() {
          if (done) {
              return;
          }

          if (index < iterations) {
              index++;
              func(loop);

          } else {
              done = true;
              callback();
          }
      },

      iteration: function() {
          return index - 1;
      },

      break: function() {
          done = true;
          callback();
      }
  };
  loop.next();
  return loop;
}

ipcMain.on('start-update', (event, args) => {
  welcome.startUpdate();
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

})

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
})

ipcMain.on('download', (event, args) => {
    download(BrowserWindow.getFocusedWindow(), env.app_url + args.url, {saveAs: true, openFolderWhenDone: true})
        .then(dl => console.log(dl.getSavePath()))
        .catch(console.error);
})


ipcMain.on('exit-application', (event, args) => {
  app.quit()
  welcome.welcomeWindow = null
  printWindow = null
  mainWindow = null
})
// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
})

//
// просмотр ком-портов и выбор сканера-штрихкодов
//
const ScanSerialPort = (port) => {
  SerialPort.list(function (err, ports) {
    ports.forEach(function(port) {
      console.log(port);
      if(port.vendorId == '0C2E'){
        InitBarcodeScanner(port.comName)
      }
    }); 
  });
}

const InitBarcodeScanner = (port) => {
  let scanner = new SerialPort(port);

  scanner.on('data', function (data) {
    var arr = []
    for (const pair of data.entries()) {
      arr.push(pair[1])
    }
    mainWindow.webContents.send('search_beep', {code: arr} );
  });
}