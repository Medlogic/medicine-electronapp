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



const { download } = require('electron-dl');
const fs = require('fs')
const os = require('os')

const http = require("http")
const ping = require("ping")

//let config = require('./env.json');
const storeOptions = { "name": "app_config" }
const Store = require('electron-store');
export const store = new Store(storeOptions);

let SerialPort = require('serialport');

import createWindow from "./helpers/window";

// Special module holding environment variables which you declared
// in config/env_xxx.json file.
import env from "env";
env.app_list = []

import * as welcome from "./welcomeBackground.js"
import { appendFile } from "fs-extra-p";
import { strictEqual } from "assert";

let mainWindow
let printWindow
let haveUpdates = false

const replaceUrls = [
	[/^http(.*)\/application\/lib\/compatibility.js$/, '/application/scripts/compatibility.js'],
	[/^http(.*)\/application\/views\/print.html$/, '/application/scripts/print.html'],
	[/^http(.*)\/application\/directives\/Print.js$/, '/application/scripts/Print.js']
];

let args = process.argv.slice(process.platform == 'win32' ? 1 : 2)

const barcodeScannerDevices = ['0C2E', '1A86', 'AC90', '05E0']

const updateConfig = () => {
	for (var i in args) {
		var option = args[i].replace(/^--/, '').split('=')
		env[option[0]] = option[1]
	}
}


