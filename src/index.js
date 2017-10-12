import { OFFSETS as OFS } from "./offsets";

import Rom from "./rom";

import {
  readBinaryFile,
  disableImageSmoothing
} from "./utils";

console.clear();

let ctx = canvas.getContext("2d");

let width = 0;
let height = 0;

let rom = null;
readBinaryFile("rom.gba").then((buffer) => {
  console.log("ROM successfully loaded");
  rom = new Rom(buffer);
  init();
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

window.player = {
  x: 9, y: 10, frame: 0
};
function init() {
  resize();
  loadMap("0:9");
  (function draw() {
    requestAnimationFrame(draw);
    ctx.clearRect(0, 0, width, height);
    for (let key in rom.maps) {
      drawMap(key);
    };
    cx = (width / 2) - ((player.x * 16)) * cz;
    cy = (height / 2) - ((player.y * 16)) * cz;
    ctx.fillStyle = "red";
    drawSprite(
      0,
      player.frame,
      cx + (((player.x * 16)) | 0) * cz,
      cy + (((player.y * 16)) | 0) * cz
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

function drawMap(id) {
  let map = rom.maps[id];
  let img = map.texture.canvas;
  let xx = cx + (((map.x | 0) * 16) * cz) | 0;
  let yy = cy + (((map.y | 0) * 16) * cz) | 0;
  if (map.name === "UNDERWATER") return;
  ctx.drawImage(
    img,
    0, 0,
    img.width, img.height,
    xx, yy,
    (img.width * cz) | 0, (img.height * cz) | 0
  );
  ctx.font = "12px Arial";
  ctx.fillStyle = "#fff";
  ctx.fillText(map.name + " [" + map.bank + ":" + map.id + "]", xx + 16, yy + 16);
};

let deep = 0;
let x = 0; let y = 0;
function loadMap(id) {
  let map = rom.maps[id];
  map.loaded = true;
  //console.log("Generating", map.name, id);
  if (map.connections.length) {
    // connected map position
    map.connections.map(con => {
      let conId = con.bBank + ":" + con.bMap;
      let conMap = rom.maps[conId];
      if (conMap.loaded) return;
      switch (con.lType) {
        case OFS.MAP_CONNECTION.LEFT:
          conMap.x = map.x - conMap.width;
          conMap.y = map.y + con.lOffset;
        break;
        case OFS.MAP_CONNECTION.UP:
          conMap.x = map.x + con.lOffset;
          conMap.y = map.y - conMap.height;
        break;
        case OFS.MAP_CONNECTION.RIGHT:
          conMap.x = map.x + map.width;
          conMap.y = map.y + con.lOffset;
        break;
        case OFS.MAP_CONNECTION.DOWN:
          conMap.x = map.x + con.lOffset;
          conMap.y = map.y + map.height;
        break;
      };
    });
    // load map connections
    map.connections.map(con => {
      let conId = con.bBank + ":" + con.bMap;
      let conMap = rom.maps[conId];
      if (conMap.loaded) return;
      //console.log(`Connection: [${id}] => [${conId}] | "${map.name}" => "${conMap.name}"`);
      loadMap(conId);
    });
  }
};

window.addEventListener("keydown", (e) => {
  let v = 1;
  if (e.key === "a") { player.x -= v; player.frame = 2; }
  else if (e.key === "w") { player.y -= v; player.frame = 1; }
  else if (e.key === "d") { player.x += v; player.frame = 2; }
  else if (e.key === "s") { player.y += v; player.frame = 0; }
});

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

window.cz = 4.25;
window.cx = 0; window.cy = 0;
window.addEventListener("mousewheel", (e) => {
  let dir = e.deltaY > 0 ? -1 : 1;
});

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  disableImageSmoothing(ctx);
};

window.addEventListener("resize", resize);

window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
});
