"use strict";$(document).on("click","#changePassword",function(){var a=$("#userId").val();request("/staff/user/"+a+"/resetpassword","POST").then(function(b){success("Link: https://blockshub.net/reset/password?userId="+a+"&code="+b.code,function(){})})["catch"](function(a){warning(a.responseJSON.message)})});











