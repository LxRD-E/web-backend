"use strict";var currencyProductId=0;request("/billing/currency/products").then(function(a){$("#currencyProductSelection").empty();var b=[],c=!0,d=!1,e=void 0;try{for(var f,g=a[Symbol.iterator]();!(c=(f=g.next()).done);c=!0){var h=f.value,i="";0!==h.bonusCatalogId&&(i="(+ a <span data-catalogid=\""+h.bonusCatalogId.toString()+"\"></span>)",b.push(h.bonusCatalogId)),$("#currencyProductSelection").append("\n        <div class=\"col-sm-12 col-md-6 col-4 onClickSelectItem\" style=\"padding-bottom:0.5rem;\" data-selected=\"false\" data-productid=\"".concat(h.currencyProductId,"\" data-bonusid=\"").concat(h.bonusCatalogId,"\" data-usd=\"").concat(h.usdPrice,"\" data-amt=\"").concat(h.currencyAmount,"\">\n            <div class=\"card\">\n                <div class=\"card-body\">\n                    <p class=\"text-center\">$").concat(h.usdPrice," USD - ").concat(h.currencyAmount," Primary ").concat(i,"</p>\n                </div>\n            </div>\n        </div>"))}}catch(a){d=!0,e=a}finally{try{c||null==g["return"]||g["return"]()}finally{if(d)throw e}}setCatalogNames(b)})["catch"](function(a){warning(a.responseJSON.message)}),$(document).on("click",".onClickSelectItem",function(){"true"===$(this).attr("data-selected")?($(this).attr("data-selected","false"),$(this).find(".card").css("border","none")):($("#currencyProductSelection").children().each(function(){$(this).attr("data-selected","false"),$(this).find(".card").css("border","none")}),$(this).attr("data-selected","true"),$(this).find(".card").css("border","1px solid green"),$("#bonusCatalogId").val($(this).attr("data-bonusid")),$("#usdPrice").val($(this).attr("data-usd")),$("#currencyAmount").val($(this).attr("data-amt")),currencyProductId=parseInt($(this).attr("data-productid"),10))}),$(document).on("click","#updateCurrencyProduct",function(){var a=parseInt($("#currencyAmount").val(),10),b=parseFloat($("#usdPrice").val()),c=parseInt($("#bonusCatalogId").val(),10);request("/billing/currency/product/"+currencyProductId,"PATCH",JSON.stringify({usdPrice:b,currencyAmount:a,bonusCatalogId:c})).then(function(){success("This item has been updated.",function(){window.location.href="/staff"})})["catch"](function(a){warning(a.responseJSON.message)})});















