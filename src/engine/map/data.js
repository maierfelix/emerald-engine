import * as CFG from "../../cfg";

import {
  uid,
  assert
} from "../../utils";

export function dataLayerMissing(tileset) {
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  return (
    (this.data[bundleId] === void 0) ||
    (this.data[bundleId][tsId] === void 0)
  );
};

export function createDataLayer(tileset, width, height) {
  let size = (width * height) | 0;
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  // allocate bundle data
  if (!this.data[bundleId]) this.data[bundleId] = {};
  this.data[bundleId][tsId] = {
    1: new Uint16Array(size),
    2: new Uint16Array(size),
    3: new Uint16Array(size)
  };
};

export function resizeDataLayers(x, y, width, height) {
  let bundles = this.data;
  let instance = this.instance;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let ts = bundle[tsId];
      for (let ll in ts) {
        let data = ts[ll];
        let buffer = new Uint16Array(width * height);
        for (let ii = 0; ii < this.width * this.height; ++ii) {
          let xx = (ii % this.width) | 0;
          let yy = (ii / this.width) | 0;
          let opx = (yy * this.width + xx) | 0;
          let npx = opx + (yy * (width - this.width)) + (this.x - x) + ((this.y - y) * width);
          if (xx < (x - this.x) || yy < (y - this.y)) continue;
          buffer[npx] = data[opx];
        };
        ts[ll] = buffer;
      };
    };
  };
};

export function useData(bundles, byReference = false) {
  // create a reference to the input data
  if (byReference) {
    this.data = bundles;
    return;
  }
  // create a copy of the received data
  let data = this.data = {};
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    data[bundleId] = {};
    for (let tsId in bundle) {
      let layers = bundle[tsId];
      data[bundleId][tsId] = {
        1: new Uint16Array(layers[1]),
        2: new Uint16Array(layers[2]),
        3: new Uint16Array(layers[3])
      };
    };
  };
};
