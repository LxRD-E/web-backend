"use strict";var curDisplay="",partnerUserId=1,knownUsersArray={},pendingUsers={};function userIdToName(a){return"undefined"!=typeof knownUsersArray[a]&&null!==knownUsersArray[a]?knownUsersArray[a]:("undefined"!=typeof pendingUsers[a]&&null!==pendingUsers[a]||(pendingUsers[a]="pending",request("/user/"+a+"/info","GET").then(function(b){knownUsersArray[a]=b.username})["catch"](function(){pendingUsers[a]=null})),"")}var userid=$("#userdata").attr("data-userid");$("#transactionsBodyDisplay").parent().parent().append("<button type=\"button\" class=\"btn btn-small btn-success loadMoreButtonClick\" style=\"margin:0 auto;display: hidden;\">Load More</button>");function loadTrades(a,b){$("#tradesGrid").empty(),$(".loadMoreButtonClick").hide(),request("/economy/trades/"+a+"/?offset="+b,"GET").then(function(b){if(0>=b.length)return void $("#tradesGrid").append("<div class='col-sm-12'><p class='text-center' style='margin-top:1rem;'>There are no trades to display!</p></div>");var c=[];$.each(b,function(b,d){partnerUserId=d.userId,c.push(partnerUserId),userIdToName(partnerUserId),$("#tradesGrid").append("\n                    <div class=\"col-6 col-sm-6 col-md-4 col-lg-2\" style=\"margin-top:1rem;\">\n                        <div class=\"card\">\n                            <div class=\"card-body\">\n                                <img data-userid=\""+partnerUserId+"\" style=\"width:100%;\" />\n                                <div class=\"card-title text-center\">\n                                    <p style=\"font-size: small;\">"+formatDate(d.date)+"</p>\n                                    <button type=\"button\" class=\"btn btn-success reviewTradeData\" data-type=\""+a+"\" data-tradeid="+d.tradeId+" data-useridone=\""+d.userId+"\" data-useridtwo=\""+userId+"\" data-date=\""+formatDate(d.date)+"\" style=\"width:100%;\">Review</button>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    ")}),setUserThumbs(c);25<=b.length?(null===parseInt(window["trans_offset_"+a])&&(window.trans_offset_type=0),window["trans_offset_"+a]=window.trans_offset_type+25,$(".loadMoreButtonClick").css("display","block")):$(".loadMoreButtonClick").hide()})["catch"](function(){$("#tradesGrid").append("<div class='col-sm-12'><p class='text-center' style='margin-top:1rem;'>There are no trades to display!</p></div>")})}loadTrades("inbound",0),$(document).on("click",".openTrades",function(){var a=$(this).html().toLowerCase();loadTrades(a,0)}),$(document).on("click",".reviewTradeData",function(){loading();var a=parseInt($(this).attr("data-tradeid")),b=$(this).parent().parent().find("img").attr("src"),c=$(this).attr("data-type"),e=$(this).attr("data-date"),f=parseInt($(this).attr("data-useridone"));request("/economy/trades/"+a+"/items","GET").then(function(b){var d="",g="",h="",i="",j="",k=!0,l=[];b.requestee.forEach(function(a){d+="<div class=\"col-6 col-sm-4\"><a href=\"/catalog/"+a.catalogId+"\" target=\"_blank\"><img data-catalogid=\""+a.catalogId+"\" style=\"width: 100%;\" /></a><p class=\"text-center text-truncate\" style=\"font-size: 0.85rem;\" data-catalogid=\""+a.catalogId+"\">Loading</p></div>",l.push(a.catalogId)}),b.requested.forEach(function(a){g+="<div class=\"col-6 col-sm-4\"><a href=\"/catalog/"+a.catalogId+"\" target=\"_blank\"><img data-catalogid=\""+a.catalogId+"\" style=\"width: 100%;\" /></a><p class=\"text-center text-truncate\" style=\"font-size: 0.85rem;\" data-catalogid=\""+a.catalogId+"\">Loading</p></div>",l.push(a.catalogId)}),"outbound"===c?(h="Items you will Recieve",i="Items you will Give",j="Close",k=!0):"inactive"===c?(k=!1,h="Items you would have Recieved",i="Items you would have Given",j="Close"):"inbound"===c?(k=!0,h="Items you will Recieve",i="Items you will Give",j="Accept Trade"):"completed"===c&&(k=!1,h="Items you Recieved",i="Items you Gave",j="Close"),setTimeout(function(){setCatalogThumbs(l),setCatalogNames(l),setUserThumbs([f])},100),Swal.fire({title:"Review Trade",html:"<div class=\"row\">\n                  <div class=\"col-sm-6\"><img data-userid=\""+f+"\" style=\"width:100%;\" /><h5><a href=\"/users/"+f+"/profile\" target=\"_blank\">"+userIdToName(f)+"</a></h5><p style=\"font-size: 0.75em;\">"+e+"</p></div>\n                  <div class=\"col-sm-6\">\n                  <h5>"+i+"</h5>\n                  <div class=\"row\">\n                    "+d+"\n                  </div>\n                  <h5>"+h+"</h5>\n                  <div class=\"row\">\n                    "+g+"\n                  </div>\n                  </div>\n                  </div>",showCloseButton:!0,showCancelButton:k,focusConfirm:!1,confirmButtonText:j,cancelButtonText:"Cancel Trade"}).then(function(b){"outbound"===c&&(b.dismiss&&"backdrop"===b.dismiss||(b.dismiss&&"cancel"===b.dismiss?questionYesNo("Are you sure you want to cancel this trade?",function(){loading(),request("/economy/trades/"+a,"DELETE").then(function(){success("The trade has been deleted",function(){loadTrades(c,0)})})["catch"](function(a){void 0,warning(a.responseJSON.message)})}):b.value)),"inbound"===c&&(b.dismiss&&"backdrop"===b.dismiss||(b.dismiss&&"cancel"===b.dismiss?questionYesNo("Are you sure you want to cancel this trade?",function(){loading(),request("/economy/trades/"+a,"DELETE").then(function(){success("The trade has been deleted",function(){loadTrades(c,0)})})["catch"](function(a){void 0,warning(a.responseJSON.message)})}):b.value&&questionYesNo("Are you sure you want to accept this trade?",function(){loading(),request("/economy/trades/"+a,"POST").then(function(){success("The trade has been accepted! You can view your new item(s) in your inventory.",function(){loadTrades(c,0)})})["catch"](function(a){void 0,warning(a.responseJSON.message)})})))})})["catch"](function(){void 0,warning("This trade does not seem to exist. Please reload the page, and try again.")})});














