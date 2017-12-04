import * as CFG from "../../cfg";

import {
  uid,
  assert
} from "../../utils";

import extend from "../../extend";

import Engine from "../index";

import * as _fill from "./fill";
import * as _tile from "./tile";
import * as _json from "./json";
import * as _objects from "./objects";
import * as _settings from "./settings";
import * as _textures from "./texture";
import * as _encounters from "./encounters";

export default class Map {
  constructor(instance, width = 8, height = 8) {
    assert(instance instanceof Engine);
    this.id = uid();
    this.x = 0;
    this.y = 0;
    this.width = width | 0;
    this.height = height | 0;
    this.data = {};
    this.textures = {
      0: null,       // bg
      1: null,       // bgb
      2: null,       // fg
      preview: null  // preview
    };
    this.objects = [
      {
        x: 3, y: 2,
        kind: CFG.ENGINE_BOX_TYPES.ENTITY,
        width: 1, height: 1
      }
    ];
    this.instance = instance;
    this.collisions = [];
    this.encounters = [];
    this.settings = {
      name: null,
      type: null,
      music: null,
      weather: null,
      showName: false
    };
    // if we only draw tiles onto the preview texture
    this.drawPreview = false;
    this.resize(width, height);
  }
};

Map.prototype.resize = function(width, height) {
  this.width = width;
  this.height = height;
  this.initTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  this.resizeTextures(width * CFG.BLOCK_SIZE, height * CFG.BLOCK_SIZE);
  return this;
};

Map.prototype.dataLayerMissing = function(tileset) {
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  return (
    (this.data[bundleId] === void 0) ||
    (this.data[bundleId][tsId] === void 0)
  );
};

Map.prototype.createDataLayer = function(tileset, width, height) {
  let size = (width * height) | 0;
  let tsId = tileset.name;
  let bundleId = tileset.bundle.name;
  // allocate bundle data
  if (!this.data[bundleId]) this.data[bundleId] = {};
  let mapData = this.data[bundleId];
  // allocate bundle tileset data
  let data = mapData[tsId] = {
    1: new Array(size).fill(0),
    2: new Array(size).fill(0),
    3: new Array(size).fill(0)
  };
  for (let ii = 0; ii < size; ++ii) {
    let x = (ii % width) | 0;
    let y = (ii / width) | 0;
    data[1][ii] = 0;
    data[2][ii] = 0;
    data[3][ii] = 0;
  };
};

extend(Map, _fill);
extend(Map, _tile);
extend(Map, _json);
extend(Map, _objects);
extend(Map, _settings);
extend(Map, _textures);
extend(Map, _encounters);
