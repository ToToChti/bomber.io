const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');


const publicPath = path.join(__dirname, './public');
const port = process.env.PORT || 3000;
let app = express();
let server = http.createServer(app);

let io = socketIO(server);

app.use(express.static(publicPath));



function getHMS() {
  var date = new Date()
  var AT = 2;
  return (date.getHours() + AT < 10 ? "0" + date.getHours() + AT : date.getHours() + AT) + ':' +
         (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes()) + ':' +
         (date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds())
}


var users = [],
    parties = [];

server.listen(port, ()=> {
  console.log(`\n\n\n[${getHMS()}]   Server Opened`)    
});

function userName(socket_id) {
  if(!users.find(user => user.id == socket_id)) return socket_id
  return users.find(user => user.id == socket_id).username ||
         socket_id;
}


function party_leave(socket_id) {
  var party = parties.find(party => party.players.includes(socket_id));
    
  if(party) {
    if(party.owner == socket_id) {
      if(party.players.length > 1) {
        var num = 0;
        while(party.owner == socket_id) {
          party.owner = party.players[num];
          num++;
        }

        console.log(`[${getHMS()}]   New host : ${userName(party.owner)} | For : ${party.name}`)
      } else {
        parties.splice(parties.indexOf(parties.find(par => par == party)), 1);
        
        console.log(`[${getHMS()}]   ${party.name} closed`)
      }
    }

    party.players.splice(party.players.indexOf(party.players.find(pl => pl == socket_id)), 1);

    io.emit('update_players', {
      party,
      users
    })
    
    io.emit('update_party', parties)
    
    console.log(`[${getHMS()}]   ${userName(socket_id)} left ${party.name}`);
  }
}




io.on('connection', (socket) => {
  
  users.push({
    id: socket.id,
    username: false,
    login: false
  })
  
  console.log(`[${getHMS()}]   Connection : ${userName(socket.id)}`);

  io.emit('update_party', parties);
  io.emit('update_users', users);
  
  
  
  socket.on('create_party', (party) => {
    console.log(`[${getHMS()}]   Created by ${userName(socket.id)} | Name : ${party}`);
    
    parties.push({
      name: party,
      owner: socket.id,
      players: [
        socket.id
      ],
      ingame: false,
      level: false,
      currentPlayers: []
    })
    
    io.emit('update_party', parties)
    io.emit('update_users', users)
  })
  
  
  socket.on('refresh_parties', () => {
    io.emit('update_party', parties)
  })
  
  
  socket.on('change_nick', (username) => {
    
    users.find(user => user.id == socket.id).username = username;
    
    var find_party = parties.find(party => party.players.includes(socket.id));
    if(find_party) {
      io.emit('update_players', {
        party: find_party,
        users
      })
    }
    
    io.emit('update_users', users)
    
    console.log(`[${getHMS()}]   ${userName(socket.id)} changed to ${username}`);
  })
  
  
  socket.on('change-party-name', (names) => {
    
    parties.find(party => party.name == names.old).name = names.new;
    
    io.emit('change_party_name', names);
    io.emit('update_party', parties)
    
    console.log(`[${getHMS()}]   Name changes from ${names.old} to ${names.new}`);
    
  })
  
  
  socket.on('party_join', (party_name) => {
    var party = parties.find(party => party.name == party_name)
    
    party.players.push(socket.id);
    
    io.emit('update_players', {
      party,
      users
    })
    
    io.emit('update_party', parties)
    io.emit('update_users', users)
    
    console.log(`[${getHMS()}]   ${userName(socket.id)} joined ${party_name}`);
  })
  
  
  socket.on('leave-party', () => {

    var party = parties.find(party => party.players.includes(socket.id));
    if(!party) return;
    
    party_leave(socket.id);
    
    io.emit('update_players', {
      party,
      users
    })
    io.emit('update_party', parties)
  })


  socket.on('launch_game', level => {
    var party = parties.find(party => party.players.includes(socket.id));

    party.ingame = true;
    party.level = level;

    console.log(`[${getHMS()}]   ${party.name} launched level ${level}`);

    io.emit('launchParty', {level, parties, party, emittor: socket.id});
  })


  socket.on('placeBomb', params => {
    var party = parties.find(party => party.players.includes(socket.id));

    if(!party) return;

    io.emit('placeBomb', {x: params.x, y: params.y, partyName: party.name, emittor: socket.id, radius: params.radius, perforation: params.perforation});
  })
  
  
  socket.on('playerMove', params => {
    var party = parties.find(party => party.players.includes(socket.id));

    if(!party) return;

    io.emit('playerMove', {x: params.x, y: params.y, partyName: party.name, playerID: params.playerID, ratio: params.ratio});
  })

  socket.on('playerDeath', plID => {
    var party = parties.find(party => party.players.includes(socket.id));

    if(!party) return;

    io.emit('playerDeath', {partyName: party.name, playerID: plID});
  })

  socket.on('placeItem', params => {
    var party = parties.find(party => party.players.includes(socket.id));

    if(!party) return;

    io.emit('placeItem', {partyName: party.name, bonusID: params.bonusID, x: params.x, y: params.y});
  })

  socket.on('removeItem', params => {
    var party = parties.find(party => party.players.includes(socket.id));
    if(!party) return;

    io.emit('removeItem', {partyName: party.name, x: params.x, y: params.y});
  })

  socket.on('gameFinished', () => {
    var party = parties.find(party => party.players.includes(socket.id));
    if(!party) return;

    party.ingame = false;

    io.emit('update_party', parties);
  })

  socket.on('closeEndWindow', () => {
    var party = parties.find(party => party.players.includes(socket.id));
    if(!party) return;

    io.emit('closeEndWindow', {partyName: party.name});
  })
  
  
  socket.on('disconnect', () => {
    
    party_leave(socket.id)
    
    users.splice(users.indexOf(users.find(user => user.id == socket.id)), 1)
  
    io.emit('update_users', users)
    
    console.log(`[${getHMS()}]   Disconnection : ${userName(socket.id)}`);
  })  
})