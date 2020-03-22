"use strict";function _toConsumableArray(a){return _arrayWithoutHoles(a)||_iterableToArray(a)||_nonIterableSpread()}function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance")}function _iterableToArray(a){if(Symbol.iterator in Object(a)||"[object Arguments]"===Object.prototype.toString.call(a))return Array.from(a)}function _arrayWithoutHoles(a){if(Array.isArray(a)){for(var b=0,c=Array(a.length);b<a.length;b++)c[b]=a[b];return c}}$("#newStatusValue").css("overflow-y","hidden").autogrow({vertical:!0,horizontal:!1}),$(document).on("click","#updateStatusClick",function(a){a.preventDefault(),$("#newStatusValue").attr("disabled","disabled");var b=$("#newStatusValue").val();""!==b&&1<=b.length&&255>=b.length?request("/feed/status","PATCH",JSON.stringify({status:b})).then(function(a){$("#newStatusValue").val(""),$("#newStatusValue").removeAttr("disabled"),success("Success! Your status has been updated.");var c={statusId:a.statusId,didReactWithHeart:!1,heartReactionCount:0,commentCount:0,status:b,userId:userId},d="\n                    <div class=\"col text-center add-reaction\" data-id=\"".concat(c.statusId,"\">\n                        <p style=\"font-size:0.85rem;\"><i class=\"far fa-heart\"></i> Heart</p>\n                    </div>");c.didReactWithHeart&&(d="\n                        <div class=\"col text-center remove-reaction\" data-id=\"".concat(c.statusId,"\">\n                            <p style=\"font-size:0.85rem;color:red;\"><i class=\"fas fa-heart\"></i> Unheart</p>\n                        </div>"));var e=moment(c.date).format("MMMM Do YYYY, h:mm a"),f="\n                    \n                    <p style=\"font-size:0.65rem;text-align:center;\"><i class=\"fas fa-heart\"></i> <span class=\"formated-total-reactions\" data-count=\"".concat(c.heartReactionCount,"\" data-id=\"").concat(c.statusId,"\">0 Hearts</span></p>");if(0!==c.heartReactionCount){var i="Heart";1<c.heartReactionCount&&(i="Hearts"),f="\n                        \n                        <p style=\"font-size:0.65rem;text-align:center;\"><i class=\"fas fa-heart\"></i> <span class=\"formated-total-reactions\" data-count=\"".concat(c.heartReactionCount,"\" data-id=\"").concat(c.statusId,"\">").concat(number_format(c.heartReactionCount)," ").concat(i,"</span></p>\n                        \n                        ")}var g="\n                    \n                    <p style=\"font-size:0.65rem;text-align:center;\" class=\"add-comment\" data-id=\"".concat(c.statusId,"\">\n                        <span class=\"formated-total-comments\" data-count=\"").concat(c.commentCount,"\" data-id=\"").concat(c.statusId,"\">").concat(c.commentCount,"</span> Comment\n                    </p>\n                    \n                    ");(0===c.commentCount||1<c.commentCount)&&(g="\n                    \n                        <p style=\"font-size:0.65rem;text-align:center;\" class=\"add-comment\" data-id=\"".concat(c.statusId,"\">\n                            <span class=\"formated-total-comments\" data-count=\"").concat(c.commentCount,"\" data-id=\"").concat(c.statusId,"\">").concat(number_format(c.commentCount),"</span> Comments\n                        </p>\n                        \n                        "));var h="\n                    <div class=\"col-12\">\n                        <div class=\"row\">\n                            <div class=\"col-12\">\n                                <hr style=\"margin-top:0;\" />\n                            </div>\n                            <div style=\"\" class=\"col-4 col-lg-2\">\n                                <img style=\"width:100%;display:block;margin:0 auto;\" data-userid=\"".concat(c.userId,"\" src=\"").concat(window.subsitutionimageurl,"\" />\n                            </div>\n                            <div class=\"col-8 col-lg-10\" style=\"padding-left: 0;\">\n                                <div class=\"row\">\n                                    <div class=\"col-12\">\n                                        <h6 class=\"text-left\" style=\"margin-bottom: 0;\">\n                                            <a class=\"normal\" href=\"/users/").concat(c.userId,"/profile\">\n                                                <span data-userid=\"").concat(c.userId,"\"></span>\n                                            </a>\n                                            <span style=\"font-size:0.65rem;font-weight:400;opacity:1;cursor:pointer;\" title=\"").concat(e,"\">\n                                                ( ").concat(moment(c.date).fromNow()," )\n                                            </span>\n                                        </h6>\n                                    </div>\n                                </div>\n                                <div class=\"col-12\" style=\"padding-left:0;padding-right:0;\">\n                                    <p style=\"font-size:0.8rem;white-space:pre-wrap;\">").concat(xss(c.status),"</p>\n                                </div>\n                            </div>\n                            <div class=\"col-12\" style=\"margin-top:0.5rem;\">\n                                <div class=\"row\">\n                                    <div class=\"col-6 col-md-4\">\n                                        ").concat(f,"\n                                    </div>\n                                    <div class=\"col-6 col-md-4\">\n                                        ").concat(g,"\n                                    </div>\n                                    <div class=\"col-12 col-md-4\">\n                                        <a class=\"normal\" href=\"/report-abuse/user-status/").concat(c.statusId,"\">\n                                            <p style=\"font-size:0.65rem;text-align:center;\">\n                                                <i class=\"fas fa-flag\"></i> Report Abuse\n                                            </p>\n                                        </a>\n                                    </div>\n                                </div>\n                            </div>\n                            <div class=\"col-12\">\n                                <hr style=\"margin-bottom:0;\" />\n                            </div>\n                            <div class=\"col-12\" style=\"margin-bottom:0;\">\n                                <div class=\"row\">\n                                    ").concat(d,"\n                                    <div class=\"col text-center add-comment\" data-id=\"").concat(c.statusId,"\">\n                                        <p style=\"font-size:0.85rem;\"><i class=\"far fa-comments\"></i> Comment</p>\n                                    </div>\n                                </div>\n                                <div class=\"row comments-area\" data-id=\"").concat(c.statusId,"\">\n\n                                </div>\n                            </div>\n                        </div>\n                    </div>");$("#userFeedDiv").prepend(h),setUserThumbs([userId]),setUserNames([userId])})["catch"](function(a){void 0,$("#newStatusValue").removeAttr("disabled"),warning(a.responseJSON.message)}):($("#newStatusValue").removeAttr("disabled"),warning("Error: Your status must be between 1 and 255 characters. Please try again."))}),request("/notifications/count","GET").then(function(a){$("#user-notifications-mobile").html(number_format(a.count))}),$(function(){function a(a){$("#feedLoader").show(),d=!0,request("/feed/friends?limit=10&offset="+a,"GET").then(function(b){d=!1,0===a&&$("#userFeedDiv").empty(),f+=10;var c=[],g=[];b.forEach(function(a){var b="";a.status.match(/https:\/\/[a-zA-Z\d-]+\./g)&&(g.push(a.statusId),b="\n                        <div class=\"col-12 og-meta-info\" data-id=\"".concat(a.statusId,"\">\n                            <div class=\"spinner-border text-success\" role=\"status\" style=\"margin:1rem auto 1rem auto;display: block;\"></div>\n                        </div>"));var d="\n                    <div class=\"col text-center add-reaction\" data-id=\"".concat(a.statusId,"\">\n                        <p style=\"font-size:0.85rem;\"><i class=\"far fa-heart\"></i> Heart</p>\n                    </div>");a.didReactWithHeart&&(d="\n                        <div class=\"col text-center remove-reaction\" data-id=\"".concat(a.statusId,"\">\n                            <p style=\"font-size:0.85rem;color:red;\"><i class=\"fas fa-heart\"></i> Unheart</p>\n                        </div>")),c.push(a.userId);var e=moment(a.date).format("MMMM Do YYYY, h:mm a"),f="\n                    \n                    <p style=\"font-size:0.65rem;text-align:center;\"><i class=\"fas fa-heart\"></i> <span class=\"formated-total-reactions\" data-count=\"".concat(a.heartReactionCount,"\" data-id=\"").concat(a.statusId,"\">0 Hearts</span></p>");if(0!==a.heartReactionCount){var j="Heart";1<a.heartReactionCount&&(j="Hearts"),f="\n                        \n                        <p style=\"font-size:0.65rem;text-align:center;\"><i class=\"fas fa-heart\"></i> <span class=\"formated-total-reactions\" data-count=\"".concat(a.heartReactionCount,"\" data-id=\"").concat(a.statusId,"\">").concat(number_format(a.heartReactionCount)," ").concat(j,"</span></p>\n                        \n                        ")}var h="\n                    \n                    <p style=\"font-size:0.65rem;text-align:center;\" class=\"add-comment\" data-id=\"".concat(a.statusId,"\">\n                        <span class=\"formated-total-comments\" data-count=\"").concat(a.commentCount,"\" data-id=\"").concat(a.statusId,"\">").concat(a.commentCount,"</span> Comment\n                    </p>\n                    \n                    ");(0===a.commentCount||1<a.commentCount)&&(h="\n                    \n                        <p style=\"font-size:0.65rem;text-align:center;\" class=\"add-comment\" data-id=\"".concat(a.statusId,"\">\n                            <span class=\"formated-total-comments\" data-count=\"").concat(a.commentCount,"\" data-id=\"").concat(a.statusId,"\">").concat(number_format(a.commentCount),"</span> Comments\n                        </p>\n                        \n                        "));var i="\n                    <div class=\"col-12\">\n                        <div class=\"row\">\n                            <div class=\"col-12\">\n                                <hr style=\"margin-top:0;\" />\n                            </div>\n                            <div style=\"\" class=\"col-4 col-lg-2\">\n                                <img style=\"width:100%;display:block;margin:0 auto;\" data-userid=\"".concat(a.userId,"\" src=\"").concat(window.subsitutionimageurl,"\" />\n                            </div>\n                            <div class=\"col-8 col-lg-10\" style=\"padding-left: 0;\">\n                                <div class=\"row\">\n                                    <div class=\"col-12\">\n                                        <h6 class=\"text-left\" style=\"margin-bottom: 0;\">\n                                            <a class=\"normal\" href=\"/users/").concat(a.userId,"/profile\">\n                                                <span data-userid=\"").concat(a.userId,"\"></span>\n                                            </a>\n                                            <span style=\"font-size:0.65rem;font-weight:400;opacity:1;cursor:pointer;\" title=\"").concat(e,"\" class=\"format-date-interval-fromnow\" data-original-date=\"").concat(xss(a.date),"\">\n                                                ( ").concat(moment(a.date).fromNow()," )\n                                            </span>\n                                        </h6>\n                                    </div>\n                                </div>\n                                <div class=\"col-12\" style=\"padding-left:0;padding-right:0;\">\n                                    <p style=\"font-size:0.8rem;white-space:pre-wrap;\" class=\"user-status-linkify\">").concat(xss(a.status),"</p>\n                                </div>\n\n                            </div>\n                            ").concat(b,"\n                            <div class=\"col-12\" style=\"margin-top:0.5rem;\">\n                                <div class=\"row\">\n                                    <div class=\"col-6 col-md-4\">\n                                        ").concat(f,"\n                                    </div>\n                                    <div class=\"col-6 col-md-4\">\n                                        ").concat(h,"\n                                    </div>\n                                    <div class=\"col-12 col-md-4\">\n                                        <a class=\"normal\" href=\"/report-abuse/user-status/").concat(a.statusId,"\">\n                                            <p style=\"font-size:0.65rem;text-align:center;\">\n                                                <i class=\"fas fa-flag\"></i> Report Abuse\n                                            </p>\n                                        </a>\n                                    </div>\n                                </div>\n                            </div>\n                            <div class=\"col-12\">\n                                <hr style=\"margin-bottom:0;\" />\n                            </div>\n                            <div class=\"col-12\" style=\"margin-bottom:0;\">\n                                <div class=\"row\">\n                                    ").concat(d,"\n                                    <div class=\"col text-center add-comment\" data-id=\"").concat(a.statusId,"\">\n                                        <p style=\"font-size:0.85rem;\"><i class=\"far fa-comments\"></i> Comment</p>\n                                    </div>\n                                </div>\n                                <div class=\"row comments-area\" data-id=\"").concat(a.statusId,"\">\n\n                                </div>\n                            </div>\n                        </div>\n                    </div>");$("#userFeedDiv").append(i)}),$(".user-status-linkify").linkify({target:"_blank",attributes:{rel:"noopener nofollow"}}),void 0,0<g.length&&request("/feed/friends/multi-get-og-info?ids="+g.join(","),"GET").then(function(a){var b={},c=!0,d=!1,e=void 0;try{for(var f,h,i=a[Symbol.iterator]();!(c=(f=i.next()).done);c=!0)h=f.value,$("div.og-meta-info[data-id=\""+h.statusId+"\"]").empty()}catch(a){d=!0,e=a}finally{try{c||null==i["return"]||i["return"]()}finally{if(d)throw e}}var j=!0,k=!1,l=void 0;try{for(var m,n,o=a[Symbol.iterator]();!(j=(m=o.next()).done);j=!0){n=m.value,b[n.statusId]=!0;var p="",q="";n.ogInfo&&n.ogInfo&&n.ogInfo.thumbnailUrl&&(p="\n                                <img src=\"".concat(n.ogInfo.thumbnailUrl,"\" style=\"width:100%;height:auto;display:block;margin:0 auto;\" class=\"zoom-on-hover\" />\n                                "),q="padding-top:5px;"),$("div.og-meta-info[data-id=\""+n.statusId+"\"]").append("\n                            \n                            <div class=\"row\" style=\"margin-top:1rem;\">\n                                <div class=\"col-12\">\n                                    <a class=\"normal\" href=\"".concat(xss(n.url),"\" rel=\"nofollow noopener\" target=\"_blank\">\n                                        <div class=\"card og-tags-card\" style=\"background-color:rgba(0,0,0,0.05);\">\n                                            ").concat(p,"\n                                            <div class=\"card-body\" style=\"").concat(q,"\">\n                                                <p style=\"font-size:0.7rem;\" class=\"text-truncate\">").concat(xss(n.url),"</p>\n                                                <h1 style=\"font-size:0.75rem;\" class=\"text-truncate\">").concat(xss(n.ogInfo.title),"</h1>\n                                                <p style=\"font-size:0.7rem;\" class=\"text-truncate\">").concat(xss(n.ogInfo.description),"</p>\n                                            </div>\n                                        </div>\n                                    </a>\n                                </div>\n                            </div>\n                            \n                            "))}}catch(a){k=!0,l=a}finally{try{j||null==o["return"]||o["return"]()}finally{if(k)throw l}}var r=!0,s=!1,t=void 0;try{for(var u,v,w=g[Symbol.iterator]();!(r=(u=w.next()).done);r=!0)v=u.value,b[v]||$("div.og-meta-info[data-id=\""+v+"\"]").remove()}catch(a){s=!0,t=a}finally{try{r||null==w["return"]||w["return"]()}finally{if(s)throw t}}})["catch"](function(){var a=!0,b=!1,c=void 0;try{for(var d,e,f=g[Symbol.iterator]();!(a=(d=f.next()).done);a=!0)e=d.value,$("div.og-meta-info[data-id=\""+e+":]").remove()}catch(a){b=!0,c=a}finally{try{a||null==f["return"]||f["return"]()}finally{if(b)throw c}}}),setUserThumbs(c),setUserNames(c),0<b.length?$("#feedLoader").show():(e=!1,$("#feedLoader").hide()),0===b.length&&0===a&&(e=!1,$("#userFeedDiv").append("<div class=\"col-12\">Your feed is empty. Make some friends!</div>"))})["catch"](function(b){d=!1,e=!1,0===a&&$("#userFeedDiv").append("<div class=\"col-12\">"+b.responseJSON.message+"</div>")})}function b(a){$("#feedLoader").show(),d=!0,request("/feed/groups?limit=10&offset="+a,"GET").then(function(b){d=!1,0===a&&$("#userFeedDiv").empty(),f+=10;var c=[],g=[];b.forEach(function(a){g.push(a.thumbnailCatalogId),c.push(a.groupId);var b=moment(a.date).format("MMMM Do YYYY, h:mm a");$("#userFeedDiv").append("<div class=\"col-sm-12\"><hr /></div><div style=\"\" class=\"col-4 col-lg-2\"><img style=\"width:100%;display:block;margin:0 auto;\" data-catalogid=\""+a.thumbnailCatalogId+"\" src=\""+window.subsitutionimageurl+"\" /></div><div class=\"col-8 col-lg-10\" style=\"padding-left: 0;\"><div class=\"row\"><div class=\"col-12\"><h6 class=\"text-left\" style=\"margin-bottom: 0;\"><a style=\"color:#212529;\" href=\"/groups/"+a.groupId+"/--\"><span data-groupid=\""+a.groupId+"\"></span></a> <span style=\"font-size:0.65rem;font-weight:400;opacity:1;cursor:pointer;\" title=\""+b+"\">("+moment(a.date).fromNow()+")</span></h6></div><div class=\"col-12\"></div><div class=\"col-12 col-sm-9 col-lg-10\"><p style=\"font-size:0.85rem;\">"+xss(a.shout)+"</p></div></div></div>")}),setGroupThumbs(g),setGroupNames(c),0<b.length?$("#feedLoader").show():(e=!1,$("#feedLoader").hide()),0===b.length&&0===a&&(e=!1,$("#userFeedDiv").append("<div class=\"col-12\">Your feed is empty. Make some friends!</div>"))})["catch"](function(b){d=!1,e=!1,void 0,0===a&&($("#userFeedDiv").empty(),$("#userFeedDiv").append("<div class=\"col-12\">"+b.responseJSON.message+"</div>"))})}request("/user/"+userId+"/info","GET").then(function(a){null!==a.user_status&&""!==a.user_status&&$("#newStatusValue").attr("placeholder",a.user_status.escape())})["catch"](function(){}),request("/user/"+userId+"/friends?limit=5","GET").then(function(a){$("#userFriendsCountDiv").empty(),$("#userFriendsDiv").empty(),$("#userFriendsCountDiv").append("<p>"+a.total+"</p>");var b=[];$(a.friends).each(function(a,c){4>=a&&(null===c.UserStatus&&(c.UserStatus="..."),b.push(c.userId),$("#userFriendsDiv").append("<div class=\"row\"><div class=\"col-6 col-sm-3 text-center\" ><img src=\""+window.subsitutionimageurl+"\" data-userid=\""+c.userId+"\" class=\"card-img-top\"></div><div class=\"col text-left\"><a class=\"font-weight-bold normal\" href=\"/users/"+c.userId+"/profile\"><span data-userid=\""+c.userId+"\"></span></a><p style=\"font-size:0.75rem;\">&quot;"+xss(c.UserStatus)+"&quot;</p></div></div>"))}),4<a.friends.length&&$("#userFriendsDiv").append("<div class=\"row\" style=\"margin-top:1rem;\"><div class=\"col-sm-12 text-left\"><a href=\"/users/"+userId+"/friends\">See All</a></div></div>"),setUserThumbs(b),setUserNames(b),$("#myFriendsCount").html("("+a.total+")"),0===a.total&&($("#userFriendsDiv").append("You do not have any friends."),$("#userFriendsDiv").css("padding-top","0"))})["catch"](function(){void 0,$("#userFriendsCountDiv").empty(),$("#userFriendsDiv").empty(),$("#userFriendsDiv").append("You do not have any friends."),$("#userFriendsDiv").css("padding-top","0"),$("#userFriendsCountDiv").append("<p>0</p>")});var c="friends",d=!1,e=!0,f=0;$(window).scroll(function(){d||!e||$(window).scrollTop()+$(window).height()>$(document).height()-$("div#footerUpper").innerHeight()&&("friends"===c?a(f):"groups"==c&&b(f))}),$("#use-feed-friends").click(function(){d||"friends"===c||(e=!0,c="friends",f=0,$(this).removeClass("btn-outline-success").addClass("btn-success"),$("#use-feed-groups").removeClass("btn-success").addClass("btn-outline-success"),$("#userFeedDiv").empty(),a(0))}),$("#use-feed-groups").click(function(){d||"groups"===c||(e=!0,c="groups",f=0,$(this).removeClass("btn-outline-success").addClass("btn-success"),$("#use-feed-friends").removeClass("btn-success").addClass("btn-outline-success"),$("#userFeedDiv").empty(),b(0))}),$(document).on("click",".add-reaction",function(){var a=this;if(!$(this).parent().attr("data-react-disabled")){var b=$(this).attr("data-id");$(this).parent().attr("data-react-disabled","true");var c=$(this).parent().prepend("\n        <div class=\"col text-center remove-reaction\" data-id=\"".concat(b,"\">\n            <p style=\"font-size:0.85rem;color:red;\"><i class=\"fas fa-heart\"></i> Unheart</p>\n        </div>")),d=$("span.formated-total-reactions[data-id="+b+"]"),e=parseInt(d.attr("data-count")),f=e+1;1<f||0===f?d.html(number_format(f)+" Hearts"):d.html(number_format(f)+" Heart"),d.attr("data-count",f);var g=$("span.formated-total-reactions[data-id=\""+b+"\"]").attr("data-original-title");g&&("Nobody"===g?(g=xss(username),$("span.formated-total-reactions[data-id=\""+b+"\"]").attr("data-original-title",g)):(g=xss(username)+"<br>"+g,(""===g||0===f)&&(g="Nobody"),$("span.formated-total-reactions[data-id=\""+b+"\"]").attr("data-original-title",g))),request("/feed/friends/"+b+"/react","POST",{reactionType:"heart"}).then(function(){c.removeAttr("data-react-disabled")})["catch"](function(){toast(!1,"Oops, let's try that again."),$(a).parent().prepend("\n            <div class=\"col text-center add-reaction\" data-id=\"".concat(b,"\">\n                <p style=\"font-size:0.85rem;\"><i class=\"far fa-heart\"></i> Heart</p>\n            </div>"))}),$(this).remove()}}),$(document).on("click",".remove-reaction",function(){var a=this;if(!$(this).parent().attr("data-react-disabled")){var b=$(this).attr("data-id");$(this).parent().attr("data-react-disabled","true");var c=$(this).parent().prepend("\n        <div class=\"col text-center add-reaction\" data-id=\"".concat(b,"\">\n            <p style=\"font-size:0.85rem;\"><i class=\"far fa-heart\"></i> Heart</p>\n        </div>")),d=$("span.formated-total-reactions[data-id="+b+"]"),e=parseInt(d.attr("data-count")),f=e-1;1<f||0===f?d.html(number_format(f)+" Hearts"):d.html(number_format(f)+" Heart");var g=$("span.formated-total-reactions[data-id=\""+b+"\"]").attr("data-original-title");g&&("Nobody"===g||(g=g.replace(username+"<br>",""),(""===g||0===f)&&(g="Nobody"),$("span.formated-total-reactions[data-id=\""+b+"\"]").attr("data-original-title",g))),d.attr("data-count",f),request("/feed/friends/"+b+"/react","DELETE",{reactionType:"heart"}).then(function(){c.removeAttr("data-react-disabled")})["catch"](function(){toast(!1,"Oops, let's try that again."),$(a).parent().prepend("\n            <div class=\"col text-center remove-reaction\" data-id=\"".concat(b,"\">\n                <p style=\"font-size:0.85rem;color:red;\"><i class=\"far fa-heart\"></i> Heart</p>\n            </div>"))}),$(this).remove()}});var g={},h={};$(document).on("click",".add-comment-to-status-submit",function(a){var b=this;a.preventDefault();var c=$(this).attr("data-id"),d=$("textarea.add-comment-to-status-textarea[data-id=\""+c+"\"]");d.attr("disabled","disabled"),$(this).attr("disabled","disabled");var e=d.val();request("/feed/friends/"+c+"/comment","POST",{comment:e}).then(function(){if(d.removeAttr("disabled"),d.val(""),$(b).removeAttr("disabled"),!0===g[c]){var a=$(".comments-area[data-id=\""+c+"\"]");a.append("\n                    \n                    <div class=\"col-12\">\n                        <div class=\"row\">\n                            <div class=\"col\" style=\"max-width:75px;padding-right:0;\">\n                                <img src=\"".concat(window.subsitutionimageurl,"\" style=\"width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;\" data-userid=\"").concat(userId,"\" />\n                            </div>\n                            <div class=\"col\">\n                                <a class=\"normal\" href=\"/users/").concat(userId,"/profile\">\n                                    <p style=\"font-weight:700;font-size:0.75rem;\">\n                                        <span data-userid=\"").concat(userId,"\"></span>\n                                    </p>\n                                </a>\n                                <p style=\"font-size:0.75rem;white-space: pre-line;font-weight:600;\">").concat(xss(e),"</p>\n                                <p style=\"font-size:0.65rem;opacity:0.75;font-weight:500;\">").concat(moment().fromNow(),"</p>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    ")),setUserThumbs([userId]),setUserNames([userId])}})["catch"](function(a){d.removeAttr("disabled","disabled"),$(b).removeAttr("disabled","disabled"),void 0,toast(!1,a.responseJSON.message)})}),$(document).on("click",".add-reply-to-comment-submit",function(a){var b=this;a.preventDefault();var c=$(this).attr("data-id"),d=$(this).attr("data-status-id");$(".add-reply-to-comment-textarea[data-id=\""+c+"\"]").attr("disabled","disabled");var e=$(".add-reply-to-comment-textarea[data-id=\""+c+"\"]").val();$(this).attr("disabled","disabled"),void 0,request("/feed/friends/"+d+"/comment/"+c+"/reply","POST",{reply:e}).then(function(){$(b).removeAttr("disabled"),$(".add-reply-to-comment-textarea[data-id=\""+c+"\"]").removeAttr("disabled").val(""),$(b).parent().parent().parent().parent().parent().append("\n                <div class=\"row\">\n                    <div class=\"col-10 offset-2\">\n                        <div class=\"row\">\n                        <div class=\"col\" style=\"max-width:75px;padding-right:0;\">\n                            <img src=\"".concat(window.subsitutionimageurl,"\" style=\"width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;\" data-userid=\"").concat(userId,"\" />\n                        </div>\n                        <div class=\"col\">\n                            <a class=\"normal\" href=\"/users/").concat(userId,"/profile\">\n                                <p style=\"font-weight:700;font-size:0.75rem;\">\n                                    <span data-userid=\"").concat(userId,"\"></span>\n                                </p>\n                            </a>\n                            <p style=\"font-size:0.75rem;white-space: pre-line;font-weight:600;\">").concat(xss(e),"</p>\n                            <p style=\"font-size:0.65rem;opacity:0.75;font-weight:500;\">").concat(moment().fromNow(),"</p>\n                        </div>\n                        </div>\n                        </div>\n                </div>")),setUserThumbs([userId]),setUserNames([userId])})["catch"](function(a){void 0,$(b).removeAttr("disabled"),$(".add-reply-to-comment-textarea[data-id=\""+c+"\"]").removeAttr("disabled"),warning(a.responseJSON.message)})});var i={};$(document).on("click",".reply-to-comment",function(a){var b=this;a.preventDefault();var c=$(this).attr("data-id"),d=$(this).attr("data-status-id");return i[c]?void 0:$(this).attr("data-replybox-loaded")?($(this).removeAttr("data-replybox-loaded"),$(".add-reply-container[data-id=\""+c+"\"]").remove(),void $(".reply-to-comment[data-commentid=\""+c+"\"]").remove()):void(i[c]=!0,$(this).attr("data-replybox-loaded","true"),$(this).parent().parent().parent().append("\n        <div class=\"row add-reply-container\" data-id=\"".concat(c,"\" style=\"margin-top:0.5rem;\">\n            <div class=\"col-12 col-md-10 offset-md-2\">\n                <div class=\"row\">\n                    <div class=\"col\">\n                        <div class=\"form-group\">\n                                <textarea class=\"form-control add-reply-to-comment-textarea\" data-id=\"").concat(c,"\" rows=\"3\" placeholder=\"Write a comment...\" style=\"font-size:0.75rem;\"></textarea>\n                            </div>\n                        </div>\n                        <div class=\"col\" style=\"padding-left:0;max-width:75px;\">\n                            <button type=\"button\" class=\"btn btn-small btn-success add-reply-to-comment-submit\" style=\"margin:0 auto;display: block;font-size:0.85rem;\" data-id=\"").concat(c,"\" data-status-id=\"").concat(d,"\">Post</button>\n                        </div>\n                    </div>\n                </div>\n                </div>\n        </div>")),request("/feed/friends/"+d+"/comment/"+c+"/replies?limit=25").then(function(a){i[c]=!1;var d=[],e=!0,f=!1,g=void 0;try{for(var h,j,k=a[Symbol.iterator]();!(e=(h=k.next()).done);e=!0)j=h.value,$(b).parent().parent().parent().append("\n                <div class=\"row reply-to-comment\" data-commentid=\"".concat(c,"\">\n                    <div class=\"col-10 offset-2\">\n                        <div class=\"row\">\n                        <div class=\"col\" style=\"max-width:75px;padding-right:0;\">\n                            <img src=\"").concat(window.subsitutionimageurl,"\" style=\"width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;\" data-userid=\"").concat(j.userId,"\" />\n                        </div>\n                        <div class=\"col\">\n                            <a class=\"normal\" href=\"/users/").concat(j.userId,"/profile\">\n                                <p style=\"font-weight:700;font-size:0.75rem;\">\n                                    <span data-userid=\"").concat(j.userId,"\"></span>\n                                </p>\n                            </a>\n                            <p style=\"font-size:0.75rem;white-space: pre-line;font-weight:600;\">").concat(xss(j.comment),"</p>\n                            <p style=\"font-size:0.65rem;opacity:0.75;font-weight:500;\">").concat(moment(j.createdAt).fromNow(),"</p>\n                        </div>\n                        </div>\n                        </div>\n                </div>")),d.push(j.userId)}catch(a){f=!0,g=a}finally{try{e||null==k["return"]||k["return"]()}finally{if(f)throw g}}setUserNames(d),setUserThumbs(d)})["catch"](function(){i[c]=!1,void 0}))}),$(document).on("click",".add-comment",function(a){void 0,a.preventDefault();var b=$(this).attr("data-id");if(!h[b]){h[b]=!0;var c=$(".comments-area[data-id=\""+b+"\"]");!0===g[b]?(g[b]=!1,h[b]=!1,c.empty(),$(this).removeAttr("data-loading-comments")):(g[b]=!0,c.append("<div class=\"col-12\" style=\"margin-top:1rem;margin-bottom:1rem;\"><div class=\"spinner-border text-success\" role=\"status\" style=\"display:block;margin:0 auto;\"></div>"),request("/feed/friends/"+b+"/comments?limit=25","GET").then(function(a){c.empty(),c.append("\n                    \n                    <div class=\"col-12\">\n                        <div class=\"row\">\n                            <div class=\"col\" style=\"max-width:75px;padding-right:0;\">\n                                <img src=\"".concat(window.subsitutionimageurl,"\" style=\"width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;\" data-userid=\"").concat(userId,"\" />\n                            </div>\n                            <div class=\"col\">\n                                <div class=\"form-group\">\n                                    <textarea class=\"form-control add-comment-to-status-textarea\" data-id=\"").concat(b,"\" rows=\"3\" placeholder=\"Write a comment...\" style=\"font-size:0.75rem;\"></textarea>\n                                </div>\n                            </div>\n                            <div class=\"col\" style=\"padding-left:0;max-width:75px;\">\n                                <button type=\"button\" class=\"btn btn-small btn-success add-comment-to-status-submit\" style=\"margin:0 auto;display: block;font-size:0.85rem;\" data-id=\"").concat(b,"\">Post</button>\n                            </div>\n                        </div>\n                    </div>\n                    \n                ")),setUserThumbs([userId]);var d=[],e=!0,f=!1,g=void 0;try{for(var h,i,j=a[Symbol.iterator]();!(e=(h=j.next()).done);e=!0)i=h.value,d.push(i.userId),c.append("\n                    \n                    <div class=\"col-12\">\n                        <div class=\"row\">\n                            <div class=\"col\" style=\"max-width:75px;padding-right:0;\">\n                                <img src=\"".concat(window.subsitutionimageurl,"\" style=\"width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;\" data-userid=\"").concat(i.userId,"\" />\n                            </div>\n                            <div class=\"col\">\n                                <a class=\"normal\" href=\"/users/").concat(i.userId,"/profile\">\n                                    <p style=\"font-weight:700;font-size:0.75rem;\">\n                                        <span data-userid=\"").concat(i.userId,"\"></span>\n                                    </p>\n                                </a>\n                                <p style=\"font-size:0.75rem;white-space: pre-line;font-weight:600;\">").concat(xss(i.comment),"</p>\n                                <p style=\"font-size:0.65rem;opacity:0.75;font-weight:500;\">").concat(moment(i.createdAt).fromNow()," (").concat(number_format(i.replyCount)," replies)</p>\n                                <p style=\"font-size:0.65rem;font-weight:500;\" class=\"reply-to-comment\" data-id=\"").concat(i.userStatusCommentId,"\" data-status-id=\"").concat(i.statusId,"\"><i class=\"fas fa-reply\"></i> Reply</p>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    "))}catch(a){f=!0,g=a}finally{try{e||null==j["return"]||j["return"]()}finally{if(f)throw g}}c.append("<div class=\"col-12\" style=\"margin-bottom:1rem;\"></div>"),setUserNames(d),setUserThumbs(d)})["catch"](function(){c.empty(),toast(!1,"Uh-oh, could you try that again?"),g[b]=!1})["finally"](function(){h[b]=!1}))}});var j={},k={};$(document).on("mouseenter",".formated-total-reactions",function(a){var b=this;a.preventDefault();var c=$(this).attr("data-id");if(k[c])k[c];j[c]||($(this).attr("title","Loading..."),$(this).attr("data-html","true"),$(this).tooltip("show"),j[c]=!0,request("/feed/friends/"+c+"/reactions","GET").then(function(a){var c=[],d=!0,e=!1,f=void 0;try{for(var g,h,i=a[Symbol.iterator]();!(d=(g=i.next()).done);d=!0)h=g.value,c.push(h.userId)}catch(a){e=!0,f=a}finally{try{d||null==i["return"]||i["return"]()}finally{if(e)throw f}}if(0===a.length){$(b).tooltip("hide");var k=function(){$(b).off("hidden.bs.tooltip")};return $(b).on("hidden.bs.tooltip",function(){$(this).tooltip("show"),k()}),$(b).attr("title","Nobody"),void $(b).attr("data-original-title","Nobody")}var j="";request("/user/names?ids="+_toConsumableArray(new Set(c)).join(",")).then(function(a){var c=!0,d=!1,e=void 0;try{for(var f,g,h=a[Symbol.iterator]();!(c=(f=h.next()).done);c=!0)g=f.value,j+=g.username+"<br>"}catch(a){d=!0,e=a}finally{try{c||null==h["return"]||h["return"]()}finally{if(d)throw e}}25<=a.length?j+="and others.":j=j.slice(0,j.length-4),$(b).attr("title",j),$(b).attr("data-original-title",j),$(b).tooltip("hide");var i=function(){$(b).off("hidden.bs.tooltip")};$(b).on("hidden.bs.tooltip",function(){$(this).tooltip("show"),i()})})}),void 0)}),$(document).on("mouseleave",".formated-total-reactions",function(a){a.preventDefault()}),a(0),setInterval(function(){$(".format-date-interval-fromnow").each(function(){var a=$(this).attr("data-original-date");a&&$(this).html("( "+moment(a).fromNow()+" )")})},1e3)});