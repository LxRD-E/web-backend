"use strict";var currentUserId=$("#impersonator-info").attr("data-userid"),curDisplay="",partnerUserId=1,knownUsersArray={},pendingUsers={};function userIdToName(a){return"undefined"!=typeof knownUsersArray[a]&&null!==knownUsersArray[a]?knownUsersArray[a]:("undefined"!=typeof pendingUsers[a]&&null!==pendingUsers[a]||(pendingUsers[a]="pending",request("/user/"+a+"/info","GET").then(function(b){knownUsersArray[a]=b.username})["catch"](function(){pendingUsers[a]=null})),"")}var userid=$("#userdata").attr("data-userid");$("#transactionsBodyDisplay").parent().parent().append("<button type=\"button\" class=\"btn btn-small btn-success loadMoreButtonClick\" style=\"margin:0 auto;display: hidden;\">Load More</button>");function loadTrades(a,b){$("#tradesGrid").empty(),$(".loadMoreButtonClick").hide(),request("/staff/economy/trades/"+a+"/?offset="+b+"&userId="+currentUserId,"GET").then(function(b){if(0>=b.length)return void $("#tradesGrid").append("<div class='col-sm-12'><p class='text-center' style='margin-top:1rem;'>There are no trades to display!</p></div>");var c=[];$.each(b,function(b,d){partnerUserId=d.userId,c.push(partnerUserId),$("#tradesGrid").append("\n                    <div class=\"col-6 col-sm-12 col-lg-6\" style=\"margin-top:1rem;\">\n                        <div class=\"card\">\n                            <div class=\"card-body\">\n                                <div class=\"row\">\n                                    <div class=\"col-4\">\n                                        <a href=\"/users/".concat(partnerUserId,"/profile\">\n                                            <img data-userid=\"")+partnerUserId+"\" style=\"width:100%;\" />\n                                        </a>\n                                    </div>\n                                    <div class=\"col-8\">\n                                        <p style=\"font-size: small;\" class=\"text-truncate\">From <a href=\"/users/".concat(partnerUserId,"/profile\"><span data-userid=\"").concat(partnerUserId,"\" class=\"font-weight-bold\">Loading...</span></a></p>\n                                        <p style=\"font-size: small;\" class=\"text-truncate\">").concat(moment(d.date).fromNow(),"</p>\n                                        <button type=\"button\" class=\"btn btn-outline-success reviewTradeData\" data-type=\"")+a+"\" data-tradeid="+d.tradeId+" data-useridone=\""+d.userId+"\" data-useridtwo=\""+userId+"\" data-date=\""+formatDate(d.date)+"\" style=\"width:100%;padding-bottom:0.25rem;padding-top:0.25rem;font-size:0.75rem;\" data-offer-primary=\"".concat(d.offerPrimary,"\" data-request-primary=\"").concat(d.requestPrimary,"\">Review</button>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    "))}),setUserThumbs(c),setUserNames(c);25<=b.length?(null===parseInt(window["trans_offset_"+a])&&(window.trans_offset_type=0),window["trans_offset_"+a]=window.trans_offset_type+25,$(".loadMoreButtonClick").css("display","block")):$(".loadMoreButtonClick").hide()})["catch"](function(){void 0,$("#tradesGrid").append("<div class='col-sm-12'><p class='text-center' style='margin-top:1rem;'>There are no trades to display!</p></div>")})}loadTrades("inbound",0),$(document).on("click",".openTrades",function(){var a=$(this).html().toLowerCase();loadTrades(a,0)}),$(document).on("click",".reviewTradeData",function(){$("#tradesGrid").children().each(function(){$(this).css("opacity","1")}),$(this).parent().parent().parent().parent().parent().css("opacity","0.25"),$("#current-trade-card-body").empty(),$("#current-trade-card-body").append("\n    <div class=\"row\">\n        <div class=\"col-12\">\n            <div class=\"spinner-border\" role=\"status\" style=\"margin:0 auto;display:block;\"></div>\n        </div>\n    </div>\n    ");var a=parseInt($(this).attr("data-tradeid")),b=$(this).parent().parent().find("img").attr("src"),c=$(this).attr("data-type"),d=$(this).attr("data-date"),e=parseInt($(this).attr("data-useridone")),f=parseInt($(this).attr("data-offer-primary")),g=parseInt($(this).attr("data-request-primary"));request("/staff/economy/trades/"+a+"/items?userId="+currentUserId,"GET").then(function(b){var d="",h="",i="",j="",k="",l=!0,m=[],n=f;b.offer.forEach(function(a){n+=a.averageSalesPrice;var b="<p style=\"font-size:0.65rem;text-align:left;\">Serial: N/A</p>";a.serial&&(b="<p style=\"font-size:0.65rem;text-align:left;\">Serial: "+a.serial+"</p>"),d+="<div class=\"col-3 col-sm-3 col-md-3\"><a href=\"/catalog/"+a.catalogId+"\" target=\"_blank\"><img data-catalogid=\""+a.catalogId+"\" style=\"width: 100%;\" /></a><p class=\"text-truncate\" style=\"font-size: 0.75rem;font-weight:700;text-align:left;\" data-catalogid=\""+a.catalogId+"\">Loading</p>"+b+"</div>",m.push(a.catalogId)});var o=g;b.requested.forEach(function(a){o+=a.averageSalesPrice;var b="<p style=\"font-size:0.65rem;text-align:left;\">Serial: N/A</p>";a.serial&&(b="<p style=\"font-size:0.65rem;text-align:left;\">Serial: "+a.serial+"</p>"),h+="<div class=\"col-3 col-sm-3 col-md-3\"><a href=\"/catalog/"+a.catalogId+"\" target=\"_blank\"><img data-catalogid=\""+a.catalogId+"\" style=\"width: 100%;\" /></a><p class=\"text-truncate\" style=\"font-size: 0.75rem;font-weight:700;text-align:left;\" data-catalogid=\""+a.catalogId+"\">Loading</p>"+b+"</div>",m.push(a.catalogId)}),"outbound"===c?(i="Items you will Recieve",j="Items you will Give",k="Close",l=!0):"inactive"===c?(l=!1,i="Items you would have Recieved",j="Items you would have Given",k="Close"):"inbound"===c?(l=!0,i="Items you will Recieve",j="Items you will Give",k="Accept Trade"):"completed"===c&&(l=!1,i="Items you Recieved",j="Items you Gave",k="Close"),setTimeout(function(){setCatalogThumbs(m),setCatalogNames(m),setUserThumbs([e])},100);var p="";f&&(p="(+".concat(formatCurrency(1,"0.75rem")," ").concat(number_format(f),")"));var q="";g&&(q="(+".concat(formatCurrency(1,"0.75rem")," ").concat(number_format(g),")")),$("#current-trade-card-body").empty();var r="";l&&(r="<button type=\"button\" class=\"btn btn-danger modify-trade-state\" style=\"width:100%;\" data-dismiss=\"true\">Cancel Trade</button>"),$("#current-trade-card-body").append("\n            \n            <div class=\"row\">\n                <div class=\"col-2\">\n                    <img src=\"".concat(window.subsitutionimageurl,"\" style=\"width:100%;height:auto;display:block;margin:0 auto;\" data-userid=\"").concat(e,"\" />\n                </div>\n                <div class=\"col-10\">\n                    <h5>Trade with <span class=\"font-weight-bold\" data-userid=\"").concat(e,"\">Loading...</span></h5>\n                </div>\n            </div>\n\n            <div class=\"row\">\n                <div class=\"col-12\">\n                    <hr />\n                </div>\n            </div>\n\n            <div class=\"row\">\n                <div class=\"col-12\">\n                    <h5 style=\"\">").concat(j,"</h5>\n                    <p style=\"font-size:0.75rem;\">Total Value: ").concat(number_format(n)," ").concat(q,"</p>\n                    <div class=\"row\">\n                        ").concat(d,"\n                    </div>\n                </div>\n            </div>\n            <div class=\"row\">\n                <div class=\"col-12\">\n                    <hr />\n                </div>\n            </div>\n            <div class=\"row\">\n                <div class=\"col-12\">\n                    <h5 style=\"\">").concat(i,"</h5>\n                    <p style=\"font-size:0.75rem;\">Total Value: ").concat(number_format(o)," ").concat(p,"</p>\n                    <div class=\"row\">\n                        ").concat(h,"\n                    </div>\n                </div>\n            </div>\n            <div class=\"row\" style=\"margin-top:1rem;\">\n                <div class=\"col-6\">\n                    <button type=\"button\" class=\"btn btn-outline-success modify-trade-state\" style=\"width:100%;\" data-accept=\"true\">").concat(k,"</button>\n                </div>\n                <div class=\"col-6\">\n                    ").concat(r,"\n                </div>\n            </div>\n            \n            ")),setUserNames([e]),setUserThumbs([e]);var s=function(){$("#tradesGrid").children().each(function(){$(this).css("opacity","1")})};$(document).on("click",".modify-trade-state",function(b){var e={dismiss:!("true"!==$(this).attr("data-dismiss"))&&"cancel",value:!("true"!==$(this).attr("data-accept"))};b.preventDefault(),"outbound"===c&&(void 0,e.dismiss&&"backdrop"===e.dismiss||(e.dismiss&&"cancel"===e.dismiss?questionYesNo("Are you sure you want to cancel this trade?",function(){loading(),$(this).off(),$("#current-trade-card-body").empty(),s(),request("/staff/economy/trades/"+a+"?userId="+currentUserId,"DELETE").then(function(){success("The trade has been deleted",function(){loadTrades(c,0)})})["catch"](function(a){void 0,warning(a.responseJSON.message)})}):e.value&&($(this).off(),$("#current-trade-card-body").empty(),s()))),"inbound"===c&&(e.dismiss&&"backdrop"===e.dismiss||(e.dismiss&&"cancel"===e.dismiss?questionYesNo("Are you sure you want to cancel this trade?",function(){loading(),$(this).off(),$("#current-trade-card-body").empty(),s(),request("/staff/economy/trades/"+a+"?userId="+currentUserId,"DELETE").then(function(){success("The trade has been deleted",function(){loadTrades(c,0)})})["catch"](function(a){void 0,warning(a.responseJSON.message)})}):e.value&&questionYesNo("Are you sure you want to accept this trade?",function(){loading(),$(this).off(),$("#current-trade-card-body").empty(),s(),request("/staff/economy/trades/"+a+"?userId="+currentUserId,"POST").then(function(){success("The trade has been accepted! You can view your new item(s) in your inventory.",function(){loadTrades(c,0)})})["catch"](function(a){void 0,warning(a.responseJSON.message)})})))})})["catch"](function(){void 0,warning("This trade does not seem to exist. Please reload the page, and try again.")})});