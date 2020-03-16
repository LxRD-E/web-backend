$('#newStatusValue').css('overflow-y','hidden').autogrow({vertical: true, horizontal: false});
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
                    $('#userFriendsDiv').append('<div class="row"><div class="col-6 col-sm-3 text-center" ><img src="' + window.subsitutionimageurl + '" data-userid="' + value.userId + '" class="card-img-top"></div><div class="col text-left"><a class="font-weight-bold normal" href="/users/' + value.userId + '/profile"><span data-userid="' + value.userId + '"></span></a><p style="font-size:0.75rem;">&quot;' + xss(value.UserStatus) + '&quot;</p></div></div>');
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
    $(document).on('click', '.add-reaction', function(e) {
        if ($(this).parent().attr('data-react-disabled')) {
            return;
        }
        let id = $(this).attr('data-id');
        $(this).parent().attr('data-react-disabled','true');
        let elAppended = $(this).parent().prepend(`
        <div class="col text-center remove-reaction" data-id="${id}">
            <p style="font-size:0.85rem;color:red;"><i class="fas fa-heart"></i> Unheart</p>
        </div>`);
        let elToEdit = $('span.formated-total-reactions[data-id='+id+']');
        let oldHeartCount = parseInt(elToEdit.attr('data-count'));
        let newHeartCount = oldHeartCount + 1;
        if (newHeartCount > 1||newHeartCount === 0) {
            elToEdit.html(number_format(newHeartCount) + ' Hearts');
        }else{
            elToEdit.html(number_format(newHeartCount) + ' Heart');
        }
        elToEdit.attr('data-count', newHeartCount);
        console.log(elAppended);
        request('/auth/feed/friends/'+id+'/react', 'POST', {
            'reactionType': 'heart',
        }).then(() => {
            elAppended.removeAttr('data-react-disabled');
        })
        .catch(e => {
            console.error(e);
            toast(false,'Oops, let\'s try that again.')
            $(this).parent().prepend(`
            <div class="col text-center add-reaction" data-id="${id}">
                <p style="font-size:0.85rem;"><i class="far fa-heart"></i> Heart</p>
            </div>`);
        })
        $(this).remove();
    });
    $(document).on('click', '.remove-reaction', function(e) {
        if ($(this).parent().attr('data-react-disabled')) {
            return;
        }
        let id = $(this).attr('data-id');
        $(this).parent().attr('data-react-disabled','true');
        let elAppended = $(this).parent().prepend(`
        <div class="col text-center add-reaction" data-id="${id}">
            <p style="font-size:0.85rem;"><i class="far fa-heart"></i> Heart</p>
        </div>`);
        let elToEdit = $('span.formated-total-reactions[data-id='+id+']');
        let oldHeartCount = parseInt(elToEdit.attr('data-count'));
        let newHeartCount = oldHeartCount - 1;
        if (newHeartCount > 1||newHeartCount === 0) {
            elToEdit.html(number_format(newHeartCount) + ' Hearts');
        }else{
            elToEdit.html(number_format(newHeartCount) + ' Heart');
        }
        elToEdit.attr('data-count', newHeartCount);
        console.log(elAppended);
        request('/auth/feed/friends/'+id+'/react', 'DELETE', {
            'reactionType': 'heart',
        }).then(() => {
            elAppended.removeAttr('data-react-disabled');
        })
        .catch(e => {
            console.error(e);
            toast(false,'Oops, let\'s try that again.')
            $(this).parent().prepend(`
            <div class="col text-center remove-reaction" data-id="${id}">
                <p style="font-size:0.85rem;color:red;"><i class="far fa-heart"></i> Heart</p>
            </div>`);
        })
        $(this).remove();
    });
    let commentsLoaded = {};
    let loadingComments = {};
    $(document).on('click', '.add-comment-to-status-submit', function(e) {
        e.preventDefault();
        let id = $(this).attr('data-id');
        let commentBox = $('textarea.add-comment-to-status-textarea[data-id="'+id+'"]');
        commentBox.attr('disabled', 'disabled');
        $(this).attr('disabled','disabled');
        let commentText = commentBox.val();

        request('/auth/feed/friends/'+id+'/comment', 'POST', {
            comment: commentText,
        }).then(d => {
            commentBox.removeAttr('disabled', 'disabled');
            commentBox.val('');
            $(this).removeAttr('disabled','disabled');

            if (commentsLoaded[id] === true) {
                let divToAddCommentsTo = $('.comments-area[data-id="'+id+'"]');
                divToAddCommentsTo.append(`
                    
                    <div class="col-12">
                        <div class="row">
                            <div class="col" style="max-width:75px;padding-right:0;">
                                <img src="${window.subsitutionimageurl}" style="width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;" data-userid="${userId}" />
                            </div>
                            <div class="col">
                                <a class="normal" href="/users/${userId}/profile">
                                    <p style="font-weight:700;font-size:0.75rem;">
                                        <span data-userid="${userId}"></span>
                                    </p>
                                </a>
                                <p style="font-size:0.75rem;white-space: pre-line;font-weight:600;">${xss(commentText)}</p>
                                <p style="font-size:0.65rem;opacity:0.75;font-weight:500;">${moment().fromNow()}</p>
                            </div>
                        </div>
                    </div>
                    
                    `);
                    setUserThumbs([userId]);
                    setUserNames([userId]);
            }
        }).catch(e => {
            commentBox.removeAttr('disabled', 'disabled');
            $(this).removeAttr('disabled','disabled');
            console.error(e);
            toast(false, e.responseJSON.message);
        })
    });
    
    $(document).on('click', '.add-comment', function(e) {
        console.log(loadingComments);
        e.preventDefault();
        let id = $(this).attr('data-id');
        if (loadingComments[id]) {
            return;
        }
        loadingComments[id] = true;

        let divToAddCommentsTo = $('.comments-area[data-id="'+id+'"]');
        if (commentsLoaded[id] === true) {
            commentsLoaded[id] = false;
            loadingComments[id] = false;
            divToAddCommentsTo.empty();
            $(this).removeAttr('data-loading-comments');
        }else{
            commentsLoaded[id] = true;
            divToAddCommentsTo.append(`<div class="col-12" style="margin-top:1rem;margin-bottom:1rem;"><div class="spinner-border text-success" role="status" style="display:block;margin:0 auto;"></div>`);
            request('/auth/feed/friends/'+id+'/comments?limit=100', 'GET')
            .then(d => {
                divToAddCommentsTo.empty();
                divToAddCommentsTo.append(`
                    
                    <div class="col-12">
                        <div class="row">
                            <div class="col" style="max-width:75px;padding-right:0;">
                                <img src="${window.subsitutionimageurl}" style="width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;" data-userid="${userId}" />
                            </div>
                            <div class="col">
                                <div class="form-group">
                                    <textarea class="form-control add-comment-to-status-textarea" data-id="${id}" rows="3" placeholder="Write a comment..." style="font-size:0.75rem;"></textarea>
                                </div>
                            </div>
                            <div class="col" style="padding-left:0;max-width:75px;">
                                <button type="button" class="btn btn-small btn-success add-comment-to-status-submit" style="margin:0 auto;display: block;font-size:0.85rem;" data-id="${id}">Post</button>
                            </div>
                        </div>
                    </div>
                    
                `);
                setUserThumbs([userId]);
                let userIdsWhoCommented = [];
                for (const comment of d) {
                    userIdsWhoCommented.push(comment.userId);
                    divToAddCommentsTo.append(`
                    
                    <div class="col-12">
                        <div class="row">
                            <div class="col" style="max-width:75px;padding-right:0;">
                                <img src="${window.subsitutionimageurl}" style="width:100%;height: auto;display:block;margin:0 auto;border-radius:50%;" data-userid="${comment.userId}" />
                            </div>
                            <div class="col">
                                <a class="normal" href="/users/${comment.userId}/profile">
                                    <p style="font-weight:700;font-size:0.75rem;">
                                        <span data-userid="${comment.userId}"></span>
                                    </p>
                                </a>
                                <p style="font-size:0.75rem;white-space: pre-line;font-weight:600;">${xss(comment.comment)}</p>
                                <p style="font-size:0.65rem;opacity:0.75;font-weight:500;">${moment(comment.createdAt).fromNow()}</p>
                            </div>
                        </div>
                    </div>
                    
                    `);
                }
                divToAddCommentsTo.append(`<div class="col-12" style="margin-bottom:1rem;"></div>`);
                setUserNames(userIdsWhoCommented);
                setUserThumbs(userIdsWhoCommented);
            })
            .catch(e => {
                divToAddCommentsTo.empty();
                console.error(e);
                toast(false, 'Uh-oh, could you try that again?');
                commentsLoaded[id] = false;
            }).finally(() => {
                loadingComments[id] = false;
            })
        }
    });
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
                    let reactionBox = `
                    <div class="col text-center add-reaction" data-id="${k.statusId}">
                        <p style="font-size:0.85rem;"><i class="far fa-heart"></i> Heart</p>
                    </div>`;
                    if (k.didReactWithHeart) {
                        reactionBox = `
                        <div class="col text-center remove-reaction" data-id="${k.statusId}">
                            <p style="font-size:0.85rem;color:red;"><i class="fas fa-heart"></i> Unheart</p>
                        </div>`;
                    }
                    userIdsRequest.push(k.userId);
                    var dateDisplay = moment(k["date"]).format('MMMM Do YYYY, h:mm a');
                    let reactionCountDisplay = `
                    
                    <p style="font-size:0.65rem;text-align:left;"><i class="fas fa-heart"></i> <span class="formated-total-reactions" data-count="${k.heartReactionCount}" data-id="${k.statusId}">0 Hearts</span></p>`;

                    if (k.heartReactionCount !== 0) {
                        let heartWithS = 'Heart';
                        if (k.heartReactionCount > 1) {
                            heartWithS = 'Hearts';
                        }
                        reactionCountDisplay = `
                        
                        <p style="font-size:0.65rem;text-align:left;"><i class="fas fa-heart"></i> <span class="formated-total-reactions" data-count="${k.heartReactionCount}" data-id="${k.statusId}">${number_format(k.heartReactionCount)} ${heartWithS}</span></p>
                        
                        `;
                    }


                    let commentCountDisplay = `
                    
                    <p style="font-size:0.65rem;text-align:right;" class="add-comment" data-id="${k.statusId}">
                        <span class="formated-total-comments" data-count="${k.commentCount}" data-id="${k.statusId}">${k.commentCount}</span> Comment
                    </p>
                    
                    `;
                    if (k.commentCount === 0 || k.commentCount > 1) {
                        commentCountDisplay = `
                    
                        <p style="font-size:0.65rem;text-align:right;" class="add-comment" data-id="${k.statusId}">
                            <span class="formated-total-comments" data-count="${k.commentCount}" data-id="${k.statusId}">${number_format(k.commentCount)}</span> Comments
                        </p>
                        
                        `;
                    }
                    let divData = `
                    <div class="col-12">
                        <div class="row">
                            <div class="col-12">
                                <hr style="margin-top:0;" />
                            </div>
                            <div style="" class="col-4 col-lg-2">
                                <img style="width:100%;display:block;margin:0 auto;" data-userid="${k.userId}" src="${window.subsitutionimageurl}" />
                            </div>
                            <div class="col-8 col-lg-10" style="padding-left: 0;">
                                <div class="row">
                                    <div class="col-12">
                                        <h6 class="text-left" style="margin-bottom: 0;">
                                            <a class="normal" href="/users/${k.userId}/profile">
                                                <span data-userid="${k.userId}"></span>
                                            </a>
                                            <span style="font-size:0.65rem;font-weight:400;opacity:1;cursor:pointer;" title="${dateDisplay}">
                                                ( ${ moment(k["date"]).fromNow()} )
                                            </span>
                                        </h6>
                                    </div>
                                </div>
                                <div class="col-12" style="padding-left:0;padding-right:0;">
                                    <p style="font-size:0.8rem;white-space:pre-wrap;">${xss(k["status"])}</p>
                                </div>
                            </div>
                            <div class="col-12" style="margin-top:0.5rem;">
                                <div class="row">
                                    <div class="col-6">
                                        ${reactionCountDisplay}
                                    </div>
                                    <div class="col-6">
                                        ${commentCountDisplay}
                                    </div>
                                </div>
                            </div>
                            <div class="col-12">
                                <hr style="margin-bottom:0;" />
                            </div>
                            <div class="col-12" style="margin-bottom:0;">
                                <div class="row">
                                    ${reactionBox}
                                    <div class="col text-center add-comment" data-id="${k.statusId}">
                                        <p style="font-size:0.85rem;"><i class="far fa-comments"></i> Comment</p>
                                    </div>
                                </div>
                                <div class="row comments-area" data-id="${k.statusId}">

                                </div>
                            </div>
                        </div>
                    </div>`;
                    $('#userFeedDiv').append(divData);
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