"use strict";var userData=$("#userdata"),userid=userData.attr("data-userid"),traderData=$("#tradedata"),traderId=traderData.attr("data-userid");getUserInventoryAndWriteToDisplay(userid,"you"),getUserInventoryAndWriteToDisplay(traderId,"partner");var uSelected=[];$(document).on("click",".addItemToTradeyou",function(){if("2px solid rgb(40, 167, 69)"===$(this).find(".card").css("border")){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)");for(var a=uSelected.length-1;0<=a;--a)uSelected[a].attr("data-uid")==$(this).attr("data-uid")&&uSelected.splice(a,1)}else 4<=uSelected.length?warning("You can only select up to 4 items, per person, to trade at once. Please remove an item, and try again."):($(this).find(".card").css("border","2px solid rgb(40, 167, 69)"),uSelected.push($(this)))});var partnerSelected=[];$(document).on("click",".addItemToTradepartner",function(){if("2px solid rgb(40, 167, 69)"===$(this).find(".card").css("border")){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)");for(var a=partnerSelected.length-1;0<=a;--a)partnerSelected[a].attr("data-uid")==$(this).attr("data-uid")&&partnerSelected.splice(a,1)}else 4<=partnerSelected.length?warning("You can only select up to 4 items, per person, to trade at once. Please remove an item, and try again."):($(this).find(".card").css("border","2px solid rgb(40, 167, 69)"),partnerSelected.push($(this)))}),$(document).on("click","#sendTradeRequest",function(){if(1<=partnerSelected.length&&1<=uSelected.length)questionYesNo("Are you sure you'd like to send this trade?",function(){var a=[],b=[];$.each(partnerSelected,function(b,c){a.push(parseInt(c.attr("data-uid")))}),$.each(uSelected,function(a,c){b.push(parseInt(c.attr("data-uid")))}),request("/user/"+traderId+"/trade/request","PUT",JSON.stringify({requestedItems:a,requesterItems:b})).then(function(){success("Your Trade Request has been Created.")})["catch"](function(a){warning(a.responseJSON.message)})});else{var a=Swal.mixin({toast:!0,position:"top-end",showConfirmButton:!1,timer:3e3});a.fire({type:"error",title:"Both parties must be sending at least one item."})}});function getUserInventoryAndWriteToDisplay(a,b){function c(e){if(!(100<e)){if("you"===b)var f=$("#tradeYourInventory");else var f=$("#tradePartnerInventory");request("/user/"+a+"/inventory/collectibles?sort=desc&offset="+e).then(function(a){if(a=a.items,0>=a.length&&0===e)f.html("<div class=\"col-sm-12\"><h5>This user does not have any tradeable items.</h5></div>");else{25<=a.length&&c(e+25);var g=[];$.each(a,function(a,c){c.serial=null!==c.serial&&0!==c.serial?"<p>Serial: "+c.serial+"</p>":"<p>Serial: N/A</p>",f.append("<div style=\"display:none;\" class=\"col-6 col-sm-6 col-md-6 col-lg-4 addItemToTrade"+b+"\" data-uid=\""+c.userInventoryId+"\" data-catalogid=\""+c.catalogId+"\" id=\"user_inventory_item_"+a+"\"><div class=\"card\" style=\"margin: 1rem 0;\"><img data-catalogid=\""+c.catalogId+"\" style=\"width:100%;\" /> <div class=\"card-body\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;\"><a href=\"/catalog/"+c.catalogId+"/\" target=\"_blank\">"+c.catalogName+"</a>"+c.serial+"</div></div></div></div>"),g.push(c.catalogId),$(".addItemToTrade"+b).show()}),setCatalogThumbs(g)}})["catch"](function(){$("#userInventoryDiv").html("<div class=\"col sm-12\"><h5 class=\"text-center\">This user does not have any items.</h5></div>")})}}c(0)}

















