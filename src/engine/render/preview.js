import * as CFG from "../../cfg";

import {
  rectIntersect,
  getRelativeTile
} from "../../utils";

export function drawMousePreview() {
  if (this.isUIInTilesetMode()) {
    if (this.isUIInSelectMode()) {
      this.drawSelectionPreview();
    } else {
      this.drawTilesetSelectionPreview();
    }
  }
  else if (this.isUIInObjectMode()) this.drawObjectPreview();
};

export function drawSelectionPreview() {
  let ctx = this.ctx;
  let buffer = this.preview.map;
  let sel = this.selection.map;
  let rel = getRelativeTile(this.mx - this.cx, this.my - this.cy, this.cz);
  let x = rel.x - (sel.ax * CFG.BLOCK_SIZE);
  let y = rel.y - (sel.ay * CFG.BLOCK_SIZE);
  if (buffer === null) return;
  let xx = this.cx + (x * this.cz);
  let yy = this.cy + (y * this.cz);
  let ww = buffer.width * this.cz;
  let hh = buffer.height * this.cz;
  ctx.globalAlpha = 0.4;
  ctx.drawImage(
    buffer,
    0, 0,
    buffer.width, buffer.height,
    xx, yy,
    ww, hh
  );
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = CFG.ENGINE_TILESET_SELECT_COLOR;
  ctx.strokeRect(
    xx, yy,
    ww, hh
  );
  ctx.globalAlpha = 1.0;
};

export function drawTilesetSelectionPreview() {
  let ctx = this.ctx;
  let sel = this.selection.tileset;
  let rel = getRelativeTile(this.mx - this.cx, this.my - this.cy, this.cz);
  let xx = this.cx + (rel.x * this.cz);
  let yy = this.cy + (rel.y * this.cz);
  let ww = ((sel.w - sel.x) + CFG.BLOCK_SIZE) * this.cz;
  let hh = ((sel.h - sel.y) + CFG.BLOCK_SIZE) * this.cz;
  let preview = this.preview.tileset;
  ctx.fillStyle = `rgba(0,0,0,0.125)`;
  // we're in autotile mode
  if (this.isUIInAutotileMode()) {
    // don't draw anything if we have an incorrect autotile format
    if (!this.isSelectionInAutotileFormat(this.selection.tileset)) {
      ctx.fillRect(
        xx, yy,
        CFG.BLOCK_SIZE * this.cz, CFG.BLOCK_SIZE * this.cz
      );
      return;
    } else {
      ww = hh = CFG.BLOCK_SIZE * this.cz;
    }
  }
  if (preview !== null) {
    ctx.globalAlpha = 0.4;
    ctx.drawImage(
      preview,
      0, 0,
      preview.width, preview.height,
      xx, yy,
      ww, hh
    );
    ctx.globalAlpha = 1.0;
  }
  if (!this.isUIInAutotileMode()) ctx.fillRect(
    xx, yy,
    ww, hh
  );
};

export function drawObjectPreview() {
  let ctx = this.ctx;
  let rel = getRelativeTile(this.mx - this.cx, this.my - this.cy, this.cz);
  ctx.fillStyle = `rgba(0,0,0,0.125)`;
  ctx.fillRect(
    this.cx + (rel.x * this.cz), this.cy + (rel.y * this.cz),
    CFG.BLOCK_SIZE * this.cz, CFG.BLOCK_SIZE * this.cz
  );
};

export function drawMapPreview(map) {
  let ctx = this.ctx;
  let isResizing = (this.resizing.map === map);
  let xx = this.cx + ((map.x * CFG.BLOCK_SIZE) * this.cz);
  let yy = this.cy + ((map.y * CFG.BLOCK_SIZE) * this.cz);
  let ww = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let hh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  if (isResizing) {
    let bounds = map.getMarginBoundings();
    xx = this.cx + (bounds.x * CFG.BLOCK_SIZE) * this.cz;
    yy = this.cy + (bounds.y * CFG.BLOCK_SIZE) * this.cz;
    ww = (bounds.w * CFG.BLOCK_SIZE) * this.cz;
    hh = (bounds.h * CFG.BLOCK_SIZE) * this.cz;
  }
  if (this.isUIInMapCreationMode() || this.isUIInMapResizeMode()) {
    ctx.fillStyle = `rgba(255,255,255,0.15)`;
    ctx.fillRect(
      xx, yy,
      ww, hh
    );
  }
  this.drawMapPreviewIntersections(map);
  this.drawMapSizeBorder(map);
};

export function drawMapPreviewIntersections(map) {
  let ctx = this.ctx;
  let maps = this.maps;
  let length = maps.length;
  let isResizing = (this.resizing.map === map);

  let mapX = map.x;
  let mapY = map.y;
  let mapW = map.width;
  let mapH = map.height;

  if (isResizing) {
    let bounds = map.getMarginBoundings();
    mapX = bounds.x;
    mapY = bounds.y;
    mapW = bounds.w;
    mapH = bounds.h;
  }

  if (!this.isValidMapSize(mapW, mapH)) {
    this.drawIntersectionArea(
      mapX, mapY,
      mapW, mapH
    );
    return;
  }
  for (let ii = 0; ii < length; ++ii) {
    let cmap = maps[ii];
    // ignore resizing map, we don't want to intersect it itself
    if (this.resizing.map === cmap) continue;
    let intersect = rectIntersect(
      mapX, mapY,
      mapW, mapH,
      cmap.x, cmap.y,
      cmap.width, cmap.height
    );
    if (intersect !== null) {
      this.drawIntersectionArea(intersect.x, intersect.y, intersect.w, intersect.h);
    }
  };
};

export function drawIntersectionArea(x, y, w, h) {
  let ctx = this.ctx;
  ctx.fillStyle = `rgba(255,0,0,0.375)`;
  ctx.fillRect(
    this.cx + ((x * CFG.BLOCK_SIZE) * this.cz),
    this.cy + ((y * CFG.BLOCK_SIZE) * this.cz),
    (w * CFG.BLOCK_SIZE) * this.cz,
    (h * CFG.BLOCK_SIZE) * this.cz
  );
};
