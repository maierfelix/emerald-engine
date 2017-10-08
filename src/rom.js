import { assert } from "./utils";

import {
  readInt,
  readByte,
  readBytes,
  readString,
  readPointer,
  readPointerAsInt,
  readBinaryString
} from "./rom-read";

import { LZ77 } from "./rom-utils";

import { OFFSETS as OFS } from "./offsets";

export default class Rom {
  constructor(buffer) {
    this.buffer = buffer;
    this.code = null;
    this.name = null;
    this.maker = null;
    this.names = {
      pkmn: {},
      items: {},
      attacks: {}
    };
    this.init();
  }
  init() {
    let buffer = this.buffer;
    this.code = readBinaryString(buffer, OFS.GAME_CODE, 4);
    this.name = readBinaryString(buffer, OFS.GAME_NAME, 4);
    this.maker = readBinaryString(buffer, OFS.GAME_MAKER, 2);
    this.generatePkmnNameTable();
    this.getPkmnFrontImgById(1);
    this.getPkmnFrontImgById(2);
    this.getPkmnFrontImgById(3);
    this.getPkmnFrontImgById(4);
    this.getPkmnFrontImgById(5);
    this.getPkmnFrontImgById(6);
    this.getPkmnFrontImgById(151);
    this.test();
  }
  getPkmnNameById(id) {
    let offset = id * 11;
    let buffer = this.buffer;
    return readString(buffer, OFS.PKMN_NAMES + offset)
  }
  getPkmnFrontImgById(id) {
    let buffer = this.buffer;
     // img
    let soffset = OFS.PKMN_FRONT_IMG + id * 8;
    let sptr = readPointer(buffer, soffset);
    let sbytes = readBytes(buffer, sptr, 0xfff);
    let pixels = LZ77(buffer, sptr);
    let ww = 64; let hh = 64;

    let canvas = document.createElement("canvas");
    canvas.width = ww;
    canvas.height = hh;
    let ctx = canvas.getContext("2d");

    let index = 0;
    let TILE_SIZE = 8;
    // loop through rows of tiles
    for (let yTile = 0; yTile < (ww / TILE_SIZE); yTile++) {
      // loop through columns of tiles
      for (let xTile = 0; xTile < (hh / TILE_SIZE); xTile++) {
        // loop through rows of pixels inside tile
        for (let yPixel = 0; yPixel < TILE_SIZE; yPixel++) {
          // loop through columns of pixels inside tile
          for (let xPixel = 0; xPixel < TILE_SIZE; xPixel++) {

            let depth = 4;
            let pixel = pixels[index / (TILE_SIZE / depth)];
            if ((index & 1) === 0) pixel &= 0x0F;
            else pixel = (pixel & 0xF0) >> depth;

            if (pixel > 0) ctx.fillStyle = "#fff";
            else ctx.fillStyle = "#000";

            ctx.fillRect(
              xPixel + (xTile * TILE_SIZE),
              yPixel + (yTile * TILE_SIZE),
              1, 1
            );

            index++;
          };
        };
      };
    };


    /*let imgd = new ImageData(ww, hh);
    for (let ii = 0; ii < ww * hh; ++ii) {
      let px = ii * 4;
      imgd.data[px + 0] = pixels[ii + 0];
      imgd.data[px + 1] = pixels[ii + 1];
      imgd.data[px + 2] = pixels[ii + 2];
      imgd.data[px + 3] = pixels[ii + 3];
    };
    var canvas = document.createElement("canvas");
    canvas.width = ww;
    canvas.height = hh;
    var ctx = canvas.getContext("2d");
    ctx.putImageData(imgd, 0, 0);*/

    var img = document.createElement("img");
    img.src = canvas.toDataURL("image/png");
    document.body.appendChild(img);
  }
  generatePkmnNameTable() {
    let table = this.names.pkmn;
    for (let ii = 1; ii <= 151; ++ii) {
      let name = this.getPkmnNameById(ii);
      table[ii] = name;
    };
  }
  test() {
    let buffer = this.buffer;
    let itemImageDataPtr = 0x3D4294;
    let imgPtr = readPointerAsInt(itemImageDataPtr + 0);
    let palettePtr = readPointerAsInt(itemImageDataPtr + 4);
    //console.log(readBytes(buffer, itemImageDataPtr, 10));
    //console.log(readBytes(buffer, imgPtr, 10));
  }
};
