$(document).on('click', '.staff-sidebar-button', function() {
    if ($('.staff-sidebar').first().css('display') === 'block') {
        /// open, so close it
        console.log('close');
        $('.staff-sidebar').first().css('display', 'none');
        $('.staff-sidebar').first().css('margin-top', '-'+214+'px');
    }else{
        // closed, so open it
        console.log('open');
        $('.staff-sidebar').first().css('display', 'block');
        $('.staff-sidebar').first().css('margin-top', '-'+170+'px');
    }
});