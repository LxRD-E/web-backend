"use strict";$(document).on("click","#createGroupClick",function(){var a=new FormData;if("undefined"!=typeof $("#textureFile")[0].files[0])a.append("png",$("#textureFile")[0].files[0]);else return void warning("A Group Logo is required. Please select one, and try again");return"undefined"==typeof $("#groupName").val()||null===$("#groupName").val()||""===$("#groupName").val()?void warning("Please enter a name, then try again."):void(a.append("name",$("#groupName").val()),a.append("description",$("#groupDescription").val()),makeAsset(a,"fetch"))});function makeAsset(a,b){$.ajax({type:"POST",enctype:"multipart/form-data",url:"/api/v1/group/create",headers:{"x-csrf-token":b},data:a,processData:!1,contentType:!1,cache:!1,timeout:6e5,success:function success(a){a.id&&(window.location.href="/groups/"+a.id+"/")},error:function error(b){if(403===b.status){var c=b.getResponseHeader("x-csrf-token");if("undefined"!=typeof c)return makeAsset(a,c)}else b.responseJSON&&b.responseJSON.message?warning(b.responseJSON.message):warning("An unknown error has occured. Try reloading the page, and trying again.")}})}














