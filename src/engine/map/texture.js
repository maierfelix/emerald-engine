import * as CFG from "../../cfg";

import {
  setImageSmoothing,
  createCanvasBuffer
} from "../../utils";

export function initTextures(width, height) {
  this.textures[0] = createCanvasBuffer(width, height).ctx;
  this.textures[1] = createCanvasBuffer(width, height).ctx;
  this.textures[2] = createCanvasBuffer(width, height).ctx;
  this.textures["preview"] = createCanvasBuffer(width, height).ctx;
};

export function resizeTextures(width, height) {
  this.resizeTexture(this.textures[0], width, height);
  this.resizeTexture(this.textures[1], width, height);
  this.resizeTexture(this.textures[2], width, height);
  this.resizeTexture(this.textures["preview"], width, height);
};

export function resizeTexture(texture, width, height) {
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
  let tw = CFG.TILESET_HORIZONTAL_SIZE;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let ts = bundle[tsId];
      let tileset = instance.bundles[bundleId].tilesets[tsId].canvas;
      for (let ll in ts) {
        let data = ts[ll];
        let texture = this.textures[(ll | 0) - 1];
        let size = width * height;
        for (let ii = 0; ii < size; ++ii) {
          let xx = (ii % width) | 0;
          let yy = (ii / width) | 0;
          let tile = (data[ii] - 1) | 0;
          if ((tile + 1) === 0) continue;
          let sx = (tile % tw) | 0;
          let sy = (tile / tw) | 0;
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
