var groupdata = $('#groupdata');
var groupid = groupdata.attr("data-groupid");
window.membersOffset = 0;

window.history.replaceState(null, null, "/groups/"+groupid+"/"+groupdata.attr("data-encoded-name")+"/manage");

request("/group/"+groupid+"/shout", "GET")
    .then(function(d) {
        $('#newShoutValue').attr("placeholder", d.shout.escape());
    })
    .catch(function(e) {

    });

$(document).on('click', '#updateShoutClick', function() {
    var newShout = $('#newShoutValue').val();
    request("/group/"+groupid+"/shout", "PATCH", JSON.stringify({"shout":newShout}))
        .then(function(d) {
            success("Your group shout has been posted.");
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
        });
});

$(document).on('click', '#updateIconClick', function() {
    var form = new FormData();
    if (typeof $('#textureFile')[0].files[0] !== "undefined") {
        form.append("png", $('#textureFile')[0].files[0]);
    }else{
        warning("A Group Logo is required. Please select one, and try again");
        return;
    }
    nigeriamoment("");
    function nigeriamoment(csrf) {
        $.ajax({
            type: "PATCH",
            enctype: 'multipart/form-data',
            url: "/api/v1/group/"+groupid+"/icon",
            headers:{
                "x-csrf-token": csrf,
            },
            data: form,
            processData: false,
            contentType: false,
            cache: false,
            timeout: 600000,
            success: function (data) {
                success("The group's icon has been updated.");
            },
            error: function (e) {
                if (e.status === 403) {
                    console.log(e);
                    var head = e.getResponseHeader("x-csrf-token");
                    if (typeof head !== "undefined") {
                        return nigeriamoment(head);
                    }else{
                        console.log("bad");
                    }
                }else{
                    if (e.responseJSON && e.responseJSON.message) {
                        warning(e.responseJSON.message);
                    }else{
                        warning("An unknown error has occured. Try reloading the page, and trying again.");
                    }
                }
            }
        });
    }
});

// Transfer Ownership
$(document).on('click', '#transferOwnerClick', function() {
    var newOwnerUsername = $('#newOwnerValue').val();
    request("/user/username?username="+newOwnerUsername, "GET")
        .then(function(data) {
            request("/user/"+data.userId+"/groups/"+groupid+"/role", "GET")
                .then(function(roleinfo) {
                    if (roleinfo.rank === 0) {
                        return warning("This user doesn't seem to be in this group");
                    }
                    // Ready
                    questionYesNo("Are you sure you'd like to transfer group ownership to "+data.username.escape()+"?", function() {
                        request("/group/"+groupid+"/transfer", "PATCH", JSON.stringify({'userId':data.userId}))
                            .then(function() {
                                success("Group ownership has been transferred.", function() {
                                    window.location.reload();
                                })
                            })
                            .catch(function(e) {
                                warning(e.responseJSON.message);
                            });
                    })
                })
                .catch(function(err) {
                    warning("This user doesn't seem to be in this group")
                });
        })
        .catch(function(err) {
            warning("This user doesn't seem to exist!");
        });
});

// Spend Group Funds
$(document).on('click', '#spendGroupFunds', function() {
    var usernameToGive = $('#payoutUsername').val();
    var amount = parseInt($('#amountOfFunds').val());
    if (!amount) {
        return warning("Please enter a valid amount.");
    }
    var currency = parseInt($('#currencyType').val());
    request("/user/username?username="+usernameToGive, "GET")
        .then(function(data) {
            request("/user/"+data.userId+"/groups/"+groupid+"/role", "GET")
                .then(function(roleinfo) {
                    if (roleinfo.rank === 0) {
                        return warning("This user doesn't seem to be in this group");
                    }
                    // Ready
                    questionYesNoHtml("Are you sure you'd like to payout "+formatCurrency(currency)+" "+amount+" to "+data.username.escape()+"?", function() {
                        request("/group/"+groupid+"/payout", "PUT", JSON.stringify({'userId':data.userId,'amount':amount,'currency': currency}))
                            .then(function() {
                                success("This user has been paid out.", function() {
                                    window.location.reload();
                                })
                            })
                            .catch(function(e) {
                                warning(e.responseJSON.message);
                            });
                    })
                })
                .catch(function(err) {
                    warning("This user doesn't seem to be in this group")
                });
        })
        .catch(function(err) {
            warning("This user doesn't seem to exist!");
        });
});

