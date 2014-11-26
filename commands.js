// -- Require command files here!
about         = require("./commands/about.command.js"),
catfact       = require("./commands/catfact.command.js"),
email         = require("./commands/email.command.js"),
gif           = require("./commands/gif.command.js"),
help          = require("./commands/help.command.js"),
pullrequests  = require("./commands/pullrequests.command.js");
quote         = require("./commands/quote.command.js"),
roll          = require("./commands/roll.command.js"),
tally         = require("./commands/tally.command.js"),
video         = require("./commands/video.command.js"),
weather       = require("./commands/weather.command.js"),
wolfram       = require("./commands/wolfram.command.js"),
commit        = require("./commands/commit.command.js");

// -- //

var commands = [
  wolfram.command,
  weather.command,
  video.command,
  tally.command,
  roll.command,
  quote.command,
  pullrequests.command,
  help.command,
  gif.command,
  email.command,
  about.command,
  catfact.command,
  commit.command,

];

module.exports.commands = commands;
