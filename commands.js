// -- Require command files here!
about         = require("./commands/about_command.js"),
catfact       = require("./commands/catfact_command.js"),
email         = require("./commands/email_command.js"),
gif           = require("./commands/gif_command.js"),
help          = require("./commands/help_command.js"),
pullrequests  = require("./commands/pullrequests_command.js");
quote         = require("./commands/quote_command.js"),
roll          = require("./commands/roll_command.js"),
tally         = require("./commands/tally_command.js"),
video         = require("./commands/video_command.js"),
weather       = require("./commands/weather_command.js"),
wolfram       = require("./commands/wolfram_command.js");
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
];

module.exports.commands = commands;
