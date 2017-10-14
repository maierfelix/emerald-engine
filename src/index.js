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
  ctx.font = `${size}px Arial`;
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

window.rom = null;
readBinaryFile("rom.gba").then((buffer) => {
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
    ctx.clearRect(0, 0, width, height);
    for (let key in rom.maps) {
      drawMap(key);
    };
    updateCamera();
    ctx.fillStyle = "red";
    drawSprite(
      0,
      player.frame,
      cx + (player.x * 16) * cz,
      cy + (player.y * 16) * cz
    );
  })();
  console.log(rom.maps);
};

function drawSprite(id, frame, x, y) {
  let sprite = rom.graphics.overworlds[id][frame].canvas;
  ctx.drawImage(
    sprite,
    0, 0,
    sprite.width, sprite.height,
    x, y,
    sprite.width * cz, sprite.height * cz
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

function drawMap(id) {
  let map = rom.maps[id];
  let img = map.texture.canvas;
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
  ctx.font = "12px Arial";
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
  tx: 10, ty: 5,
  dx: 0, dy: 0,
  vx: 0, vy: 0,
  x: 10, y: 5
};

function updateCamera() {
  cx = (width / 2) - (((player.x * 16) + 8)) * cz;
  cy = (height / 2) - (((player.y * 16) + 16)) * cz;
};

function updateEntity(entity) {
  // IEEE 754 hack
  if (entity.x !== entity.tx) entity.x = Math.round(entity.x * 1e3) / 1e3;
  if (entity.y !== entity.ty) entity.y = Math.round(entity.y * 1e3) / 1e3;
  // is moving
  let isMovingX = entity.vx !== 0;
  let isMovingY = entity.vy !== 0;
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
  // move be velocity
  if (isMovingX) entity.x += entity.vx;
  else if (isMovingY) entity.y += entity.vy;
  updateFrame(player);
};

function updateFrame(entity) {
  let facing = entity.facing;
  let foot = entity.foot;
  let index = entity.frameIndex;
  player.frame = ((index * (5 - foot)) + ((index + 1) * facing));
};

function isBlocked(x, y) {
  return false;
};

function isMoving(entity) {
  return (
    player.x !== player.tx ||
    player.y !== player.ty
  );
};

let FACE_TIME = 5;

function movePlayer(dir, duration) {
  if (!isMoving(player) && player.facing !== dir) {
    player.waitMove = FACE_TIME;
  } else {
    if (player.waitMove > 0) {
      player.waitMove--;
      return;
    }
  }
  if (dir === DIR.LEFT) {
    if (!isMoving(player) && player.facing !== DIR.LEFT && duration <= FACE_TIME) {
      player.facing = DIR.LEFT;
      return;
    }
    if (!isMoving(player)) player.facing = DIR.LEFT;
    if (!isBlocked(player.x - 1, player.y) && !isMoving(player)) {
      player.tx = player.x - 1;
      player.vx += (player.tx - player.x) * player.speed;
    }
  }
  if (dir === DIR.UP) {
    if (!isMoving(player) && player.facing !== DIR.UP && duration <= FACE_TIME) {
      player.facing = DIR.UP;
      return;
    }
    if (!isMoving(player)) player.facing = DIR.UP;
    if (!isBlocked(player.x, player.y - 1) && !isMoving(player)) {
      player.ty = player.y - 1;
      player.vy += (player.ty - player.y) * player.speed;
    }
  }
  if (dir === DIR.RIGHT) {
    if (!isMoving(player) && player.facing !== DIR.RIGHT && duration <= FACE_TIME) {
      player.facing = DIR.RIGHT;
      return;
    }
    if (!isMoving(player)) player.facing = DIR.RIGHT;
    if (!isBlocked(player.x + 1, player.y) && !isMoving(player)) {
      player.tx = player.x + 1;
      player.vx += (player.tx - player.x) * player.speed;
    }
  }
  if (dir === DIR.DOWN) {
    if (!isMoving(player) && player.facing !== DIR.DOWN && duration <= FACE_TIME) {
      player.facing = DIR.DOWN;
      return;
    }
    if (!isMoving(player)) player.facing = DIR.DOWN;
    if (!isBlocked(player.x, player.y + 1) && !isMoving(player)) {
      player.ty = player.y + 1;
      player.vy += (player.ty - player.y) * player.speed;
    }
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
  let left = keys["a"] || keys["ArrowLeft"];
  let up = keys["w"] || keys["ArrowUp"];
  let right = keys["d"] || keys["ArrowRight"];
  let down = keys["s"] || keys["ArrowDown"];
  if (left) movePlayer(DIR.LEFT, left);
  if (up) movePlayer(DIR.UP, keys["w"]);
  if (right) movePlayer(DIR.RIGHT, keys["d"]);
  if (down) movePlayer(DIR.DOWN, keys["s"]);
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

window.cz = 6.5;
window.cx = 0; window.cy = 0;
window.addEventListener("mousewheel", (e) => {
  let dir = e.deltaY > 0 ? -1 : 1;
  cz = cz + (dir * 0.25) * (zoomScale(cz) * 0.3);
  if (cz <= 0.1) cz = 0.1;
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
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
  setImageSmoothing(ctx, false);
};

window.addEventListener("resize", resize);

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
