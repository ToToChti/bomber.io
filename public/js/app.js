let socket = io();

// Element declaration
let pseudoInput = document.querySelector('.pseudoInput');
let createPartyBtn = document.querySelector('.createPartyBtn');
let partyList = document.querySelector('.partyList');
let playerList = document.querySelector('.playerList');
let partyPage = document.querySelector('.partyPage');
let customPartyPage = document.querySelector('.customPartyPage');
let partyNameDisplay = customPartyPage.querySelector(".titleParty");
let leavePartyBtn = customPartyPage.querySelector(".leavePartyBtn");
let launchPartyBtn = customPartyPage.querySelector(".launchPartyBtn");
let mapChoiceList = customPartyPage.querySelector(".mapList");
let endScreen = document.querySelector('.endScreen');
let restartGameBtn = document.querySelector('.restartGameBtn');
let leaveGamePartyBtn = document.querySelector('.leaveGamePartyBtn');
let leaveGameBtn = document.querySelector('.leaveGameBtn');


let pseudo;
let parties;
let myPartyName = false;
let levelSelected = 0;
let gamePlayerId;
let numPlayers = 0;

let CLOCK_RUN;


function Alert(msg) {
  alert(msg);
}


function playBtn() {

  console.log("Play Button Pressed")

  let party = parties.find(party => party.name == myPartyName);
  
  if(!party || party.inGame) return;

  if(party.players.length < 2) return Alert("Must be 2 players at least to start a game!");
  
  socket.emit('launch_game', levelSelected);
}

socket.on('launchParty', (params) => {
  endScreen.classList.remove('opened');

  parties = params.parties;

  if(params.party.name != myPartyName || params.party.inGame) return;

  gamePlayerId = params.party.players.indexOf(socket.id) + 1;

  levelSelected = params.level;
  LEVEL = levelSelected;
  numPlayers = params.party.players.length;

  // Launch Party
  CLOCK_RUN = initialize(numPlayers);

  console.log("Game launched...");
  openWindow('gameWindow');
})





for(let i = 0; i < levels.length; ++i) {
  mapChoiceList.innerHTML += `<button class="btn selectedMap ${i == levelSelected ? "selected": ""}" onclick="chooseMap(${i})" id="mapChoice${i}">Level ${i}</button>`;
}

createPartyBtn.onclick = createParty;
leavePartyBtn.onclick = () => {
  socket.emit('leave-party');
  myPartyName = undefined;
  displayPartyPage();
}
launchPartyBtn.onclick = playBtn;

document.querySelector('.restartGameBtn').onclick = (e) => {
  let party = parties.find(party => party.name == myPartyName);
  
  if(!party || party.inGame) return;

  if(party.players.length < 2) return Alert("Must be 2 players at least to start a game!");
  
  socket.emit('launch_game', levelSelected);
}

leaveGameBtn.onclick = (e) => {
  socket.emit('closeEndWindow');
}

leaveGamePartyBtn.onclick = (e) => {
  socket.emit('closeEndWindow');
}

function chooseMap(id) {
  document.querySelectorAll('.selectedMap').forEach(elem => {
    elem.classList.remove('selected');
  })
  document.querySelector('#mapChoice' + id).classList.add('selected');
  levelSelected = id;
}

socket.on('update_party', parties => updateParties(parties));
socket.on('update_players', (params) => {
  if(params.party.name == myPartyName) {

    launchPartyBtn.classList.add('hidden');
    mapChoiceList.classList.add('hidden');
    
    parties.find(party => party.name == myPartyName).players = params.party.players;
    
    playerList.innerHTML = "";

    params.party.players.forEach(pl => {
      var userr = params.users.find(user => user.id == pl);
      
      if(!userr || !userr.username) return

      let string = `<div class="party"><div class="partyName">${userr.username}</div><div class="partyName">`;      

      if(pl == socket.id) {
        string += 'You'
      }

      if(pl == params.party.owner) {
        string += '<img src="images/crown.png">';
        if(pl == socket.id) {
          launchPartyBtn.classList.remove('hidden');
          mapChoiceList.classList.remove('hidden');
        }
      }

      string += '</div></div>';

      playerList.innerHTML += string;
      
    })
  }
})


