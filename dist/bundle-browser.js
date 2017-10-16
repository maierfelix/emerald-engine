(function () {
'use strict';

var OFFSETS = {
  LZ77_10: 0x10,
  GAME_CODE: 0xAC,
  GAME_NAME: 0xA0,
  GAME_MAKER: 0xB0,
  ATTACK_COUNT: 354,
  ATTACK_NAMES: 0x31977C,
  ITEM_IMG: 0x614410,
  ITEM_DATA: 0x5839A0,
  ITEM_COUNT: 377,
  BERRY_DATA: 0x57FC94,
  BERRY_COUNT: 43,
  PKMN_COUNT: 412,
  PKMN_NAMES: 0x3185C8,
  PKMN_BACK_IMG: 0x3028B8,
  PKMN_FRONT_IMG: 0x301418,
  PKMN_NORMAL_PAL: 0x303678,
  PKMN_BACK_ANIM: 0x60A8C8,
  PKMN_FRONT_ANIM: 0x30A18C,
  ICON_POINTER_TBL: 0x57BCA8,
  ICON_PAL_TABLE: 0x57C388,
  ICON_PALS: 0xDDE1F8,
  FIELD_EFFECT_NAME: {
    GRASS_STEP: 0,
    WATER_STEP: 1,
    ASHE_STEP: 2,
    SURF_BLOB: 3,
    MAP_ARROW: 4,
    SAND_STEP: 5,
    DEEP_SAND_STEP: 6
  },
  DOOR_ANIM_HEADER: 0x497174,
  FIELD_EFFECT_HEADER: 0x5059F8,
  FIELD_EFFECT_PAL: [
    0x4F77B8,
    0x4F77D8,
    0x4FACB8,
    0x4FBAD8,
    0x0,
    0x0,
    0x4F6E98,
    0x4AD918
  ],
  FIELD_EFFECT_IMGS: [
    // id, palIdx w, h
    [4,  1,  16,  80], // grass step
    [5,  1,  16,  80], // water ripple step
    [6,  1,  16,  80], // ashe step
    [7,  7,  32,  96], // surf blob
    [8,  1,  16,  64], // map arrows
    [11, 0,  16,  32], // sand step
    [23, 0,  16,  32] ],
  OVERWORLD_COUNT: 244,
  OVERWORLD_BANK: 0x509954,
  OVERWORLD_PAL_COUNT: 35,
  OVERWORLD_PAL_HEADERS: 0x50BBC8,
  OVERWORLD_FRAME_LIMITS: [
    17,8,26,11,4,6,8,8,8,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,8,8,9,0,2,2,8,8,8,8,8,8,
    8,8,8,8,8,8,8,0,0,0,0,0,0,3,
    8,8,8,3,0,8,17,8,26,11,4,0,
    8,8,0,8,8,8,17,8,26,11,4,17,
    8,26,11,4,8,8,8,0,0,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,8,8,11,11,8,8,8,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,8,8,8,0,0,8,8,8,8,8,8,0,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,
    8,8,17,17,8,8,8,0,8,8,8,8,8,
    8,8,8,8,8,8,8,8,8,8,8,8,8,8,8
  ],
  PKMN_STRING: 0x1dc8b9,
  CRY_TABLE: 0x69DCF4,
  CRY_TABLE2: 0x69EF24,
  CRY_CONVERSION_TABLE: 0x31F61C,
  MAIN_TS_PAL_COUNT: 7,
  MAIN_TS_BLOCKS: 0x200,
  MAIN_TS_SIZE: 0x280,
  MAIN_TS_HEIGHT: 0x140,
  LOCAL_TS_BLOCKS: 0xFE,
  LOCAL_TS_SIZE: 0x140,
  LOCAL_TS_HEIGHT: 0xC0,
  MAP_LABEL_DATA: 0x5A1480,
  TILESET_ANIMATIONS: [
    0x84F8738 ],
  MAP_CONNECTION: {
    NULL: 0,
    DOWN: 1,
    UP: 2,
    LEFT: 3,
    RIGHT: 4,
    DIVE: 5,
    EMERGE: 6
  },
  MAP_BANK_ORIGIN: 0x84AA4,
  MAP_BANK_POINTERS: [
    0x485D60,
    0x485E44,
    0x485E58,
    0x485E6C,
    0x485E84,
    0x485EA0,
    0x485EC0,
    0x485EE4,
    0x485F00,
    0x485F1C,
    0x485F54,
    0x485F74,
    0x485FB8,
    0x485FE0,
    0x48603C,
    0x486070,
    0x4860AC,
    0x4860E8,
    0x4860F0,
    0x4860F8,
    0x486100,
    0x48610C,
    0x486110,
    0x486114,
    0x486118,
    0x4862C8,
    0x4863BC,
    0x486520,
    0x486528,
    0x48652C,
    0x486560,
    0x486564,
    0x486568,
    0x486574
  ],
  MAPS_IN_BANK: [
    56,
    4,
    4,
    5,
    6,
    7,
    8,
    6,
    6,
    13,
    7,
    16,
    9,
    22,
    12,
    14,
    14,
    1,
    1,
    1,
    2,
    0,
    0,
    0,
    107,
    60,
    88,
    1,
    0,
    12,
    0,
    0,
    2,
    0
  ]
};

var IS_NODE = typeof window === "undefined";


function assert(truth) {
  if (!truth) { throw new Error("Assert exception!"); }
}

function readBinaryFile(path) {
  return new Promise(function (resolve) {
    if (IS_NODE) {
      var data = require("fs").readFileSync(path);
      return resolve(data);
    }
    fetch("../" + path)
    .then(function (resp) { return resp.arrayBuffer(); })
    .then(function (res) { return resolve(new Uint8Array(res)); });
  });
}

function createCanvasBuffer(width, height) {
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d");
  setImageSmoothing(ctx, false);
  return { ctx: ctx, canvas: canvas };
}

function setImageSmoothing(ctx, state) {
  ctx.imageSmoothingEnabled = state;
  ctx.webkitImageSmoothingEnabled = state;
  ctx.mozImageSmoothingEnabled = state;
  ctx.msImageSmoothingEnabled = state;
  ctx.oImageSmoothingEnabled = state;
}

function LZ77(source, offset) {
  assert(source[offset] === OFFSETS.LZ77_10);
  var length = (
    (readByte(source, offset + 0) << 0) |
    (readByte(source, offset + 1) << 8) |
    (readByte(source, offset + 2) << 16)
  ) >> 8;
  var destination = new Uint8Array(length);

  var xIn = offset + 4;
  var xOut = 0;
  var xLen = destination.length;
  while (xLen > 0) {
    var d = source[xIn++];
    for (var ii = 0; ii < 8; ++ii) {
      if ((d & 0x80) !== 0) {
        var data = source[xIn] << 8 | source[xIn + 1];
        xIn += 2;
        var length$1 = (data >> 12) + 3;
        var offset$1 = (data & 0xFFF);
        var windowsOffset = xOut - offset$1 - 1;
        for (var j = 0; j < length$1; j++) {
          destination[xOut++] = destination[windowsOffset++];
          xLen--;
          if (xLen === 0) { return destination; }
        }
      } else {
        destination[xOut++] = source[xIn++];
        xLen--;

        if (xLen === 0) { return destination; }
      }

      d = ((d << 1) & 0xFF);
    }
  }
}

function toHex(n) {
  return "0x" + (n).toString(16).toUpperCase();
}



function decodeCharByte(byte) {
  switch (byte) {
    case 0x00: return " ";
    case 0x01: return "À";
    case 0x02: return "Á";
    case 0x03: return "Â";
    case 0x04: return "Ç";
    case 0x05: return "È";
    case 0x06: return "É";
    case 0x07: return "Ê";
    case 0x08: return "Ë";
    case 0x09: return "Ì";
    case 0x0B: return "Î";
    case 0x0C: return "Ï";
    case 0x0D: return "Ò";
    case 0x0E: return "Ó";
    case 0x0F: return "Ô";
    case 0x10: return "Œ";
    case 0x11: return "Ù";
    case 0x12: return "Ú";
    case 0x13: return "Û";
    case 0x14: return "Ñ";
    case 0x15: return "ß";
    case 0x16: return "à";
    case 0x17: return "á";
    case 0x19: return "ç";
    case 0x1A: return "è";
    case 0x1B: return "é";
    case 0x1C: return "ê";
    case 0x1D: return "ë";
    case 0x1E: return "ì";
    case 0x20: return "î";
    case 0x21: return "ï";
    case 0x22: return "ò";
    case 0x23: return "ó";
    case 0x24: return "ô";
    case 0x25: return "œ";
    case 0x26: return "ù";
    case 0x27: return "ú";
    case 0x28: return "û";
    case 0x29: return "ñ";
    case 0x2A: return "º";
    case 0x2B: return "ª";
    case 0x2D: return "&";
    case 0x2E: return "+";
    case 0x34: return "[Lv]";
    case 0x35: return "=";
    case 0x36: return ";";
    case 0x51: return "¿";
    case 0x52: return "¡";
    case 0x53: return "[pk]";
    case 0x54: return "[mn]";
    case 0x55: return "[po]";
    case 0x56: return "[ké]";
    case 0x57: return "[bl]";
    case 0x58: return "[oc]";
    case 0x59: return "[k]";
    case 0x5A: return "Í";
    case 0x5B: return "%";
    case 0x5C: return "(";
    case 0x5D: return ")";
    case 0x68: return "â";
    case 0x6F: return "í";
    case 0x79: return "[U]";
    case 0x7A: return "[D]";
    case 0x7B: return "[L]";
    case 0x7C: return "[R]";
    case 0x85: return "<";
    case 0x86: return ">";
    case 0xA1: return "0";
    case 0xA2: return "1";
    case 0xA3: return "2";
    case 0xA4: return "3";
    case 0xA5: return "4";
    case 0xA6: return "5";
    case 0xA7: return "6";
    case 0xA8: return "7";
    case 0xA9: return "8";
    case 0xAA: return "9";
    case 0xAB: return "!";
    case 0xAC: return "?";
    case 0xAD: return ".";
    case 0xAE: return "-";
    case 0xAF: return "·";
    case 0xB0: return "...";
    case 0xB1: return "«";
    case 0xB2: return "»";
    case 0xB3: return "'";
    case 0xB4: return "'";
    case 0xB5: return "|m|";
    case 0xB6: return "|f|";
    case 0xB7: return "$";
    case 0xB8: return ",";
    case 0xB9: return "*";
    case 0xBA: return "/";
    case 0xBB: return "A";
    case 0xBC: return "B";
    case 0xBD: return "C";
    case 0xBE: return "D";
    case 0xBF: return "E";
    case 0xC0: return "F";
    case 0xC1: return "G";
    case 0xC2: return "H";
    case 0xC3: return "I";
    case 0xC4: return "J";
    case 0xC5: return "K";
    case 0xC6: return "L";
    case 0xC7: return "M";
    case 0xC8: return "N";
    case 0xC9: return "O";
    case 0xCA: return "P";
    case 0xCB: return "Q";
    case 0xCC: return "R";
    case 0xCD: return "S";
    case 0xCE: return "T";
    case 0xCF: return "U";
    case 0xD0: return "V";
    case 0xD1: return "W";
    case 0xD2: return "X";
    case 0xD3: return "Y";
    case 0xD4: return "Z";
    case 0xD5: return "a";
    case 0xD6: return "b";
    case 0xD7: return "c";
    case 0xD8: return "d";
    case 0xD9: return "e";
    case 0xDA: return "f";
    case 0xDB: return "g";
    case 0xDC: return "h";
    case 0xDD: return "i";
    case 0xDE: return "j";
    case 0xDF: return "k";
    case 0xE0: return "l";
    case 0xE1: return "m";
    case 0xE2: return "n";
    case 0xE3: return "o";
    case 0xE4: return "p";
    case 0xE5: return "q";
    case 0xE6: return "r";
    case 0xE7: return "s";
    case 0xE8: return "t";
    case 0xE9: return "u";
    case 0xEA: return "v";
    case 0xEB: return "w";
    case 0xEC: return "x";
    case 0xED: return "y";
    case 0xEE: return "z";
    case 0xEF: return "|>|";
    case 0xF0: return ":";
    case 0xF1: return "Ä";
    case 0xF2: return "Ö";
    case 0xF3: return "Ü";
    case 0xF4: return "ä";
    case 0xF5: return "ö";
    case 0xF6: return "ü";
    case 0xF7: return "|A|";
    case 0xF8: return "|V|";
    case 0xF9: return "|<|";
    case 0xFA: return "|nb|";
    case 0xFB: return "|nb2|";
    case 0xFC: return "|FC|";
    case 0xFD: return "|FD|";
    case 0xFE: return "|br|";
    case 0xFF: return "|end|";
  }
  return "";
}

function getMaxFrame(index) {
  return OFFSETS.OVERWORLD_FRAME_LIMITS[index];
}

function isFrameMirrorable(frame) {
  switch (frame) {
    case 2:
    case 7:
    case 8:
    case 11:
    case 16:
    case 17:
    return true;
  }
  return false;
}

var I8 = Int8Array.BYTES_PER_ELEMENT;





function intToPointer(value) {
  return value & 0x1FFFFFF;
}

function readByte(buffer, offset) {
  return (
    buffer[offset] & 0xff
  );
}

function readShort(buffer, offset) {
  return (
    ((buffer[offset] & 0xff) << 0) |
    ((buffer[offset + 1] & 0xff) << 8)
  );
}

function readInt(buffer, offset) {
  return (
    ((buffer[offset + 0] & 0xff) << 0)  |
    ((buffer[offset + 1] & 0xff) << 8)  |
    ((buffer[offset + 2] & 0xff) << 16) |
    ((buffer[offset + 3] & 0xff) << 24)
  );
}

function readPointer(buffer, offset) {
  return (
    readInt(buffer, offset) & 0x1FFFFFF
  );
}



function readChar(buffer, offset) {
  return decodeCharByte(readByte(buffer, offset));
}

function readWord(buffer, offset) {
  var bytes = readBytes(buffer, offset, 2);
  return (bytes[1] << 8) + (bytes[0]);
}



function readLong(buffer, offset) {
  var ptr = readInt(buffer, offset);
  return ptr | 0;
}

function readBytes(buffer, offset, length) {
  var data = new Uint8Array(length);
  for (var ii = 0; ii < length; ++ii) {
    data[ii] = readByte(buffer, offset + ii * I8);
  }
  return data;
}







function readString(buffer, offset, max) {
  var ii = 0;
  var chars = [];
  var char = readChar(buffer, offset);
  while (char !== "|end|") {
    chars.push(char);
    char = readChar(buffer, offset + (++ii));
    if (ii > max) { break; }
  }
  return chars.join("");
}

function readBinaryString(buffer, offset, length) {
  var data = [];
  for (var ii = 0; ii < length; ++ii) {
    var char = readByte(buffer, offset + ii);
    data[ii] = String.fromCharCode(char);
  }
  return data.join("");
}

function readPalette(buffer, offset, uncmp) {
  if ( uncmp === void 0 ) uncmp = false;

  var colors = [];
  var palette = uncmp ? readBytes(buffer, offset, 0xfff) : LZ77(buffer, offset);
  for (var ii = 0; ii < palette.length; ++ii) {
    var value = palette[ii] | (palette[++ii] << 8);
    var color = decodePalette(value);
    colors[ii / 2 | 0] = color;
  }
  return colors;
}

function decodePalette(palette) {
  var r = ( palette & 0x1F ) << 3;
  var g = ( palette & 0x3E0 ) >> 2;
  var b = ( palette & 0x7C00 ) >> 7;
  return { r: r, g: g, b: b };
}

function readPixels(buffer, offset, palette, width, height, uncmp) {
  if ( uncmp === void 0 ) uncmp = false;

  var index = 0;
  var TILE_SIZE = 8;
  var pixels = new ImageData(width, height);
  var size = (width / TILE_SIZE) * (height / TILE_SIZE) | 0;
  var data = uncmp ? readBytes(buffer, offset, 0xfff) : LZ77(buffer, offset);
  for (var ii = 0; ii < size; ++ii) {
    var xx = (ii % (width / TILE_SIZE)) | 0;
    var yy = (ii / (width / TILE_SIZE)) | 0;
    for (var jj = 0; jj < TILE_SIZE * TILE_SIZE; ++jj) {
      var px = (jj % (TILE_SIZE)) | 0;
      var py = (jj / (TILE_SIZE)) | 0;
      var depth = 4;
      var pix = (index / (TILE_SIZE / depth)) | 0;
      var pixel = data[pix];
      if ((index & 1) === 0) { pixel &= 0x0F; }
      else { pixel = (pixel & 0xF0) >> depth; }
      if (pixel > 0) {
        var r = palette[pixel].r;
        var g = palette[pixel].g;
        var b = palette[pixel].b;
        var idx = (((py + (yy * TILE_SIZE)) * width + (px + (xx * TILE_SIZE))) | 0) * 4;
        pixels.data[idx + 0] = r;
        pixels.data[idx + 1] = g;
        pixels.data[idx + 2] = b;
        pixels.data[idx + 3] = 0xff;
      }
      index++;
    }
  }
  return pixels;
}

var Rom = function Rom(buffer, opt) {
  var this$1 = this;
  if ( opt === void 0 ) opt = {};

  this.options = opt;
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
    effects: {},
    items: {},
    pkmns: {
      back: {},
      front: {},
      icon: {}
    },
    doors: {},
    overworlds: {}
  };
  this.maps = {};
  this.bankPointers = [];
  this.mapInBanksCount = [];
  return new Promise(function (resolve) {
    this$1.init().then(function () { return resolve(this$1); });
  });
};
Rom.prototype.init = function init (resolve) {
    var this$1 = this;

  var buffer = this.buffer;
  this.code = readBinaryString(buffer, OFFSETS.GAME_CODE, 4);
  this.name = readBinaryString(buffer, OFFSETS.GAME_NAME, 4);
  this.maker = readBinaryString(buffer, OFFSETS.GAME_MAKER, 2);
  assert(this.code === "BPEE"); // emerald rom
  return new Promise(function (resolve) {
    this$1.generateTables().then(resolve);
  });
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
  };
  for (let ii = 0; ii < OFS.OVERWORLD_COUNT; ++ii) {
    let sprite = this.getOverworldImgById(ii, 0);
    document.body.appendChild(sprite.canvas);
  };*/
};
Rom.prototype.generateTables = function generateTables () {
    var this$1 = this;

  var tasks = [];
  tasks.push(this.generatePkmnString, "Generating Pkmn String...");
  tasks.push(this.generateItemNameTable, "Generating Item Name Table...");
  tasks.push(this.generatePkmnNameTable, "Generating Pkmn Name Table...");
  tasks.push(this.generateAttackNameTable, "Generating Attack Name Table...");
  tasks.push(this.generatePkmnGraphicTable, "Generating Pkmn Graphic Table...");
  tasks.push(this.generateItemGraphicTable, "Generating Item Graphic Table...");
  tasks.push(this.generateFieldEffectGraphicTable, "Generating Field Effect Graphic Table...");
  tasks.push(this.generateDoorAnimationGraphicTable, "Generating Door Animation Graphic Table...");
  tasks.push(this.generateOverworldGraphicTable, "Generating Overworld Graphic Table...");
  tasks.push(this.generateMaps, "Generating World Map...");
  tasks.push(function () {}, "Finished!");
  return new Promise(function (resolve) {
    var self = this$1;
    (function nextTask() {
      if (!tasks.length) { return; }
      var task = tasks.shift();
      var desc = tasks.shift();
      self.options.debug(desc);
      setTimeout(function () {
        task.call(self, []);
        !tasks.length ? resolve() : nextTask();
      });
    })();
  });
};
Rom.prototype.generateMaps = function generateMaps () {
    var this$1 = this;

  for (var ii = 0; ii < OFFSETS.MAP_BANK_POINTERS.length; ++ii) {
    this$1.mapInBanksCount[ii] = OFFSETS.MAPS_IN_BANK[ii];
    this$1.bankPointers[ii] = OFFSETS.MAP_BANK_POINTERS[ii];
  }
  this.fetchMap(0, 9);
  //this.fetchMap(0, 19);
};
Rom.prototype.fetchMap = function fetchMap (bBank, bMap) {
  var id = bBank + ":" + bMap;
  return (
    this.maps[id] ||
    (this.maps[id] = this.generateMap(bBank, bMap))
  );
};
Rom.prototype.loadWorldMap = function loadWorldMap (bBank, bMap) {
    var this$1 = this;

  var map = this.fetchMap(bBank, bMap);
  if (map.loaded) { return; }
  map.loaded = true;
  map.connections.map(function (con) {
    var conMap = this$1.fetchMap(con.bBank, con.bMap);
    switch (con.lType) {
      case OFFSETS.MAP_CONNECTION.LEFT:
        conMap.x = map.x - conMap.width;
        conMap.y = map.y + con.lOffset;
      break;
      case OFFSETS.MAP_CONNECTION.UP:
        conMap.x = map.x + con.lOffset;
        conMap.y = map.y - conMap.height;
      break;
      case OFFSETS.MAP_CONNECTION.RIGHT:
        conMap.x = map.x + map.width;
        conMap.y = map.y + con.lOffset;
      break;
      case OFFSETS.MAP_CONNECTION.DOWN:
        conMap.x = map.x + con.lOffset;
        conMap.y = map.y + map.height;
      break;
    }
    //this.loadWorldMap(con.bBank, con.bMap);
  });
};
Rom.prototype.generateMap = function generateMap (bank, map) {
    var this$1 = this;

  var buffer = this.buffer;
  var bankOffset = this.bankPointers[bank] + map * 4;
  var mapHeaderPointer = readPointer(buffer, bankOffset);
  var offset = mapHeaderPointer;

  // # HEADER
  var pMap = readPointer(buffer, offset); offset += 0x4;
  var pSprites = readPointer(buffer, offset); offset += 0x4;
  var pScript = readPointer(buffer, offset); offset += 0x4;
  var pConnect = readPointer(buffer, offset); offset += 0x4;
  var hSong = readWord(buffer, offset); offset += 0x2;
  var hMap = readWord(buffer, offset); offset += 0x2;

  var bLabelID = readByte(buffer, offset); offset += 0x1;
  var bFlash = readByte(buffer, offset); offset += 0x1;
  var bWeather = readByte(buffer, offset); offset += 0x1;
  var bType = readByte(buffer, offset); offset += 0x1;
  var bUnused1 = readByte(buffer, offset); offset += 0x1;
  var bUnused2 = readByte(buffer, offset); offset += 0x1;
  var bLabelToggle = readByte(buffer, offset); offset += 0x1;
  var bUnused3 = readByte(buffer, offset); offset += 0x1;
  var hdrSize = offset - mapHeaderPointer - 0x8000000;

  // # CONNECTION
  offset = intToPointer(pConnect);
  var pNumConnections = readPointer(buffer, offset); offset += 0x4;
  var pData = readPointer(buffer, offset); offset += 0x4;

  var connections = [];
  for (var ii = 0; ii < pNumConnections; ++ii) {
    offset = intToPointer(pData) + (ii * 0xc);
    var conn = {};
    conn.lType = readPointer(buffer, offset); offset += 0x4;
    conn.lOffset = readLong(buffer, offset); offset += 0x4;
    conn.bBank = readByte(buffer, offset); offset += 0x1;
    conn.bMap = readByte(buffer, offset); offset += 0x1;
    conn.wFiller = readWord(buffer, offset); offset += 0x2;
    connections.push(conn);
  }
  var originalSize = pNumConnections * 12;

  offset = pSprites &0x1FFFFFF;
  // # TILESET DATA
  var bNumNPC = readByte(buffer, offset); offset += 0x1;
  var bNumExits = readByte(buffer, offset); offset += 0x1;
  var bNumTraps = readByte(buffer, offset); offset += 0x1;
  var bNumSigns = readByte(buffer, offset); offset += 0x1;
  var pNPC = readPointer(buffer, offset); offset += 0x4;
  var pExits = readPointer(buffer, offset); offset += 0x4;
  var pTraps = readPointer(buffer, offset); offset += 0x4;
  var pSigns = readPointer(buffer, offset); offset += 0x4;

  // TODO: SpritesNPC etc...

  // # MAP DATA
  offset = pMap;
  var mapWidth = readPointer(buffer, offset); offset += 0x4;
  var mapHeight = readPointer(buffer, offset); offset += 0x4;
  var borderTilePtr = readPointer(buffer, offset); offset += 0x4;
  var mapTilesPtr = readPointer(buffer, offset); offset += 0x4;
  var pMajorTileset = readPointer(buffer, offset); offset += 0x4;
  var pMinorTileset = readPointer(buffer, offset); offset += 0x4;
  var borderWidth = 2; offset += 0x1;
  var borderHeight = 2; offset += 0x1;
  var secondarySize = borderWidth + 0xA0;

  var labelOffset = OFFSETS.MAP_LABEL_DATA + (bLabelID * 8);
  var pMapLabel = readPointer(buffer, labelOffset);
  var mapName = readString(buffer, pMapLabel);

  console.log(("Loading " + mapName + " [" + mapWidth + "x" + mapHeight + "], [" + (connections.length) + "] at " + (toHex(pMap))));

  // # MAP DATA
  var tiles = [];
  var size = mapWidth * mapHeight;
  for (var ii$1 = 0; ii$1 < size; ++ii$1) {
    var xx = (ii$1 % mapWidth) | 0;
    var yy = (ii$1 / mapWidth) | 0;
    var index = (yy * mapWidth + xx) | 0;
    var tile = readWord(buffer, intToPointer(mapTilesPtr) + index * 2);
    tiles.push([tile & 0x3ff, (tile & 0xfc00) >> 10]);
  }

  // # MAP TILESETS [PRIMARY, SECONDARY]
  var majorTileset = this.readTilesetHeader(pMajorTileset);
  var minorTileset = this.readTilesetHeader(pMinorTileset);

  var mainPalCount = OFFSETS.MAIN_TS_PAL_COUNT;
  var mainHeight = OFFSETS.MAIN_TS_HEIGHT;
  var localHeight = OFFSETS.LOCAL_TS_HEIGHT;
  var mainSize = OFFSETS.MAIN_TS_SIZE;
  var localSize = OFFSETS.LOCAL_TS_SIZE;
  var mainBlocks = OFFSETS.MAIN_TS_BLOCKS;
  var localBlocks = OFFSETS.LOCAL_TS_SIZE;

  var baseAnimHeader = 0x497174;
  for (var ii$2 = 0; ii$2 < 53; ++ii$2) {
    var doorAnimHeader = baseAnimHeader + (ii$2 * 0xc);
    var paletteOffset = readPointer(buffer, doorAnimHeader + 0x8);
    var paletteNum = readByte(buffer, paletteOffset);
    var imageOffset = readPointer(buffer, doorAnimHeader + 0x4);
    var palOffset = minorTileset.palettePtr + (paletteNum * 32);
    var img = this$1.getImage(imageOffset, palOffset, 0, 0, 16, 96, true);
    ows.appendChild(img.canvas);
  }

  // # RENDER MAP TILESETS [PRIMARY, SECONDARY]
  var tileData = null;
  (function () {

    var offset = 0;
    var tileSize = 16;
    var width = mapWidth * tileSize;
    var height = mapHeight * tileSize;

    var majorPalettes = 96;

    var ctx = createCanvasBuffer(128, 2560).ctx;

    var paldata = [];

    // # READ PALETTE
    offset = minorTileset.palettePtr;
    for (var ii = 0; ii < 208; ++ii) {
      var palette = readShort(buffer, offset); offset += 0x2;
      paldata[ii] = palette;
    }

    offset = majorTileset.palettePtr;
    for (var ii$1 = 0; ii$1 < 96; ++ii$1) {
      var palette$1 = readShort(buffer, offset); offset += 0x2;
      paldata[ii$1] = palette$1;
    }

    //this.paletteHook(paldata);

    // # READ TILESET
    var blockLimits = [512, 512];
    var tilesetSize = [0x4000, 0x5000];
    var tilesetImageOffsets = [ majorTileset.tilesetImgPtr, minorTileset.tilesetImgPtr ];

    function decode(data) {
      var out = [];
      for (var ii = 0; ii < data.length; ++ii) {
        out.push((data[ii] % 0x10) & 0x7f);
        out.push((data[ii] / 0x10) & 0x7f);
      }
      return out;
    }

    var tiles = [];
    for (var ii$2 = 0; ii$2 < 2; ++ii$2) {
      offset = tilesetImageOffsets[ii$2];
      var bytes = readBytes(buffer, offset, tilesetSize[ii$2]);
      var data = decode(LZ77(bytes, 0));
      for (var jj = 0; jj < data.length; ++jj) { tiles.push(data[jj]); }
      if (ii$2 === 0 && tiles.length < 0x8000) {
        for (var ii$3 = 0; ii$3 < 640; ii$3++) { tiles.push(0x0); }
      }
    }

    // TILE ANIMATIONS
    offset = 0x5059F8;
    var anim = readPointer(buffer, offset);

    // # DECODE PALETTES
    var palettes = [];
    for (var ii$4 = 0; ii$4 < 256; ++ii$4) {
      palettes[ii$4] = decodePalette(paldata[ii$4]);
    }

    // # DRAW TILESET
    var tilesetBlockDataOffset = [ majorTileset.blocksPtr, minorTileset.blocksPtr ];
    var tilesetBehaveDataOffset = [ majorTileset.behavePtr, minorTileset.behavePtr ];
    var x = 0; var y = 0;
    var posX = [0, 8, 0, 8];
    var posY = [0, 0, 8, 8];

    var cw = ctx.canvas.width; var ch = ctx.canvas.height;
    var backgroundImage = new ImageData(cw, ch);
    var foregroundImage = new ImageData(cw, ch);
    var backgroundPixels = backgroundImage.data;
    var foregroundPixels = foregroundImage.data;
    var offset2 = 0;
    var behaviorData = new Uint8Array(cw * ch);
    var backgroundData = new Uint8Array(cw * ch);
    for (var ts = 0; ts < 2; ++ts) {
      offset = tilesetBlockDataOffset[ts];
      offset2 = tilesetBehaveDataOffset[ts];
      for (var ii$5 = 0; ii$5 < blockLimits[ts]; ++ii$5) {
        for (var ly = 0; ly < 2; ++ly) { // 2, bg, fg
          var isBackground = ly === 0;
          var isForeground = ly === 1;
          var bytes$1 = readBytes(buffer, offset2 + ii$5 * 2, 2);
          var behavior = bytes$1[0];
          var background = bytes$1[1];
          for (var tt = 0; tt < 4; ++tt) { // 4 tile based
            var tile = readWord(buffer, offset); offset += 0x2;
            var tileIndex = tile & 0x3FF;
            var flipX = (tile & 0x400) >> 10;
            var flipY = (tile & 0x800) >> 11;
            var palIndex = (tile & 0xF000) >> 12;
            var tileSeeker = tileIndex * 64;
            if (tileSeeker + 64 > tiles.length) { continue; }
            var dx = x * tileSize + posX[tt];
            var dy = y * tileSize + posY[tt];
            if (behavior > 0) {
              behaviorData[dy * cw + dx] = behavior;
            }
            if (background > 0) {
              backgroundData[dy * cw + dx] = background;
            }
            var xx = 0; var yy = 0;
            for (var px = 0; px < 64; ++px) {
              var pixel = tiles[tileSeeker + px];
              if (pixel > 0) {
                var color = palettes[pixel + (palIndex * 16)];
                var ddx = (dx + (flipX > 0 ? (-xx + 7) : xx));
                var ddy = (dy + (flipY > 0 ? (-yy + 7) : yy));
                var index = 4 * (ddy * cw + ddx);

                if (isBackground) {
                  backgroundPixels[index + 0] = color.r;
                  backgroundPixels[index + 1] = color.g;
                  backgroundPixels[index + 2] = color.b;
                  backgroundPixels[index + 3] = 0xff;
                } else {
                  foregroundPixels[index + 0] = color.r;
                  foregroundPixels[index + 1] = color.g;
                  foregroundPixels[index + 2] = color.b;
                  foregroundPixels[index + 3] = 0xff;
                }
              }
              xx++; if (xx === 8) { xx = 0; yy++; }
            }
          }
        }
        if ((++x) === 8) { x = 0; y++; }
      }
    }

    var bg = createCanvasBuffer(128, 2560).ctx;
    var fg = createCanvasBuffer(128, 2560).ctx;

    bg.putImageData(backgroundImage, 0, 0);
    fg.putImageData(foregroundImage, 0, 0);
    //document.body.appendChild(ctx.canvas);
    tileData = {
      behavior: behaviorData,
      background: backgroundData,
      layers: {
        background: bg,
        foreground: fg
      },
      canvas: ctx.canvas
    };
  })();

  var tileSize = 16;

  // # BORDER DATA
  var bw = borderWidth;
  var bh = borderHeight;
  var border = createCanvasBuffer(bw * tileSize, bh * tileSize);
  /*offset = borderTilePtr;
  for (let ii = 0; ii < bw * bh; ++ii) {
    let xx = (ii % bw) | 0;
    let yy = (ii / bw) | 0;
    let value = readShort(buffer, offset + ii * 2);
    let tile = value & 0x3ff;
    let srcX = (tile % 8) * tileSize;
    let srcY = ((tile / 8) | 0) * tileSize;
    let destX = xx * tileSize;
    let destY = yy * tileSize;
    border.ctx.drawImage(
      tileset.canvas,
      srcX, srcY,
      tileSize, tileSize,
      destX, destY,
      tileSize, tileSize
    );
  };*/

  var behavior = new Uint8Array(mapWidth * mapHeight);
  var background = new Uint8Array(mapWidth * mapHeight);
  var attributes = new Uint8Array(mapWidth * mapHeight);

  var layers = [
    createCanvasBuffer(mapWidth * tileSize, mapHeight * tileSize).ctx,
    createCanvasBuffer(mapWidth * tileSize, mapHeight * tileSize).ctx
  ];
  var layerData = [
    tileData.layers.background,
    tileData.layers.foreground
  ];

  // # RENDER MAP
  offset = mapTilesPtr;
  for (var ii$3 = 0; ii$3 < layers.length; ++ii$3) {
    var ctx = layers[ii$3];
    var tileset = layerData[ii$3];
    for (var ii$4 = 0; ii$4 < mapWidth * mapHeight; ++ii$4) {
      var xx$1 = (ii$4 % mapWidth) | 0;
      var yy$1 = (ii$4 / mapWidth) | 0;
      var value = readShort(buffer, offset + ii$4 * 2);
      var tile$1 = value & 0x3FF;
      var attr = value >> 10;
      var tx = (tile$1 % 8) * tileSize;
      var ty = (((tile$1 / 8) | 0) * tileSize);
      var tindex = ty * tileset.canvas.width + tx;
      behavior[ii$4] = tileData.behavior[tindex];
      background[ii$4] = tileData.background[tindex];
      attributes[ii$4] = attr;
      /*if (behavior[ii] === 0x69) {
        let buffer = createCanvasBuffer(16, 16);
        buffer.ctx.drawImage(
          tileset.canvas,
          tx, ty,
          16, 16,
          0, 0,
          16, 16
        );
        console.log(tile);
        ows.appendChild(buffer.canvas);
      }*/
      if (background[ii$4] === 0x10) {
        layers[0].drawImage(
          tileset.canvas,
          tx, ty,
          tileSize, tileSize,
          xx$1 * tileSize, (yy$1 * tileSize),
          tileSize, tileSize
        );
        continue;
      }
      ctx.drawImage(
        tileset.canvas,
        tx, ty,
        tileSize, tileSize,
        xx$1 * tileSize, (yy$1 * tileSize),
        tileSize, tileSize
      );
    }
  }

  // # RENDER MAP
  /*offset = mapTilesPtr;
  for (let ii = 0; ii < mapWidth * mapHeight; ++ii) {
    let xx = (ii % mapWidth) | 0;
    let yy = (ii / mapWidth) | 0;
    let value = readShort(buffer, offset + ii * 2);
    let tile = value & 0x3FF;
    let attr = value >> 10;
    let tx = (tile % 8) * tileSize;
    let ty = (((tile / 8) | 0) * tileSize);
    let tindex = ty * tileset.canvas.width + tx;
    behavior[ii] = tileset.behavior[tindex];
    background[ii] = tileset.background[tindex];
    attributes[ii] = attr;
    ctx.drawImage(
      tileset.canvas,
      tx, ty,
      tileSize, tileSize,
      xx * tileSize, (yy * tileSize),
      tileSize, tileSize
    );
    ctx.globalAlpha = 0.5;
    if (behavior[ii] > 0) {
      ctx.fillStyle = "#8bc34a";
      ctx.fillRect(xx * tileSize, yy * tileSize, 16, 16);
    }
    if (background[ii] > 0) {
      ctx.fillStyle = "#03a9f4";
      ctx.fillRect(xx * tileSize, yy * tileSize, 16, 16);
    }
    if (attributes[ii] === 1 || attributes[ii] === 0xd) {
      ctx.fillStyle = "#f44336";
      ctx.fillRect(xx * tileSize, yy * tileSize, 16, 16);
    }
    ctx.globalAlpha = 1.0;
  };*/

  return {
    id: map,
    bank: bank,
    border: border.ctx,
    name: mapName,
    width: mapWidth,
    height: mapHeight,
    texture: layers,
    behavior: behavior,
    background: background,
    attributes: attributes,
    connections: connections,
    loaded: false, // anti recursion
    x: 0, y: 0
  };

};
Rom.prototype.paletteHook = function paletteHook (palettes) {
  for (var ii = 0; ii < 256; ii++) {
    var r = (0x1E & palettes[ii]) | 0;
    var b = ((0x1E << 0x5) & palettes[ii]) | 0;
    var g = ((0x1E << 0xA) & palettes[ii]) | 0;
    //palettes[ii] = (r | b | g) & 0xff;
  }
};
Rom.prototype.readTilesetHeader = function readTilesetHeader (offset) {
  var buffer = this.buffer;
  var object = {};
  object.compressed = readByte(buffer, offset); offset += 0x1;
  object.primary = readByte(buffer, offset); offset += 0x1;
  offset += 2; // unknown
  object.tilesetImgPtr = readPointer(buffer, offset); offset += 0x4;
  object.palettePtr = readPointer(buffer, offset); offset += 0x4;
  object.blocksPtr = readPointer(buffer, offset); offset += 0x4;
  object.behavePtr = readPointer(buffer, offset); offset += 0x4;
  object.animPtr = readPointer(buffer, offset); offset += 0x4;
  object.blockCount = object.compressed ? OFFSETS.MAIN_TS_BLOCKS : OFFSETS.LOCAL_TS_BLOCKS;
  return object;
};
Rom.prototype.getPkmnString = function getPkmnString () {
  var buffer = this.buffer;
  var string = readString(buffer, OFFSETS.PKMN_STRING);
  return string.substring(0, 7);
};
Rom.prototype.getImage = function getImage (s, p, x, y, w, h, compressed) {
    if ( compressed === void 0 ) compressed = false;

  var buffer = this.buffer;
  var ctx = createCanvasBuffer(w + x, h + y).ctx;
  var palette = readPalette(buffer, p, !!compressed);
  var pixels = readPixels(buffer, s, palette, w, h, !!compressed);
  ctx.putImageData(pixels, x, y);
  return {
    canvas: ctx.canvas,
    data: new Uint8Array(pixels.data)
  };
};
Rom.prototype.getOverworldImgById = function getOverworldImgById (id, frame) {
  var buffer = this.buffer;
  var offset = (OFFSETS.OVERWORLD_BANK + (id * 36));
  offset += 4; // skip ffff
  var paletteNum = readByte(buffer, offset - 2); offset += 0x1;
  offset += 0x3; // unknown
  var width = readByte(buffer, offset); offset += 0x1;
  offset += 0x1; // unknown
  var height = readByte(buffer, offset); offset += 0x1;
  offset += 0x1; // unknown
  offset += 0x1; // unknown
  offset += 0x3; // unknown
  offset += 0x4; // unknown ptr
  offset += 0x4; // unknown ptr
  offset += 0x4; // unknown ptr
  var spritePtr = readPointer(buffer, offset); offset += 0x4;
  offset += 0x4; // unknown ptr

  // get palette, weird stuff
  var palettePtr = 0;
  for (var ii = 0; ii < OFFSETS.OVERWORLD_PAL_COUNT; ++ii) {
    var index = OFFSETS.OVERWORLD_PAL_HEADERS + (ii * 8);
    if (readByte(buffer, index + 4) === paletteNum) {
      palettePtr = readLong(buffer, index) - 0x8000000;
    }
  }

  var pixels = readPointer(buffer, spritePtr + (8 * frame));
  var palette = palettePtr;
  return this.getImage(pixels, palette, 0, 0, width, height, true);
};
Rom.prototype.getPkmnFrontImgById = function getPkmnFrontImgById (id) {
  var buffer = this.buffer;
  var pixels = readPointer(buffer, OFFSETS.PKMN_FRONT_IMG + id * 8);
  var palette = readPointer(buffer, OFFSETS.PKMN_NORMAL_PAL + id * 8);
  return this.getImage(pixels, palette, 0, 0, 64, 64);
};
Rom.prototype.getPkmnBackImgById = function getPkmnBackImgById (id) {
  var buffer = this.buffer;
  var pixels = readPointer(buffer, OFFSETS.PKMN_BACK_IMG + id * 8);
  var palette = readPointer(buffer, OFFSETS.PKMN_NORMAL_PAL + id * 8);
  return this.getImage(pixels, palette, 0, 0, 64, 64);
};
Rom.prototype.getPkmnFrontAnimationImgById = function getPkmnFrontAnimationImgById (id) {
  var buffer = this.buffer;
  var pixels = readPointer(buffer, OFFSETS.PKMN_FRONT_ANIM + id * 8);
  var palette = readPointer(buffer, OFFSETS.PKMN_NORMAL_PAL + id * 8);
  return this.getImage(pixels, palette, 0, -64, 64, 128);
};
Rom.prototype.getPkmnIconImgById = function getPkmnIconImgById (id) {
  var buffer = this.buffer;
  var pixels = readPointer(buffer, OFFSETS.ICON_POINTER_TBL + (id * 4));
  var poffset = OFFSETS.ICON_PALS + (readByte(buffer, OFFSETS.ICON_PAL_TABLE + id) * 32);
  return this.getImage(pixels, poffset, 0, 0, 32, 64, true);
};
Rom.prototype.getItemImageById = function getItemImageById (id) {
  var buffer = this.buffer;
  if (id === 139) {
    //console.log(readPointer(buffer, OFS.ITEM_IMG + id * 8), toHex(readPointer(buffer, OFS.ITEM_IMG + id * 8)));
  }
  var pixels = readPointer(buffer, OFFSETS.ITEM_IMG + id * 8);
  var palette = readPointer(buffer, OFFSETS.ITEM_IMG + (id * 8) + 4);
  return this.getImage(pixels, palette, 0, 0, 24, 24);
};
Rom.prototype.getItemNameById = function getItemNameById (id) {
  var buffer = this.buffer;
  var offset = OFFSETS.ITEM_DATA + id * 44;
  return readString(buffer, offset);
};
Rom.prototype.getAttackNameById = function getAttackNameById (id) {
  var buffer = this.buffer;
  var offset = OFFSETS.ATTACK_NAMES + id * 13;
  return readString(buffer, offset);
};
Rom.prototype.getPkmnNameById = function getPkmnNameById (id) {
  var offset = id * 11;
  var buffer = this.buffer;
  return readString(buffer, OFFSETS.PKMN_NAMES + offset)
};
Rom.prototype.getPkmnCryById = function getPkmnCryById (id) {
  var buffer = this.buffer;
  var cryTbl1 = OFFSETS.CRY_TABLE;
  var cryTbl2 = OFFSETS.CRY_TABLE2;
  var cryConvTbl = OFFSETS.CRY_CONVERSION_TABLE;
  var offset = readPointer(buffer, cryTbl1 + (id * 12) + 4);
  var compressed = 0x1;
  var looped = 0x4000;
  var sampleRate = readInt(buffer, offset + 4) >> 10;
  var loopStart = readInt(buffer, offset + 8);
  var size = readInt(buffer, offset + 12) + 1;
  var bytes = [];
  for (var ii = 0; ii < size; ++ii) {
    var byte = readByte(buffer, offset + 16 + ii);
    bytes.push(byte);
  }
  return bytes;
};
Rom.prototype.generatePkmnString = function generatePkmnString () {
  var string = this.getPkmnString();
  this.names.pkmn = string;
};
Rom.prototype.generateAttackNameTable = function generateAttackNameTable () {
    var this$1 = this;

  var table = this.names.attacks;
  for (var ii = 1; ii <= OFFSETS.ATTACK_COUNT; ++ii) {
    var atk = this$1.getAttackNameById(ii);
    table[ii] = atk;
  }
};
Rom.prototype.generatePkmnNameTable = function generatePkmnNameTable () {
    var this$1 = this;

  var table = this.names.pkmns;
  for (var ii = 1; ii <= OFFSETS.PKMN_COUNT; ++ii) {
    var name = this$1.getPkmnNameById(ii);
    table[ii] = name;
  }
};
Rom.prototype.generatePkmnGraphicTable = function generatePkmnGraphicTable () {
    var this$1 = this;

  var table = this.graphics.pkmns;
  for (var ii = 1; ii <= OFFSETS.PKMN_COUNT; ++ii) {
    var icon = this$1.getPkmnIconImgById(ii);
    var back = this$1.getPkmnBackImgById(ii);
    var front = this$1.getPkmnFrontImgById(ii);
    table.icon[ii] = front;
    table.back[ii] = back;
    table.front[ii] = front;
  }
};
Rom.prototype.generateItemNameTable = function generateItemNameTable () {
    var this$1 = this;

  var table = this.names.items;
  for (var ii = 1; ii <= OFFSETS.ITEM_COUNT; ++ii) {
    var name = this$1.getItemNameById(ii);
    table[ii] = name;
  }
};
Rom.prototype.generateItemGraphicTable = function generateItemGraphicTable () {
    var this$1 = this;

  var table = this.graphics.items;
  for (var ii = 1; ii <= OFFSETS.ITEM_COUNT; ++ii) {
    var item = this$1.getItemImageById(ii);
    table[ii] = item;
  }
};
Rom.prototype.generateFieldEffectGraphicTable = function generateFieldEffectGraphicTable () {
    var this$1 = this;

  var table = this.graphics.effects;
  var palettes = OFFSETS.FIELD_EFFECT_PAL;
  var imgs = OFFSETS.FIELD_EFFECT_IMGS;
  for (var ii = 0; ii < imgs.length; ++ii) {
    var item = imgs[ii];
    var img = this$1.getFieldEffect(item[0], palettes[item[1]], item[2], item[3]);
    table[ii] = img;
    //ows.appendChild(img.canvas);
  }
};
Rom.prototype.getFieldEffect = function getFieldEffect (id, pal, w, h) {
  var buffer = this.buffer;
  var baseOffset = OFFSETS.FIELD_EFFECT_HEADER;
  var basePtr = readPointer(buffer, baseOffset + (id * 0x4));
  var offset = basePtr;
  var tilesTag = readShort(buffer, offset); offset += 0x2;
  var paletteTag = readShort(buffer, offset); offset += 0x2;
  var baseOamPtr = readPointer(buffer, offset); offset += 0x4;
  var animTablePtr = readPointer(buffer, offset); offset += 0x4;
  var imgPtr = readPointer(buffer, offset); offset += 0x4;
  var dummyAffine = readPointer(buffer, offset); offset += 0x4;
  var oamc = readPointer(buffer, offset); offset += 0x4;
  var picTable = readPointer(buffer, imgPtr);
  var pixels = picTable;
  var palette = pal;
  return this.getImage(pixels, palette, 0, 0, w, h, true);
};
Rom.prototype.getDoorAnimation = function getDoorAnimation (id) {
  var buffer = this.buffer;
  var minorTsPalPtr = 0x33a704; // TODO: Dont hardcode this
  var baseAnimHeader = OFFSETS.DOOR_ANIM_HEADER;
  var doorAnimHeader = baseAnimHeader + (id * 0xc);
  var paletteOffset = readPointer(buffer, doorAnimHeader + 0x8);
  var paletteNum = readByte(buffer, paletteOffset);
  var imageOffset = readPointer(buffer, doorAnimHeader + 0x4);
  var palOffset = minorTsPalPtr + (paletteNum * 32);
  return this.getImage(imageOffset, palOffset, 0, 0, 16, 96, true);
};
Rom.prototype.generateDoorAnimationGraphicTable = function generateDoorAnimationGraphicTable () {
  var table = this.graphics.doors;
  for (var ii = 0; ii < 53; ++ii) {
    //table[ii] = this.getDoorAnimation(ii);
    //ows.appendChild(table[ii].canvas);
  }
};
Rom.prototype.generateOverworldGraphicTable = function generateOverworldGraphicTable () {
    var this$1 = this;

  var table = this.graphics.overworlds;
  for (var ii = 0; ii < OFFSETS.OVERWORLD_COUNT; ++ii) {
    var frames = getMaxFrame(ii);
    table[ii] = [];
    for (var frm = 0; frm <= frames; ++frm) {
      if (frames >= 8 && isFrameMirrorable(frm - 1)) {
        var sprite = this$1.getOverworldImgById(ii, frm - 1);
        var ctx = createCanvasBuffer(sprite.canvas.width, sprite.canvas.height).ctx;
        ctx.setTransform(-1, 0, 0, 1, sprite.canvas.width, 0);
        ctx.drawImage(
          sprite.canvas,
          0, 0
        );
        sprite.canvas = ctx.canvas;
        table[ii].push(sprite);
      }
      var sprite$1 = this$1.getOverworldImgById(ii, frm);
      table[ii].push(sprite$1);
    }
    if (frames >= 8) {
      // 10 -> 9
      var tmp = table[ii][9];
      table[ii][9] = table[ii][10];
      table[ii][10] = tmp;
      //if (ii === 0) table[ii].map((sprite) => ows.appendChild(sprite.canvas));
    }
  }
};

