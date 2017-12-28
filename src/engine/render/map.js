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
  let isResizing = (this.resizing.map === map);
  let isCurrentMap = (this.currentMap === map);
  let sx = 0;
  let sy = 0;
  let sw = map.width * CFG.BLOCK_SIZE;
  let sh = map.height * CFG.BLOCK_SIZE;
  let dx = this.cx + (map.x * CFG.BLOCK_SIZE) * this.cz;
  let dy = this.cy + (map.y * CFG.BLOCK_SIZE) * this.cz;
  let dw = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let dh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  // draw texture with original dimensions when in resize mode
  if (isResizing) {
    let resize = this.selection.mapResize;
    sw = resize.ow * CFG.BLOCK_SIZE;
    sh = resize.oh * CFG.BLOCK_SIZE;
    dw = (resize.ow * CFG.BLOCK_SIZE) * this.cz;
    dh = (resize.oh * CFG.BLOCK_SIZE) * this.cz;
  }
  if (this.drawingMode === CFG.ENGINE_RENDERER.GL) {
    this.drawMapGL(0, map, sx, sy, sw, sh, dx, dy, dw, dh);
    this.drawMapGL(1, map, sx, sy, sw, sh, dx, dy, dw, dh);
    this.drawMapGL(2, map, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  else if (this.drawingMode === CFG.ENGINE_RENDERER.CANVAS) {
    this.drawMapLayerTexture(0, map, sx, sy, sw, sh, dx, dy, dw, dh);
    this.drawMapLayerTexture(1, map, sx, sy, sw, sh, dx, dy, dw, dh);
    this.drawMapLayerTexture(2, map, sx, sy, sw, sh, dx, dy, dw, dh);
  }
  if (isCurrentMap) {
    if (this.isUIInSelectMode()) this.drawMapSelection(map);
    else if (this.isActiveTilesetFillMode()) this.drawMapFillPreview(map);
  }
  if (this.isUIInObjectMode()) this.drawMapObjects(map);
  this.drawMapSizeBorder(map);
};

export function drawMapGL(layer, map, sx, sy, sw, sh, dx, dy, dw, dh) {
  let texture = map.texturesGL[layer];
  let currentMap = this.currentMap;
  let currentLayer = this.currentLayer - 1;
  let isCurrentMap = (currentMap === map) || (currentMap === null);
  if (layer !== currentLayer && currentLayer !== 3) this.gl.alpha = 0.4;
  if (!isCurrentMap) this.gl.alpha = 0.5;
  this.gl.drawTexture(
    texture,
    dx, dy,
    dw, dh
  );
  this.gl.alpha = 1.0;
};

export function drawMapLayerTexture(layer, map, sx, sy, sw, sh, dx, dy, dw, dh) {
  let ctx = this.ctx;
  let texture = map.textures[layer];
  let currentMap = this.currentMap;
  let currentLayer = this.currentLayer - 1;
  let isCurrentMap = (currentMap === map) || (currentMap === null);
  if (layer !== currentLayer && currentLayer !== 3) ctx.globalAlpha = 0.4;
  if (!isCurrentMap) ctx.globalAlpha = 0.5;
  ctx.drawImage(
    texture.canvas,
    sx, sy,
    sw, sh,
    dx, dy,
    dw, dh
  );
  ctx.globalAlpha = 1.0;
};

export function drawMapFillPreview(map) {
  let ctx = this.ctx;
  ctx.globalAlpha = 0.25;
  ctx.drawImage(
    map.textures.preview.canvas,
    0, 0,
    map.width, map.height,
    this.cx + (map.x * CFG.BLOCK_SIZE) * this.cz,
    this.cy + (map.y * CFG.BLOCK_SIZE) * this.cz,
    (map.width * CFG.BLOCK_SIZE) * this.cz, (map.height * CFG.BLOCK_SIZE) * this.cz
  );
  ctx.globalAlpha = 1.0;
};

export function drawMapSelection(map) {
  let ctx = this.ctx;
  let color = CFG.ENGINE_TILESET_SELECT_COLOR;
  let selection = this.selection.map;
  let xx = this.cx + ((map.x + selection.x) * CFG.BLOCK_SIZE) * this.cz;
  let yy = this.cy + ((map.y + selection.y) * CFG.BLOCK_SIZE) * this.cz;
  let ww = (((selection.w - selection.x) * CFG.BLOCK_SIZE) + CFG.BLOCK_SIZE) * this.cz;
  let hh = (((selection.h - selection.y) * CFG.BLOCK_SIZE) + CFG.BLOCK_SIZE) * this.cz;
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.0;
  ctx.fillRect(
    xx, yy,
    ww, hh
  );
  ctx.globalAlpha = 1.0;
  ctx.strokeRect(
    xx, yy,
    ww, hh
  );
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
  let isResizing = (this.resizing.map === map);
  let isCurrentMap = (this.currentMap === map);
  let xx = this.cx + (map.x * CFG.BLOCK_SIZE) * this.cz;
  let yy = this.cy + (map.y * CFG.BLOCK_SIZE) * this.cz;
  let ww = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let hh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  let lw = 0.55 * this.cz;
  if (isResizing) {
    let bounds = map.getMarginBoundings();
    xx = this.cx + (bounds.x * CFG.BLOCK_SIZE) * this.cz;
    yy = this.cy + (bounds.y * CFG.BLOCK_SIZE) * this.cz;
    ww = (bounds.w * CFG.BLOCK_SIZE) * this.cz;
    hh = (bounds.h * CFG.BLOCK_SIZE) * this.cz;
  }
  ctx.lineWidth = lw;
  if (this.isUIInMapCreationMode() && this.creation.map === map) {
    ctx.strokeStyle = CFG.ENGINE_MAP_BORDER.ACTIVE;
  }
  else {
    if (!this.isUIInMapCreationMode() && isCurrentMap) ctx.strokeStyle = CFG.ENGINE_MAP_BORDER.ACTIVE;
    else ctx.strokeStyle = CFG.ENGINE_MAP_BORDER.INACTIVE;
  }
  ctx.strokeRect(
    xx, yy,
    ww, hh
  );
};
