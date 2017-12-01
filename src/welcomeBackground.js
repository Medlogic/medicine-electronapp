import path from "path";
import URL from "url";
import {
  app,
  BrowserWindow  
} from 'electron';


// const storeOptions = {"name": "app_config" }
// const Store = require('electron-store');
// export const store = new Store(storeOptions);

export let welcomeWindow


export const createWelcomeWindow = (store) => {
  welcomeWindow = new BrowserWindow({
    width: 600, 
    height: 440, 
    frame: false,
    resizable: false
  })

  //welcomeWindow.webContents.openDevTools()
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
      updateWelcomeWindow(store.get('app_list'))
  })
}

export const updateWelcomeWindow = (app_list) => {
  welcomeWindow.webContents.send('load' , {msg:app_list});
}



