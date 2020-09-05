"use strict";function request(a,b,c){return new Promise(function(d,e){function f(g){$.ajax({type:b,data:c,url:"/api/v1"+a,headers:{"Content-Type":"application/json","X-CSRF-Token":g},dataType:"json",xhr:function(){var a=jQuery.ajaxSettings.xhr(),b=a.setRequestHeader;return a.setRequestHeader=function(a,c){"X-Requested-With"==a||b.call(this,a,c)},a},complete:function complete(a){if(200===a.status)d(a);else{if(403===a.status)//Csrf Validation Failed
return f(a.getResponseHeader("X-CSRF-Token"));a.responseJSON||(a.responseJSON={}),"undefined"==typeof a.responseJSON.message&&(a.responseJSON.message="An unknown error has ocurred."),e(a)}},failure:function failure(a){a.responseJSON&&null!==a.responseJSON.message||(a.responseJSON={},a.responseJSON.message="An unknown error has ocurred."),e(a)}})}f("")})}
















