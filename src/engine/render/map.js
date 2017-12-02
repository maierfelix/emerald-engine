import * as CFG from "../../cfg";

import {
  drawGrid,
  getRelativeTile
} from "../../utils";

export function drawMaps() {
  let maps = this.maps;
  let length = maps.length;
  for (let ii = 0; ii < length; ++ii) {
    let map = maps[ii];
    this.drawMap(map);
  };
};

export function drawMap(map) {
  if (map === null) return;
  let ctx = this.ctx;
  let isCurrentMap = this.currentMap === map;
  let sx = 0;
  let sy = 0;
  let sw = map.width * CFG.BLOCK_SIZE;
  let sh = map.height * CFG.BLOCK_SIZE;
  let dx = this.cx + (map.x * CFG.BLOCK_SIZE) * this.cz;
  let dy = this.cy + (map.y * CFG.BLOCK_SIZE) * this.cz;
  let dw = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let dh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  if (!isCurrentMap) ctx.globalAlpha = 0.5;
  this.drawMapTexture(0, map.texture, sx, sy, sw, sh, dx, dy, dw, dh);
  this.drawMapTexture(1, map.texture, sx, sy, sw, sh, dx, dy, dw, dh);
  this.drawMapTexture(2, map.texture, sx, sy, sw, sh, dx, dy, dw, dh);
  this.drawMapObjects(map);
  if (!isCurrentMap) ctx.globalAlpha = 1.0;
  if (isCurrentMap) this.drawMousePreview();
  this.drawMapSizeBorder(map);
};

export function drawMapTileBased(map) {
  let ctx = this.ctx;
  let bundles = map.data;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let ts = bundle[tsId];
      let tileset = this.bundles[bundleId].tilesets[tsId].canvas;
      for (let ll in ts) {
        let data = ts[ll];
        // alpha stuff
        {
          let tsMode = this.tsMode - 1;
          if ((ll - 1 | 0) !== tsMode && tsMode !== 3) ctx.globalAlpha = 0.4;
        }
        let size = map.width * map.height;
        for (let ii = 0; ii < size; ++ii) {
          let xx = (ii % map.width) | 0;
          let yy = (ii / map.width) | 0;
          let tile = (data[ii] - 1) | 0;
          if ((tile + 1) === 0) continue;
          let sx = (tile % 8) | 0;
          let sy = (tile / 8) | 0;
          ctx.drawImage(
            tileset,
            sx * CFG.BLOCK_SIZE, sy * CFG.BLOCK_SIZE,
            CFG.BLOCK_SIZE, CFG.BLOCK_SIZE,
            this.cx + (xx * CFG.BLOCK_SIZE) * this.cz, this.cy + (yy * CFG.BLOCK_SIZE) * this.cz,
            CFG.BLOCK_SIZE * this.cz, CFG.BLOCK_SIZE * this.cz
          );
        };
        // alpha stuff
        { ctx.globalAlpha = 1.0; }
      };
    };
  };
};

export function drawMapTexture(index, textures, sx, sy, sw, sh, dx, dy, dw, dh) {
  let ctx = this.ctx;
  let tsMode = this.tsMode - 1;
  if (index !== tsMode && tsMode !== 3) ctx.globalAlpha = 0.4;
  ctx.drawImage(
    textures[index].canvas,
    sx, sy,
    sw, sh,
    dx, dy,
    dw, dh
  );
  ctx.globalAlpha = 1.0;
};

export function drawMapSizeBorder(map) {
  let ctx = this.ctx;
  let scale = this.cz;
  let xx = this.cx + (map.x * CFG.BLOCK_SIZE) * this.cz;
  let yy = this.cy + (map.y * CFG.BLOCK_SIZE) * this.cz;
  let ww = (map.width * CFG.BLOCK_SIZE) * scale;
  let hh = (map.height * CFG.BLOCK_SIZE) * scale;
  let lw = 0.55 * this.cz;
  ctx.lineWidth = lw;
  ctx.strokeStyle = `rgba(255,0,0,0.75)`;
  ctx.strokeRect(
    xx, yy,
    ww, hh
  );
};
