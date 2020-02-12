"use strict";var groupdata=$("#groupdata"),groupid=groupdata.attr("data-groupid");window.membersOffset=0,window.history.replaceState(null,null,"/groups/"+groupid+"/"+groupdata.attr("data-encoded-name")+"/manage"),request("/group/"+groupid+"/shout","GET").then(function(a){$("#newShoutValue").attr("placeholder",a.shout.escape())})["catch"](function(){}),$(document).on("click","#updateShoutClick",function(){var a=$("#newShoutValue").val();request("/group/"+groupid+"/shout","PATCH",JSON.stringify({shout:a})).then(function(){success("Your group shout has been posted.")})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click","#updateIconClick",function(){function a(c){$.ajax({type:"PATCH",enctype:"multipart/form-data",url:"/api/v1/group/"+groupid+"/icon",headers:{"x-csrf-token":c},data:b,processData:!1,contentType:!1,cache:!1,timeout:6e5,success:function(a){function b(){return a.apply(this,arguments)}return b.toString=function(){return a.toString()},b}(function(){success("The group's icon has been updated.")}),error:function error(b){if(403===b.status){var c=b.getResponseHeader("x-csrf-token");if("undefined"!=typeof c)return a(c)}else b.responseJSON&&b.responseJSON.message?warning(b.responseJSON.message):warning("An unknown error has occured. Try reloading the page, and trying again.")}})}var b=new FormData;if("undefined"!=typeof $("#textureFile")[0].files[0])b.append("png",$("#textureFile")[0].files[0]);else return void warning("A Group Logo is required. Please select one, and try again");a("")}),$(document).on("click","#transferOwnerClick",function(){var a=$("#newOwnerValue").val();request("/user/username?username="+a,"GET").then(function(a){request("/user/"+a.userId+"/groups/"+groupid+"/role","GET").then(function(b){return 0===b.rank?warning("This user doesn't seem to be in this group"):void questionYesNo("Are you sure you'd like to transfer group ownership to "+a.username.escape()+"?",function(){request("/group/"+groupid+"/transfer","PATCH",JSON.stringify({userId:a.userId})).then(function(){success("Group ownership has been transferred.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message)})})})["catch"](function(){warning("This user doesn't seem to be in this group")})})["catch"](function(){warning("This user doesn't seem to exist!")})}),$(document).on("click","#spendGroupFunds",function(){var a=$("#payoutUsername").val(),b=parseInt($("#amountOfFunds").val());if(!b)return warning("Please enter a valid amount.");var c=parseInt($("#currencyType").val());request("/user/username?username="+a,"GET").then(function(a){request("/user/"+a.userId+"/groups/"+groupid+"/role","GET").then(function(d){return 0===d.rank?warning("This user doesn't seem to be in this group"):void questionYesNoHtml("Are you sure you'd like to payout "+formatCurrency(c)+" "+b+" to "+a.username.escape()+"?",function(){request("/group/"+groupid+"/payout","PUT",JSON.stringify({userId:a.userId,amount:b,currency:c})).then(function(){success("This user has been paid out.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message)})})})["catch"](function(){warning("This user doesn't seem to be in this group")})})["catch"](function(){warning("This user doesn't seem to exist!")})}),$(document).on("click","#updateGroupDescription",function(){var a=$("#groupDescriptionText").val();request("/group/"+groupid+"/description","PATCH",JSON.stringify({description:a})).then(function(){success("Your group description has been updated.")})["catch"](function(a){warning(a.responseJSON.message)})});function getGroupRoleManageHtml(a){var b=!1;"create"===a.type&&(b=!0);var c="",d="",e="",f="",g="",h=a.permissions;h||(h={}),0===h.getWall&&(c="selected=\"selected\""),0===h.postWall&&(d="selected=\"selected\""),0===h.getShout&&(e="selected=\"selected\""),0===h.postShout&&(f="selected=\"selected\""),0===h.manage&&(g="selected=\"selected\""),$("#groupRolesOptionsDisplay").empty(),$("#groupRolesOptionsDisplay").html("\n<div class=\"col-6\">\n                                                    <small class=\"form-text text-muted\">Role Name</small>\n                                                    <input type=\"text\" class=\"form-control\" id=\"newRoleName\" placeholder=\"\" value=\""+a.name.escape()+"\">\n                                                </div>\n                                                <div class=\"col-6\">\n                                                    <small class=\"form-text text-muted\">Role Value (between 1-254)</small>\n                                                    <input type=\"text\" class=\"form-control\" id=\"newRoleValue\" placeholder=\"\" value=\""+a.rank+"\">\n                                                </div>\n                                                <div class=\"col-12\">\n                                                    <small class=\"form-text text-muted\">Role Description</small>\n                                                    <input type=\"text\" class=\"form-control\" id=\"newRoleDescription\" placeholder=\"\" value=\""+a.description.escape()+"\">\n                                                </div>\n                                                <div class=\"col-6 col-md-4\">\n                                                    <small class=\"form-text text-muted\">View Group Wall</small>\n                                                    <select class=\"form-control\" id=\"getGroupWall\">\n                                                        <option value=\"1\">Yes</option>\n                                                        <option value=\"0\" "+c+">No</option>\n                                                    </select>\n                                                </div>\n                                                <div class=\"col-6 col-md-4\">\n                                                    <small class=\"form-text text-muted\">Post to Group Wall</small>\n                                                    <select class=\"form-control\" id=\"postGroupWall\">\n                                                        <option value=\"1\">Yes</option>\n                                                        <option value=\"0\" "+d+">No</option>\n                                                    </select>\n                                                </div>\n                                                <div class=\"col-6 col-md-4\">\n                                                    <small class=\"form-text text-muted\">View Shout</small>\n                                                    <select class=\"form-control\" id=\"getShout\">\n                                                        <option value=\"1\">Yes</option>\n                                                        <option value=\"0\" "+e+">No</option>\n                                                    </select>\n                                                </div>\n                                                <div class=\"col-6 col-md-4\">\n                                                    <small class=\"form-text text-muted\">Update Shout</small>\n                                                    <select class=\"form-control\" id=\"postShout\">\n                                                        <option value=\"1\">Yes</option>\n                                                        <option value=\"0\" "+f+">No</option>\n                                                    </select>\n                                                </div>\n                                                <div class=\"col-6 col-md-4\">\n                                                    <small class=\"form-text text-muted\">Manage Group</small>\n                                                    <select class=\"form-control\" id=\"manageGroup\">\n                                                        <option value=\"1\">Yes</option>\n                                                        <option value=\"0\" "+g+">No</option>\n                                                    </select>\n                                                </div>\n                                                <div class=\"col-6 col-md-4\">\n                                                    <small class=\"form-text text-muted\">Submit</small>\n                                                    <button type=\"button\" class=\"btn btn-small btn-success\" id=\"updateRoleset\" data-create=\""+b+"\" style=\"margin:0 auto;display: block;\" data-id="+a.roleSetId+">Submit</button>\n                                                </div>\n")}request("/group/"+groupid+"/roles","GET").then(function(a){var b=!1;window.roles=a;var c=!0;a.forEach(function(a){0!==a.rank&&($("#groupRolesSelection").append("<option value="+a.roleSetId+">"+a.name.escape()+"</option>"),!b&&(loadMembers(a.roleSetId),b=!0),$("#groupRoleManageSelection").append("<option value="+a.roleSetId+">"+a.name.escape()+"</option>"),c&&(c=!1,getGroupRoleManageHtml(a)))}),17>=a.length&&$("#groupRoleManageSelection").append("<option value=\"create\">Create New</option>")})["catch"](function(){void 0,$("#noMembersDisplay").show()}),$(document).on("click","#updateRoleset",function(){var a=$(this).attr("data-id"),b=JSON.stringify({name:$("#newRoleName").val(),rank:parseInt($("#newRoleValue").val()),description:$("#newRoleDescription").val(),permissions:{getWall:parseInt($("#getGroupWall").val()),postWall:parseInt($("#postGroupWall").val()),getShout:parseInt($("#getShout").val()),postShout:parseInt($("#postShout").val()),manage:parseInt($("#manageGroup").val())}}),c=$(this).attr("data-create");"false"===c?request("/group/"+groupid+"/role/"+a,"PATCH",b).then(function(){toast(!0,"This role has been updated.")})["catch"](function(a){void 0,toast(!1,a.responseJSON.message)}):request("/group/"+groupid+"/role","PUT",b).then(function(){success("This role has been created.",function(){window.location.reload()})})["catch"](function(a){void 0,toast(!1,a.responseJSON.message)})}),$("#groupRoleManageSelection").change(function(){var a=$(this).val();"create"===a?getGroupRoleManageHtml({type:"create",name:"New Role",description:"New Role",rank:1}):(a=parseInt(a),window.roles.forEach(function(b){b.roleSetId===a&&getGroupRoleManageHtml(b)}))}),$("#groupRolesSelection").change(function(){window.membersOffset=0;var a=parseInt($(this).val());loadMembers(a),$("#hasMembersDisplay").empty()}),$(document).on("change",".rankUser",function(){var a=parseInt($(this).val()),b=$(this);request("/group/"+groupid+"/member/"+$(this).attr("data-userid"),"PATCH",JSON.stringify({role:a})).then(function(){toast(!0,"This user has been ranked."),b.parent().remove()})["catch"](function(a){toast(!1,a.responseJSON.message)})});function loadMembers(a){window.curId=a,$("#noMembersDisplay").hide(),$("#hasMembersDisplay").hide(),request("/group/"+groupid+"/members/"+a+"?sort=desc&offset="+window.membersOffset+"&limit=12","GET").then(function(a){0===a.total?$("#noMembersDisplay").show():$("#hasMembersDisplay").show(),$("#hasMembersDisplay").empty();var b=[];a.members.forEach(function(a){var c="";window.roles.forEach(function(b){0!==b.rank&&(b.roleSetId===a.roleSetId?c+="<option selected=\"selected\" value="+b.roleSetId+">"+b.name.escape()+"</option>":c+="<option value="+b.roleSetId+">"+b.name.escape()+"</option>")}),$("#hasMembersDisplay").append("<div class=\"col-4 col-md-3 col-lg-2\"><a href=\"/users/"+a.userId+"/profile\"><img data-userid=\""+a.userId+"\" style=\"width:100%;\" /><p class=\"text-center text-truncate\" data-userid=\""+a.userId+"\"></p></a><select data-userid=\""+a.userId+"\" class=\"form-control rankUser\">"+c+"</select></div>"),b.push(a.userId)}),setUserThumbs(b),setUserNames(b),0===window.membersOffset?$("#loadLessMembers").hide():$("#loadLessMembers").show(),12<=a.total-window.membersOffset?$("#loadMoreMembers").show():$("#loadMoreMembers").hide()})["catch"](function(){window.membersOffset=0,$("#noMembersDisplay").show()})}$(document).on("click","#loadMoreMembers",function(){window.membersOffset+=12,loadMembers(window.curId)}),$(document).on("click","#loadLessMembers",function(){window.membersOffset-=12,loadMembers(window.curId)});























