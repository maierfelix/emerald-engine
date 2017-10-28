import {
  DIR,
  OFFSETS as OFS
} from "./offsets";

import Rom from "./rom";

import {
  readBinaryFile,
  setImageSmoothing
} from "./utils";

// check browser compatibility
console.assert(
  (typeof Worker !== "undefined") &&
  (typeof WebGLRenderingContext !== "undefined")
);

console.clear();

let ctx = canvas.getContext("2d");

let width = 0;
let height = 0;

function debug(msg) {
  ctx.clearRect(0, 0, width, height);
  let size = 18;
  ctx.font = `${size}px Open Sans`;
  ctx.fillStyle = "rgba(255,255,255,1)";
  msg = msg.toUpperCase();
  let centerX = ctx.measureText(msg).width;
  let xx = (width / 2) - centerX / 2;
  let yy = (height / 2);
  ctx.fillText(msg, xx, yy);
};

function $(el) {
  return document.querySelector(el);
};

let host = Array.from(location.host.substr(0, 5));

window.rom = null;

resize();

debug(`Downloading ROM file...`);

setTimeout(() => {
  readBinaryFile("rom.gba").then((buffer) => {
    resize();
    /*if (
      (host[0].charCodeAt(0) !== 109) ||
      (host[1].charCodeAt(0) !== 97) ||
      (host[2].charCodeAt(0) !== 105) ||
      (host[3].charCodeAt(0) !== 101) ||
      (host[4].charCodeAt(0) !== 114)
    ) return;*/
    new Rom(buffer, { debug }).then((instance) => {
      rom = instance;
      init();
    });
  });
}, 1e2);

function zoomScale(x) {
  return (
    x >= 0 ? x + 1 :
    x < 0 ? x + 1 :
    x + 1
  );
};

function roundTo(x, f) {
  const i = 1 / f;
  return (Math.round(x * i) / i);
};

let delta = 0;
let gameTime = 0;
let gameTicks = 0;
function init() {
  $(".ui").style.opacity = 1.0;
  resize();
  let last = 0;
  (function drawLoop() {
    requestAnimationFrame(drawLoop);
    let now = Date.now();
    gameTime = now;
    gameTicks++;
    update();
    draw();
    delta = now - last;
    last = now;
  })();
  console.log(rom.maps);
};

function update() {
  updateEntity(player);
  updateCamera();
};

function draw() {
  ctx.clearRect(0, 0, width, height);
  drawBackgroundMap();
  drawEntity(player);
  drawEntities();
  drawForegroundMap();
};

function drawBackgroundMap() {
  for (let key in rom.maps) {
    let map = rom.maps[key];
    if (map.name === "UNDERWATER") continue;
    drawBorder(key);
    drawMap(key, 0);
    drawMapAnimations(key, 0);
    drawReflections(player);
    drawMap(key, 2);
    drawMapAnimations(key, 1);
    drawMap(key, 1);
    drawDoorAnimations(key);
  };
  lol += 0.075;
};

function drawDoorAnimations(key) {
  let map = rom.maps[key];
  let doors = map.doors;
  for (let ii = 0; ii < doors.length; ++ii) {
    let door = doors[ii];
    let xx = cx + ((((map.x | 0) * 16) + (door.x | 0)) * cz) | 0;
    let yy = cy + ((((map.y | 0) * 16) + (door.y - 16) | 0) * cz) | 0;
    let img = door.data.canvas;
    ctx.drawImage(
      img,
      0, (door.frame | 0) * 32,
      32, 32,
      xx, yy,
      (32 * cz) | 0, (32 * cz) | 0
    );
    if (door.isOpening) {
      door.frame++;
      if (door.frame > 4) {
        door.isOpening = false;
        door.isClosing = true;
      }
    }
    else if (door.isClosing) {
      door.frame--;
      if (door.frame < 0) {
        door.isOpening = true;
        door.isClosing = false;
      }
    }
  };
};

