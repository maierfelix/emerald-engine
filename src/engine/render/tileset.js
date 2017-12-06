import * as CFG from "../../cfg";

import {
  $,
  drawGrid
} from "../../utils";

export function clearTileset() {
  this.tsCtx.clearRect(
    0, 0,
    (CFG.TILESET_DEFAULT_WIDTH + 1) * CFG.ENGINE_TILESET_SCALE,
    CFG.TILESET_DEFAULT_HEIGHT * CFG.ENGINE_TILESET_SCALE
  );
};

export function drawTileset(tileset) {
  if (tileset === null) return;
  if (!this.redraw.tileset) return;
  this.clearTileset();
  let ctx = this.tsCtx;
  let canvas = tileset.canvas;
  let scale = CFG.ENGINE_TILESET_SCALE;
  let width = ctx.canvas.width;
  let height = ctx.canvas.height;
  ctx.drawImage(
    canvas,
    0, 0,
    width, height,
    0, 0,
    width * scale, height * scale
  );
  drawGrid(ctx, CFG.ENGINE_TILESET_SCALE, 0, 0, width, height);
  let selection = this.selection.tileset;
  let ww = ((selection.w - selection.x) + CFG.BLOCK_SIZE) * scale;
  let hh = ((selection.h - selection.y) + CFG.BLOCK_SIZE) * scale;
  let color = CFG.ENGINE_TILESET_SELECT_COLOR;
  // special color when in autotile mode
  if (this.isUIInAutotileMode()) {
    // only change color if selection fits the autotile format
    if (this.isSelectionInAutotileFormat(this.selection.tileset)) {
      color = CFG.ENGINE_TILESET_AUTOTILE_COLOR;
    }
  }
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.35;
  ctx.fillRect(
    selection.x * scale, selection.y * scale,
    ww, hh
  );
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 1.0;
  ctx.strokeRect(
    (selection.x * scale) | 0, (selection.y * scale) | 0,
    ww | 0, hh | 0
  );
  ctx.globalAlpha = 1.0;
  // reset tileset redraw switch
  this.redraw.tileset = false;
};
