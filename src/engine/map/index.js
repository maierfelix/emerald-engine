import * as CFG from "../../cfg";

import {
  uid
} from "../../utils";

export default class Map {
  constructor(width = 8, height = 8) {
    this.id = uid();
    this.x = 0;
    this.y = 0;
    this.width = width | 0;
    this.height = height | 0;
    this.layers = {
      0: {},
      1: {},
      2: {}
    };
    this.textures = {
      0: null,
      1: null,
      2: null
    };
    this.collisions = [];
    this.objects = [];
    this.encounters = [];
    this.settings = {
      name: null,
      type: null,
      music: null,
      weather: null,
      showName: false,
    };
    this.resize(width, height);
  }
  resize(width, height) {
    
  }
};