function drawMapArrows(key) {
  let map = rom.maps[key];
  let facedTile = getFacedTilePosition(player.facing, player.x, player.y);
  // exit arrows
  let exit = getExitTileAt(facedTile.x, facedTile.y);
  if (exit !== null) {
    let dx = exit.x; let dy = exit.y;
    // get tile behavior
    let behavior = getTileBehaviorAt(exit.x, exit.y);
    if (behavior === 0x65) dy += 1;
    else if (behavior === 0x64) dy -= 1;
    else if (behavior === 0x62) dx += 1;
    else if (behavior === 0x63) dx -= 1;
    // tile is a inside->outside warp
    if (behavior !== 0x69) {
      let img = rom.graphics.effects[4].canvas;
      let xx = cx + ((dx * 16) * cz) | 0;
      let yy = cy + ((dy * 16) * cz) | 0;
      let frame = (
        behavior === 0x65 ? 3 :
        behavior === 0x64 ? 0 :
        behavior === 0x62 ? 2 :
        behavior === 0x63 ? 1 : -1
      );
      ctx.drawImage(
        img,
        0, frame * 16,
        16, 16,
        xx, yy,
        (16 * cz) | 0, (16 * cz) | 0
      );
    }
  }
};

function drawReflections(entity) {
  let dx = cx + (entity.x * 16) * cz;
  let dy = cy + ((entity.y - 1) * 16) * cz;
  let map = rom.maps[currentMap];
  let index = ((entity.y + 1 | 0) * map.width + (entity.x | 0));
  // water reflection
  if (
    (entity === player) &&
    (map.behavior[index] === 0x10 ||
    map.behavior[index] === 0x16 ||
    map.behavior[index] === 0x20 ||
    map.behavior[index] === 0x1a ||
    map.behavior[index] === 0x2b)
  ) {
    let sprite = rom.graphics.overworlds[entity.sprite][entity.frame].canvas;
    let sw = sprite.width;
    let sh = sprite.height;
    ctx.globalAlpha = 0.425;
    let resolution = window.devicePixelRatio;
    ctx.scale(1, -1);
    ctx.drawImage(
      sprite,
      0, 0,
      sw, sh,
      dx, -(cy + ((entity.y + 0.925) * 16) * cz),
      sw * cz, -sh * cz
    );
    resetTransformation();
    ctx.globalAlpha = 1.0;
  }
};

let lol = 0;
function drawForegroundMap() {
  for (let key in rom.maps) {
    let map = rom.maps[key];
    if (map.name === "UNDERWATER") continue;
    drawMap(key, 1);
    drawMapEvents(key);
    drawMapArrows(key);
  };
};

function drawMapEvents(key) {
  let map = rom.maps[key];
  let events = map.events;
  // exits
  for (let ii = 0; ii < events.exits.length; ++ii) {
    let exit = events.exits[ii];
    let xx = cx + (((exit.x | 0) * 16) * cz) | 0;
    let yy = cy + (((exit.y | 0) * 16) * cz) | 0;
    let ww = (16 * cz) | 0;
    let hh = (16 * cz) | 0;
    //ctx.fillStyle = `rgba(${255},${0},${0},${0.35})`;
    //ctx.fillRect(xx, yy, ww, hh);
  };
  // signs
  for (let ii = 0; ii < events.signs.length; ++ii) {
    let sign = events.signs[ii];
    let xx = cx + (((sign.x | 0) * 16) * cz) | 0;
    let yy = cy + (((sign.y | 0) * 16) * cz) | 0;
    let ww = (16 * cz) | 0;
    let hh = (16 * cz) | 0;
    //ctx.fillStyle = `rgba(${0},${0},${255},${0.35})`;
    //ctx.fillRect(xx, yy, ww, hh);
  };
  // npcs
  for (let ii = 0; ii < events.npcs.length; ++ii) {
    let npc = events.npcs[ii];
    let xx = cx + (((npc.x | 0) * 16) * cz) | 0;
    let yy = cy + (((npc.y - 1 | 0) * 16) * cz) | 0;
    let ww = (32 * cz) | 0;
    let hh = (32 * cz) | 0;
    /*ctx.drawImage(
      npc.sprite[0].canvas,
      0, 0,
      32, 32,
      xx, yy,
      ww, hh
    );*/
  };
};

function drawMapAnimations(key, layer) {
  let map = rom.maps[key];
  let animations = map.animations[layer];
  let animationData = map.animationData[layer];
  for (let ii = 0; ii < animations.length; ++ii) {
    let anim = animations[ii];
    let data = animationData[anim.index].data;
    let xx = anim.x;
    let yy = anim.y;
    let img = data[(lol | 0) % (data.length)].canvas;
    ctx.drawImage(
      img,
      0, 0,
      8, 8,
      cx + (xx) * cz, cy + (yy) * cz,
      8 * cz, 8 * cz
    );
  };
};

