let socket = io();

// Element declaration
let pseudoInput = document.querySelector('.pseudoInput');


let pseudo;



function createParty() {
  pseudo = pseudoInput.value;

  socket.emit()
}

function closeWindow(windowName) {
  let elem = document.querySelector('.' + windowName)
  if(elem) elem.classList.add('closed');
}

function openWindow(windowName) {
  let elem = document.querySelector('.' + windowName)
  if(elem) elem.classList.remove('closed');
}

openWindow('gameWindow');