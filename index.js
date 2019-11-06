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
    process.exit()
  }
}

var prefix = ">";

var servers;
var newServer = require("./data/newserver.json");

var invLink;

//in order:  Online,  idle, do not disturb, streaming,  offline
const statusColor = [0x31B983, 0xFF9918, 0xFA424B, 0x544388, 0x767D7E];

client.on('ready', () => {
  invLink = `https://discordapp.com/oauth2/authorize?client_id=${client.user.id}&scope=bot&permissions=8`;
  servers = LoadJson("./data/servers.json");
  console.log(`Logged in as ${client.user.tag}!`);
  console.log(`Invite link: ${invLink}`);


  client.user.setStatus('away')
    client.user.setPresence({
        game: {
            name: 'your status.',
            type: "Watching"
        }
    });
});


client.on("raw", (event) => {
  if (event.t == "ready") {
    servers = LoadJson("./data/servers.json");
    CheckServer(client.guilds.find(val => val.id === event.d.guild_id));
    client.user.setPresence({ game: { name: 'nameGoesHere', type: 4, state: "Hey" } });
  }
  if (event.t == "PRESENCE_UPDATE") {
    CheckServer(client.guilds.find(val => val.id === event.d.guild_id));
    var user = client.users.get(event.d.user.id);
    if (user.bot) return;
    console.log(`Presence Changed! -- [${user.username}]`);
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
        var statColor;
        try {
          if (event.d.game.type == 1)
            getStatusColor("streaming")
          else statColor = getStatusColor(event.d.status);
        } catch (error) { statColor = getStatusColor(event.d.status); }

        if (game === null) {
          var em = {
            title: "**" + user.username + "**",
            description: "**None**",
            color: statColor
          }
          ms.edit(`<@${user.id}>`, { embed: em });
          return;
        }
        var text = "";

        if (user.id == "151039550234296320") {
          SaveGame(event.d, "custom4")
        }

        if (game.assets === null || game.assets === undefined) {
          let custom = event.d.activities.find((act) => { return act.type === 4 })
          if (custom) {
            var em = {
              title: "**" + user.username + "**",
              description: ``,
              color: statColor
            }
            //em.description += "\n\n**Custom Status:**\n"

            if (custom.emoji) {
              if (!custom.emoji.id)
                em.description += `${custom.emoji.name} ${custom.state}`
            } else {
              em.description += `${custom.state}`
            }

            ms.edit(`<@${user.id}>`, { embed: em });
            return;
          } else {
            var em = {
              title: "**" + user.username + "**",
              description: "**" + game.name + "**",
              color: statColor
            }
            ms.edit(`<@${user.id}>`, { embed: em });
            return;
          }
        }

        //spotify
        if (game.id == "spotify:1") {
          text = "-Artist: " + game.state + "\n-Song: " + game.details + "\n-Album: " + game.assets.large_text;
          DefaultSend(ms, user, event.d, text, statColor);
          return;
        }
        //ravenfield MP
        if (game.name.includes("Ravenfield Multiplayer")) {
          console.log("RFMP");
          if (game.hasOwnProperty("assets")) {
            var score = game.assets.large_text.split(" : ");
            text = "-Mode: " + game.state + "\n-Map: " + game.assets.small_text.replace("Playing on ", "") + "\n-Username: " + score[0] + "\n-Score: " + score[1];
          } else {
            text = "-Mode: " + game.state + "\n-State: " + game.assets.details;
          }
          DefaultSend(ms, user, event.d, text, statColor);
          return;
        }

        //Visual Studio Code
        if (game.name == "Visual Studio Code") {
          text = "-" + game.details + "\n-" + game.state;
          DefaultSend(ms, user, event.d, text, statColor);
          return;
        }

        //Slime Rancher
        if (game.name == "Slime Rancher") {
          text = "-" + game.details;
          if (game.state !== undefined) text += "\n-" + game.state;
          DefaultSend(ms, user, event.d, text, statColor);
          return;
        }


        //
        var objs = Object.getOwnPropertyNames(game.assets);
        if (game.details !== undefined && game.details != "") text += "-" + game.details;
        if (game.state !== undefined && game.state != "") text += "\n-" + game.state + "\n";
        for (let index = 0; index < objs.length; index++) {
          if (objs[index].includes("text")) {
            var objValue = game.assets[objs[index]];
            text += " -" + objValue + "\n";
          }
        }
        var em = {
          title: "**" + user.username + "**",
          description: "**" + game.name + "**\n" + text,
          color: statColor,
          thumbnail: GetImageUrl(game)
        }
        ms.edit(`<@${user.id}>`, { embed: em });

        if (event.d.game.type !== 1)
          SaveGame(game, game.name);
      })
      .catch((reason) => {
        console.log(reason);
      })
  }
}

function GetImageUrl(game) {
  var url = `https://cdn.discordapp.com/app-assets/${game.application_id}/`;
  var asset = undefined;

  if (game.id == "spotify:1") return { url: `https://i.scdn.co/image/${game.assets.large_image.split(':')[1]}` };

  for (let i = 0; i < Object.getOwnPropertyNames(game.assets).length; i++) {
    if (Object.getOwnPropertyNames(game.assets)[i].includes("image")) {
      asset = game.assets[Object.getOwnPropertyNames(game.assets)[i]];
    }

    if (i === Object.getOwnPropertyNames(game.assets).length - 1)
      if (asset === undefined)
        return asset;
      else
        return { url: url + `${asset}.png` };
  }
}

function DefaultSend(ms, user, event, text, color) {
  let game = event.game;
  img = GetImageUrl(game)
  var em = {
    title: "**" + user.username + "**",
    description: "**" + game.name + "**\n" + text,
    color: color,
    thumbnail: img
  }

  let custom = event.activities.find((act) => { return act.type === 4 })
  if (custom) {
    em.description += "\n\n**Custom Status:**\n"
    if (custom.emoji) {
      if (!custom.emoji.id)
        em.description += `${custom.emoji.name} ${custom.state}`
    } else {
      em.description += `${custom.state}`
    }
  }

  ms.edit(`<@${user.id}>`, { embed: em });
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

function SaveGame(data, filename) {
  if (!fs.existsSync(`./games/${filename}.json`)) {
    SaveJson(data, `./games/${filename}.json`);
    console.log(filename + "- was saved")
  }
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

function getStatusColor(status) {
  switch (status) {
    case "online":
      return statusColor[0];

    case "idle":
      return statusColor[1];

    case "dnd":
      return statusColor[2];

    case "streaming":
      return statusColor[3];

    case "offline":
      return statusColor[4];

    default:
      return statusColor[0];
  }
}

function LoadJson(location) {
  if (!fs.existsSync(location)) fs.writeFileSync(location, "{}");
  let rawdata = fs.readFileSync(location);
  let loadData = JSON.parse(rawdata);
  return loadData;
}
//Created by GiraffeSummer
client.login(auth.token);