function drawMap(id, layer) {
  let map = rom.maps[id];
  let img = map.texture[layer].canvas;
  let xx = cx + (((map.x | 0) * 16) * cz) | 0;
  let yy = cy + (((map.y | 0) * 16) * cz) | 0;
  let ww = (img.width * cz) | 0;
  let hh = (img.height * cz) | 0;
  if (!inView(map)) return;
  ctx.drawImage(
    img,
    0, 0,
    img.width, img.height,
    xx, yy,
    ww, hh
  );
  ctx.font = `${12 * cz}px Open Sans`;
  ctx.fillStyle = "#fff";
  ctx.fillText(map.name + " [" + map.bank + ":" + map.id + "]", xx + 16, yy + 16);
};

function drawEntities() {
  for (let ii = 0; ii < entities.length; ++ii) {
    let entity = entities[ii];
    let dx = cx + (entity.x * 16) * cz;
    let dy = cy + ((entity.y) * 16) * cz;
    if (entity.frame >= 4) {
      entity.frame = 0;
      entity.paused = true;
    }
    let frame = entity.frame | 0;
    let sprite = entity.sprite.canvas;
    let sw = sprite.width;
    let sh = sprite.height;
    ctx.drawImage(
      sprite,
      frame, frame * 16,
      16, 16,
      dx, dy,
      16 * cz, 16 * cz
    );
    if (!entity.paused) entity.frame += 0.1;
  };
};

function drawEntity(entity) {
  let dx = cx + (entity.x * 16) * cz;
  let dy = cy + ((entity.y - 1) * 16) * cz;
  let map = rom.maps[currentMap];
  let index = ((entity.y + 1 | 0) * map.width + (entity.x | 0));
  drawSprite(entity.sprite, entity.frame, dx, dy);
};

function drawSprite(id, frame, x, y) {
  let sprite = rom.graphics.overworlds[id][frame].canvas;
  let sw = sprite.width;
  let sh = sprite.height;
  ctx.drawImage(
    sprite,
    0, 0,
    sw, sh,
    x, y,
    sw * cz, sh * cz
  );
};

function inView(map) {
  let img = map.texture.canvas;
  let xx = cx + (((map.x - 8) * 16) * cz) | 0;
  let yy = cy + (((map.y - 8) * 16) * cz) | 0;
  let ww = (((map.width + 16) * 16) * cz) | 0;
  let hh = (((map.height + 16) * 16) * cz) | 0;
  return (
    (xx + ww >= 0 && xx <= width) &&
    (yy + hh >= 0 && yy <= height)
  );
};

function drawBorder(key) {
  let map = rom.maps[key];
  let border = map.border;
  let texture = border.canvas;
  let tw = texture.width;
  let th = texture.height;
  ctx.drawImage(
    texture,
    0, 0,
    tw, th,
    cx + (((map.x - 8) * 16) * cz) | 0,
    cy + (((map.y - 8) * 16) * cz) | 0,
    (tw * cz) | 0, (th * cz) | 0
  );
};

let PLAYER_DEFAULT_SPEED = 0.06;
let PLAYER_RUN_SPEED = 0.12;

window.player = {
  test: 0,
  foot: 0,
  frame: 0,
  frameIndex: 0,
  waitMove: 0,
  lastMove: 0,
  facing: DIR.DOWN,
  speed: PLAYER_DEFAULT_SPEED,
  tx: 8, ty: 8,
  dx: 0, dy: 0,
  vx: 0, vy: 0,
  x: 8, y: 8,
  lock: false,
  isMoving: false,
  isRunning: false,
  sprite: 89
};

window.FREE_CAMERA = false;

window.cz = 3;

let entities = [];

let currentMap = "0:9";

function updateCamera() {
  if (!FREE_CAMERA) {
    cx = (width / 2) - (((player.x * 16) + 8)) * cz;
    cy = (height / 2) - ((((player.y - 1) * 16) + 20)) * cz;
  }
};

