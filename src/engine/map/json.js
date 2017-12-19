import * as CFG from "../../cfg";

import {
  assert,
  saveFile,
  mangleDataArray,
  unmangleDataArray
} from "../../utils";

export function validateJSON(json) {
  assert(json.x !== void 0);
  assert(json.y !== void 0);
  assert(json.data !== void 0);
  assert(json.width !== void 0);
  assert(json.height !== void 0);
  assert(json.settings !== void 0);
  assert(json.settings.name !== void 0);
  assert(json.settings.type !== void 0);
  assert(json.settings.music !== void 0);
  assert(json.settings.weather !== void 0);
  assert(json.settings.showName !== void 0);
};

export function createDataFromJSON(json) {
  let width = json.width;
  let height = json.height;
  let bundles = json.data;
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    for (let tsId in bundle) {
      let layers = bundle[tsId];
      layers[1] = this.createLayerFromJSON(layers[1], width, height);
      layers[2] = this.createLayerFromJSON(layers[2], width, height);
      layers[3] = this.createLayerFromJSON(layers[3], width, height);
    };
  };
  return json.data;
};

export function createLayerFromJSON(data, width, height) {
  let size = width * height;
  let view = new Uint16Array(size);
  let decomp = unmangleDataArray(data);
  for (let ii = 0; ii < size; ++ii) view[ii] = decomp[ii];
  return view;
};

export function createJSONFromData(compressed = true) {
  let bundles = this.data;
  let data = {};
  for (let bundleId in bundles) {
    let bundle = bundles[bundleId];
    data[bundleId] = {};
    for (let tsId in bundle) {
      let layers = bundle[tsId];
      if (compressed) {
        data[bundleId][tsId] = {
          1: mangleDataArray(layers[1]),
          2: mangleDataArray(layers[2]),
          3: mangleDataArray(layers[3])
        };
      } else {
        data[bundleId][tsId] = {
          1: new Uint16Array(layers[1]),
          2: new Uint16Array(layers[2]),
          3: new Uint16Array(layers[3])
        };
      }
    };
  };
  return data;
};

export function fromJSON(json) {
  this.validateJSON(json);
  this.x = json.x;
  this.y = json.y;
  this.data = this.createDataFromJSON(json);
  this.settings = json.settings;
  this.setBoundings(json.width, json.height);
  return new Promise(resolve => {
    this.instance.resolveBundleList(json.data).then(() => {
      this.refreshMapTextures();
      resolve(this);
    });
  });
};

export function fromJSONSync(json) {
  this.validateJSON(json);
  this.x = json.x;
  this.y = json.y;
  this.data = this.createDataFromJSON(json);
  this.settings = json.settings;
  this.setBoundings(json.width, json.height);
  this.refreshMapTextures();
  return this;
};

export function toJSON() {
  let object = {
    settings: {
      name: this.settings.name,
      type: this.settings.type,
      music: this.settings.music,
      weather: this.settings.weather,
      showName: this.settings.showName
    },
    x: this.x,
    y: this.y,
    data: this.createJSONFromData(),
    width: this.width,
    height: this.height
  };
  this.validateJSON(object);
  return JSON.stringify(object);
};

export function clone() {
  let json = JSON.parse(this.toJSON());
  return new Map(this.instance).fromJSONSync(json);
};

export function cloneData() {
  let json = this.createJSONFromData(false);
  return json;
};
