"use strict";$(document).on("click","#banUser",function(){var a=$("#userId").val(),b=$("#reason").val(),c=parseInt($("#length").val());("undefined"==typeof c||null===c||isNaN(c))&&(c=0);var d=$("#lengthType").val(),e=parseInt($("#isTerminated").val()),f=parseInt($("#isDeleted").val()),g=$("#privateNotes").val();request("/staff/user/"+a+"/ban","POST",JSON.stringify({reason:b,privateReason:g,length:c,lengthType:d,terminated:e,deleted:f})).then(function(){success("This user has been banned.",function(){})})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click",".autofill-reason",function(a){switch(console.log("Click"),a.preventDefault(),parseInt($(this).attr("data-id"),10)){case 0:return $("#reason").val("Swearing is not allowed on our platform.");;case 1:return $("#reason").val("Harassment towards other users is expressly forbidden on our platform.");;case 2:return $("#reason").val("Dating on our Platform is against our terms of service.");;case 3:return $("#reason").val("Offsite links are not allowed on our platform");;case 4:return $("#reason").val("The image you uploaded is not appropiate for our platform. Please review our Terms of Service before uploading content");;case 5:return $("#reason").val("Scamming is a violation of our Terms of Service");;case 6:return $("#reason").val("Account Theft is a violation of our Terms of Service. Items and/or currency may have been removed from your account");;}});















