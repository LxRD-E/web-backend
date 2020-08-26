"use strict";var twoFactorJwt="";$(document).on("click","#signInButton",function(){console.log("Sign In");var a=$("#username").val(),b=$("#password").val();""!==a&&""!==b&&null!==a&&null!==b?($("#signInButton").attr("disabled","disabled"),request("/auth/login","POST",JSON.stringify({username:a,password:b})).then(function(a){a.isTwoFactorRequired?(twoFactorJwt=a.twoFactor,$("#login-row").empty().append("\n                    <div class=\"col-12\">\n                        <p>Please enter your two-factor authentication token to login.</p>\n                    </div>\n                    <div class=\"col-12\">\n                        <input type=\"text\" class=\"form-control\" id=\"two-factor-token\" value=\"\" maxlength=\"7\" placeholder=\"Two-Factor Token\">\n                    </div>\n                    <div class=\"col-12\">\n                        <button type=\"button\" class=\"btn btn-small btn-success\" id=\"twoFactorLogin\" style=\"margin:0 auto;display: block;\">Continue</button>\n                    </div>\n                ")):($("#signInButton").removeAttr("disabled"),window.location.reload())})["catch"](function(a){// grecaptcha.reset();
$("#signInButton").removeAttr("disabled"),console.log(a),warning(a.responseJSON.message)})):warning("Please enter a valid username and password.")}),$(document).on("click","#twoFactorLogin",function(){var a=$("#two-factor-token").val().replace(/\s/g,"").replace(/,/g,"").replace(/\./g,"");request("/auth/login/two-factor","POST",JSON.stringify({code:twoFactorJwt,token:a})).then(function(){window.location.reload()})["catch"](function(a){a.responseJSON&&a.responseJSON.error&&"InvalidTwoFactorCode"===a.responseJSON.error.code?warning("It seems your 2FA code is invalid. Please try again"):warning(a.responseJSON.message),console.log(a)})});










