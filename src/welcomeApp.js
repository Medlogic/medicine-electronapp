import "./stylesheets/welcome.css";

var apps;
//const ORIENTATION = Enum("NORTH", "SOUTH", "WEST", "EAST")


export const Exit = () =>
{
  require('electron').ipcRenderer.send('exit-application')
}

export const Enter = (item) =>
{
  $('.loading').fadeIn()
  require('electron').ipcRenderer.send('load-application', item)
}
window.Enter = Enter;

export const Loading = () =>
{
}

export const CloseConfig = () =>
{
  $('.config').fadeOut("fast", () =>
  {
    $('.welcome').fadeIn()
  })
}
export const ShowConfig = () =>
{
  $('.welcome').fadeOut("fast", () =>
  {
    $('.config').fadeIn()
  })
}


require('electron').ipcRenderer.on('load', function (event, data)
{
  apps = data.msg
  if (apps !== undefined && apps.length > 0)
  {
    let configList = ''
    let welcomeList = ''
    for (let app in apps)
    {
      configList += '<li><div class="name">' + apps[app].app_title + '</div>'
      configList += '<b>host:</b> <span>' + apps[app].host + '</span>'
      configList += '<b>port:</b> <span>' + apps[app].port + '</span></li>'

      welcomeList += '<a id="enter-button" onclick="Enter(\'' + apps[app].app_title + '\')" class="item"><div class="title">' + apps[app].app_title + '</div>'
      switch (apps[app].app_title)
      {
        case 'Поликлиника':
          welcomeList += '<div class="icon policlinic"></div>'
          break;
        case 'Травматология':
          welcomeList += '<div class="icon traumatology"></div>'
          break;
      }
      welcomeList += '<div class="params"><span>' + apps[app].app_url + '</span></div></a>'
    }


    $('.config').find('ul').html(configList)
    $('.welcome>.col12').html(welcomeList)

    $('.loading').fadeOut()
    CloseConfig()

  } else
  {
    $('.loading').fadeOut()
    $('.welcome>.col12').html("Нет доступных серверов!")
  }

})

require('electron').ipcRenderer.on('check_connections', function (event, data)
{
  $('.loading').fadeIn()
  $('.welcome>.col12').html("Поиск доступных серверов...<br><br><br><br><br><br><br><p></p>")
})

// ПРОВЕРКА ОБНОВЛЕНИЙ
// 
// 
require('electron').ipcRenderer.on('message', function (event, data)
{
  switch (data.text)
  {
    case 'Нет новых обновлений':
    case 'Ошибка при обновлении':
      $('#status-bar').removeClass()
      $('#status-bar').addClass('ready')
      //Auto startup 
      if (apps.length == 1 )
      {
        Enter(apps[0].app_title)
      }

      break
    case 'Подключение':
    case 'Доступны новые обновления':
    case 'Поиск обновлений...':
    case 'Обновление загружено':
    case 'Загрузка обновлений':
    default:
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
$('#back-button').on('click', () => { CloseConfig() });
$('#menu-button').on('click', () => { ShowConfig() });
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