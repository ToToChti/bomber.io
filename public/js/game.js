let canvas = document.querySelector('#bomberGame');
let ctx = canvas.getContext('2d');

const charText = new Image();
charText.src = "../images/character_no_bg.png";

const blockText = new Image();
blockText.src = "../images/block.png";

const wallText = new Image();
wallText.src = "../images/Wall.png";

const pathText = new Image();
pathText.src = "../images/Dirt Road.png";

const bombText = new Image();
bombText.src = "../images/Bomb.png";

const bombItem = new Image();
bombItem.src = "../images/Bomb Item.png";
const radiusItem = new Image();
radiusItem.src = "../images/Radius Item.png";
const perfoItem = new Image();
perfoItem.src = "../images/Perfo Item.png";

const expCenter = new Image();
expCenter.src = "../images/explosion_center.png";

const tp1Text=new Image();
tp1Text.src = "../images/tp1.png";

const darkCharText = new Image();
darkCharText.src = "../images/darkChar.png";


let expTrail = {};
let expEnd = {};
let ORIENT = ['L', 'R', 'B', 'T'];

for(let orient of ORIENT) {
  expEnd[orient] = new Image();
  expEnd[orient].src = `../images/explosion_end${orient}.png`;

  if(orient == 'L') orient = 'R';
  if(orient == 'B') orient = 'T';

  expTrail[orient] = new Image();
  expTrail[orient].src = `../images/explosion_trail${orient}.png`;
}

expTrail['B'] = expTrail['T'];
expTrail['L'] = expTrail['R'];

let FPS_origin = 24;
let FPS = 50;
let speedRectif = FPS / FPS_origin;

let HIT_BOX = 5;

const effectAppearTime = 0.07;
const effectExplosionTime = 0.7;

const dropItemProbability = 1/2;
const charRatio = 0.8;


const WALL = 0;
const PATH = 1;
const CRATE = 2;

let LEVEL = 2;
let MAP;

let entityArray = [];
let effectArray = [];
let playerArray = [];

let numToBlock = {
  0: 'Block',
  1: 'Path',
  2: 'Wall'
}

let lastBoardDim = {width: false, height: false};


class Player {
  constructor(id,x, y, width) {
    this.id=id;
    this.x = x;
    this.y = y;
    this.speed = 10;
    this.width = width;
    this.height = width;
    this.expRadius = 1;
    this.numBomb = 1;
    this.lives = 3;
    this.finalDead = false;
    this.perforation = false;
    this.onBomb = false;
    this.alive = true;
    this.lastBomb = {
      x: -1,
      y: -1
    };
  }
}


class Bomb {
  constructor(col, row, width, radius, explosionTime, perforation, extra, own) {
    this.col = col;
    this.row = row;
    this.width = width;
    this.radius = radius;
    this.perforation = perforation;
    this.extra = extra;
    this.explosionTime = explosionTime;
    this.own = own;
  }
}

class Extra {
  constructor(name, texture, id, col, row) {
    this.name = name;
    this.texture = texture;
    this.col = col;
    this.row = row;
    this.id = id;
  }
}

class Effect {
  constructor(texture, col, row, orient) {
    this.texture = texture;
    this.col = col;
    this.row = row;
    this.orient = orient;
    this.opacity = 0;
  }
}

class Spawn{
  constructor(id,texture,col,row)
  {
    this.id = id;
    this.texture=texture;
    this.col = col;
    this.row = row;
  }
}


let extraList = [
  {name: "One Extra Bomb", id: "1bomb", texture: bombItem},
  {name: "One Extra Explosion Radius", id: "1radius", texture: radiusItem},
  {name: "Perforation", id: "perfo", texture: perfoItem},
];

let player;

let keyCollector = [];
let spacePress = true;

document.addEventListener('keydown', (event) => {
  keyCollector[event.key] = true;
})

document.addEventListener('keyup', (event) => {
  delete keyCollector[event.key];
})


function getColRow(posX, posY) {

  posX = posX || playerArray[gamePlayerId - 1].x;
  posY = posY || playerArray[gamePlayerId - 1].y;

  let col = [];
  let row = [];

  let ratioX = canvas.width / MAP[0].length;
  let ratioY = canvas.height / MAP.length;

  row.push(Math.floor(posY / ratioY), Math.floor((posY + playerArray[gamePlayerId - 1].height) / ratioY));
  col.push(Math.floor(posX / ratioX), Math.floor((posX + playerArray[gamePlayerId - 1].width) / ratioX));

  return {col, row}

}

