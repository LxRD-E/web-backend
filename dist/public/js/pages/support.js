"use strict";request("/support/my/tickets").then(function(a){if(0===a.length)return $("#existing-tickets").find("p").text("You have not created any tickets.");$("#existing-tickets").empty();var b=!0,c=!1,d=void 0;try{for(var e,f=a[Symbol.iterator]();!(b=(e=f.next()).done);b=!0){var g=e.value,h="Awaiting Support Response";2===g.ticketStatus?h="Awaiting Your Response":3===g.ticketStatus&&(h="Closed"),$("#existing-tickets").append("\n        \n        <div class=\"row\">\n            <div class=\"col-12 col-lg-6\">\n                <a href=\"/support/ticket/".concat(g.ticketId,"\">\n                    <h2 style=\"font-size:1rem;margin-bottom:0;\">").concat(g.ticketTitle.escape(),"</h2>\n                </a>\n                <p>Created ").concat(moment(g.createdAt).fromNow(),"</p>\n                <p>Latest Update: ").concat(moment(g.updatedAt).fromNow(),"</p>\n                <p>Status: ").concat(h,"</p>\n                <hr />\n            </div>\n        </div>\n        \n        "))}}catch(a){c=!0,d=a}finally{try{b||null==f["return"]||f["return"]()}finally{if(c)throw d}}})["catch"](function(){}),$(document).on("click","#createReply",function(a){a.preventDefault(),loading(),request("/support/ticket/create","POST",{body:$("#body").val(),title:$("#title").val(),v2Token:grecaptcha.getResponse()}).then(function(){window.location.reload()})["catch"](function(a){return warning(a.responseJSON.message)})});










