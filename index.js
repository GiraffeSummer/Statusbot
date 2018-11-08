const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');

var prefix = ">";

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', msg => {

  var args = msg.toString().substring(1).split(' ');
  var cmd = args[0];
  args = args.splice(1);
  if (msg.toString()[0] != prefix) return;


  switch (cmd.toLowerCase()) {
    case "ping":
      msg.reply('Pong!');
      break;
  }
});

client.login(auth.token);