"use strict";$(document).on("click","#createReply",function(){var a=$("#replyBody").val(),b=$("#forumdata").attr("data-threadid");request("/forum/thread/"+b+"/reply","PUT",JSON.stringify({body:a})).then(function(){window.location.href="/forum/thread/"+b+"?page=1"})["catch"](function(a){void 0,warning(a.responseJSON.message)})});




