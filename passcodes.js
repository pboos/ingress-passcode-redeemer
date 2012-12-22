var http = require('http');
var xml2js = require('xml2js');
var exec = require('child_process').exec;
var charm = require('charm')();
charm.pipe(process.stdout);
charm.reset();

var lastRunHadNewPasscode = false;
var handledPasscodes = [];
function hasBeenHandled(passcode) {
  return ~handledPasscodes.indexOf(passcode);
}

var options = {
  host: 'decodeingress.me',
  port: '80',
  path: '/category/code/feed/',
  method: 'GET'
};

function fetchPasscodes(ignore) {
  if (!lastRunHadNewPasscode) {
    charm.up(1);
    charm.erase('end');
  }
  lastRunHadNewPasscode = false;
  charm.foreground('white');
  charm.write(new Date().toString() + '\n');

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
        var pattern0 = /[0-9][a-z]{2}[0-9][a-z]*([0-9][a-z]){2}/g;
        var pattern1 = /([0-9a-zA-z]{5,})\s+Gained:\s+/i;
        var pattern2 = /Passcode:?\s+([0-9a-zA-z]{5,})+/i;
        var pattern3 = /([0-9]{10,})\s+/g;

        function handleFoundPasscode(passcode) {
          if (!hasBeenHandled(passcode)) {
            lastRunHadNewPasscode = true;
            if (!ignore) {
              var email = process.argv[2];
              var password = process.argv[3];
              exec('casperjs redeem.js ' + passcode +' '+ email +' '+ password, function(error, stdout, stderr) {
                charm.foreground('green');
                charm.write(stdout + stderr + '\n');
              });
            } else {
              charm.foreground('blue');
              charm.write('ignored: ' + passcode + '\n');
            }
            handledPasscodes.push(passcode);
          }
        }

        function findWithPattern(pattern) {
          var match;
          while(match = pattern.exec(content)) {
            handleFoundPasscode(match[0]);
          }
        }
        function findWithPattern2(pattern) {
          var match = desc.match(pattern);
          if (match) {
            handleFoundPasscode(match[1]);
          }
        }
        findWithPattern(pattern0);
        findWithPattern(pattern3);
        findWithPattern2(pattern1);
        findWithPattern2(pattern2);
      }
    });
  }
  fetchRss();
}
fetchPasscodes(true);
setInterval(fetchPasscodes, 60 * 1000);
