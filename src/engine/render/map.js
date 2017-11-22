import * as CFG from "../../cfg";

import {
  drawGrid
} from "../../utils";

export function drawMap(map) {
  if (map === null) return;
  let ctx = this.ctx;
  let dx = this.cx;
  let dy = this.cy;
  let dw = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let dh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  let bg = map.texture[0].canvas;
  let bgb = map.texture[1].canvas;
  let fg = map.texture[2].canvas;
  ctx.drawImage(
    bg,
    0, 0,
    map.width * CFG.BLOCK_SIZE, map.height * CFG.BLOCK_SIZE,
    dx, dy,
    dw, dh
  );
  this.drawMapAnimations(map, 0);
  ctx.drawImage(
    fg,
    0, 0,
    map.width * CFG.BLOCK_SIZE, map.height * CFG.BLOCK_SIZE,
    dx, dy,
    dw, dh
  );
  ctx.drawImage(
    bgb,
    0, 0,
    map.width * CFG.BLOCK_SIZE, map.height * CFG.BLOCK_SIZE,
    dx, dy,
    dw, dh
  );
  this.drawMapAnimations(map, 1);
  this.drawMapEvents(map);
  drawGrid(this.ctx, this.cz, this.cx, this.cy, this.width, this.height);
};

export function drawMapAnimations(map, ts) {
  let ctx = this.ctx;
  let dx = this.cx;
  let dy = this.cy;
  let frames = (this.frames / (1e3 / 60)) | 0;
  let dw = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let dh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  let anims = map.animations[ts];
  for (let frm in anims) {
    let frame = anims[frm][frames % (frm | 0)].canvas;
    ctx.drawImage(
      frame,
      0, 0,
      map.width * CFG.BLOCK_SIZE, map.height * CFG.BLOCK_SIZE,
      dx, dy,
      dw, dh
    );
  };
};
