const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const fs = require('fs');


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

function textRender(text) {
  return text.toLowerCase().split('_').map(word => word.split('')[0].toUpperCase() + word.split('').slice(1).join('')).join(' ')
}



const GAMES = {
  "Level 0": {
    custom_code : {
      launch: () => {
        console.log('Hello World!')
      },
      next_turn: () => {},
      win: () => {}
    },
    num_players: 4
  }
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

function mixArray(tab) { // Randomly mix an array
  var i, j, tmp;
  for (i = tab.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1));
    tmp = tab[i];
    tab[i] = tab[j];
    tab[j] = tmp;
  }
  return tab;
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
  

  

  
  
  socket.onAny((eventName, param) => {
    
    if(eventName.split(':')[0].toUpperCase() == 'LAUNCH') {
      
      let gameName = eventName.split(':')[1].toUpperCase(), 
          launchedParty = param;
      
      var party = parties.find(party => party.players.includes(socket.id));

      party.currentPlayers = mixArray(launchedParty.currentPlayers)

      if(party.owner !== socket.id) return socket.emit('alert', {
        message: 'You need to be the party host to start a game',
        color: 'red'
      })

      party.ingame = true;
      party.game = {
        name: gameName,
        turn: 0,
        max_players: GAMES[gameName].num_players
      }

      GAMES[gameName].custom_code['launch'](party)
      
      param.users = users;
      param.party = party;

      io.emit(`LAUNCH:${gameName}`, param)

      io.emit('update_party', parties)
    
    }
    
    else if(eventName.split(':')[0].toUpperCase() == 'NEXT_TURN') {
      
      let gameName = eventName.split(':')[1].toUpperCase()                    // Store name of the game
      
      var party = parties.find(party => party.players.includes(socket.id));   // Find socket's party
    
      party.game.turn += 1;
      if(party.game.turn >= GAMES[gameName].num_players)                      
        party.game.turn = 0;                                                  
      
      
      if(param.victory) {                                                     // victory.winner == 0 OR 1 OR false (tie) 
        party.ingame = false;
        
        io.emit(`END:${gameName}`, param)
        
        // PROGRAMME DE STATS JOUEUR
        
        GAMES[gameName].custom_code['win']()
        
      }
      
      GAMES[gameName].custom_code['next_turn']()
      
      
      io.emit('update_party', parties)
       
      param.party = party
      io.emit(`NEXT_TURN:${gameName}`, param)
    
    }
    
  })
  
  
  
  
  
  
  
  
  
  
  
  
  socket.on('game-change', game_name => {
    
    let party = parties.find(party => party.players.includes(socket.id));
    
    party.game = {
      name: game_name,
      turn : 0,
      num_players : GAMES[game_name].num_players
    }
    
    io.emit('game-change', {
      party,
      game_name
    })
    
  })
  
  socket.on('message-sent', message => {
    
    if(!message) return
    
    let party = parties.find(party => party.players.includes(socket.id));
    if(!party) return
    
    io.emit('update_users', users)
    io.emit('message-received', {
      party,
      author: socket.id,
      message
    })
  })
  
  
  
  
  
  socket.on('log-in', params => {
    let accounts = require('./accounts.json')
    
    if(!params.username || !params.password)
      socket.emit('logged-in', {
        success: false,
        error: 'An error occured'
      })
    
    else if(!accounts[params.username] || !accounts[params.username].password)
      socket.emit('logged-in', {
        success: false,
        error: 'No account exists with this username'
      })
    
    else if(String(accounts[params.username].password) !== String(params.password)) {
      socket.emit('logged-in', {
        success: false,
        error: 'Incorrect password'
      })
    }
    
    else if(accounts[params.username].password == params.password) {
      
      users.find(user => user.id == socket.id).login = true;
      users.find(user => user.id == socket.id).username = params.username;
      
      socket.emit('logged-in', {
        success: true,
        error: false,
        user: users.find(user => user.id == socket.id),
        account: accounts[params.username]
      })
      
      io.emit('update_users', users)
    }
    
  })
  
  
  socket.on('create-account', params => {
    var accounts = JSON.parse(fs.readFileSync('./accounts.json'))
    
    if(!params.username)
      socket.emit('created-account', {
        success: false,
        error: 'An error occured'
      })
    
    else if(accounts[params.username])
      socket.emit('created-account', {
        success: false,
        error: 'An account with this username already exists'
      })
    
    else {
      
      var password = Math.floor(1000 + Math.random() * 9000);
      
      accounts[params.username] = {
        password,
        games: [
          {
            name: "Morpion",
            victories: 0,
            defeats: 0,
            ties: 0
          }
        ]
      }
      
      users.find(user => user.id == socket.id).login = true;
      
      fs.writeFileSync('./accounts.json', JSON.stringify(accounts, null, 2))
      
      socket.emit('created-account', {
        success: true,
        error: false,
        account: accounts[params.username]
      })
    }
    
  })
  
  socket.on('remove-account', username => {
    var accounts = JSON.parse(fs.readFileSync('./accounts.json'))
    
    delete accounts[username]
    
    
    fs.writeFileSync('./accounts.json', JSON.stringify(accounts, null, 2))
  })
            
  
  
  
  socket.on('disconnect', () => {
    
    party_leave(socket.id)
    
    users.splice(users.indexOf(users.find(user => user.id == socket.id)), 1)
  
    io.emit('update_users', users)
    
    console.log(`[${getHMS()}]   Disconnection : ${userName(socket.id)}`);
  })
  
  
  
  
  
  // ADMIN !!
  socket.on('log-users', () => {
    console.log(users)
  })
  
  socket.on('log-parties', () => {
    console.log(parties)
  })
  
  socket.on('log-accounts', () => {
    console.log(JSON.stringify(JSON.parse(fs.readFileSync('./accounts.json')), null, 2))
  })
  
})