function updateEntity(entity) {
  // IEEE 754 hack
  if (entity.x !== entity.tx) entity.x = Math.round(entity.x * 1e3) / 1e3;
  if (entity.y !== entity.ty) entity.y = Math.round(entity.y * 1e3) / 1e3;
  // distances from current tile to target tile
  let dtx = Math.abs(entity.tx - entity.x);
  let dty = Math.abs(entity.ty - entity.y);
  // the entities walk speed
  let speed = getSpeed(entity);
  // is moving
  let isMovingX = entity.vx !== 0.0;
  let isMovingY = entity.vy !== 0.0;
  let isMovingXY = isMovingX || isMovingY;
  // walks against something blocked
  // isn't moving but in walking state
  let isBumping = !isMovingXY && entity.frameIndex > 0;
  // moved only the first frame yet
  let justMovedOneFrame = isMovingXY && (
    (dtx < 0.2 && dtx > 0.0) ||
    (dty < 0.2 && dty > 0.0)
  );
  // we have to move, but didn't move yet
  let didntMoveYet = isMovingXY && ((dtx >= 1.0) || (dty >= 1.0));
  // reached half of destination
  let reachedHalfX = dtx <= 0.5;
  let reachedHalfY = dty <= 0.5;
  // reached destination
  let reachedDestX = (
    (entity.tx > entity.x && entity.x + speed >= entity.tx) ||
    (entity.tx < entity.x && entity.x - speed <= entity.tx)
  );
  let reachedDestY = (
    (entity.ty > entity.y && entity.y + speed >= entity.ty) ||
    (entity.ty < entity.y && entity.y - speed <= entity.ty)
  );
  // get the source tile
  // - round up if positive
  // - round down if negative
  let srcTileX = (
    entity.vx > 0 ? (entity.tx | 0) : Math.ceil(entity.tx)
  );
  let srcTileY = (
    entity.vy > 0 ? (entity.ty | 0) : Math.ceil(entity.ty)
  );
  // get the moved to tile
  // - round up if positive
  // - round down if negative
  let nextTileX = (
    entity.vx > 0 ? Math.ceil(entity.x) : (entity.x | 0)
  );
  let nextTileY = (
    entity.vy > 0 ? Math.ceil(entity.y) : (entity.y | 0)
  );

  // stop moving
  if (reachedDestX) {
    entity.x = entity.tx;
    entity.vx = 0;
    entity.foot = !entity.foot | 0;
  }
  else if (reachedDestY) {
    entity.y = entity.ty;
    entity.vy = 0;
    entity.foot = !entity.foot | 0;
  }
  // half tile walk foot
  if (isMovingX) entity.frameIndex = (!reachedHalfX) | 0;
  if (isMovingY) entity.frameIndex = (!reachedHalfY) | 0;

  let map = rom.maps[currentMap];
  let index = (Math.ceil(entity.y) * map.width + Math.ceil(entity.x));
  // water ripple step
  if (
    map.behavior[index] === 0x16 &&
    justMovedOneFrame
  ) {
    entities.push({
      x: Math.ceil(player.x),
      y: Math.ceil(player.y),
      frame: 0,
      sprite: rom.graphics.effects[1]
    });
  }
  // stepping into grass
  if (
    justMovedOneFrame &&
    map.behavior[(nextTileY * map.width + nextTileX)] === 0x2
  ) {
    entities.push({
      x: nextTileX,
      y: nextTileY,
      frame: 0,
      sprite: rom.graphics.effects[0]
    });
  }

  // border jump
  if (didntMoveYet) {
    let index = (entity.ty * map.width + entity.tx) | 0;
    let behavior = map.behavior[index];
    if (behavior === 0x3b) {
      if (entity.ty > entity.y) {
        entity.ty = entity.ty + 1;
        entity.y = entity.ty | 0;
        entity.vy = 0;
      } else {
        stopMove(entity);
      }
      /*if (isMovingX) {
        if (entity.tx > entity.x) {
          entity.x = entity.tx = entity.tx;
        }
        else {
          entity.x = entity.tx = entity.tx;
        }
        entity.vx = 0;
      }*/
    }
  }

  // move be velocity
  if (isMovingX) entity.x += entity.vx;
  else if (isMovingY) entity.y += entity.vy;

  if (isMovingXY) entity.lastMove = 0;
  else entity.lastMove++;

  // switch the foot
  if (!isMoving(entity) && entity.frameIndex > 0 && (-entity.waitMove % (FACE_TIME * 3)) === 0) {
    //entity.frameIndex = 0;
  }

  entity.isMoving = isMovingXY;

  updateFrame(entity);
};

