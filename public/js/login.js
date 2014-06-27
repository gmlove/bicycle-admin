define('login', ['jquery','utils'],
function ($, utils) {

$('html').css('bg-black');
$('body').addClass('bg-black');

var useridInput = $('input[name=userid]'),
    passwordInput = $('input[name=password]'),
    form = $('form'),
    rememberCheckbox = $('input[name=remember_me]'),
    submitBtn = $('button[type=submit]');


if(window.localStorage) {
    var userid = window.localStorage['userid'];
    var remember = window.localStorage['remember'];
    if(remember) {
        rememberCheckbox.attr('checked', true);
        useridInput.val(userid);
    }
}

form.submit(function(){
    if(window.localStorage) {
        if(rememberCheckbox.attr('checked')) {
            window.localStorage['userid'] = useridInput.val();
            window.localStorage['remember'] = true;
        } else {
            window.localStorage['userid'] = null;
            window.localStorage['remember'] = false;
        }
    }
    submitBtn.addClass('disabled');
    $.post('/webapi/login/login/', {
        username: useridInput.val(),
        password: passwordInput.val(),
    }, function(result) {
        if(result.success) {
            var newLocation = window.location.origin + window.location.pathname.replace(/^(.*\/)([^]*)$/, '$1index.html');
            window.location.href = newLocation;
        } else {
            console.log(result);
            submitBtn.removeClass('disabled');
            $('.error-message').show();
        }
    });
    return false;
});

});
//@ sourceURL=login.js