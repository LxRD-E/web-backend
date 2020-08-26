"use strict";$(document).on("click","#submit",function(){loading(),request("/report-abuse/feed/friends/"+$("#user-status-id").val(),"POST",{reason:$("#report-reason").val()}).then(function(){success("The abuse report has been sent and our moderators will review it. Thank you for keeping our website safe.",function(){window.history.back()})})["catch"](function(a){warning(a.responseJSON.message)})});









