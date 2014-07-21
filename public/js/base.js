define('base', ['jquery'],
function ($) {

var signout = $('#signout-link');
signout.click(function(){
    $.post('/webapi/login/logout/', function(){
        window.location.href = '/public/pages/login.html';
    });
});


});