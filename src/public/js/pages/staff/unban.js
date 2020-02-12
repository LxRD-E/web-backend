$(document).on('click', '#unBanUser', function() {
    var userid = $('#userId').val();
    request("/staff/user/"+userid+"/unban", "POST",)
        .then(function() {
            success("This user has been unbanned.", function() {
                window.location.href = "/staff";
            })
        })
        .catch(function(e) {
            warning(e.responseJSON.message);
        });
});