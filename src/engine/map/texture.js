import * as CFG from "../../cfg";

import {
  setImageSmoothing,
  createCanvasBuffer
} from "../../utils";

export function initTextures(width, height) {
  this.texture[0] = createCanvasBuffer(width, height).ctx;
  this.texture[1] = createCanvasBuffer(width, height).ctx;
  this.texture[2] = createCanvasBuffer(width, height).ctx;
};

export function resizeTextures(width, height) {
  this.resizeTexture(0, width, height);
  this.resizeTexture(1, width, height);
  this.resizeTexture(2, width, height);
};

export function resizeTexture(index, width, height) {
  let texture = this.texture[index];
  texture.canvas.width = width;
  texture.canvas.height = height;
  setImageSmoothing(texture, false);
};
