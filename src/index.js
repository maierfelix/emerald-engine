import {
  readBinaryFile,
  readCachedFile
} from "./utils";

import Rom from "./rom/";
import Engine from "./engine/";
import MapEditor from "./map-editor/";
import TilesetEditor from "./ts-editor/";
import TerrainGenerator from "./terrain-generator/";

// check browser compatibility
console.assert(
  (typeof Worker !== "undefined") &&
  (typeof WebGLRenderingContext !== "undefined")
);

console.clear();

let mode = null;
location.search.split("?").map((search) => {
  let entry = search.split("=");
  let name = entry[0];
  let value = entry[1];
  if (!name || !value) return;
  mode = value;
});

readCachedFile("rom.gba").then((buffer) => {
  new Rom(buffer, { debug: () => {} }).then((rom) => {
    let instance = null;
    switch (mode) {
      case "terrain-generator":
        instance = new TerrainGenerator(rom);
      break;
      case "tileset-editor":
        instance = new TilesetEditor(rom, 0, 9);
      break;
      case "game-engine":
        instance = new Engine(rom);
      break;
      case "map-editor":
        instance = new MapEditor(rom);
      break;
    };
    if (!instance) {
      console.warn(`No active instance`);
      return;
    }
    console.log(instance);
    (function draw() {
      requestAnimationFrame(draw);
      instance.draw();
    })();
  });
});
