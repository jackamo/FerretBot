module.exports.command = {
    description: "about:\t\t\t\tdeveloper and source info",
    pattern: /^about/i,
    reply: function() {
      console.log("About called!");
      return ["FerretBot by Jack, based on CheezeBot by Adam-G",
              "FB Source: git.io/sdfRXw, CB Source: git.io/1roJvQ",
              "Suggestions or contributions welcome.",
              "API Credits:",
              "FLOWDOCK.com/api",
              "WUNDERGROUND.com/weather/api",
              "developer.GITHUB.com/v3/",
              "github.com/GIPHY/giphyapi",
              "CATFACTS-api.appspot.com",
              "developers.GOOGLE.com/youtube/v3/",
              "http://products.WOLFRAMALPHA.com/api/"
              ].join("\n");
    }
  }
