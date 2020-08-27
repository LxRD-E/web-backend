"use strict";request("/auth/moderation/history","GET").then(function(a){var b=$("#moderation-history").empty();if(0===a.length)return void b.append("<p>Your account has no moderation history. Good job :)</p>");b.append("\n        \n        <div class=\"row\">\n            <div class=\"col-12\">\n                <table class=\"table\">\n                    <thead>\n                    <tr>\n                        <th scope=\"col\" style=\"border-top: none;\">#</th>\n                        <th scope=\"col\" style=\"border-top: none;\">Reason</th>\n                        <th scope=\"col\" style=\"border-top: none;\">Date</th>\n                        <th scope=\"col\" style=\"border-top: none;\">Expired</th>\n                        <th scope=\"col\" style=\"border-top: none;\">Terminated?</th>\n                    </tr>\n                    </thead>\n                    <tbody></tbody>\n                </table>\n            </div>\n        </div>\n        \n        ");var c=b.find("tbody"),d=!0,e=!1,f=void 0;try{for(var g,h=a[Symbol.iterator]();!(d=(g=h.next()).done);d=!0){var i=g.value,j="No";1===i.terminated&&(j="Yes"),c.append("\n        <tr>\n            <th scope=\"row\">".concat(i.moderationActionId,"</th>\n            <td>").concat(xss(i.reason),"</td>\n            <td>").concat(moment(i.createdAt).fromNow(),"</td>\n            <td>").concat(moment(i.until).fromNow(),"</td>\n            <td>").concat(j,"</td>\n        </tr>\n        "))}}catch(a){e=!0,f=a}finally{try{d||null==h["return"]||h["return"]()}finally{if(e)throw f}}})["catch"](function(a){console.log(a),warning(a.responseJSON.message)});











