module.exports.command =   {
    description: "email {addr} {subj} \\n {msg}:\tsend email",
    pattern: /^email\s+(\S+@\S+)\s+([^\n\r]+)\s+([\s\S]+)/i,
    reply: function(match, context) {
      getUserInfo(context.user, function(user) {
        email({
          from: user.name + " <" + user.email + ">",
          to: match[1],
          subject: match[2],
          text: match[3]
        }, context);
      });
    }
  }