console.clear();

var ctx = canvas.getContext("2d");

var width = 0;
var height = 0;

var DIR = {
  DOWN: 0,
  UP: 1,
  LEFT: 2,
  RIGHT: 3
};

function debug(msg) {
  ctx.clearRect(0, 0, width, height);
  var size = 18;
  ctx.font = size + "px Open Sans";
  ctx.fillStyle = "rgba(255,255,255,1)";
  msg = msg.toUpperCase();
  var centerX = ctx.measureText(msg).width;
  var xx = (width / 2) - centerX / 2;
  var yy = (height / 2);
  ctx.fillText(msg, xx, yy);
}

function $(el) {
  return document.querySelector(el);
}

window.rom = null;

readBinaryFile("rom.gba").then(function (buffer) {
  /*if (
    (host[0].charCodeAt(0) !== 109) ||
    (host[1].charCodeAt(0) !== 97) ||
    (host[2].charCodeAt(0) !== 105) ||
    (host[3].charCodeAt(0) !== 101) ||
    (host[4].charCodeAt(0) !== 114)
  ) return;*/
  resize();
  new Rom(buffer, { debug: debug }).then(function (instance) {
    rom = instance;
    init();
  });
});

function zoomScale(x) {
  return (
    x >= 0 ? x + 1 :
    x < 0 ? x + 1 :
    x + 1
  );
}



