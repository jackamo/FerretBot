module.exports.command = {
    description: "pullrequests {user}/{repo}:\tlist open pull requests",
    pattern: /^pullrequests\s+(.+\/.+)/i,
    reply: function(match, context) {
      var repo = match[1].trim();
      var domain = githubDomain ? githubDomain + "/api/v3" : "https://api.github.com";
      var options = {
        url: encodeURI(domain + "/repos/" + repo + "/pulls?access_token=" + githubToken),
        method: "GET",
        rejectUnauthorized: false,
        headers: { "User-Agent": "FerretBot" }
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
            post(result, context);
          }
          else post("no open pull requests for " + repo, context);
        }
        else console.error("Error requesting github data: " + JSON.stringify(error || response) + "\n");
      });
    }
  }
