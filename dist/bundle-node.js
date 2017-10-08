'use strict';

const OFFSETS = {
  GAME_CODE: 0xAC,
  GAME_NAME: 0xA0,
  GAME_MAKER: 0xB0,
  PKMN_NAMES: 0x245EE0,
  PKMN_FRONT_IMG: 0x2350AC,
  PKMN_NORMAL_PAL: 0x23730C
};

const IS_NODE = typeof window === "undefined";


function assert(truth) {
  if (!truth) throw new Error("Assert exception!");
}

function readBinaryFileSync(path) {
  if (IS_NODE) return require("fs").readFileSync(path);  
  let req = new XMLHttpRequest();
  req.responseType = "arraybuffer";
  req.open("GET", "./static/" + path, false);
  req.send(null);
  return req.response;
}

function decodeCharByte(byte) {
  switch (byte) {
    case 0x00: return ` `;
    case 0x01: return `À`;
    case 0x02: return `Á`;
    case 0x03: return `Â`;
    case 0x04: return `Ç`;
    case 0x05: return `È`;
    case 0x06: return `É`;
    case 0x07: return `Ê`;
    case 0x08: return `Ë`;
    case 0x09: return `Ì`;
    case 0x0B: return `Î`;
    case 0x0C: return `Ï`;
    case 0x0D: return `Ò`;
    case 0x0E: return `Ó`;
    case 0x0F: return `Ô`;
    case 0x10: return `Œ`;
    case 0x11: return `Ù`;
    case 0x12: return `Ú`;
    case 0x13: return `Û`;
    case 0x14: return `Ñ`;
    case 0x15: return `ß`;
    case 0x16: return `à`;
    case 0x17: return `á`;
    case 0x19: return `ç`;
    case 0x1A: return `è`;
    case 0x1B: return `é`;
    case 0x1C: return `ê`;
    case 0x1D: return `ë`;
    case 0x1E: return `ì`;
    case 0x20: return `î`;
    case 0x21: return `ï`;
    case 0x22: return `ò`;
    case 0x23: return `ó`;
    case 0x24: return `ô`;
    case 0x25: return `œ`;
    case 0x26: return `ù`;
    case 0x27: return `ú`;
    case 0x28: return `û`;
    case 0x29: return `ñ`;
    case 0x2A: return `º`;
    case 0x2B: return `ª`;
    case 0x2D: return `&`;
    case 0x2E: return `+`;
    case 0x34: return `[Lv]`;
    case 0x35: return `=`;
    case 0x36: return `;`;
    case 0x51: return `¿`;
    case 0x52: return `¡`;
    case 0x53: return `[pk]`;
    case 0x54: return `[mn]`;
    case 0x55: return `[po]`;
    case 0x56: return `[ké]`;
    case 0x57: return `[bl]`;
    case 0x58: return `[oc]`;
    case 0x59: return `[k]`;
    case 0x5A: return `Í`;
    case 0x5B: return `%`;
    case 0x5C: return `(`;
    case 0x5D: return `)`;
    case 0x68: return `â`;
    case 0x6F: return `í`;
    case 0x79: return `[U]`;
    case 0x7A: return `[D]`;
    case 0x7B: return `[L]`;
    case 0x7C: return `[R]`;
    case 0x85: return `<`;
    case 0x86: return `>`;
    case 0xA1: return `0`;
    case 0xA2: return `1`;
    case 0xA3: return `2`;
    case 0xA4: return `3`;
    case 0xA5: return `4`;
    case 0xA6: return `5`;
    case 0xA7: return `6`;
    case 0xA8: return `7`;
    case 0xA9: return `8`;
    case 0xAA: return `9`;
    case 0xAB: return `!`;
    case 0xAC: return `?`;
    case 0xAD: return `.`;
    case 0xAE: return `-`;
    case 0xAF: return `·`;
    case 0xB0: return `...`;
    case 0xB1: return `«`;
    case 0xB2: return `»`;
    case 0xB3: return `'`;
    case 0xB4: return `'`;
    case 0xB5: return `|m|`;
    case 0xB6: return `|f|`;
    case 0xB7: return `$`;
    case 0xB8: return `,`;
    case 0xB9: return `*`;
    case 0xBA: return `/`;
    case 0xBB: return `A`;
    case 0xBC: return `B`;
    case 0xBD: return `C`;
    case 0xBE: return `D`;
    case 0xBF: return `E`;
    case 0xC0: return `F`;
    case 0xC1: return `G`;
    case 0xC2: return `H`;
    case 0xC3: return `I`;
    case 0xC4: return `J`;
    case 0xC5: return `K`;
    case 0xC6: return `L`;
    case 0xC7: return `M`;
    case 0xC8: return `N`;
    case 0xC9: return `O`;
    case 0xCA: return `P`;
    case 0xCB: return `Q`;
    case 0xCC: return `R`;
    case 0xCD: return `S`;
    case 0xCE: return `T`;
    case 0xCF: return `U`;
    case 0xD0: return `V`;
    case 0xD1: return `W`;
    case 0xD2: return `X`;
    case 0xD3: return `Y`;
    case 0xD4: return `Z`;
    case 0xD5: return `a`;
    case 0xD6: return `b`;
    case 0xD7: return `c`;
    case 0xD8: return `d`;
    case 0xD9: return `e`;
    case 0xDA: return `f`;
    case 0xDB: return `g`;
    case 0xDC: return `h`;
    case 0xDD: return `i`;
    case 0xDE: return `j`;
    case 0xDF: return `k`;
    case 0xE0: return `l`;
    case 0xE1: return `m`;
    case 0xE2: return `n`;
    case 0xE3: return `o`;
    case 0xE4: return `p`;
    case 0xE5: return `q`;
    case 0xE6: return `r`;
    case 0xE7: return `s`;
    case 0xE8: return `t`;
    case 0xE9: return `u`;
    case 0xEA: return `v`;
    case 0xEB: return `w`;
    case 0xEC: return `x`;
    case 0xED: return `y`;
    case 0xEE: return `z`;
    case 0xEF: return `|>|`;
    case 0xF0: return `:`;
    case 0xF1: return `Ä`;
    case 0xF2: return `Ö`;
    case 0xF3: return `Ü`;
    case 0xF4: return `ä`;
    case 0xF5: return `ö`;
    case 0xF6: return `ü`;
    case 0xF7: return `|A|`;
    case 0xF8: return `|V|`;
    case 0xF9: return `|<|`;
    case 0xFA: return `|nb|`;
    case 0xFB: return `|nb2|`;
    case 0xFC: return `|FC|`;
    case 0xFD: return `|FD|`;
    case 0xFE: return `|br|`;
    case 0xFF: return `|end|`;
  }
  return "";
}