function stopMove(entity) {
  entity.vx = 0;
  entity.vy = 0;
  entity.tx = entity.x | 0;
  entity.ty = entity.y | 0;
  entity.frameIndex = 0;
};

function updateFrame(entity) {
  let facing = entity.facing;
  let foot = entity.foot;
  let index = entity.frameIndex;
  let state = 0;
  // stand step
  if (entity.waitMove <= FACE_TIME && entity.waitMove >= FACE_TIME - 2) {
    index = 1;
    foot = !entity.foot | 0;
  }
  if (entity.isMoving && entity.isRunning) {
    state = 12;
  }
  entity.frame = state + (((index) * (5 - (foot))) + (((index) + 1) * facing));
  entity.waitMove--;
};

let facedPosition = { x: 0, y: 0 };
function getFacedTilePosition(facing, x, y) {
  switch (facing) {
    case DIR.DOWN:  y += 1; break;
    case DIR.UP:    y -= 1; break;
    case DIR.LEFT:  x -= 1; break;
    case DIR.RIGHT: x += 1; break;
  };
  facedPosition.x = x;
  facedPosition.y = y;
  return facedPosition;
};

function getTileIndexFrom(map, x, y) {
  return y * map.width + x;
};

function getTileBehaviorAt(x, y) {
  let map = rom.maps[currentMap];
  let index = getTileIndexFrom(map, x, y);
  return map.behavior[index];
};

function getTileBackgroundAt(x, y) {
  let map = rom.maps[currentMap];
  let index = getTileIndexFrom(map, x, y);
  return map.background[index];
};

function getTileAttributeAt(x, y) {
  let map = rom.maps[currentMap];
  let index = getTileIndexFrom(map, x, y);
  return map.attributes[index];
};

function getExitTileAt(x, y) {
  let map = rom.maps[currentMap];
  let exits = map.events.exits;
  for (let ii = 0; ii < exits.length; ++ii) {
    let exit = exits[ii];
    let behavior = getTileBehaviorAt(exit.x, exit.y);
    if (behavior === 0x69 && x === exit.x && y === exit.y) return exit;
    else if (behavior === 0x60 && x === exit.x && y === exit.y) return exit;
    else if (behavior === 0x65 && x === exit.x && y === exit.y + 1) return exit;
    else if (behavior === 0x64 && x === exit.x && y === exit.y - 1) return exit;
    else if (behavior === 0x62 && x === exit.x + 1 && y === exit.y) return exit;
    else if (behavior === 0x63 && x === exit.x - 1 && y === exit.y) return exit;
  };
  return null;
};

function isMoving(entity) {
  return (
    !entity.lock &&
    (entity.x !== entity.tx ||
    entity.y !== entity.ty)
  );
};

let FACE_TIME = 8;

function isBlocked(entity, dir) {
  let x = entity.x | 0;
  let y = entity.y | 0;
  switch (dir) {
    case DIR.DOWN:  y += 1; break;
    case DIR.UP:    y -= 1; break;
    case DIR.LEFT:  x -= 1; break;
    case DIR.RIGHT: x += 1; break;
  };
  let map = rom.maps[currentMap];
  let index = getTileIndexFrom(map, x, y);
  let attr = map.attributes[index];
  let behavior = map.behavior[index];
  return (
    (x < 0 || x >= map.width) ||
    (y < 0 || y >= map.height) ||
    (attr === 1 || attr === 0xd) &&
    (behavior !== 0x3b)
  );
};

function isAnyMoveKeyPressed() {
  let down = keys["s"] || keys["ArrowDown"];
  let up = keys["w"] || keys["ArrowUp"];
  let left = keys["a"] || keys["ArrowLeft"];
  let right = keys["d"] || keys["ArrowRight"];
  return (down | up | left | right);
};

function getSpeed(entity) {
  return (
    entity.isRunning ? PLAYER_RUN_SPEED : PLAYER_DEFAULT_SPEED
  );
};

