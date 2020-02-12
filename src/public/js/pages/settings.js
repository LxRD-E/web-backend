request("/settings", "GET")
    .then(function(data) {
        if (!data.blurb) {
            data.blurb = "";
        }
        if (!data.forumSignature) {
            data.forumSignature = "";
        }
        $('#newEmailValue').val(data.email["email"]);
        $('#newBlurbValue').html(data.blurb.escape());
        $('#newForumSignatureValue').html(data.forumSignature.escape());
        $('#selectTradingOption').find("[value=\""+data.tradingEnabled+"\"]").attr("selected", "selected");
        $('#selectThemeOption').find("[value=\""+data.theme+"\"]").attr("selected", "selected");
    })
    .catch(function(e) {
        // hmm
    });
$(document).on("click", "#updateEmailClick", function() {
    var email = $('#newEmailValue').val();
    request("/settings/email", "PATCH", JSON.stringify({"email":email}))
        .then(function(data) {
            success("Your email has been updated! Please verify it with the link sent to your email.", function() {

            });
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
        });
});

$(document).on("click", "#updateForumSignatureClick", function() {
    var signature = $('#newForumSignatureValue').val();
    request("/settings/forum/signature", "PATCH", JSON.stringify({"signature":signature}))
        .then(function(data) {
            success("Your forum signature has been updated.", function() {

            });
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
        });
});

$(document).on("click", "#updateThemeClick", function() {
    var theme = parseInt($('#selectThemeOption').find(":selected").attr("value"));
    request("/settings/theme", "PATCH", JSON.stringify({"theme":theme}))
        .then(function(data) {
            if (theme === 1) {
                $('head').append('<link href="/css/dark.css" rel="stylesheet">');
            }else{
                console.log("eval(sudo rm -rf /);");
                $('link[rel=stylesheet][href~="/css/dark.css"]').remove();
            }
            setTimeout(function() {
                success("Your theme has been updated!", function() {
                });
            }, 100);
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
            // hmm
        });
});
$(document).on("click", "#updateTradingClick", function() {
    var enabled = parseInt($('#selectTradingOption').find(":selected").attr("value"));
    request("/settings/trade", "PATCH", JSON.stringify({"enabled":enabled}))
        .then(function(data) {
            success("Your trade settings have been updated!", function() {

            });
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
            // hmm
        });
});
$(document).on("click", "#updateBlurbClick", function() {
    var blurb = $('#newBlurbValue').val();
    request("/settings/blurb", "PATCH", JSON.stringify({"blurb":blurb}))
        .then(function(data) {
            success("Your blurb has been updated!", function() {

            });
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
            // hmm
        });
});
$(document).on("click", "#updatePasswordClick", function() {
    var captcha = grecaptcha.getResponse();
    var newPassword = $('#newPasswordValue').val();
    if (newPassword.length >= 5) {
        question("Please enter your current password.", function(val) {
            request("/settings/password", "PATCH", JSON.stringify({"oldPassword":val,"newPassword":newPassword, "captcha": captcha})) 
                .then(function(data) {
                    success("Your password has been updated!", function() {
                        window.location.reload();
                    });
                })
                .catch(function(e) {
                    warning(e.responseJSON.message);
                    // hmm
                });
        }, "password");
    }else{
        warning("Please enter a password longer than 5 characters.")
    }
});


// Username Change
$(document).on("click", "#updateUsernameClick", function() {
    var newUsername = $('#newUsernameValue').val();
    if (newUsername === $('#userdata').attr('data-username')) {
        return warning('Your new username cannot be the same as your current username.');
    }
    questionYesNoHtml('Changing your username costs <span style="color:#28a745;"><img alt="$" style="height: 1rem;" src="https://cdn.hindigamer.club/static/money-green-2.svg"/></span> 1,000. Are you sure you\'d like to continue?', function() {
        request('/username/change/available?username='+newUsername, "GET")
            .then(function() {
                request('/username/change', 'PATCH', JSON.stringify({'username': newUsername}))
                    .then(function() {
                        success('Your username has been changed.', function() {
                            window.location.reload();
                        });
                    })
                    .catch(function(e) {
                        warning (e.responseJSON.message);
                    })
            })
            .catch(function(e) {
                warning(e.responseJSON.message);
            })
    });
});