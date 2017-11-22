import * as CFG from "../../cfg";

export function drawMapBorder(map) {
  if (map === null) return;
  let ctx = this.ctx;
  let dx = this.cx;
  let dy = this.cy;
  let dw = (map.width * CFG.BLOCK_SIZE) * this.cz;
  let dh = (map.height * CFG.BLOCK_SIZE) * this.cz;
  let tex = map.border.canvas;
  ctx.drawImage(
    tex,
    0, 0,
    map.width * CFG.BLOCK_SIZE, map.height * CFG.BLOCK_SIZE,
    dx, dy,
    dw, dh
  );
};
