const Discord = require('discord.js');
const client = new Discord.Client();
var fs = require('fs');
const safeJsonStringify = require('safe-json-stringify');
var auth;
try {
  if (!fs.existsSync("./auth.json")) { throw new Error("Cannot find auth.json file") };
  /*const */auth = require('./auth.json');
  if (auth.token == "your token") { console.log("Enter your token please!"); }
} catch (error) {
  if (!fs.existsSync("./auth.json")) {
    var newAuth = { token: "your token" };
    SaveJson(newAuth, "auth.json");
  /*const*/ auth = require('./auth.json');
    console.log("Created auth.json file for you! Enter your token please!");
  }
}

var prefix = ">";

var servers;
var newServer = require("./data/newserver.json");

var invLink;

client.on('ready', () => {
  invLink = `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8`;
  servers = LoadJson("./data/servers.json");
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Invite link: ${invLink}`);
});


client.on("raw", (event) => {
  if (event.t == "ready") {
    servers = LoadJson("./data/servers.json");
    CheckServer(client.guilds.find(val => val.id === event.d.guild_id));
  }
  if (event.t == "PRESENCE_UPDATE") {
    CheckServer(client.guilds.find(val => val.id === event.d.guild_id));
    var user = client.users.get(event.d.user.id);
    if (user.bot) return;
    var game = event.d;
    console.log("---Presence Changed!--");
    console.log(user.username);
    //SaveJson(game, "./game.txt");
    FilterGame(event);
  }
});
client.on("guildCreate", (guild) => {
  CheckServer(guild);
});
function FilterGame(event) {
  var game = event.d.game;
  var user = client.users.get(event.d.user.id);
  var server = client.guilds.find(val => val.id === event.d.guild_id);
  if (user.bot) return;
  if (servers[server.id].statusChannel != "" && servers[server.id].statusChannel !== null) {
    var channel = client.channels.find(obj => {
      return obj.id === servers[server.id].statusChannel
    });
    chanID = servers[server.id].statusChannel;
    channel.fetchMessages()
      .then(msgs => {
        messages = msgs;
        var ms = msgs.find(msg => {
          if (msg.mentions.users.first() === undefined) { return null; }
          if (msg.author.id == client.user.id) {
            return msg.mentions.users.first().id === user.id;
          }
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



        if (game.assets === null || game.assets === undefined) {
          var em = {
            title: "**" + user.username + "**",
            description: "**" + game.name + "**",
            color: 0x5cad00
          }
          ms.edit(`<@${user.id}>`, { embed: em });
          return;
        }


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
          return;
        }
        //ravenfield MP
        if (game.name.includes("Ravenfield Multiplayer")) {
          console.log("RFMP");
          var obj = game;
          if (obj.hasOwnProperty("assets")) {
            var score = obj.assets.large_text.split(" : ");
            text = "-Mode: " + obj.state + "\n-Map: " + obj.assets.small_text.replace("Playing on ", "") + "\n-Username: " + score[0] + "\n-Score: " + score[1];
          } else {
            text = "-Mode: " + obj.state + "\n-State: " + obj.assets.details;
          }
          var em = {
            title: "**" + user.username + "**",
            description: "**" + game.name + "**\n" + text,
            color: 0x5cad00
          }
          ms.edit(`<@${user.id}>`, { embed: em });
          return;
        }
        //

        for (let index = 0; index < objs.length; index++) {
          if (objs[index].includes("text")) {
            var objValue = game.assets[objs[index]];
            text += " -" + objValue + "\n";
          }
        }
        var em = {
          title: "**" + user.username + "**",
          description: "**" + game.name + "**\n" + text,
          color: 0x5cad00
        }
        ms.edit(`<@${user.id}>`, { embed: em });
      })
      .catch((reason) => {
        console.log(reason);
      })
  }
}


client.on('message', msg => {

  var args = msg.toString().substring(1).split(' ');
  var cmd = args[0];
  args = args.splice(1);
  if (msg.toString()[0] != prefix) return;
  console.log(ReturnTime() + ` ${msg.member.user.username}: ` + msg.toString());
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

    case "restart":
      if (msg.member.user.id == "151039550234296320") {
        msg.delete();
        var em = {
          title: "**RESTARTING**",
          color: 0xe00707
        }
        SendEmbed(em);
        setTimeout(function () {
          process.exit()
        }, 1000);
      }
      break;

    case "trackme":
      if (!servers.hasOwnProperty(client.guilds.get(msg.guild.id).id)) {
        var em = {
          title: "this server doesn't have a statuschannel yet `>statuschannel`",
          color: 3447003
        }
        SendEmbed(em);
        return;
      }
      var cnl = client.channels.find(obj => {
        return obj.id === servers[client.guilds.get(msg.guild.id).id].statusChannel
      });
      cnl.send('Tracking <@' + msg.author.id + ">")
      break;

    case "invite":
      var avatarlink = client.users.get(client.user.id).avatarURL;
      var em = {
        title: "**Click here to invite me.**",
        url: invLink,
        color: 0x0000ff,
        image: {
          url: `${avatarlink}?size=256`
        }
      }
      msg.author.send({ embed: em })
      break;

    case "track":
      if (!servers.hasOwnProperty(client.guilds.get(msg.guild.id).id)) {
        var em = {
          title: "this server doesn't have a statuschannel yet `>statuschannel`",
          color: 3447003
        }
        SendEmbed(em);
        return;
      }
      var cnl = client.channels.find(obj => {
        return obj.id === servers[client.guilds.get(msg.guild.id).id].statusChannel
      });

      if (msg.mentions.users.first() !== undefined && msg.mentions.users.first() !== null) {
        cnl.send('Tracking <@' + msg.mentions.users.first().id + ">")
      } else cnl.send('Tracking <@' + msg.author.id + ">")
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

function SaveDebug(data, filename) {
  SaveJson(data, `./debug/${filename}.json`);
}

function CheckServer(server) {
  if (!servers.hasOwnProperty(server.id)) {
    NewServerboard(server);
  }
  Reserver(server);
}

function NewServerboard(server) {
  let newserverdata = newServer;
  newserverdata.name = server.name;

  servers[server.id] = newserverdata;

  SaveJson(servers, "./data/servers.json");
  servers = LoadJson("./data/servers.json");
}
function Reserver(server) {
  servers[server.id].name = server.name;
  SaveJson(servers, "./data/servers.json");
  servers = LoadJson("./data/servers.json");
}

function ReturnTime() {
  var date = new Date();
  var hours = date.getHours();
  var minutes = date.getMinutes();
  if (hours < 10) { hours = "0" + hours; }
  if (minutes < 10) { minutes = "0" + minutes; }
  return "[" + hours + ":" + minutes + "] "
}

function SaveJson(json, location) {
  let data;
  try {
    data = JSON.stringify(json, null, 4);
  } catch (error) {
    data = safeJsonStringify(json, null, 4);
  }
  fs.writeFileSync(location, data);
}

function LoadJson(location) {
  if (!fs.existsSync(location)) fs.writeFileSync(location, "{}");
  let rawdata = fs.readFileSync(location);
  let loadData = JSON.parse(rawdata);
  return loadData;
}
//Created by GiraffeSummer
client.login(auth.token);