function getCase(posX, posY) {
  
  posX = posX || playerArray[gamePlayerId - 1].x;
  posY = posY || playerArray[gamePlayerId - 1].y;

  let col = -1;
  let row = -1;

  let ratioX = canvas.width / MAP[0].length;
  let ratioY = canvas.height / MAP.length;

  row = Math.floor((posY + posY + playerArray[gamePlayerId - 1].height) / 2 / ratioY);
  col = Math.floor((posX + posX + playerArray[gamePlayerId - 1].width) / 2 / ratioX);

  return {col, row}
}


function pickItems(x, y) {
  let colRow = getColRow(x, y);

  let itemFound = false;
  let COL, ROW;

  for(let col of colRow.col) {
    for(let row of colRow.row) {

      let item = entityArray.find(entity => entity.row == row && entity.col == col && entity.constructor.name == 'Extra');
      if(item) {
        itemFound = item;
        COL = col;
        ROW = row;
      }
    }
  }

  if(itemFound) {
    playSound("pickItem");

    if(itemFound.id == "1bomb") {
      playerArray[gamePlayerId - 1].numBomb++;
    }
    if(itemFound.id == "1radius") {
      playerArray[gamePlayerId - 1].expRadius++;
    }
    if(itemFound.id == "perfo") {
      playerArray[gamePlayerId - 1].perforation = true;
    }

    socket.emit('removeItem', {x: COL, y: ROW});
  }
}



function collision(moveX, moveY) {

  let notMove = false;

  let colRow = getColRow(moveX, moveY);

  let findOwnBomb = false;

  for(let col of colRow.col) {
    for(let row of colRow.row) {

      if(col == playerArray[gamePlayerId - 1].lastBomb.x && row == playerArray[gamePlayerId - 1].lastBomb.y) {
        findOwnBomb = true;
      }

      if(MAP[row][col] == CRATE || MAP[row][col] == WALL) {
        notMove = true;
      }

      if(entityArray.find(entity => entity.row == row && entity.col == col && entity.constructor.name == 'Bomb') && (playerArray[gamePlayerId - 1].lastBomb.x != col || playerArray[gamePlayerId - 1].lastBomb.y != row)) {
        notMove = true;
      }
    }
  }

  if(!findOwnBomb) {
    playerArray[gamePlayerId - 1].lastBomb.x = -1;
    playerArray[gamePlayerId - 1].lastBomb.y = -1;
  }

  return notMove;
}

function addExplosion(orient, index, radius, col, row) {
  
  if(index == 0) {
    effectArray.push(new Effect(expCenter, col, row, orient));
  }

  else if(index == radius) {
    effectArray.push(new Effect(expEnd[orient], col, row, orient));
  }

  else {    
    effectArray.push(new Effect(expTrail[orient], col, row, orient));
  }

  let effect = effectArray[effectArray.length - 1];

  let interval = setInterval(() => {
    effect.opacity += effectAppearTime;
    
    if(effect.opacity > 1) clearInterval(interval);
  }, 10)

  setTimeout(() => {
    interval = setInterval(() => {
      effect.opacity -= effectAppearTime;
      
      if(effect.opacity < 0) {
        clearInterval(interval);
        effectArray.splice(effectArray.indexOf(effect), 1);
      }
    }, 10)
  }, effectExplosionTime * 1000);

}

