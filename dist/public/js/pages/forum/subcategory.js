"use strict";var forumData=$("#forumdata");// LMAOBRUH.com
function loadVerticalAlign(){$(".vertical-align-text").each(function(){var a=$(this).outerHeight(!0);a/=2,$(this).children().each(function(){$(this).css("padding-top",a+"px")})})}$(window).on("resize",function(){loadVerticalAlign()}),loadVerticalAlign(),$(".forumSubCategory").hide();var template=$(".forumSubCategory"),offset=parseInt(forumData.attr("data-page"));0===offset&&(offset=1);var offset=25*offset-25,isLoading=!1,preventForward=!1,currentPage=0;$(".pagination").css("opacity","0.5"),preventForward=!0;var cached_pages={};loadThreads();var loadThreadData=function(a){$(".pagination").css("opacity","1"),$(window).scrollTop(0);var b=Math.trunc(offset/25);b+=1;var c=Math.trunc(a.total/25)+1;c>b?(preventForward=!1,$("#nextPage").css("opacity","1")):(preventForward=!0,$("#nextPage").css("opacity","0.5")),1===b?$("#previousPage").css("opacity","0.5"):$("#previousPage").css("opacity","1"),window.history.replaceState(null,null,"/forum/"+forumData.attr("data-categoryid")+"?page="+b),$(".forumThreads").children().each(function(){$(this).remove()}),isLoading=!1;var d=[];a.threads.forEach(function(a){var b=template.clone().appendTo(".forumThreads");b.find("h6").each(function(b){0==b&&($(this).html("<a href=\"/users/"+a.userId+"/profile\"><span data-userid="+a.userId+"></span></a>"),d.push(a.userId)),1==b&&$(this).html(a.postCount-1),2==b&&($(this).addClass("update-timestamp"),$(this).attr("data-timestamp",a.latestReply),$(this).html(moment(a.latestReply).fromNow()))}),b.find("h5").html(a.title.escape()),b.find("a").first().attr("href","/forum/thread/"+a.threadId+"?page=1"),1===a.threadPinned&&b.find(".pinned").first().html("<i class=\"fas fa-thumbtack\"></i>"),b.show()}),setUserNames(d),$(".forumThreads").show()};function loadThreads(){if(!isLoading)return $(".forumThreads").children().each(function(){$(this).css("opacity","0.5")}),isLoading=!0,cached_pages[offset]?loadThreadData(cached_pages[offset]):void request("/forum/"+forumData.attr("data-categoryid")+"/threads?sort=desc&limit=25&offset="+offset,"GET").then(function(a){cached_pages[offset]=a,loadThreadData(a)})["catch"](function(a){console.log(a),$("#alert").show()})}/**
 * Thread Creation System
 */ // Open modal
// Close modal
// Submit Thread
$("#nextPage").click(function(a){a.preventDefault();preventForward||($("#previousPage").removeAttr("disabled"),offset+=25,loadThreads())}),$("#previousPage").click(function(a){return a.preventDefault(),offset-=25,0>offset?void(offset=0):void($("#previousPage").attr("disabled","disabled"),loadThreads())}),setInterval(function(){$(".update-timestamp").each(function(){var a=$(this).attr("data-timestamp"),b=moment(a).fromNow();$(this).html(b)})},6e4),$(document).on("click","#createThread",function(){return isNaN(parseInt($("#userdata").attr("data-userid")))?void(window.location.href="/login"):void($("#threadCreationModal").hide(),$("#threadCreationModal").fadeIn(250).css("display","none").slideDown(250).dequeue())}),$(document).on("click","#closeThreadCreate",function(){$("#threadCreationModal").fadeOut(100).slideUp(250).dequeue(),setTimeout(function(){$("#threadTitle").val("",""),$("#threadBody").val("","")},100)}),$(document).on("click","#createThreadClick",function(){var a=$("#threadTitle").val();if(64<a.length||3>a.length)return void warning("Your title must be at least 3 characters, and at most 64 characters.");var b=$("#threadBody").val();if(4096<b.length||10>b.length)return void warning("Your body must be at least 10 characters, and at most 4096 characters.");$("#createThreadClick").attr("disabled","disabled"),$("#closeThreadCreate").attr("disabled","disabled"),$("#threadTitle").attr("disabled","disabled"),$("#threadBody").attr("disabled","disabled");var c=parseInt($("#threadSubCategory").val()),d=parseInt($("#threadLocked").val()),e=parseInt($("#threadPinned").val());(isNaN(d)||isNaN(e))&&(d=0,e=0),request("/forum/thread/create","PUT",JSON.stringify({title:a,body:b,subCategoryId:c,locked:d,pinned:e})).then(function(a){window.location.href="/forum/thread/"+a.threadId+"?page=1"})["catch"](function(a){warning(a.responseJSON.message),$("#createThreadClick").removeAttr("disabled"),$("#closeThreadCreate").removeAttr("disabled"),$("#threadTitle").removeAttr("disabled"),$("#threadBody").removeAttr("disabled")})});



































