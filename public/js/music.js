let playlist = [
  "./music/music1.mp3",
  "./music/music2.mp3",
  "./music/music3.mp3",
]

let sounds = {
  explosion: "./music/explosion.mp3",
  pickItem: "./music/bonusPick.mp3",
  bombPlaced: "./music/bombDrop.mp3",
}

let musicCount = Math.floor(Math.random() * playlist.length);

let audioBTN = document.querySelector(".musicOnOff");
let audio = document.querySelector("#bgMusic");

audio.volume = 0;
audio.src = playlist[musicCount];


audioBTN.addEventListener('click', e => {
  audioBTN.classList.toggle('noMusic');

  if(audioBTN.classList.contains('noMusic')) {
    audio.volume = 0
  }
  else {  
    audio.volume = .3;
    audio.play();
  }
})

audio.addEventListener('ended', e => {
  musicCount = (musicCount + 1) % playlist.length;
  audio.src = playlist[musicCount];
  audio.play();
})



let channels = []

let nbChannel = 5;
for(let i = 0; i < nbChannel; ++i) {
  channels.push(document.querySelector(`#channelSound${i + 1}`));
  channels[i].volume = 0.3;
}

function playSound(soundName) {
  let channelNum = 0;

  while(channels[channelNum] && !channels[channelNum].paused) {
    channelNum++;
  }

  // If no channel has been found
  if(channelNum >= channels.length) return;


  channels[channelNum].src = sounds[soundName];
  channels[channelNum].play();
}