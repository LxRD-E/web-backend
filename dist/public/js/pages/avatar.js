"use strict";var profileData=$("#userdata"),userid=profileData.attr("data-userid");window.invOffset={},setUserThumbs([parseInt(userid)]),window.wearingItems=[];var outfitTabOpen=!1,pollForChanges=function(){request("/avatar/poll","GET").then(function(a){// OK
$("#userAvatarImage").attr("src")!==a.url&&($("#userAvatarImage").attr("src",a.url),$("#userAvatarImage").css("opacity","1")),pollForChanges()})["catch"](function(){pollForChanges()})};// setup polling
pollForChanges(),window.LegRGB=[255,255,255],window.HeadRGB=[255,255,255],window.TorsoRGB=[255,255,255],window.TShirt=!1,request("/user/"+userid+"/avatar","GET").then(function(a){a.avatar.forEach(function(a){4===a.type?window.Face=a.catalogId:7===a.type?window.TShirt=a.catalogId:2===a.type?window.Shirt=a.catalogId:3===a.type?window.Pants=a.catalogId:window.wearingItems.push(a.catalogId)});var b=a.color[0];loadInventory(1),window.LegRGB=[b.legr,b.legg,b.legb],window.TorsoRGB=[b.torsor,b.torsog,b.torsob],window.HeadRGB=[b.headr,b.headg,b.headb]})["catch"](function(){loadInventory(1)});var colors=[{value:[255,255,255],name:"White"},{value:[52,58,64],name:"Dark",hex:"#343a40"},{value:[255,34,34],name:"Red",hex:"#ff3c3c"},{value:[40,167,69],name:"Green"},{value:[255,175,0],name:"Light Orange",hex:"#E9C600"},{value:[255,193,7],name:"Yellow"},{value:[207,179,68],name:"Noob Yellow",hex:"#D5C881"},{value:[179,215,255],name:"Pastel Light Blue",hex:"#C8D9E9"},{value:[0,125,255],name:"Blue"},{value:[111,66,193],name:"Purple"},{value:[188,155,93],name:"Burlap",hex:"#BBAF96"},{value:[86,66,54],name:"Brown",hex:"#907F74"},{value:[204,142,105],name:"Pastel Brown",hex:"#D4B49D"}];function hexToRgb(a){var b=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(a);return b?{r:parseInt(b[1],16),g:parseInt(b[2],16),b:parseInt(b[3],16)}:null}$(document).on("click",".openAvatarColoring",function(){outfitTabOpen=!1,$("#userInventoryDiv").empty(),$("button.loadMoreItems").hide(),window.loadedItems={};var a=$(this).attr("data-type"),b="";colors.forEach(function(c){b="undefined"==typeof c.hex?c.name:c.hex,$("#userInventoryDiv").append("<div class=\"col-6 col-sm-6 col-md-3 userInventoryColor\" data-type=\""+a+"\" data-colorvalue=\""+xss(c.name)+"\" ><div class=\"card\" style=\"margin: 1rem 0;\"><div style=\"width:100%;height: 8rem;background-color:"+b+"\"></div> <div class=\"card-body\" style=\"padding:5px;\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;font-size:0.75rem;\">"+xss(c.name)+"</div></div></div></div>")}),$("#userInventoryDiv").append("<div class=\"col-6 col-sm-6 col-md-3 userInventoryColor\" data-type=\""+a+"\" data-colorvalue=\"custom\" ><div class=\"card\" style=\"margin: 1rem 0;padding:0.5rem;\"><input type=\"text\" class=\"form-control\" id=\"customHEX\" placeholder=\"HEX\" style=\"font-size:0.75rem;\"> <div class=\"card-body\" style=\"padding:5px;\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;\"><button type=\"button\" id=\"submitCustomColor\" class=\"btn btn-primary\" style=\"width:100%;font-size:0.75rem;margin-top:1rem;margin-bottom;1rem;\" data-type=\""+a+"\">Custom HEX</button></div></div></div></div>")}),$(document).on("click","#submitCustomColor",function(){var a=$(this).attr("data-type"),c=$("#customHEX").val();c=hexToRgb(c);var d=parseInt(c.r),e=parseInt(c.g),f=parseInt(c.b);null!==d&&null!==e&&null!==f&&255>=d&&255>=e&&255>=f?(window[a]=[d,e,f],$("#userInventoryDiv").empty(),toast(!0,"Your "+a+" coloring has been updated."),loadInventory(1)):warning("Please make sure you have entered a proper value for R,G, and B, then try again.")}),$(document).on("click",".userInventoryColor",function(){var a=this,b=$(this).attr("data-type");colors.forEach(function(c){c.name===$(a).attr("data-colorvalue")&&(window[b]=JSON.parse(JSON.stringify(c.value)),$("#userInventoryDiv").empty(),toast(!0,"Your "+b+" coloring has been updated."),loadInventory(1))})}),$(document).on("click",".loadMoreItems",function(){loadInventory(window.defaultcategory,window.invOffset[window.defaultcategory])}),$(document).on("click",".openInventoryPage",function(){outfitTabOpen=!1,window.loadedItems={},$("#userInventoryDiv").empty(),loadInventory(parseInt($(this).attr("data-id")),0),window.invOffset[parseInt($(this).attr("data-id"))]=0}),$(document).on("click","#buttonUpdateAvatar",function(){try{localStorage.setItem("LegRGB",window.LegRGB),localStorage.setItem("TorsoRGB",window.TorsoRGB),localStorage.setItem("HeadRGB",window.HeadRGB)}catch(a){console.log(a)}request("/avatar","PATCH",JSON.stringify({LegRGB:window.LegRGB,HeadRGB:window.HeadRGB,TorsoRGB:window.TorsoRGB,Hats:window.wearingItems,Face:window.Face,TShirt:window.TShirt,Shirt:window.Shirt,Pants:window.Pants})).then(function(){success("Your avatar has been updated! Please wait a few seconds for your avatar to update on the website."),$("#userAvatarImage").css("opacity","0.5")})["catch"](function(a){warning(a.responseJSON.message)})});var loadOutfits=function(){outfitTabOpen=!0,$("#userInventoryDiv").empty(),$(".loadMoreItems").hide(),request("/avatar/outfits?limit=100","GET").then(function(a){if(0===a.total)return void $("#userInventoryDiv").append("<div class=\"col-12\"><h2 style=\"margin-top:1rem;text-align:center;\">You don't have any outfits.</h2></div>");var b=!0,c=!1,d=void 0;try{for(var e,f,g=a.outfits[Symbol.iterator]();!(b=(e=g.next()).done);b=!0)f=e.value,$("#userInventoryDiv").append("\n            \n            <div class=\"col-6 col-sm-12 col-md-6 col-xl-3\" style=\"margin-top:1rem;\">\n                <div class=\"card\">\n                    <img src=\"".concat(f.url,"\" class=\"card-img-top\" />\n                    <div class=\"card-body\" style=\"padding-top:0;\">\n                        <p class=\"text-truncate\" style=\"font-size:0.75rem;\">").concat(xss(f.name),"</p>\n                        <button type=\"button\" class=\"btn btn-success wearOutfit\" data-id=\"").concat(f.outfitId,"\" style=\"font-size:0.75rem;width:100%;margin-top:1rem;\">Wear</button>\n                        <div class=\"dropdown\">\n                            <button type=\"button\" data-toggle=\"dropdown\" class=\"btn btn-secondary dropdown-toggle\" style=\"font-size:0.75rem;width:100%;margin-top:0.5rem;\">Edit</button>\n                            <div class=\"dropdown-menu\">\n                                <a class=\"dropdown-item editOutfit\" href=\"#\" data-id=\"").concat(f.outfitId,"\" data-currentname=\"").concat(xss(f.name),"\">Name</a>\n                                <a class=\"dropdown-item deleteOutfit\" data-id=\"").concat(f.outfitId,"\" href=\"#\">Delete</a>\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>\n            \n            "))}catch(a){c=!0,d=a}finally{try{b||null==g["return"]||g["return"]()}finally{if(c)throw d}}})["catch"](function(a){console.error(a)})};$(document).on("click","#buttonCreateOutfit",function(){loading(),request("/avatar/outfit/create","POST",JSON.stringify({LegRGB:window.LegRGB,HeadRGB:window.HeadRGB,TorsoRGB:window.TorsoRGB,Hats:window.wearingItems,Face:window.Face,TShirt:window.TShirt,Shirt:window.Shirt,Pants:window.Pants})).then(function(){success("Your outfit has been created. Check it out in the \"Outfits\" tab."),outfitTabOpen&&loadOutfits()})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("click",".editOutfit",function(a){a.preventDefault();var b=parseInt($(this).attr("data-id"),10),c=xss($(this).attr("data-name"));question("Please enter a new name for this outfit.",function(a){return 64<=a.length||1>a.length?warning("Please specify a valid name."):void(loading(),request("/avatar/outfit/"+b+"/name","PATCH",{name:a}).then(function(){toast(!0,"Outfit name updated"),loadOutfits()})["catch"](function(){toast(!1,"Outfit name could not be updated. Try again.")}))})}),$(document).on("click",".deleteOutfit",function(a){a.preventDefault();var b=parseInt($(this).attr("data-id"),10);loading(),request("/avatar/outfit/"+b+"/","DELETE",{}).then(function(){toast(!0,"Outfit deleted."),loadOutfits()})["catch"](function(){toast(!1,"Outfit could not be deleted. Try again.")})}),$(document).on("click",".wearOutfit",function(a){a.preventDefault();var b=parseInt($(this).attr("data-id"),10);loading(),request("/avatar/outfit/"+b+"/","GET").then(function(a){console.log(a);var b=a.avatar,c=a.colors[0];window.LegRGB=[c.legr,c.legg,c.legb],window.HeadRGB=[c.headr,c.headg,c.headb],window.TorsoRGB=[c.torsor,c.torsog,c.torsob],window.wearingItems=[],window.Shirt=!1,window.Pants=!1,window.Face=!1,window.TShirt=!1;var d=!0,e=!1,f=void 0;try{for(var g,h,i=b[Symbol.iterator]();!(d=(g=i.next()).done);d=!0)h=g.value,2===h.type?window.Shirt=h.catalogId:3===h.type?window.Pants=h.catalogId:4===h.type?window.Face=h.catalogId:7===h.type?window.TShirt=h.catalogId:window.wearingItems.push(h.catalogId)}catch(a){e=!0,f=a}finally{try{d||null==i["return"]||i["return"]()}finally{if(e)throw f}}request("/avatar","PATCH",JSON.stringify({LegRGB:window.LegRGB,HeadRGB:window.HeadRGB,TorsoRGB:window.TorsoRGB,Hats:window.wearingItems,Face:window.Face,TShirt:window.TShirt,Shirt:window.Shirt,Pants:window.Pants})).then(function(){success("Your avatar has been updated! Please wait a few seconds for your avatar to update on the website."),$("#userAvatarImage").css("opacity","0.5")})["catch"](function(a){warning(a.responseJSON.message)})})["catch"](function(a){console.error(a),warning(a.responseJSON.message)})}),$(document).on("click",".openOutfitsPage",function(){loadOutfits()}),$(document).on("click",".userInventoryItem",function(){var a=this,b="true"===$(this).find(".card").attr("data-selected"),c=function(b){b||(b=$(a)),b.find(".card").attr("data-selected","true")},d=function(b){b||(b=$(a)),b.find(".card").attr("data-selected","false")};if(!b){//window.wearingItems.push(parseInt($(this).attr("data-catalogid")));
switch(parseInt($(this).attr("data-category"))){case 4:{window.Face=parseInt($(this).attr("data-catalogid")),$("#userInventoryDiv").children(".userInventoryItem").each(function(){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)"),d($(this))});break}case 7:{window.TShirt=parseInt($(this).attr("data-catalogid")),$("#userInventoryDiv").children(".userInventoryItem").each(function(){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)"),d($(this))});break}case 2:{window.Shirt=parseInt($(this).attr("data-catalogid")),$("#userInventoryDiv").children(".userInventoryItem").each(function(){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)"),d($(this))});break}case 3:{window.Pants=parseInt($(this).attr("data-catalogid")),$("#userInventoryDiv").children(".userInventoryItem").each(function(){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)"),d($(this))});break}case 5:{$("#userInventoryDiv").children(".userInventoryItem").each(function(){$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)"),d($(this));var a=window.wearingItems.indexOf(parseInt($(this).attr("data-catalogid")));-1<a&&window.wearingItems.splice(a,1)}),window.wearingItems.push(parseInt($(this).attr("data-catalogid")));break}default:!1===window.wearingItems.includes(parseInt($(this).attr("data-catalogid")))&&window.wearingItems.push(parseInt($(this).attr("data-catalogid")));}$(this).find(".card").css("border","2px solid rgb(40, 167, 69)"),c($(this))}else if(d(),$(this).find(".card").css("border","1px solid rgba(0, 0, 0, 0.125)"),4===parseInt($(this).attr("data-category")))window.Face=!1;else if(7===parseInt($(this).attr("data-category")))window.TShirt=!1;else if(2===parseInt($(this).attr("data-category")))window.Shirt=!1;else if(3===parseInt($(this).attr("data-category")))window.Pants=!1;else{var e=window.wearingItems.indexOf(parseInt($(this).attr("data-catalogid")));-1<e&&window.wearingItems.splice(e,1)}});function loadInventory(a,b){"undefined"==typeof b&&(b=0),window.defaultcategory=a,request("/user/"+userid+"/inventory?sort=desc&offset="+b+"&category="+a).then(function(c){if(c=c.items,0>=c.length)0===b&&$("#userInventoryDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">You do not have any items in this category.</h5></div>");else{var e=[];$.each(c,function(a,b){("undefined"==typeof window.loadedItems||"undefined"==typeof window.loadedItems[b.catalogId])&&(window.wearingItems.includes(b.catalogId)||b.catalogId===window.Face||b.catalogId===window.TShirt||b.catalogId===window.Shirt||b.catalogId===window.Pants?$("#userInventoryDiv").append("<div class=\"col-6 col-sm-6 col-md-3 userInventoryItem\" data-category=\""+b.category+"\" data-catalogid=\""+b.catalogId+"\"><div class=\"card\" style=\"margin: 1rem 0;display:none;border: 2px solid rgb(40, 167, 69);\"><img class=\"onHoverChangeOpacity\" data-catalogid=\""+b.catalogId+"\" style=\"width:100%;\" /> <div class=\"card-body\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;\"><a href=\"/catalog/"+b.catalogId+"/\">"+xss(b.catalogName)+"</a></div></div></div></div>"):$("#userInventoryDiv").append("<div class=\"col-6 col-sm-6 col-md-3 userInventoryItem\" data-category=\""+b.category+"\" data-catalogid=\""+b.catalogId+"\"><div class=\"card\" style=\"margin: 1rem 0;display:none;\"><img class=\"onHoverChangeOpacity\" data-catalogid=\""+b.catalogId+"\" style=\"width:100%;\" /> <div class=\"card-body\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;\"><a href=\"/catalog/"+b.catalogId+"/\">"+xss(b.catalogName)+"</a></div></div></div></div>"),e.push(b.catalogId),"undefined"==typeof window.loadedItems&&(window.loadedItems={}),window.loadedItems[b.catalogId]=!0)}),setCatalogThumbs(e)}25<=c.length?("undefined"==typeof window.invOffset[a]&&(window.invOffset[a]=0),window.invOffset[a]+=25,$(".loadMoreItems").css("display","block")):$(".loadMoreItems").hide()})["catch"](function(){0===b&&$("#userInventoryDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">You do not have any items in this category.</h5></div>")})}



































