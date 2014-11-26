var ferretbot = require("../ferretbot.js");

module.exports.command = {
    description: "roll {dice}d{sides}:\t\troll dice (eg roll 2d6)",
    pattern: /^roll\s+(\d*)d(\d+)/i,
    reply: function(match) {
      var dice = Number(match[1]) || 1;
      var sides = Number(match[2]);
      var result = "";
      for (var i = 0; i < dice; i++) {
        result += (Math.floor(Math.random() * sides) + 1) + " ";
      }
    }
  }
