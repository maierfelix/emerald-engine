import {
  assert,
  createCanvasBuffer
} from "./utils";

import {
  readInt,
  readChar,
  readByte,
  readBytes,
  readString,
  readPointer,
  readBinaryString,
  readPalette,
  readPixels
} from "./rom-read";

import {
  LZ77,
  searchString
} from "./rom-utils";

import { OFFSETS as OFS } from "./offsets";

export default class Rom {
  constructor(buffer) {
    this.buffer = buffer;
    this.code = null;
    this.name = null;
    this.maker = null;
    this.names = {
      pkmn: "",
      pkmns: {},
      items: {},
      attacks: {}
    };
    this.graphics = {
      items: {},
      pkmns: {
        back: {},
        front: {},
        icon: {}
      }
    };
    this.init();
  }
  init() {
    let buffer = this.buffer;
    this.code = readBinaryString(buffer, OFS.GAME_CODE, 4);
    this.name = readBinaryString(buffer, OFS.GAME_NAME, 4);
    this.maker = readBinaryString(buffer, OFS.GAME_MAKER, 2);
    assert(this.code === "BPEE"); // emerald rom
    this.generateTables();
    let pkmn = 9;
    let bisa_front = this.getPkmnFrontImgById(pkmn);
    let bisa_back = this.getPkmnBackImgById(pkmn);
    let bisa_front_anim = this.getPkmnFrontAnimationImgById(pkmn);
    let bisa_icon = this.getPkmnIconImgById(pkmn);
    let item = this.getItemImageById(1);
    document.body.appendChild(item.canvas);
    document.body.appendChild(bisa_front.canvas);
    document.body.appendChild(bisa_front_anim.canvas);
    document.body.appendChild(bisa_back.canvas);
    document.body.appendChild(bisa_icon.canvas);
  }
  generateTables() {
    this.generatePkmnString();
    this.generateItemNameTable();
    this.generatePkmnNameTable();
    this.generateAttackNameTable();
    this.generatePkmnGraphicTable();
    this.generateItemGraphicTable();
  }
  getPkmnString() {
    let buffer = this.buffer;
    let string = readString(buffer, OFS.PKMN_STRING);
    return string.substring(0, 7);
  }
  getImage(s, p, x, y, w, h, cmp = false) {
    let buffer = this.buffer;
    let ctx = createCanvasBuffer(w + x, h + y).ctx;
    let palette = readPalette(buffer, p, !!cmp);
    let pixels = readPixels(buffer, s, palette, w, h, !!cmp);
    ctx.putImageData(pixels, x, y);
    return {
      canvas: ctx.canvas,
      data: new Uint8Array(pixels.data)
    };
  }
  getPkmnFrontImgById(id) {
    let buffer = this.buffer;
    let pixels = readPointer(buffer, OFS.PKMN_FRONT_IMG + id * 8);
    let palette = readPointer(buffer, OFS.PKMN_NORMAL_PAL + id * 8);
    return this.getImage(pixels, palette, 0, 0, 64, 64);
  }
  getPkmnBackImgById(id) {
    let buffer = this.buffer;
    let pixels = readPointer(buffer, OFS.PKMN_BACK_IMG + id * 8);
    let palette = readPointer(buffer, OFS.PKMN_NORMAL_PAL + id * 8);
    return this.getImage(pixels, palette, 0, 0, 64, 64);
  }
  getPkmnFrontAnimationImgById(id) {
    let buffer = this.buffer;
    let pixels = readPointer(buffer, OFS.PKMN_FRONT_ANIM + id * 8);
    let palette = readPointer(buffer, OFS.PKMN_NORMAL_PAL + id * 8);
    return this.getImage(pixels, palette, 0, -64, 64, 128);
  }
  getPkmnIconImgById(id, shiny = 0) {
    let buffer = this.buffer;
    let pixels = readPointer(buffer, OFS.ICON_POINTER_TBL + (id * 4));
    let poffset = OFS.ICON_PALS + (readByte(buffer, OFS.ICON_PAL_TABLE + id) * 32);
    return this.getImage(pixels, poffset, 0, 0, 32, 64, true);
  }
  getItemImageById(id) {
    let buffer = this.buffer;
    let pixels = readPointer(buffer, OFS.ITEM_IMG + id * 8);
    let palette = readPointer(buffer, OFS.ITEM_IMG + (id * 8) + 4);
    return this.getImage(pixels, palette, 0, 0, 24, 24);
  }
  getItemNameById(id) {
    let buffer = this.buffer;
    let offset = OFS.ITEM_DATA + id * 44;
    return readString(buffer, offset);
  }
  getAttackNameById(id) {
    let buffer = this.buffer;
    let offset = OFS.ATTACK_NAMES + id * 13;
    return readString(buffer, offset);
  }
  getPkmnNameById(id) {
    let offset = id * 11;
    let buffer = this.buffer;
    return readString(buffer, OFS.PKMN_NAMES + offset)
  }
  generatePkmnString() {
    let string = this.getPkmnString();
    this.names.pkmn = string;
  }
  generateAttackNameTable() {
    let table = this.names.attacks;
    for (let ii = 1; ii <= 354; ++ii) {
      let atk = this.getAttackNameById(ii);
      table[ii] = atk;
    };
  }
  generatePkmnNameTable() {
    let table = this.names.pkmns;
    for (let ii = 1; ii <= 412; ++ii) {
      let name = this.getPkmnNameById(ii);
      table[ii] = name;
    };
  }
  generatePkmnGraphicTable() {
    let table = this.graphics.pkmns;
    for (let ii = 1; ii <= 412; ++ii) {
      let icon = this.getPkmnIconImgById(ii);
      let back = this.getPkmnBackImgById(ii);
      let front = this.getPkmnFrontImgById(ii);
      table.icon[ii] = front;
      table.back[ii] = back;
      table.front[ii] = front;
    };
  }
  generateItemNameTable() {
    let table = this.names.items;
    for (let ii = 1; ii <= 377; ++ii) {
      let name = this.getItemNameById(ii);
      table[ii] = name;
    };
  }
  generateItemGraphicTable() {
    let table = this.graphics.items;
    for (let ii = 1; ii <= 377; ++ii) {
      let item = this.getItemImageById(ii);
      table[ii] = item;
    };
  }
};
