window.subsitutionimageurl = "https://cdn.hindigamer.club/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png";
// Self-XSS Warning
console.log("%cStop!", "color:red; font-size:80px;font-family:sans-serif;");
console.log("%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or \"hack\", it is a scam and will give them access to your account.", "color:black;font-size:25px;font-family:sans-serif;");
// Get UserData
var userData = $('#userdata');

function urlencode(string) {
    if (!string) {
        return "unnamed";
    }
    string = string.replace(/\s| /g, '-');
    string = string.replace(/[^a-zA-Z\d-]+/g, '');
    string = string.replace(/--/g, '-');
    if (!string) {
        return "unnamed";
    }
    return string;
}
/*
setInterval(() => {
    $('img').on('error', function(e) {
        let oldSrc = $(this).attr('src');
        $(this).attr('src', window.subsitutionimageurl);
        setTimeout(() => {
            $(this).attr('src', oldSrc);
        }, 250);
    });
}, 100);
*/
/*
var retries = 0;
$.imgReload = function() {
    var loaded = 1;

    $("img").each(function() {
        if (!this.complete || typeof this.naturalWidth == "undefined" || this.naturalWidth == 0) {

            var src = $(this).attr("src");
            var date = new Date();
            $(this).attr("src", src + "?v=" + date.getTime()); //slightly change url to prevent loading from cache
            loaded =0;
        }
    });
}

setInterval(() => {
    $.imgReload();
}, 2500);
*/

$(document).on('error', 'img', function(ev) {
    console.log('Image load error');
});

$('[data-toggle="tooltip"]').tooltip();

// Setup Dates
$('.formatDate').each(function () {
    var date = moment($(this).attr("data-date"));
    var localDate = moment(date).local();
    $(this).html(localDate.format('MMMM Do YYYY, h:mm a'));
});
$('.formatDateNoTime').each(function () {
    var date = moment($(this).attr("data-date"));
    var localDate = moment(date).local();
    $(this).html(localDate.format('MMMM Do YYYY'));
});
$('.formatDateFromNow').each(function () {
    var date = moment($(this).attr("data-date"));
    var localDate = moment(date).local();
    $(this).html(localDate.fromNow());
});
function formatDate(dat) {
    var date = moment(dat);
    var localDate = moment(date).local();
    return localDate.format('MMMM Do YYYY, h:mm a');
}

// Idea is you pass the value (1 or 2) into this function and get an html span that will represent the currency name & color (since we don't know it yet)
function formatCurrency(cur) {
    if (cur === 1) {
        // return '<span style="color:#28a745;"><i class="far fa-money-bill-alt"></i> </span>';
        return '<span style="color:#28a745;"><img alt="$" style="height: 1rem;" src="https://cdn.hindigamer.club/static/money-green-2.svg"/> </span>';
    } else {
        return '<span style="color:#ffc107;"><img alt="$" style="height: 1rem;" src="https://cdn.hindigamer.club/static/coin-stack-yellow.svg"/> </span>';
    }
}

function bigNum2Small(bigNum) {
    if (isNaN(parseInt(bigNum))) {
        return 0;
    }
    if (bigNum < 1000) {
        return bigNum.toString();
    }
    if (bigNum < 10000) {
        return bigNum.toString().slice(0, -3) + "K+";
    }
    if (bigNum < 100000) {
        return bigNum.toString().slice(0, -3) + "K+";
    }
    if (bigNum < 1000000) {
        return bigNum.toString().slice(0, -3) + "K+";
    }
    if (bigNum < 10000000) {
        return bigNum.toString().slice(0, -6) + "M+";
    }
    if (bigNum < 100000000) {
        return bigNum.toString().slice(0, -6) + "M+";
    }
    if (bigNum < 1000000000) {
        return bigNum.toString().slice(0, -6) + "M+";
    }
    if (bigNum < 10000000000) {
        return bigNum.toString().slice(0, -9) + "B+";
    }
    if (bigNum < 100000000000) {
        return bigNum.toString().slice(0, -9) + "B+";
    }
    if (bigNum < 1000000000000) {
        return bigNum.toString().slice(0, -9) + "B+";
    }
    if (bigNum < 10000000000000) {
        return bigNum.toString().slice(0, -12) + "T+";
    }
    return bigNum.toString().slice(0, -12) + "T+";
}

// xss() alias w/ default options
// Allows certain text-formatting based tags
String.prototype.escapeAllowFormatting = function () {
    if (!this) {
        return;
    }
    var options = {
        whiteList: {
            h1: [],
            h2: [],
            h3: [],
            h4: [],
            h5: [],
            h6: [],
            // Import from below
            p: [],
            br: [],
            hr: [],
            bold: [],
            strong: [],
            i: [],
            em: [],
            mark: [],
            small: [],
            del: [],
            ins: [],
            sub: [],
            sup: [],
            blockquote: [],
            ul: [],
            li: [],
            ol: [],
            code: [],
        }
    }
    var html = filterXSS(this, options);
    return html;
}
// xss() alias w/ default options
// Blocks headers, hr, etc
String.prototype.escapeAllowFormattingBasic = function () {
    if (!this) {
        return;
    }
    var options = {
        whiteList: {
            p: [],
            br: [],
            bold: [],
            strong: [],
            i: [],
            em: [],
            mark: [],
            small: [],
            del: [],
            ins: [],
            sub: [],
            sup: [],
        }
    }
    var html = filterXSS(this, options);
    return html;
}
// Escape all html chars
String.prototype.escape = function () {
    if (!this) {
        return;
    }
    var options = {
        whiteList: {
        }
    }
    var html = filterXSS(this, options);
    var tagsToReplace = {
        '"': '&quot;',
        '’': '&rsquo;',
        '‘': '&lsquo;',
        "'": '&#39;',
    };
    return html.replace(/[&<>"']/g, function (tag) {
        return tagsToReplace[tag] || tag;
    });
}

