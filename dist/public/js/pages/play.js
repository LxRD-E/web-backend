"use strict";request("/game/search").then(function(a){var b=[],c=[],d=$("#topTwoGames"),e=0,f=!0,g=!1,h=void 0;try{for(var i,j,k=a[Symbol.iterator]();!(f=(i=k.next()).done);f=!0){if(j=i.value,0===e||1===e){var l=j.thumbnailAssetId,m="";0===l?m="<img src=\"https://cdn.hindigamer.club/game/default_assets/Screenshot_5.png\" style=\"width:100%;object-fit: fill;display:block;margin: 0 auto;height: 200px;\" />":(m="<img data-catalogid=\"".concat(l,"\" style=\"width:100%;object-fit: fill;display:block;margin: 0 auto;height: 200px;\" />"),c.push(l)),d.append("\n            <div class=\"col-12 col-md-6\">\n            <div class=\"card\">\n                <a href=\"/game/".concat(j.gameId,"\" class=\"hidehover\">\n                    <div class=\"card-body\" style=\"cursor:pointer;\">\n                        <div class=\"row\">\n                            <div class=\"col-12\">\n                                <h1 style=\"overflow: hidden;\n                                white-space: nowrap;\n                                text-overflow: ellipsis;\">").concat(filterXSS(j.gameName),"</h1>\n                            </div>\n                            <div class=\"col-6 col-md-8\">\n                                ").concat(m,"\n                            </div>\n                            <div class=\"col-6 col-md-4\">\n                                <img src=\"\" data-userid=\"").concat(j.creatorId,"\" style=\"width:100%;\" />\n                                Created By <span data-userid=\"").concat(j.creatorId,"\"></span>\n                            </div>\n                        </div>\n                        <div class=\"row\">\n                            <div class=\"col-12\" style=\"padding-top:1rem;\">\n                                <p>").concat(j.playerCount," Playing</p>\n                            </div>\n                        </div>\n                    </div>\n                </a>\n            </div>\n        </div>"))}else{var n=j.iconAssetId,o="";0===n?o="<img src=\"https://cdn.hindigamer.club/game/default_assets/Screenshot_5.png\" style=\"width:100%;object-fit: fill;display:block;margin: 0 auto;height: 150px;\" />":(o="<img data-catalogid=\"".concat(n,"\" style=\"width:100%;object-fit: fill;display:block;margin: 0 auto;height: 150px;\" />"),c.push(n)),$("#popularGamesList").append("\n            <div class=\"col-6 col-md-4 col-lg-3\">\n                <div class=\"card\">\n                    <a href=\"/game/".concat(j.gameId,"\" class=\"hidehover\">\n                        <div class=\"card-body\" style=\"cursor:pointer;\">\n                            <div class=\"row\">\n                                <div class=\"col-12\">\n                                    <h1 style=\"overflow: hidden;\n                                    white-space: nowrap;\n                                    text-overflow: ellipsis;font-size:1rem;\">").concat(filterXSS(j.gameName),"</h1>\n                                </div>\n                                <div class=\"col-12\">\n                                    ").concat(o,"\n                                </div>\n\n                            </div>\n                            <div class=\"row\" style=\"padding-top:1rem;\">\n                                <div class=\"col-12\">\n                                    <p>").concat(j.playerCount," Playing</p>\n                                </div>\n                            </div>\n                        </div>\n                    </a>\n                </div>\n            </div>\n            \n            "))}0===j.creatorType&&b.push(j.creatorId),e++}}catch(a){g=!0,h=a}finally{try{f||null==k["return"]||k["return"]()}finally{if(g)throw h}}setUserNames(b),setUserThumbs(b),setCatalogThumbs(c)})["catch"](function(a){warning(a.responseJSON.message)});