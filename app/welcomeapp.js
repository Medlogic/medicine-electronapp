/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 25);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("electron");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("fs-jetpack");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = {"name":"production","description":"Add here any environment specific stuff you like."}

/***/ }),
/* 3 */
/***/ (function(module, exports) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/
// css base code, injected by the css-loader
module.exports = function(useSourceMap) {
	var list = [];

	// return the list of modules as css string
	list.toString = function toString() {
		return this.map(function (item) {
			var content = cssWithMappingToString(item, useSourceMap);
			if(item[2]) {
				return "@media " + item[2] + "{" + content + "}";
			} else {
				return content;
			}
		}).join("");
	};

	// import a list of modules into the list
	list.i = function(modules, mediaQuery) {
		if(typeof modules === "string")
			modules = [[null, modules, ""]];
		var alreadyImportedModules = {};
		for(var i = 0; i < this.length; i++) {
			var id = this[i][0];
			if(typeof id === "number")
				alreadyImportedModules[id] = true;
		}
		for(i = 0; i < modules.length; i++) {
			var item = modules[i];
			// skip already imported module
			// this implementation is not 100% perfect for weird media query combinations
			//  when a module is imported multiple times with different media queries.
			//  I hope this will never occur (Hey this way we have smaller bundles)
			if(typeof item[0] !== "number" || !alreadyImportedModules[item[0]]) {
				if(mediaQuery && !item[2]) {
					item[2] = mediaQuery;
				} else if(mediaQuery) {
					item[2] = "(" + item[2] + ") and (" + mediaQuery + ")";
				}
				list.push(item);
			}
		}
	};
	return list;
};

function cssWithMappingToString(item, useSourceMap) {
	var content = item[1] || '';
	var cssMapping = item[3];
	if (!cssMapping) {
		return content;
	}

	if (useSourceMap && typeof btoa === 'function') {
		var sourceMapping = toComment(cssMapping);
		var sourceURLs = cssMapping.sources.map(function (source) {
			return '/*# sourceURL=' + cssMapping.sourceRoot + source + ' */'
		});

		return [content].concat(sourceURLs).concat([sourceMapping]).join('\n');
	}

	return [content].join('\n');
}

// Adapted from convert-source-map (MIT)
function toComment(sourceMap) {
	// eslint-disable-next-line no-undef
	var base64 = btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap))));
	var data = 'sourceMappingURL=data:application/json;charset=utf-8;base64,' + base64;

	return '/*# ' + data + ' */';
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

var stylesInDom = {};

var	memoize = function (fn) {
	var memo;

	return function () {
		if (typeof memo === "undefined") memo = fn.apply(this, arguments);
		return memo;
	};
};

var isOldIE = memoize(function () {
	// Test for IE <= 9 as proposed by Browserhacks
	// @see http://browserhacks.com/#hack-e71d8692f65334173fee715c222cb805
	// Tests for existence of standard globals is to allow style-loader
	// to operate correctly into non-standard environments
	// @see https://github.com/webpack-contrib/style-loader/issues/177
	return window && document && document.all && !window.atob;
});

var getElement = (function (fn) {
	var memo = {};

	return function(selector) {
		if (typeof memo[selector] === "undefined") {
			var styleTarget = fn.call(this, selector);
			// Special case to return head of iframe instead of iframe itself
			if (styleTarget instanceof window.HTMLIFrameElement) {
				try {
					// This will throw an exception if access to iframe is blocked
					// due to cross-origin restrictions
					styleTarget = styleTarget.contentDocument.head;
				} catch(e) {
					styleTarget = null;
				}
			}
			memo[selector] = styleTarget;
		}
		return memo[selector]
	};
})(function (target) {
	return document.querySelector(target)
});

var singleton = null;
var	singletonCounter = 0;
var	stylesInsertedAtTop = [];

var	fixUrls = __webpack_require__(5);

