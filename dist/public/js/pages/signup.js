"use strict";function daysInMonth(a,b){return new Date(b,a,0).getDate()}for(var year=new Date().getFullYear()-13,i=year;i>year-100;)$("#birthYearFormSelect").append("<option value=\""+i+"\">"+i+"</option>"),i-=1;$("#birthYearFormSelect").click(function(){$("#birthMonthFormSelect").removeAttr("disabled")}),$("#birthYearFormSelect").change(function(){$("#birthMonthFormSelect").removeAttr("disabled");for(var a=parseInt($("#birthYearFormSelect").val()),b=1;12>=b;)b+=1;$("#birthDayFormSelect").empty();for(var c=1;c<=daysInMonth(parseInt($("#birthMonthFormSelect").val()),a);)$("#birthDayFormSelect").append("<option value=\""+c+"\">"+c+"</option>"),c+=1}),$("#birthMonthFormSelect").click(function(){$("#birthDayFormSelect").removeAttr("disabled");for(var a=parseInt($("#birthYearFormSelect").val()),b=1;12>=b;)b+=1;$("#birthDayFormSelect").empty(),console.log("empty");for(var c=1;c<=daysInMonth(parseInt($("#birthMonthFormSelect").val()),a);)console.log("ok"),$("#birthDayFormSelect").append("<option value=\""+c+"\">"+c+"</option>"),c+=1}),$("#birthMonthFormSelect").change(function(){$("#birthDayFormSelect").removeAttr("disabled");for(var a=parseInt($("#birthYearFormSelect").val()),b=1;12>=b;)b+=1;$("#birthDayFormSelect").empty(),console.log("empty");for(var c=1;c<=daysInMonth(parseInt($("#birthMonthFormSelect").val()),a);)console.log("ok"),$("#birthDayFormSelect").append("<option value=\""+c+"\">"+c+"</option>"),c+=1});function usernameOk(a){return console.log(a),new Promise(function(b){request("/auth/username/available?username="+a,"GET").then(function(){b()})["catch"](function(a){$("#signUpButton").removeAttr("disabled"),warning(a.responseJSON.message)})})}$(document).on("click","#signUpButton",function(){var a=parseInt($("#birthYearFormSelect").val()),b=parseInt($("#birthMonthFormSelect").val()),c=parseInt($("#birthDayFormSelect").val());if(moment(a+"-"+b+"-"+c,"YYYY-M-D").isSameOrAfter(moment().subtract(13,"years")))return console.log(a+"-"+b+"-"+c),warning("Sorry! You must be 13 years of age or older to join BlocksHub!");var d=$("#username").val(),e=$("#password").val(),f=$("#confirmPassword").val(),g=grecaptcha.getResponse();""!==d&&""!==e&&null!==d&&null!==e&&6<=e.length&&3<=d.length&&f===e&&null!==$("#birthDatePick").val()?($("#signUpButton").attr("disabled","disabled"),usernameOk(d).then(function(){request("/auth/signup","POST",JSON.stringify({username:d,password:e,birth:[c,b,a],captcha:g})).then(function(){$("#signUpButton").removeAttr("disabled"),window.location.reload()})["catch"](function(a){$("#signUpButton").removeAttr("disabled"),console.log(a),warning(a.responseJSON.message),grecaptcha.reset()})})):5>=e.length?warning("Please enter a password longer than 5 Characters."):2>=d.length?warning("Please enter a username longer than 2 Characters."):f===e?warning("Please confirm you have filled out all fields, then try again."):warning("Your password and confirmed password don't match.")});















