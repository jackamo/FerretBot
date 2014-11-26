var request = require("request");

var ferretbot = require("../ferretbot.js");

module.exports.command = {
    description: "catfact:\t\t\tthankyou for signing up for cat facts",
    pattern: /^catfact/i,
    reply: function(match, context) {
      request("http://catfacts-api.appspot.com/api/facts?number=1",
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          ferretbot.post(JSON.parse(body).facts[0], context);
        }
        else console.error("Error requesting cat fact: " + JSON.stringify(error || response) + "\n");
      });
    }
  }
