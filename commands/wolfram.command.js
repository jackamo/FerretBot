var ferretbot = require("../ferretbot.js");

var request = require("request");
var xml2js = require("xml2js");


module.exports.command = {
    description: "wolfram {search string}:\tsearch wolfram alpha",
    pattern: /^wolfram\s+(.+)/i,
    reply: function(match, context) {
      request(encodeURI("http://api.wolframalpha.com/v2/query?appid=" + wolframToken + "&input=" + match[1]),
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          xml2js.parseString(body, function (error, result) {
            if (result.queryresult.$.success == "true" && result.queryresult.pod) {
              ferretbot.post([].concat.apply([], result.queryresult.pod.map(function(p) {
                var podText = [].concat.apply([], p.subpod.map(function(sp) {
                  return sp.plaintext[0].split("\n").map(function(t) {
                    return t ? "    " + t : null;
                  });
                })).filter(function(t) { return t != null; }).join("\n");
                return podText ? p.$.title + ": \n" + podText : null;
              })).filter(function(t) { return t != null; }).join("\n"), context);
            }
            else ferretbot.post("No wolfram results found", context);
          });
        }
        else console.error("Error requesting wolfram alpha information: " + JSON.stringify(error || response) + "\n");
      });
    }
  }
