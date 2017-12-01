import "./stylesheets/welcome.css";

var apps;

export  const Exit = () => {
    require('electron').ipcRenderer.send('exit-application')
	} 
	
export  const Enter = (item) => {
	$('.loading').fadeIn()
	require('electron').ipcRenderer.send('load-application', item )
} 
window.Enter = Enter;

export const Loading = () => {    
}

export  const CloseConfig = () => {
	$('.config').fadeOut("fast", () => {
		$('.welcome').fadeIn()
	})
} 
export  const ShowConfig = () => {
	$('.welcome').fadeOut("fast", () => {
		$('.config').fadeIn()
	})
} 
	


  require('electron').ipcRenderer.on('load' , function(event , data){ 
    apps = data.msg
    if(apps !== undefined && apps.length > 0){
      let configList = ''
      let welcomeList = ''
      for(let app in apps){
        configList += '<li><div class="name">' + apps[app].app_title + '</div>'
        configList += '<b>host:</b> <span>' + apps[app].host + '</span>'
        configList += '<b>port:</b> <span>' + apps[app].port + '</span></li>'

        welcomeList += '<a id="enter-button" onclick="Enter(\'' + apps[app].app_title + '\')" class="item"><div class="title">' + apps[app].app_title + '</div>'
        switch(apps[app].app_title){
          case 'Поликлиника':
            welcomeList += '<div class="icon policlinic"></div>'
          break;
          case 'Травматология':
            welcomeList += '<div class="icon traumatology"></div>'
          break;
        }
        welcomeList += '<div class="params"><span>' + apps[app].app_url + '</span></div></a>'
      }

      //Auto startup 
      if(apps.length == 1){
        //Enter(apps[0].app_title)
      }

      $('.config').find('ul').html(configList)
      $('.welcome>.col12').html(welcomeList)
      
      $('.loading').fadeOut()
      CloseConfig()

    }else{
      $('.loading').fadeOut()
      $('.welcome>.col12').html("Нет доступных серверов!")
    }
      
  })
  
  require('electron').ipcRenderer.on('check_connections' , function(event , data){ 
    $('.loading').fadeIn()
    $('.welcome>.col12').html("Поиск доступных серверов...<br/><br/><br/><br/><p><b>Внимание!</b></p><p><b>Процесс начальной инициализации может длиться до 1 минуты!</b></p>")
	})
	
  require('electron').ipcRenderer.on('message' , function(event , data){
    $('#status').html(data)
    console.log(data)    
	})
	
$('#exit-button').on('click', () => {Exit()});
$('#back-button').on('click', () => {CloseConfig()});
$('#menu-button').on('click', () => {ShowConfig()});
//$('#enter-button').on('click', () => { Exit() });
document.querySelector("#electron-version").innerHTML =
  process.versions.electron;