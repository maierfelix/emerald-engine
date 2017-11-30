import * as CFG from "../../cfg";

export function drawMapObjects(map) {
  let ctx = this.ctx;
  let objects = map.objects;
  for (let ii = 0; ii < objects.length; ++ii) {
    let object = objects[ii];
    let scale = CFG.BLOCK_SIZE * this.cz;
    let x = this.cx + (map.x + object.x * scale);
    let y = this.cy + (map.y + object.y * scale);
    let width = object.width * scale;
    let height = object.height * scale;
    this.drawTextBox(
      x, y,
      width, height,
      object.kind.label,
      object.kind.color
    );
  };
};

export function drawTextBox(x, y, width, height, text, boxColor) {
  let ctx = this.ctx;
  let fontSize = 14 * this.cz;
  let strokeColor = `rgba(${boxColor[0]},${boxColor[1]},${boxColor[2]},0.925)`;
  // fill box
  ctx.fillStyle = `rgba(${boxColor[0]},${boxColor[1]},${boxColor[2]},0.4)`;
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 0.65 * this.cz;
  ctx.fillRect(
    x, y,
    width, height
  );
  ctx.strokeRect(
    x, y,
    width, height
  );
  // measure text size
  ctx.font = `${fontSize}px Open Sans`;
  let xpad = ctx.measureText(`E`).width;
  let fx = x + (width / 2) - (xpad / 2);
  let fy = y + (height - 2.5 * this.cz);
  // stroke text
  ctx.font = `bold ${fontSize}px Open Sans`;
  ctx.strokeStyle = strokeColor;
  ctx.strokeText(text, fx, fy);
  // fill text
  ctx.fillStyle = CFG.ENGINE_BOX_TEXT_COLOR;
  ctx.fillText(text, fx, fy);
};