$(document).on('click', '#updateGroupDescription', function() {
    var desc = $('#groupDescriptionText').val();
    request("/group/"+groupid+"/description", "PATCH", JSON.stringify({"description":desc}))
        .then(function(d) {
            success("Your group description has been updated.");
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
        });
});

function getGroupRoleManageHtml(arr) {
    var create = false;
    if (arr["type"] === "create") {
        create = true;
    }
    var viewGroupWall = "";
    var postGroupWall = "";
    var getShout = "";
    var postShout = "";
    var manage = "";
    var perms = arr.permissions;
    if (!perms) {
        perms = {};
    }
    if (perms.getWall === 0) {
        viewGroupWall = 'selected="selected"';
    }
    if (perms.postWall === 0) {
        postGroupWall = 'selected="selected"';
    }
    if (perms.getShout === 0) {
        getShout = 'selected="selected"';
    }
    if (perms.postShout === 0) {
        postShout = 'selected="selected"';
    }
    if (perms.manage === 0) {
        manage = 'selected="selected"';
    }
    $('#groupRolesOptionsDisplay').empty();
    $('#groupRolesOptionsDisplay').html(`
<div class="col-6">
                                                    <small class="form-text text-muted">Role Name</small>
                                                    <input type="text" class="form-control" id="newRoleName" placeholder="" value="`+arr.name.escape()+`">
                                                </div>
                                                <div class="col-6">
                                                    <small class="form-text text-muted">Role Value (between 1-254)</small>
                                                    <input type="text" class="form-control" id="newRoleValue" placeholder="" value="`+arr.rank+`">
                                                </div>
                                                <div class="col-12">
                                                    <small class="form-text text-muted">Role Description</small>
                                                    <input type="text" class="form-control" id="newRoleDescription" placeholder="" value="`+arr.description.escape()+`">
                                                </div>
                                                <div class="col-6 col-md-4">
                                                    <small class="form-text text-muted">View Group Wall</small>
                                                    <select class="form-control" id="getGroupWall">
                                                        <option value="1">Yes</option>
                                                        <option value="0" `+viewGroupWall+`>No</option>
                                                    </select>
                                                </div>
                                                <div class="col-6 col-md-4">
                                                    <small class="form-text text-muted">Post to Group Wall</small>
                                                    <select class="form-control" id="postGroupWall">
                                                        <option value="1">Yes</option>
                                                        <option value="0" `+postGroupWall+`>No</option>
                                                    </select>
                                                </div>
                                                <div class="col-6 col-md-4">
                                                    <small class="form-text text-muted">View Shout</small>
                                                    <select class="form-control" id="getShout">
                                                        <option value="1">Yes</option>
                                                        <option value="0" `+getShout+`>No</option>
                                                    </select>
                                                </div>
                                                <div class="col-6 col-md-4">
                                                    <small class="form-text text-muted">Update Shout</small>
                                                    <select class="form-control" id="postShout">
                                                        <option value="1">Yes</option>
                                                        <option value="0" `+postShout+`>No</option>
                                                    </select>
                                                </div>
                                                <div class="col-6 col-md-4">
                                                    <small class="form-text text-muted">Manage Group</small>
                                                    <select class="form-control" id="manageGroup">
                                                        <option value="1">Yes</option>
                                                        <option value="0" `+manage+`>No</option>
                                                    </select>
                                                </div>
                                                <div class="col-6 col-md-4">
                                                    <small class="form-text text-muted">Submit</small>
                                                    <button type="button" class="btn btn-small btn-success" id="updateRoleset" data-create="`+create+`" style="margin:0 auto;display: block;" data-id=`+arr.roleSetId+`>Submit</button>
                                                </div>
`);
}

// Setup Member Update
request("/group/"+groupid+"/roles", "GET")
    .then(function(d) {
        var membersLoaded = false;
        window.roles = d;
        var sel  = true;
        d.forEach(function(k) {
            if (k.rank !== 0) {
                $('#groupRolesSelection').append("<option value="+k.roleSetId+">"+k.name.escape()+"</option>");
                if (!membersLoaded) {
                    loadMembers(k.roleSetId);
                    membersLoaded = true;
                }
                $('#groupRoleManageSelection').append("<option value="+k.roleSetId+">"+k.name.escape()+"</option>");
                if (sel) {
                    sel = false;
                    getGroupRoleManageHtml(k);
                }
            }
        });
        if (d.length <= 17) {
            $('#groupRoleManageSelection').append("<option value=\"create\">Create New</option>");
        }
    })
    .catch(function(e) {
        console.log(e);
        $('#noMembersDisplay').show();
    });


