var http = require('http');
var xml2js = require('xml2js');
var exec = require('child_process').exec;

var handledPasscodes = [];
function hasBeenHandled(passcode) {
  return ~handledPasscodes.indexOf(passcode);
}

var options = {
  host: 'decodeingress.wordpress.com',
  port: '80',
  path: '/category/code/feed/',
  method: 'GET'
};

function fetchPasscodes(ignore) {
  function fetchRss() {
    var request = http.request(options, function(res) {
      res.setEncoding('utf8');
      var content = '';
      res.on('data', function(chunk) {
          content += chunk;
      });
      res.on('end', function() {
        parsePasscodes(content);
      });
    });
    request.end();
  }
  function parsePasscodes(rss) {
    var parser = new xml2js.Parser();
    parser.parseString(rss, function (err, result) {
      for (var i=0; i < result.rss.channel[0].item.length; i++) {
        var item = result.rss.channel[0].item[i];
        var desc = item.description[0];
        var content = item['content:encoded'][0];
        var pattern = /[0-9][a-z]{2}[0-9][a-z]*([0-9][a-z]){2}/g;
        var pattern1 = /([0-9a-zA-z]{5,})\s+Gained:\s+/i;
        var pattern2 = /passcode:?\s([0-9a-zA-z]{5,})+/i;

        var match;
        while(match = pattern.exec(content)) {
          var passcode = match[0];
          if (!hasBeenHandled(passcode)) {
            if (!ignore) {
              console.log('handling: ' + passcode);
              var email = process.argv[2];
              var password = process.argv[3];
              exec('casperjs redeem.js ' + passcode +' '+ email +' '+ password, function(error, stdout) {
                console.log(stdout);
              });
            } else {
              console.log('ignored: ' + passcode);
            }
            handledPasscodes.push(passcode);
          }
        }
      }
    });
  }
  fetchRss();
}
fetchPasscodes(true);
setInterval(fetchPasscodes, 30 * 1000);
