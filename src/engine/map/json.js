import * as CFG from "../../cfg";

import {
  assert
} from "../../utils";

export function validateJSON(json) {
  assert(json.x !== void 0);
  assert(json.y !== void 0);
  assert(json.data !== void 0);
  assert(json.width !== void 0);
  assert(json.height !== void 0);
};

export function fromJSON(json) {
  this.validateJSON(json);
  this.x = json.x;
  this.y = json.y;
  this.data = json.data;
  this.resize(json.width, json.height);
  this.refreshMapTexture();
  return new Promise(resolve => {
    this.instance.resolveBundleList(json.data).then(() => {
      resolve(this);
    });
  });
};

export function toJSON() {
  let object = {
    x: this.x,
    y: this.y,
    data: this.data,
    width: this.width,
    height: this.height
  };
  return JSON.stringify(object);
};
