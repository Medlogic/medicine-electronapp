import "./stylesheets/welcome.css";

var apps;

export const Exit = () =>
{
  require('electron').ipcRenderer.send('exit-application')
}

export const Enter = (item) =>
{
  console.log(item)
  $('.loading').fadeIn()
  $('.loading').removeClass('dark')
  $('.loading').addClass('light')
  require('electron').ipcRenderer.send('load-application', item)
}

export const TestConnection = (haveUpdates) =>
{
  //$('.loading').fadeIn()
  require('electron').ipcRenderer.send('test-connection', haveUpdates)
}
window.Enter = Enter;

export const Loading = () =>
{
}

// export const CloseConfig = () =>
// {
//   $('.config').fadeOut("fast", () =>
//   {
//     $('.welcome').fadeIn()
//   })
// }
// export const ShowConfig = () =>
// {
//   $('.welcome').fadeOut("fast", () =>
//   {
//     $('.config').fadeIn()
//   })
// }

export const StartUpdate = () =>
{
  $('.loading').fadeIn()
  $('.loading').removeClass('light')
  $('.loading').addClass('dark')
  require('electron').ipcRenderer.send('start-update')
}

require('electron').ipcRenderer.on('load', function (event, data)
{
  apps = data.msg
  if (apps !== undefined && apps.length > 0)
  {
    let configList = ''
    let welcomeList = ''
    welcomeList += '<a id="enter-button" class="item"  onclick="Enter(\'' + apps[0].app_title + '\')">'
    welcomeList += '<div class="title">' + apps[0].app_title + '</div>'
    welcomeList += '<div class="icon policlinic"></div>'
    welcomeList += '</a>'

    // for (let app in apps)
    // {
    //   configList += '<li><div class="name">' + apps[app].app_title + '</div>'
    //   configList += '<b>host:</b> <span>' + apps[app].host + '</span>'
    //   configList += '<b>port:</b> <span>' + apps[app].port + '</span></li>'
    // }

    //$('.config').find('ul').html(configList)
    $('.welcome>.col12').html(welcomeList)
    $('.loading').fadeOut()
    //CloseConfig()
  } else
  {
    $('.loading').fadeOut()
    $('.welcome>.col12').html("Нет доступных серверов!")
  }
})

// require('electron').ipcRenderer.on('check_connections', function (event, data)
// {
//   $('.loading').fadeIn()
//   $('.welcome>.col12').html("Поиск доступных серверов...<br><br><br><br><br><br><br><p></p>")
// })

// ПРОВЕРКА ОБНОВЛЕНИЙ
// 
// 
require('electron').ipcRenderer.on('message', function (event, data)
{
  console.log('sendStatusToWindow')
  console.log(data.text)
  switch (data.text)
  {
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
        TestConnection(false)
      
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
      TestConnection(true)
      $('#status-bar').removeClass()
      $('#status-bar').addClass('ready')
      $('#update-button').show();
      
      $('.loading').fadeIn()
      $('.loading').removeClass('light')
      $('.loading').addClass('dark')
      break
    case 'Подключение':
    case 'Поиск обновлений...':
    case 'Обновление загружено':
    case 'Загрузка обновлений':
    default:
      console.log('Загрузка обновлений')
      if (data.text == 'Загрузка обновлений')
      {
        $('.loading-widget').show();
        $('.loading-glow-stick').css('left', data.code + '%')
        $('.loading-bar').css('width', data.code + '%')
      } else if (data.text == 'Обновление загружено')
      {
        $('.loading-widget').fadeOut("slow");
      }

      $('#status-bar').removeClass()
      $('#status-bar').addClass('wait')
      break
    // case 'Ошибка при обновлении':
    //   if (data.code !== undefined && data.code == 'net::ERR_NAME_NOT_RESOLVED')
    //   {
    //     $('#status-bar').removeClass()
    //     $('#status-bar').addClass('offline')
    //   } else
    //   {
    //     $('#status-bar').removeClass()
    //     $('#status-bar').addClass('notready')
    //   }
    //   break
  }
  console.log(data)
  $('#status-message').html(data.text)
  //console.log(data)    
})

$('#exit-button').on('click', () => { Exit() });
//$('#back-button').on('click', () => { CloseConfig() });
//$('#menu-button').on('click', () => { ShowConfig() });

$('#update-button').on('click', () => { StartUpdate() });
//$('#enter-button').on('click', () => { Exit() });


import { remote } from "electron";
import jetpack from "fs-jetpack";
//import { greet } from "./hello_world/hello_world";
import env from "env";

const app = remote.app;
const appDir = jetpack.cwd(app.getAppPath());
const manifest = appDir.read("package.json", "json");
//console.log(manifest)
//console.log(process.versions)
document.querySelector("#electron-version").innerHTML =
  manifest.version;