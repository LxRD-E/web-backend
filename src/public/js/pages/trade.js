var userData = $('#userdata');
var userid = userData.attr("data-userid");
var traderData = $('#tradedata')
var traderId = traderData.attr("data-userid");

getUserInventoryAndWriteToDisplay(userid, "you");
getUserInventoryAndWriteToDisplay(traderId, "partner");

var uSelected = [];
$(document).on('click', '.addItemToTradeyou', function() {
    console.log($(this).find(".card").css("border"));
    if ($(this).find(".card").css("border") === "2px solid rgb(40, 167, 69)") {
        $(this).find(".card").css("border", "1px solid rgba(0, 0, 0, 0.125)");
        for (var i = uSelected.length - 1; i >= 0; --i) {
            if (uSelected[i].attr("data-uid") == $(this).attr("data-uid")) {
                uSelected.splice(i,1);
            }
        }
    }else{
        if (uSelected.length >= 4) {
            warning("You can only select up to 4 items, per person, to trade at once. Please remove an item, and try again.");
        }else{
            $(this).find(".card").css("border", "2px solid rgb(40, 167, 69)");
            uSelected.push($(this));
        }
    }
});
var partnerSelected = [];
$(document).on('click', '.addItemToTradepartner', function() {
    console.log($(this).find(".card").css("border"));
    if ($(this).find(".card").css("border") === "2px solid rgb(40, 167, 69)") {
        $(this).find(".card").css("border", "1px solid rgba(0, 0, 0, 0.125)");
        for (var i = partnerSelected.length - 1; i >= 0; --i) {
            if (partnerSelected[i].attr("data-uid") == $(this).attr("data-uid")) {
                partnerSelected.splice(i,1);
            }
        }
    }else{
        if (partnerSelected.length >= 4) {
            warning("You can only select up to 4 items, per person, to trade at once. Please remove an item, and try again.");
        }else{
            $(this).find(".card").css("border", "2px solid rgb(40, 167, 69)");
            partnerSelected.push($(this));
        }
    }
});

$(document).on('click', '#sendTradeRequest', function() {
    // Verify
    if (partnerSelected.length >= 1 && uSelected.length >= 1) {
        questionYesNo("Are you sure you'd like to send this trade?", function(data) {
            var requestItems = [];
            var myItems = [];
            $.each(partnerSelected, function(index, value) {
                requestItems.push(parseInt(value.attr("data-uid")));
            });
            $.each(uSelected, function(index, value) {
                myItems.push(parseInt(value.attr("data-uid")));
            });
            request("/user/"+traderId+"/trade/request", "PUT", JSON.stringify({"requestedItems":requestItems,"requesterItems":myItems}))
                .then(function(data) {
                    success("Your Trade Request has been Created.");
                })
                .catch(function(e) {
                    console.log(e);
                    warning(e.responseJSON.message);
                });
        });
    }else{
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
          
        Toast.fire({
            type: 'error',
            title: 'Both parties must be sending at least one item.'
        });
    }
    /*
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });
      
    Toast.fire({
        type: 'success',
        title: 'Trade has been sent!'
    });
    */
    
});

function getUserInventoryAndWriteToDisplay(userid, type) {
    recurseOverInventory(0);
    function recurseOverInventory(offset) {
        if (offset > 100) {
            return; // temporary
        }
        if (type === "you") {
            var div = $('#tradeYourInventory');
        }else{
            var div = $('#tradePartnerInventory');
        }
        request("/user/"+userid+"/inventory/collectibles?sort=desc&offset="+offset)
            .then(function(d) {
                d = d["items"];
                if (d.length <= 0 && offset === 0) {
                    div.html('<div class="col-sm-12"><h5>This user does not have any tradeable items.</h5></div>');
                }else{
                    if (d.length >= 25) {
                        recurseOverInventory(offset+25);
                    }
                    console.log(d.length);
                    var catalogIdsRequest = [];
                    $.each(d, function(index, value) {
                        if (value.serial !== null && value.serial !== 0) {
                            value.serial = "<p>Serial: "+value.serial+"</p>";
                        }else{
                            value.serial = "<p>Serial: N/A</p>";
                        }
                        div.append('<div style="display:none;" class="col-6 col-sm-6 col-md-6 col-lg-4 addItemToTrade'+type+'" data-uid="'+value.userInventoryId+'" data-catalogid="'+value.catalogId+'" id="user_inventory_item_'+index+'"><div class="card" style="margin: 1rem 0;"><img data-catalogid="'+value.catalogId+'" style="width:100%;" /> <div class="card-body"><div class="card-title text-left text-truncate" style="margin-bottom:0;"><a href="/catalog/'+value.catalogId+'/" target="_blank">'+value.catalogName+'</a>'+value.serial+'</div></div></div></div>');
                        catalogIdsRequest.push(value.catalogId);
                        $('.addItemToTrade'+type).show();
                    });
                    setCatalogThumbs(catalogIdsRequest);
                }
            })
            .catch(function(e) {
                $('#userInventoryDiv').html('<div class="col sm-12"><h5 class="text-center">This user does not have any items.</h5></div>');
            });
    }
}