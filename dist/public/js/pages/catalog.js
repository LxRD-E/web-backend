"use strict";/**
 * out of all the js files, this one and the trade one are probably the ugliest code-wise. god i hate front end
 */var profileData=$("#profiledata"),userid=profileData.attr("data-userid");window.catalogOffset={},window.category=10,window.offset=0,window.sort=1,window.orderBy="id",window.orderByType="desc";var url=new URL(window.location.href);url.searchParams.get("category")&&(window.category=parseInt(url.searchParams.get("category"),10)||10),url.searchParams.get("orderBy")&&(window.orderBy=url.searchParams.get("orderBy")),url.searchParams.get("orderByType")&&(window.orderByType=url.searchParams.get("orderByType")),url.searchParams.get("q")&&(window.q=url.searchParams.get("q")),$("#newSortOrder").on("change",function(){var a=parseInt($(this).val());window.sort=a,1==a?(window.orderBy="id",window.orderByType="desc"):2==a?(window.orderBy="price",window.orderByType="asc"):3==a&&(window.orderBy="price",window.orderByType="desc"),reload()}),$("#featured").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Featured"),$("#currentCategoryDescription").html("These are items created by the staff team. It can also feature community-submitted items."),window.category=10,reload()}),$("#all").click(function(a){a.preventDefault(),$("#currentCategoryText").html("All"),$("#currentCategoryDescription").html("These are all of our items in the Catalog, both created by users and the staff team."),window.category=11,reload()}),$("#all_hats").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Hats"),$("#currentCategoryDescription").html("These are Hats you can wear. They are created by the staff team, as well as by other users through community submissions."),window.category=1,reload()}),$("#all_shirts").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Shirts"),$("#currentCategoryDescription").html("These are Shirts you can wear, created by the community."),window.category=2,reload()}),$("#all_pants").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Pants"),$("#currentCategoryDescription").html("These are Pants you can wear, created by the community."),window.category=3,reload()}),$("#all_faces").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Faces"),$("#currentCategoryDescription").html("These are Faces you can wear, created by the community."),window.category=4,reload()}),$("#all_gears").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Gears"),$("#currentCategoryDescription").html("These are Gears you can wear, created by the staff team."),window.category=5,reload()}),$("#all_shoes").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Shoes"),$("#currentCategoryDescription").html("These are Shoes you can wear, created by the staff team."),window.category=6,reload()}),$("#all_tshirts").click(function(a){a.preventDefault(),$("#currentCategoryText").html("TShirts"),$("#currentCategoryDescription").html("These are TShirts you can wear, created by the community."),window.category=7,reload()}),$("#collectibles").click(function(a){a.preventDefault(),$("#currentCategoryText").html("Collectibles"),$("#currentCategoryDescription").html("These are collectible items that can no longer be purchased directly, but can instead be purchased from other users and/or traded."),window.category=20,reload()});function reload(a){!0!==a&&(window.offset=0),loadCatalog(window.category,window.offset,a,window.orderBy,window.orderByType)}reload(),$(document).on("click","#searchForCatalogClick",function(){var a=urlencode($("#searchForCatalogInput").val());a=a.replace(/-/g," ");$("#catalogItemsDiv").each(function(){$(this).css("opacity","0.5")}),window.defaultcategory=category,request("/catalog?limit=25&offset=0&category="+category+"&orderBy="+window.orderBy+"&orderByType="+window.orderByType+"&q="+a).then(function(b){window.history.replaceState(null,null,"/catalog?category="+category+"&orderBy="+orderBy+"&orderByType="+orderByType+"&q="+a),loadCatalogStuff(b,!1)})["catch"](function(){$("#catalogItemsDiv").empty(),$("#catalogItemsDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">Your query returned 0 results.</h5></div>"),$("#catalogItemsDiv").each(function(){$(this).css("opacity","1")})})});var loadMoreItemsPossible=!1;$(document).on("click",".loadMoreItems",function(){window.offset+=25,reload(!0)}),$(window).scroll(function(){!loadMoreItemsPossible||$(window).scrollTop()+$(window).height()>$(document).height()-$("div#footerUpper").innerHeight()&&(loadMoreItemsPossible=!1,window.offset+=25,reload(!0))}),$(document).on("click",".openInventoryPage",function(){$("#userInventoryDiv").empty(),loadInventory(parseInt($(this).attr("data-id")),0),window.catalogOffset[parseInt($(this).attr("data-id"))]=0});function loadCatalog(a,b,c,e,f){"undefined"==typeof b&&(b=0),!0!==c&&$("#catalogItemsDiv").each(function(){$(this).css("opacity","0.5")}),window.defaultcategory=a;var g="";if(window.q){g=window.q;var d="/catalog?offset="+b+"&category="+a+"&orderBy="+e+"&orderByType="+f+"&q="+window.q;delete window.q}else var d="/catalog?offset="+b+"&category="+a+"&orderBy="+e+"&orderByType="+f;request(d).then(function(b){window.history.replaceState(null,null,"/catalog?category="+a+"&orderBy="+e+"&orderByType="+f+"&q="+g),loadCatalogStuff(b,c)})["catch"](function(){$("#catalogItemsDiv").empty(),0===b&&($("#catalogItemsDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">Your query returned 0 results.</h5></div>"),$("#catalogItemsDiv").each(function(){$(this).css("opacity","1")}))})}function loadCatalogStuff(a,b){if(!0!==b&&$("#catalogItemsDiv").empty(),$("#catalogItemsDiv").each(function(){$(this).css("opacity","1")}),0>=a.length)0===offset&&$("#catalogItemsDiv").html("<div class=\"col sm-12\" style=\"margin-top:1rem;\"><h5 class=\"text-center\">Your query returned 0 results.</h5></div>");else{var c=[],d=[],e=[];$.each(a,function(a,b){b.currency=formatCurrency(b.currency,"0.75rem"),b.col="",1===b.collectible&&(0===b.maxSales?b.col="\n                    <div style=\"width:100%;position:absolute;top:0;margin:0.5rem;\">\n                        <p>\n                            <i class=\"gradient-fa fas fa-award\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"This item is collectible. You can trade & sell it.\"></i>\n                        </p>\n                    </div>":b.col="\n                    <div style=\"width:100%;position:absolute;top:0;margin:0.5rem;\">\n                        <p>\n                            <i class=\"rainbow-fa fas fa-fingerprint\" data-toggle=\"tooltip\" data-placement=\"top\" title=\"This item is a serialied collectible. Each copy has it's own unique serial. You can trade & sell it.\"></i>\n                        </p>\n                    </div>");var f="<p class=\"text-left text-truncate\" style=\"font-weight: 300;font-size: 0.85rem;padding-bottom:0;\">By: <span data-userid=\"".concat(b.creatorId,"\"></span></p>");1===b.creatorType?(f="<p class=\"text-left text-truncate\" style=\"font-weight: 300;font-size: 0.85rem;padding-bottom:0;\">By: <span data-groupid=\"".concat(b.creatorId,"\"></span></p>"),e.push(b.creatorId)):d.push(b.creatorId);var g="";20===window.defaultcategory&&(g="<span style=\"text-decoration: line-through;opacity:0.5;font-size:0.75rem;\">Original: ".concat(formatCurrency(b.currency,"0.75rem")," ").concat(b.price,"</span><br>")),g+="number"==typeof b.price&&"undefined"==typeof b.collectibleLowestPrice?b.currency+nform(b.price):b.collectibleLowestPrice?"<span style=\"font-size:0.65rem;\">Lowest Price: "+formatCurrency(1,"0.75rem")+nform(b.collectibleLowestPrice)+"</span>":20===window.defaultcategory?"<span style=\"font-size:0.75rem;\">No Resellers</span>":"<span style=\"font-size:0.75rem;\">Not for sale</span>",$("#catalogItemsDiv").append("<div style=\"padding-right: 5px;padding-left: 5px;\" class=\"col-6 col-sm-4 col-md-3 catalogItem\" data-catalogid=\""+b.catalogId+"\"><div class=\"card\" style=\"margin: 0.5rem 0 0 0;border: 0;box-shadow:none;\"><a href=\"/catalog/"+b.catalogId+"/"+urlencode(b.catalogName)+"\"><img data-catalogid=\""+b.catalogId+"\" style=\"width:100%;\" class=\"image-with-background\" /></a>"+b.col+" <div class=\"card-body\" style=\"padding: 0.75rem;\"><div class=\"card-title text-left text-truncate\" style=\"margin-bottom:0;font-size:0.85rem;\"><a href=\"/catalog/"+b.catalogId+"/"+urlencode(b.catalogName)+"\">"+xss(b.catalogName)+"</a>"+f+"<p class=\"text-left text-truncate\">"+g+"</p></div></div></div></div>"),c.push(b.catalogId)}),$("[data-toggle=\"tooltip\"]").tooltip(),setCatalogThumbs(c),setUserNames(d),setGroupNames(e)}25<=a.length?(loadMoreItemsPossible=!0,$("#loadingMoreItems").show()):(loadMoreItemsPossible=!1,$("#loadingMoreItems").hide())}










