import { OFFSETS as OFS } from "./offsets";

import Rom from "./rom";

import { readBinaryFile } from "./utils";

console.clear();

readBinaryFile("rom.gba").then((buffer) => {
  console.log("ROM successfully loaded");
  let rom = new Rom(buffer);
  console.log(rom);
});
