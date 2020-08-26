"use strict";var offset=0,limit=100,sortBy=1,total=0,isLoading=!1,areMoreAvailable=!0,profileId=parseInt($("#profiledata").attr("data-userid"),10),loadGames=function(){isLoading||(isLoading=!0,request("/game/search?genre=1&sortBy="+sortBy+"&limit="+limit+"&offset="+offset+"&creatorType=0&creatorId="+profileId).then(function(a){if(isLoading=!1,0===a.data.length&&0===a.total)return void $("#UserGamesDiv").empty().append("<div class=\"col-12\"><p style=\"margin-top:1rem;text-align:center;font-weight:600;\">This user has not created any games.</p></div>");total=a.total,total>offset+a.data.length?(areMoreAvailable=!0,$("#load-more-games").removeAttr("disabled")):(areMoreAvailable=!1,$("#load-more-games").attr("disabled","disabled"));var b=[],c=!0,d=!1,e=void 0;try{for(var f,g,h=a.data[Symbol.iterator]();!(c=(f=h.next()).done);c=!0){g=f.value,b.push(g.gameId);var i="<img class=\"card-img-top\" data-gameid=\"".concat(g.gameId,"\" style=\"width:100%;object-fit: fill;display:block;margin: 0 auto;height: 150px;\" />");$("#UserGamesDiv").append("\n            <div class=\"col-6 col-md-4 col-lg-3 on-hover-show-game-info-tooltip\" style=\"padding: 0 0.25rem  0.25rem 0.25rem;\">\n                <div class=\"card\">\n                    <a href=\"/game/".concat(g.gameId,"\" class=\"normal\">\n                        ").concat(i,"\n                        <div class=\"card-body\" style=\"cursor:pointer;\">\n                            <div class=\"row\">\n                                <div class=\"col-12\">\n                                    <h1 style=\"overflow: hidden;\n                                    font-size:0.85rem;\n                                    margin-bottom:0;\n                                    line-height:1rem;\n                                    height: 2rem;\n                                    \">").concat(filterXSS(g.gameName),"</h1>\n                                </div>\n\n                            </div>\n                            <div class=\"row\" style=\"padding-top:0.5rem;\">\n                                <div class=\"col-12\">\n                                    <p style=\"font-size:0.75rem;\"><span class=\"font-weight-bold\">").concat(number_format(g.playerCount),"</span> People Playing</p>\n                                </div>\n                            </div>\n                        </div>\n                    </a>\n                </div>\n                <div class=\"game-info-tooltip\">\n                    <div class=\"card\" style=\"width:100%;padding:0;\">\n                        <div class=\"card-body\" style=\"width:100%;padding:0 1rem 1rem 1rem;\">\n                            <div style=\"padding-left:0.25rem;\">\n                                <p style=\"line-height:1;font-size:0.65rem;margin-top:0.25rem;\">\n                                    <span class=\"font-weight-bold\">Last Updated</span>: ").concat(moment(g.updatedAt).fromNow(),"</a>\n                                </p>\n                            </div>\n                            <a href=\"/game/").concat(g.gameId,"\" class=\"btn btn-success\" style=\"margin-top:1rem;width:100%;\"><i class=\"fas fa-play\"></i></a>\n                        </div>\n                    </div>\n                </div>\n            </div>\n            \n            "))}}catch(a){d=!0,e=a}finally{try{c||null==h["return"]||h["return"]()}finally{if(d)throw e}}setGameThumbs(b)})["catch"](function(a){console.error(a),isLoading=!1,warning(a.responseJSON.message)}))};loadGames(),$("#sort-by").change(function(a){a.preventDefault();isLoading||(sortBy=parseInt($(this).val(),10),offset=0,$("#UserGamesDiv").empty(),loadGames())}),$(document).on("click","#load-more-games",function(){areMoreAvailable&&!isLoading&&($(this).attr("disabled","disabled"),offset+=limit,loadGames())});










