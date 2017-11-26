import * as CFG from "../../cfg";

import {
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
