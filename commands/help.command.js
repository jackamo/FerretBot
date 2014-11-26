module.exports.command = {
    description: "help:\t\t\t\tdisplay this message",
    pattern: /^help/i,
    reply: function() {
      var help = "FerretBot commands:";
      for (var i = 0; i < commands.length; i++) {
        var command = commands[i];
        help += "\n\t" + command.description;
      }
      return help;
    }
  }
