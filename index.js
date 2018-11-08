const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
var fs = require('fs');

var prefix = ">";

var servers;
var newServer = {
  name: "",
  prefix: ">",
  statusChannel: ""
}

client.on('ready', () => {
  servers = LoadJson("./data/servers.json");
  console.log(`Logged in as ${client.user.tag}!`);
});


client.on("raw", (event) => {
  if (event.t == "ready") {
    CheckServer(client.guilds.find(val => val.id === event.d.guild_id));
  }
  if (event.t == "PRESENCE_UPDATE") {
    CheckServer(client.guilds.find(val => val.id === event.d.guild_id));

    var game = event.d;

    console.log("Presence Changed!");
    var user = client.users.get(event.d.user.id);
    console.log(user.username);
    console.log(game);
  }
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

    case "test":
      var d = client.guilds.find(val => val.guild_id === msg.guild_id).name;
      // console.log(client.guilds.find("guild_id", msg.guild_id));
      var em = {
        title: d.name,
        color: 3447003
      }
      SendEmbed(em);
      break;

      case "statuschannel":
      var d = client.guilds.find(val => val.guild_id === msg.guild_id);
      // console.log(client.guilds.find("guild_id", msg.guild_id));
      servers[d.id].statusChannel = msg.channel;
      Reserver(d);
      var em = {
        title: "Status channel set to <#" + msg.channel.id + ">",
        color: 3447003
      }
      SendEmbed(em);
      break;

    case "statuschannel":
      break;
  }
  function SendEmbed(emb) {
    msg.channel.send({ embed: emb });
  }
});

function SendEmbed(emb) {
  message.channel.send({ embed: emb });
}

function CheckServer(server) {
  // var server.id = server.id;
  if (!servers.hasOwnProperty(server.id)) {
    NewServerboard(server);
  }
  Reserver();
}

function NewServerboard(server) {
  let newserverdata = newServer;
  newserverdata.name = server.name;
  console.log(server.channels);
 // newserverdata.statusChannel = server.channels[0];

  servers[server.id] = newserverdata;

  SaveJson(servers, "./data/servers.json");
  servers = LoadJson("./data/servers.json");
}

function Reserver(server) {
  servers[server.id].name = server.name;
  SaveJson(servers, "./data/servers.json");
  servers = LoadJson("./data/servers.json");
}


function SaveJson(json, location) {
  let data = JSON.stringify(json, null, 4);
  fs.writeFileSync(location, data);
}

function LoadJson(location) {
  let rawdata = fs.readFileSync(location);
  let loadData = JSON.parse(rawdata);
  return loadData;
}
client.login(auth.token);