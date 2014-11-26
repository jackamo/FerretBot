module.exports.command = {
    description: "weather {city}:\t\t\tweather forecast information",
    pattern: /^weather\s+(.+)/i,
    reply: function(match, context) {
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
                  post(result, context);
                }
                else post("No weather information found", context);
              }
              else console.error("Error requesting weather information: " + JSON.stringify(error || response) + "\n");
            });
          }
          else post("No city found matching search", context);
        }
        else console.error("Error requesting weather information: " + JSON.stringify(error || response) + "\n");
      });
    }
  }
