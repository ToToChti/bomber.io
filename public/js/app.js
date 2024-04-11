let socket = io();


function closeWindow(windowName) {
  let elem = document.querySelector('.' + windowName)
  if(elem) elem.classList.add('closed');
}

function openWindow(windowName) {
  let elem = document.querySelector('.' + windowName)
  if(elem) elem.classList.remove('closed');
}

