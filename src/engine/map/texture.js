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

export function refreshMapTexture() {
  let bundles = this.data;
  let width = this.width | 0;
  let height = this.height | 0;
  let instance = this.instance;
  let scale = CFG.BLOCK_SIZE;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let ts = bundle[tsId];
      let tileset = instance.bundles[bundleId].tilesets[tsId].canvas;
      for (let ll in ts) {
        let data = ts[ll];
        let texture = this.texture[(ll | 0) - 1];
        let size = width * height;
        for (let ii = 0; ii < size; ++ii) {
          let xx = (ii % width) | 0;
          let yy = (ii / width) | 0;
          let tile = (data[ii] - 1) | 0;
          if ((tile + 1) === 0) continue;
          let sx = (tile % 8) | 0;
          let sy = (tile / 8) | 0;
          texture.drawImage(
            tileset,
            sx * scale, sy * scale,
            scale, scale,
            (xx * scale), (yy * scale),
            scale, scale
          );
        };
      };
    };
  };
};
