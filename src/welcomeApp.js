import "./stylesheets/welcome.css";

let startTimer, startTimerInterval;

var ipInput = $('#host').ipInput();

const UPDATE_STATE = {
	"AVAILABLE": 1, "NOTAVAILABLE": 0, "DOWNLOADING": 3
}
const CONNECTION_STATE = {
	"ONLINE": 1, "OFFLINE": 0, "CHECKING": 3
}
const WINDOW_STATE = {
	"CONFIG": 0, "WELCOME": 1, "WAIT": 2
}


export const ChangeUpdateState = (update_state) => {
	switch(update_state){
		case UPDATE_STATE.AVAILABLE:
			$('#menu-button').html(`
				<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px"
					width="14" height="14"
					viewBox="0 0 172 172">
					<g>
						<path d="M72.76923,0c-11.24099,0 -19.84615,8.60517 -19.84615,19.84615v52.92308h-21.91346c-9.2512,0 -10.59495,1.36959 -3.30769,9.30288l43.82692,43.62019c14.54868,14.54868 14.39363,14.54868 28.94231,0l43.82692,-43c7.93329,-8.60517 5.29747,-9.92308 -3.30769,-9.92308h-21.91346v-52.92308c0,-11.24099 -8.60517,-19.84615 -19.84615,-19.84615zM0,125.69231v26.46154c0,11.24099 8.60517,19.84615 19.84615,19.84615h132.30769c11.24099,0 19.84615,-8.60517 19.84615,-19.84615v-26.46154h-13.23077v26.46154c0,3.97957 -2.63581,6.61538 -6.61538,6.61538h-132.30769c-3.97956,0 -6.61538,-2.63581 -6.61538,-6.61538v-26.46154z"></path>
					</g>
				</svg>
			`)
			$('#menu-button').addClass('green');
			$('#update-button').show();
			break;
		case UPDATE_STATE.DOWNLOADING:
			$('#menu-button').html('☰');
			$('#menu-button').removeClass('green');
			$('#update-button').hide();
			break;
		case UPDATE_STATE.NOTAVAILABLE:
		default:
			$('#menu-button').html('☰');
			$('#menu-button').removeClass('green');
			$('#update-button').hide();
			break;
		
	}
}

const ChangeConnectionState = (connection_state) => {
	switch(connection_state){
		case CONNECTION_STATE.ONLINE:
			$('#enter-button').removeClass('disabled loading')
			$('.config').removeClass('disabled')
			$('#enter-button .cube-folding').removeClass().addClass('cube-folding float')
			console.log(connection_state)
			break;
		case CONNECTION_STATE.CHECKING:
			$('#enter-button').addClass('disabled loading')
			$('.config').addClass('disabled')
			$('#enter-button .cube-folding').removeClass().addClass('cube-folding spin')
			break;
		case CONNECTION_STATE.OFFLINE:
		default:
			$('#enter-button').removeClass('loading')
			$('#enter-button').addClass('disabled')
			$('.config').removeClass('disabled')
			$('#enter-button .cube-folding').removeClass().addClass('cube-folding shake')
			console.log(connection_state)
			break;
		
	}
}

const ChangeWindowState = (window_state) => {
	switch(window_state){
		case WINDOW_STATE.CONFIG:
			$('#wait').fadeOut()
			$('.welcome').fadeOut("fast", () => {
				$('.config').fadeIn()
			})
			break;
		case WINDOW_STATE.WELCOME:
			$('#wait').fadeOut()
			$('.config').fadeOut("fast", () => {
				$('.welcome').fadeIn()
			})
			break;
		case WINDOW_STATE.WAIT:
		default:
			$('#wait').fadeIn()
			$('#wait').removeClass('light')
			$('#wait').addClass('dark')
			break;
		
	}
}

const UpdateProgressBarState = (show, progress, title) => {
	if (show){
		$('.progressbar-widget').fadeIn();
		$('.progressbar-widget .title').html(title)
		$('.progressbar-widget .bar').css('width', progress + '%')
	}else{
		clearTimeout(startTimer)
		clearInterval(startTimerInterval)
		$('.progressbar-widget').fadeOut(800);
		progress = 100
		var localInterval = setInterval(function () {
			console.log(progress)
			$('.progressbar-widget .title').html('')
			$('.progressbar-widget .bar').css('width', progress + '%')
			progress -= 10/800*100;
			if(progress <= 0) clearInterval(localInterval)
		}, 10);
	}
}

export const Exit = () => {
	require('electron').ipcRenderer.send('exit-application')
}

export const Enter = (app_url) => {
	ChangeWindowState(WINDOW_STATE.WAIT)
	UpdateProgressBarState(false)
	require('electron').ipcRenderer.send('load-application', app_url)
}

export const TestConnection = (haveUpdates) => {
}
window.Enter = Enter;

export const Loading = () => {
}

export const CloseConfig = () => {
	ChangeWindowState(WINDOW_STATE.WELCOME)
}
window.CloseConfig = CloseConfig;

export const ShowConfig = () => {
	ChangeWindowState(WINDOW_STATE.CONFIG)
	UpdateProgressBarState(false)
}
window.ShowConfig = ShowConfig;

export const ChangeUrl = () => {
	ChangeConnectionState(CONNECTION_STATE.CHECKING)
	var portStr = document.getElementById('port').value
	var port = portStr > 0 && portStr < 65535 ? portStr : 80
	var url = `http://${ipInput.getIp()}:${port}`
	require('electron').ipcRenderer.send('check-connection', url)

	CloseConfig()
	$('#enter-button .title').html('')
	$('#enter-button .params span:nth-child(2)').html(ipInput.getIp())
	$('#enter-button .params span:nth-child(4)').html(port)
}

