"use strict";function loadVerticalAlign(){$(".vertical-align-text").each(function(){var a=$(this).outerHeight(!0);a/=3,$(this).children().each(function(){$(this).css("padding-top",a+"px")})})}$(window).on("resize",function(){loadVerticalAlign()}),loadVerticalAlign(),$(".forumSubCategory").hide();var template=$(".forumSubCategory");request("/forum/subcategories","GET").then(function(a){var b=[];a.forEach(function(a){var c=template.clone().appendTo(".forumcategories");c.find("h6").each(function(c){0==c&&$(this).html(number_format(a.threadCount)),1==c&&$(this).html(number_format(a.postCount)),2==c&&(a.latestPost&&a.latestPost.threadId!==void 0?($(this).html("<a href=\"/forum/thread/"+a.latestPost.threadId+"\">"+moment(a.latestPost.dateCreated).fromNow()+"</a><br>By <a href=\"/users/"+a.latestPost.userId+"/profile\"><span data-userid="+a.latestPost.userId+"></span></a>"),b.push(a.latestPost.userId)):$(this).html("N/A"))}),c.find("h5").html(a.title.escape()),c.find("p").html(a.description.escape()),c.find("a").first().attr("href","/forum/"+a.subCategoryId+"?page=1"),c.show(),setUserNames(b)}),$(".forumcategories").show(),$("#forumpreloader").hide()})["catch"](function(){void 0,$("#alert").show()}),$(document).on("click","#searchForumPostClick",function(){var a=$("#searchForForumInput").val();window.location.href="/forum/search?q="+a});