module.exports = function(list, options) {
	if (typeof DEBUG !== "undefined" && DEBUG) {
		if (typeof document !== "object") throw new Error("The style-loader cannot be used in a non-browser environment");
	}

	options = options || {};

	options.attrs = typeof options.attrs === "object" ? options.attrs : {};

	// Force single-tag solution on IE6-9, which has a hard limit on the # of <style>
	// tags it will allow on a page
	if (!options.singleton) options.singleton = isOldIE();

	// By default, add <style> tags to the <head> element
	if (!options.insertInto) options.insertInto = "head";

	// By default, add <style> tags to the bottom of the target
	if (!options.insertAt) options.insertAt = "bottom";

	var styles = listToStyles(list, options);

	addStylesToDom(styles, options);

	return function update (newList) {
		var mayRemove = [];

		for (var i = 0; i < styles.length; i++) {
			var item = styles[i];
			var domStyle = stylesInDom[item.id];

			domStyle.refs--;
			mayRemove.push(domStyle);
		}

		if(newList) {
			var newStyles = listToStyles(newList, options);
			addStylesToDom(newStyles, options);
		}

		for (var i = 0; i < mayRemove.length; i++) {
			var domStyle = mayRemove[i];

			if(domStyle.refs === 0) {
				for (var j = 0; j < domStyle.parts.length; j++) domStyle.parts[j]();

				delete stylesInDom[domStyle.id];
			}
		}
	};
};

function addStylesToDom (styles, options) {
	for (var i = 0; i < styles.length; i++) {
		var item = styles[i];
		var domStyle = stylesInDom[item.id];

		if(domStyle) {
			domStyle.refs++;

			for(var j = 0; j < domStyle.parts.length; j++) {
				domStyle.parts[j](item.parts[j]);
			}

			for(; j < item.parts.length; j++) {
				domStyle.parts.push(addStyle(item.parts[j], options));
			}
		} else {
			var parts = [];

			for(var j = 0; j < item.parts.length; j++) {
				parts.push(addStyle(item.parts[j], options));
			}

			stylesInDom[item.id] = {id: item.id, refs: 1, parts: parts};
		}
	}
}

function listToStyles (list, options) {
	var styles = [];
	var newStyles = {};

	for (var i = 0; i < list.length; i++) {
		var item = list[i];
		var id = options.base ? item[0] + options.base : item[0];
		var css = item[1];
		var media = item[2];
		var sourceMap = item[3];
		var part = {css: css, media: media, sourceMap: sourceMap};

		if(!newStyles[id]) styles.push(newStyles[id] = {id: id, parts: [part]});
		else newStyles[id].parts.push(part);
	}

	return styles;
}

function insertStyleElement (options, style) {
	var target = getElement(options.insertInto)

	if (!target) {
		throw new Error("Couldn't find a style target. This probably means that the value for the 'insertInto' parameter is invalid.");
	}

	var lastStyleElementInsertedAtTop = stylesInsertedAtTop[stylesInsertedAtTop.length - 1];

	if (options.insertAt === "top") {
		if (!lastStyleElementInsertedAtTop) {
			target.insertBefore(style, target.firstChild);
		} else if (lastStyleElementInsertedAtTop.nextSibling) {
			target.insertBefore(style, lastStyleElementInsertedAtTop.nextSibling);
		} else {
			target.appendChild(style);
		}
		stylesInsertedAtTop.push(style);
	} else if (options.insertAt === "bottom") {
		target.appendChild(style);
	} else if (typeof options.insertAt === "object" && options.insertAt.before) {
		var nextSibling = getElement(options.insertInto + " " + options.insertAt.before);
		target.insertBefore(style, nextSibling);
	} else {
		throw new Error("[Style Loader]\n\n Invalid value for parameter 'insertAt' ('options.insertAt') found.\n Must be 'top', 'bottom', or Object.\n (https://github.com/webpack-contrib/style-loader#insertat)\n");
	}
}

function removeStyleElement (style) {
	if (style.parentNode === null) return false;
	style.parentNode.removeChild(style);

	var idx = stylesInsertedAtTop.indexOf(style);
	if(idx >= 0) {
		stylesInsertedAtTop.splice(idx, 1);
	}
}

function createStyleElement (options) {
	var style = document.createElement("style");

	options.attrs.type = "text/css";

	addAttrs(style, options.attrs);
	insertStyleElement(options, style);

	return style;
}

