import "./stylesheets/welcome.css";

var startTimer;
var ipInput = $('#host').ipInput();

export const Exit = () => {
	require('electron').ipcRenderer.send('exit-application')
}

export const Enter = (app_url) => {
	clearTimeout(startTimer)
	$('.progressbar-widget').fadeOut();
	$('.loading').fadeIn()
	$('.loading').removeClass('dark')
	$('.loading').addClass('light')
	require('electron').ipcRenderer.send('load-application', app_url)
}

export const TestConnection = (haveUpdates) => {
	//$('.loading').fadeIn()
	//require('electron').ipcRenderer.send('check-connection', '')
}
window.Enter = Enter;

export const Loading = () => {
}

export const CloseConfig = () => {
	$('.loading').hide()
	$('.config').fadeOut("fast", () => {
		$('.welcome').fadeIn()
	})
}
window.CloseConfig = CloseConfig;

export const ShowConfig = () => {
	$('.loading').show()
	clearTimeout(startTimer);
	$('.progressbar-widget').fadeOut();
	$('.welcome').fadeOut("fast", () => {
		$('.config').fadeIn()
	})
}
window.ShowConfig = ShowConfig;

export const ChangeUrl = () => {
	var portStr = document.getElementById('port').value
	var port = portStr > 0 && portStr < 65535 ? portStr : 80
	var url = `http://${ipInput.getIp()}:${port}`
	require('electron').ipcRenderer.send('check-connection', url)

	CloseConfig()
	$('.loading').show()
}

export const StartUpdate = () => {
	$('.progressbar-widget').fadeOut();
	$('.loading').fadeIn()
	$('.loading').removeClass('light')
	$('.loading').addClass('dark')
	require('electron').ipcRenderer.send('start-update')
}

require('electron').ipcRenderer.on('load', function (event, data) {
	var app = data.msg
	if (app !== undefined) {
		$('.loading').fadeOut()
		let welcomeList = `
		<a id="enter-button" class="item ${app.online ? '' : 'disabled'}"  onclick="Enter('${app.url}')" >
			<div class="title">${app.title}</div>
			<div class="icon policlinic"></div>
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

	} else {
		$('.welcome>.col12').html("Нет доступных серверов!")
	}

	if (app.online) {
		$('.progressbar-widget').fadeIn();
		var count = 0;
		var countInterval = setInterval(function () {
			$('.progressbar-widget .title').html(`ОТКРЫТИЕ ЧЕРЕЗ ${Math.floor(4 - count / 1000)} СЕК.`)
			$('.progressbar-widget .bar').css('width', Math.floor(count/4000*100) + '%')
			count += 100;
			if(count >= 4000)
				clearInterval(countInterval)
		}, 100);
		startTimer = setTimeout(function () {
			$('.loading').fadeIn()
			$('.progressbar-widget').fadeOut();
			require('electron').ipcRenderer.send('load-application', app.url)
		}, 4000)
	}
})


require('electron').ipcRenderer.on('console', function (event, data) {
	console.log(data.message)
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
			$('.loading').fadeOut()
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

			$('.loading').fadeIn()
			$('.loading').removeClass('light')
			$('.loading').addClass('dark')
			break
		case 'Ошибка при подключении':
			$('.loading').fadeOut()
			$('#status-bar').removeClass()
			$('#status-bar').addClass('ready')
			console.log('Ошибка при подключении')
			break
		case 'Доступны новые обновления':
			//TestConnection(true)
			$('#status-bar').removeClass()
			$('#status-bar').addClass('ready')
			$('#update-button').show();

			$('.loading').fadeIn()
			$('.loading').removeClass('light')
			$('.loading').addClass('dark')
			break
		case 'Подключение':
		case 'Поиск обновлений...':
			break
		case 'Загрузка обновлений':
		case 'Обновление загружено':
			console.log('Загрузка обновлений')
			if (data.text == 'Загрузка обновлений') {
				$('.loading-widget').show();
				$('.loading-glow-stick').css('left', data.code + '%')
				$('.loading-bar').css('width', data.code + '%')
			} else if (data.text == 'Обновление загружено') {
				$('.loading-widget').fadeOut("slow");
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
import env from "env";

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());
const manifest = appDir.read("package.json", "json");
document.querySelector("#electron-version").innerHTML =	manifest.version;