"use strict";request("/ad/my/created-ads","GET").then(function(a){if(0===a.length)return $("#running-ads").empty().append("<p>You have not created any ads.</p>");$("#running-ads").empty();var b=[],c=[],d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done);d=!0){var i=g.value,j=window.subsitutionimageurl;i.imageUrl&&(j=i.imageUrl),i.title&&""!=i.title||(i.title="N/A");var k="",l="";1===i.adType?(k="Catalog",c.push(i.adRedirectId),l="<a href=\"/catalog/"+i.adRedirectId+"\"/<span data-catalogid=\""+i.adRedirectId+"\">Loading...</span></a>"):2===i.adType?(k="Group",b.push(i.adRedirectId),l="<a href=\"/groups/"+i.adRedirectId+"\"/<span data-groupid=\""+i.adRedirectId+"\">Loading...</span></a>"):3===i.adType&&(k="Forum Thread",l="<a href=\"/forum/thread/"+i.adRedirectId+"?page=1\">Forum Thread</a>");var m="<p style=\"font-weight:500;cursor:pointer;\" class=\"onClickRunAd\" data-id=\""+i.adId+"\">Status: <span style=\"color:red;\">Not Running</span> (click me to run)</p>";0!==i.bidAmount&&moment(i.updatedAt).add(24,"hours").isSameOrAfter(moment())&&(m="<p style=\"font-weight:500;\">Status: <span style=\"color:green;\">Running</span> (for "+moment(i.updatedAt).fromNow(!0)+")</p>");var n="<p>Error</p>";1===i.adDisplayType?n="<a href=\"".concat(j,"\" target=\"_blank\"><img src=\"").concat(j,"\" style=\"width:100%;height:auto;display:block;margin:0 auto;max-width:700px;\" /></a>"):2===i.adDisplayType&&(n="<a href=\"".concat(j,"\" target=\"_blank\"><img src=\"").concat(j,"\" style=\"width:80px;height:auto;display:block;margin:0 auto;max-width:160px;\" /></a>")),$("#running-ads").append("\n        \n        <div class=\"row\">\n            <div class=\"col-6 col-md-4 col-lg-3\">\n                ".concat(n,"\n            </div>\n            <div class=\"col-6 col-md-8 col-lg-9\">\n                <h2 style=\"font-size:1.25rem;margin-bottom:0;\">").concat(i.title.escape(),"</h2>\n                <p>").concat(k," advertisement for ").concat(l,"</p>\n                ").concat(m,"\n            </div>\n            <div class=\"col-12\">\n                <p>Stats:</p>\n                <div class=\"row\">\n                    <div class=\"col-6 col-lg-3\">\n                        <p title=\"Clicks: ").concat(i.clicks,"\">CTR: ").concat(0===i.clicks?0:Math.trunc(100*(i.clicks/i.views)),"%</p>\n                    </div>\n                    <div class=\"col-6 col-lg-3\">\n                        <p>Views: ").concat(number_format(i.views),"</p>\n                    </div>\n                    <div class=\"col-6 col-lg-3\">\n                        <p title=\"Total Clicks: ").concat(i.totalClicks,"\">Total CTR: ").concat(0===i.totalClicks?0:Math.trunc(100*(i.totalClicks/i.totalViews)),"%</p>\n                    </div>\n                    <div class=\"col-6 col-lg-3\">\n                        <p>Total Views: ").concat(number_format(i.totalViews),"</p>\n                    </div>\n                </div>\n            </div>\n            <div class=\"col-12\">\n                <hr />\n            </div>\n        </div>\n\n        \n        "))}}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}setGroupNames(b),setCatalogNames(c)})["catch"](function(){$()}),$(document).on("click",".onClickRunAd",function(a){a.preventDefault();var b=$(this).attr("data-id");question("How much primary currency would you like to bid?",function(a){if(a)return a=parseInt(a,10),isNaN(a)||1e5<a||1>a?warning("Please specify a valid number between 1 and 100,000."):void(// create
console.log(a),loading(),request("/ad/"+b+"/bid","POST",{amount:a}).then(function(a){return console.log(a),success("Your bid has been placed.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message)}))})});









