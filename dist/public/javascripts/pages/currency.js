"use strict";request("/billing/currency/products","GET").then(function(a){$("#currencyOptions").empty();var b=[];a.forEach(function(a){var c="<span>&emsp;</span>";0!==a.bonusCatalogId&&(c="<span style=\"font-weight:800;\">Bonus Item: </span><a href=\"/catalog/".concat(a.bonusCatalogId,"/--\" target=\"_blank\"><span data-catalogid=\"").concat(a.bonusCatalogId,"\"></span></a>"),b.push(a.bonusCatalogId));var d=a.currencyAmount,e=10*a.currencyAmount;$("#currencyOptions").append("\n            <div class=\"col-12 col-md-6\" style=\"margin-bottom:0.5rem;\">\n                <div class=\"card\">\n                    <div class=\"card-body\">\n                        <h1>"+formatCurrency(1)+" "+number_format(d)+"<span style=\"font-weight:400;font-size: 1.25rem;\"> $"+a.usdPrice+" USD</span></h1>\n                        <p style=\"overflow: hidden;white-space: nowrap;text-overflow: ellipsis;\">"+c+"</p>\n                        <p><small>Converts to "+formatCurrency(2)+" "+number_format(e)+" with our conversion system</small></p>\n                        <button type=\"button\" class=\"btn btn-success onClickPurchaseCurrency\" data-price=\""+a.usdPrice+"\" data-id=\""+a.currencyProductId+"\" style=\"width:100%;margin-top:0.5rem;\">Purchase</button>\n                    </div>\n                </div>\n            </div>")}),setCatalogNames(b)})["catch"](function(){$("#alerts").show()}),void 0,$(document).on("click",".onClickPurchaseCurrency",function(){var a=parseFloat($(this).attr("data-price")),b=parseInt($(this).attr("data-id")),c=$(this).parent().parent().parent().clone();$(c).find("button").hide(),$(c).attr("class",""),$("#currencyPurchaseArea").append(c),$("#currencyOptions").fadeOut(100),setTimeout(function(){$("#currencyPurchase").fadeIn(100)},100),$("#currencyPurchasePaypal").html("\n    <button type=\"button\" class=\"btn btn-success onClickStartTransaction\" data-id=\"".concat(b,"\" style=\"width:100%;margin-top:0.5rem;\"><i class=\"fab fa-bitcoin\"></i> Continue to Coin Payments</button>\n    "))}),$(document).on("click",".onClickStartTransaction",function(){var a=this;note("Note: After payment, your transaction will be in a confirming state. This may take anywhere from 2 minutes to 24 hours, depending on network congestion. After the payment is confirmed, you will recieve the product you purchased.",function(){loading(),request("/billing/bitcoin/currency/purchase","POST",JSON.stringify({currencyProductId:parseInt($(a).attr("data-id"))})).then(function(a){window.location.href=a.url})["catch"](function(a){warning(a.responseJSON.message)})})}),$(document).on("click","#goBackToPurchaseScreen",function(a){a.preventDefault(),$("#currencyPurchaseArea").empty(),$("#currencyPurchasePaypal").empty(),$("#currencyPurchase").fadeOut(100),setTimeout(function(){$("#currencyOptions").fadeIn(100)},100)});














