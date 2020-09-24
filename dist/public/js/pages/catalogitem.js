"use strict";function _typeof(a){return _typeof="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(a){return typeof a}:function(a){return a&&"function"==typeof Symbol&&a.constructor===Symbol&&a!==Symbol.prototype?"symbol":typeof a},_typeof(a)}window.commentsOffset=0,window.ownersOffset=0;var userData=$("#userdata"),catalogdata=$("#catalogdata"),catalogid=catalogdata.attr("data-id"),userid=$("#userdata").attr("data-userid");window.history.replaceState(null,null,catalogdata.attr("data-encoded-name")),request("/user/"+catalogdata.attr("data-creatoruserid")+"/info","GET").then(function(a){"1"===catalogdata.attr("data-creatortype")?request("/group/"+catalogdata.attr("data-creatorid")+"/info","GET").then(function(b){$("#createdByP").html("<span style=\"font-weight:600;\">Created By:</span> <a href=\"/users/"+catalogdata.attr("data-creatoruserid")+"/profile\">"+a.username+"</a> <a href=\"/groups/"+b.groupId+"/"+urlencode(b.groupName)+"/\">("+b.groupName.escape()+")</a>")})["catch"](function(){}):$("#createdByP").html("<span style=\"font-weight:600;\">Created By:</span> <a href=\"/users/"+catalogdata.attr("data-creatoruserid")+"/profile\">"+a.username+"</a>")})["catch"](function(a){console.log(a)}),$(".formatNumber").length&&$(".formatNumber").each(function(){var b=$(this);$(this).html(formatCurrency(parseInt(b.attr("data-currency")))+" "+nform(parseInt(b.attr("data-price"))))});// Check if Owns
var itemsUserOwns=[];if("true"===userData.attr("data-authenticated")?request("/user/"+userid+"/owns/"+catalogid).then(function(a){if(!("1"===catalogdata.attr("data-collectible")&&"0"===catalogdata.attr("data-isforsale")))"1"===catalogdata.attr("data-isforsale")&&0<_typeof(a.length)?($(".primaryPurchaseButton").attr("disabled","disabled"),$(".primaryPurchaseButton").html("You already own this item.")):0<a.length&&($(".primaryPurchaseButton").attr("disabled","disabled"),$(".primaryPurchaseButton").html("You already own this item."),$("#onClickDeleteItem").show());else if("undefined"!=typeof a[0]){var b=!0;$.each(a,function(a,c){0>=c.price&&itemsUserOwns.push(c),b&&0>=c.price&&($("#onClickSellitem").show(),$("#onClickSellitem").attr("uid",c.userInventoryId),b=!1)})}})["catch"](function(a){console.log(a)}):$("#commentOnCatalogItem").hide(),$("#itemPriceFirstParty").length){var currency=parseInt($("#itemPriceFirstParty").attr("data-currency")),amt=parseInt($("#itemPriceFirstParty").html());$("#itemPriceFirstParty").html(formatCurrency(currency)+nform(amt))}window.commentsLoading=!1,$(window).on("scroll",function(){window.innerHeight+window.scrollY>=document.body.offsetHeight&&25<=window.commentsOffset&&!1===window.commentsLoading&&(console.log("load comments"),loadComments())}),$(document).on("click","#submitCatalogComment",function(){var a=$("#catalogCommentText").val();6<=a.length&&499>=a.length?postComment(a):toast(!1,"Your comment must be between 5 and 500 characters.")});function postComment(a){window.commentsOffset=0;var b=grecaptcha.getResponse();request("/catalog/"+catalogid+"/comment","POST",JSON.stringify({comment:a,captcha:b})).then(function(a){console.log(a),$("#catalogCommentsContainer").empty(),loadComments(),toast(!0,"Your comment has been posted."),grecaptcha.reset()})["catch"](function(a){console.log(a),toast(!1,a.responseJSON.message),grecaptcha.reset()})}// Get Comments
loadComments();function loadComments(){window.commentsLoading=!0,request("/catalog/"+catalogid+"/comments?limit=25&offset="+window.commentsOffset,"GET").then(function(a){if(0>=a.length&&0===window.commentsOffset)$("#catalogCommentsContainer").append("<p style=\"white-space: pre-wrap; margin-bottom: 0px;\">Nobody has commented anything yet.</p>");else{var b=[];a.forEach(function(a){b.push(a.userId),(null===a.comment||"undefined"==typeof a.comment)&&(a.comment="");var c=moment(a.date).format("MMMM Do YYYY, h:mm a");$("#catalogCommentsContainer").append("<div class=\"row\"><div style=\"\" class=\"col-6 col-sm-3 col-lg-2\"><img style=\"width:100%;display: block;max-width: 100px;margin: 0 auto;\" data-userid=\""+a.userId+"\" /><a style=\"color:#212529;\" href=\"/users/"+a.userId+"/profile\"><h6 class=\"text-left\" data-userid=\""+a.userId+"\"></h6></a><p class=\"text-left\" style=\"font-size: small;\">"+c+"</p></div><div class=\"col-6 col-sm-9 col-lg-10\"><p>"+a.comment.escapeAllowFormattingBasic()+"</p></div></div><div class=\"row\"><div class=\"col-sm-12\"><hr /></div></div>")}),setUserThumbs(b),setUserNames(b),25<=a.length?window.commentsOffset+=25:window.commentsOffset=0}window.commentsLoading=!1})["catch"](function(a){console.log(a),$("#catalogCommentsContainer").append("<p style=\"white-space: pre-wrap; margin-bottom: 0px;\">Nobody has commented anything yet.</p>")})}// Load Recommended
loadRecommended();function loadRecommended(){window.commentsLoading=!0,request("/catalog/"+catalogid+"/recommended","GET").then(function(a){if(0>=a.length&&0===window.commentsOffset)$("#recommendedCatalogItems").append("<div class=\"col-12\"><p style=\"white-space: pre-wrap; margin-bottom: 0px;\">There are no recommendations based on this item.</p></div>");else{var b=[];a.forEach(function(a){b.push(a.catalogId);1===a.collectible?0===a.maxSales?$("#recommendedCatalogItems").append("<div style=\"\" class=\"col-6 col-md-4 col-lg-2\"><img style=\"width:100%;\" data-catalogid=\""+a.catalogId+"\" /><a style=\"color:#212529;\" href=\"/catalog/"+a.catalogId+"/\"><h6 class=\"text-center text-truncate\">"+a.catalogName.escape()+"</h6></a>"+"<p style=\"position:absolute;top:0\"><i class=\"gradient-fa fas fa-award\"></i></p>"+"</div></div>"):$("#recommendedCatalogItems").append("<div style=\"\" class=\"col-6 col-md-4 col-lg-2\"><img style=\"width:100%;\" data-catalogid=\""+a.catalogId+"\" /><a style=\"color:#212529;\" href=\"/catalog/"+a.catalogId+"/\"><h6 class=\"text-center text-truncate\">"+a.catalogName.escape()+"</h6></a>"+"<p style=\"position:absolute;top:0;margin:0.5rem;\"><i class=\"rainbow-fa fas fa-fingerprint\"></i></p>"+"</div></div>"):$("#recommendedCatalogItems").append("<div style=\"\" class=\"col-6 col-md-4 col-lg-2\"><img style=\"width:100%;\" data-catalogid=\""+a.catalogId+"\" /><a style=\"color:#212529;\" href=\"/catalog/"+a.catalogId+"/\"><h6 class=\"text-center text-truncate\">"+a.catalogName.escape()+"</h6></a></div></div>")}),setCatalogThumbs(b)}window.commentsLoading=!1})["catch"](function(a){console.log(a),$("#catalogCommentsContainer").append("<p style=\"white-space: pre-wrap; margin-bottom: 0px;\">Nobody has commented anything yet.</p>")})}// Load Owners
loadOwners();function loadOwners(){window.ownersLoading=!0,request("/catalog/"+catalogid+"/owners?sort=asc&limit=25&offset="+window.ownersOffset,"GET").then(function(a){if(0>=a.length&&0===window.ownersOffset)$("#catalogItemOwners").append("<div class=\"col-12\"><p style=\"white-space: pre-wrap; margin-bottom: 0px;\">This item does not have any owners.</p></div>");else{var b=[],c="";a.forEach(function(a){c=0==catalogdata.attr("data-isunique")?"":null===a.serial?"# N/A":"# "+a.serial,b.push(a.userId),$("#catalogItemOwners").append("<div style=\"\" class=\"col-6 col-md-4 col-lg-2\"><img style=\"width:100%;\" data-userid=\""+a.userId+"\" /><a style=\"color:#212529;\" href=\"/users/"+a.userId+"/profile\"><h6 class=\"text-center text-truncate\" data-userid=\""+a.userId+"\"></h6></a><p class=\"text-center text-truncate\">"+c+"</p></div></div>")}),setUserThumbs(b),setUserNames(b),25<=a.length?($("#loadMoreOwners").show(),window.ownersOffset+=25):($("#loadMoreOwners").hide(),window.ownersOffset=0)}window.ownersLoading=!1})["catch"](function(a){console.log(a),0===window.ownersOffset?$("#catalogItemOwners").append("<div class=\"col-12\"><p style=\"white-space: pre-wrap; margin-bottom: 0px;\">This item does not have any owners.</p></div>"):(window.ownersOffset=0,$("#loadMoreOwners").hide())})}$(document).on("click","#loadMoreOwners",function(){loadOwners()}),$(document).on("click","#regenThumb",function(){request("/catalog/"+catalogid+"/thumbnail/regenerate","PUT").then(function(){success("This item's thumbnail will be regenerated.")})["catch"](function(a){warning(a.responseJSON.message)})}),"1"===catalogdata.attr("data-collectible")&&"0"===catalogdata.attr("data-isforsale")&&(request("/catalog/"+catalogid+"/sellers?offset=0","GET").then(function(a){if(a=a.sellers,0>=a.length)$(".collectibleNotForSale").show();else{$("#collectibleLowestPriceButton").show(),$("#collectibleLowestPriceParent").show();var b=[];$.each(a,function(a,c){var d="#N/A";null!==c.serial&&(d="# "+nform(c.serial)),c.userId===parseInt(userid)?(0===a&&($("#collectibleLowestPrice").html(formatCurrency(1)+nform(c.price)),$(".onClickPurchaseItem").attr("disabled","disabled"),$(".onClickPurchaseItem").html("You're selling this item."),$(".onClickPurchaseItem").attr("data-sellerid",c.userId),$(".onClickPurchaseItem").attr("data-uid",c.userInventoryId)),$("#thirdPartySellersList").append("<div class=\"row\"><div class=\"col-12\"><hr /></div><div style=\"display:none;\" class=\"col-sm-3 align-self-center\" id=\"catalog_thirdparty_seller_"+a+"\"><img style=\"width:100%;display: block;margin: 0 auto;max-width: 75px;\" data-userid=\""+c.userId+"\" /><a style=\"color:#212529;\" href=\"/users/"+c.userId+"/profile\"><p class=\"text-center\" data-userid="+c.userId+"></p></a></div><div class=\"align-self-center col-sm-6\"><p>"+formatCurrency(1)+nform(c.price)+" </p><p><span style=\"font-weight:600;\">Serial - </span>"+d+"</p></div><div class=\"align-self-center col-sm-2\" style=\"margin: 0 auto;\"><button data-currency=\"1\" data-price=\""+c.price+"\" type=\"button\" class=\"btn btn-small btn-success onClickTakeOffSale\" data-sellerid=\""+c.userId+"\" data-catalogid=\""+catalogid+"\" data-uid=\""+c.userInventoryId+"\" style=\"margin:0 auto;display: block;width:100%;\">Take Off Sale</button></div></div>"),b.push(c.userId)):(0===a&&($("#collectibleLowestPrice").html(formatCurrency(1)+nform(c.price)),$(".onClickPurchaseItem").attr("data-sellerid",c.userId),$(".onClickPurchaseItem").attr("data-uid",c.userInventoryId),$(".onClickPurchaseItem").attr("data-currency",1),$(".onClickPurchaseItem").attr("data-price",c.price)),$("#thirdPartySellersList").append("<div class=\"row\"><div class=\"col-12\"><hr /></div><div style=\"display:none;\" class=\"col-sm-3 align-self-center\" id=\"catalog_thirdparty_seller_"+a+"\"><img style=\"width:100%;display: block;margin: 0 auto;max-width: 75px;\" data-userid=\""+c.userId+"\" /><a style=\"color:#212529;\" href=\"/users/"+c.userId+"/profile\"><p class=\"text-center\" data-userid="+c.userId+"></p></a></div><div class=\"align-self-center col-sm-6\"><p>"+formatCurrency(1)+nform(c.price)+" </p><p><span style=\"font-weight:600;\">Serial - </span>"+d+"</p></div><div class=\"align-self-center col-sm-2\" style=\"margin: 0 auto;\"><button data-currency=\"1\" data-price=\""+c.price+"\" type=\"button\" class=\"btn btn-small btn-success onClickPurchaseItem\" data-sellerid=\""+c.userId+"\" data-catalogid=\""+catalogid+"\" data-uid=\""+c.userInventoryId+"\" style=\"margin:0 auto;display: block;width:100%;\">Buy</button></div></div>"),b.push(c.userId))}),setUserThumbs(b),setUserNames(b)}})["catch"](function(){// No Sellers
$(".collectibleNotForSale").show()}),request("/catalog/"+catalogid+"/charts","GET").then(function(a){if(0<a.length){/*
                var chartArray = [];
                d.forEach(function(k,v) {
                    chartArray.push({
                        ["x"]: new Date(k["date"]),
                        ["y"]: k["amount"],
                    });
                });

                chartArray.push({
                    x: new Date(),
                    y: undefined,
                });
                */var b=[],c=[];a.forEach(function(a){b.push(a.amount),c.push(new Date(a.date).toISOString())});var d="#212529",e="light";1===getTheme()&&(d="#FFFFFF",e="dark");// makeChart(chartArray);
var f={series:[{name:"Sales Price",data:b}],chart:{height:350,type:"area",foreColor:d},dataLabels:{enabled:!1},stroke:{curve:"smooth"},xaxis:{type:"datetime",categories:c,foreColor:d},colors:["#7BD39A"],tooltip:{theme:e,x:{format:"dd/MM/yy HH:mm"}}},g=new ApexCharts(document.querySelector("#chartContainer"),f);g.render()}else $("#chartContainer").css("height","auto").append("<p style='margin-bottom:0;'>This item has not sold in the past 365 days.</p>")})["catch"](function(a){console.log(a)})),$(document).on("click","#onClickSellitem",function(){function a(a){question("What would you like to sell this item for?",function(b){isNaN(b)?warning("Please enter a valid price."):request("/user/market/"+a+"/","PATCH",JSON.stringify({price:parseInt(b)})).then(function(){success("This item was succesfully put on sale.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message),console.log(a)})})}var b={},c=!1;if(itemsUserOwns.forEach(function(a){null!==a.serial&&(c=!0),a.serial||(a.serial="N/A"),b[a.userInventoryId]=a.serial}),1>=itemsUserOwns.length&&(c=!1),c)question("What serial would you like to sell?",function(b){b&&a(parseInt(b))},"select",b);else{var d=parseInt($("#onClickSellitem").attr("uid"));a(d)}}),$(document).on("click",".onClickTakeOffSale",function(){var a=parseInt($(this).attr("data-uid")),b=$(this).attr("data-catalogid"),c=parseInt($(this).attr("data-sellerid"));request("/user/market/"+a+"/","PATCH",JSON.stringify({price:0})).then(function(){success("This item was succesfully taken off sale.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message),console.log(a)})}),$(document).on("click",".onClickPurchaseItem",function(){var a=parseInt($(this).attr("data-uid")),b=$(this).attr("data-catalogid"),c=parseInt($(this).attr("data-sellerid")),d=parseInt($(this).attr("data-currency")),e=parseInt($(this).attr("data-price"));"true"===userData.attr("data-authenticated")?questionYesNoHtml("Are you sure you'd like to purchase this item for "+formatCurrency(d)+" "+nform(e)+"?",function(){request("/economy/"+b+"/buy","POST",{userInventoryId:a,expectedSellerId:c,expectedCurrency:d,expectedPrice:e}).then(function(){success("This item was succesfully purchased.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message),console.log(a)})}):window.location.href="/login?return=/catalog/"+b});function makeChart(a){var b=new CanvasJS.Chart("chartContainer",{title:{},data:[{markerBorderColor:"#28a745",markerColor:"#28a745",dataSeries:"#28a745",color:"green",// Change type to "doughnut", "line", "splineArea", etc.
type:"line",dataPoints:a}],axisY:{prefix:"P $"}});b.render()}$(document).on("click","#onClickDeleteItem",function(){questionYesNoHtml("<p>Are you sure you would like to <span style=\"font-weight:700;\">permanently delete</span> this item from your inventory?</p> <p style=\"margin-top:1rem;font-size:0.75rem;text-align:center;\">You will not be refunded for your purchase.</p>",function(){loading(),request("/catalog/"+catalogid+"/inventory","DELETE",{}).then(function(){success("This item has been deleted from your inventory.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message)})}),$("button.swal2-confirm").attr("disabled","disabled"),setTimeout(function(){$("button.swal2-confirm").removeAttr("disabled")},1e3)});






























