var casper = require('casper').create();
var result;
casper.once("page.error", function onError(msg, trace) {
  console.log("Error: " + msg);
});
casper.start('http://www.ingress.com/intel', function() {
    this.echo('Clicking on Login');
    this.click('a');
});

casper.then(function() {
    var email = casper.cli.args[1];
    var password = casper.cli.args[2];
    this.echo('Logging in...');
    this.fill('form#gaia_loginform', { 'Email': email, 'Passwd': password }, true);
});

casper.then(function() {
    var passcode = casper.cli.args[0];
    this.echo('Redeeming passcode: ' + passcode);
    this.evaluate(function(passcode) {
        document.querySelector('.form_input#passcode').value = passcode;
        redeem();
    }, {passcode: passcode});
    this.wait(10 * 1000, function() {
        result = this.evaluate(function() {
            var reward = document.querySelector('#redeemed_rewards');
            var error = document.querySelector('#redeem_error');
            if (reward && reward.innerText && reward.innerText !== '') {
                 return reward.innerText;
            } else if (error && error.innerText && error.innerText !== '') {
                return error.innerText;
            }
            return 'No value found...';
        });
    });
});

casper.run(function() {
    this.echo('Result: ' + result).exit();
});
