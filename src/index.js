import {
  readBinaryFile,
  readCachedFile,
  showROMInputDialog
} from "./utils";

import Rom from "./rom/";
import Engine from "./engine/";
import MapEditor from "./map-editor/";
import TilesetEditor from "./ts-editor/";
import TerrainGenerator from "./terrain-generator/";

// check browser compatibility
console.assert(
  (typeof Worker !== "undefined") &&
  (typeof FileReader !== "undefined") &&
  (typeof IDBDatabase !== "undefined") &&
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

function initStage(db, buffer) {
  new Rom(buffer, { debug: () => {} })
  .then((rom) => {
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
    (function draw() {
      requestAnimationFrame(draw);
      instance.draw();
    })();
  })
  .catch((e) => {
    console.warn(`ROM file is invalid or broken!`);
    let tra = db.transaction(["ROMData"], "readwrite");
    tra.objectStore("ROMData").delete("key");
    init();
  });
};

function init() {
  readCachedFile("rom.gba")
  .then((obj) => {
    let { db, result, cached } = obj;
    if (!cached) {
      showROMInputDialog(db).then(buffer => initStage(db, buffer));
    } else {
      initStage(db, result);
    }
  });
};

init();
