"use strict";var profileData=$("#profiledata"),userid=profileData.attr("data-userid");window.invOffset={},loadInventory(1),$(document).on("click",".loadMoreItems",function(){loadInventory(window.defaultcategory,window.invOffset[window.defaultcategory])}),$(document).on("click",".openInventoryPage",function(){$("#userInventoryDiv").empty(),loadInventory(parseInt($(this).attr("data-id")),0),window.invOffset[parseInt($(this).attr("data-id"))]=0});function loadInventory(a,b){"undefined"==typeof b&&(b=0),window.defaultcategory=a,request("/user/"+userid+"/inventory?offset="+b+"&category="+a).then(function(c){if(c=c.items,0>=c.length)0===b&&$("#userInventoryDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">This user does not have any items in this category.</h5></div>");else{var e=[];$.each(c,function(a,b){b.serial=null===b.serial?"<p>Serial: N/A</p>":"<p>Serial: #"+b.serial.toString()+"</p>",$("#userInventoryDiv").append("<div class=\"col-sm-4 col-md-3 col-lg-2 userInventoryItem\" data-catalogid=\""+b.catalogId+"\"><div class=\"card\" style=\"margin: 1rem 0;display:none;\"><img data-catalogid=\""+b.catalogId+"\" style=\"width:100%;\" /> <div class=\"card-body\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;\"><a href=\"/catalog/"+b.catalogId+"/\">"+b.catalogName.escape()+"</a>"+b.serial+"</div></div></div></div>"),e.push(b.catalogId)}),setCatalogThumbs(e)}25<=c.length?("undefined"==typeof window.invOffset[a]&&(window.invOffset[a]=0),window.invOffset[a]+=25,$(".loadMoreItems").css("display","block")):$(".loadMoreItems").hide()})["catch"](function(){void 0,0===b&&$("#userInventoryDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">This user does not have any items in this category.</h5></div>")})}
















