var request = require("request");
var ferretbot = require("../ferretbot.js");

module.exports.command = {
  description: "commit inspo: FerretBot will give you a handy commit message!",
  pattern: /^commit\sinspo/i,
  reply: function(match, context){
    request(encodeURI("http://whatthecommit.com/index.txt"),
      function(error, response, body){
        if(!error && response.statusCode == 200){
          ferretbot.post("Try using this one: " + body, context);
        }
      });
  }
}
