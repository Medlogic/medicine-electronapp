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
const Store = require('electron-store');
const storeOptions = { "name": "app_config" }
export const store = new Store(storeOptions);

export const createWelcomeWindow = (store) => {

	welcomeWindow = new BrowserWindow({
		width: 600,
		height: 440,
		frame: false,
		resizable: false,
		show: false
	})

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
}

export const updateWelcomeWindow = () => {
	var app = {}
	app.title = store.get('app_title')
	app.url = store.get('app_url')
	app.host = store.get('app_host')
	app.port = store.get('app_port')
	app.online = store.get('app_online')
	//app.updates = store.get('app_have_updates')
	welcomeWindow.webContents.send('load', { msg: app })

	welcomeWindow.webContents.send('set-update-state', { "haveUpdates": store.get('app_have_updates') })
}

const setHaveUpdates = (haveUpdates) => {
	store.set('app_have_updates', haveUpdates)
	welcomeWindow.webContents.send('set-update-state', { "haveUpdates": haveUpdates })
}

export const checkUpdates = () => {
	setTimeout(function () {
		autoUpdater.autoDownload = false
		autoUpdater.checkForUpdatesAndNotify()
	}, 500)
}

export const startUpdate = () => {
	autoUpdater.downloadUpdate()
}

const sendStatusToWindow = (text, code) => {
	welcomeWindow.webContents.send('message', { "text": text, "code": code })
}

autoUpdater.on('checking-for-update', () => {
	sendStatusToWindow('Поиск обновлений...')
})
autoUpdater.on('update-not-available', (info) => {
	sendStatusToWindow('Нет новых обновлений')
	setHaveUpdates(false)
	//main.mainWindow.checkConnection()
	haveUpdates = false
})
autoUpdater.on('error', (err) => {
	sendStatusToWindow('Ошибка при обновлении', err.message)
	//main.mainWindow.checkConnection()
})
autoUpdater.on('download-progress', (progressObj) => {
	sendStatusToWindow('Загрузка обновлений', progressObj.percent)
})
autoUpdater.on('update-available', (info) => {
	sendStatusToWindow('Доступны новые обновления')
	setHaveUpdates(true)
	//main.mainWindow.checkConnection()
	haveUpdates = true
})
autoUpdater.on('update-downloaded', (info) => {
	sendStatusToWindow('Обновление загружено')
	autoUpdater.quitAndInstall()
	setHaveUpdates(false)
})


export const Console = (message) => {
	welcomeWindow.webContents.send('console', { message: message })
}

