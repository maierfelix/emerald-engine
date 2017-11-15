import * as CFG from "../cfg";

import {
  $,
  roundTo,
  createCanvasBuffer
} from "../utils";

export default class MapEditor {
  /**
   * @param {Rom} rom - The ROM file to use
   */
  constructor(rom) {
    this.rom = rom;
    this.setup();
  }
  setup() {
    console.log(this);
    $("#map-ui").style.display = "block";
  }
};