export const StartUpdate = () => {
	ChangeWindowState(WINDOW_STATE.WAIT)
	require('electron').ipcRenderer.send('start-update')
}

require('electron').ipcRenderer.on('set-update-state', function (event, data) {
	ChangeUpdateState( data.haveUpdates ? UPDATE_STATE.AVAILABLE : UPDATE_STATE.NOTAVAILABLE)
})

require('electron').ipcRenderer.on('load', function (event, data) {
	console.log('load')
	console.log(data.msg.online)
	ChangeWindowState(WINDOW_STATE.WELCOME)
	var app = data.msg
	if (app !== undefined) {
		
		if(app.online === undefined) app.title = ''
		let welcomeList = `
		<a id="enter-button" class="item"  onclick="Enter('${app.url}')" >
			<div class="title">${app.title}</div>
			<!--<div class="icon policlinic"></div>-->
			<div class="cube-wrapper">
				<div class="cube-folding">
				  <span class="leaf1"></span>
				  <span class="leaf2"></span>
				  <span class="leaf3"></span>
				  <span class="leaf4"></span>
				  <span class="leaf5"></span>
				</div>
			  </div>
			</div>
			<div class="params">
				<b>HOST:</b><span>${app.host}</span>
				<b>PORT:</b><span>${app.port}</span>
			</div>
			<div class="overlay"></div>
		</a>`
		$('.welcome>.col12').html(welcomeList)


		$('.config').find('h3').html(app.title)
		$('.config').find('#port').val(app.port)

		ipInput.setIp(app.host);
		if(app.online) 
			ChangeConnectionState(CONNECTION_STATE.ONLINE)
		else if(app.online === undefined) 
			ChangeConnectionState(CONNECTION_STATE.CHECKING)
		else 
			ChangeConnectionState(CONNECTION_STATE.OFFLINE)

	} else {
		$('.welcome>.col12').html("Нет доступных серверов!")
	}

	if (app.online) {
		let count = 0;
		startTimerInterval = setInterval(function () {
			UpdateProgressBarState(true, Math.floor(count/4000*100), `ОТКРЫТИЕ ЧЕРЕЗ ${Math.floor(4 - count / 1000)} СЕК.`)
			count += 100;
			if(count >= 4000)
				clearInterval(startTimerInterval)
		}, 100);
		startTimer = setTimeout(function () {
			ChangeWindowState(WINDOW_STATE.WAIT)
			UpdateProgressBarState(false)
			require('electron').ipcRenderer.send('load-application', app.url)
		}, 4000)
	}
})


require('electron').ipcRenderer.on('console', function (event, data) {
	//console.log(data.message)
})

// ПРОВЕРКА ОБНОВЛЕНИЙ
// 
// 
require('electron').ipcRenderer.on('message', function (event, data) {
	console.log('sendStatusToWindow')
	console.log(data.text)
	switch (data.text) {
		case 'Проверка соединения':
			//console.log('Проверка соединения')
			$('.welcome>.col12').html("Нет доступных серверов!")
			console.log('Проверка соединения')
			//require('electron').ipcRenderer.send('check-update')
			break
		case 'Нет новых обновлений':
		case 'Ошибка при обновлении':
			$('#status-bar').removeClass()
			$('#status-bar').addClass('ready')
			console.log('Нет новых обновлений')
			//Auto startup 
			//TestConnection(false)
			break
		case 'Ошибка при подключении':
			$('#status-bar').removeClass()
			$('#status-bar').addClass('ready')
			console.log('Ошибка при подключении')
			break
		case 'Доступны новые обновления':
			//TestConnection(true)
			$('#status-bar').removeClass()
			$('#status-bar').addClass('ready')

			break
		case 'Подключение':
		case 'Поиск обновлений...':
			break
		case 'Загрузка обновлений':
		case 'Обновление загружено':
			ChangeWindowState(WINDOW_STATE.WAIT)
			console.log('Загрузка обновлений')
			if (data.text == 'Загрузка обновлений') {
				if (data.code > 50 && data.code < 57) 
					UpdateProgressBarState(true, data.code, `Половина пути пройдена, осталось не много!`)
				else if (data.code < 93) 
					UpdateProgressBarState(true, data.code, `${Math.floor(data.code)} %`)
				else 
					UpdateProgressBarState(true, data.code, `Приготовьтесь к чему-то невиданному!`)
			} else if (data.text == 'Обновление загружено') {
				UpdateProgressBarState(false)
			}

			$('#status-bar').removeClass()
			$('#status-bar').addClass('wait')
			break
		default:
			break
	}
	$('#status-message').html(data.text)
})

$('#exit-button').on('click', () => { Exit() });
$('#back-button').on('click', () => { CloseConfig() });
$('#menu-button').on('click', () => { ShowConfig(); });
$('#update-button').on('click', () => { StartUpdate() });
$('#save-url').on('click', () => { ChangeUrl(); });


import { remote } from "electron";
import jetpack from "fs-jetpack";
//import env from "env";
//import { UPDATE_DOWNLOADED } from "electron-updater";

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());
const manifest = appDir.read("package.json", "json");
document.querySelector("#electron-version").innerHTML =	manifest.version;
