var currentUserId = $('#impersonator-info').attr('data-userid')
var curDisplay = "";
var partnerUserId = 1;
var knownUsersArray = {};
var pendingUsers = {};
function userIdToName(userid) {
    if (typeof knownUsersArray[userid] !== "undefined" && knownUsersArray[userid] !== null) {
        return knownUsersArray[userid];
    }else{
        if (typeof pendingUsers[userid] !== "undefined" && pendingUsers[userid] !== null) {
        }else{
            pendingUsers[userid] = "pending";
            request("/user/"+userid+"/info", "GET")
                .then(function(udata) {
                    knownUsersArray[userid] = udata.username;
                })
                .catch(function(e) {
                    console.log(e);
                    pendingUsers[userid] = null;
                });
        }
        return "";
    }
}

var userid = $('#userdata').attr("data-userid");
$('#transactionsBodyDisplay').parent().parent().append('<button type="button" class="btn btn-small btn-success loadMoreButtonClick" style="margin:0 auto;display: hidden;">Load More</button>');
function loadTrades(type, offset) {
    $('#tradesGrid').empty();
    $('.loadMoreButtonClick').hide();
    request("/staff/trades/"+type+"/?offset="+offset+"&userId="+currentUserId, "GET")
        .then(function(data) {
            if (data.length <= 0) {
                $('#tradesGrid').append("<div class='col-sm-12'><p class='text-center' style='margin-top:1rem;'>There are no trades to display!</p></div>");
                return;
            }
            var userThumbsArr = [];
            $.each(data, function(key, value) {
                partnerUserId = value.userId;
                userThumbsArr.push(partnerUserId);
                userIdToName(partnerUserId);
                $('#tradesGrid').append(`
                    <div class="col-6 col-sm-6 col-md-4 col-lg-2" style="margin-top:1rem;">
                        <div class="card">
                            <div class="card-body">
                                <img data-userid="`+partnerUserId+`" style="width:100%;" />
                                <div class="card-title text-center">
                                    <p style="font-size: small;">`+formatDate(value.date)+`</p>
                                    <button type="button" class="btn btn-success reviewTradeData" data-type="`+type+`" data-tradeid=`+value.tradeId+` data-useridone="`+value.userId+`" data-useridtwo="`+userId+`" data-date="`+formatDate(value.date)+`" style="width:100%;">Review</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    `)
            });
            setUserThumbs(userThumbsArr);
            if (data.length >= 25) {
                if (parseInt(window["trans_offset_"+type]) === null) {
                    window["trans_offset_type"] = 0;
                }
                window["trans_offset_"+type] = window["trans_offset_type"] + 25;;
                $('.loadMoreButtonClick').css("display", "block");
            }else{
                $('.loadMoreButtonClick').hide();
            }
        })
        .catch(function(e) {
            $('#tradesGrid').append("<div class='col-sm-12'><p class='text-center' style='margin-top:1rem;'>There are no trades to display!</p></div>")
        });
}
loadTrades("inbound", 0);
$(document).on('click', '.openTrades', function() {
    var type = $(this).html().toLowerCase();
    loadTrades(type, 0);
})

