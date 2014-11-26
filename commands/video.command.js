module.exports.command = {
    description: "video {search string}:\t\tshow a video based on a search string",
    pattern: /^(?:video|youtube)\s+(.+)/i,
    reply: function(match, context) {
      request(encodeURI("https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&key=" + youtubeToken + "&q=" + match[1]),
      function(error, response, body) {
        if (!error && response.statusCode == 200) {
          var videoData = JSON.parse(body).items[0];
          if (videoData) post("http://www.youtube.com/watch?v=" + videoData.id.videoId, context);
          else post("No suitable video found - try a different search", context);
        }
        else console.error("Error requesting video: " + JSON.stringify(error || response) + "\n");
      });
    }
  }
