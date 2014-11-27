/*
 * ------------------------------------------------------------------------------------------
 * FerretBot v0.1 - Based on CheezeBot by Adam Gray ( https://github.com/akg1852/CheezeBot )
 * ------------------------------------------------------------------------------------------
 * Credits to the following API's:
 * FLOWDOCK.com/api,
 * WUNDERGROUND.com/weather/api,
 * developer.GITHUB.com/v3/,
 * github.com/GIPHY/giphyapi,
 * CATFACTS-api.appspot.com,
 * developers.GOOGLE.com/youtube/v3/,
 * http://products.WOLFRAMALPHA.com/api/
 *
*/

// -- NODE PACKAGES
var request       = require('request'),
    JSONStream    = require('JSONStream'),
    nodemailer    = require('nodemailer'),
    xml2js        = require('xml2js'),
    sqlite3       = require('sqlite3').verbose();

// -- BEGIN CONFIG

// --- botname :: How the bot is summoned.
botName       = "ferretbot"; // (Personally, I wanted monkeybot)

// --- API Credentials:
// ---- Flowdock
var flowdockToken = "",
    flows         = [""],
// ---- Github
    githubToken   = "",
    githubDomain  = null; // Use null for default
// ---- Wunder (Weather Underground)
    wunderToken   = "",
// ---- Youtube
    youtubeToken  = "",
// ---- Wolfram Alpha
    wolframToken  = "";
// ---- Another API?

// -- END CONFIG


// -- FLOWDOCK API HANDLING

// --- Get Flow data.
var flowData = {}; // TODO: Make this a function

for(var i = 0; i < flows.length; i++){
    request(encodeURI("https://" + flowdockToken + ":DUMMY@api.flowdock.com/flows/" + flows[i]),
      function(error, response, body){
        console.log(response.statusCode);
        if(!error && response.statusCode == 200){
          var flow = JSON.parse(body);
          flowData[flow.id] = {
            name: flow.organization.paramterized_name + "/" + flow.parameterized_name,
            token: flow.api_token
          };
          console.log(flowData);
        }else{
          console.error("[ERROR] Error recieving flow data: " + JSON.stringify(error || response) + "\n");
        }
    });
}

// --- Get User info.
//TODO: Have the function return the user info, and return it

var userInfo = {};
function getUserInfo(id, callback){
  if(userInfo[id]){
    callback(userInfo[id]);
  }else{
    request(encodeURI("https://" + flowdockToken + ":DUMMY@api.flowdock.com/users/" + id),
      function(error, response, body){
        if(!error && response.statusCode == 200){
          userInfo[id] = JSON.parse(body);
          callback(userInfo[id]);
        }else{
          console.error("[ERROR] Error fetching user info: " + JSON.stringify(error || response) + "\n");
        }
      });
  }
}

// --- Stream the messages from Flowdock.
var stream = request(encodeURI("https://" + flowdockToken + ":DUMMY@stream.flowdock.com/flows?filter=" + flows.join(",")))
  .pipe(JSONStream.parse());
console.log(stream);
stream.on('data', function(context) {
  if (context.event == "message" && typeof context.content == "string") {
    // Check post to see if message is for Ferret Bot
    var match = context.content.match(new RegExp("^\\s*" + botName + "\\s+([\\s\\S]+)", "i"));
    if (match) {
      console.log("Message Recieved for FerretBot");
      var message = match[1];
      // If so, we should send back the reply
      var reply;
      for (var i = 0; i < commands.length; i++) {
        var command = commands[i];
        var match = message.match(command.pattern);
        if (match) {
          reply = command.reply(match, context);
          break;
        }
      }
      if (reply != null && reply != undefined) post(reply, context);
    }
  }
});
// ---- These next functions handle the closing of connections
// ---- (end of connection, close of connection and error forcing the conncetion to close)
stream.on('end', function() {
  console.error("flowdock stream ended");
  console.log(JSON.stringify(stream));
  // todo: handle stream end more gracefully
});

stream.on('close', function() {
  console.error("flowdock stream closed");
  console.log(JSON.stringify(stream));
  // todo: handle stream close more gracefully
});

stream.on('error', function(error) {
  console.error("Error receiving stream data from flowdock: " + JSON.stringify(error) + "\n");
  console.log(JSON.stringify(stream));
  // todo: handle stream error more gracefully
});

// --- POST a message
module.exports.post = function post(reply, context) {
  var flow = flowData[context.flow];
  var options = {
    url:      encodeURI("https://api.flowdock.com/v1/messages/chat/" + flow.token),
    method:   "POST",
    headers:  { "Content-Type": "application/json" },
    body:     JSON.stringify({ "content": reply.toString(), "external_user_name": "FerretBot" })
  };
  request(options, function(error, response, body) {
    // log
    if (!error && response.statusCode == 200) {
      getUserInfo(context.user, function(user) {
        console.log("---" + flow.name + "--- (" + now() + ")\n" + user.nick + ": " + context.content);
        console.log("FerretBot: " + reply + "\n");
      })
    }
    else console.error("Error posting reply: " + JSON.stringify(error || response) + "\n");
  });
}


// -- COMMANDS -- //
var cmd = require("./commands.js");
var commands = cmd.commands;
console.log("Commands Recieved!: " + commands.length);
// -- -------- -- //

// -- UTILITY FUNCTIONS

// --- Get the current time.
function now() {
  var d = new Date();
  return d.getFullYear() + "-" + (d.getMonth()+1) + "-" + d.getDate() + " " +
  d.getHours() + ":" + d.getMinutes();
}

// --- Padding for strings
function pad(len, str) {
  while (str.length < len) str += " ";
  return str;
}

// --- Send and Email.
function email(email, context) {
  nodemailer.createTransport().sendMail(email, function(error, info) {
    if (!error) {
      var result = (info.rejected.length > 0) ? "Failed to send email" : "Email sent";
      if (context) post(result, context);
      else console.log(result);
    }
    else {
      if (context) post("Unable to send email", context);
      console.error("Error sending email: " + JSON.stringify(error) + "\n");
    }
  });
}

// connect to db
function dbConnect(callback) {
  var db = new sqlite3.Database('cheezebot.db');
  callback(db);
  db.close();
}


console.log(flowData);
