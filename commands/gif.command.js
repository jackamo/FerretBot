var request = require("request");
var ferretbot = require("../ferretbot.js");

module.exports.command =   {
    description: "gif {search string}:\t\tshow a gif based on a search string",
    pattern: /^gif\s+(.+)/i,
    reply: function(match, context) {
      request(encodeURI("http://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&limit=1&q=" + match[1]),
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var imageData = JSON.parse(body).data[0];
          if (imageData) ferretbot.post(imageData.images.original.url, context);
          else ferretbot.post("No suitable gif found - try a different search", context);
        }
        else console.error("Error requesting gif: " + JSON.stringify(error || response) + "\n");
      });
    }
  }