function init() {
  $(".ui").style.opacity = 1.0;
  resize();
  (function draw() {
    requestAnimationFrame(draw);
    updateEntity(player);
    updateCamera();
    ctx.clearRect(0, 0, width, height);
    drawBackgroundMap();
    drawEntity(player);
    drawEntities();
    drawForegroundMap();
  })();
  console.log(rom.maps);
}

function drawBackgroundMap() {
  for (var key in rom.maps) { drawMap(key, 0); }
}

function drawForegroundMap() {
  for (var key in rom.maps) { drawMap(key, 1); }
}

function drawEntities() {
  for (var ii = 0; ii < entities.length; ++ii) {
    var entity = entities[ii];
    var dx = cx + (entity.x * 16) * cz;
    var dy = cy + ((entity.y) * 16) * cz;
    if (entity.frame >= 4) {
      entity.frame = 0;
      entity.paused = true;
    }
    var frame = entity.frame | 0;
    var sprite = entity.sprite.canvas;
    var sw = sprite.width;
    var sh = sprite.height;
    ctx.drawImage(
      sprite,
      frame, frame * 16,
      16, 16,
      dx, dy,
      16 * cz, 16 * cz
    );
    if (!entity.paused) { entity.frame += 0.1; }
  }
}

function drawEntity(entity) {
  var dx = cx + (entity.x * 16) * cz;
  var dy = cy + ((entity.y - 1) * 16) * cz;
  var map = rom.maps[currentMap];
  var index = ((entity.y + 1 | 0) * map.width + (entity.x | 0));
  // water reflection
  if (
    (entity === player) &&
    (map.behavior[index] === 0x10 ||
    map.behavior[index] === 0x16 ||
    map.behavior[index] === 0x20 ||
    map.behavior[index] === 0x1a ||
    map.behavior[index] === 0x2b)
  ) {
    var sprite = rom.graphics.overworlds[0][entity.frame].canvas;
    var sw = sprite.width;
    var sh = sprite.height;
    ctx.globalAlpha = 0.425;
    var resolution = window.devicePixelRatio;
    ctx.drawImage(
      sprite,
      0, 0,
      sw, sh,
      dx, cy + ((entity.y) * 16) * cz,
      sw * cz, sh * cz
    );
    ctx.globalAlpha = 1.0;
  }
  drawSprite(0, entity.frame, dx, dy);
}