// Setup Escape Method
/*
String.prototype.escape = function () {
    var tagsToReplace = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        '’': '&rsquo;',
        '‘': '&lsquo;',
        "'": '&#39;',
    };
    return this.replace(/[&<>"']/g, function (tag) {
        return tagsToReplace[tag] || tag;
    });
};
*/
function isAuth() {
    if (userData.attr("data-authenticated") === "true") {
        return true;
    }
    return false;
}

var auth = false;
if (userData.attr("data-authenticated") === "true") {
    auth = true;
    var userId = userData.attr("data-userid");
    var username = userData.attr("data-username");

    // Load Notifications
    request('/notifications/count', "GET")
        .then(function (d) {
            if (d.count >= 100) {
                d.count = "99+";
            } else {
                d = d["count"].toString();
            }
            $('#notificationCount').html(d);
        })
        .catch(function (e) {

        });
    /*
    var tabId = (new Date).getTime()+Math.random();
    tabId = Math.floor(tabId);
    tabId = tabId.toString();
    var c = localStorage.getItem('crossTabNotifications');
    if (c === false || c === null || c === "" || typeof c === "undefined" || JSON.parse(c)["type"] === 99) {
        localStorage.setItem('crossTabNotifications',tabId);
    }
    // Notification Poll
    window.onbeforeunload = function() {
        if (localStorage.getItem('crossTabNotifications') === tabId) {
            request("/notification/abort?tabId="+tabId, "GET")
                .then((d) => {

                })
                .catch((e) => {

                });
            localStorage.setItem("crossTabNotifications", JSON.stringify({"type":99}));
        }
    }
    function onNotification(d) {
        var types = {
            1: {
                "title":"Friend Request",
                "desc":"has sent you a friend request!",
            },
            2: {
                "title":"Trade Request",
                "desc":"has sent you a trade request!"
            }
        };
        var data = types[d["type"]];
        if (d["type"] === 1) {
            var notifCount = $('#notificationCount').html();
            if (notifCount !== "99+" && !isNaN(notifCount)) {
                notifCount = parseInt(notifCount);
                notifCount += 1;
                if (notifCount >= 100) {
                    notifCount = "99+";
                }
                $('#notificationCount').html(notifCount);
            }
        }
    }
    function pollNotifications() {
        if (localStorage.getItem('crossTabNotifications') === tabId) {
            window.notificationsSetup = true;
            request('/notification/poll?tabId='+tabId, "GET")
                .then((d) => {
                    onNotification(d);
                    message_broadcast(d);
                    pollNotifications();
                })
                .catch((e) => {
                    if (e.status === 409) {
                        pollNotifications();
                    }else{
                        if (e.status !== 503 && e.status !== 502 && e.status !== 500) {
                            message_broadcast({type:99,message:"Notification failed"});
                        }
                    }
                });
        }
    }
    pollNotifications();
    $(window).on('storage', message_receive);

    // use local storage for messaging. Set message in local storage and clear it right away
    // This is a safe way how to communicate with other tabs while not leaving any traces
    //
    function message_broadcast(message)
    {
        localStorage.setItem('message',JSON.stringify(message));
        localStorage.removeItem('message');
    }


    // receive message
    //
    function message_receive(ev)
    {
        if (ev.originalEvent.key!='message') return; // ignore other keys
        var message=JSON.parse(ev.originalEvent.newValue);
        if (!message) return; // ignore empty msg or msg reset

        // here you act on messages.
        // you can send objects like { 'command': 'doit', 'data': 'abcd' }
        if (message.type == 1) {
        }
        if (message.type == 99) {
            localStorage.removeItem("crossTabNotifications");
            localStorage.setItem('crossTabNotifications',tabId);
            pollNotifications();
        }

        // etc.
    }
    */
    var balOne = $('#currencyBalanceOne').attr("data-amt");
    balOne = bigNum2Small(parseInt(balOne));
    $('#currencyBalanceOne').html(balOne);
    var balTwo = $('#currencyBalanceTwo').attr("data-amt");
    balTwo = bigNum2Small(parseInt(balTwo));
    $('#currencyBalanceTwo').html(balTwo);

    $('[data-toggle="currency"]').tooltip();

    $('.displayCurrency').show();
    /*
        // Load Balance
        request("/balance", "GET")
            .then(function (bals) {
                var balOne = bigNum2Small(bals[1]);
                var balTwo = bigNum2Small(bals[2]);
                $('#currencyBalanceOne').html(balOne);
                $('#currencyBalanceTwo').html(balTwo);
                localStorage.setItem("balOne", bals[1]);
                localStorage.setItem("balTwo", bals[2]);
            })
            .catch(function (e) {
                $('#currencyBalanceOne').html(bigNum2Small(0));
                $('#currencyBalanceTwo').html(bigNum2Small(0));
            });
            */

    $(document).on('click', '#logoutAClick', function () {
        request('/auth/logout', 'POST', '{}')
            .then(function (d) {
                window.location.reload();
            })
            .catch(function (e) {
                warning("There was an error logging you out. Please reload the page, and try again.");
            });
    });
} else {

}

