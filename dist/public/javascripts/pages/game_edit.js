"use strict";var gdetails=$("#gamedetails"),gameId=parseInt(gdetails.attr("data-gameid"),10);$(document).on("click","#updateDescAndTitleOnClick",function(){return"undefined"==typeof $("#assetName").val()||null===$("#assetName").val()||""===$("#assetName").val()?void warning("Please enter a name, then try again."):void request("/game/"+gameId,"PATCH",JSON.stringify({name:$("#assetName").val(),description:$("#assetDescription").val(),maxPlayers:parseInt($("#assetMaxPlayers").val(),10)})).then(function(){success("This game's description and title have been updated.")})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click","#updateMapScript",function(){var a=$("#mapScriptContent").val();request("/game/"+gameId+"/map","PATCH",JSON.stringify({script:a})).then(function(){success("This game's map script has been updated.")})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click","#createClientScript",function(){request("/game/"+gameId+"/script/client","POST",JSON.stringify({script:"console.log(\"Hello World!\");"})).then(function(){window.location.reload()})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click","#createServerScript",function(){request("/game/"+gameId+"/script/server","POST",JSON.stringify({script:"console.log(\"Hello World!\");"})).then(function(){window.location.reload()})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click",".updateScriptOnCLick",function(){var a=$(this).attr("data-scriptid"),b=$("textarea[data-scriptid='"+a+"']").val();request("/game/"+gameId+"/script/"+a,"PATCH",JSON.stringify({script:b})).then(function(){success("This script has been updated.")})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click",".deleteScriptOnClick",function(){var a=$(this).attr("data-scriptid");request("/game/"+gameId+"/script/"+a,"DELETE",JSON.stringify({})).then(function(){window.location.reload()})["catch"](function(a){warning(a.responseJSON.message)})});














