module.exports.command = {
    description: "quote [\"{quote}\" - {quotee}]:\tquote store",
    pattern: /^quote(?:\s+(.+))?/i,
    reply: function(match, context) {
      dbConnect(function(db) {
        db.run("CREATE TABLE IF NOT EXISTS quote (quote TEXT)", function(error) {
          if (error) {
            console.error("Error creating quote table in database: " + JSON.stringify(error));
          }
          else if (typeof match[1] == "string") {
            var quote = match[1].trim();
            if (quote.match(/["“].+["”] - .+/)) {
              db.run("INSERT INTO quote VALUES (?)", quote, function(error) {
                if (error) console.error("Error writing quote: " + JSON.stringify(error));
                else post("Thanks for the new quote!", context);
              });
            }
            else post("No! Badly formatted quote!", context);
          }
          else {
            db.all("SELECT * FROM quote", function(error, rows) {
              if (error) console.error("Error reading quote: " + JSON.stringify(error));
              else if (!rows.length) post("No quotes available.", context);
              else post(rows[Math.floor(Math.random() * rows.length)].quote, context);
            });
          }
        });
      });
    }
  }