function toast(success, msg) {
    if (success) {
        success = "success"
    } else {
        success = "error";
    }
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
    });

    Toast.fire({
        type: success,
        title: msg
    });
}

function nform(number, decimals, dec_point, thousands_sep) {
    return number_format(number, decimals, dec_point, thousands_sep);
}

// @Import: /js/functions/number_format.js
function number_format(number, decimals, dec_point, thousands_sep) {
    // Strip all characters but numerical ones.
    number = (number + '').replace(/[^0-9+\-Ee.]/g, '');
    var n = !isFinite(+number) ? 0 : +number,
        prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
        sep = (typeof thousands_sep === 'undefined') ? ',' : thousands_sep,
        dec = (typeof dec_point === 'undefined') ? '.' : dec_point,
        s = '',
        toFixedFix = function (n, prec) {
            var k = Math.pow(10, prec);
            return '' + Math.round(n * k) / k;
        };
    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.');
    if (s[0].length > 3) {
        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep);
    }
    if ((s[1] || '').length < prec) {
        s[1] = s[1] || '';
        s[1] += new Array(prec - s[1].length + 1).join('0');
    }
    return s.join(dec);
}

/**
 * Set the names of users or items on a page
 * @param {string} type user | catalog
 * @param {array} idsarray An array of ids
 */
function setNames(type, idsarray) {
    // Only supports catalog and user for now
    if (type !== "user" && type !== "catalog" && type !== "group") {
        return { success: false };
    }
    // Setup Globals
    if (window["nameArray" + type] === undefined) {
        window["nameArray" + type] = {};
    }
    if (window["pendingNameArray" + type] === undefined) {
        window["pendingNameArray" + type] = {};
    }
    // Global to Variable
    var global = window["nameArray" + type];
    var pending = window["pendingNameArray" + type];
    // Setup names for divs
    function setDivs(id, name) {
        $("h6[data-" + type + "id='" + id + "']").html(name);
        $("h5[data-" + type + "id='" + id + "']").html(name);
        $("h4[data-" + type + "id='" + id + "']").html(name);
        $("h3[data-" + type + "id='" + id + "']").html(name);
        $("h2[data-" + type + "id='" + id + "']").html(name);
        $("h1[data-" + type + "id='" + id + "']").html(name);
        $("p[data-" + type + "id='" + id + "']").html(name);
        $("a[data-" + type + "id='" + id + "']").html(name);
        $("span[data-" + type + "id='" + id + "']").html(name);
    }
    // Filter ids
    var ids = [...new Set(idsarray)];
    // Duplicate Array (hacky method)
    // TODO: use something less "hacky"
    var pendingIds = JSON.parse(JSON.stringify(ids));
    // If larger than 25
    if (pendingIds.length > 25) {
        // Break it up into multiple requests
        setNames(type, pendingIds.slice(25));
        pendingIds = pendingIds.slice(0, 25);
    }
    ids.forEach(function (k, v, object) {
        if (typeof global[k] !== "undefined" && global[k] !== null || pending[k] !== undefined) {
            pendingIds.forEach(function (num, index, obj) {
                if (num === k) {
                    pendingIds.splice(index, 1)
                }
            });
            setDivs(k, global[k]);
        } else {
            pending[k] = true;
        }
    });
    if (pendingIds.length > 0) {
        pendingIds = arrayToCsv(pendingIds);
        request("/" + type + "/names?ids=" + pendingIds, "GET")
            .then(function (ids) {
                $.each(ids, function (index, value) {
                    if (value.username) {
                        setDivs(value.userId, value.username);
                        global[value.userId] = value.username;
                    } else if (value.catalogName) {
                        setDivs(value.catalogId, value.catalogName);
                        global[value.catalogId] = value.catalogName;
                    }else if (value.groupName) {
                        setDivs(value.groupId, value.groupName);
                        global[value.groupId] = value.groupName;
                    } else {
                        setDivs(value.id, "Loading");
                    }
                });
            })
            .catch(function (e) {
                // Invalid IDs or possibly pending
            });
    }
}

function setUserNames(ids) {
    setNames("user", ids);
}

function setGroupNames(ids) {
    setNames("group", ids);
}

function setCatalogNames(ids) {
    setNames("catalog", ids);
}