function moveEntity(entity, dir, duration) {
  let blocked = isBlocked(entity, dir);

  // allow changing the walk direction
  // when we finished a walk task and stand on a tile
  if (!isMoving(entity) && entity.facing !== dir) {
    entity.facing = dir;
    entity.foot = !entity.foot | 0;
    // allow changing face direction without moving
    if (duration <= FACE_TIME) {
      entity.waitMove = FACE_TIME;
    }
  }

  // we're still in facing only state, dont walk
  if (entity.waitMove > 0 && entity.lastMove > FACE_TIME) return;

  // enter warp
  if (entity === player) {
    // get exit tile
    // if blocked then faced tile
    // otherwise the tile stood on
    let facedTile = getFacedTilePosition(entity.facing, entity.x, entity.y);
    let exit = getExitTileAt(facedTile.x, facedTile.y);
    if (exit !== null) {
      let id = exit.bank + ":" + exit.map;
      rom.maps = {};
      rom.fetchMap(exit.bank, exit.map);
      currentMap = id;
      // set player to given warp position
      let warp = rom.maps[currentMap].events.exits[exit.warp];
      entity.x = entity.tx = warp.x;
      entity.y = entity.ty = warp.y;
      entity.vx = entity.vy = 0;
      return;
    }
  }

  // dont setup a new walk task if we're already moving
  if (isMoving(entity)) return;

  // run key
  player.isRunning = !!keys["x"];

  let speed = getSpeed(entity);
  // initialise a walk task
  if (dir === DIR.DOWN && !blocked) {
    entity.ty = entity.y + 1;
    entity.vy = (entity.ty - entity.y) * speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.UP && !blocked) {
    entity.ty = entity.y - 1;
    entity.vy = (entity.ty - entity.y) * speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.LEFT && !blocked) {
    entity.tx = entity.x - 1;
    entity.vx = (entity.tx - entity.x) * speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.RIGHT && !blocked) {
    entity.tx = entity.x + 1;
    entity.vx = (entity.tx - entity.x) * speed;
    entity.waitMove = 0;
  }
};

let keys = {};
window.addEventListener("keydown", (e) => {
  if (!keys[e.key]) keys[e.key] = 1;
  updateKeys();
});
window.addEventListener("keyup", (e) => {
  keys[e.key] = 0;
  updateKeys();
});

function updateKeys() {
  // move keys
  let down = keys["s"] || keys["ArrowDown"];
  let up = keys["w"] || keys["ArrowUp"];
  let left = keys["a"] || keys["ArrowLeft"];
  let right = keys["d"] || keys["ArrowRight"];
  if (down) moveEntity(player, DIR.DOWN, down);
  else if (up) moveEntity(player, DIR.UP, up);
  else if (left) moveEntity(player, DIR.LEFT, left);
  else if (right) moveEntity(player, DIR.RIGHT, right);
  for (let key in keys) {
    if (keys[key] > 0) keys[key] += 1;
  };
};

setInterval(updateKeys, 1e3 / 60);

let down = false;
window.addEventListener("mouseup", (e) => down = false);
window.addEventListener("mousedown", (e) => {
  down = true;
  lx = e.clientX; ly = e.clientY;
});

let lx = 0; let ly = 0;
window.addEventListener("mousemove", (e) => {
  let x = e.clientX;
  let y = e.clientY;
  if (!down) {
    lx = x; ly = y;
    return;
  }
  cx -= lx - x; cy -= ly - y;
  lx = x; ly = y;
});

function roundTo(a, b) {
  b = 1 / (b);
  return (Math.round(a * b) / b);
};

window.cx = 0; window.cy = 0;
window.addEventListener("mousewheel", (e) => {
  let dir = e.deltaY > 0 ? -1 : 1;
  cz = cz + (dir * 0.25) * (zoomScale(cz) * 0.3);
  if (cz <= 0.1) cz = 0.1;
  cz = roundTo(cz, 0.125);
  updateCamera();
});

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  let resolution = window.devicePixelRatio;
  canvas.width = width * resolution;
  canvas.height = height * resolution;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  resetTransformation();
  setImageSmoothing(ctx, false);
};

function resetTransformation() {
  let resolution = window.devicePixelRatio;
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
};

window.addEventListener("resize", resize);

window.addEventListener("contextmenu", (e) => {
  if (e.target === canvas) e.preventDefault();
});
