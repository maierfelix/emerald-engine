import fs from 'fs';

const OFFSETS = {
  GAME_CODE: 0xAC,
  GAME_NAME: 0xA0,
  GAME_MAKER: 0xB0
};

function readBinaryFileSync(path) {
  return fs.readFileSync(path, "binary");
}

console.clear();

console.log(OFFSETS);

let file = readBinaryFileSync("rom.gba");
console.log(file);