// Setup names for divs
function setDivsForStaffTag(id, name) {
    name = name.permissionLevel;
    var dataType = "stafftype-user";
    $("h6[data-" + dataType + "id='" + id + "']").html(name);
    $("h5[data-" + dataType + "id='" + id + "']").html(name);
    $("h4[data-" + dataType + "id='" + id + "']").html(name);
    $("h3[data-" + dataType + "id='" + id + "']").html(name);
    $("h2[data-" + dataType + "id='" + id + "']").html(name);
    $("h1[data-" + dataType + "id='" + id + "']").html(name);
    $("p[data-" + dataType + "id='" + id + "']").html(name);
    $("a[data-" + dataType + "id='" + id + "']").html(name);
    $("span[data-" + dataType + "id='" + id + "']").html(name);
}
// Setup names for divs
function setDivsForCount(id, name) {
    name = name.postCount;
    var dataType = "postcount-user";
    $("h6[data-" + dataType + "id='" + id + "']").html(name);
    $("h5[data-" + dataType + "id='" + id + "']").html(name);
    $("h4[data-" + dataType + "id='" + id + "']").html(name);
    $("h3[data-" + dataType + "id='" + id + "']").html(name);
    $("h2[data-" + dataType + "id='" + id + "']").html(name);
    $("h1[data-" + dataType + "id='" + id + "']").html(name);
    $("p[data-" + dataType + "id='" + id + "']").html(name);
    $("a[data-" + dataType + "id='" + id + "']").html(name);
    $("span[data-" + dataType + "id='" + id + "']").html(name);
}
// Setup names for divs
function setDivsForSignature(id, name) {
    name = name.signature;
    if (name) {
        name = name.escape();
    }
    var dataType = "signature-user";
    $("h6[data-" + dataType + "id='" + id + "']").html(name);
    $("h5[data-" + dataType + "id='" + id + "']").html(name);
    $("h4[data-" + dataType + "id='" + id + "']").html(name);
    $("h3[data-" + dataType + "id='" + id + "']").html(name);
    $("h2[data-" + dataType + "id='" + id + "']").html(name);
    $("h1[data-" + dataType + "id='" + id + "']").html(name);
    $("p[data-" + dataType + "id='" + id + "']").html(name);
    $("a[data-" + dataType + "id='" + id + "']").html(name);
    $("span[data-" + dataType + "id='" + id + "']").html(name);
}
function setForumDivs(id, name) {
    setDivsForCount(id, name);
    setDivsForStaffTag(id, name);
    setDivsForSignature(id, name);
}
/**
 * Set a user's post count for the Forums
 * @param {array<number>} idsUnInt Array of UserIds
 */
function setUserPostCount(idsUnInt) {
    var type = "forumdata-user";
    // Setup Globals
    if (window["postCountArray" + type] === undefined) {
        window["postCountArray" + type] = {};
    }
    if (window["pendingPostCountArray" + type] === undefined) {
        window["pendingPostCountArray" + type] = {};
    }
    // Global to Variable
    var global = window["postCountArray" + type];
    var pending = window["pendingPostCountArray" + type];
    // Filter ids
    var ids = [...new Set(idsUnInt)];
    // Duplicate Array (hacky method)
    // TODO: use something less "hacky"
    var pendingIds = JSON.parse(JSON.stringify(ids));
    ids.forEach(function (k, v, object) {
        if (typeof global[k] !== "undefined" && global[k] !== null || pending[k] !== undefined) {
            pendingIds.forEach(function (num, index, obj) {
                if (num === k) {
                    pendingIds.splice(index, 1)
                }
            });
            if (global[k]) {
                setForumDivs(k, global[k]);
            }
        } else {
            pending[k] = true;
        }
    });
    if (pendingIds.length > 0) {
        pendingIds = arrayToCsv(pendingIds);
        request("/user/forum?ids=" + pendingIds, "GET")
            .then(function (ids) {
                $.each(ids, function (index, value) {
                    if (value) {
                        global[value.userId] = value;
                        setForumDivs(value.userId, global[value.userId]);
                    }
                });
            })
            .catch(function (e) {
                console.log(e);
                // Invalid IDs or possibly pending
            });
    }
}
/**
 * Set a user's signature for the Forums
 * @param {array<number>} idsUnInt Array of UserIds
 */
function setUserSignature(idsUnInt) {
    var type = "forumdata-user";
    // Setup Globals
    if (window["postCountArray" + type] === undefined) {
        window["postCountArray" + type] = {};
    }
    if (window["pendingPostCountArray" + type] === undefined) {
        window["pendingPostCountArray" + type] = {};
    }
    // Global to Variable
    var global = window["postCountArray" + type];
    var pending = window["pendingPostCountArray" + type];
    // Filter ids
    var ids = [...new Set(idsUnInt)];
    // Duplicate Array (hacky method)
    // TODO: use something less "hacky"
    var pendingIds = JSON.parse(JSON.stringify(ids));
    ids.forEach(function (k, v, object) {
        if (typeof global[k] !== "undefined" && global[k] !== null || pending[k] !== undefined) {
            pendingIds.forEach(function (num, index, obj) {
                if (num === k) {
                    pendingIds.splice(index, 1)
                }
            });
            if (global[k]) {
                setForumDivs(k, global[k]);
            }
        } else {
            pending[k] = true;
        }
    });
    if (pendingIds.length > 0) {
        request("/user/forum", "POST", JSON.stringify({ ids: pendingIds }))
            .then(function (ids) {
                $.each(ids, function (index, value) {
                    if (value) {
                        global[value.id] = value;
                        setForumDivs(value.id, global[value.id]);
                    }
                });
            })
            .catch(function (e) {
                console.log(e);
                // Invalid IDs or possibly pending
            });
    }
}
/**
 * Set a user's Permission Type for the forums
 * @param {array<number>} idsUnInt Array of UserIds
 */