function drawSprite(id, frame, x, y) {
  var sprite = rom.graphics.overworlds[id][frame].canvas;
  var sw = sprite.width;
  var sh = sprite.height;
  ctx.drawImage(
    sprite,
    0, 0,
    sw, sh,
    x, y,
    sw * cz, sh * cz
  );
}

function inView(map) {
  var img = map.texture.canvas;
  var xx = cx + (((map.x - 8) * 16) * cz) | 0;
  var yy = cy + (((map.y - 8) * 16) * cz) | 0;
  var ww = (((map.width + 16) * 16) * cz) | 0;
  var hh = (((map.height + 16) * 16) * cz) | 0;
  return (
    (xx + ww >= 0 && xx <= width) &&
    (yy + hh >= 0 && yy <= height)
  );
}

function drawMap(id, layer) {
  var map = rom.maps[id];
  var img = map.texture[layer].canvas;
  var xx = cx + (((map.x | 0) * 16) * cz) | 0;
  var yy = cy + (((map.y | 0) * 16) * cz) | 0;
  var ww = (img.width * cz) | 0;
  var hh = (img.height * cz) | 0;
  if (!inView(map)) { return; }
  if (map.name === "UNDERWATER") { return; }
  drawBorder(map);
  ctx.drawImage(
    img,
    0, 0,
    img.width, img.height,
    xx, yy,
    ww, hh
  );
  ctx.font = (12 * cz) + "px Open Sans";
  ctx.fillStyle = "#fff";
  ctx.fillText(map.name + " [" + map.bank + ":" + map.id + "]", xx + 16, yy + 16);
}

