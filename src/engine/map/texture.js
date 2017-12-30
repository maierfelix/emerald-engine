import * as CFG from "../../cfg";

import {
  setImageSmoothing,
  createCanvasBuffer
} from "../../utils";

export function destroy() {
  this.textures[0] = null;
  this.textures[1] = null;
  this.textures[2] = null;
  this.textures["preview"] = null;
  this.instance.gl.freeTexture(this.texturesGL[0]);
  this.instance.gl.freeTexture(this.texturesGL[1]);
  this.instance.gl.freeTexture(this.texturesGL[2]);
  this.texturesGL[0] = null;
  this.texturesGL[1] = null;
  this.texturesGL[2] = null;
};

export function initTextures(width, height) {
  this.textures[0] = createCanvasBuffer(width, height).ctx;
  this.textures[1] = createCanvasBuffer(width, height).ctx;
  this.textures[2] = createCanvasBuffer(width, height).ctx;
  // create preview texture without scaling
  this.textures["preview"] = createCanvasBuffer(this.width, this.height).ctx;
  this.initGLTextures(width, height);
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

export function initGLTextures(width, height) {
  let gl = this.instance.gl;
  this.texturesGL[0] = gl.createTexture(width, height);
  this.texturesGL[1] = gl.createTexture(width, height);
  this.texturesGL[2] = gl.createTexture(width, height);
};

export function refreshMapTextures() {
  let bundles = this.data;
  let width = this.width | 0;
  let height = this.height | 0;
  let instance = this.instance;
  let gl = instance.gl;
  let scale = CFG.BLOCK_SIZE;
  let tw = CFG.TILESET_HORIZONTAL_SIZE;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let ts = bundle[tsId];
      let tileset = instance.bundles[bundleId].tilesets[tsId].canvas;
      for (let ll in ts) {
        let data = ts[ll];
        let layer = (ll | 0) - 1;
        let texture = this.textures[layer];
        let textureGL = this.texturesGL[layer];
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
            xx * scale, yy * scale,
            scale, scale
          );
        };
      };
    };
  };
  // refresh gl textures
  this.refreshGLTextures();
};

export function refreshGLTextures() {
  this.refreshGLTexture(0);
  this.refreshGLTexture(1);
  this.refreshGLTexture(2);
};

export function refreshGLTexture(layer) {
  let texture = this.textures[layer];
  let textureGL = this.texturesGL[layer];
  this.instance.gl.updateGLTextureByCanvas(
    textureGL,
    texture.canvas,
    0, 0
  );
};
