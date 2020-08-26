"use strict";// Username Change
request("/settings","GET").then(function(a){a.blurb||(a.blurb=""),a.forumSignature||(a.forumSignature=""),a.email&&($("#newEmailValue").val(a.email.email),0===a.email.status?null===a.email.email?$("#email-status").html("( No Email Added )"):($("#newEmailValue").attr("disabled","disabled"),$("#email-status").html("( Unverified; Check your inbox! Or, <a href=\"#\" id=\"send-verification-email\">Click Me</a> to resend a verification email. )")):1===a.email.status&&($("#newEmailValue").attr("disabled","disabled"),$("#email-status").html("( Verified )"))),$("#newBlurbValue").html(a.blurb.escape()),$("#newForumSignatureValue").html(a.forumSignature.escape()),$("#selectTradingOption").find("[value=\""+a.tradingEnabled+"\"]").attr("selected","selected"),$("#selectThemeOption").find("[value=\""+a.theme+"\"]").attr("selected","selected"),$("#birthDateValue").attr("data-birthdate",xss(moment(a.birthDate).format("MMMM DD[,] YYYY"))),0===a["2faEnabled"]?($("#twoFactorAuth").find("[value=0]").attr("selected","selected"),$("#twoFactorAuth").change(function(){$("#updateTwoFactorAuthenticatorClick").off("click"),console.log("changed");var a=parseInt($("#twoFactorAuth").find(":selected").attr("value"));1===a?($("#twoFactorAuth").attr("disabled","disabled"),$("#updateTwoFactorAuthenticatorClick").attr("disabled","disabled"),$("#two-factor-auth-area").empty().append("\n                    <div class=\"row\" style=\"margin-top:1rem;\">\n                        <div class=\"col-12\">\n                            <div class=\"spinner-border\" role=\"status\" style=\"display:block;margin:0 auto;\">\n                                <span class=\"sr-only\">Loading...</span>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    "),request("/auth/generate-totp-secret","POST",{}).then(function(a){var b=a.qrCodeUrl,c=a.secret.base32;$("#two-factor-auth-area").empty().append("\n                        \n                        <div class=\"row\" style=\"margin-top:1rem;\">\n                            <div class=\"col-12\">\n                                <img src=\"".concat(b,"\" style=\"display:block;margin:0 auto;\" />\n                            </div>\n                            <div class=\"col-8 offset-2\" style=\"margin-top:1rem;\">\n                                <h2 style=\"font-size:1.5rem;\">Step One</h2>\n                                <p>Scan the above QR Code with a 2-Factor authentication app, such as the Google Authenticator App for <a href=\"https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2\" target=\"_blank\">Android</a> & <a href=\"https://apps.apple.com/ca/app/google-authenticator/id388497605\" target=\"_blank\">iOS</a>. Or, you can enter the Base32 secret below into your application of choice:<br><code style=\"font-size:1.25rem;width:100%;display:block;text-align:center;\">").concat(c,"</code></p>\n\n                                <h2 style=\"font-size:1.5rem;margin-top:1rem;\">Step Two</h2>\n                                <p>Enter your account's password.</p>\n                                <input type=\"password\" class=\"form-control\" id=\"two-factor-password\" value=\"\" placeholder=\"Account Password\" style=\"margin-top:1rem;\" autocomplete=\"password\">\n\n                                <h2 style=\"font-size:1.5rem;margin-top:1rem;\">Step Three</h2>\n                                <p>Next, enter the 2FA code provided for your application (such as \"123 456\"), and press \"Update\" above to enable 2FA.</p>\n                                <input type=\"text\" class=\"form-control\" id=\"two-factor-token\" value=\"\" placeholder=\"2FA Token\" style=\"margin-top:1rem;\" maxlength=\"7\" minlength=\"6\">\n                            </div>\n                        </div>\n                        \n                        \n                        ")),$("#updateTwoFactorAuthenticatorClick").click(function(){var a=$("#two-factor-token").val().replace(/\s/g,"").replace(/,/g,"").replace(/\./g,"").trim();return 6===a.length?void(// disable all inputs
// grab vars to send
// Secret is defined as secret
$("#twoFactorAuth").attr("disabled","disabled"),$("#two-factor-token").attr("disabled","disabled"),$("#updateTwoFactorAuthenticatorClick").attr("disabled","disabled"),$("#two-factor-password").attr("disabled","disabled"),console.log(a),request("/auth/totp","PATCH",JSON.stringify({secret:c,token:a,password:$("#two-factor-password").val()})).then(function(){$("#two-factor-auth-area").empty(),success("Two-Factor authentication has been enabled for your account. You will be required to enter a code the next time you login.",function(){window.location.reload()}),$("#updateTwoFactorAuthenticatorClick").off("click")})["catch"](function(a){return $("#twoFactorAuth").removeAttr("disabled"),$("#two-factor-token").removeAttr("disabled"),$("#updateTwoFactorAuthenticatorClick").removeAttr("disabled"),$("#two-factor-password").removeAttr("disabled"),a.responseJSON.error&&"InvalidTokenOrSecret"===a.responseJSON.error.code?warning("It seems the token you entered is invalid. Please try again."):a.responseJSON.error&&"InvalidPassword"===a.responseJSON.error.code?warning("The password you entered does not match your account's current password. Please try again."):warning("Sorry, an unknown error has ocurred. Please try again.")})):warning("It seems the token you entered is invalid. Please try again.")}),setTimeout(function(){$("#twoFactorAuth").removeAttr("disabled"),$("#updateTwoFactorAuthenticatorClick").removeAttr("disabled")},500)})["catch"](function(){warning("It looks like you can't enable 2FA right now. Please try again later."),$("#twoFactorAuth").removeAttr("disabled"),$("#updateTwoFactorAuthenticatorClick").removeAttr("disabled")})):0===a&&$("#two-factor-auth-area").empty()})):($("#twoFactorAuth").find("[value=1]").attr("selected","selected"),$("#twoFactorAuth").change(function(){$("#updateTwoFactorAuthenticatorClick").off("click"),console.log("changed");var a=parseInt($("#twoFactorAuth").find(":selected").attr("value"));0===a?($("#two-factor-auth-area").append("\n                    \n                    <div class=\"row\" style=\"margin-top:1rem;\">\n                            <div class=\"col-8 offset-2\" style=\"margin-top:1rem;\">\n\n                                <h2 style=\"font-size:1.5rem;margin-top:1rem;\">Enter Password</h2>\n                                <p>For security reasons, to disable 2FA, enter your account's password.</p>\n                                <input type=\"password\" class=\"form-control\" id=\"two-factor-password\" value=\"\" placeholder=\"Account Password\" style=\"margin-top:1rem;\" autocomplete=\"password\">\n\n                            </div>\n                        </div>\n                    \n                    "),$("#updateTwoFactorAuthenticatorClick").click(function(){$("#updateTwoFactorAuthenticatorClick").attr("disabled","disabled"),$("#twoFactorAuth").attr("disabled","disabled");var a=$("#two-factor-password").val();request("/auth/totp","DELETE",JSON.stringify({password:a})).then(function(){success("Two-factor authentication has been disabled for your account.",function(){window.location.reload()}),$("#two-factor-auth-area").empty()})["catch"](function(a){return a.responseJSON.error||(a.responseJSON.error={}),"InvalidPassword"===a.responseJSON.error.code?warning("The password you entered does not match your account's current password. Please try again."):void warning("There was an error trying to disable 2FA. Please try again. Code: "+a.responseJSON.error.code||"InternalServerError")})["finally"](function(){$("#updateTwoFactorAuthenticatorClick").removeAttr("disabled"),$("#twoFactorAuth").removeAttr("disabled")})})):$("#two-factor-auth-area").empty()}))})["catch"](function(){// hmm
}),$(document).on("keypress","#newEmailValue",function(){$("#updateEmailClick").removeAttr("disabled")}),$(document).on("click","#updateEmailClick",function(){if(loading(),"disabled"===$("#newEmailValue").attr("disabled"))question("Please enter your new email address.",function(a){request("/settings/email","PATCH",JSON.stringify({email:a})).then(function(){success("Your email has been updated! Please verify it with the link sent to your email.",function(){}),$("#newEmailValue").val(a.slice(0,1)+"*".repeat(a.indexOf("@")-1)+a.slice(a.indexOf("@")))})["catch"](function(a){warning(a.responseJSON.message)})});else{var a=$("#newEmailValue").val();request("/settings/email","PATCH",JSON.stringify({email:a})).then(function(){success("Your email has been set! Please verify it with the link sent to your email.",function(){});var b=a;$("#newEmailValue").attr("disabled","disabled").val(b.slice(0,1)+"*".repeat(b.indexOf("@")-1)+b.slice(b.indexOf("@")))})["catch"](function(a){warning(a.responseJSON.message)})}}),$(document).on("keydown","#newForumSignatureValue",function(){$("#updateForumSignatureClick").removeAttr("disabled")}),$(document).on("click","#updateForumSignatureClick",function(){var a=$("#newForumSignatureValue").val();request("/settings/forum/signature","PATCH",JSON.stringify({signature:a})).then(function(){success("Your forum signature has been updated.",function(){})})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("keypress","#selectThemeOption",function(){$("#updateThemeClick").removeAttr("disabled")}),$(document).on("click","#updateThemeClick",function(){var a=parseInt($("#selectThemeOption").find(":selected").attr("value"));request("/settings/theme","PATCH",JSON.stringify({theme:a})).then(function(){if(1===a)$("head").append("<link href=\"/css/dark.css\" rel=\"stylesheet\">");else{var b=$("link[rel=stylesheet]"),c=!0,d=!1,e=void 0;try{for(var f,g,h=b[Symbol.iterator]();!(c=(f=h.next()).done);c=!0)g=f.value,"/css/dark.css"===$(g).attr("href").slice(0,13)&&$(g).remove()}catch(a){d=!0,e=a}finally{try{c||null==h["return"]||h["return"]()}finally{if(d)throw e}}}setTimeout(function(){success("Your theme has been updated!",function(){})},100)})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("keypress","#selectTradingOption",function(){$("#updateTradingClick").removeAttr("disabled")}),$(document).on("click","#updateTradingClick",function(){var a=parseInt($("#selectTradingOption").find(":selected").attr("value"));request("/settings/trade","PATCH",JSON.stringify({enabled:a})).then(function(){success("Your trade settings have been updated!",function(){})})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("keypress","#newBlurbValue",function(){$("#updateBlurbClick").removeAttr("disabled")}),$(document).on("click","#updateBlurbClick",function(){var a=$("#newBlurbValue").val();request("/settings/blurb","PATCH",JSON.stringify({blurb:a})).then(function(){success("Your blurb has been updated!",function(){})})["catch"](function(a){warning(a.responseJSON.message)})}),$(document).on("keypress","#newPasswordValue",function(){$("#updatePasswordClick").removeAttr("disabled")}),$(document).on("click","#updatePasswordClick",function(){var a=grecaptcha.getResponse(),b=$("#newPasswordValue").val();5<=b.length?question("Please enter your current password.",function(c){request("/settings/password","PATCH",JSON.stringify({oldPassword:c,newPassword:b,captcha:a})).then(function(){success("Your password has been updated!",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message)})},"password"):warning("Please enter a password longer than 5 characters.")}),$(document).on("keypress","#newUsernameValue",function(){$("#updateUsernameClick").removeAttr("disabled")}),$(document).on("click","#updateUsernameClick",function(){var a=$("#newUsernameValue").val();return a===$("#userdata").attr("data-username")?warning("Your new username cannot be the same as your current username."):void questionYesNoHtml("Changing your username costs <span style=\"color:#28a745;\"><img alt=\"$\" style=\"height: 1rem;\" src=\"https://cdn.blockshub.net/static/money-green-2.svg\"/></span> 1,000. Are you sure you'd like to continue?",function(){request("/auth/username/change/available?username="+a,"GET").then(function(){request("/auth/username/change","PATCH",JSON.stringify({username:a})).then(function(){success("Your username has been changed.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message)})})["catch"](function(a){warning(a.responseJSON.message)})})}),$(document).on("click","#birthDateValue",function(){console.log("brithDateValueClick"),"true"===$(this).attr("data-visible")?($(this).attr("data-visible","false"),$(this).html("Click to view")):($(this).attr("data-visible","true"),$(this).html($(this).attr("data-birthdate")+" (click to hide)"))}),$(document).on("click","#send-verification-email",function(a){a.preventDefault(),loading(),request("/settings/email/verification/resend","POST",{}).then(function(){success("A new verification email has been sent to you. Please check your mailbox spam folder if you can't find it.",function(){window.location.reload()})})["catch"](function(a){warning(a.responseJSON.message)})});










