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
  readHWord,
  readShort,
  readByte,
  readBytes,
  readString,
  readPointer,
  readPointerAsInt,
  readBinaryString,
  readPalette,
  readPixels,
  intToPointer,
  decodePalette
} from "./rom-read";

import {
  LZ77,
  toHex,
  getMaxFrame,
  searchString,
  isFrameMirrorable
} from "./rom-utils";

import { OFFSETS as OFS } from "./offsets";

export default class Rom {
  constructor(buffer, opt = {}) {
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
      items: {},
      berries: {},
      pkmns: {
        back: {},
        front: {},
        icon: {}
      },
      overworlds: {}
    };
    this.maps = {};
    this.bankPointers = [];
    this.mapInBanksCount = [];
    return new Promise((resolve) => {
      this.init().then(() => resolve(this));
    });
  }
  init(resolve) {
    let buffer = this.buffer;
    this.code = readBinaryString(buffer, OFS.GAME_CODE, 4);
    this.name = readBinaryString(buffer, OFS.GAME_NAME, 4);
    this.maker = readBinaryString(buffer, OFS.GAME_MAKER, 2);
    assert(this.code === "BPEE"); // emerald rom
    return new Promise((resolve) => {
      this.generateTables().then(resolve);
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
  }
  generateTables() {
    let tasks = [];
    tasks.push(this.generatePkmnString, `Generating Pkmn String...`);
    tasks.push(this.generateItemNameTable, `Generating Item Name Table...`);
    tasks.push(this.generatePkmnNameTable, `Generating Pkmn Name Table...`);
    tasks.push(this.generateAttackNameTable, `Generating Attack Name Table...`);
    tasks.push(this.generatePkmnGraphicTable, `Generating Pkmn Graphic Table...`);
    tasks.push(this.generateItemGraphicTable, `Generating Item Graphic Table...`);
    tasks.push(this.generateBerryGraphicTable, `Generating Berry Graphic Table...`);
    tasks.push(this.generateOverworldGraphicTable, `Generating Overworld Graphic Table...`);
    tasks.push(this.generateMaps, `Generating World Map...`);
    tasks.push(() => {}, `Finished!`);
    return new Promise((resolve) => {
      let self = this;
      (function nextTask() {
        if (!tasks.length) return;
        let task = tasks.shift();
        let desc = tasks.shift();
        self.options.debug(desc);
        setTimeout(() => {
          task.call(self, []);
          !tasks.length ? resolve() : nextTask();
        });
      })();
    });
  }
  generateMaps() {
    for (let ii = 0; ii < OFS.MAP_BANK_POINTERS.length; ++ii) {
      this.mapInBanksCount[ii] = OFS.MAPS_IN_BANK[ii];
      this.bankPointers[ii] = OFS.MAP_BANK_POINTERS[ii];
    };
    this.loadWorldMap(0, 9);
  }
  fetchMap(bBank, bMap) {
    let id = bBank + ":" + bMap;
    return (
      this.maps[id] ||
      (this.maps[id] = this.generateMap(bBank, bMap))
    );
  }
  loadWorldMap(bBank, bMap, resolve) {
    let map = this.fetchMap(bBank, bMap);
    if (map.loaded) return;
    map.loaded = true;
    map.connections.map(con => {
      let conMap = this.fetchMap(con.bBank, con.bMap);
      switch (con.lType) {
        case OFS.MAP_CONNECTION.LEFT:
          conMap.x = map.x - conMap.width;
          conMap.y = map.y + con.lOffset;
        break;
        case OFS.MAP_CONNECTION.UP:
          conMap.x = map.x + con.lOffset;
          conMap.y = map.y - conMap.height;
        break;
        case OFS.MAP_CONNECTION.RIGHT:
          conMap.x = map.x + map.width;
          conMap.y = map.y + con.lOffset;
        break;
        case OFS.MAP_CONNECTION.DOWN:
          conMap.x = map.x + con.lOffset;
          conMap.y = map.y + map.height;
        break;
      };
      this.loadWorldMap(con.bBank, con.bMap, resolve);
    });
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

    let connections = [];
    for (let ii = 0; ii < pNumConnections; ++ii) {
      offset = intToPointer(pData) + (ii * 0xc);
      let conn = {};
      conn.lType = readPointer(buffer, offset); offset += 0x4;
      conn.lOffset = readLong(buffer, offset); offset += 0x4;
      conn.bBank = readByte(buffer, offset); offset += 0x1;
      conn.bMap = readByte(buffer, offset); offset += 0x1;
      conn.wFiller = readWord(buffer, offset); offset += 0x2;
      connections.push(conn);
    };
    let originalSize = pNumConnections * 12;

    offset = pSprites &0x1FFFFFF;
    // # TILESET DATA
    let bNumNPC = readByte(buffer, offset); offset += 0x1;
    let bNumExits = readByte(buffer, offset); offset += 0x1;
    let bNumTraps = readByte(buffer, offset); offset += 0x1;
    let bNumSigns = readByte(buffer, offset); offset += 0x1;
    let pNPC = readPointer(buffer, offset); offset += 0x4;
    let pExits = readPointer(buffer, offset); offset += 0x4;
    let pTraps = readPointer(buffer, offset); offset += 0x4;
    let pSigns = readPointer(buffer, offset); offset += 0x4;

    // TODO: SpritesNPC etc...

    // # MAP DATA
    offset = pMap;
    let mapWidth = readPointer(buffer, offset); offset += 0x4;
    let mapHeight = readPointer(buffer, offset); offset += 0x4;
    let borderTilePtr = readPointer(buffer, offset); offset += 0x4;
    let mapTilesPtr = readPointer(buffer, offset); offset += 0x4;
    let pMajorTileset = readPointer(buffer, offset); offset += 0x4;
    let pMinorTileset = readPointer(buffer, offset); offset += 0x4;
    let borderWidth = 2; offset += 0x1;
    let borderHeight = 2; offset += 0x1;
    let secondarySize = borderWidth + 0xA0;

    let labelOffset = OFS.MAP_LABEL_DATA + (bLabelID * 8);
    let pMapLabel = readPointer(buffer, labelOffset);
    let mapName = readString(buffer, pMapLabel);

    console.log(`Loading ${mapName} [${mapWidth}x${mapHeight}], [${connections.length}] at ${toHex(pMap)}`);

    // # MAP DATA
    let tiles = [];
    let size = mapWidth * mapHeight;
    for (let ii = 0; ii < size; ++ii) {
      let xx = (ii % mapWidth) | 0;
      let yy = (ii / mapWidth) | 0;
      let index = (yy * mapWidth + xx) | 0;
      let tile = readWord(buffer, intToPointer(mapTilesPtr) + index * 2);
      tiles.push([tile & 0x3ff, (tile & 0xfc00) >> 10]);
    };

    // # MAP TILESETS [PRIMARY, SECONDARY]
    let majorTileset = this.readTilesetHeader(pMajorTileset);
    let minorTileset = this.readTilesetHeader(pMinorTileset);

    let mainPalCount = OFS.MAIN_TS_PAL_COUNT;
    let mainHeight = OFS.MAIN_TS_HEIGHT;
    let localHeight = OFS.LOCAL_TS_HEIGHT;
    let mainSize = OFS.MAIN_TS_SIZE;
    let localSize = OFS.LOCAL_TS_SIZE;
    let mainBlocks = OFS.MAIN_TS_BLOCKS;
    let localBlocks = OFS.LOCAL_TS_SIZE;

    // # RENDER MAP TILESETS [PRIMARY, SECONDARY]
    let tileset = null;
    (() => {

      let offset = 0;
      let tileSize = 16;
      let width = mapWidth * tileSize;
      let height = mapHeight * tileSize;

      let majorPalettes = 96;

      let ctx = createCanvasBuffer(128, 2560).ctx;
      let tilesetImg = ctx.canvas;

      let paldata = [];

      // # READ PALETTE

      offset = minorTileset.palettePtr;
      for (let ii = 0; ii < 208; ++ii) {
        let palette = readShort(buffer, offset); offset += 0x2;
        paldata[ii] = palette;
      };

      offset = majorTileset.palettePtr;
      for (let ii = 0; ii < 96; ++ii) {
        let palette = readShort(buffer, offset); offset += 0x2;
        paldata[ii] = palette;
      };

      this.paletteHook(paldata);

      // # READ TILESET
      let blockLimits = [512, 512];
      let tilesetSize = [0x4000, 0x5000];
      let tilesetImageOffsets = [ majorTileset.tilesetImgPtr, minorTileset.tilesetImgPtr ];

      function decode(data) {
        let out = [];
        for (let ii = 0; ii < data.length; ++ii) {
          out.push((data[ii] % 0x10) & 0x7f);
          out.push((data[ii] / 0x10) & 0x7f);
        };
        return out;
      };

      let tiles = [];
      for (let ii = 0; ii < 2; ++ii) {
        offset = tilesetImageOffsets[ii];
        let bytes = readBytes(buffer, offset, tilesetSize[ii]);
        let data = decode(LZ77(bytes, 0));
        for (let jj = 0; jj < data.length; ++jj) tiles.push(data[jj]);
        if (ii === 0 && tiles.length < 0x8000) {
          for (let ii = 0; ii < 640; ii++) { tiles.push(0x0); };
        }
      };

      // TILE ANIMATIONS
      //console.log(readBytes(buffer, readPointer(buffer, 0x84F8738), 256));
      offset = 0x5059F8;
      let anim = readPointer(buffer, offset);
      console.log(readBytes(buffer, anim, 96));
      /*console.log(readBytes(buffer, offset, 256));
      console.log(readBytes(buffer, offset + 16, 256));
      console.log(readBytes(buffer, readPointer(buffer, offset + 16), 256));
      console.log("---------------------");
*/
      // STRUCTURE:
      /*
        .2byte 0xFFFF @ tiles tag
        .2byte 0x1005 @ palette tag
        .4byte gFieldObjectBaseOam_16x16
        .4byte gFieldEffectObjectImageAnimTable_TallGrass
        .4byte gFieldEffectObjectPicTable_TallGrass
        .4byte gDummySpriteAffineAnimTable
        .4byte unc_grass_normal
      */

      // # DECODE PALETTES
      let palettes = [];
      for (let ii = 0; ii < 256; ++ii) {
        palettes[ii] = decodePalette(paldata[ii]);
      };

      // # DRAW TILESET
      let tilesetBlockDataOffset = [ majorTileset.blocksPtr, minorTileset.blocksPtr ];
      let x = 0; let y = 0;
      let posX = [0, 8, 0, 8];
      let posY = [0, 0, 8, 8];

      let cw = ctx.canvas.width; let ch = ctx.canvas.height;
      let imgData = new ImageData(cw, ch);
      let pixels = imgData.data;
      for (let ts = 0; ts < 2; ++ts) {
        offset = tilesetBlockDataOffset[ts];
        for (let ii = 0; ii < blockLimits[ts]; ++ii) {
          for (let ly = 0; ly < 2; ++ly) { // 2, bg, fg
            for (let tt = 0; tt < 4; ++tt) { // 4 tile based
              let tile = readShort(buffer, offset); offset += 0x2;
              let tileIndex = tile & 0x3FF;
              let flipX = ((tile & 0x400) >> 10) === 1;
              let flipY = ((tile & 0x800) >> 11) === 1;
              let palIndex = (tile & 0xF000) >> 12;
              let tileSeeker = tileIndex * 64;
              if (tileSeeker + 64 > tiles.length) continue;
              let dx = x * tileSize + posX[tt];
              let dy = y * tileSize + posY[tt];
              let xx = 0; let yy = 0 ;
              for (let px = 0; px < 64; ++px) {
                let pixel = tiles[tileSeeker + px];
                if (pixel > 0) {
                  let color = palettes[pixel + (palIndex * 16)];
                  let ddx = (dx + (flipX ? (-xx + 7) : xx));
                  let ddy = (dy + (flipY ? (-yy + 7) : yy));
                  let index = 4 * (ddy * cw + ddx);
                  pixels[index + 0] = color.r;
                  pixels[index + 1] = color.g;
                  pixels[index + 2] = color.b;
                  pixels[index + 3] = 0xff;
                }
                xx++; if (xx == 8) { xx = 0; yy++; }
              };
            };
          };
          if ((++x) == 8) { x = 0; y++; }
        };
      };
      ctx.putImageData(imgData, 0, 0);
      //document.body.appendChild(ctx.canvas);
      tileset = ctx;
    })();

    let tileSize = 16;

    // # BORDER DATA
    let bw = borderWidth;
    let bh = borderHeight;
    let border = createCanvasBuffer(bw * tileSize, bh * tileSize);
    offset = borderTilePtr;
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
    };

    let ctx = createCanvasBuffer(mapWidth * tileSize, mapHeight * tileSize).ctx;
    // # RENDER MAP
    offset = mapTilesPtr;
    for (let ii = 0; ii < mapWidth * mapHeight; ++ii) {
      let xx = (ii % mapWidth) | 0;
      let yy = (ii / mapWidth) | 0;
      let value = readShort(buffer, offset + ii * 2);
      let tile = value & 0x3FF;
      let attr = value >> 10;
      ctx.drawImage(
        tileset.canvas,
        (tile % 8) * tileSize, (((tile / 8) | 0) * tileSize),
        tileSize, tileSize,
        xx * tileSize, (yy * tileSize),
        tileSize, tileSize
      );
      if (attr === 1 || attr === 0xd) {
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = "red";
        ctx.fillRect(xx * tileSize, yy * tileSize, 16, 16);
        ctx.globalAlpha = 1.0;
      }
    };

    return {
      id: map,
      bank: bank,
      border: border.ctx,
      name: mapName,
      width: mapWidth,
      height: mapHeight,
      texture: ctx,
      connections: connections,
      loaded: false, // anti recursion
      x: 0, y: 0
    };

  }
  paletteHook(palettes) {
    for (let ii = 0; ii < 256; ii++) {
      let r = (0x1E & palettes[ii]) | 0;
      let b = ((0x1E << 0x5) & palettes[ii]) | 0;
      let g = ((0x1E << 0xA) & palettes[ii]) | 0;
      //palettes[ii] = (r | b | g) & 0xff;
    }
  }
  readTilesetHeader(offset) {
    let buffer = this.buffer;
    let object = {};
    object.compressed = readByte(buffer, offset); offset += 0x1;
    object.primary = readByte(buffer, offset); offset += 0x1;
    offset += 2; // unknown
    object.tilesetImgPtr = readPointer(buffer, offset); offset += 0x4;
    object.palettePtr = readPointer(buffer, offset); offset += 0x4;
    object.blocksPtr = readPointer(buffer, offset); offset += 0x4;
    object.animPtr = readPointer(buffer, offset); offset += 0x4;
    object.behavePtr = readPointer(buffer, offset); offset += 0x4;
    object.blockCount = object.compressed ? OFS.MAIN_TS_BLOCKS : OFS.LOCAL_TS_BLOCKS;
    return object;
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
  getOverworldImgById(id, frame) {
    let buffer = this.buffer;
    let offset = (OFS.OVERWORLD_BANK + (id * 36));
    offset += 4; // skip ffff
    let paletteNum = readByte(buffer, offset - 2); offset += 0x1;
    offset += 0x3; // unknown
    let width = readByte(buffer, offset); offset += 0x1;
    offset += 0x1; // unknown
    let height = readByte(buffer, offset); offset += 0x1;
    offset += 0x1; // unknown
    offset += 0x1; // unknown
    offset += 0x3; // unknown
    offset += 0x4; // unknown ptr
    offset += 0x4; // unknown ptr
    offset += 0x4; // unknown ptr
    let spritePtr = readPointer(buffer, offset); offset += 0x4;
    offset += 0x4; // unknown ptr

    // get palette, weird stuff
    let palettePtr = 0;
    for (let ii = 0; ii < OFS.OVERWORLD_PAL_COUNT; ++ii) {
      let index = OFS.OVERWORLD_PAL_HEADERS + (ii * 8);
      if (readByte(buffer, index + 4) === paletteNum) {
        palettePtr = readLong(buffer, index) - 0x8000000;
      }
    };

    let pixels = readPointer(buffer, spritePtr + (8 * frame));
    let palette = palettePtr;
    return this.getImage(pixels, palette, 0, 0, width, height, true);
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
    if (id === 139) {
      //console.log(readPointer(buffer, OFS.ITEM_IMG + id * 8), toHex(readPointer(buffer, OFS.ITEM_IMG + id * 8)));
    }
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
  generateBerryGraphicTable() {
    let table = this.graphics.berries;

  }
  generateOverworldGraphicTable() {
    let table = this.graphics.overworlds;
    for (let ii = 0; ii < OFS.OVERWORLD_COUNT; ++ii) {
      let frames = getMaxFrame(ii);
      table[ii] = [];
      for (let frm = 0; frm <= frames; ++frm) {
        if (frames >= 8 && isFrameMirrorable(frm - 1)) {
          let sprite = this.getOverworldImgById(ii, frm - 1);
          let ctx = createCanvasBuffer(sprite.canvas.width, sprite.canvas.height).ctx;
          ctx.setTransform(-1, 0, 0, 1, sprite.canvas.width, 0);
          ctx.drawImage(
            sprite.canvas,
            0, 0
          );
          sprite.canvas = ctx.canvas;
          table[ii].push(sprite);
        }
        let sprite = this.getOverworldImgById(ii, frm);
        table[ii].push(sprite);
      };
      if (frames >= 8) {
        // 10 -> 9
        let tmp = table[ii][9];
        table[ii][9] = table[ii][10];
        table[ii][10] = tmp;
        //if (ii === 0) table[ii].map((sprite) => ows.appendChild(sprite.canvas));
      }
    };
  }
};
