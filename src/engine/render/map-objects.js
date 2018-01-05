import * as CFG from "../../cfg";

export function drawMapObjects(map) {
  let ctx = this.ctx;
  let objects = map.objects;
  for (let ii = 0; ii < objects.length; ++ii) {
    let object = objects[ii];
    let x = this.cx + ((map.x + object.x) * CFG.BLOCK_SIZE) * this.cz;
    let y = this.cy + ((map.y + object.y) * CFG.BLOCK_SIZE) * this.cz;
    let width = (object.width * CFG.BLOCK_SIZE) * this.cz;
    let height = (object.height * CFG.BLOCK_SIZE) * this.cz;
    let isActiveObject = this.currentObject === object;
    this.drawTextBox(
      x, y,
      width, height,
      object.kind.label,
      object.kind.color,
      isActiveObject
    );
  };
};

export function drawTextBox(x, y, width, height, text, boxColor, isActive) {
  let ctx = this.ctx;
  let fontSize = 14 * this.cz;
  let strokeColor = `rgba(${boxColor[0]},${boxColor[1]},${boxColor[2]},0.95)`;
  let fillColor = `rgba(${boxColor[0]},${boxColor[1]},${boxColor[2]},0.55)`;

  if (isActive) ctx.fillStyle = `rgba(255,0,0,0.75)`;
  else ctx.fillStyle = fillColor;
  if (isActive) ctx.strokeStyle = `rgba(255,0,0,0.95)`;
  else ctx.strokeStyle = strokeColor;

  // fill box
  ctx.lineWidth = 0.65 * this.cz;
  ctx.fillRect(
    x, y,
    width, height
  );
  ctx.strokeRect(
    x, y,
    width, height
  );
  ctx.globalAlpha = 1.0;
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