$(document).on('click', '#updateRoleset', function() {
    var roleid = $(this).attr("data-id");
    var uploadData = JSON.stringify({
        "name":$('#newRoleName').val(),
        "rank":parseInt($('#newRoleValue').val()),
        "description":$('#newRoleDescription').val(),
        "permissions": {
            "getWall":parseInt($('#getGroupWall').val()),
            "postWall":parseInt($('#postGroupWall').val()),
            "getShout":parseInt($('#getShout').val()),
            "postShout":parseInt($('#postShout').val()),
            "manage":parseInt($('#manageGroup').val()),
        }
    });
    var check = $(this).attr("data-create");
    if (check === "false") {
        request("/group/"+groupid+"/role/"+roleid, "PATCH", uploadData)
        .then(function(d) {
            toast(true, "This role has been updated.");
        })
        .catch(function(e) {
            console.log(e);
            toast(false, e.responseJSON.message);
        });
    }else{
        request("/group/"+groupid+"/role", "PUT", uploadData)
        .then(function(d) {
            success("This role has been created.", function() {
                window.location.reload();
            });
        })
        .catch(function(e) {
            console.log(e);
            toast(false, e.responseJSON.message);
        });
    }
});

$('#groupRoleManageSelection').change(function() {
    var val = $(this).val();
    if (val === "create") {
        getGroupRoleManageHtml({
            "type": "create",
            "name": "New Role",
            "description": "New Role",
            "rank":1,
        });
    }else{
        val = parseInt(val);
        window.roles.forEach(function(k) {
            if (k.roleSetId === val) {
                getGroupRoleManageHtml(k);
            }
        })
    }
});

$('#groupRolesSelection').change(function() {
    window.membersOffset = 0;
    var roleid = parseInt($(this).val());
    loadMembers(roleid);
    $('#hasMembersDisplay').empty();
});
$(document).on('change', '.rankUser', function() {
    var role = parseInt($(this).val());
    var self = $(this);
    request("/group/"+groupid+"/member/"+$(this).attr("data-userid"), "PATCH", JSON.stringify({"role":role}))
        .then(function(d) {
            toast(true, "This user has been ranked.");
            self.parent().remove();
        })
        .catch(function(e) {
            toast(false, e.responseJSON.message);
        })
});
function loadMembers(id) {
    window.curId = id;
    $('#noMembersDisplay').hide();
    $('#hasMembersDisplay').hide();
    request("/group/"+groupid+"/members/"+id+"?sort=desc&offset="+window.membersOffset+"&limit=12", "GET")
        .then(function(d) {
            if (d.total === 0) {
                $('#noMembersDisplay').show();
            }else{
                $('#hasMembersDisplay').show();
            }
            $('#hasMembersDisplay').empty();
            var userIdsForReq = [];
            d["members"].forEach(function(k) {
                var selects = "";
                window.roles.forEach(function(rankv) {
                    if (rankv.rank !== 0) {
                        if (rankv.roleSetId === k.roleSetId) {
                            selects += "<option selected=\"selected\" value="+rankv.roleSetId+">"+rankv.name.escape()+"</option>";
                        }else{
                            selects += "<option value="+rankv.roleSetId+">"+rankv.name.escape()+"</option>";
                        }
                    }
                });
                $('#hasMembersDisplay').append('<div class="col-4 col-md-3 col-lg-2"><a href="/users/'+k.userId+'/profile"><img data-userid="'+k.userId+'" style="width:100%;" /><p class="text-center text-truncate" data-userid="'+k.userId+'"></p></a><select data-userid="'+k.userId+'" class="form-control rankUser">'+selects+'</select></div>');
                userIdsForReq.push(k.userId);
            });
            setUserThumbs(userIdsForReq);
            setUserNames(userIdsForReq);

            if (window.membersOffset !== 0) {
                $('#loadLessMembers').show();
            }else{
                $('#loadLessMembers').hide();
            }

            if (d["total"] - window.membersOffset >= 12) {
                $('#loadMoreMembers').show();
            }else{
                $('#loadMoreMembers').hide();
            }
        })
        .catch(function(e) {
            window.membersOffset = 0;
            $('#noMembersDisplay').show();
        });
}

$(document).on('click', '#loadMoreMembers', function() {
    window.membersOffset = window.membersOffset + 12;
    loadMembers(window.curId);
});
$(document).on('click', '#loadLessMembers', function() {
    window.membersOffset = window.membersOffset - 12;
    loadMembers(window.curId);
});