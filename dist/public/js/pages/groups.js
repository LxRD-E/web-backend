"use strict";var groupid=parseInt($("#groupdata").attr("data-groupid"));$(document).on("click","#groupLeave",function(){function a(){request("/group/"+groupid+"/membership","DELETE").then(function(){success("You have left this group.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message,function(){window.location.reload()})})}parseInt($("#groupdata").attr("data-groupowner"))===parseInt(userId)?questionYesNo("Are you sure you would like to abbandon this group?",function(){a()}):a()}),"true"===$("#userdata").attr("data-authenticated")?request("/user/"+$("#userdata").attr("data-userid")+"/groups","GET").then(function(a){$("#groupDisplayCol").attr("class","col-12 col-lg-8"),$("#UserGroupsDiv").show(),$("#groupDisplayCol").show();var b=[];a.groups.forEach(function(a){b.push(a.groupIconCatalogId),$("#myGroups").append("<div class=\"row\" style=\"margin-bottom:0.75rem;margin-top:0.75;\"><div class=\"col-12 col-md-4\" style=\"padding-right:0;\"><img style=\"width:100%;border-radius:25%;\" data-catalogid=\""+a.groupIconCatalogId+"\" /></div><div class=\"col-6 col-md-8\" style=\"padding-left:0.5rem;\"><p class=\"text-truncate\" style=\"font-size:0.85rem;padding-left:0;\"><a href=\"/groups/"+a.groupId+"/"+urlencode(a.groupName)+"\">"+a.groupName.escape()+"</a></p></div></div>")}),setCatalogThumbs(b)})["catch"](function(a){console.log(a),$("#UserGroupsDiv").attr("style","display:none !important;"),$("#groupDisplayCol").attr("class","col-12 col-lg-10"),$("#groupDisplayCol").show()}):($("#UserGroupsDiv").hide(),$("#groupDisplayCol").attr("class","col-12 col-lg-10"),$("#groupDisplayCol").show());var loadGoup=function(){function a(){window.wallLoading=!0,request("/group/"+groupid+"/wall?offset="+window.wallOffset+"&sort=desc").then(function(a){0===window.wallOffset&&$("#hasGroupWallPostsDisplay").show();var b=[];a.forEach(function(a){b.push(a.userId);var c="style=\"width:100%;padding-top:0.15rem;padding-bottom:0.15rem;font-size:0.75rem;margin-top:0.5rem;\"";window.managegroup||(c="style=\"display:none;width:100%;margin-top:0.5rem;padding-top:0.15rem;padding-bottom:0.15rem;font-size:0.75rem;\""),a.wallPost||(a.wallPost=""),$("#hasGroupWallPostsDisplay").append("<div class=\"row\"><div style=\"\" class=\"col-6 col-sm-3 col-lg-2\"><img style=\"width:100%;\" data-userid=\""+a.userId+"\"><a class=\"normal\" href=\"/users/"+a.userId+"/profile\"><h6 class=\"text-center text-truncate\" data-userid=\""+a.userId+"\" style=\"font-size:0.75rem;font-weight:600;\"></h6></a><button type=\"button\" class=\"btn btn-outline-success deletePost\" data-id=\""+a.wallPostId+"\" "+c+">Delete</button></div><div class=\"col-6 col-sm-9 col-lg-10\"><p style=\"font-size:0.85rem;white-space: pre-wrap;font-weight:500;\">"+xss(a.wallPost)+"</p><p class=\"text-left text-truncate\" style=\"font-size: 0.75rem;font-weight:600;opacity:0.45;\">"+moment(a.date).fromNow()+"</p></div><div class=\"col-12\"><hr /></div></div>")}),setUserThumbs(b),setUserNames(b),25<=a.length?window.wallOffset+=25:window.wallOffset=0,window.wallLoading=!1})["catch"](function(){0===window.wallOffset&&$("#noGroupWallPostsDisplay").show()})}function b(a){0===window.memberOffset&&($("#noMembersDisplay").hide(),$("#hasMembersDisplay").hide()),request("/group/"+groupid+"/members/"+a+"?sort=desc&offset="+window.memberOffset+"&limit=12","GET").then(function(a){$("#hasMembersDisplay").empty(),0===a.total?$("#noMembersDisplay").show():$("#hasMembersDisplay").show();var b=[];a.members.forEach(function(a){$("#hasMembersDisplay").append("<div class=\"col-4 col-md-3 col-lg-2\"><a class=\"normal\" href=\"/users/"+a.userId+"/profile\"><img data-userid=\""+a.userId+"\" style=\"width:100%;\" /><p class=\"text-truncate text-center\" data-userid=\""+a.userId+"\" style=\"font-size:0.75rem;\"></p></a></div>"),b.push(a.userId)}),setUserThumbs(b),setUserNames(b),0===window.memberOffset?$("#loadLessMembers").hide():$("#loadLessMembers").show(),12<=a.total-window.memberOffset?$("#loadMoreMembers").show():$("#loadMoreMembers").hide()})["catch"](function(){0===window.memberOffset?$("#noMembersDisplay").show():$("#hasMembersDisplay").show()})}function c(a,b){if(!0!==b&&$("#catalogItemsDiv").empty(),$("#catalogItemsDiv").each(function(){$(this).css("opacity","1")}),!a||0>=a.length)$("#catalogItemsDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">This group does not have any items.</h5></div>");else{var c=[];$.each(a,function(a,b){b.currency=formatCurrency(b.currency),$("#catalogItemsDiv").append("<div class=\"col-6 col-sm-4 col-md-4 col-lg-3 catalogItem\" data-catalogid=\""+b.catalogId+"\"><div class=\"card\" style=\"margin: 1rem 0 0 0;border: 0;box-shadow:none;\"><a href=\"/catalog/"+b.catalogId+"/"+urlencode(b.catalogName)+"\"><img data-catalogid=\""+b.catalogId+"\" style=\"width:100%;\" /></a> <div class=\"card-body\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;\"><a href=\"/catalog/"+b.catalogId+"/"+urlencode(b.catalogName)+"\">"+b.catalogName+"</a><p class=\"text-left text-truncate\">"+b.currency+nform(b.price)+"</p></div></div></div></div>"),c.push(b.catalogId)}),$("[data-toggle=\"tooltip\"]").tooltip(),setCatalogThumbs(c)}a&&25<=a.length?$(".loadMoreItems").css("display","block"):$(".loadMoreItems").hide()}window.memberOffset=0,window.wallLoading=!1,window.wallOffset=0,setUserNames([parseInt($("#groupdata").attr("data-groupowner"))]),window.history.replaceState(null,null,"/groups/"+$("#groupdata").attr("data-groupid")+"/"+$("#groupdata").attr("data-encoded-name")+"/");var d=parseInt($("#memberCountSpan").attr("data-membercount"));$("#memberCountSpan").html(bigNum2Small(d)),$("#aboutCategory").click(function(){$("#aboutSection").show(),$("#relationsSection").hide(),$("#catalogSection").hide()}),$("#relationsCategory").click(function(){$("#relationsSection").show(),$("#aboutSection").hide(),$("#catalogSection").hide()}),$("#catalogCategory").click(function(){$("#relationsSection").hide(),$("#aboutSection").hide(),$("#catalogSection").show()}),$(document).on("click","#groupJoin",function(){"true"===$("#userdata").attr("data-authenticated")?request("/group/"+groupid+"/membership","PUT").then(function(a){a.doesUserRequireApproval?success("You have requested to join this group. This group requires members to be approved by an admin.",function(){window.location.reload()}):success("You have joined this group.",function(){window.location.reload()})})["catch"](function(a){console.log(a),warning(a.responseJSON.message,function(){window.location.reload()})}):window.location.href="/login?return=/groups/"+groupid+"/"}),$(document).on("click","#claimOwnership",function(a){a.preventDefault(),"true"===$("#userdata").attr("data-authenticated")?request("/group/"+groupid+"/claim","PUT").then(function(){success("You have claimed ownership of this group.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message,function(){window.location.reload()})}):window.location.href="/login?return=/groups/"+groupid+"/"}),$(window).on("scroll",function(){$(window).scrollTop()+$(window).height()>$(document).height()-$("div#footerUpper").innerHeight()&&25<=window.wallOffset&&!1===window.wallLoading&&window.managegroup!==void 0&&a()}),$(document).on("click",".deletePost",function(){var a=parseInt($(this).attr("data-id")),b=$(this).parent().parent();request("/group/"+groupid+"/wall/"+a+"/","DELETE").then(function(){success("This wall post has been deleted."),b.remove()})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click","#submitGroupWallText",function(){var b=$("#groupWallText").val();b=b.replace(/\s+/g," ").replace(/^\s|\s$/g,""),"undefined"!=typeof b||255<b.length||3>b.length?request("/group/"+groupid+"/wall","PUT",JSON.stringify({content:b})).then(function(){$("#groupWallText").val(""),window.wallLoading=!1,window.wallOffset=0,$("#hasGroupWallPostsDisplay").empty(),a(),success("Your group wall post has been created.")})["catch"](function(a){warning(a.responseJSON.message)}):warning("Group wall posts must be between 3 and 255 characters. Please try again.")}),request("/group/"+groupid+"/role","GET").then(function(b){0!==b.rank&&($("#authUserRank").html("Your Rank: "+b.name.escape()),0===parseInt($("#groupdata").attr("data-groupowner"))&&$("#claimOwnership").show());var c=b.permissions;c.postWall&&$("#postToGroupWall").append("\n                <div class=\"col-12\">\n                    <form>\n                        <div class=\"form-group\">\n                            <div class=\"row\" style=\"margin-bottom:1rem;\">\n                                <div class=\"col-sm-12\">\n                                    <textarea class=\"form-control\" id=\"groupWallText\" rows=\"3\" placeholder=\"Post to the Group Wall...\"></textarea>\n                                </div>\n                            </div>\n                            <div class=\"row\">\n                                <div class=\"col-sm-12\">\n                                    <button type=\"button\" id=\"submitGroupWallText\" class=\"btn btn-success\">Submit</button>\n                                </div>\n                            </div>\n                        </div>\n                    </form>\n                </div>"),c.getWall?($("#groupWallDiv").show(),window.wallOffset=0,a()):$("#groupWallDiv").hide(),0===b.rank?$("#groupJoin").show():1===c.manage?($("#groupManage").show(),$("#advertise").show(),$(".deletePost").show(),window.managegroup=!0,$("#createGroupItemButton").show(),$("#groupLeave").show()):$("#groupLeave").show(),c.getShout?request("/group/"+groupid+"/shout").then(function(a){return a&&a.userId?void($("#shoutDiv").show(),$("#groupShoutDisplayDiv").append("<div class=\"row\"><div class=\"col-4 col-sm-2\"><a class=\"normal\" href=\"/users/"+a.userid+"/profile\"><img data-userid=\""+a.userId+"\" style=\"width:100%;\" /></a></div><div class=\"col-8 col-sm-10\"><a class=\"normal\" href=\"/users/"+a.userId+"/profile\"><h5 data-userid=\""+a.userId+"\" style=\"margin-bottom:0;\"></h5></a><p style=\"font-weight: 500;font-size:0.75rem;\">"+xss(a.shout)+"</p> </div></div><div class=\"row\"><div class=\"col-12\"><p style=\"font-weight: 300;font-size: 0.75rem;font-weight:600;opacity:0.5;margin-top:0.5rem;\">"+moment(a.date).format("MMMM Do YYYY, h:mm a")+"</p></div></div>"),setUserThumbs([a.userId]),setUserNames([a.userId])):void $("#shoutDiv").hide()})["catch"](function(){$("#shoutDiv").hide()}):$("#shoutDiv").hide()})["catch"](function(){$("#alert").show()}),request("/group/"+groupid+"/roles","GET").then(function(a){var c=!1,d=0;a.forEach(function(a){0!==a.rank&&(d++,1===d&&(window.roleId=a.roleSetId),$("#groupRolesSelection").append("<option value="+a.roleSetId+">"+a.name.escape()+"</option>"),!c&&(b(a.roleSetId),c=!0))})})["catch"](function(){$("#alert").show(),$("#noMembersDisplay").show()}),$("#groupRolesSelection").change(function(){window.memberOffset=0;var a=parseInt($(this).val());window.roleId=a,b(a),$("#hasMembersDisplay").empty()}),$(document).on("click","#loadMoreMembers",function(){window.memberOffset+=12,b(window.roleId)}),$(document).on("click","#loadLessMembers",function(){window.memberOffset-=12,b(window.roleId)});request("/group/"+groupid+"/catalog?sort=desc&offset="+0,"GET").then(c)["catch"](function(a){console.log(a)}),c()},groupStatus=parseInt($("#groupdata").attr("data-status"),10);// setup page
1===groupStatus||"1"===groupStatus?request("/group/"+groupid+"/role","GET").then(function(a){0!==a.rank&&$("#groupLeave").show()})["catch"](function(a){console.error(a)}):loadGoup(),window.history.replaceState(null,null,"/groups/"+$("#groupdata").attr("data-groupid")+"/"+$("#groupdata").attr("data-encoded-name")+"/");






















