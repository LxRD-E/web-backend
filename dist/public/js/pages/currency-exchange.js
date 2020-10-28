"use strict";"true"!==localStorage.getItem("has-seen-forex-warning")&&note("Trading virtual currencies is dangerous, and can lead to large loses. Nobody will be able to assist you in the event of a currency crash. Only trade what you can afford to lose.",function(){localStorage.setItem("has-seen-forex-warning","true")});var reloadBalance=function(){return request("/auth/current-user","GET").then(function(a){$("#currencyBalanceOne").attr("data-original-title","$"+a.primaryBalance.toString()).attr("data-amt",a.primaryBalance.toString()).html(bigNum2Small(a.primaryBalance)),$("#currencyBalanceTwo").attr("data-original-title","$"+a.secondaryBalance.toString()).attr("data-amt",a.secondaryBalance.toString()).html(bigNum2Small(a.secondaryBalance))})};setInterval(function(){reloadBalance()},15e3);var currentMode=2,twentyFourHourAvg=0,_oldChartJson="",_isLockedChart=!1,loadChart=function(a){if(!_isLockedChart)return _isLockedChart=!0,request("/currency-exchange/positions/charts/"+a,"GET").then(function(b){_isLockedChart=!1;var c=JSON.stringify(b);if(c!==_oldChartJson){_oldChartJson=c,$("#chartContainer").empty();var d="",e="";1===a?(d="Rate per 1 secondary",$("#chart-heading").html(formatCurrency(2)+" to "+formatCurrency(1)+" Price History"),e="rgb(40, 167, 69)"):(d="Rate per 1 primary",$("#chart-heading").html(formatCurrency(1)+" to "+formatCurrency(2)+" Price History"),e="rgb(255, 193, 7)");var f=$("#latest-transactions");f.empty();var g=[],h=[],i=0,j=[];b.forEach(function(b){g.push(b.rate),h.push(new Date(b.createdAt).toISOString()),twentyFourHourAvg+=b.rate,50<i||(j.push(b.buyerUserId,b.sellerUserId),f.append("\n            \n            <div class=\"row\">\n                <div class=\"col-12\">\n                    <p style=\"font-size:0.75rem;\"><span data-userid=\"".concat(b.buyerUserId,"\">Loading...</span> purchased <span class=\"font-weight-bold\">").concat(formatCurrency(a,"0.75rem")).concat(number_format(b.amountPurchased),"</span> for <span class=\"font-weight-bold\">").concat(formatCurrency(1===a?2:1,"0.75rem")).concat(number_format(b.amountSold),"</span> from <span data-userid=\"").concat(b.sellerUserId,"\">Loading...</span> ").concat(moment(b.createdAt).fromNow()," (rate: <span class=\"font-weight-bold\">").concat(b.rate,"</span>)</p>\n                    <hr />\n                </div>\n                            \n            </div>\n                            \n            ")),i++)}),setUserNames(j),setUserThumbs(j),twentyFourHourAvg/=b.length;var k="#212529",l="light";1===getTheme()&&(k="#FFFFFF",l="dark");var m={series:[{name:d,data:g}],chart:{height:350,type:"area",foreColor:k},dataLabels:{enabled:!1},stroke:{curve:"smooth"},xaxis:{type:"datetime",categories:h,foreColor:k},colors:[e],tooltip:{theme:l,x:{format:"dd/MM/yy HH:mm"}}},n=new ApexCharts(document.querySelector("#chartContainer"),m);n.render()}})};setInterval(function(){_isLockedChart||loadChart(currentMode)},2500);var isBestPositionsLoading=!1,attempts=0,loadBestPositions=function(a){if(!isBestPositionsLoading)return isBestPositionsLoading=!0,request("/currency-exchange/positions/currency-type/"+a).then(function(a){isBestPositionsLoading=!1;var b=$("#all-positions");/*
        if (attempts >= 3) {
            d[0]['balance'] = d[0]['balance'] + 100;
        }
        if (attempts >= 4) {
            d[0]['rate'] = d[1]['rate'] + 25.9;
        }
        let _newArr = [];
        if (attempts >= 6) {
            d.forEach((el, i) => {
                console.log(i);
                if (i !== 0) {
                    _newArr.push(el);
                }
            })
            d = _newArr;
        }
        isBestPositionsLoading=false;
        */ // el.empty();
if(attempts++,1===attempts&&(b.empty(),b.append("\n<div class=\"row\">\n    <div class=\"col-3\">You Give</div>\n    <div class=\"col-3\">You Get</div>\n    <div class=\"col-3\">Available</div>\n</div>")),0===a.length)attempts=0,b.empty().append("<p>There are no open positions for this query.</p>");else{// First, lets go through all the children
var c=[];$(".currency-exchange-entry").each(function(){var b=parseInt($(this).attr("data-id")),d=parseFloat($(this).attr("data-rate")),e=parseInt($(this).attr("data-balance")),f=!1;// No longer exists
if(a.forEach(function(a){a.positionId===b&&(f=a)}),!f)return void $(this).fadeOut(250).delay(250).remove();c.push(b);var g=!1;if(f.balance!==e&&($(this).find(".full-rate-formatted").html("".concat(formatCurrency(1===f.currencyType?2:1,"0.85rem")).concat(f.rate)),$(this).find(".full-balance").find("p").html("".concat(formatCurrency(f.currencyType,"0.85rem")).concat(number_format(f.balance))),$(this).find(".amount-to-buy").attr("data-balance",f.balance),g=!0),f.rate!==d&&($(this).find(".amount-to-buy").attr("data-rate",f.rate),g=!0),g){var h=$(this).find(".amount-to-buy"),i=parseFloat($(h).attr("data-rate")),j=parseInt($(h).attr("data-balance"),10),k=parseInt($(h).val(),10),l=parseInt($(h).attr("data-currencytype"),10),m=Math.trunc(100*(k*i))/100;isNaN(m)&&(m=0),isNaN(k)?(k=0,$(h).parent().find(".submit-buy-position").attr("disabled","disabled")):k>j?(k=j,$(h).parent().find(".submit-buy-position").attr("disabled","disabled")):1>m||m.toString().includes(".")?$(h).parent().find(".submit-buy-position").attr("disabled","disabled"):$(h).parent().find(".submit-buy-position").removeAttr("disabled"),$(h).parent().find(".youll-pay").html("".concat(formatCurrency(1===l?2:1))+m),$(h).attr("data-youll-pay",m)}});var d=[];a.forEach(function(a){if(!c.includes(a.positionId)){d.push(a.userId);var e="<button type=\"button\" class=\"btn btn-success buy-position\" style=\"padding-top:0.25rem;padding-bottom:0.25rem;font-size:0.85rem;float:right;\" data-id=\"".concat(a.positionId,"\">Buy</button>");a.userId===userId&&(e="<button type=\"button\" class=\"btn btn-success\" style=\"padding-top:0.25rem;padding-bottom:0.25rem;font-size:0.85rem;float:right;\" disabled=\"disabled\"><span title=\"You are selling this.\" data-buyposition-tooltip-toggle=\"true\">Buy</span></button>"),b.append("\n              \n              <div class=\"row currency-exchange-entry\" data-id=\"".concat(a.positionId,"\" data-rate=\"").concat(a.rate,"\" data-balance=\"").concat(a.balance,"\">\n                    <div class=\"col-3\">\n                        <p style=\"font-size:0.85rem;\" class=\"full-rate-formatted\">").concat(formatCurrency(1===a.currencyType?2:1,"0.85rem")).concat(a.rate,"</p>\n                    </div>\n                    <div class=\"col-3\">\n                        <p style=\"font-size:0.85rem;\">\n                            ").concat(formatCurrency(a.currencyType,"0.85rem"),"1\n                        </p>\n                    </div>\n                    <div class=\"col-6\" class=\"full-balance\">\n                        <p style=\"font-size:0.85rem;float:left;\">").concat(formatCurrency(a.currencyType,"0.85rem")).concat(number_format(a.balance),"</p>\n                        ").concat(e,"\n                    </div>\n                    <div class=\"col-12 open-position-full\" data-id=\"").concat(a.positionId,"\" style=\"display:none;\">\n                        <div class=\"row\" style=\"margin-top:1rem;\">\n                            <div class=\"col-3\">\n                                <img src=\"").concat(window.subsitutionimageurl,"\" data-userid=\"").concat(a.userId,"\" style=\"width:100%;\" />\n                                <p data-userid=\"").concat(a.userId,"\" style=\"font-size:0.75rem;\">Loading...</p>\n                            </div>\n                            <div class=\"col-9\">\n                                <input type=\"text\" class=\"form-control amount-to-buy\" placeholder=\"Amount of the currency you want to buy.\" style=\"font-size:0.75rem;\" data-rate=\"").concat(a.rate,"\" data-balance=\"").concat(a.balance,"\" data-currencytype=\"").concat(a.currencyType,"\">\n                                <p style=\"font-size:0.75rem;margin-top:1rem;\">You'll Pay: <span class=\"youll-pay\">").concat(formatCurrency(1===a.currencyType?2:1),"0</span></p>\n                                <button type=\"button\" class=\"btn btn-outline-success submit-buy-position\" style=\"padding-top:0.25rem;padding-bottom:0.25rem;font-size:0.85rem;float:right;\" data-id=\"").concat(a.positionId,"\" disabled=\"disabled\">Submit</button>\n                            </div>\n                        </div>\n                    \n                    </div>\n                    <div class=\"col-12\">\n                        <hr />\n                    </div>\n               </div>\n               \n              \n              "))}// skip
}),setUserNames(d),setUserThumbs(d),$("[data-buyposition-tooltip-toggle=\"true\"]").tooltip()}})};setInterval(function(){console.log("load best positions"),loadBestPositions(currentMode)},2500),$(document).on("input",".amount-to-buy",function(){var a=parseFloat($(this).attr("data-rate")),b=parseInt($(this).attr("data-balance"),10),c=parseInt($(this).val(),10),d=parseInt($(this).attr("data-currencytype"),10),e=Math.trunc(100*(c*a))/100;isNaN(e)&&(e=0),isNaN(c)?(c=0,$(this).parent().find(".submit-buy-position").attr("disabled","disabled")):c>b?(c=b,$(this).parent().find(".submit-buy-position").attr("disabled","disabled")):1>e||e.toString().includes(".")?$(this).parent().find(".submit-buy-position").attr("disabled","disabled"):$(this).parent().find(".submit-buy-position").removeAttr("disabled"),$(this).parent().find(".youll-pay").html("".concat(formatCurrency(1===d?2:1))+e),$(this).attr("data-youll-pay",e)}),$(document).on("click",".submit-buy-position",function(){var a=parseInt($(this).parent().find(".amount-to-buy").val(),10),b=parseInt($(this).parent().find(".amount-to-buy").attr("data-currencytype"),10),c=parseInt($(this).parent().find(".amount-to-buy").attr("data-youll-pay"),10),d=parseInt($(this).attr("data-id"),10);questionYesNoHtml("Please confirm that you would like to buy ".concat(formatCurrency(b)).concat(a," for ").concat(formatCurrency(1===b?2:1)).concat(c,"."),function(){loading(),request("/currency-exchange/positions/"+d+"/purchase","POST",{amount:a}).then(function(){success("Your transaction has been completed."),loadMyPositions(currentMode),loadBestPositions(currentMode),reloadBalance()})["catch"](function(a){warning(a.responseJSON.message)})})}),$(document).on("click",".buy-position",function(){var a=parseInt($(this).attr("data-id"),10),b=$(".open-position-full[data-id=\""+a+"\"]");"true"===$(this).attr("data-open")?($(this).attr("data-open","false"),b.hide()):($(this).attr("data-open","true"),b.show())});var loadMyPositions=function(){return request("/currency-exchange/positions/users/"+userId).then(function(a){var b=$("#my-positions");b.empty(),0===a.length?b.append("<p>You do not have any open positions.</p>"):(b.append("\n<div class=\"row\">\n    <div class=\"col-3\">You Give</div>\n    <div class=\"col-3\">You Get</div>\n    <div class=\"col-3\">Available</div>\n</div>\n                    "),a.forEach(function(a){b.append("\n               \n               <div class=\"row\">\n                    <div class=\"col-3\">\n                        <p style=\"font-size:0.85rem;\">\n                            ".concat(formatCurrency(a.currencyType,"0.85rem"),"1\n                        </p>\n                    </div>\n                    <div class=\"col-3\">\n                        <p style=\"font-size:0.85rem;\">").concat(formatCurrency(1===a.currencyType?2:1,"0.85rem")).concat(a.rate,"</p>\n                    </div>\n                    <div class=\"col-6\">\n                        <p style=\"font-size:0.85rem;float:left;\">").concat(formatCurrency(a.currencyType,"0.85rem")).concat(number_format(a.balance),"</p>\n                        <button type=\"button\" class=\"btn btn-outline-danger close-position\" style=\"padding-top:0.25rem;padding-bottom:0.25rem;font-size:0.85rem;float:right;\" data-id=\"").concat(a.positionId,"\">Close</button>\n                    </div>\n                    <div class=\"col-12\">\n                        <hr />\n                    </div>\n               </div>\n               \n               \n               "))}))})};Promise.all([loadChart(currentMode),loadMyPositions(currentMode),loadBestPositions(currentMode)]).then(function(){$("#type-selection").removeAttr("disabled")}),$("#type-selection").change(function(){var a=this;$(this).attr("disabled","disabled"),currentMode=parseInt($(this).val()),Promise.all([loadChart(currentMode),loadMyPositions(currentMode),loadBestPositions(currentMode)]).then(function(){$(a).removeAttr("disabled")})}),$(document).on("click",".close-position",function(){$(this).attr("disabled","disabled"),request("/currency-exchange/positions/"+$(this).attr("data-id")+"/","DELETE").then(function(){loadMyPositions(currentMode),loadBestPositions(currentMode),reloadBalance()})["catch"](function(a){console.error(a)})}),$(document).on("click",".new-position",function(){var a=$("body");a.find("#open-new-position-modal").remove(),a.append("<!-- Modal -->\n    <div class=\"modal fade\" id=\"open-new-position-modal\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"exampleModalCenterTitle\" aria-hidden=\"true\">\n          <div class=\"modal-dialog modal-dialog-centered\" role=\"document\">\n                 <div class=\"modal-content\">\n                     <div class=\"modal-header\">\n                            <h5 class=\"modal-title\">New Position</h5>\n                            <button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\">\n                                <span aria-hidden=\"true\">&times;</span>\n                            </button>\n                     </div>\n                     <div class=\"modal-body\">\n                            <div class=\"row\">\n                                <div class=\"col-12\">\n                                    <p>Sell your ".concat(formatCurrency(currentMode)," for ").concat(formatCurrency(1===currentMode?2:1),"</p>\n                                </div>\n                                <div class=\"col-12\" style=\"margin-top:1rem;margin-bottom:1rem;\">\n                                    <input id=\"new-position-rate\" type=\"text\" class=\"form-control\" placeholder=\"Rate you want to sell your currency at.\" style=\"font-size:0.75rem;\">\n                                </div>\n                                <div class=\"col-12\">\n                                    <input id=\"new-position-amount\" type=\"text\" class=\"form-control\" placeholder=\"Amount of currency you want to sell.\" style=\"font-size:0.75rem;\">\n                                </div>\n                            \n                            </div>\n                     </div>\n                      <div class=\"modal-footer\" style=\"border:none;\">\n                            <button type=\"button\" class=\"btn btn-secondary\" data-dismiss=\"modal\">Close</button>\n                            <button type=\"button\" class=\"btn btn-success create-new-position-submit\">Submit</button>\n                      </div>\n                </div>\n          </div>\n    </div>\n")),$("#open-new-position-modal").modal()}),$(document).on("click",".create-new-position-submit",function(){$(this).attr("disabled","disabled");var a=$("#new-position-rate").attr("disabled","disabled"),b=$("#new-position-amount").attr("disabled","disabled");// do stuff
request("/currency-exchange/positions/create","POST",{balance:parseInt(b.val(),10),currency:currentMode,rate:parseFloat(a.val())}).then(function(){success("Your position has been created."),loadMyPositions(currentMode),loadBestPositions(currentMode),reloadBalance()})["catch"](function(a){warning(a.responseJSON.message)})["finally"](function(){$("#open-new-position-modal").modal("toggle")})});



































