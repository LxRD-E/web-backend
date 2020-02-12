$(document).on('click', '#signInButton', function() {
    console.log("Sign In");
    var username = $('#username').val();
    var password = $('#password').val();
    // var response = grecaptcha.getResponse();
    //if (response.length == 0) {
        //warning("Please fill out the captcha.");
        //return;
    //}
    if (username !== "" && password !== "" && username !== null && password !== null) {
        $('#signInButton').attr("disabled","disabled");
        request("/auth/login", "POST", JSON.stringify({username:username,password:password}))
            .then(function() {
                $('#signInButton').removeAttr("disabled");
                /*
                if (typeof $.urlParam('return') !== "undefined" && $.urlParam('return') !== false) {
                    window.location.href = $.urlParam('return')
                }else{
                    window.location.reload();
                }
                */
               window.location.reload();
            })
            .catch(function(e) {
                // grecaptcha.reset();
                $('#signInButton').removeAttr("disabled");
                console.log(e);
                warning(e.responseJSON.message);
            })
    }else{
        warning("Please enter a valid username and password.");
    }
    // Get Friends
    // request("/user/"+userId+"/friends", "POST", )
});