const createMainWindow = () => {
	updateConfig()
	mainWindow = null

	let shouldQuit = app.requestSingleInstanceLock()

	if (!shouldQuit) {
		app.quit();
		return;
	} else {

		app.on('second-instance', (event, commandLine, workingDirectory) => {
			// Someone tried to run a second instance, we should focus our window.
			if (mainWindow) {
				if (mainWindow.isMinimized()) mainWindow.restore()
				mainWindow.focus()
			}
		})
	}

	const {
		width,
		height
	} = screen.getPrimaryDisplay().workAreaSize

	// просмотр ком-портов и выбор сканера-штрихкодов
	ScanSerialPort();

	//app.commandLine.appendSwitch('enable-features', 'GuestViewCrossProcessFrames');
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
	mainWindow.webContents.session.clearCache(() => { });
	mainWindow.loadURL(env.app_url, {userAgent: 'electron'})

	printWindow = new BrowserWindow({
		show: false //(env.debug && env.debug != 'false')
	})

	if (env.app_url !== undefined)
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

	mainWindow.webContents.on('context-menu', (e, props) => {
		const editFlags = props.editFlags;
		e.preventDefault();
		const tmplCopyPaste = [{
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

		const tmplZoom = [
			{
				label: 'Масштаб',
				enabled: false
			},
			{
				label: 'Приблизить',
				role: 'zoomin',
				accelerator: 'CmdOrCtrl+Shift+Plus'
			},
			{
				label: 'Отдалить',
				role: 'zoomout',
				accelerator: 'CmdOrCtrl+-'
			}
		];

		const textMenu = Menu.buildFromTemplate(tmplCopyPaste);
		const mainMenu = Menu.buildFromTemplate(tmplZoom);
		if (props.isEditable) textMenu.popup(mainWindow);
		else mainMenu.popup(mainWindow)
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
	if(!store.has('app_title')){
		var old_app = {app_title: '', app_url: ''} 
		if(store.has('app_list') && store.get('app_list')[0])
			old_app = store.get('app_list')[0]
		//var old_app = store.has('app_list') ? store.get('app_list')[0] : {app_title: '', app_url: ''}

		var app_url_parse = URL.parse(old_app.app_url)
		store.set('app_title', old_app.app_title)
		store.set('app_url', old_app.app_url)
		store.set('app_host', app_url_parse.hostname)
		store.set('app_port', app_url_parse.port)
	}
	
	store.set('app_online', undefined)
	welcome.createWelcomeWindow(store)
	welcome.welcomeWindow.webContents.on('did-finish-load', () => {
		welcome.updateWelcomeWindow()
		welcome.welcomeWindow.show()
		if (env.name == 'development')
			 welcome.welcomeWindow.webContents.send('message', { "text": 'Ошибка при обновлении', "code": 0 });
		else
			welcome.checkUpdates()
			
		checkConnection(store.get('app_url'))
	})
})

ipcMain.on('load-application', (event, args) => {
	env.app_url = args
	createMainWindow()
});

ipcMain.on('check-connection', (event, args) => {
	checkConnection(args)
});

const checkConnection = (url) => {
	var app_url_parse = URL.parse(url)
	store.set('app_title', 'НЕ ДОСТУПЕН')
	store.set('app_url', url)
	store.set('app_host', app_url_parse.hostname)
	store.set('app_port', app_url_parse.port)
	
	http.get(url + '/api/1/config/', (response) => {
		let rawData = '';
		response.setEncoding('utf8');
		response.on('data', (chunk) => {
			rawData += chunk;
		});

		response.on('end', () => {
			try {
				const parsedData = JSON.parse(rawData);
				if (parsedData !== undefined && parsedData.APP_TITLE !== undefined) {
					store.set('app_title', parsedData.APP_TITLE)
					store.set('app_online', true)
					welcome.updateWelcomeWindow()
				}
			} catch (e) {
				store.set('app_online', false)
				welcome.updateWelcomeWindow()
			}
		});
	}).on('error', (e) => {
		store.set('app_online', false)
		if(welcome.welcomeWindow)
			welcome.updateWelcomeWindow()
	});
}

ipcMain.on('test-connection', (event, args) => {
	haveUpdates = args
	updateConfig()
});


ipcMain.on('start-update', (event, args) => {
	welcome.startUpdate();
});


ipcMain.on('print-content', (event, arg) => {
	if (arg.layout.pdf_url !== undefined) {
		let fileName = path.join(os.tmpdir(), 'print' + new Date().getTime() + '.pdf')
		const file = fs.createWriteStream(fileName);
		const execFile = require('child_process').execFile;


		http.get(env.app_url + arg.layout.pdf_url, response => {
			response.pipe(file);

			let sumatraPrintSettings = arg.layout.duplex == true ? ['-print-to-default', '-print-settings', '"duplexlong"', fileName] : ['-print-to-default', fileName]
			execFile(__dirname + '\\SumatraPDF.exe', sumatraPrintSettings, (error, stdout, stderr) => {
				if (error) {
					fs.unlink(fileName, (err) => {
						if (err) throw err;
						//console.log(fileName + ' was deleted');
					})
					if (env.debug) throw error;
				} else {
					fs.unlink(fileName, (err) => {
						if (err) throw err;
						//console.log(fileName + ' was deleted');
					})
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

	//welcome.Console("print")
	let sessionid
	let csrftoken
	session.defaultSession.cookies.get({}, (error, cookies) => {

		for (var cookie in cookies)
			if (cookies[cookie].name == 'sessionid') {
				sessionid = cookies[cookie].value
			} else if (cookies[cookie].name == 'csrftoken') {
				csrftoken = cookies[cookie].value
			}

		let httpOptions = {
			hostname: store.get('app_host'),
			port: store.get('app_port'),
			path: arg.url,
			method: 'GET',
			headers: {
				'Cookie': 'sessionid=' + sessionid + ';csrftoken=' + csrftoken
			}
		};

		http.get(httpOptions, (response) => {
			let stream = response.pipe(file);
			
			stream.on('finish', () => {
				if (arg.thermal_printer !== true) {
					
					let sumatraPrintSettings = arg.duplex === true ? ['-print-to-default', '-print-settings', 'duplexlong', fileName] : ['-print-to-default', fileName]
					try {
						execFile(__dirname + '\\SumatraPDF.exe', sumatraPrintSettings, (error, stdout, stderr) => {
							if (error) {
								fs.unlink(fileName, (err) => {
									if (err) {
										if (env.debug) throw err;
									}
								});
								if (env.debug) throw error;
							}
		
							fs.unlink(fileName, (err) => {
								if (err) {
									if (env.debug) throw err;
								}
							});
						});
					} catch (ex) {
						//welcome.Console(ex)
					}
				} else if (FindThermalPrinter() !== undefined) {
					execFile(__dirname + '\\PDFtoPrinter.exe', [fileName, FindThermalPrinter()], (error, stdout, stderr) => {
						if (error) {
							if (env.debug) throw error;
						}
	
						fs.unlink(fileName, (err) => {
							if (err) throw err;
							//console.log(fileName + ' was deleted');
						});
					});
				}
			})
		})
	})
})

ipcMain.on('download', (event, args) => {
	download(BrowserWindow.getFocusedWindow(), env.app_url + args.url, { saveAs: true, openFolderWhenDone: true })
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


const FindThermalPrinter = () => {
	let arr = mainWindow.webContents.getPrinters();
	let readythermoPrinters = arr.filter((item) => {
		var regex = new RegExp('(POS-80-Series)|(POS-85-Series)')
		if (item.name.match(regex) != null)
			return item
	})

	if (readythermoPrinters) {
		return readythermoPrinters[0].name
		//console.log(readythermoPrinters[0].name)
	} else {
		return undefined
	}

}
//
// просмотр ком-портов и выбор сканера-штрихкодов
// 
const ScanSerialPort = (port) => {
	SerialPort.list(function (err, ports) {
		ports.forEach(function (port) {
			//console.log(port);
			if (barcodeScannerDevices.includes(port.vendorId)) {
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
		console.log(arr)
		mainWindow.webContents.send('search_beep', { code: arr });
	});
}