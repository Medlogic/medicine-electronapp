import path from "path"
import URL from "url"
import {
  app,
  BrowserWindow  
} from 'electron'
import { autoUpdater } from "electron-updater"

import * as main from "./background.js"
import env from "env"

export let welcomeWindow
let haveUpdates = false

export const createWelcomeWindow = (store) => {
  welcomeWindow = new BrowserWindow({
    width: 600, 
    height: 440, 
    frame: false,
    resizable: false,
    show: false
  })

  //welcomeWindow.webContents.openDevTools()
  if (env.debug && env.debug != 'false') {
    welcomeWindow.webContents.openDevTools()
  }
  welcomeWindow.loadURL(
    URL.format({
      pathname: path.join(__dirname, "welcomeApp.html"),
      protocol: "file:",
      slashes: true
    })
  )  
  welcomeWindow.webContents.on('did-finish-load', () => {
    welcomeWindow.show()
    // if(!store.has('app_list') || store.get('app_list').length == 0)
    //   welcomeWindow.webContents.send('check_connections' )
    // else
    //   updateWelcomeWindow(store.get('app_list'))
  })
}

export const updateWelcomeWindow = (store) => {
  console.log(main.store.get('app_list') )
  welcomeWindow.webContents.send('load' , {msg:store.get('app_list')})
}

export const checkUpdates = () => {
  setTimeout(function() {
    //let feedUrl = main.store.get('app_list')[0].app_url + '/application/dist'
    autoUpdater.autoDownload = false
    autoUpdater.checkForUpdatesAndNotify() 
  }, 500)
}

export const startUpdate = () => {
  autoUpdater.downloadUpdate()
}

const sendStatusToWindow = (text, code) =>  {
  welcomeWindow.webContents.send('message', {"text": text, "code": code})
}

autoUpdater.on('checking-for-update', () => {
  sendStatusToWindow('Поиск обновлений...')
})
autoUpdater.on('update-not-available', (info) => {
  sendStatusToWindow('Нет новых обновлений')
  haveUpdates = false
})
autoUpdater.on('error', (err) => {
  sendStatusToWindow('Ошибка при обновлении', err.message)  
})
autoUpdater.on('download-progress', (progressObj) => {
  sendStatusToWindow('Загрузка обновлений', progressObj.percent )
})
autoUpdater.on('update-available', (info) => {
  sendStatusToWindow('Доступны новые обновления')
  haveUpdates = true
})
autoUpdater.on('update-downloaded', (info) => {
  sendStatusToWindow('Обновление загружено')
  autoUpdater.quitAndInstall()
})


