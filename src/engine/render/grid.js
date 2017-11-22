import * as CFG from "../../cfg";

export function drawGrid() {
  let ctx = this.ctx;
  let scale = this.cz;
  let canvas = ctx.canvas;
  let width = this.width * scale;
  let height = this.height * scale;

  ctx.lineWidth = 0.5;
  ctx.strokeStyle = `rgba(0,0,0,0.4)`;

  let size = CFG.BLOCK_SIZE * scale;
  ctx.beginPath();
  for (let xx = this.cx % size; xx < width; xx += size) {
    ctx.moveTo(xx, 0);
    ctx.lineTo(xx, height);
  };
  for (let yy = this.cy % size; yy < height; yy += size) {
    ctx.moveTo(0, yy);
    ctx.lineTo(width, yy);
  };
  ctx.stroke();
  ctx.closePath();
};
