"use strict";$(document).on("click","#editAssetClick",function(){var a=parseInt($("#assetCurrency").val()),b=parseInt($("#assetPrice").val()),c=$("#assetName").val(),d=$("#assetDescription").val(),e=$("#assetStock").val(),f=parseInt($("#isForSale").val()),g=parseInt($("#moderation").val());isNaN(g)&&(g=0),null!==e&&(e=parseInt(e));var h=$("#assetIsCollectible").val();null!==h&&(h=parseInt(h),null!==e&&0!==e&&!1===isNaN(e)&&(h=1)),void 0,request("/catalog/"+$("#catalogdata").attr("data-id")+"/info","PATCH",JSON.stringify({name:c,description:d,price:b,currency:a,stock:e,collectible:h,isForSale:f,moderation:g})).then(function(){success("This item has been updated!",function(){window.location.href="/catalog/"+$("#catalogdata").attr("data-id")})})["catch"](function(a){void 0,a.responseJSON.message||(a.responseJSON.message="This item count not be updated. Please try again."),warning(a.responseJSON.message)})}),$(document).on("click","#updateAssetTexturesClick",function(){var a=new FormData;"undefined"!=typeof $("#objFile")[0].files[0]&&a.append("obj",$("#objFile")[0].files[0]),"undefined"!=typeof $("#mtlFile")[0].files[0]&&a.append("mtl",$("#mtlFile")[0].files[0]),"undefined"!=typeof $("#textureFile")[0].files[0]&&a.append("png",$("#textureFile")[0].files[0]),updateAssetFiles(a,"fetch")});function updateAssetFiles(a,b){$.ajax({type:"PATCH",enctype:"multipart/form-data",url:"/api/v1/catalog/"+$("#catalogdata").attr("data-id")+"/files",headers:{"x-csrf-token":b},data:a,processData:!1,contentType:!1,cache:!1,timeout:6e5,success:function success(a){a.id&&(window.location.href="/catalog/"+a.id+"/")},error:function error(b){if(403===b.status){var c=b.getResponseHeader("x-csrf-token");if("undefined"!=typeof c)return updateAssetFiles(a,c)}else warning(b.responseJSON.message)}})}














