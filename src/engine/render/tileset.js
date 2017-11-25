import * as CFG from "../../cfg";

import {
  $,
  drawGrid
} from "../../utils";

export function drawTileset(tileset) {
  if (tileset === null) return;
  let ctx = this.tsCtx;
  let scale = CFG.ENGINE_TILESET_SCALE;
  let width = CFG.TILESET_DEFAULT_WIDTH;
  let height = CFG.TILESET_DEFAULT_HEIGHT;
  ctx.drawImage(
    tileset,
    0, 0,
    width, height,
    0, 0,
    width * scale, height * scale
  );
  drawGrid(ctx, CFG.ENGINE_TILESET_SCALE, 0, 0, width, height);
  let selection = this.selection.tileset;
  let ww = ((selection.w - selection.x) + CFG.BLOCK_SIZE) * scale;
  let hh = ((selection.h - selection.y) + CFG.BLOCK_SIZE) * scale;
  ctx.fillStyle = `rgba(255,0,0,0.35)`;
  ctx.fillRect(
    selection.x * scale, selection.y * scale,
    ww, hh
  );
  ctx.lineWidth = 2.0;
  ctx.strokeStyle = `rgba(255,0,0,1)`;
  ctx.strokeRect(
    (selection.x * scale) | 0, (selection.y * scale) | 0,
    ww | 0, hh | 0
  );
};

export function drawTilesetSelectionPreview() {
  
};
