"use strict";var profile={userId:parseInt($("#profile-info").attr("data-userid"),10)},takeItemsState={loading:!1,canLoadMore:!0,offset:0,limit:100,query:""},card=$("#main-card");$(document).on("click","#take-items",function(a){a.preventDefault(),card.empty(),card.append("<div class=\"row\"><div class=\"col s6\"><h3>Take Items</h3></div><div class=\"col s6\"><p style=\"text-align: right;\" id=\"submit-take-items-request\">Submit</p></div></div></div>"),card.append("<div class=\"row\" id=\"loading\"><div class=\"col s12\">Loading...</div></div>"),loadItemsToTake()});/**
 * Get selected user inventory ids
 * @returns {number[]}
 */var getSelectedItems=function(){var a=[];return $(".remove-item-card").each(function(){"true"===$(this).attr("data-selected")&&a.push(parseInt($(this).attr("data-user-inventory-id"),10))}),a};$(document).on("click","div.row.load-more-items-row",function(a){a.preventDefault(),loadItemsToTake()}),$(document).on("click","#submit-take-items-request",function(a){a.preventDefault();var b=getSelectedItems();return 0===b.length?warning("You must select at least one item."):void questionYesNoHtml("Please confirm the userInventoryIds are OK:<br>"+b.join("<br>"),function(){question("Enter the username of the new owner.",function(a){loading(),request("/user/username?username="+a,"GET").then(function(a){var c=a.userId;request("/staff/user/inventory/transfer-item","PATCH",{userIdTo:c,userIdFrom:profile.userId,userInventoryIds:b}).then(function(){success("The items specified were transferred.",function(){window.location.reload()})})["catch"](function(a){return a.responseJSON&&a.responseJSON.message?warning(a.responseJSON.message):warning("An unknown error has occurred")})})["catch"](function(){warning("The username you specified is invalid.")})}),$("input.swal2-input").val("BadDecisions")})}),$(document).on("click",".remove-item-card",function(a){a.preventDefault();var b=$(this).attr("data-selected");"true"===b?($(this).attr("data-selected","false"),$(this).css("border","none")):($(this).attr("data-selected",!0),$(this).css("border","4px solid green"))});var loadItemsToTake=function(){var a=card.find("div.row.take-items-row");a&&a.length||(card.append("<div class=\"row take-items-row\"></div>"),a=card.find("div.row.take-items-row"));var b=card.find("div.row.load-more-items-row");b&&b.length||(card.append("<div class=\"row load-more-items-row\"></div>"),b=card.find("div.row.load-more-items-row"),b.append("<div class=\"col-12\"><p style=\"margin-top:2rem;font-weight:700;\">Load More</p></div>"));takeItemsState.loading||!takeItemsState.canLoadMore||(takeItemsState.loading=!0,b.hide(),request("/user/"+profile.userId+"/inventory/collectibles?offset="+takeItemsState.offset+"&limit="+takeItemsState.limit+"&query="+takeItemsState.query,"GET").then(function(c){console.log(c),takeItemsState.offset+=100,takeItemsState.canLoadMore=c.areMoreAvailable,takeItemsState.canLoadMore?b.show():b.hide(),card.find("#loading").remove();var d=[],e=!0,f=!1,g=void 0;try{for(var h,i,j=c.items[Symbol.iterator]();!(e=(h=j.next()).done);e=!0){i=h.value,d.push(i.catalogId);var k="<p style=\"font-size:0.75rem;\">User Inventory ID: "+i.userInventoryId+"</p>";i.serial&&(k="<p style=\"font-size:0.75rem;\">Serial: #"+i.serial+" ("+i.userInventoryId+")</p>"),a.append("\n            <div class=\"col-6 col-md-4 col-lg-3 col-xl-2 remove-item-card\" data-user-inventory-id=\"".concat(i.userInventoryId,"\">\n                <img src=\"").concat(window.subsitutionimageurl,"\" style=\"width: 100%;height:auto;display: block;\" data-catalogid=\"").concat(i.catalogId,"\" />\n                <p>").concat(xss(i.catalogName),"</p>\n                ").concat(k,"\n            </div>\n            \n            "))}}catch(a){f=!0,g=a}finally{try{e||null==j["return"]||j["return"]()}finally{if(f)throw g}}setCatalogThumbs(d)})["finally"](function(){takeItemsState.loading=!1}))};




















