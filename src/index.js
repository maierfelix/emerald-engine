import { OFFSETS as OFS } from "./offsets";

import Rom from "./rom";

import {
  readBinaryFile,
  setImageSmoothing
} from "./utils";

console.clear();

let ctx = canvas.getContext("2d");

let width = 0;
let height = 0;

let DIR = {
  DOWN: 0,
  UP: 1,
  LEFT: 2,
  RIGHT: 3
};

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

readBinaryFile("rom.gba").then((buffer) => {
  /*if (
    (host[0].charCodeAt(0) !== 109) ||
    (host[1].charCodeAt(0) !== 97) ||
    (host[2].charCodeAt(0) !== 105) ||
    (host[3].charCodeAt(0) !== 101) ||
    (host[4].charCodeAt(0) !== 114)
  ) return;*/
  resize();
  new Rom(buffer, { debug }).then((instance) => {
    rom = instance;
    init();
  });
});

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

function init() {
  $(".ui").style.opacity = 1.0;
  resize();
  (function draw() {
    requestAnimationFrame(draw);
    updateEntity(player);
    updateCamera();
    ctx.clearRect(0, 0, width, height);
    drawBackgroundMap();
    drawEntity(player);
    drawEntities();
    drawForegroundMap();
  })();
  console.log(rom.maps);
};

function drawBackgroundMap() {
  for (let key in rom.maps) drawMap(key, 0);
};