function explode(x, y, index, radius, orient, perforation) {

  if(!index && !radius && !orient && !perforation) {
    playSound("explosion");
  }
  
  let bomb;
  let propagate = {
    left:   true,
    right:  true,
    top:    true,
    bottom: true,
  }
  
  // Determining if block is in map
  let blockType = -1;
  if(x >= 0 && x < MAP[0].length && y >= 0 && y < MAP.length) {

    // If block is a usual block
    if(MAP[y][x].constructor.name == 'Number') {
      blockType = numToBlock[MAP[y][x]];
    }

    bomb = entityArray.find(entity => entity.constructor.name == 'Bomb' && entity.row == y && entity.col == x);
    if(bomb) {
      blockType = 'Bomb';
    }
  }

  if(!orient) orient = 'R';
  if(!perforation) perforation = false;
  if(!radius && bomb) radius = bomb.radius;



  // Explosion of a wall
  if(blockType == "Wall") {

    // Change block type on map
    MAP[y][x] = 1;

    // 1 chance of 2 to get a bonus
    if(Math.round(Math.random() * 100) % (1 / dropItemProbability) == 0) {
      let bonus = extraList[Math.floor(Math.random() * extraList.length)]

      socket.emit('placeItem', {bonusID: bonus.id, x, y});
    }

    // Generate explosion effect
    if(perforation) addExplosion(orient, index, radius, x, y);
    else addExplosion(orient, index, index, x, y);
  }

  else if(blockType == 'Bomb') {

    if(bomb.own) playerArray[gamePlayerId - 1].numBomb++;
    
    // Remove bomb from entity array & render explosion
    entityArray.splice(entityArray.indexOf(bomb), 1); 
    addExplosion(orient, 0, radius, x, y);

    let block = getCase(playerArray[gamePlayerId - 1].x, playerArray[gamePlayerId - 1].y);
    
    if(bomb.col == block.col && bomb.row == block.row) {
      socket.emit('playerDeath', gamePlayerId);
    }

    // Propagate explosion to cross shaped explosion
    for(let i = 1; i <= radius; ++i) {
      let B, T, L, R;

      if(propagate.bottom) B = explode(bomb.col, bomb.row + i, i, bomb.radius, 'B', bomb.perforation)
      if(propagate.top)    T = explode(bomb.col, bomb.row - i, i, bomb.radius, 'T', bomb.perforation)
      if(propagate.right)  R = explode(bomb.col + i, bomb.row, i, bomb.radius, 'R', bomb.perforation)
      if(propagate.bottom) L = explode(bomb.col - i, bomb.row, i, bomb.radius, 'L', bomb.perforation)

      if((B == 'Wall' && !bomb.perforation) || B == 'Block') propagate.bottom = false;
      if((T == 'Wall' && !bomb.perforation) || T == 'Block') propagate.top    = false;
      if((R == 'Wall' && !bomb.perforation) || R == 'Block') propagate.right  = false;
      if((L == 'Wall' && !bomb.perforation) || L == 'Block') propagate.left   = false;
    }
  }

  else if(blockType == 'Path') {
    // Draw explosion
    addExplosion(orient, index, radius, x, y);

    let colRow = getColRow(playerArray[gamePlayerId - 1].x, playerArray[gamePlayerId - 1].y);

    let willDie = false;
    for(let col of colRow.col) {
      for(let row of colRow.row) {

        if(x == col && y == row) {
          willDie = true;
        }
      }
    }

    if(willDie) socket.emit('playerDeath', gamePlayerId);

    let itemOnCase = entityArray.find(entity => entity.constructor.name == 'Extra' && entity.col == x && entity.row == y);
    if(itemOnCase) {
      entityArray.splice(entityArray.indexOf(itemOnCase), 1);
    }
  }

  return blockType;
}


function placeBomb(x, y, radius, perforation, external) {

  let ratioX = canvas.width / MAP[0].length;
  let ratioY = canvas.height / MAP.length;

  if(playerArray[gamePlayerId - 1].numBomb == 0 && !external) return;

  let colRow = getColRow(x, y);
  let isBomb = false;

  if(!external) {
    for(row of colRow.row) {
      for(col of colRow.col) {
        if(entityArray.find(entity => entity.col == col && entity.row == row && entity.constructor.name == "Bomb")) {
          isBomb = true;
        }
      }
    }
  }

  let block = getCase(x, y);

  if(external) {
    block.col = x;
    block.row = y;
  }

  if(MAP[block.row][block.col] != 1 || isBomb)
    return;


  playerArray[gamePlayerId - 1].lastBomb.x = block.col;
  playerArray[gamePlayerId - 1].lastBomb.y = block.row;

  if(!external) playerArray[gamePlayerId - 1].numBomb--;
  entityArray.push(new Bomb(block.col, block.row, playerArray[gamePlayerId - 1].width, radius, 3, perforation, false, !external));

  playSound("bombPlaced");

  if(!external) {
    socket.emit('placeBomb', {x: block.col, y: block.row, ratioX, radius, perforation});
  }

  setTimeout(() => {
    if(entityArray[entityArray.length - 1] && !entityArray[entityArray.length - 1].exploded) {
      explode(block.col, block.row);
    }
  }, entityArray[entityArray.length - 1].explosionTime * 1000)
}