function createLinkElement (options) {
	var link = document.createElement("link");

	options.attrs.type = "text/css";
	options.attrs.rel = "stylesheet";

	addAttrs(link, options.attrs);
	insertStyleElement(options, link);

	return link;
}

function addAttrs (el, attrs) {
	Object.keys(attrs).forEach(function (key) {
		el.setAttribute(key, attrs[key]);
	});
}

function addStyle (obj, options) {
	var style, update, remove, result;

	// If a transform function was defined, run it on the css
	if (options.transform && obj.css) {
	    result = options.transform(obj.css);

	    if (result) {
	    	// If transform returns a value, use that instead of the original css.
	    	// This allows running runtime transformations on the css.
	    	obj.css = result;
	    } else {
	    	// If the transform function returns a falsy value, don't add this css.
	    	// This allows conditional loading of css
	    	return function() {
	    		// noop
	    	};
	    }
	}

	if (options.singleton) {
		var styleIndex = singletonCounter++;

		style = singleton || (singleton = createStyleElement(options));

		update = applyToSingletonTag.bind(null, style, styleIndex, false);
		remove = applyToSingletonTag.bind(null, style, styleIndex, true);

	} else if (
		obj.sourceMap &&
		typeof URL === "function" &&
		typeof URL.createObjectURL === "function" &&
		typeof URL.revokeObjectURL === "function" &&
		typeof Blob === "function" &&
		typeof btoa === "function"
	) {
		style = createLinkElement(options);
		update = updateLink.bind(null, style, options);
		remove = function () {
			removeStyleElement(style);

			if(style.href) URL.revokeObjectURL(style.href);
		};
	} else {
		style = createStyleElement(options);
		update = applyToTag.bind(null, style);
		remove = function () {
			removeStyleElement(style);
		};
	}

	update(obj);

	return function updateStyle (newObj) {
		if (newObj) {
			if (
				newObj.css === obj.css &&
				newObj.media === obj.media &&
				newObj.sourceMap === obj.sourceMap
			) {
				return;
			}

			update(obj = newObj);
		} else {
			remove();
		}
	};
}

var replaceText = (function () {
	var textStore = [];

	return function (index, replacement) {
		textStore[index] = replacement;

		return textStore.filter(Boolean).join('\n');
	};
})();

function applyToSingletonTag (style, index, remove, obj) {
	var css = remove ? "" : obj.css;

	if (style.styleSheet) {
		style.styleSheet.cssText = replaceText(index, css);
	} else {
		var cssNode = document.createTextNode(css);
		var childNodes = style.childNodes;

		if (childNodes[index]) style.removeChild(childNodes[index]);

		if (childNodes.length) {
			style.insertBefore(cssNode, childNodes[index]);
		} else {
			style.appendChild(cssNode);
		}
	}
}

function applyToTag (style, obj) {
	var css = obj.css;
	var media = obj.media;

	if(media) {
		style.setAttribute("media", media)
	}

	if(style.styleSheet) {
		style.styleSheet.cssText = css;
	} else {
		while(style.firstChild) {
			style.removeChild(style.firstChild);
		}

		style.appendChild(document.createTextNode(css));
	}
}

function updateLink (link, options, obj) {
	var css = obj.css;
	var sourceMap = obj.sourceMap;

	/*
		If convertToAbsoluteUrls isn't defined, but sourcemaps are enabled
		and there is no publicPath defined then lets turn convertToAbsoluteUrls
		on by default.  Otherwise default to the convertToAbsoluteUrls option
		directly
	*/
	var autoFixUrls = options.convertToAbsoluteUrls === undefined && sourceMap;

	if (options.convertToAbsoluteUrls || autoFixUrls) {
		css = fixUrls(css);
	}

	if (sourceMap) {
		// http://stackoverflow.com/a/26603875
		css += "\n/*# sourceMappingURL=data:application/json;base64," + btoa(unescape(encodeURIComponent(JSON.stringify(sourceMap)))) + " */";
	}

	var blob = new Blob([css], { type: "text/css" });

	var oldSrc = link.href;

	link.href = URL.createObjectURL(blob);

	if(oldSrc) URL.revokeObjectURL(oldSrc);
}