function drawForegroundMap() {
  for (let key in rom.maps) drawMap(key, 1);
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
  // water reflection
  if (
    (entity === player) &&
    (map.behavior[index] === 0x10 ||
    map.behavior[index] === 0x16 ||
    map.behavior[index] === 0x20 ||
    map.behavior[index] === 0x1a ||
    map.behavior[index] === 0x2b)
  ) {
    let sprite = rom.graphics.overworlds[0][entity.frame].canvas;
    let sw = sprite.width;
    let sh = sprite.height;
    ctx.globalAlpha = 0.425;
    let resolution = window.devicePixelRatio;
    ctx.drawImage(
      sprite,
      0, 0,
      sw, sh,
      dx, cy + ((entity.y) * 16) * cz,
      sw * cz, sh * cz
    );
    ctx.globalAlpha = 1.0;
  }
  drawSprite(0, entity.frame, dx, dy);
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

function drawMap(id, layer) {
  let map = rom.maps[id];
  let img = map.texture[layer].canvas;
  let xx = cx + (((map.x | 0) * 16) * cz) | 0;
  let yy = cy + (((map.y | 0) * 16) * cz) | 0;
  let ww = (img.width * cz) | 0;
  let hh = (img.height * cz) | 0;
  if (!inView(map)) return;
  if (map.name === "UNDERWATER") return;
  drawBorder(map);
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

function hasConnection(map, dir) {
  for (let ii = 0; ii < map.connections.length; ++ii) {
    let con = map.connections[ii];
    switch (con.lType) {
      case OFS.MAP_CONNECTION.LEFT:
        if (dir === DIR.LEFT) return true;
      break;
      case OFS.MAP_CONNECTION.UP:
        if (dir === DIR.UP) return true;
      break;
      case OFS.MAP_CONNECTION.RIGHT:
        if (dir === DIR.RIGHT) return true;
      break;
      case OFS.MAP_CONNECTION.DOWN:
        if (dir === DIR.DOWN) return true;
      break;
    };
  };
  return false;
};

function drawBorder(map) {
  let border = map.border;
  let texture = border.canvas;
  let tw = texture.width;
  let th = texture.height;
  let padding = 4;
  let mw = (map.width / 2) | 0;
  let mh = (map.height / 2) | 0;
  // horizontal border
  for (let xx = 0; xx < 4; ++xx) {
    for (let yy = 0; yy < mh; ++yy) {
      if (!hasConnection(map, DIR.LEFT)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + (((map.x - 2 - (xx * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y + (yy * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
      if (!hasConnection(map, DIR.RIGHT)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + ((((map.x + map.width) + (xx * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y + (yy * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
    };
  };
  // vertical border
  for (let yy = 0; yy < 4; ++yy) {
    for (let xx = 0; xx < (mw); ++xx) {
      if (!hasConnection(map, DIR.UP)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + (((map.x + (xx * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y - 2 - (yy * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
      if (!hasConnection(map, DIR.DOWN)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + (((map.x + (xx * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y + map.height + (yy * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
    };
  };
};

window.player = {
  foot: 0,
  frame: 0,
  frameIndex: 0,
  waitMove: 0,
  facing: DIR.DOWN,
  speed: 0.06,
  tx: 8, ty: 8,
  dx: 0, dy: 0,
  vx: 0, vy: 0,
  x: 8, y: 8,
  lock: false
};

window.FREE_CAMERA = false;

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
  // is moving
  let isMovingX = entity.vx !== 0;
  let isMovingY = entity.vy !== 0;
  let isMoving = isMovingX || isMovingY;
  let justMovedOneFrame = isMoving && (
    (Math.abs(entity.tx - entity.x) < 0.2 && Math.abs(entity.tx - entity.x) > 0.0) ||
    (Math.abs(entity.ty - entity.y) < 0.2 && Math.abs(entity.ty - entity.y) > 0.0)
  );
  let didntMoveYet = isMoving && (
    (Math.abs(entity.tx - entity.x) >= 1.0) ||
    (Math.abs(entity.ty - entity.y) >= 1.0)
  );
  // reached half of destination
  let reachedHalfX = Math.abs(entity.tx - entity.x) <= 0.5;
  let reachedHalfY = Math.abs(entity.ty - entity.y) <= 0.5;
  // reached destination
  let reachedDestX = (
    (entity.tx > entity.x && entity.x + entity.speed >= entity.tx) ||
    (entity.tx < entity.x && entity.x - entity.speed <= entity.tx)
  );
  let reachedDestY = (
    (entity.ty > entity.y && entity.y + entity.speed >= entity.ty) ||
    (entity.ty < entity.y && entity.y - entity.speed <= entity.ty)
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
  // stand step
  if (entity.waitMove <= FACE_TIME && entity.waitMove >= FACE_TIME - 2) {
    index = 1;
    foot = !entity.foot | 0;
  }
  entity.frame = (((index) * (5 - (foot))) + (((index) + 1) * facing));
  entity.waitMove--;
};

function isBlocked(x, y) {
  let map = rom.maps[currentMap];
  let index = (y * map.width + x) | 0;
  let attr = map.attributes[index];
  let behavior = map.behavior[index];
  return (
    (x < 0 || x >= map.width) ||
    (y < 0 || y >= map.height) ||
    (attr === 1 || attr === 0xd) &&
    (behavior !== 0x3b)

  );
};

function isMoving(entity) {
  return (
    !entity.lock &&
    (entity.x !== entity.tx ||
    entity.y !== entity.ty)
  );
};

let FACE_TIME = 8;

function moveEntity(entity, dir, duration) {
  if (!isMoving(entity) && entity.facing !== dir) {
    entity.facing = dir;
    entity.foot = !entity.foot | 0;
    if (duration <= FACE_TIME) {
      entity.waitMove = FACE_TIME;
    }
  }
  if (entity.waitMove > 0 || isMoving(entity)) return;
  if (dir === DIR.DOWN && !isBlocked(entity.x, entity.y + 1)) {
    entity.ty = entity.y + 1;
    entity.vy += (entity.ty - entity.y) * entity.speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.UP && !isBlocked(entity.x, entity.y - 1)) {
    entity.ty = entity.y - 1;
    entity.vy += (entity.ty - entity.y) * entity.speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.LEFT && !isBlocked(entity.x - 1, entity.y)) {
    entity.tx = entity.x - 1;
    entity.vx += (entity.tx - entity.x) * entity.speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.RIGHT && !isBlocked(entity.x + 1, entity.y)) {
    entity.tx = entity.x + 1;
    entity.vx += (entity.tx - entity.x) * entity.speed;
    entity.waitMove = 0;
  }
};

let keys = {};
window.addEventListener("keydown", (e) => {
  if (!keys[e.key]) keys[e.key] = 1;
  keys[e.key] = 1;
  updateKeys();
});
window.addEventListener("keyup", (e) => {
  if (!keys[e.key]) keys[e.key] = 1;
  keys[e.key] = 0;
  updateKeys();
});

function updateKeys() {
  let down = keys["s"] || keys["ArrowDown"];
  let up = keys["w"] || keys["ArrowUp"];
  let left = keys["a"] || keys["ArrowLeft"];
  let right = keys["d"] || keys["ArrowRight"];
  if (down) moveEntity(player, DIR.DOWN, down);
  if (up) moveEntity(player, DIR.UP, up);
  if (left) moveEntity(player, DIR.LEFT, left);
  if (right) moveEntity(player, DIR.RIGHT, right);
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

window.cz = 6.5;
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