function setUserPermissionType(idsUnInt) {
    var type = "forumdata-user";
    // Setup Globals
    if (window["postCountArray" + type] === undefined) {
        window["postCountArray" + type] = {};
    }
    if (window["pendingPostCountArray" + type] === undefined) {
        window["pendingPostCountArray" + type] = {};
    }
    // Global to Variable
    var global = window["postCountArray" + type];
    var pending = window["pendingPostCountArray" + type];
    // Filter ids
    var ids = [...new Set(idsUnInt)];
    // Duplicate Array (hacky method)
    // TODO: use something less "hacky"
    var pendingIds = JSON.parse(JSON.stringify(ids));
    ids.forEach(function (k, v, object) {
        if (typeof global[k] !== "undefined" && global[k] !== null || pending[k] !== undefined) {
            pendingIds.forEach(function (num, index, obj) {
                if (num === k) {
                    pendingIds.splice(index, 1)
                }
            });
            if (global[k]) {
                setForumDivs(k, global[k]);
            }
        } else {
            pending[k] = true;
        }
    });
    if (pendingIds.length > 0) {
        request("/user/forum", "POST", JSON.stringify({ ids: pendingIds }))
            .then(function (ids) {
                $.each(ids, function (index, value) {
                    if (value) {
                        global[value.id] = value;
                        setForumDivs(value.id, global[value.id]);
                    }
                });
            })
            .catch(function (e) {
                // Invalid IDs or possibly pending
            });
    }
}

/**
 * Set the thumbs for images on the page
 * @param {string} type user | catalog
 * @param {array} idsUnInit array of ids
 */
function setThumbs(type, idsUnInit) {
    function setThumb(id, src) {
        $("img[data-" + type + "id='" + id + "']").attr("src", src);
        // TODO: Remove this and possible return a promise or something to tell the calling function when to show it's parent (or parent's parent, or parent's parent's parent, etc [you can see how this doesn't work well])
        $("img[data-" + type + "id='" + id + "']").parent().show();
    }
    // Setup Subsitution URL
    var sub = window.subsitutionimageurl;
    // Only supports catalog and user for now
    if (type !== "user" && type !== "catalog") {
        return false;
    }
    // Setup Globals
    if (window["thumbArray" + type] === undefined) {
        window["thumbArray" + type] = {};
    }
    if (window["pendingThumbArray" + type] === undefined) {
        window["pendingThumbArray" + type] = {};
    }
    // Global to Variable
    var global = window["thumbArray" + type];
    var pending = window["pendingThumbArray" + type];
    // Filter duplicates
    var ids = [...new Set(idsUnInit)];
    // Duplicate Array
    var pendingIds = JSON.parse(JSON.stringify(ids));
    // If larger than 25
    if (pendingIds.length > 25) {
        // Break it up into multiple requests
        setThumbs(type, pendingIds.slice(25));
        pendingIds = pendingIds.slice(0, 25);
    }
    ids.forEach(function (k, v, object) {
        if (typeof global[k] !== "undefined" && global[k] !== null || pending[k] !== undefined) {
            pendingIds.forEach(function (num, index, obj) {
                if (num === k) {
                    pendingIds.splice(index, 1)
                }
            });
        } else {
            pending[k] = true;
        }
        if (global[k] !== undefined) {
            setThumb(k, global[k]);
        } else {
            setThumb(k, window.subsitutionimageurl);
        }
    });
    if (pendingIds.length > 0) {
        pendingIds = arrayToCsv(pendingIds);
        request("/" + type + "/thumbnails?ids=" + pendingIds, "GET")
            .then(function (pics) {
                $.each(pics, function (index, value) {
                    if (value.userId) {
                        if (value.url) {
                            global[value.userId] = value.url;
                            setThumb(value.userId, value.url);
                        } else {
                            setThumb(value.userId, sub);
                        }
                        $("img[data-" + type + "id='" + value.userId + "']").parent().show();
                    } else if (value.catalogId) {
                        if (value.url) {
                            global[value.catalogId] = value.url;
                            setThumb(value.catalogId, value.url);
                        } else {
                            setThumb(value.catalogId, sub);
                        }
                        $("img[data-" + type + "id='" + value.catalogId + "']").parent().show();
                    }
                });
                // Repair any broken images
                $('img[data-' + type + 'id]').each(function () {
                    if (typeof $(this).attr("src") === "undefined") {
                        $(this).attr("src", sub);
                        $(this).parent().show();
                    }
                });
            })
            .catch(function (e) {
                // Reset
                $('img[data-' + type + 'id]').each(function () {
                    if (typeof $(this).attr("src") === "undefined") {
                        $(this).attr("src", sub);
                        $(this).parent().show();
                    }
                });
            })
    }
}

function arrayToCsv(array) {
    var csv = "";
    array.forEach(function (id) {
        csv = csv + "," + id;
    });
    csv = csv.slice(1, csv.length);
    return csv;
}

