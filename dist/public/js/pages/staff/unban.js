"use strict";$(document).on("click","#unBanUser",function(){var a=$("#userId").val();request("/staff/user/"+a+"/unban","POST").then(function(){success("This user has been unbanned.",function(){})})["catch"](function(a){warning(a.responseJSON.message)})});










