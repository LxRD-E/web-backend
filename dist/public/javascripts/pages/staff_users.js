"use strict";search();function search(){$("#userSearchResultsDiv").children().each(function(){$(this).css("opacity",.5)}),request("/staff/search?offset=0").then(function(a){$("#userSearchResultsDiv").empty();var b=[];a.forEach(function(a){a.status=null===a.status?"\"\"":"\""+a.status+"\"",a.staff=1<=a.staff?"<p style=\"margin-bottom: 0;color:red;opacity: 0.75;\"><i class=\"fas fa-user-shield\" data-toggle=\"staffTooltip\" data-placement=\"top\" title=\"This user is an administrator.\"></i></p>":"",$("#userSearchResultsDiv").append("\n            <div class=\"col-12\" >\n                <div class=\"card\">\n                    <div class=\"card-body\">\n                        <div class=\"row\">\n                            <div class=\"col-3 col-md-2 col-lg-1\">\n                                <a href=\"/users/"+a.userId+"/profile\">\n                                    <img src=\"\" data-userid=\""+a.userId+"\" style=\"width: 100%;margin: 0 auto;max-width: 150px; display: block;\" />\n                                    "+a.staff+"\n                                </a>\n                            </div>\n                            <div class=\"col-7 col-md-8 col-lg-11\">\n                                <a href=\"/users/"+a.userId+"/profile\"><h5>"+a.username+"</h5></a>\n                                <p>"+a.status.escape()+"</p>\n                                <p>Last Online: "+moment(a.lastOnline).local().fromNow()+"</p>\n                            </div>\n                            <div class=\"col-12\">\n                                <hr style=\"margin-bottom: 0;\" />\n                            </div>\n                        </div>\n                    </div>\n                </div>\n            </div>"),b.push(a.userId),$("[data-toggle=\"staffTooltip\"]").tooltip()}),25<=a.length?(window.searchOffset+=25,$(".loadMorePlayer").show()):(window.searchOffset=0,$(".loadMorePlayer").hide()),0>=a.length&&$("#userSearchResultsDiv").append("<div class=\"col-12\"><h3 class=\"text-center\" style=\"margin-top:1rem;\">Your search query returned 0 results.</h3></div>"),setUserThumbs(b),$("html, body").animate({scrollTop:0},250)})["catch"](function(){})}












