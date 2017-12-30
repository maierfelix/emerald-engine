import * as CFG from "../../cfg";

import {
  uid,
  assert,
  createCanvasBuffer
} from "../../utils";

import extend from "../../extend";

import Engine from "../index";

import * as _data from "./data";
import * as _fill from "./fill";
import * as _tile from "./tile";
import * as _json from "./json";
import * as _mutator from "./mutator";
import * as _objects from "./objects";
import * as _settings from "./settings";
import * as _textures from "./texture";
import * as _autotile from "./autotile";
import * as _boundings from "./boundings";
import * as _encounters from "./encounters";

export default class Map {
  constructor(instance, width = 8, height = 8) {
    assert(instance instanceof Engine);
    this.id = uid();
    this.x = 0;
    this.y = 0;
    this.width = width | 0;
    this.height = height | 0;
    this.margin = { x: 0, y: 0, w: 0, h: 0 };
    this.data = {};
    this.textures = {
      0: null,       // bg
      1: null,       // bgb
      2: null,       // fg
      preview: null  // preview
    };
    this.texturesGL = {
      0: null,
      1: null,
      2: null
    };
    this.objects = [];
    this.instance = instance;
    this.collisions = [];
    this.encounters = [];
    this.settings = {
      name: ``,
      type: 0,
      music: 0,
      weather: 0,
      showName: false
    };
    this.fillTable = null;
    this.drawPreview = false;
    this.mutations = [];
    this.recordMutations = false;
    this.init();
  }
};

Map.prototype.init = function() {
  this.fillTable = new Uint8Array(this.width * this.height);
  this.setBoundings(this.width, this.height);
};

Map.prototype.getName = function() {
  let settings = this.settings;
  if (!settings.name.length) return CFG.ENGINE_DEFAULT_MAP_NAME;
  return settings.name;
};

Map.prototype.resize = function(x, y, width, height) {
  this.destroy();
  this.resizeDataLayers(x, y, width, height);
  this.x = x;
  this.y = y;
  this.setBoundings(width, height);
  this.refreshMapTextures();
  this.resetMargins();
};

extend(Map, _data);
extend(Map, _fill);
extend(Map, _tile);
extend(Map, _json);
extend(Map, _mutator);
extend(Map, _objects);
extend(Map, _settings);
extend(Map, _textures);
extend(Map, _autotile);
extend(Map, _boundings);
extend(Map, _encounters);
