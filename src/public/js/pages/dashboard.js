$(document).on('click', '#updateStatusClick', function () {
    var status = $('#newStatusValue').val();
    if (status !== "" && status.length >= 1 && status.length <= 255) {
        request("/auth/status", "PATCH", JSON.stringify({ "status": status }))
            .then(function (d) {
                success("Success! Your status has been updated.");
            })
            .catch(function (e) {
                warning(e.responseJSON.message);
            });
    } else {
        warning("Error: Your status must be between 1 and 255 characters. Please try again.");
    }
});

request('/notifications/count', 'GET').then(d => {
    $('#user-notifications-mobile').html(number_format(d.count));
})


$(function () {
    // Get User Info
    request("/user/" + userId + "/info", "GET")
        .then((data) => {
            if (data.user_status !== null && data.user_status !== "") {
                $('#newStatusValue').attr("placeholder", data.user_status.escape());
            }
        })
        .catch((data) => {

        });

    // Get Friends
    request("/user/" + userId + "/friends?limit=5", "GET")
        .then((data) => {
            // Has Friends
            $('#userFriendsCountDiv').empty();
            $('#userFriendsDiv').empty();
            $('#userFriendsCountDiv').append('<p>' + data["total"] + '</p>');
            var friendsUserIds = [];
            $(data["friends"]).each(function (key, value) {
                if (key <= 4) {
                    if (value.UserStatus === null) {
                        value.UserStatus = "...";
                    }
                    friendsUserIds.push(value.userId);
                    $('#userFriendsDiv').append('<div class="row"><div class="col-6 col-sm-3 text-center" ><img src="' + window.subsitutionimageurl + '" data-userid="' + value.userId + '" class="card-img-top"></div><div class="col text-left"><a class="font-weight-bold" href="/users/' + value.userId + '/profile"><span data-userid="' + value.userId + '"></span></a><p style="font-size:0.85rem;">&quot;' + xss(value.UserStatus) + '&quot;</p></div></div>');
                }
            });
            if (data["friends"].length > 4) {
                $('#userFriendsDiv').append('<div class="row" style="margin-top:1rem;"><div class="col-sm-12 text-left"><a href="/users/' + userId + '/friends">See All</a></div></div>');
            }
            setUserThumbs(friendsUserIds);
            setUserNames(friendsUserIds);
            $('#myFriendsCount').html("(" + data["total"] + ")");
            if (data.total === 0) {
                $('#userFriendsDiv').append('You do not have any friends.');
                $('#userFriendsDiv').css("padding-top", "0");
            }
        })
        .catch((data) => {
            console.log(data);
            $('#userFriendsCountDiv').empty();
            $('#userFriendsDiv').empty();
            $('#userFriendsDiv').append('You do not have any friends.');
            $('#userFriendsDiv').css("padding-top", "0");
            // No friends
            $('#userFriendsCountDiv').append('<p>0</p>');
        });

    /*
// Get Forum Posts Count/Data
request("/user/"+userId+"/forum", "GET")
    .then((data)=>{
        // Has Friends
        $('#userForumPostsCountDiv').empty();
        $('#userForumPostsCountDiv').append('<p>'+data.length+'</p>');
    })
    .catch((data) => {
        // No friends
        $('#userForumPostsCountDiv').empty();
        $('#userForumPostsCountDiv').append('<p>0</p>');
    });

// Get Game Visits & Games
request("/user/"+userId+"/games", "GET")
    .then((data)=>{
        // Has Friends
        $('#userGameVisitsCountDiv').empty();
        $('#userGameVisitsCountDiv').append('<p>'+data.length+'</p>');
    })
    .catch((data) => {
        // No friends
        $('#userGameVisitsCountDiv').empty();
        $('#userGameVisitsCountDiv').append('<p>0</p>');
    });

*/
    var currentFeed = 'friends';
    var isLoading = false;
    var areMoreAvailable = true;
    var feedOffset = 0;
    $(window).scroll(function () {
        if (isLoading || !areMoreAvailable) {
            return;
        }
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 400) {
            if (currentFeed === 'friends') {
                getFeedFriends(feedOffset);
            } else if (currentFeed === 'groups') {
                getFeedGroups(feedOffset);
            }
        }
    });
    $('#use-feed-friends').click(function () {
        if (isLoading || currentFeed === 'friends') {
            return;
        }
        areMoreAvailable = true;
        currentFeed = 'friends';
        feedOffset = 0;
        $(this).removeClass('btn-outline-success').addClass('btn-success');
        $('#use-feed-groups').removeClass('btn-success').addClass('btn-outline-success');
        $('#userFeedDiv').empty();
        getFeedFriends(0);
    });
    $('#use-feed-groups').click(function () {
        if (isLoading || currentFeed === 'groups') {
            return;
        }
        areMoreAvailable = true;
        currentFeed = 'groups';
        feedOffset = 0;
        $(this).removeClass('btn-outline-success').addClass('btn-success');
        $('#use-feed-friends').removeClass('btn-success').addClass('btn-outline-success');
        $('#userFeedDiv').empty();
        getFeedGroups(0);
    });
    // Get Feed
    getFeedFriends(0);
    function getFeedFriends(offset) {
        $('#feedLoader').show();
        isLoading = true;
        request("/auth/feed/friends?limit=10&offset=" + offset, "GET")
            .then(data => {
                isLoading = false;
                if (offset === 0) {
                    $('#userFeedDiv').empty();
                }
                feedOffset += 10;
                // Has Feed
                var userIdsRequest = [];
                data.forEach(function (k, v) {
                    userIdsRequest.push(k.userId);
                    var dateDisplay = moment(k["date"]).format('MMMM Do YYYY, h:mm a');
                    $('#userFeedDiv').append('<div class="col-sm-12"><hr /></div><div style="" class="col-4 col-lg-2"><img style="width:100%;display:block;margin:0 auto;" data-userid="' + k.userId + '" src="' + window.subsitutionimageurl + '" /></div><div class="col-8 col-lg-10" style="padding-left: 0;"><div class="row"><div class="col-12"><h6 class="text-left" style="margin-bottom: 0;"><a style="color:#212529;" href="/users/' + k.userId + '/profile"><span data-userid="' + k.userId + '"></span></a> <span style="font-size:0.65rem;font-weight:400;opacity:1;cursor:pointer;" title="' + dateDisplay + '">(' + moment(k["date"]).fromNow() + ')</span></h6></div><div class="col-12"></div><div class="col-12 col-sm-9 col-lg-10"><p style="font-size:0.85rem;">' + xss(k["status"]) + '</p></div></div></div>');
                });
                setUserThumbs(userIdsRequest);
                setUserNames(userIdsRequest);
                if (data.length > 0) {
                    $('#feedLoader').show();
                } else {
                    areMoreAvailable = false;
                    $('#feedLoader').hide();
                }
                if (data.length === 0 && offset === 0) {
                    areMoreAvailable = false;
                    $('#userFeedDiv').append('<div class="col-12">Your feed is empty. Make some friends!</div>');
                }
            })
            .catch(data => {
                isLoading = false;
                areMoreAvailable = false;
                // No Feed
                if (offset === 0) {
                    $('#userFeedDiv').append('<div class="col-12">' + data.responseJSON.message + '</div>');
                }
            });
    }
    function getFeedGroups(offset) {
        $('#feedLoader').show();
        isLoading = true;
        request("/auth/feed/groups?limit=10&offset=" + offset, "GET")
            .then(data => {
                isLoading = false;
                if (offset === 0) {
                    $('#userFeedDiv').empty();
                }
                feedOffset += 10;
                // Has Feed
                var groupIdsRequest = [];
                var thumbnailIds = [];
                data.forEach(function (k, v) {
                    thumbnailIds.push(k.thumbnailCatalogId);
                    groupIdsRequest.push(k.groupId);
                    var dateDisplay = moment(k["date"]).format('MMMM Do YYYY, h:mm a');
                    $('#userFeedDiv').append('<div class="col-sm-12"><hr /></div><div style="" class="col-4 col-lg-2"><img style="width:100%;display:block;margin:0 auto;" data-catalogid="' + k.thumbnailCatalogId + '" src="' + window.subsitutionimageurl + '" /></div><div class="col-8 col-lg-10" style="padding-left: 0;"><div class="row"><div class="col-12"><h6 class="text-left" style="margin-bottom: 0;"><a style="color:#212529;" href="/groups/' + k.groupId + '/--"><span data-groupid="' + k.groupId + '"></span></a> <span style="font-size:0.65rem;font-weight:400;opacity:1;cursor:pointer;" title="' + dateDisplay + '">(' + moment(k["date"]).fromNow() + ')</span></h6></div><div class="col-12"></div><div class="col-12 col-sm-9 col-lg-10"><p style="font-size:0.85rem;">' + xss(k["shout"]) + '</p></div></div></div>');
                });
                setGroupThumbs(thumbnailIds);
                setGroupNames(groupIdsRequest);
                if (data.length > 0) {
                    $('#feedLoader').show();
                } else {
                    areMoreAvailable = false;
                    $('#feedLoader').hide();
                }
                if (data.length === 0 && offset === 0) {
                    areMoreAvailable = false;
                    $('#userFeedDiv').append('<div class="col-12">Your feed is empty. Make some friends!</div>');
                }
            })
            .catch(data => {
                isLoading = false;
                areMoreAvailable = false;
                console.log(data);
                // No Feed
                if (offset === 0) {
                    $('#userFeedDiv').empty();
                    $('#userFeedDiv').append('<div class="col-12">' + data.responseJSON.message + '</div>');
                }
            });
    }
});