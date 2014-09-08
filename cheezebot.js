var request = require('request'),
    JSONStream = require('JSONStream');

// credentials
    // flowdock
var apiToken = "",
    flows = [],
    // github
    githubToken = "",
    githubDomain = null, // null for default
    // weather underground
    wunderToken = "";
    
// get flow data
var flowData = {};
for (var i = 0; i < flows.length; i++) {
    request(encodeURI("https://" + apiToken + ":DUMMY@api.flowdock.com/flows/" + flows[i]), function(error, response, body) {
        if (!error && response.statusCode == 200) {
            var flow = JSON.parse(body);
            flowData[flow.id] = { name: flow.organization.parameterized_name + "/" + flow.parameterized_name, token: flow.api_token };
        }
        else console.log("Error getting flow data: " + (error || response) + "\n");
    });
}

// stream messages
var stream = request(encodeURI("https://" + apiToken + ":DUMMY@stream.flowdock.com/flows?filter=" + flows.join(",")))
    .pipe(JSONStream.parse());
stream.on('data', function(data) {
    if (data.event == "message" && typeof data.content == "string") {
        
        // check if message is for CheezeBot
        var match = data.content.match(/chee(?:s|z)ebot (.+)/i);
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
            if (data) console.log("---" + flow.name + "---\n" + data.user + ": " + data.content);
            console.log("CheezeBot: " + reply + "\n");
        }
        else console.log("Error posting reply: " + (error || response) + "\n");
    });
}

// timer data
var timers = [];

/* commands:
   each command requires
     * a description (for the help listing)
	 * a regex pattern to trigger the command
	 * a reply method which returns CheezeBot's reply (or null for no reply)
	   (alternately, reply can call the "post" method directly, which is useful inside a callback)
*/
var commands = [
    {
        description: "help:\t\t\t\tdisplay this message",
        pattern: /^help/,
        reply: function(match) {
            var help = "CheezeBot commands:";
            for (var i = 0; i < commands.length; i++) {
                var command = commands[i];
                help += "\n\t" + command.description;
            }
            return help;
        }
    },
    {
        description: "cheese:\t\t\t\tname a type of cheese",
        pattern: /^chee(?:s|z)e/,
        reply: function(match) {
            var cheeses = ["Anejo", "Asiago", "Blue", "Brie", "Butterkase", "Camembert", "Cheddar", "Chevres",
                           "Colby", "Cotija", "Edam", "Feta", "Fontina", "Gorgonzola", "Gouda", "Gruyere",
                           "Havarti", "Limburger", "Monterey Jack", "Mozzarella", "Munster", "Neufchatel",
                           "Parmesan", "Provolone", "Queso Blanco", "Raclette", "Romano", "Swiss"];
            return cheeses[Math.floor(Math.random() * cheeses.length)];
        }
    },
    {
        description: "now:\t\t\t\tcurrent date and time",
        pattern: /^now/,
        reply: function(match) {
            var date = new Date();
            return date.toDateString() + " - " + date.toTimeString()
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
                    else console.log("Error requesting gif: " + (error || response) + "\n");
                });
        }
    },
    {
        description: "timer [start|stop]:\t\tstart/stop a timer",
        pattern: /^timer(?: (start|stop))?/,
        reply: function(match, data) {
            var command = match[1];
            var time = 0;
            if (command == "start") timers[data.user] = new Date().getTime();
            else {
                time = (new Date().getTime() - timers[data.user]) / 1000;
                if (command == "stop") timers[data.user] = undefined;
            }
            return "timer: " + time + " s";
        }
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
				else console.log("Error requesting github data: " + (error || response) + "\n");
			});
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
								else console.log("Error requesting weather information: " + (error || response) + "\n");
							});
					}
					else post("No city found matching search", data);
				}
				else console.log("Error requesting weather information: " + (error || response) + "\n");
			});
        }
    },
];

// utility functions
function pad(len, str) {
    while (str.length < len) str += " ";
    return str;
}
