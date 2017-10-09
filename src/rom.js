import {
  assert,
  createCanvasBuffer
} from "./utils";

import {
  PTR,
  readInt,
  readLong,
  readChar,
  readWord,
  readShort,
  readByte,
  readBytes,
  readString,
  readPointer,
  readPointerAsInt,
  readBinaryString,
  readPalette,
  readPixels,
  intToPointer
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
    this.maps = {};
    this.bankPointers = [];
    this.mapInBanksCount = [];
    this.init();
  }
  init() {
    let buffer = this.buffer;
    this.code = readBinaryString(buffer, OFS.GAME_CODE, 4);
    this.name = readBinaryString(buffer, OFS.GAME_NAME, 4);
    this.maker = readBinaryString(buffer, OFS.GAME_MAKER, 2);
    assert(this.code === "BPEE"); // emerald rom
    this.generateTables();
    /*for (let ii = 1; ii < OFS.PKMN_COUNT; ++ii) {
      let pkmn = ii;
      let bisa_front = this.getPkmnFrontImgById(pkmn);
      let bisa_back = this.getPkmnBackImgById(pkmn);
      let bisa_front_anim = this.getPkmnFrontAnimationImgById(pkmn);
      let bisa_icon = this.getPkmnIconImgById(pkmn);
      document.body.appendChild(bisa_front.canvas);
      document.body.appendChild(bisa_front_anim.canvas);
      document.body.appendChild(bisa_back.canvas);
      document.body.appendChild(bisa_icon.canvas);
    };
    for (let ii = 1; ii < OFS.ITEM_COUNT; ++ii) {
      let item = this.getItemImageById(ii);
      document.body.appendChild(item.canvas);
    };*/
  }
  generateTables() {
    this.generatePkmnString();
    this.generateItemNameTable();
    this.generatePkmnNameTable();
    this.generateAttackNameTable();
    this.generatePkmnGraphicTable();
    this.generateItemGraphicTable();
    this.generateMaps();
  }
  generateMaps() {
    for (let ii = 0; ii < OFS.MAP_BANK_POINTERS.length; ++ii) {
      this.mapInBanksCount[ii] = OFS.MAPS_IN_BANK[ii];
      this.bankPointers[ii] = OFS.MAP_BANK_POINTERS[ii];
    };
    this.generateMap(0, 9);
  }
  generateMap(bank, map) {
    let buffer = this.buffer;
    let bankOffset = this.bankPointers[bank] + map * 4;
    let mapHeaderPointer = readPointer(buffer, bankOffset);
    let offset = mapHeaderPointer;

    // # HEADER
    let pMap = readPointer(buffer, offset); offset += 0x4;
    let pSprites = readPointer(buffer, offset); offset += 0x4;
    let pScript = readPointer(buffer, offset); offset += 0x4;
    let pConnect = readPointer(buffer, offset); offset += 0x4;
    let hSong = readWord(buffer, offset); offset += 0x2;
    let hMap = readWord(buffer, offset); offset += 0x2;

    let bLabelID = readByte(buffer, offset); offset += 0x1;
    let bFlash = readByte(buffer, offset); offset += 0x1;
    let bWeather = readByte(buffer, offset); offset += 0x1;
    let bType = readByte(buffer, offset); offset += 0x1;
    let bUnused1 = readByte(buffer, offset); offset += 0x1;
    let bUnused2 = readByte(buffer, offset); offset += 0x1;
    let bLabelToggle = readByte(buffer, offset); offset += 0x1;
    let bUnused3 = readByte(buffer, offset); offset += 0x1;
    let hdrSize = offset - mapHeaderPointer - 0x8000000;

    // # CONNECTION
    offset = intToPointer(pConnect);
    let pNumConnections = readPointer(buffer, offset); offset += 0x4;
    let pData = readPointer(buffer, offset); offset += 0x4;

    offset = intToPointer(pData);
    let connections = [];
    for (let ii = 0; ii < pNumConnections; ++ii) {
      let conn = {};
      conn.lType = readPointer(buffer, offset); offset += 0x4;
      conn.lOffset = readLong(buffer, offset); offset += 0x4;
      conn.bBank = readByte(buffer, offset); offset += 0x1;
      conn.bMap = readByte(buffer, offset); offset += 0x1;
      conn.wFiller = readWord(buffer, offset); offset += 0x2;
      connections.push(conn);
    };
    let originalSize = pNumConnections * 12;
    console.log(pNumConnections, pData, connections);

    // # HEADER SPRITES
    offset = pSprites &0x1FFFFFF;
    let bNumNPC = readByte(buffer, offset); offset += 0x1;
    let bNumExits = readByte(buffer, offset); offset += 0x1;
    let bNumTraps = readByte(buffer, offset); offset += 0x1;
    let bNumSigns = readByte(buffer, offset); offset += 0x1;
    let pNPC = readPointer(buffer, offset); offset += 0x4;
    let pExits = readPointer(buffer, offset); offset += 0x4;
    let pTraps = readPointer(buffer, offset); offset += 0x4;
    let pSigns = readPointer(buffer, offset); offset += 0x4;

    // SpritesNPC etc...

    // # MAP DATA
    offset = pMap;
    let mapWidth = readPointer(buffer, offset); offset += 0x4;
    let mapHeight = readPointer(buffer, offset); offset += 0x4;
    let borderTilePtr = readPointer(buffer, offset); offset += 0x4;
    let mapTilesPtr = readPointer(buffer, offset); offset += 0x4;
    let globalTileSetPtr = readPointer(buffer, offset); offset += 0x4;
    let localTileSetPtr = readPointer(buffer, offset); offset += 0x4;
    let borderWidth = 2; offset += 0x1;
    let borderHeight = 2; offset += 0x1;
    let secondarySize = borderWidth + 0xA0;

    // # MAP TILE DATA
    console.log(mapWidth, mapHeight);

    let tiles = [];
    let size = mapWidth * mapHeight;
    for (let ii = 0; ii < size; ++ii) {
      let xx = (ii % mapWidth) | 0;
      let yy = (ii / mapWidth) | 0;
      let index = (yy * mapWidth + xx) | 0;
      let tile = readWord(buffer, intToPointer(mapTilesPtr) + index * 2);
      //console.log(tile & 0x3ff, (tile & 0xfc00) >> 10);
      tiles.push((tile & 0xfc00) >> 10);
    };

  }
  getPkmnString() {
    let buffer = this.buffer;
    let string = readString(buffer, OFS.PKMN_STRING);
    return string.substring(0, 7);
  }
  getImage(s, p, x, y, w, h, compressed = false) {
    let buffer = this.buffer;
    let ctx = createCanvasBuffer(w + x, h + y).ctx;
    let palette = readPalette(buffer, p, !!compressed);
    let pixels = readPixels(buffer, s, palette, w, h, !!compressed);
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
  getPkmnIconImgById(id) {
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
  getPkmnCryById(id) {
    let buffer = this.buffer;
    let cryTbl1 = OFS.CRY_TABLE;
    let cryTbl2 = OFS.CRY_TABLE2;
    let cryConvTbl = OFS.CRY_CONVERSION_TABLE;
    let offset = readPointer(buffer, cryTbl1 + (id * 12) + 4);
    let compressed = 0x1;
    let looped = 0x4000;
    let sampleRate = readInt(buffer, offset + 4) >> 10;
    let loopStart = readInt(buffer, offset + 8);
    let size = readInt(buffer, offset + 12) + 1;
    let bytes = [];
    for (let ii = 0; ii < size; ++ii) {
      let byte = readByte(buffer, offset + 16 + ii);
      bytes.push(byte);
    };
    return bytes;
  }
  generatePkmnString() {
    let string = this.getPkmnString();
    this.names.pkmn = string;
  }
  generateAttackNameTable() {
    let table = this.names.attacks;
    for (let ii = 1; ii <= OFS.ATTACK_COUNT; ++ii) {
      let atk = this.getAttackNameById(ii);
      table[ii] = atk;
    };
  }
  generatePkmnNameTable() {
    let table = this.names.pkmns;
    for (let ii = 1; ii <= OFS.PKMN_COUNT; ++ii) {
      let name = this.getPkmnNameById(ii);
      table[ii] = name;
    };
  }
  generatePkmnGraphicTable() {
    let table = this.graphics.pkmns;
    for (let ii = 1; ii <= OFS.PKMN_COUNT; ++ii) {
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
    for (let ii = 1; ii <= OFS.ITEM_COUNT; ++ii) {
      let name = this.getItemNameById(ii);
      table[ii] = name;
    };
  }
  generateItemGraphicTable() {
    let table = this.graphics.items;
    for (let ii = 1; ii <= OFS.ITEM_COUNT; ++ii) {
      let item = this.getItemImageById(ii);
      table[ii] = item;
    };
  }
};