function setUserThumbs(ids) {
    setThumbs("user", ids);
}
function setGroupThumbs(ids) {
    setThumbs("catalog", ids);
}

function setCatalogThumbs(ids) {
    setThumbs("catalog", ids);
}

function doSwalStuff(call) {
    $('.swal2-popup').fadeOut(100).dequeue();
    $('.swal2-container').fadeOut(100).dequeue();
    setTimeout(function () {
        $('body').removeClass("swal2-shown");
        $('body').attr("style", "");
    }, 100);
    setTimeout(function () {
        $('.swal2-popup').remove();
        $('.swal2-container').remove();
        call();
    }, 250);
}

function success(message, callback) {
    Swal.fire({
        type: 'success',
        title: 'Success',
        text: message,
        heightAuto: false,
        animation: false,
        customClass: {
            popup: 'animated fadeInUp'
        },
    }).then(function (e) {
        doSwalStuff(function () {
            if (typeof callback === "function") {
                callback();
            }
        });
    });
}

function note(message, callback) {
    Swal.fire({
        title: 'Note',
        text: message,
        heightAuto: false,
        animation: false,
        customClass: {
            popup: 'animated fadeInUp'
        },
    }).then(function (e) {
        doSwalStuff(function () {
            if (!e || !e.value || e.value !== true) {
                return;
            }
            if (typeof callback === "function") {
                callback();
            }
        });
    });
}

function questionYesNoHtml(message, callback) {
    Swal.fire({
        title: 'Are you sure?',
        html: message,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes',
        heightAuto: false,
        animation: false,
        customClass: {
            popup: 'animated fadeInUp'
        },
    }).then(function (result) {
        doSwalStuff(function () {
            if (result.value) {
                callback();
            }
        });
    })
}

function questionYesNo(message, callback) {
    Swal.fire({
        title: 'Are you sure?',
        text: message,
        type: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes',
        heightAuto: false,
        animation: false,
        customClass: {
            popup: 'animated fadeInUp'
        },
    }).then(function (result) {
        doSwalStuff(function () {
            if (result.value) {
                callback();
            }
        });
    })
}

function question(message, callback, type, defaults) {
    if (typeof type === "undefined" || type === null) {
        type = 'text';
    }
    if (typeof defaults === "undefined" || defaults === null) {
        defaults = {};
    }
    Swal.fire({
        title: message,
        input: type,
        inputPlaceholder: '',
        inputOptions: defaults,
        heightAuto: false,
        animation: false,
        customClass: {
            popup: 'animated fadeInUp'
        },
    }).then(function (text) {
        if (type === 'select') {
            text = {};
            text.value = $('.swal2-select').val();
            console.log(text);
        }
        doSwalStuff(function () {
            if (text.value) {
                if (typeof callback === "function") {
                    callback(text.value);
                }
            }
        });
    });
}

function warning(message, callback) {
    Swal.fire({
        type: 'error',
        title: 'Error',
        text: message,
        heightAuto: false,
        animation: false,
        customClass: {
            popup: 'animated fadeInUp'
        },
    }).then(function (e) {
        doSwalStuff(function () {
            if (typeof callback === "function") {
                callback();
            }
        });
    });
}

function loading() {
    Swal.fire({
        title: 'Loading...',
        onBeforeOpen: () => {
            Swal.showLoading();
        },
        heightAuto: false,
        animation: false,
        customClass: {
            popup: 'animated fadeInUp'
        },
    });
}

