module.exports.command = {
    description: "tally {category} [{member}]\n\t\t[++|--|+= n|-= n]:\tkeep a tally",
    pattern: /^tally\s+(\S+)(?:\s+([^\s+-]*)\s*(\+\+|--|\+=\s*\d+|-=\s*\d+)?)?/i,
    reply: function(match, context) {
      var category = match[1];
      var member = match[2];
      var command = match[3];
      dbConnect(function(db) {
        db.run("CREATE TABLE IF NOT EXISTS tally" +
        "(category TEXT, member TEXT, count INT, PRIMARY KEY (category, member))", function(error) {
          if (error) {
            console.error("Error creating tally table in database: " + JSON.stringify(error));
          }
          else {
            db.all("SELECT * FROM tally WHERE category LIKE ? AND member LIKE ?",
            category, member || "%", function(error, rows) {
              if (error) console.error("Error reading tally: " + JSON.stringify(error));
              else {
                var postTally = function(rows) {
                  var result = "";
                  for (var i = 0; i < rows.length; i++) {
                    result += "\n\t" + rows[i].member + ": " + rows[i].count;
                  }
                  post("Tally for " + category + ":" + result, context);
                };
                if (member) {
                  var count = rows.length ? rows[0].count : 0;
                  if (command) {
                    eval("count" + command);
                    db.run("INSERT OR REPLACE INTO tally VALUES (?, ?, ?)", category, member, count, function(error) {
                      if (error) console.error("Error updating tally: " + JSON.stringify(error));
                      else postTally([{category: category, member: member, count: count}]);
                    });
                  }
                  else postTally([{category: category, member: member, count: count}]);
                }
                else postTally(rows);
              }
            });
          }
        });
      });
    }
  }
