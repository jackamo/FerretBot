var request = require('request'),
	fs = require('fs'),
	JSONStream = require('JSONStream'),
	nodemailer = require('nodemailer');

// credentials
	// flowdock
var apiToken = "",
	flows = [],
	// github
	githubToken = "",
	githubDomain = null, // null for default
	// weather underground
	wunderToken = "",
	// youtube
	youtubeToken = "",
	// wolfram alpha
	wolframToken = "";
	
// get flow data
var flowData = {};
for (var i = 0; i < flows.length; i++) {
	request(encodeURI("https://" + apiToken + ":DUMMY@api.flowdock.com/flows/" + flows[i]), function(error, response, body) {
		if (!error && response.statusCode == 200) {
			var flow = JSON.parse(body);
			flowData[flow.id] = { name: flow.organization.parameterized_name + "/" + flow.parameterized_name, token: flow.api_token };
		}
		else console.error("Error getting flow data: " + JSON.stringify(error || response) + "\n");
	});
}

// get user info
var userInfo = {};
function getUserInfo(id, callback) {
	if (userInfo[id]) callback(userInfo[id]);
		
	else request(encodeURI("https://" + apiToken + ":DUMMY@api.flowdock.com/users/" + id),
		function(error, response, body) {
			if (!error && response.statusCode == 200) {
				userInfo[id] = JSON.parse(body);
				callback(userInfo[id]);
			}
			else console.error("Error requesting user info: " + JSON.stringify(error || response) + "\n");
		});
}

// stream messages
var stream = request(encodeURI("https://" + apiToken + ":DUMMY@stream.flowdock.com/flows?filter=" + flows.join(",")))
	.pipe(JSONStream.parse());
stream.on('data', function(data) {
	if (data.event == "message" && typeof data.content == "string") {
		
		// check if message is for CheezeBot
		var match = data.content.match(/^chee(?:s|z)ebot2 ([\s\S]+)/i);
		if (match) {
			var message = match[1];
			
			// post reply
			var reply;
			for (var i = 0; i < commands.length; i++) {
				var command = commands[i];
				var match = message.match(command.pattern);
				if (match) {
					reply = command.reply(match, data);
					break;
				}
			}
			if (reply != null && reply != undefined) post(reply, data);
		}
	}
});
stream.on('end', function() {
	console.error("flowdock stream ended");
	// todo: handle stream end more gracefully
});
stream.on('close', function() {
	console.error("flowdock stream closed");
	// todo: handle stream close more gracefully
});
stream.on('error', function(error) {
	console.error("Error receiving stream data from flowdock: " + JSON.stringify(error) + "\n");
	// todo: handle stream error more gracefully
});

// post a message
function post(reply, data) {
	var flow = flowData[data.flow];
	var options = {
		url: encodeURI("https://api.flowdock.com/v1/messages/chat/" + flow.token),
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ "content": reply.toString(), "external_user_name": "CheezeBot" })
	};
	request(options, function(error, response, body) {
		// log
		if (!error && response.statusCode == 200) {
			if (data) {
				getUserInfo(data.user, function(user) {
					console.log("---" + flow.name + "---\n" + user.nick + ": " + data.content);
					console.log("CheezeBot: " + reply + "\n");
				})
			}
			else console.log("CheezeBot: " + reply + "\n");
		}
		else console.error("Error posting reply: " + JSON.stringify(error || response) + "\n");
	});
}

// send an email
function email(email, data) {
	nodemailer.createTransport().sendMail(email, function(error, info) {
		if (!error) {
			var result = (info.rejected.length > 0) ? "Failed to send email" : "Email sent";
			if (data) post(result, data);
			else console.log(result);
		}
		else {
			if (data) post("Unable to send email", data);
			console.error("Error sending email: " + JSON.stringify(error) + "\n");
		}
	});
}


