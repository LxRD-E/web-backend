"use strict";var groupdata=$("#metadata-for-group"),groupId=groupdata.attr("data-groupid");$(document).on("click","#update-group-status",function(a){a.preventDefault(),loading();var b=parseInt($("#group-status").val(),10);request("/staff/groups/"+groupId+"/status","PATCH",{status:b}).then(function(){success("This group's status has been updated.")})["catch"](function(a){warning(a.responseJSON.message)})});















