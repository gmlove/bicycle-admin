define('resetpass', ['jquery','utils', 'base', 'k/kendo.web', 'k/kendo.timezones'],
function ($, utils) {

console.log('resetpass js loaded');

var form = $('#resetpassForm');
var submitBtn = form.find('>div>button');
var passInput = $('#password');
var newpassInput = $('#newPassword');
var newpassConfirmInput = $('#newPasswordConfirm');
var validator = form.kendoValidator().data("kendoValidator");
var status = $(".status");

kendo.init(form);
form.kendoValidator({
    rules: {
        passmatch: function(input) {
            if(input.is('#newPasswordConfirm') && input.val() != "") {
                return newpassInput.val() == newpassConfirmInput.val();
            }
            return true;
        }
    }
});

form.submit(function(event){
    submitBtn.attr('disabled', 'disabled');
    var pass = passInput.val();
    var newpass = newpassInput.val();
    $.post('/webapi/login/reset/', {
        password: pass,
        newPassword: newpass,
    }, function(data) {
        window.location.reload();
    });
    return false;
});

});

//@ sourceURL=resetpass.js