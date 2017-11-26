import * as CFG from "../cfg";

import {
  $,
  loadJSONFile
} from "../utils";

export function setup() {
  this.addListeners();
  this.resize();
  this.setUIMode("ts");
  this.setUIObjMode(1);
  this.setUIEncounterMode(0);
  this.loadDefaultMap();
};

export function loadDefaultMap() {
  loadJSONFile("../tileset.json").then(json => {
    this.useTileset(json);
    this.currentMap = this.loadMapFromROM(0, 19);
    $("#engine-ui").style.display = "block";
    document.body.style.background = `#2c2d2e`;
  });
};
