const Discord = require('discord.js');
const client = new Discord.Client();
const auth = require('./auth.json');
var fs = require('fs');
const safeJsonStringify = require('safe-json-stringify');

var prefix = ">";

var servers;
var newServer = {
  name: "",
  prefix: ">",
  statusChannel: ""
}

var ms = -1;
var chanID = -1;

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

    console.log("---Presence Changed!--");
    var user = client.users.get(event.d.user.id);
    console.log(user.username);
    // console.log(game);
    if (!user.bot)
      FilterGame(event);
  }
});

function FilterGame(event) {
  var game = event.d.game;
  var user = client.users.get(event.d.user.id);
  var server = client.guilds.find(val => val.id === event.d.guild_id);

  if (servers[server.id].statusChannel != "" && servers[server.id].statusChannel !== null) {
    var channel = client.channels.find(obj => {
      return obj.id === servers[server.id].statusChannel
    });
    chanID = servers[server.id].statusChannel;
    channel.fetchMessages()
      .then(msgs => {
        messages = msgs;
        var ms = msgs.find(obj => {
          if (obj.mentions.users.first() === undefined) { return null; }
          return obj.mentions.users.first().id === user.id;
        });
        if (ms === undefined || ms === null) return;
        console.log("FOUND");
        if (game === null) {
          var em = {
            title: "**" + user.username + "**",
            description: "**None**",
            color: 0x5cad00
          }
          ms.edit(`<@${user.id}>`, { embed: em });

          return;
        }
        var text = "";
        var objs = Object.getOwnPropertyNames(game.assets);
        if (game.id == "spotify:1") {
          var obj = game;
          text = "-Artist: " + obj.state + "\n-Song: " + obj.details + "\n-Album: " + obj.assets.large_text;
          var em = {
            title: "**" + user.username + "**",
            description: "**" + game.name + "**\n" + text,
            color: 0x5cad00
          }
          ms.edit(`<@${user.id}>`, { embed: em });

        }
        for (let index = 0; index < objs.length; index++) {
          if (objs[index].includes("text")) {
            var objValue = game.assets[objs[index]];
            text += " -" + objValue + "\n";
          }
        }
        var em = {
          title: "**" + user.username + "**",
          description: game.name + "\n" + text,
          color: 0x5cad00
        }
        ms.edit(`<@${user.id}>`, { embed: em });
      });
  }
}


client.on('message', msg => {

  var args = msg.toString().substring(1).split(' ');
  var cmd = args[0];
  args = args.splice(1);
  if (msg.toString()[0] != prefix) return;

  function FullArgs() {
    return msg.replace(prefix + cmd, "");
  }

  switch (cmd.toLowerCase()) {
    case "test":
      var d = client.guilds.get(msg.guild.id);
      var em = {
        title: d.name,
        color: 3447003
      }
      SendEmbed(em);
      break;
    case "trackme":
      msg.reply('tracking');
      break;

    case "statuschannel":
      //var d = client.guilds.find(val => val.guild_id === msg.guild.id);
      var d = client.guilds.get(msg.guild.id);
      servers[d.id].statusChannel = msg.channel.id;
      Reserver(d);
      var em = {
        title: "Status channel set to " + msg.channel.name + "!",
        color: 3447003
      }
      SendEmbed(em);
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
  Reserver(server);
}

function NewServerboard(server) {
  let newserverdata = newServer;
  newserverdata.name = server.name;
  // newserverdata.statusChannel = server.channels[0];

  servers[server.id] = newserverdata;

  SaveJson(servers, "./data/servers.json");
  servers = LoadJson("./data/servers.json");
}
function Reserver(server) {
  //servers[server.id].name = server.name;
  SaveJson(servers, "./data/servers.json");
  servers = LoadJson("./data/servers.json");
}


function SaveJson(json, location) {
  let data;
  try {
    data = JSON.stringify(json, null, 4);
  } catch (error) {
    // data = Flatted.stringify(json,null,4);//JSON.stringify(json, null, 4);
    data = safeJsonStringify(json, null, 4);
  }
  //let data = Flatted.stringify(json);//JSON.stringify(json, null, 4);
  fs.writeFileSync(location, data);
}

function LoadJson(location) {
  let rawdata = fs.readFileSync(location);
  let loadData = JSON.parse(rawdata);
  return loadData;
}
function Flatten(object) {
  let data;
  try {
    data = JSON.stringify(object, null, 4);
    return JSON.parse(data);
  } catch (error) {
    data = safeJsonStringify(object, null, 4);
    return JSON.parse(data);
  }
}

client.login(auth.token);