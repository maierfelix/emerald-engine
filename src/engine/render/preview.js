import * as CFG from "../../cfg";

import {
  rectIntersect,
  getRelativeTile
} from "../../utils";

export function drawMousePreview() {
  let mode = this.mode;
  switch (mode) {
    case CFG.ENGINE_MODE_TS:
      this.drawTilesetSelectionPreview();
    break;
    case CFG.ENGINE_MODE_OBJ:
      this.drawObjectPreview();
    break;
  };
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
  ctx.fillStyle = `rgba(0,0,0,0.125)`;
  ctx.fillRect(
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
  let rel = getRelativeTile(this.mx - this.cx, this.my - this.cy, this.cz);
  let xx = this.cx + (rel.x * this.cz);
  let yy = this.cy + (rel.y * this.cz);
  let ww = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let hh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  ctx.fillStyle = `rgba(255,255,255,0.15)`;
  ctx.fillRect(
    xx, yy,
    ww, hh
  );
  this.drawMapPreviewIntersections(map);
  this.drawMapSizeBorder(map);
};

export function drawMapPreviewIntersections(map) {
  let ctx = this.ctx;
  let maps = this.maps;
  let length = maps.length;
  for (let ii = 0; ii < length; ++ii) {
    let cmap = maps[ii];
    let intersect = rectIntersect(
      map.x, map.y, map.width, map.height,
      cmap.x, cmap.y, cmap.width, cmap.height
    );
    if (intersect !== null) {
      ctx.fillStyle = `rgba(255,0,0,0.375)`;
      ctx.fillRect(
        this.cx + (((intersect.x) * CFG.BLOCK_SIZE) * this.cz),
        this.cy + (((intersect.y) * CFG.BLOCK_SIZE) * this.cz),
        (intersect.w * CFG.BLOCK_SIZE) * this.cz,
        (intersect.h * CFG.BLOCK_SIZE) * this.cz
      );
    }
  };
};
