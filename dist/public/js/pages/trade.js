"use strict";var userData=$("#userdata"),userid=userData.attr("data-userid"),traderData=$("#tradedata"),traderId=traderData.attr("data-userid");getUserInventoryAndWriteToDisplay(userid,"you"),getUserInventoryAndWriteToDisplay(traderId,"partner");var uSelected=[];$(document).on("click",".addItemToTradeyou",function(){if("4px solid rgb(40, 167, 69)"===$(this).find(".card").css("border")){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)");for(var a=uSelected.length-1;0<=a;--a)uSelected[a].attr("data-uid")==$(this).attr("data-uid")&&uSelected.splice(a,1)}else 4<=uSelected.length?warning("You can only select up to 4 items, per person, to trade at once. Please remove an item, and try again."):($(this).find(".card").css("border","4px solid rgb(40, 167, 69)"),uSelected.push($(this)))});var partnerSelected=[];$(document).on("click",".addItemToTradepartner",function(){if("4px solid rgb(40, 167, 69)"===$(this).find(".card").css("border")){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)");for(var a=partnerSelected.length-1;0<=a;--a)partnerSelected[a].attr("data-uid")==$(this).attr("data-uid")&&partnerSelected.splice(a,1)}else 4<=partnerSelected.length?warning("You can only select up to 4 items, per person, to trade at once. Please remove an item, and try again."):($(this).find(".card").css("border","4px solid rgb(40, 167, 69)"),partnerSelected.push($(this)))}),$(document).on("click","#sendTradeRequest",function(){if(1<=partnerSelected.length&&1<=uSelected.length)questionYesNo("Are you sure you'd like to send this trade?",function(){loading();var a=[],b=[];$.each(partnerSelected,function(b,c){a.push(parseInt(c.attr("data-uid")))}),$.each(uSelected,function(a,c){b.push(parseInt(c.attr("data-uid")))}),request("/user/"+traderId+"/trade/request","PUT",JSON.stringify({requestedItems:a,requesterItems:b})).then(function(){success("Your Trade Request has been Created.",function(){window.history.back()})})["catch"](function(a){warning(a.responseJSON.message)})});else{var a=Swal.mixin({toast:!0,position:"top-end",showConfirmButton:!1,timer:3e3});a.fire({type:"error",title:"Both parties must be sending at least one item."})}});function getUserInventoryAndWriteToDisplay(a,b){function c(e){if(!(100<e)){var f;f="you"===b?$("#tradeYourInventory"):$("#tradePartnerInventory"),request("/user/"+a+"/inventory/collectibles?limit=100&sort=desc&offset="+e).then(function(a){var g=a.items;if(0>=g.length&&0===e)f.html("<div class=\"col-sm-12\"><h5>This user does not have any trade-able items.</h5></div>");else{100<=g.length&&c(e+100);var d=[];$.each(g,function(a,c){c.serial=null!==c.serial&&0!==c.serial?"<p style='font-size:0.75rem;'>Serial: "+c.serial+"</p>":"<p style='font-size:0.75rem;'>Serial: N/A</p>",f.append("<div style=\"display:none;padding:0.25rem;margin-bottom:0;cursor:pointer;\" class=\"col-4 col-md-3 col-lg-2 addItemToTrade"+b+"\" data-uid=\""+c.userInventoryId+"\" data-catalogid=\""+c.catalogId+"\" id=\"user_inventory_item_"+a+"\"><div class=\"card\" style=\"margin:0;\"><img data-catalogid=\""+c.catalogId+"\" style=\"width:100%;\" /> <div class=\"card-body\" style=\"padding:0.75rem;\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;font-size:0.85rem;\"><a class=\"normal\" href=\"/catalog/"+c.catalogId+"/\" target=\"_blank\">"+c.catalogName+"</a><p style=\"font-size:0.65rem;\"><span title=\"Average Sales Price\" class=\"average-sales-toolip\">ASP: "+number_format(c.averagePrice)+"</span></p>"+c.serial+"</div></div></div></div>"),d.push(c.catalogId),$(".addItemToTrade"+b).show()}),setCatalogThumbs(d),$(".average-sales-toolip").tooltip()}})["catch"](function(){$("#userInventoryDiv").html("<div class=\"col sm-12\"><h5 class=\"text-center\">This user does not have any items.</h5></div>")})}}c(0)}