/***/ }),
/* 5 */
/***/ (function(module, exports) {


/**
 * When source maps are enabled, `style-loader` uses a link element with a data-uri to
 * embed the css on the page. This breaks all relative urls because now they are relative to a
 * bundle instead of the current page.
 *
 * One solution is to only use full urls, but that may be impossible.
 *
 * Instead, this function "fixes" the relative urls to be absolute according to the current page location.
 *
 * A rudimentary test suite is located at `test/fixUrls.js` and can be run via the `npm test` command.
 *
 */

module.exports = function (css) {
  // get current location
  var location = typeof window !== "undefined" && window.location;

  if (!location) {
    throw new Error("fixUrls requires window.location");
  }

	// blank or null?
	if (!css || typeof css !== "string") {
	  return css;
  }

  var baseUrl = location.protocol + "//" + location.host;
  var currentDir = baseUrl + location.pathname.replace(/\/[^\/]*$/, "/");

	// convert each url(...)
	/*
	This regular expression is just a way to recursively match brackets within
	a string.

	 /url\s*\(  = Match on the word "url" with any whitespace after it and then a parens
	   (  = Start a capturing group
	     (?:  = Start a non-capturing group
	         [^)(]  = Match anything that isn't a parentheses
	         |  = OR
	         \(  = Match a start parentheses
	             (?:  = Start another non-capturing groups
	                 [^)(]+  = Match anything that isn't a parentheses
	                 |  = OR
	                 \(  = Match a start parentheses
	                     [^)(]*  = Match anything that isn't a parentheses
	                 \)  = Match a end parentheses
	             )  = End Group
              *\) = Match anything and then a close parens
          )  = Close non-capturing group
          *  = Match anything
       )  = Close capturing group
	 \)  = Match a close parens

	 /gi  = Get all matches, not the first.  Be case insensitive.
	 */
	var fixedCss = css.replace(/url\s*\(((?:[^)(]|\((?:[^)(]+|\([^)(]*\))*\))*)\)/gi, function(fullMatch, origUrl) {
		// strip quotes (if they exist)
		var unquotedOrigUrl = origUrl
			.trim()
			.replace(/^"(.*)"$/, function(o, $1){ return $1; })
			.replace(/^'(.*)'$/, function(o, $1){ return $1; });

		// already a full url? no change
		if (/^(#|data:|http:\/\/|https:\/\/|file:\/\/\/)/i.test(unquotedOrigUrl)) {
		  return fullMatch;
		}

		// convert the url to a full url
		var newUrl;

		if (unquotedOrigUrl.indexOf("//") === 0) {
		  	//TODO: should we add protocol?
			newUrl = unquotedOrigUrl;
		} else if (unquotedOrigUrl.indexOf("/") === 0) {
			// path should be relative to the base url
			newUrl = baseUrl + unquotedOrigUrl; // already starts with '/'
		} else {
			// path should be relative to current directory
			newUrl = currentDir + unquotedOrigUrl.replace(/^\.\//, ""); // Strip leading './'
		}

		// send back the fixed url(...)
		return "url(" + JSON.stringify(newUrl) + ")";
	});

	// send back the fixed css
	return fixedCss;
};


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bye = exports.greet = void 0;

const greet = () => {
  return "Hello World!";
};

exports.greet = greet;

const bye = () => {
  return "See ya!";
};

exports.bye = bye;

/***/ }),
/* 7 */,
/* 8 */,
/* 9 */,
/* 10 */,
/* 11 */,
/* 12 */,
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ShowConfig = exports.CloseConfig = exports.Loading = exports.Enter = exports.Exit = void 0;

__webpack_require__(26);

var _electron = __webpack_require__(0);

var _fsJetpack = _interopRequireDefault(__webpack_require__(1));

var _hello_world = __webpack_require__(6);

var _env = _interopRequireDefault(__webpack_require__(2));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var apps;

const Exit = () => {
  __webpack_require__(0).ipcRenderer.send('exit-application');
};

exports.Exit = Exit;

const Enter = item => {
  $('.loading').fadeIn();

  __webpack_require__(0).ipcRenderer.send('load-application', item);
};

exports.Enter = Enter;
window.Enter = Enter;

const Loading = () => {};

exports.Loading = Loading;

const CloseConfig = () => {
  $('.config').fadeOut("fast", () => {
    $('.welcome').fadeIn();
  });
};

exports.CloseConfig = CloseConfig;

const ShowConfig = () => {
  $('.welcome').fadeOut("fast", () => {
    $('.config').fadeIn();
  });
};

exports.ShowConfig = ShowConfig;

__webpack_require__(0).ipcRenderer.on('load', function (event, data) {
  apps = data.msg;

  if (apps !== undefined && apps.length > 0) {
    let configList = '';
    let welcomeList = '';

    for (let app in apps) {
      configList += '<li><div class="name">' + apps[app].app_title + '</div>';
      configList += '<b>host:</b> <span>' + apps[app].host + '</span>';
      configList += '<b>port:</b> <span>' + apps[app].port + '</span></li>';
      welcomeList += '<a id="enter-button" onclick="Enter(\'' + apps[app].app_title + '\')" class="item"><div class="title">' + apps[app].app_title + '</div>';

      switch (apps[app].app_title) {
        case 'Поликлиника':
          welcomeList += '<div class="icon policlinic"></div>';
          break;

        case 'Травматология':
          welcomeList += '<div class="icon traumatology"></div>';
          break;
      }

      welcomeList += '<div class="params"><span>' + apps[app].app_url + '</span></div></a>';
    } //Auto startup 


    if (apps.length == 1) {//Enter(apps[0].app_title)
    }

    $('.config').find('ul').html(configList);
    $('.welcome>.col12').html(welcomeList);
    $('.loading').fadeOut();
    CloseConfig();
  } else {
    $('.loading').fadeOut();
    $('.welcome>.col12').html("Нет доступных серверов!");
  }
});

__webpack_require__(0).ipcRenderer.on('check_connections', function (event, data) {
  $('.loading').fadeIn();
  $('.welcome>.col12').html("Поиск доступных серверов...<br/><br/><br/><br/><p><b>Внимание!</b></p><p><b>Процесс начальной инициализации может длиться до 1 минуты!</b></p>");
});

__webpack_require__(0).ipcRenderer.on('message', function (event, data) {
  switch (data.text) {
    case 'Нет новых обновлений':
      $('#status-bar').removeClass();
      $('#status-bar').addClass('ready');
      break;

    case 'Доступны новые обновления':
    case 'Поиск обновлений...':
    case 'Обновление загружено':
    case 'Загрузка обновлений':
    default:
      if (data.text == 'Загрузка обновлений') {
        $('.loading-widget').show();
        $('.loading-glow-stick').css('left', data.code + '%');
        $('.loading-bar').css('width', data.code + '%');
      } else if (data.text == 'Обновление загружено') {
        $('.loading-widget').fadeOut("slow");
      }

      $('#status-bar').removeClass();
      $('#status-bar').addClass('wait');
      break;

    case 'Подключение':
    case 'Ошибка при обновлении':
      if (data.code !== undefined && data.code == 'net::ERR_NAME_NOT_RESOLVED') {
        data.text = 'No internet connection';
        console.log(data.text);
        $('#status-bar').removeClass();
        $('#status-bar').addClass('offline');
      } else {
        $('#status-bar').removeClass();
        $('#status-bar').addClass('notready');
      }

      break;
  }

  console.log(data);
  $('#status-message').html(data.text); //console.log(data)    
});

$('#exit-button').on('click', () => {
  Exit();
});
$('#back-button').on('click', () => {
  CloseConfig();
});
$('#menu-button').on('click', () => {
  ShowConfig();
}); //$('#enter-button').on('click', () => { Exit() });

const app = _electron.remote.app;

const appDir = _fsJetpack.default.cwd(app.getAppPath());

const manifest = appDir.read("package.json", "json"); //console.log(manifest)
//console.log(process.versions)

document.querySelector("#electron-version").innerHTML = manifest.version;

/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

// style-loader: Adds some css to the DOM by adding a <style> tag

// load the styles
var content = __webpack_require__(27);
if(typeof content === 'string') content = [[module.i, content, '']];
// Prepare cssTransformation
var transform;

var options = {"hmr":true}
options.transform = transform
// add the styles to the DOM
var update = __webpack_require__(4)(content, options);
if(content.locals) module.exports = content.locals;
// Hot Module Replacement
if(false) {
	// When the styles change, update the <style> tags
	if(!content.locals) {
		module.hot.accept("!!../../node_modules/css-loader/index.js?url=false!./welcome.css", function() {
			var newContent = require("!!../../node_modules/css-loader/index.js?url=false!./welcome.css");
			if(typeof newContent === 'string') newContent = [[module.id, newContent, '']];
			update(newContent);
		});
	}
	// When the module is disposed, remove the <style> tags
	module.hot.dispose(function() { update(); });
}

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

exports = module.exports = __webpack_require__(3)(undefined);
// imports


// module
exports.push([module.i, "html{\r\n    border: 2px solid #ccc;\r\n    height: calc(100% - 4px);}\r\n  body{height: 100%}\r\n  body {-webkit-user-select: none; overflow: hidden; margin: 0;  font-family: sans-serif;}\r\n  \r\n  .config{display: none;}\r\n  .welcome{display: none1;}\r\n\r\n  #status-bar{text-align: center; position: absolute; left: 0; bottom: 0; height: 30px; width: 100%; \r\n              color: #ccc; z-index: 100; background: #555; transition: height 2.0s;}\r\n  #status-message{top: 50%; width: 100%;  position: absolute;}\r\n  .offline #status-message, .offline .ml-logo, .ready #status-message, .ready .ml-logo{opacity: 0;}\r\n  .wait #status-message, .wait .ml-logo{opacity: 1;}\r\n  .notready #status-message, .notready .ml-logo{opacity: 1;}\r\n\r\n  .status-icon{position: absolute; right: 20px; bottom: 10px; height: 10px; width: 10px; background: #ccc; border-radius: 5px;}\r\n  .ready .status-icon{background-color: #76f11c}\r\n  .wait .status-icon{background-color: #f1c51c}\r\n  .offline .status-icon{background-color: #aaa}\r\n  .notready .status-icon{background-color: #e06969}\r\n\r\n  #status-bar.ready, #status-bar.offline{height: 30px;}\r\n  #status-bar.wait{height: 100%;}\r\n  #status-bar.notready{height: calc(100% - 60px);}\r\n  .version{position: absolute; left: 20px; bottom: 0; line-height: 30px; color: #f0f0f0; font-size: 10px;}\r\n\r\n  .ml-logo{\r\n    width: 100%;\r\n    background: url(./images/logo.png) no-repeat center;\r\n    background-size: contain;\r\n    height: 80px;}\r\n\r\n  .loading-widget {\r\n    display: none;\r\n    width: 200px;\r\n    top: calc(50% + 50px);\r\n    background: #333;\r\n    border: 1px solid #555;\r\n    height: 20px;\r\n    position: absolute;\r\n    left: calc(50% - 100px);\r\n  }\r\n    .loading-bar {\r\n      width: 0;\r\n      top: 0;\r\n      background: #72b761;\r\n      height: 20px;\r\n      position: absolute;\r\n      left: 0;\r\n    }\r\n    .loading-glow-stick {\r\n      left: 0;\r\n      width: 1px;\r\n      top: 0;\r\n      background: #5fea3d;\r\n      height: 20px;\r\n      position: absolute;\r\n      box-shadow: 0 0 7px #1aef3d;\r\n      z-index: 100000;\r\n    }\r\n\r\n\r\n  #menu-button{display: none;}\r\n  .button{font-size: 14px; font-weight: bold; text-transform: uppercase; text-decoration: none; padding: 5px 10px;}\r\n  a.button:hover{color: #555; background-color: #ccc}\r\n  .close{position: absolute; left: 20px; top: 20px; color: #aaa;}\r\n  .back{position: absolute; right: 20px; top: 20px; color: #aaa;}\r\n  .add{\r\n    color: rgb(79, 177, 110);\r\n    border: 1px solid;\r\n    border-color: rgba(106, 144, 102, 0.48);\r\n    }\r\n\r\n  input{font-size: 14px; padding: 5px 10px; margin: 10px;}\r\n  .col6{width: 50%; float: left; margin-top: 50px;}\r\n\r\n  .center{text-align: center;}\r\n\r\n  .vertical-line{ position: absolute; width: 1px; height: 100%; left: 50%; background: #ddd}\r\n  \r\n  .welcome{\r\n    display: flex;\r\n    align-items: center;\r\n    justify-content: center;\r\n    height: 100%;\r\n  }\r\n  .welcome .col12{    width: 530px; text-align: center;}\r\n\r\n  .welcome a.item {\r\n    position: relative;\r\n    width: 136px;\r\n    height: 122px;\r\n    outline: 1px solid #eee;\r\n    margin: 10px;\r\n    display: inline-flex;\r\n    padding: 10px;\r\n    }\r\n  .welcome a.item:hover {\r\n    cursor: pointer;\r\n    background: #fafafa;\r\n    box-shadow: 0 0 20px rgba(255, 192, 192, 0.5);\r\n    }\r\n  .welcome a>.title{text-align: center; width: 100%; text-transform: uppercase; color: #646464;}\r\n  .welcome a.item>.icon{\r\n    position: absolute;\r\n    width: 75px;\r\n    height: 75px;\r\n    left: 50%;\r\n    top: 50%;\r\n    transform: translateX(-50%) translateY(-50%);\r\n  }\r\n\r\n  .icon.policlinic{\r\n    background: url('./images/policlinic.png'); \r\n    background-size: cover;\r\n    background-repeat: no-repeat;}\r\n  .icon.traumatology{\r\n    background: url('./images/traumatology.png');  \r\n    background-size: cover;\r\n    background-repeat: no-repeat;}\r\n\r\n  .welcome a>.params{\r\n    position: absolute;\r\n    bottom: 5px;\r\n    text-align: center;\r\n    font-size: 10px;\r\n    width: 100%;\r\n    left: 0;\r\n    color: #b0b0b0 !important;\r\n  }\r\n  .welcome a span{margin-right: 5px; }\r\n\r\n  .config ul>li{list-style:  square; margin-bottom: 15px;}\r\n  .config li>span,.config li>b{\r\n    font-size: 13px;\r\n    color: #777; }\r\n  .config li>span{margin-right: 15px; }\r\n  \r\n  form{padding-bottom: 25px;}\r\n\r\n\r\n\r\n  .loading{    \r\n    position: absolute;\r\n    width: 100%;\r\n    height: calc(100% - 50px);\r\n    background:rgba(255, 255, 255, 0.74);\r\n    z-index: 10;\r\n    }\r\n\r\n    .spinner {\r\n      position: absolute;\r\n      top: 50%;\r\n      left: 50%;\r\n      transform: translateX(-50%) translateY(-50%);\r\n}\r\n\r\n.spinner > div {\r\n  width: 18px;\r\n  height: 18px;\r\n  background-color: #e33;\r\n\r\n  border-radius: 100%;\r\n  display: inline-block;\r\n  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;\r\n  animation: sk-bouncedelay 1.4s infinite ease-in-out both;\r\n}\r\n\r\n.spinner .bounce1 {\r\n  -webkit-animation-delay: -0.32s;\r\n  animation-delay: -0.32s;\r\n}\r\n\r\n.spinner .bounce2 {\r\n  -webkit-animation-delay: -0.16s;\r\n  animation-delay: -0.16s;\r\n}\r\n\r\n@-webkit-keyframes sk-bouncedelay {\r\n  0%, 80%, 100% { -webkit-transform: scale(0) }\r\n  40% { -webkit-transform: scale(1.0) }\r\n}\r\n\r\n@keyframes sk-bouncedelay {\r\n  0%, 80%, 100% { \r\n    -webkit-transform: scale(0);\r\n    transform: scale(0);\r\n  } 40% { \r\n    -webkit-transform: scale(1.0);\r\n    transform: scale(1.0);\r\n  }\r\n}", ""]);

// exports


/***/ })
/******/ ]);
//# sourceMappingURL=welcomeapp.js.map