const errorTransform = (errCode) => {
    switch (errCode) {
        case 'InternalServerError': {
            return 'An internal server error has ocurred.';
        }
        case 'LogoutRequired': {
            return 'You must be logged out to perform this action.';
        }
        case 'InvalidUsernameOrPassword': {
            return 'The username or password specified is invalid.';
        }
        case 'LoginRequired': {
            return 'You must be logged in to perform this action.';
        }
        case 'InvalidBirthDate': {
            return 'The birth-date you entered is invalid. Please try again.';
        }
        case 'InvalidUsername': {
            return 'The username you entered is invalid. Please try again.';
        }
        case 'InvalidPassword': {
            return 'The password you entered is invalid. Please try again.';
        }
        case 'UsernameConstraint1Space1Period1Underscore': {
            return 'Your username can only contain 1 space, 1 period, and 1 underscore.';
        }
        case 'UsernameConstriantCannotEndOrStartWithSpace': {
            return 'Your username cannot start or end with a space.';
        }
        case 'UsernameConstraintInvalidCharacters': {
            return 'Your username does not contain valid characters. Please try again.';
        }
        case 'UsernameConstriantTooLong': {
            return 'Your username exceeds the maximum length of 18 characters.';
        }
        case 'UsernameConstrintTooShort': {
            return 'Your username must be at least 3 characters.';
        }
        case 'OneAccountPerIP': {
            return 'Sorry! You can\'t signup right now. Please try again later.';
        }
        case 'CannotSendRequest': {
            return 'You cannot send this request right now.';
        }
        case 'InvalidPrice': {
            return 'The price specified is invalid.';
        }
        case 'CannotBeSold': {
            return 'This item cannot be sold.';
        }
        case 'CannotTradeWithUser': {
            return 'You cannot trade with this user right now.';
        }
        case 'NotEnoughCurrency': {
            return 'You do not have enough currency for this transaction.';
        }
        case 'InvalidAmount': {
            return 'The amount specified is invalid.';
        }
        case 'NoLongerForSale': {
            return 'This item is no longer for sale.';
        }
        case 'SellerHasChanged': {
            return 'This item is no longer for sale.';
        }
        case 'CurrencyHasChanged': {
            return 'This item is no longer for sale.';
        }
        case 'PriceHasChanged': {
            return 'The price for this item has changed. Please reload this page to see the latest price.';
        }
        case 'AlreadyOwns': {
            return 'You already own this item.';
        }
        case 'ItemStillForSale': {
            return 'You cannot buy this item right now.';
        }
        case 'ItemNoLongerForSale': {
            return 'This item is no longer for sale.';
        }
        case 'OneOrMoreItemsNotAvailable': {
            return 'One or more of the items in this trade are no longer available. This trade cannot be completed.';
        }
        case 'AvatarCooldown': {
            return 'You cannot update your avatar right now. Try again in a few minutes.';
        }
        case 'EmailVerificationRequired': {
            return 'You must verify your account\'s email address before you can perform this action.';
        }
        case 'BlurbTooLarge': {
            return 'Your blurb is too large.';
        }
        case 'InvalidOldPassword': {
            return 'The old password specified does not match your current password. Please try again.';
        }
        case 'InalidPassword': {
            return 'THe password specified is invalid. Please try again.';
        }
        case 'InvalidCode': {
            return 'The code specified is invalid.';
        }
        case 'FloodCheck': {
            return 'You cannot complete this action right now. Please try again in a few minutes.';
        }
        case 'InvalidEmail': {
            return 'The email specified does not seem to be valid.';
        }
        case 'InvalidTheme': {
            return 'The theme specified is invalid.';
        }
        case 'InvalidOption': {
            return 'The option specified is invalid.';
        }
        case 'CaptchaValidationFailed': {
            return 'Captcha Validation Failed. Please fill out the captcha.';
        }
        case 'InvalidGroupPermissions': {
            return 'You do not have permission to perform this action.';
        }
        case 'AlreadyGroupMember': {
            return 'You are already a member of this group.';
        }
        case 'TooManyGroups': {
            return 'You are in the maximum amount of groups. Please leave a group and try again.';
        }
        case 'InvalidGroupRank': {
            return 'The rank name specified must be between 1 and 254.';
        }
        case 'InvalidRolesetName': {
            return 'The roleset name is invalid.';
        }
        case 'InvalidRolesetDescription': {
            return 'The roleset description is invalid.';
        }
        case 'InvalidRolesetPermissions': {
            return 'The roleset permissions are invalid.';
        }
        case 'RankIdIsTaken': {
            return 'The rank specified is invalid or currently in use by another roleset.';
        }
        case 'TooManyRolesets': {
            return 'This group has reached the maximum amount of rolesets.';
        }
        case 'RolesetHasMembers': {
            return 'You cannot delete a roleset that currently has members. Re-rank all existing members to a new role, then try again.';
        }
        case 'CannotDeleteFirstRoleInGroup': {
            return 'You cannot delete the first role in a group.';
        }
        case 'UserNotInGroup': {
            return 'The user specified is not a member of this group.';
        }
        case 'CannotRankUser': {
            return 'You are not authorized to rank this user.';
        }
        case 'ShoutCooldown': {
            return 'You cannot perform this action right now. Please try again later.';
        }
        case 'InvalidFileType': {
            return 'The file type provided is invalid. Please try again.';
        }
        case 'InvalidGroupName': {
            return 'The group name specified is invalid.';
        }
        case 'InvalidGroupDescription': {
            return 'The group description specified is invalid.';
        }
        case 'GroupNameTaken': {
            return 'The group name specified is already in use by another group. Please try another name.';
        }
        case 'InvalidReason': {
            return 'The reason specified is invalid.';
        }
        case 'InvalidPrivateReason': {
            return 'The private reason specified is invalid.';
        }
        case 'ConstraintIfDeletedUserMustAlsoBeTerminated': {
            return 'If a user is deleted, the "Terminated" option must also be selected. Please try again.';
        }
        case 'CommentTooLarge': {
            return 'Your comment is too large. Please try again.';
        }
        case 'InvalidCurrencyAmount': {
            return 'The currency amount specified is invalid.';
        }
        case 'InvalidCatalogIdOrState': {
            return 'The state or catalogId is invalid.';
        }
        case 'InvalidBannerText': {
            return 'The banner text specified is invalid.';
        }
        case 'InvalidRank': {
            return 'The rank specified is invalid.';
        }
        case 'RankCannotBeAboveCurrentUser': {
            return 'The rank specified cannot be above your rank.';
        }
        case 'InvalidSubCategoryId': {
            return 'The subCategoryId specified is invalid.';
        }
        case 'InvalidTitle': {
            return 'The title specified is invalid.';
        }
        case 'InvalidBody': {
            return 'The body specified is invalid.';
        }
        case 'ThreadLocked': {
            return 'This thread is locked, so you are unable to reply to it.';
        }
        case 'InvalidCatalogName': {
            return 'The catalog name specified is invalid.';
        }
        case 'InvalidModerationStatus': {
            return 'The moderation status specified is invalid.';
        }
        case 'InvalidCatalogDescription': {
            return 'The description specified is invalid.';
        }
        case 'InvalidIsForSaleOption': {
            return 'The isForSale option specified is invalid.';
        }
        case 'ConstraintPriceTooHigh': {
            return 'The price specified is too high.';
        }
        case 'InvalidComment': {
            return 'The comment specified is invalid.';
        }
        case 'NoFileSpecified': {
            return 'Please specify at least one valid file.';
        }
        case 'InvalidOBJSpecified': {
            return 'The OBJ file specified is invalid.';
        }
        case 'InvalidMTLSpecified': {
            return 'The MTL file specified is invalid.';
        }
        case 'TooManyRequests': {
            return 'You have been making too many requests. Try again later.';
        }
    }
    return 'An unknown error has ocurred. Please try again later, or contact support.';
}