/* commands:
each command requires:
	* a 'description' for the help listing
	* a regex 'pattern' to trigger the command
	* a 'reply' method which takes parameters:
		* the regex 'match' array
		* the flowdock stream 'data' object
	  the 'reply' method returns CheezeBot's reply (or null for no reply)
	  (alternatively, 'reply' can call the 'post' method directly, which is useful inside a callback)
*/
var commands = [
	{
		description: "help:\t\t\t\tdisplay this message",
		pattern: /^help/,
		reply: function() {
			var help = "CheezeBot commands:";
			for (var i = 0; i < commands.length; i++) {
				var command = commands[i];
				help += "\n\t" + command.description;
			}
			return help;
		}
	},
	{
		description: "gif {search string}:\t\tshow a gif based on a search string",
		pattern: /^gif (.+)/,
		reply: function(match, data) {
			request(encodeURI("http://api.giphy.com/v1/gifs/search?api_key=dc6zaTOxFJmzC&limit=1&q=" + match[1]),
				function(error, response, body) {
					if (!error && response.statusCode == 200) {
						var imageData = JSON.parse(body).data[0];
						if (imageData) post(imageData.images.original.url, data);
						else post("No suitable gif found - try a different search", data);
					}
					else console.error("Error requesting gif: " + JSON.stringify(error || response) + "\n");
				});
		}
	},
	{
		description: "video {search string}:\t\tshow a video based on a search string",
		pattern: /^(?:video|youtube) (.+)/,
		reply: function(match, data) {
			request(encodeURI("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&key=" + youtubeToken + "&q=" + match[1]),
				function(error, response, body) {
					if (!error && response.statusCode == 200) {
						var videoData = JSON.parse(body).items[0];
						if (videoData) post("http://www.youtube.com/watch?v=" + videoData.id.videoId, data);
						else post("No suitable video found - try a different search", data);
					}
					else console.error("Error requesting video: " + JSON.stringify(error || response) + "\n");
				});
		}
	},
	{
		description: "pullrequests {user}/{repo}:\tlist open pull requests",
		pattern: /^pullrequests (.+\/.+)/,
		reply: function(match, data) {
			var repo = match[1].trim();
			var domain = githubDomain ? githubDomain + "/api/v3" : "https://api.github.com";
			var options = {
				url: encodeURI(domain + "/repos/" + repo + "/pulls?access_token=" + githubToken),
				method: "GET",
				rejectUnauthorized: false,
				headers: { "User-Agent": "CheezeBot" }
			};
			request(options, function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var prs = JSON.parse(body);
					if (prs.length) {
						var result = "Pull requests for " + repo + ":";
						for (var i = 0; i < prs.length; i++) {
							var pr = prs[i];
							result += "\n\t*  " + pr.title + ": " + pr.html_url;
						}
						post(result, data);
					}
					else post("no open pull requests for " + repo, data);
				}
				else console.error("Error requesting github data: " + JSON.stringify(error || response) + "\n");
			});
		}
	},
	{
		description: "quote [\"{quote}\" - {quotee}]:\tquote store",
		pattern: /^quote(?: (.+))?/,
		reply: function(match, data) {
			if (typeof match[1] == "string") {
				var quote = match[1].trim();
				if (quote.match(/["“].+["”] - .+/)) {
					fs.appendFile("quotes.txt", quote + "\n", function(error) {
						if (!error) post("Thanks for the new quote!", data);
						else console.error("Error writing quote: " + JSON.stringify(error));
					});
				}
				else post("No! Badly formatted quote!", data);
			}
			else {
				fs.readFile("quotes.txt", {encoding: "utf8"}, function(error, quoteFile) {
					if (!error) {
						var quotes = quoteFile.split("\n").filter(function(x) { return !!x; });
						post(quotes[Math.floor(Math.random() * quotes.length)], data);
					}
					else console.error("Error reading quote: " + JSON.stringify(error));
				});
			}
		}
	},
	{
		description: "weather {city}:\t\t\tweather forecast information",
		pattern: /^weather (.+)/,
		reply: function(match, data) {
			request(encodeURI("http://autocomplete.wunderground.com/aq?query=" + match[1]), function(error, response, body) {
				if (!error && response.statusCode == 200) {
					var cities = JSON.parse(body).RESULTS;
					if (cities.length)  {
						request(encodeURI("http://api.wunderground.com/api/" + wunderToken + "/forecast10day" + cities[0].l + ".json"),
							function(error, response, body) {
								if (!error && response.statusCode == 200) {
									var forecast = JSON.parse(body).forecast;
									if (forecast) {
										var forecastDays = forecast.simpleforecast.forecastday;
										var result = "Weather forecast for " + cities[0].name + ":";
										for (var i = 0; i < 7; i++) {
											var day = forecastDays[i];
											result += "\n\t*  " + day.date.weekday + ":\t" + pad(20, day.conditions).substr(0, 20) + "| " +
													  day.high.celsius + "/" + day.low.celsius + "°C\t| " +
													  day.avewind.kph + "kph " + day.avewind.dir;
										}
										post(result, data);
									}
									else post("No weather information found", data);
								}
								else console.error("Error requesting weather information: " + JSON.stringify(error || response) + "\n");
							});
					}
					else post("No city found matching search", data);
				}
				else console.error("Error requesting weather information: " + JSON.stringify(error || response) + "\n");
			});
		}
	},
	{
		description: "email {address} {subject} \\n {message}:\t\tsend email",
		pattern: /^email (\S+@\S+)\s+([^\n\r]+)\s+([\s\S]+)/,
		reply: function(match, data) {
			getUserInfo(data.user, function(user) {
				email({
					from: user.name + " <" + user.email + ">",
					to: match[1],
					subject: match[2],
					text: match[3]
				}, data);
			});
		}
	},
	{
		description: "timer [start|stop]:\t\tstart/stop a timer",
		pattern: /^timer(?: (start|stop))?/,
		reply: function(match, data) {
			var command = match[1];
			var time = 0;
			if (command == "start") this.timers[data.user] = new Date().getTime();
			else {
				time = (new Date().getTime() - this.timers[data.user]) / 1000;
				if (command == "stop") this.timers[data.user] = undefined;
			}
			return "timer: " + time + " s";
		},
		timers: {}
	},
	{
		description: "roll {dice}d{sides}:\t\troll dice (eg roll 2d6)",
		pattern: /^roll (\d*)d(\d+)/,
		reply: function(match) {
			var dice = Number(match[1]) || 1;
			var sides = Number(match[2]);
			var result = "";
			for (var i = 0; i < dice; i++) {
				result += (Math.floor(Math.random() * sides) + 1) + " ";
			}
			return result;
		}
	},
	{
		description: "math {func} [{params...}]:\tmath functions (eg cos, floor, pow)",
		pattern: /^math( [^ ]+)+/,
		reply: function(match) {
			var args = match[0].split(" ");
			var func = Math[args[1]];
			if (typeof func == "function") {
				args = args.slice(2).map(function(x) { return Number(x); });
				return func.apply(this, args);
			}
			else if (func != undefined) {
				return func;
			}
			return "math function unknown: " + args[1];
		}
	},
	{
		description: "catfact:\t\t\tthankyou for signing up for cat facts",
		pattern: /^catfact/,
		reply: function(match, data) {
			request("http://catfacts-api.appspot.com/api/facts?number=1",
				function(error, response, body) {
					if (!error && response.statusCode == 200) {
						post(JSON.parse(body).facts[0], data);
					}
					else console.error("Error requesting cat fact: " + JSON.stringify(error || response) + "\n");
				});
		}
	},
	{
		description: "about:\t\t\t\tdeveloper and source info",
		pattern: /^about/,
		reply: function() {
			return ["CheezeBot by Adam-G", "Source: git.io/1roJvQ", "Suggestions or contributions welcome.",,
			"API Credits:", "FLOWDOCK.com/api", "WUNDERGROUND.com/weather/api", "developer.GITHUB.com/v3/",
			"github.com/GIPHY/giphyapi", "CATFACTS-api.appspot.com", "developers.GOOGLE.com/youtube/v3/"].join("\n");
		}
	},
];

// utility functions
function pad(len, str) {
	while (str.length < len) str += " ";
	return str;
}
