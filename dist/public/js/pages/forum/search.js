"use strict";var forumData=$("#forumdata");// LMAOBRUH.com
function loadVerticalAlign(){$(".vertical-align-text").each(function(){var a=$(this).outerHeight(!0);a/=2,$(this).children().each(function(){$(this).css("padding-top",a+"px")})})}$(window).on("resize",function(){loadVerticalAlign()}),loadVerticalAlign(),$(".forumSubCategory").hide();var template=$(".forumSubCategory"),offset=parseInt(forumData.attr("data-page"));(0===offset||isNaN(offset))&&(offset=1);var offset=25*offset-25,isLoading=!1,preventForward=!1,query=$(".query").attr("data-query");loadThreads(query);function loadThreads(a){isLoading||($(".forumThreads").children().each(function(){$(this).css("opacity","0.5")}),isLoading=!0,request("/forum/threads/search?q="+a+"&offset="+offset,"GET").then(function(b){$(window).scrollTop(0);var c=Math.trunc(offset/25);c+=1,window.history.replaceState(null,null,"/forum/search?page="+c+"&q="+a),$(".forumThreads").children().each(function(){$(this).remove()}),isLoading=!1;var d=[];b.forEach(function(a){var b=template.clone().appendTo(".forumThreads");b.find("h6").each(function(b){0==b&&($(this).html("<a href=\"/users/"+a.userId+"/profile\"><span data-userid="+a.userId+"></span></a>"),d.push(a.userId)),1==b&&$(this).html(a.postCount-1),2==b&&($(this).addClass("update-timestamp"),$(this).attr("data-timestamp",a.latestReply),$(this).html(moment(a.latestReply).fromNow()))}),b.find("h5").html(a.title.escape()),b.find("a").first().attr("href","/forum/thread/"+a.threadId+"?page=1"),1===a.threadPinned&&b.find(".pinned").first().html("<i class=\"fas fa-thumbtack\"></i> Pinned"),b.show()}),setUserNames(d),25>b.length&&(preventForward=!1),$(".forumThreads").show()})["catch"](function(a){console.log(a),$("#alert").show()}))}var currentPage=0;$("#nextPage").click(function(a){preventForward||(a.preventDefault(),$("#previousPage").removeAttr("disabled"),offset+=25,loadThreads(query))}),$("#previousPage").click(function(a){return a.preventDefault(),offset-=25,0>offset?void(offset=0):void($("#previousPage").attr("disabled","disabled"),loadThreads(query))}),setInterval(function(){$(".update-timestamp").each(function(){var a=$(this).attr("data-timestamp"),b=moment(a).fromNow();$(this).html(b)})},6e4),$(document).on("click","#searchForumPostClick",function(){query=$("#searchForForumInput").val(),loadThreads(query)});





















