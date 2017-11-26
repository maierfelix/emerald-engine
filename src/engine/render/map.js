import * as CFG from "../../cfg";

import {
  drawGrid,
  getRelativeTile
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
  this.drawMousePreview();
  this.drawMapSizeBorder();
  //this.drawMapResizeButton();
};

export function drawMapSizeBorder() {
  let ctx = this.ctx;
  let map = this.currentMap;
  let scale = this.cz;
  let xx = this.cx;
  let yy = this.cy;
  let ww = (map.width * CFG.BLOCK_SIZE) * scale;
  let hh = (map.height * CFG.BLOCK_SIZE) * scale;
  let lw = 1.0 * this.cz;
  ctx.lineWidth = lw;
  ctx.strokeStyle = `rgba(255,0,0,0.45)`;
  ctx.strokeRect(
    xx - lw, yy - lw,
    ww + (lw * 2), hh + (lw * 2)
  );
};

export function drawMapResizeButton() {
  let ctx = this.ctx;
  let map = this.currentMap;
  let scale = this.cz;
  let xx = this.cx + (map.width * CFG.BLOCK_SIZE) * scale;
  let yy = this.cy + (map.height * CFG.BLOCK_SIZE) * scale;
  let ww = (CFG.BLOCK_SIZE / 2) * scale;
  let hh = (CFG.BLOCK_SIZE / 2) * scale;
  ctx.fillStyle = `rgba(106,106,106,0.25)`;
  ctx.fillRect(
    xx, yy,
    ww, hh
  );
  ctx.font = `${10 * scale}px Open sans`;
  ctx.fillStyle = `rgba(128,128,128,0.65)`;
  ctx.fillText(`🡖`, xx, this.cy + ((map.height * CFG.BLOCK_SIZE) + CFG.BLOCK_SIZE / 2) * scale);
  ctx.fillText(`🡔`, xx, this.cy + ((map.height * CFG.BLOCK_SIZE) + CFG.BLOCK_SIZE / 2) * scale);
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