function hasConnection(map, dir) {
  for (var ii = 0; ii < map.connections.length; ++ii) {
    var con = map.connections[ii];
    switch (con.lType) {
      case OFFSETS.MAP_CONNECTION.LEFT:
        if (dir === DIR.LEFT) { return true; }
      break;
      case OFFSETS.MAP_CONNECTION.UP:
        if (dir === DIR.UP) { return true; }
      break;
      case OFFSETS.MAP_CONNECTION.RIGHT:
        if (dir === DIR.RIGHT) { return true; }
      break;
      case OFFSETS.MAP_CONNECTION.DOWN:
        if (dir === DIR.DOWN) { return true; }
      break;
    }
  }
  return false;
}

function drawBorder(map) {
  var border = map.border;
  var texture = border.canvas;
  var tw = texture.width;
  var th = texture.height;
  var padding = 4;
  var mw = (map.width / 2) | 0;
  var mh = (map.height / 2) | 0;
  // horizontal border
  for (var xx = 0; xx < 4; ++xx) {
    for (var yy = 0; yy < mh; ++yy) {
      if (!hasConnection(map, DIR.LEFT)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + (((map.x - 2 - (xx * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y + (yy * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
      if (!hasConnection(map, DIR.RIGHT)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + ((((map.x + map.width) + (xx * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y + (yy * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
    }
  }
  // vertical border
  for (var yy$1 = 0; yy$1 < 4; ++yy$1) {
    for (var xx$1 = 0; xx$1 < (mw); ++xx$1) {
      if (!hasConnection(map, DIR.UP)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + (((map.x + (xx$1 * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y - 2 - (yy$1 * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
      if (!hasConnection(map, DIR.DOWN)) {
        ctx.drawImage(
          texture,
          0, 0,
          tw, th,
          cx + (((map.x + (xx$1 * 2) | 0) * 16) * cz) | 0,
          cy + ((((map.y + map.height + (yy$1 * 2)) | 0) * 16) * cz) | 0,
          (tw * cz) | 0, (th * cz) | 0
        );
      }
    }
  }
}

window.player = {
  foot: 0,
  frame: 0,
  frameIndex: 0,
  waitMove: 0,
  facing: DIR.DOWN,
  speed: 0.06,
  tx: 8, ty: 8,
  dx: 0, dy: 0,
  vx: 0, vy: 0,
  x: 8, y: 8,
  lock: false
};

window.FREE_CAMERA = false;

var entities = [];

var currentMap = "0:9";

function updateCamera() {
  if (!FREE_CAMERA) {
    cx = (width / 2) - (((player.x * 16) + 8)) * cz;
    cy = (height / 2) - ((((player.y - 1) * 16) + 20)) * cz;
  }
}

function updateEntity(entity) {
  // IEEE 754 hack
  if (entity.x !== entity.tx) { entity.x = Math.round(entity.x * 1e3) / 1e3; }
  if (entity.y !== entity.ty) { entity.y = Math.round(entity.y * 1e3) / 1e3; }
  // is moving
  var isMovingX = entity.vx !== 0;
  var isMovingY = entity.vy !== 0;
  var isMoving = isMovingX || isMovingY;
  var justMovedOneFrame = isMoving && (
    (Math.abs(entity.tx - entity.x) < 0.2 && Math.abs(entity.tx - entity.x) > 0.0) ||
    (Math.abs(entity.ty - entity.y) < 0.2 && Math.abs(entity.ty - entity.y) > 0.0)
  );
  var didntMoveYet = isMoving && (
    (Math.abs(entity.tx - entity.x) >= 1.0) ||
    (Math.abs(entity.ty - entity.y) >= 1.0)
  );
  // reached half of destination
  var reachedHalfX = Math.abs(entity.tx - entity.x) <= 0.5;
  var reachedHalfY = Math.abs(entity.ty - entity.y) <= 0.5;
  // reached destination
  var reachedDestX = (
    (entity.tx > entity.x && entity.x + entity.speed >= entity.tx) ||
    (entity.tx < entity.x && entity.x - entity.speed <= entity.tx)
  );
  var reachedDestY = (
    (entity.ty > entity.y && entity.y + entity.speed >= entity.ty) ||
    (entity.ty < entity.y && entity.y - entity.speed <= entity.ty)
  );
  // get the moved to tile
  // - round up if positive
  // - round down if negative
  var nextTileX = (
    entity.vx > 0 ? Math.ceil(entity.x) : (entity.x | 0)
  );
  var nextTileY = (
    entity.vy > 0 ? Math.ceil(entity.y) : (entity.y | 0)
  );

  // stop moving
  if (reachedDestX) {
    entity.x = entity.tx;
    entity.vx = 0;
    entity.foot = !entity.foot | 0;
  }
  else if (reachedDestY) {
    entity.y = entity.ty;
    entity.vy = 0;
    entity.foot = !entity.foot | 0;
  }
  // half tile walk foot
  if (isMovingX) { entity.frameIndex = (!reachedHalfX) | 0; }
  if (isMovingY) { entity.frameIndex = (!reachedHalfY) | 0; }

  var map = rom.maps[currentMap];
  var index = (Math.ceil(entity.y) * map.width + Math.ceil(entity.x));
  // water ripple step
  if (
    map.behavior[index] === 0x16 &&
    justMovedOneFrame
  ) {
    entities.push({
      x: Math.ceil(player.x),
      y: Math.ceil(player.y),
      frame: 0,
      sprite: rom.graphics.effects[1]
    });
  }
  // stepping into grass
  if (
    justMovedOneFrame &&
    map.behavior[(nextTileY * map.width + nextTileX)] === 0x2
  ) {
    entities.push({
      x: nextTileX,
      y: nextTileY,
      frame: 0,
      sprite: rom.graphics.effects[0]
    });
  }

  // border jump
  if (didntMoveYet) {
    var index$1 = (entity.ty * map.width + entity.tx) | 0;
    var behavior = map.behavior[index$1];
    if (behavior === 0x3b) {
      if (entity.ty > entity.y) {
        entity.ty = entity.ty + 1;
        entity.y = entity.ty | 0;
        entity.vy = 0;
      } else {
        stopMove(entity);
      }
      /*if (isMovingX) {
        if (entity.tx > entity.x) {
          entity.x = entity.tx = entity.tx;
        }
        else {
          entity.x = entity.tx = entity.tx;
        }
        entity.vx = 0;
      }*/
    }
  }

  // move be velocity
  if (isMovingX) { entity.x += entity.vx; }
  else if (isMovingY) { entity.y += entity.vy; }

  updateFrame(entity);
}

function stopMove(entity) {
  entity.vx = 0;
  entity.vy = 0;
  entity.tx = entity.x | 0;
  entity.ty = entity.y | 0;
  entity.frameIndex = 0;
}

function updateFrame(entity) {
  var facing = entity.facing;
  var foot = entity.foot;
  var index = entity.frameIndex;
  // stand step
  if (entity.waitMove <= FACE_TIME && entity.waitMove >= FACE_TIME - 2) {
    index = 1;
    foot = !entity.foot | 0;
  }
  entity.frame = (((index) * (5 - (foot))) + (((index) + 1) * facing));
  entity.waitMove--;
}

function isBlocked(x, y) {
  var map = rom.maps[currentMap];
  var index = (y * map.width + x) | 0;
  var attr = map.attributes[index];
  var behavior = map.behavior[index];
  return (
    (x < 0 || x >= map.width) ||
    (y < 0 || y >= map.height) ||
    (attr === 1 || attr === 0xd) &&
    (behavior !== 0x3b)

  );
}

function isMoving(entity) {
  return (
    !entity.lock &&
    (entity.x !== entity.tx ||
    entity.y !== entity.ty)
  );
}

var FACE_TIME = 8;

function moveEntity(entity, dir, duration) {
  if (!isMoving(entity) && entity.facing !== dir) {
    entity.facing = dir;
    entity.foot = !entity.foot | 0;
    if (duration <= FACE_TIME) {
      entity.waitMove = FACE_TIME;
    }
  }
  if (entity.waitMove > 0 || isMoving(entity)) { return; }
  if (dir === DIR.DOWN && !isBlocked(entity.x, entity.y + 1)) {
    entity.ty = entity.y + 1;
    entity.vy += (entity.ty - entity.y) * entity.speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.UP && !isBlocked(entity.x, entity.y - 1)) {
    entity.ty = entity.y - 1;
    entity.vy += (entity.ty - entity.y) * entity.speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.LEFT && !isBlocked(entity.x - 1, entity.y)) {
    entity.tx = entity.x - 1;
    entity.vx += (entity.tx - entity.x) * entity.speed;
    entity.waitMove = 0;
  }
  if (dir === DIR.RIGHT && !isBlocked(entity.x + 1, entity.y)) {
    entity.tx = entity.x + 1;
    entity.vx += (entity.tx - entity.x) * entity.speed;
    entity.waitMove = 0;
  }
}

var keys = {};
window.addEventListener("keydown", function (e) {
  if (!keys[e.key]) { keys[e.key] = 1; }
  keys[e.key] = 1;
  updateKeys();
});
window.addEventListener("keyup", function (e) {
  if (!keys[e.key]) { keys[e.key] = 1; }
  keys[e.key] = 0;
  updateKeys();
});

function updateKeys() {
  var down = keys["s"] || keys["ArrowDown"];
  var up = keys["w"] || keys["ArrowUp"];
  var left = keys["a"] || keys["ArrowLeft"];
  var right = keys["d"] || keys["ArrowRight"];
  if (down) { moveEntity(player, DIR.DOWN, down); }
  if (up) { moveEntity(player, DIR.UP, up); }
  if (left) { moveEntity(player, DIR.LEFT, left); }
  if (right) { moveEntity(player, DIR.RIGHT, right); }
  for (var key in keys) {
    if (keys[key] > 0) { keys[key] += 1; }
  }
}

setInterval(updateKeys, 1e3 / 60);

var down = false;
window.addEventListener("mouseup", function (e) { return down = false; });
window.addEventListener("mousedown", function (e) {
  down = true;
  lx = e.clientX; ly = e.clientY;
});

var lx = 0; var ly = 0;
window.addEventListener("mousemove", function (e) {
  var x = e.clientX;
  var y = e.clientY;
  if (!down) {
    lx = x; ly = y;
    return;
  }
  cx -= lx - x; cy -= ly - y;
  lx = x; ly = y;
});

function roundTo(a, b) {
  b = 1 / (b);
  return (Math.round(a * b) / b);
}

window.cz = 6.5;
window.cx = 0; window.cy = 0;
window.addEventListener("mousewheel", function (e) {
  var dir = e.deltaY > 0 ? -1 : 1;
  cz = cz + (dir * 0.25) * (zoomScale(cz) * 0.3);
  if (cz <= 0.1) { cz = 0.1; }
  cz = roundTo(cz, 0.125);
  updateCamera();
});

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width;
  canvas.height = height;
  var resolution = window.devicePixelRatio;
  canvas.width = width * resolution;
  canvas.height = height * resolution;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  resetTransformation();
  setImageSmoothing(ctx, false);
}

function resetTransformation() {
  var resolution = window.devicePixelRatio;
  ctx.setTransform(resolution, 0, 0, resolution, 0, 0);
}

window.addEventListener("resize", resize);

window.addEventListener("contextmenu", function (e) {
  if (e.target === canvas) { e.preventDefault(); }
});

}());
