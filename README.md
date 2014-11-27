#FerretBot

FerretBot is a FlowDock bot built by Jack Robinson, forked off of [CheezeBot](https://github.com/akg1852/CheezeBot) by Adam Gray.
##Installation
Once you have cloned the project, setup involves making some changes to the ferretbot.js file:
* Edit the botName to whatever name you want the bot to be summoned by
* Fill in your credentials
	* The flowdock token is your flowdock user's token
	* The flows array is a list of flows the bot listens to, in the format "org/flow"
	* The other credentials are for specific command functionality

## Adding your own commands:

Each command sits within the `/commands` directory, all with the format `[command].command.js` which just keeps everything nice :)

To add your own command, the format is as follows.

```
var ferretbot = require("../ferretbot.js"); // Requires the post function

// You'd also reference all your required modules here too!

module.exports.command = {
	description: "example: This is an Example Command"
	pattern: /^example/i, // The regex pattern this command follows.
	reply: function(match, context){
		ferretbot.post("Example Command Executed! Welcome!", context);
	}
}
```

 Where we need:
* A 'description' for the help listing
* A regex 'pattern' to trigger the command
* A 'reply' method which takes parameters:
	* The regex 'match' array
	* The flowdock stream 'context' object
	* The 'reply' method returns FerretBots's reply (or null for no reply)
	  (alternatively, 'reply' can call the 'post' method directly, which is useful inside a callback)

Once this is complete, you need to add lines `to the commands.js` file within the main directory, where:
* Add a require to the list of requires, so in our example it would be `example = require("./commands/example.command.js")`
* Add the command to the commands array below, so we would add `example.command` and you should be ready to go!

##Running FerretBot
* "npm install" the required packages. There is currently no `package.json` so this has to be done manually
	* `request`
	* `JSONStream`
	* `nodemailer`
	* `xml2js`
	* `sqlite3`

* Run the bot by typing `node ferretbot.js` from the terminal