const I8 = Int8Array.BYTES_PER_ELEMENT;




function readByte(buffer, offset) {
  return (
    buffer[offset] & 0xff
  );
}



function readInt(buffer, offset) {
  return (
    (buffer[offset + 0] << 0)  |
    (buffer[offset + 1] << 8)  |
    (buffer[offset + 2] << 16) |
    (buffer[offset + 3] << 24)
  );
}

function readPointer(buffer, offset) {
  return (
    readInt(buffer, offset) & 0x1FFFFFF
  );
}

function readPointerAsInt(buffer, offset) {
  return (
    readPointer(buffer, offset) | 0
  );
}

function readChar(buffer, offset) {
  return decodeCharByte(readByte(buffer, offset));
}

function readBytes(buffer, offset, length) {
  let data = new Uint8Array(length);
  for (let ii = 0; ii < length; ++ii) {
    data[ii] = readByte(buffer, offset + ii * I8);
  }
  return data;
}







function readString(buffer, offset) {
  let ii = 0;
  let chars = [];
  let char = readChar(buffer, offset);
  while (char !== "|end|") {
    chars.push(char);
    char = readChar(buffer, offset + (++ii));
  }
  return chars.join("");
}

function readBinaryString(buffer, offset, length) {
  let data = [];
  for (let ii = 0; ii < length; ++ii) {
    let char = readByte(buffer, offset + ii);
    data[ii] = String.fromCharCode(char);
  }
  return data.join("");
}

class Rom {
  constructor(buffer) {
    assert(buffer instanceof Buffer);
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
    this.code = readBinaryString(buffer, OFFSETS.GAME_CODE, 4);
    this.name = readBinaryString(buffer, OFFSETS.GAME_NAME, 4);
    this.maker = readBinaryString(buffer, OFFSETS.GAME_MAKER, 2);
    this.generatePkmnNameTable();
    this.getPkmnFrontImgById(1);
    this.test();
  }
  getPkmnNameById(id) {
    let offset = id * 11;
    let buffer = this.buffer;
    return readString(buffer, OFFSETS.PKMN_NAMES + offset)
  }
  getPkmnFrontImgById(id) {
    let buffer = this.buffer;
    let soffset = OFFSETS.PKMN_FRONT_IMG + id * 8; // img
    let poffset = OFFSETS.PKMN_NORMAL_PAL + id * 8; // palette
    let size = 64 * 64;
    let ptr = readInt(buffer, soffset) - 0x8000000;
    let bytes = readBytes(buffer, ptr, size);
    let data = lz77(bytes.buffer);
    for (let ii = 0; ii < data.length; ++ii) {
      if (data[ii] !== 0) console.log(data[ii]);
    }
  }
  generatePkmnNameTable() {
    let table = this.names.pkmn;
    for (let ii = 1; ii <= 151; ++ii) {
      let name = this.getPkmnNameById(ii);
      table[ii] = name;
    }
  }
  test() {
    let buffer = this.buffer;
    let itemImageDataPtr = 0x3D4294;
    let imgPtr = readPointerAsInt(itemImageDataPtr + 0);
    let palettePtr = readPointerAsInt(itemImageDataPtr + 4);
    //console.log(readBytes(buffer, itemImageDataPtr, 10));
    //console.log(readBytes(buffer, imgPtr, 10));
  }
}

function lz77(buffer) {
  var view = new DataView(buffer);
  var compType = view.getUint8(0);
  var size = view.getUint32(0, true) >> 8;
console.log(size);
  var targ = new ArrayBuffer(size);
  var targA = new Uint8Array(targ);

  var off = 4;
  var dOff = 0;
  var eof = buffer.byteLength;
  while (off < eof) {
    var flag = view.getUint8(off++);
    for (var j = 7; j >= 0; j--) {
      if (off >= eof) break;
      if ((flag >> j) & 1) { //1=compressed, 2=raw byte
        var dat = view.getUint16(off);
        off += 2;
        var cOff = (dOff - (dat & 4095)) - 1;
        var len = (dat >> 12) + 3;

        for (var k = 0; k < len; k++) {
          targA[dOff++] = targA[cOff++];
        }

      } else {
        targA[dOff++] = view.getUint8(off++);
      }
    }
  }
  return targA;
}

console.clear();

let rom = new Rom(readBinaryFileSync("rom.gba"));
