import {
  readBinaryFile,
  readCachedFile
} from "./utils";

import Rom from "./rom/";
import MapEditor from "./map-editor/";
import TilesetEditor from "./ts-editor/";
import TerrainGenerator from "./terrain-generator/";

// check browser compatibility
console.assert(
  (typeof Worker !== "undefined") &&
  (typeof WebGLRenderingContext !== "undefined")
);

console.clear();

readCachedFile("rom.gba").then((buffer) => {
  new Rom(buffer, { debug: () => {} }).then((rom) => {
    /*let tsEditor = new TilesetEditor(rom, 0, 9);
    (function draw() {
      requestAnimationFrame(draw);
      if (tsEditor.active) tsEditor.draw();
    })();*/
    let tg = new TerrainGenerator(rom);
    (function draw() {
      requestAnimationFrame(draw);
      tg.draw();
    })();
  });
});