function keyHandle() {
  if(!playerArray[gamePlayerId - 1].alive || playerArray[gamePlayerId - 1].finalDead) return;

  let ratioX = canvas.width / MAP[0].length;
  let order = [];

  let moveX = playerArray[gamePlayerId - 1].x;
  let moveY = playerArray[gamePlayerId - 1].y;

  if(keyCollector['z'] || keyCollector['ArrowUp']) order.push('up');
  if(keyCollector['q'] || keyCollector['ArrowLeft']) order.push('left');
  if(keyCollector['d'] || keyCollector['ArrowRight']) order.push('right');
  if(keyCollector['s'] || keyCollector['ArrowDown']) order.push('down');

  if(keyCollector[' '] && spacePress == false) { 
    spacePress = true;
    placeBomb(playerArray[gamePlayerId - 1].x, playerArray[gamePlayerId - 1].y, playerArray[gamePlayerId - 1].expRadius, playerArray[gamePlayerId - 1].perforation);
  }

  else if(!keyCollector[' ']) {
    spacePress = false;
  }

  if(order.length != 2) {
    if(order[0] == 'up') moveY -= playerArray[gamePlayerId - 1].speed / speedRectif;
    if(order[0] == 'down') moveY += playerArray[gamePlayerId - 1].speed / speedRectif;
    if(order[0] == 'left') moveX -= playerArray[gamePlayerId - 1].speed / speedRectif;
    if(order[0] == 'right') moveX += playerArray[gamePlayerId - 1].speed / speedRectif;
  }

  else if(order.length == 2) {
    if(order.includes('up') && order.includes('right')) {
      moveX += playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
      moveY -= playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
    }
    if(order.includes('down') && order.includes('right')) {
      moveX += playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
      moveY += playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
    }
    if(order.includes('up') && order.includes('left')) {
      moveX -= playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
      moveY -= playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
    }
    if(order.includes('down') && order.includes('left')) {
      moveX -= playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
      moveY += playerArray[gamePlayerId - 1].speed / Math.sqrt(2) / speedRectif;
    }
  }

  let blocked = collision(moveX, moveY);
  
  if(!blocked && !(playerArray[gamePlayerId - 1].x == moveX && playerArray[gamePlayerId - 1].y == moveY)) {
    playerArray[gamePlayerId - 1].x = moveX;
    playerArray[gamePlayerId - 1].y = moveY;

    socket.emit('playerMove', {x: moveX, y: moveY, playerID: gamePlayerId, ratio: ratioX});
  }

  pickItems(playerArray[gamePlayerId - 1].x, playerArray[gamePlayerId - 1].y);
}

function death(plID) {

  let ratioX = canvas.width / MAP[0].length;

  playerArray[plID - 1].alive = false;

  playSound('death');

  setTimeout(() => {
    let gap = getPosSpawn(playerArray[plID - 1].id);

    playerArray[plID - 1].x = HIT_BOX + gap.x;
    playerArray[plID - 1].y = HIT_BOX + gap.y;

    playerArray[plID - 1].alive = true;

    socket.emit('playerMove', {x: playerArray[plID - 1].x, y: playerArray[plID - 1].y, playerID: plID, ratio: ratioX});
  }, 3000);

  if(--playerArray[plID - 1].lives <= 0) {
    playerArray[plID - 1].finalDead = true;

    if(playerArray.filter(play => !play.finalDead).length <= 1) {
      endGame(playerArray.filter(play => !play.finalDead)[0].id);

      socket.emit('gameFinished');
    }
  }
}

function drawPlayer() {

  for(let i = 0; i < numPlayers; ++i) {
    
    if(!playerArray[i].finalDead) {
      charText.width  = playerArray[i].width;
      charText.height = playerArray[i].height;

      ctx.drawImage(
        (playerArray[i].alive ? charText : darkCharText),
        playerArray[i].x,
        playerArray[i].y, 
        playerArray[i].width, 
        playerArray[i].height
      );
    }
  }
}

function draw() {

  let ratioX = canvas.width / MAP[0].length;
  let ratioY = canvas.height / MAP.length;


  
  // Drawing Map
  for(let Y = 0; Y < MAP.length; ++Y) {
    for(let X = 0; X < MAP[0].length; ++X) {
      let block = MAP[Y][X];

      if(block == 0) {
        ctx.drawImage(blockText, X * ratioX, Y * ratioY, ratioX, ratioY);
      }
      else if(block == 1) {
        ctx.drawImage(pathText, X * ratioX, Y * ratioY, ratioX, ratioY);
      }
      else if(block == 2) {
        ctx.drawImage(wallText, X * ratioX, Y * ratioY, ratioX, ratioY);
      }
    }
  }

  entityArray.forEach(entity => {
    if(entity.constructor.name == "Bomb") {
      ctx.drawImage(bombText, entity.col * ratioX, entity.row * ratioY, ratioX, ratioY);
    }

    if(entity.constructor.name == "Extra") {
      ctx.drawImage(entity.texture, entity.col * ratioX, entity.row * ratioY, ratioX, ratioY);
    }
    if(entity.constructor.name == "Spawn") {
      ctx.drawImage(entity.texture, entity.col * ratioX, entity.row * ratioY, ratioX, ratioY);
    }
  })

  effectArray.forEach(effect => {
    ctx.globalAlpha = effect.opacity;
    ctx.drawImage(effect.texture, effect.col * ratioX, effect.row * ratioY, ratioX, ratioY);
    ctx.globalAlpha = 1;
  })

  drawPlayer();

}


