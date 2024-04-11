let socket = io();

// Element declaration
let pseudoInput = document.querySelector('.pseudoInput');
let createPartyBtn = document.querySelector('.createPartyBtn');


let pseudo;
let parties;



createPartyBtn.onclick = createParty;


socket.on('update_party', parties => updateParties(parties));

function createParty() {
  pseudo = pseudoInput.value;
  socket.emit('create_party', 'Room ' + randomString(4));
}

function updateParties(partyList) {
  parties = partyList;
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