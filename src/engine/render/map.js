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
    if (map.isInView()) this.drawMap(map);
  };
  if (!this.isUIInMapCreationMode()) this.drawMousePreview();
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
  //this.drawMapTileBased(map);
  this.drawMapLayerTexture(0, map, sx, sy, sw, sh, dx, dy, dw, dh);
  this.drawMapLayerTexture(1, map, sx, sy, sw, sh, dx, dy, dw, dh);
  this.drawMapLayerTexture(2, map, sx, sy, sw, sh, dx, dy, dw, dh);
  this.drawMapObjects(map);
  this.drawMapSizeBorder(map);
};

export function drawMapLayerTexture(index, map, sx, sy, sw, sh, dx, dy, dw, dh) {
  let ctx = this.ctx;
  let layer = this.currentLayer - 1;
  let texture = map.textures[index];
  let isCurrentMap = (this.currentMap === map) || (this.currentMap === null);
  if (index !== layer && layer !== 3) ctx.globalAlpha = 0.4;
  if (!isCurrentMap) ctx.globalAlpha = 0.5;
  if (this.mode !== CFG.ENGINE_MODE_TS) ctx.globalAlpha = 1.0;
  ctx.drawImage(
    texture.canvas,
    sx, sy,
    sw, sh,
    dx, dy,
    dw, dh
  );
  if (this.currentMap === map && this.isActiveTilesetFillMode()) {
    ctx.globalAlpha = 0.125;
    ctx.drawImage(
      map.textures.preview.canvas,
      0, 0,
      map.width * CFG.BLOCK_SIZE, map.height * CFG.BLOCK_SIZE,
      this.cx + (map.x * CFG.BLOCK_SIZE) * this.cz,
      this.cy + (map.y * CFG.BLOCK_SIZE) * this.cz,
      (map.width * CFG.BLOCK_SIZE) * this.cz, (map.height * CFG.BLOCK_SIZE) * this.cz
    );
  }
  ctx.globalAlpha = 1.0;
};

export function drawMapTileBased(map) {
  let ctx = this.ctx;
  let bundles = map.data;
  let mx = map.x | 0;
  let my = map.y | 0;
  let tw = CFG.TILESET_HORIZONTAL_SIZE;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let ts = bundle[tsId];
      let tileset = this.bundles[bundleId].tilesets[tsId].canvas;
      for (let ll in ts) {
        let data = ts[ll];
        // alpha stuff
        {
          let layer = this.currentLayer - 1;
          if ((ll - 1 | 0) !== layer && layer !== 3) ctx.globalAlpha = 0.4;
        }
        let size = (map.width * map.height) | 0;
        for (let ii = 0; ii < size; ++ii) {
          let xx = mx + ((ii % map.width) | 0);
          let yy = my + ((ii / map.width) | 0);
          let tile = (data[ii] - 1) | 0;
          if ((tile + 1) === 0) continue;
          let sx = (tile % tw) | 0;
          let sy = (tile / tw) | 0;
          ctx.drawImage(
            tileset,
            (sx * CFG.BLOCK_SIZE) | 0, (sy * CFG.BLOCK_SIZE) | 0,
            (CFG.BLOCK_SIZE) | 0, (CFG.BLOCK_SIZE) | 0,
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
