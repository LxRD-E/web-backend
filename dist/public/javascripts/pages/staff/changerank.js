"use strict";$(document).on("click","#changeUserStaffRankClick",function(a){a.preventDefault();var b=parseInt($("#changeStaffRankOfUserSelect").val(),10);var c=parseInt($("#userId").val(),10);request("/staff/user/"+c+"/rank","PATCH",JSON.stringify({rank:b})).then(function(){success("This users rank has been updated.")})["catch"](function(a){warning(a.responseJSON.message)})});