function joinParty(partyName) {
  // If the player is already in party
  if(myPartyName) return;

  pseudo = pseudoInput.value;
  if(!pseudo || pseudo.length == 0) return Alert('Please enter a valid pseudo');

  socket.emit('change_nick', pseudo);
  socket.emit('party_join', partyName);
  
  myPartyName = partyName; 
  partyNameDisplay.innerHTML = myPartyName;

  playerList.innerHTML += `<div class="party">
  <div class="partyName">${pseudo}</div>
  <div class="partyName">You</div>
  </div>`;

  launchPartyBtn.classList.add('hidden');
  partyPage.classList.add('hidden');
  customPartyPage.classList.remove('hidden');  

  displayCustomPartyPage();

}

function createParty() {
  // If the player is already in party
  if(myPartyName) return;

  pseudo = pseudoInput.value;
  if(!pseudo || pseudo.length == 0) return Alert('Please enter a valid pseudo');

  socket.emit('change_nick', pseudo);

  let roomName = 'Room #' + randomString(4);
  socket.emit('create_party', roomName);

  myPartyName = roomName;
  launchPartyBtn.classList.remove('hidden');

  displayCustomPartyPage();
}

function displayCustomPartyPage() {

  partyNameDisplay.innerHTML = myPartyName;

  playerList.innerHTML += `<div class="party">
  <div class="partyName">${pseudo}</div>
  <div class="partyName">You<img src="images/crown.png"></div>
</div>`;

  partyPage.classList.add('hidden');
  customPartyPage.classList.remove('hidden');
}

function displayPartyPage() {
  partyPage.classList.remove('hidden');
  customPartyPage.classList.add('hidden');
}

function updateParties(partiess) {
  parties = partiess;

  if(parties.length == 0) return partyList.innerHTML = "No party started...";

  partyList.innerHTML = '';
  parties.forEach(party => {

    if(!party.ingame) {
      partyList.innerHTML += `<div onclick="joinParty('${party.name}')" class="party">
      <div class="partyName">${party.name}</div>
      <div class="partyName">${party.players.length} Player.s</div>
    </div>`;
    }
  })
}


function closeWindow(windowName) {
  let elem = document.querySelector('.' + windowName)
  if(elem) elem.classList.add('closed');
}

function openWindow(windowName) {
  let elem = document.querySelector('.' + windowName)
  if(elem) elem.classList.remove('closed');
}

function randomString(len) {
  let alpha = "abcdefghijklmnopqrstuvwxyz".split('');
  let string = "";

  for(let i = 0; i < len; ++i) {
    if(Math.round(Math.random() * 100) % 2 == 0) string += alpha[Math.floor(Math.random() * alpha.length)].toUpperCase(); 
    
    else string += alpha[Math.floor(Math.random() * alpha.length)];
  }

  return string;
}

function endGame(winnerGameId) {

  let winnerName;

  playerList.childNodes.forEach((child, i) => {
    if(i + 1 == winnerGameId) {
      winnerName = child.querySelectorAll('.partyName')[0].textContent
    }
  })

  gamePlayerId = undefined;

  if(winnerName && pseudo == winnerName) {
    document.querySelector('.titleDesc').innerHTML = "You won the game!";
    document.querySelector('.titleEnd').innerHTML = "VICTORY";
  }

  else {
    document.querySelector('.titleDesc').innerHTML = winnerName + " won the game!";
    document.querySelector('.titleEnd').innerHTML = "DEFEAT";
  }

  let party = parties.find(party => party.name == myPartyName);

  if(party.owner == socket.id) {
    leaveGameBtn.classList.remove('hidden');
    leaveGamePartyBtn.classList.add('hidden');
    restartGameBtn.classList.remove('hidden');
  }
  else {
    leaveGameBtn.classList.add('hidden');
    leaveGamePartyBtn.classList.remove('hidden');
    restartGameBtn.classList.add('hidden');
  }

  endScreen.classList.add('opened');

  clearInterval(CLOCK_RUN);
  CLOCK_RUN = undefined;


}

socket.on('closeEndWindow', params => {
  if(params.partyName != myPartyName) return;

  endScreen.classList.remove('opened');
  closeWindow('gameWindow');
})