$(document).on('click', '.reviewTradeData', function() {
    loading();
    var id = parseInt($(this).attr("data-tradeid"));
    var image = $(this).parent().parent().find("img").attr("src")
    var type = $(this).attr("data-type");
    var date = $(this).attr("data-date");
    var partnerUserId = parseInt($(this).attr("data-useridone"));
    // Get Data with Catalog Info
    request("/staff/trades/"+id+"/items?userId="+currentUserId, "GET")
        .then(function(d) {
            var itemsToGiveHtml = ``;
            var itemsToRecieveHtml = ``;
            // var partnerUserId = 0;
            var itemsRecevMessage = "";
            var itemsGiveMessage = "";
            var confirmText = "";
            var showCancel = true;
            var side = 1;
            var catalogThumbsArr = [];
            d["offer"].forEach(function(v) {
                let serialText = '<p style="font-size:0.65rem;text-align:left;">Serial: N/A</p>';
                if (v.serial) {
                    serialText = '<p style="font-size:0.65rem;text-align:left;">Serial: '+v.serial+'</p>';
                }
                itemsToGiveHtml += '<div class="col-6 col-sm-4 col-md-3"><a href="/catalog/'+v["catalogId"]+'" target="_blank"><img data-catalogid="'+v["catalogId"]+'" style="width: 100%;" /></a><p class="text-truncate" style="font-size: 0.75rem;font-weight:700;text-align:left;" data-catalogid="'+v.catalogId+'">Loading</p>'+serialText+'</div>';
                catalogThumbsArr.push(v["catalogId"]);
            });
            d["requested"].forEach(function(v) {
                let serialText = '<p style="font-size:0.65rem;text-align:left;">Serial: N/A</p>';
                if (v.serial) {
                    serialText = '<p style="font-size:0.65rem;text-align:left;">Serial: '+v.serial+'</p>';
                }
                itemsToRecieveHtml += '<div class="col-6 col-sm-4 col-md-3"><a href="/catalog/'+v["catalogId"]+'" target="_blank"><img data-catalogid="'+v["catalogId"]+'" style="width: 100%;" /></a><p class="text-truncate" style="font-size: 0.75rem;font-weight:700;text-align:left;" data-catalogid="'+v.catalogId+'">Loading</p>'+serialText+'</div>';
                catalogThumbsArr.push(v["catalogId"]);
            });
            if (type === "outbound") {
                itemsRecevMessage = "Items you will Recieve";
                itemsGiveMessage = "Items you will Give";
                confirmText = "Close";
                showCancel = true;
            }else if (type === "inactive") {
                showCancel = false;
                itemsRecevMessage = "Items you would have Recieved";
                itemsGiveMessage = "Items you would have Given";
                confirmText = "Close";
            }else if (type === "inbound") {
                showCancel = true;
                itemsRecevMessage = "Items you will Recieve";
                itemsGiveMessage = "Items you will Give";
                confirmText = "Accept Trade";
            }else if (type === "completed") {
                showCancel = false;
                itemsRecevMessage = "Items you Recieved";
                itemsGiveMessage = "Items you Gave";
                confirmText = "Close";
            }
            setTimeout(function() {
                setCatalogThumbs(catalogThumbsArr);
                setCatalogNames(catalogThumbsArr);
                setUserThumbs([partnerUserId]);
            }, 100);
            Swal.fire({
                title: 'Review Trade',
                html:
                  `<div class="row">
                  <div class="col-6 col-md-4"><img data-userid="`+partnerUserId+`" style="width:100%;" /><h5><a href="/users/`+partnerUserId+`/profile" target="_blank">`+userIdToName(partnerUserId)+`</a></h5><p style="font-size: 0.75em;">`+date+`</p></div>
                  <div class="col-6 col-md-8">
                  <h5>`+itemsGiveMessage+`</h5>
                  <div class="row">
                    `+itemsToGiveHtml+`
                  </div>
                  <h5 style="margin-top:1rem;">`+itemsRecevMessage+`</h5>
                  <div class="row">
                    `+itemsToRecieveHtml+`
                  </div>
                  </div>
                  </div>`,
                showCloseButton: true,
                showCancelButton: showCancel,
                focusConfirm: false,
                confirmButtonText:confirmText,
                cancelButtonText:'Cancel Trade',
            }).then(function(d) {
                if (type === "outbound") {
                    if (d.dismiss && d.dismiss === "backdrop") {

                    }else if (d.dismiss && d.dismiss === "cancel") {
                        questionYesNo("Are you sure you want to cancel this trade?", function() {
                            loading();
                            request("/economy/trades/"+id, "DELETE")
                                .then(function(d) {
                                    success("The trade has been deleted", function() {
                                        loadTrades(type, 0);
                                    });
                                })
                                .catch(function(e) {
                                    console.log(e);
                                    warning(e.responseJSON.message);
                                });
                        })
                    }else if (d.value) {

                    }                    
                }
                if (type === "inbound") {
                    if (d.dismiss && d.dismiss === "backdrop") {

                    }else if (d.dismiss && d.dismiss === "cancel") {
                        questionYesNo("Are you sure you want to cancel this trade?", function() {
                            loading();
                            request("/staff/trades/"+id+'?userId='+currentUserId, "DELETE")
                                .then(function(d) {
                                    success("The trade has been deleted", function() {
                                        loadTrades(type, 0);
                                    });
                                })
                                .catch(function(e) {
                                    console.log(e);
                                    warning(e.responseJSON.message);
                                });
                            });
                    }else if (d.value) {
                        questionYesNo("Are you sure you want to accept this trade?", function() {
                            loading();
                            request("/staff/trades/"+id+'?userId='+currentUserId, "POST")
                                .then(function(d) {
                                    success("The trade has been accepted! You can view your new item(s) in your inventory.", function() {
                                        loadTrades(type, 0);
                                    });
                                })
                                .catch(function(e) {
                                    console.log(e);
                                    warning(e.responseJSON.message);
                                });
                        })
                    }  
                }
            })
        })
        .catch(function(e) {
            console.log(e);
            warning("This trade does not seem to exist. Please reload the page, and try again.");
        });
});