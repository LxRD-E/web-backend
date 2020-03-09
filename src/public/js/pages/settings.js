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

        if (data['2faEnabled'] === 0) {
            $('#twoFactorAuth').find('[value=0]').attr('selected','selected');
            $('#twoFactorAuth').change(function(ev) {
                $('#updateTwoFactorAuthenticatorClick').off('click');
                console.log('changed');
                let val = parseInt($('#twoFactorAuth').find(":selected").attr("value"));
                if (val === 1) {
                    $('#twoFactorAuth').attr('disabled','disabled');
                    $('#updateTwoFactorAuthenticatorClick').attr('disabled','disabled');
                    $('#two-factor-auth-area').empty().append(`
                    <div class="row" style="margin-top:1rem;">
                        <div class="col-12">
                            <div class="spinner-border" role="status" style="display:block;margin:0 auto;">
                                <span class="sr-only">Loading...</span>
                            </div>
                        </div>
                    </div>
                    
                    `);
                    
                    request('/auth/generate-totp-secret', 'POST', {})
                    .then(d => {
                        let qrCodeUrl = d.qrCodeUrl;
                        let secret = d.secret.base32;
                        $('#two-factor-auth-area').empty().append(`
                        
                        <div class="row" style="margin-top:1rem;">
                            <div class="col-12">
                                <img src="${qrCodeUrl}" style="display:block;margin:0 auto;" />
                            </div>
                            <div class="col-8 offset-2" style="margin-top:1rem;">
                                <h2 style="font-size:1.5rem;">Step One</h2>
                                <p>Scan the above QR Code with a 2-Factor authentication app, such as the Google Authenticator App for <a href="https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2" target="_blank">Android</a> & <a href="https://apps.apple.com/ca/app/google-authenticator/id388497605" target="_blank">iOS</a>. Or, you can enter the Base32 secret below into your application of choice:<br><code style="font-size:1.25rem;width:100%;display:block;text-align:center;">${secret}</code></p>

                                <h2 style="font-size:1.5rem;margin-top:1rem;">Step Two</h2>
                                <p>Enter your account's password.</p>
                                <input type="password" class="form-control" id="two-factor-password" value="" placeholder="Account Password" style="margin-top:1rem;" autocomplete="password">

                                <h2 style="font-size:1.5rem;margin-top:1rem;">Step Three</h2>
                                <p>Next, enter the 2FA code provided for your application (such as "123 456"), and press "Update" above to enable 2FA.</p>
                                <input type="text" class="form-control" id="two-factor-token" value="" placeholder="2FA Token" style="margin-top:1rem;" maxlength="7" minlength="6">
                            </div>
                        </div>
                        
                        
                        `);
                        $('#updateTwoFactorAuthenticatorClick').click(function(e) {
                            let token = $('#two-factor-token').val().replace(/\s/g, '').replace(/,/g, '').replace(/\./g,'').trim();
                            if (token.length !== 6) {
                                return warning('It seems the token you entered is invalid. Please try again.');
                            }
                            // disable all inputs
                            $('#twoFactorAuth').attr('disabled','disabled');
                            $('#two-factor-token').attr('disabled','disabled');
                            $('#updateTwoFactorAuthenticatorClick').attr('disabled','disabled');
                            $('#two-factor-password').attr('disabled','disabled');
                            // grab vars to send
                            // Secret is defined as secret
                            console.log(token);
                            request('/auth/totp', 'PATCH', JSON.stringify({
                                secret: secret,
                                token: token,
                                password: $('#two-factor-password').val(),
                            })).then(d => {
                                $('#two-factor-auth-area').empty();
                                success('Two-Factor authentication has been enabled for your account. You will be required to enter a code the next time you login.', () => {
                                    window.location.reload();
                                });
                                $('#updateTwoFactorAuthenticatorClick').off('click');
                            }).catch(e => {
                                $('#twoFactorAuth').removeAttr('disabled');
                                $('#two-factor-token').removeAttr('disabled');
                                $('#updateTwoFactorAuthenticatorClick').removeAttr('disabled');
                                $('#two-factor-password').removeAttr('disabled');
                                if (e.responseJSON.error && e.responseJSON.error.code === 'InvalidTokenOrSecret') {
                                    return warning('It seems the token you entered is invalid. Please try again.');
                                }else if (e.responseJSON.error && e.responseJSON.error.code === 'InvalidPassword') {
                                    return warning('The password you entered does not match your account\'s current password. Please try again.');
                                }else{
                                    return warning('Sorry, an unknown error has ocurred. Please try again.');
                                }
                            });

                        });
                        setTimeout(() => {
                            $('#twoFactorAuth').removeAttr('disabled');
                            $('#updateTwoFactorAuthenticatorClick').removeAttr('disabled');
                        }, 500);
                    })
                    .catch(e => {
                        warning('It looks like you can\'t enable 2FA right now. Please try again later.');
                        $('#twoFactorAuth').removeAttr('disabled');
                        $('#updateTwoFactorAuthenticatorClick').removeAttr('disabled');
                    });
                    
                }else if (val === 0) {
                    $('#two-factor-auth-area').empty();
                }
            });
        }else{
            $('#twoFactorAuth').find('[value=1]').attr('selected','selected');
            $('#twoFactorAuth').change(function(ev) {
                $('#updateTwoFactorAuthenticatorClick').off('click');
                console.log('changed');
                let val = parseInt($('#twoFactorAuth').find(":selected").attr("value"));
                if (val === 0) {
                    $('#two-factor-auth-area').append(`
                    
                    <div class="row" style="margin-top:1rem;">
                            <div class="col-8 offset-2" style="margin-top:1rem;">

                                <h2 style="font-size:1.5rem;margin-top:1rem;">Enter Password</h2>
                                <p>For security reasons, to disable 2FA, enter your account's password.</p>
                                <input type="password" class="form-control" id="two-factor-password" value="" placeholder="Account Password" style="margin-top:1rem;" autocomplete="password">

                            </div>
                        </div>
                    
                    `);
                    $('#updateTwoFactorAuthenticatorClick').click(function(e) {
                        $('#updateTwoFactorAuthenticatorClick').attr('disabled','disabled');
                        $('#twoFactorAuth').attr('disabled','disabled');
                        let pass = $('#two-factor-password').val();
                        request('/auth/totp', 'DELETE', JSON.stringify({'password': pass})).then(d => {
                            success('Two-factor authentication has been disabled for your account.', () => {
                                window.location.reload();
                            });
                            $('#two-factor-auth-area').empty();
                        })
                        .catch(e => {
                            if (!e.responseJSON.error) {
                                e.responseJSON.error = {};
                            }
                            if (e.responseJSON.error.code === 'InvalidPassword') {
                                return warning('The password you entered does not match your account\'s current password. Please try again.');
                            }
                            warning('There was an error trying to disable 2FA. Please try again. Code: '+e.responseJSON.error.code || 'InternalServerError');
                        })
                        .finally(() => {
                            $('#updateTwoFactorAuthenticatorClick').removeAttr('disabled');
                            $('#twoFactorAuth').removeAttr('disabled');
                        })
                    });
                }else{
                    $('#two-factor-auth-area').empty();
                }
            });
        }
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
                let allStyles = $('link[rel=stylesheet]');
                for (const style of allStyles) {
                    if ($(style).attr('href').slice(0,'/css/dark.css'.length) === '/css/dark.css') {
                        $(style).remove();
                    }
                }
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
        request('/auth/username/change/available?username='+newUsername, "GET")
            .then(function() {
                request('/auth/username/change', 'PATCH', JSON.stringify({'username': newUsername}))
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