function request(url, method, body) {
    return new Promise((resolve, reject) => {
        ajax($('#userdata').attr("data-csrf"));
        function ajax(csrf) {
            $.ajax({
                type: method,
                data: body,
                url: "/api/v1" + url,
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRF-Token": csrf,
                },
                dataType: "json",
                contentType: "application/json",  // what you are sending
                xhr: function () {
                    var xhr = jQuery.ajaxSettings.xhr();
                    var setRequestHeader = xhr.setRequestHeader;
                    xhr.setRequestHeader = function (name, value) {
                        if (name == 'X-Requested-With') return;
                        setRequestHeader.call(this, name, value);
                    }
                    return xhr;
                },
                complete: function (xhr, textStatus) {
                    if (xhr.status === 200) {
                        resolve(xhr)
                    } else if (xhr.status === 403) { //Csrf Validation Failed
                        $('#userdata').attr("data-csrf", xhr.getResponseHeader('X-CSRF-Token'));
                        return ajax(xhr.getResponseHeader('X-CSRF-Token'));
                    } else {
                        if (!xhr.responseJSON) {
                            xhr.responseJSON = {};
                        }
                        if (typeof xhr.responseJSON.message === "undefined") {
                            xhr.responseJSON.message = "An unknown error has ocurred.";
                        }
                        if (xhr.responseJSON && xhr.responseJSON.error && xhr.responseJSON.error.code) {
                            xhr.responseJSON.message = errorTransform(xhr.responseJSON.error.code);
                        }
                        reject(xhr);
                    }
                },
                failure: function (err) {
                    if (!err.responseJSON) {
                        err.responseJSON = {};
                        err.responseJSON.message = "An unknown error has ocurred.";
                    }
                    if (err.responseJSON && err.responseJSON.error && err.responseJSON.error.code) {
                        err.responseJSON.message = errorTransform(err.responseJSON.error.code);
                    }
                    reject(err);
                }
            });
        }
    });
}

$(window).on('resize', function () {
    resizeBottomNav();
});
$(document).ready(function () {
    resizeBottomNav();
});
function resizeBottomNav() {
    var height = $('.navbar.navbar-expand-lg.navbar-dark.bg-success.fixed-top').outerHeight();
    if (height > 100) {
        return;
    }
    $('.row.paddingForStickyNav').css('margin-top', height + 'px')
}

try {
    sessionStorage.setItem("test", 'test');
    sessionStorage.removeItem("test", 'test');
} catch (e) {
    // fallback if incognito or something
    var object = {};
    sessionStorage = {};
    sessionStorage.setItem = function (k, v) {
        object[k] = v;
    }
    sessionStorage.getItem = function (k) {
        return object[k];
    }
    sessionStorage.removeItem = function (k) {
        delete object[k];
    }
}
/**
 * Why did I re-invent the wheel? I think what you should be asking is why *didn't* i reinvent the wheel
 */
/*
var callingPage = {};
callingPage.calls = [];
callingPage.register = function(callback) {
    console.log("Register");
    callingPage.calls.push(callback);
}
callingPage.callAll = function(page) {
    callingPage.calls.forEach(function(call) {
        call(page);
    })
}
*/
/*
$(document).on('click', 'a', function(e) {
    e.preventDefault();
    var url = $(this).attr('href');
    if (url.slice(0, 1) === '/') {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            window.history.replaceState(null, null, url);
            if (this.readyState == 4) {
                var body = $(this.responseText);
                $('.content').first().html($(body).find('.content').first().html());
                $('title').html($(body).find('title').html());
                callingPage.callAll(url);
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
    }else{
        window.location.href = url;
    }
});
$(document).ready(function() {
    var path = window.location.pathname;
    callingPage.callAll(path);
});
*/

$(document).on('click', '.onClickShowTabs', function (e) {
    e.preventDefault();
    var classToSearchFor = $(this).parent().attr('data-tabs');
    var idToShow = $(this).attr('id');
    $('.' + classToSearchFor).children().each(function () {
        $(this).hide();
        if ($(this).attr('data-id') === idToShow) {
            $(this).show();
        }
    });
});