function getPosSpawn(id)
{
  let ratioX = canvas.width / MAP[0].length;
  let ratioY = canvas.height / MAP.length;

  for(let i of entityArray) {
    if(i.constructor.name == 'Spawn' && id == i.id) {
      return {x: i.col*ratioX, y: i.row*ratioY};
    }
  }

  console.log("ERROR: Spawn not found x(");
  return false;
}


function main() {
  keyHandle();

  draw();
}


function resize() {

  if(!MAP) return;

  let ratioMAP = MAP.length / MAP[0].length;
  let ratioSCR = document.querySelector(".bomberPlate").offsetHeight / document.querySelector(".bomberPlate").offsetWidth;

  if(ratioMAP >= ratioSCR) {
    canvas.height = document.querySelector(".bomberPlate").offsetHeight;
    canvas.width = document.querySelector(".bomberPlate").offsetHeight / ratioMAP;
  }

  else {
    canvas.height = document.querySelector(".bomberPlate").offsetWidth * ratioMAP;
    canvas.width = document.querySelector(".bomberPlate").offsetWidth;
  }

  if(playerArray[gamePlayerId - 1]) resizeChar();

  lastBoardDim.width = canvas.width;
  lastBoardDim.height = canvas.height;

  return;
}


// Resize character
function resizeChar() {

  for(let i = 0; i < numPlayers; ++i) {
    if(lastBoardDim.width && lastBoardDim.height) {
      playerArray[i].x = playerArray[i].x * canvas.width / lastBoardDim.width;
      playerArray[i].y = playerArray[i].y * canvas.height / lastBoardDim.height;

      playerArray[i].speed = playerArray[i].speed * canvas.width / lastBoardDim.width;
    }

    playerArray[i].height = (canvas.width / MAP[0].length)*charRatio - HIT_BOX * 2;
    playerArray[i].width  = (canvas.width / MAP[0].length)*charRatio - HIT_BOX * 2;
  }
  return;
}

function initialize(plCount) {

  MAP = levels[LEVEL].slice();
  playerArray = [];

  entityArray = [];
  effectArray = [];

  entityArray.push(new Spawn(1,tp1Text,1,1));
  entityArray.push(new Spawn(2,tp1Text,MAP[0].length-2,1));
  entityArray.push(new Spawn(3,tp1Text,1,MAP.length-2));
  entityArray.push(new Spawn(4,tp1Text,MAP[0].length-2,MAP.length-2));

  resize();

  for(let i = 0; i < plCount; ++i) {
    let gap = getPosSpawn(i + 1)
    playerArray.push(new Player(i + 1,HIT_BOX+gap.x,HIT_BOX+gap.y, (canvas.width / MAP[0].length)*charRatio - HIT_BOX * 2));
  }
  
  resizeChar();

  draw();

  return setInterval(main, 1000 / FPS);
}

window.onresize = resize;


socket.on('placeBomb', (params) => {
  if(params.partyName != myPartyName || params.emittor == socket.id) return;

  placeBomb(params.x, params.y, params.radius, params.perforation, true);
})

socket.on('playerMove', (params) => {
  let ratio = canvas.width / MAP[0].length;

  if(params.partyName != myPartyName || params.playerID == gamePlayerId) return;

  playerArray[params.playerID - 1].x = params.x * ratio / params.ratio;
  playerArray[params.playerID - 1].y = params.y * ratio / params.ratio;
})

socket.on('playerDeath', params => {
  if(params.partyName != myPartyName) return;

  death(params.playerID);
})

socket.on('placeItem', params => {
  if(params.partyName != myPartyName) return;

  let bonus = extraList.find(extra => extra.id == params.bonusID);

  entityArray.push(new Extra(bonus.name, bonus.texture, bonus.id, params.x, params.y));
})

socket.on('removeItem', params => {
  if(params.partyName != myPartyName) return;

  let extra = entityArray.find(entity => entity.constructor.name == 'Extra' && entity.col == params.x && entity.row == params.y);

  if(!extra) return;
  
  entityArray.splice(entityArray.indexOf(extra), 1);
})
