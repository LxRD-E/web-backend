"use strict";$("#deleteUserBlurb").click(function(){request("/staff/user/"+$("#userId").val()+"/blurb","DELETE").then(function(){success("This user's blurb has been deleted."),$("#userblurb").val("[ Content Deleted ]")})["catch"](function(a){warning(a.responseJSON.message)})}),$("#deleteUserStatus").click(function(){request("/staff/user/"+$("#userId").val()+"/status","DELETE").then(function(){success("This user's status has been deleted."),$("#userstatus").val("[ Content Deleted ]")})["catch"](function(a){warning(a.responseJSON.message)})}),$("#deleteUserForumSignature").click(function(){request("/staff/user/"+$("#userId").val()+"/forum/signature","DELETE").then(function(){success("This user's forum signature has been deleted."),$("#userforumsignature").val("[ Content Deleted ]")})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click","#sendStaffComment",function(){var a=$("#staffCommentText").val();request("/staff/user/"+$("#userId").val()+"/comment","POST",JSON.stringify({comment:a})).then(function(){window.location.reload()})["catch"](function(a){warning(a.responseJSON.message)})}),request("/staff/user/"+$("#userId").val()+"/associated-accounts").then(function(a){var b=function(a){return 1===a?"Same IP Address":void 0},c=[],d=!0,e=!1,f=void 0;try{for(var g,h,i=a.accounts[Symbol.iterator]();!(d=(g=i.next()).done);d=!0)h=g.value,c.push(h.userId),$("#associatedAccountsArray").append("\n        <div class=\"row\" style=\"padding-top:1rem;\">\n            <div class=\"col-12\">\n                <p>Username: <a href=\"/staff/user/profile?userId=".concat(h.userId,"\"><span data-userid=\"").concat(h.userId,"\">N/A</span></a></p>\n                <p>Reason: ").concat(b(h.reason),"</p>\n                <hr />\n            </div>\n        </div>"))}catch(a){e=!0,f=a}finally{try{d||null==i["return"]||i["return"]()}finally{if(e)throw f}}setUserNames(c)})["catch"](function(){$("#associatedAccountsArray").html("<p>There was an error loading the accounts. Try again later.</p>")});var commentsLoading=!1,areThereMoreComments=!1,getComments=function(a){commentsLoading||(commentsLoading=!0,request("/staff/user/"+$("#userId").val()+"/comments?offset="+a).then(function(b){var c=[];0===b.comments.length&&0===a&&$("#staffComments").append("\n            <div class=\"col-12\">\n                <p>This user does not have any comments</p>\n            </div>\n            "),25<=b.comments.length&&(areThereMoreComments=!0);var d=!0,e=!1,f=void 0;try{for(var g,h,i=b.comments[Symbol.iterator]();!(d=(g=i.next()).done);d=!0)h=g.value,c.push(h.staffUserId),$("#staffComments").append("\n            <div class=\"col-12\" style=\"padding-top:0.5rem;\">\n                <div class=\"row\">\n                    <div class=\"col-2\">\n                        <img data-userid=\"".concat(h.staffUserId,"\" style=\"width:100%;max-width:150px;margin:0 auto;display: block;\" />\n                        <p class=\"text-center\">\n                            <span data-userid=\"").concat(h.staffUserId,"\" style=\"font-weight:600;\"></span>\n                        </p>\n                        <p class=\"text-center\">\n                            <span>").concat(moment(h.dateCreated).format("DD MMM YYYY"),"</span>\n                        </p>\n                    </div>\n                    <div class=\"col-10\">\n                        <p>").concat(h.comment.escapeAllowFormattingBasic(),"</p>\n                    </div>\n                </div>\n            </div>\n            "))}catch(a){e=!0,f=a}finally{try{d||null==i["return"]||i["return"]()}finally{if(e)throw f}}commentsLoading=!1,setUserThumbs(c),setUserNames(c)})["catch"](function(){void 0,commentsLoading=!1}))};getComments(0);

































