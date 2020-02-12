"use strict";var pageLoadBegin=Date.now(),wsSupported=!1;function supportsLocalStorage(){try{return localStorage.setItem("localStorageTestKey","localStorageTestValue"),localStorage.removeItem("localStorageTestKey"),!0}catch(a){return!1}}function supportsWebSockets(){return"WebSocket"in window||"MozWebSocket"in window}wsSupported=supportsWebSockets();function onInitialScriptLoad(){var a=Date.now()-pageLoadBegin;request("/metrics/report","POST",JSON.stringify({metricId:1,features:{localStorage:supportsLocalStorage(),webSockets:supportsWebSockets()},pageLoadTime:a})).then(function(){})["catch"](function(){})}document.addEventListener("DOMContentLoaded",function(){}),window.addEventListener("load",function(){onInitialScriptLoad(),wsSupported||void 0});







