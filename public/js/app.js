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


let pseudo;
let parties;
let myPartyName = false;
let levelSelected = 0;



function playBtn() {

  

}






for(let i = 0; i < levels.length; ++i) {
  mapChoiceList.innerHTML += `<button class="selectedMap ${i == levelSelected ? "selected": ""}" onclick="chooseMap(${i})" id="mapChoice${i}">Level ${i}</button>`;
}

createPartyBtn.onclick = createParty;
leavePartyBtn.onclick = () => {
  socket.emit('leave-party');
  myPartyName = undefined;
  displayPartyPage();
}

function chooseMap(id) {
  document.querySelectorAll('.selectedMap').forEach(elem2 => {
    elem2.classList.remove('selected');
  })
  document.querySelector('#mapChoice' + id).classList.add('selected');
  levelSelected = id;
}

socket.on('update_party', parties => updateParties(parties));
socket.on('update_players', (params) => {
  if(params.party.name == myPartyName) {

    launchPartyBtn.classList.add('hidden');
    
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
          launchPartyBtn.classList.remove('hidden');
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

// openWindow('gameWindow');