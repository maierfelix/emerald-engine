import * as CFG from "../cfg";

import {
  $,
  roundTo,
  getRelativeTile,
  createCanvasBuffer,
  getNormalizedSelection
} from "../utils";

export default class ROMTilesetEditor {
  /**
   * @param {Rom} rom - The ROM file to use
   */
  constructor(rom, bank, map) {
    this.rom = rom;
    this.data = {};
    this.active = true;
    this.elLayers = $("#ts-layers");
    this.elLayersCtx = this.elLayers.getContext("2d");
    this.tileset = null;
    this.activeLayer = null;
    this.layers = {
      background: null,
      foreground: null
    };
    this.last = {
      dx: -1, dy: -1
    };
    this.finalLayerContexts = {
      0: $("#ts-final-0").getContext("2d"),
      1: $("#ts-final-1").getContext("2d"),
      2: $("#ts-final-2").getContext("2d"),
      3: $("#ts-final-3").getContext("2d")
    };
    this.selection = {
      layers: { x: 0, y: 0, w: 0, h: 0, sx: 0, sy: 0 }
    };
    this.flip = { x: false, y: false };
    this.currentTs = [bank, map];
    this.stack = [];
    this.stackPosition = 0;
    this.setup();
  }
  undo() {
    
  }
  redo() {
    
  }
  setup() {
    $("#ts-ui").style.display = "block";
    let rom = this.rom;
    let elLayers = this.elLayers;
    let tsBank = this.currentTs[0];
    let tsMap = this.currentTs[1];
    this.useTileset(tsBank, tsMap);
    for (let key in this.finalLayerContexts) {
      let layer = this.finalLayerContexts[key];
      this.resizeContext(
        layer,
        CFG.TILESET_DEFAULT_WIDTH * CFG.TILESET_FINAL_SCALE,
        CFG.TILESET_DEFAULT_HEIGHT * CFG.TILESET_FINAL_SCALE
      );
    };
    this.resizeContext(
      this.elLayersCtx,
      (CFG.TILESET_DEFAULT_WIDTH * 2) * CFG.TILESET_LAYER_SCALE,
      CFG.TILESET_DEFAULT_HEIGHT * CFG.TILESET_LAYER_SCALE
    );
    this.setActiveLayerByIndex(1);
    $("#ts-rom-notice").innerHTML = `Loaded ROM: ${rom.code} ${rom.maker}`;
    this.addListeners();
  }
  useTileset(bank, map) {
    let tsId = bank + ":" + map;
    let ts = this.rom.getMapTileset(bank, map);
    this.tileset = ts;
    this.layers.background = ts.layers.background.canvas;
    this.layers.foreground = ts.layers.foreground.canvas;
    this.currentTs = [bank, map];
    if (!this.data[tsId]) {
      this.data[tsId] = {
        collision: [],
        0: [],
        1: [],
        2: []
      };
    }
    $("#final-layer-wrapper-title").innerHTML = `ROM Tileset (${bank}:${map})`;
  }
  getTileFromDataLayerAt(layer, x, y) {
    for (let ii = 0; ii < layer.length; ++ii) {
      let tile = layer[ii];
      if (tile.x === x && tile.y === y) return tile;
    };
    return null;
  }
  resetLayerButtons() {
    $("#layer-btn-0").classList.remove("active-layer-btn");
    $("#layer-btn-1").classList.remove("active-layer-btn");
    $("#layer-btn-2").classList.remove("active-layer-btn");
    $("#layer-btn-3").classList.remove("active-layer-btn");
    $("#layer-btn-4").classList.remove("active-layer-btn");
  }
  resetFinalLayers(factor) {
    $("#ts-final-0").style.opacity = factor;
    $("#ts-final-1").style.opacity = factor;
    $("#ts-final-2").style.opacity = factor;
    $("#ts-final-3").style.opacity = 0.0;
  }
  setActiveLayerByIndex(index) {
    this.resetFinalLayers(0.5);
    this.resetLayerButtons();
    $(`#layer-btn-${index}`).classList.add("active-layer-btn");
    this.activeLayer = index - 1;
    if (index !== 0) $(`#ts-final-${index - 1}`).style.opacity = 1.0;
    if (index === 0 || index === 4) this.resetFinalLayers(1.0);
    this.resetLastTileDraw();
  }
  getFinalLayerByIndex(index) {
    return this.finalLayerContexts[index];
  }
  getTargetLayer() {
    return this.finalLayerContexts[this.activeLayer];
  }
  getCurrentTilesetId() {
    return this.currentTs[0] + ":" + this.currentTs[1];
  }
  isSelectedTileEmpty() {
    let selection = this.selection.layers;
    let tileBuffer = this.getTileFromTileset(
      this.tileset,
      selection.x, selection.y,
      false, false
    );
    return this.isEmptyTile(tileBuffer);
  }
  addListeners() {
    let elFinal = $("#ts-final-layer-wrapper");
    let elLayers = this.elLayers;
    let downFinal = false;
    let downLayers = false;
    window.oncontextmenu = (e) => { if (e.target instanceof HTMLCanvasElement) e.preventDefault(); };
    elLayers.onmousedown = (e) => {
      if (e.which !== 1) return;
      downLayers = true;
      let mx = e.offsetX;
      let my = e.offsetY;
      let tile = getRelativeTile(mx, my, CFG.TILESET_LAYER_SCALE);
      let selection = this.selection.layers;
      selection.x = tile.x; selection.y = tile.y;
      selection.sx = tile.x; selection.sy = tile.y;
      selection.w = selection.x;
      selection.h = selection.y;
      elLayers.onmousemove.call(this, e);
      //this.resetFlipState();
    };
    elLayers.onmouseup = (e) => {
      if (e.which !== 1) return;
      downLayers = false;
    };
    elLayers.onmousemove = (e) => {
      if (!downLayers) return;
      this.resetLastTileDraw();
      let mx = e.offsetX;
      let my = e.offsetY;
      let tile = getRelativeTile(mx, my, CFG.TILESET_LAYER_SCALE);
      let selection = this.selection.layers;
      let sel = getNormalizedSelection(
        tile.x, tile.y,
        selection.sx, selection.sy
      );
      selection.x = sel.x;
      selection.y = sel.y;
      selection.w = sel.w;
      selection.h = sel.h;
      //this.resetFlipState();
    };
    elFinal.onmousedown = (e) => {
      downFinal = true;
      elFinal.onmousemove.call(this, e);
    };
    elFinal.onmouseup = (e) => { downFinal = false; };
    elFinal.onmousemove = (e) => {
      if (!downFinal || this.activeLayer === -1) return;
      let mx = e.offsetX;
      let my = e.offsetY;
      if (this.activeLayer === 3) {
        let isEmptyTile = this.isSelectedTileEmpty();
        let tile = getRelativeTile(mx, my, CFG.TILESET_FINAL_SCALE);
        this.drawCollisionTileAt(
          tile.x, tile.y,
          isEmptyTile
        );
      }
      else this.drawTileSelectionAt(this.selection.layers, mx, my);
    };

    $("#ts-flip-x").onclick = (e) => this.switchFlipBtn("x");
    $("#ts-flip-y").onclick = (e) => this.switchFlipBtn("y");
    $("#layer-btn-0").onmousedown = (e) => { this.setActiveLayerByIndex(0); };
    $("#layer-btn-1").onmousedown = (e) => { this.setActiveLayerByIndex(1); };
    $("#layer-btn-2").onmousedown = (e) => { this.setActiveLayerByIndex(2); };
    $("#layer-btn-3").onmousedown = (e) => { this.setActiveLayerByIndex(3); };
    $("#layer-btn-4").onmousedown = (e) => { this.setActiveLayerByIndex(4); };

    $("#ts-switch").onclick = (e) => {
      let current = this.getCurrentTilesetId();
      let id = String(prompt(`Enter a tileset number in the following format: [BANK:MAP]`, current)).split(":");
      if (id.length < 2 || id.length > 2) return;
      let bank = parseInt(id[0]);
      let map = parseInt(id[1]);
      if (this.currentTs[0] === bank && this.currentTs[1] === map) return;
      try {
        this.useTileset(bank, map);
      } catch (e) {
        alert(`Invalid tileset! Falling back to tileset 0:9`);
        this.useTileset(0, 9);
      };
      this.resetLastTileDraw();
    };
    $("#ts-import").onchange = (e) => {
      let files = $("#ts-import").files;
      let file = files[0];
      let name = file.name;
      let ext = name.substr(name.lastIndexOf(".") + 1, name.length);
      if (ext !== "json") return;
      let reader = new FileReader();
      reader.onload = (e) => {
        let json = null;
        try {
          json = JSON.parse(e.target.result);
        } catch(e) {
          alert(`Imported tileset is corrupted or invalid`);
          return;
        }
        if (json) {
          $("#ts-import").value = $("#ts-import").val = null;
          this.processImportedTileset(json);
        }
      };
      reader.readAsText(file);
    };
    $("#ts-export").onclick = (e) => {
      let json = JSON.stringify(this.data);
      let data = "data:text/json;charset=utf-8," + encodeURIComponent(json);
      let dl = document.createElement("a");
      dl.setAttribute("href", data);
      dl.setAttribute("download", "tileset.json");
      dl.click();
    };
  }
  resetLastTileDraw() {
    this.last.dx = this.last.dy = -1;
  }
  processImportedTileset(json) {
    this.data = json;
    this.clearFinalLayerContexts();
    let tilesets = json;
    for (let key in tilesets) {
      let id = key.split(":");
      let bank = id[0] | 0;
      let map = id[1] | 0;
      let mapTileset = this.rom.getMapTileset(bank, map);
      let tileset = tilesets[key];
      for (let ts in tileset) {
        let tiles = tileset[ts];
        let layerContext = this.getFinalLayerByIndex(ts | 0);
        if (ts === "collision") {
          for (let ii = 0; ii < tiles.length; ++ii) {
            let tile = tiles[ii];
            let dstLayer = this.finalLayerContexts[3];
            let dstX = (tile.x * CFG.BLOCK_SIZE) * CFG.TILESET_FINAL_SCALE;
            let dstY = (tile.y * CFG.BLOCK_SIZE) * CFG.TILESET_FINAL_SCALE;
            let size = CFG.BLOCK_SIZE * CFG.TILESET_FINAL_SCALE;
            dstLayer.fillStyle = `rgba(255,0,0,0.35)`;
            dstLayer.clearRect(
              dstX, dstY,
              size, size
            );
            dstLayer.fillRect(
              dstX, dstY,
              size, size
            );
          };
          continue;
        }
        for (let ii = 0; ii < tiles.length; ++ii) {
          let tile = tiles[ii];
          this.drawTileAt(
            mapTileset,
            layerContext,
            tile.sx * CFG.BLOCK_SIZE, tile.sy * CFG.BLOCK_SIZE,
            tile.x * CFG.BLOCK_SIZE, tile.y * CFG.BLOCK_SIZE,
            tile.fx, tile.fy
          );
        };
      };
    };
    // switch active tileset to imported tileset
    for (let key in tilesets) {
      let id = key.split(":");
      this.useTileset(id[0] | 0, id[1] | 0);
      break;
    };
    // reset selection
    this.resetSelection();
    this.resetLastTileDraw();
  }
  switchFlipBtn(axis) {
    this.flip[axis] = !this.flip[axis];
    $(`#ts-flip-${axis}`).checked = this.flip[axis];
    this.resetLastTileDraw();
  }
  resetSelection() {
    let selection = this.selection.layers;
    selection.x = selection.y = 0;
    selection.sx = selection.sy = 0;
    selection.w = selection.h = 0;
  }
  resetFlipState() {
    this.flip.x = false;
    this.flip.y = false;
    $("#ts-flip-x").checked = false;
    $("#ts-flip-y").checked = false;
  }
  drawCollisionTileAt(x, y, isEmpty) {
    let dstLayer = this.finalLayerContexts[3];
    let dataLayer = this.data[this.getCurrentTilesetId()].collision;
    let size = CFG.BLOCK_SIZE * CFG.TILESET_FINAL_SCALE;
    let dstX = x * CFG.TILESET_FINAL_SCALE;
    let dstY = y * CFG.TILESET_FINAL_SCALE;
    dstLayer.clearRect(
      dstX, dstY,
      size, size
    );
    if (isEmpty) {
      this.deleteDataTileAt(
        "collision",
        x / CFG.BLOCK_SIZE, y / CFG.BLOCK_SIZE
      );
      return;
    }
    this.createDataCollisionTileAt(
      dataLayer,
      x / CFG.BLOCK_SIZE, y / CFG.BLOCK_SIZE,
      isEmpty
    );
    dstLayer.fillStyle = `rgba(255,0,0,0.35)`;
    dstLayer.fillRect(
      dstX, dstY,
      size, size
    );
  }
  drawTileSelectionAt(selection, x, y) {
    let tsId = this.getCurrentTilesetId();
    let sw = (selection.w - selection.x) + CFG.BLOCK_SIZE;
    let sh = (selection.h - selection.y) + CFG.BLOCK_SIZE;
    let dstTile = getRelativeTile(x, y, CFG.TILESET_FINAL_SCALE);
    let length = (sw * sh) / CFG.BLOCK_SIZE;
    let dataLayer = this.data[tsId][this.activeLayer];
    // only draw if necessary
    if (dstTile.x === this.last.dx && dstTile.y === this.last.dy) return;
    for (let ii = 0; ii < length; ii += CFG.BLOCK_SIZE) {
      let ix = (ii % sw) | 0;
      let iy = ((ii / sw) | 0) * CFG.BLOCK_SIZE;
      let srcX = (selection.x + ix);
      let srcY = (selection.y + iy);
      let dstX = (dstTile.x + ix);
      let dstY = (dstTile.y + iy);
      let isEmptyTile = this.drawTileAt(
        this.tileset,
        this.getTargetLayer(),
        srcX, srcY,
        dstX, dstY,
        this.flip.x, this.flip.y
      );
      if (!isEmptyTile) {
        this.createDataTileAt(
          dataLayer,
          srcX / CFG.BLOCK_SIZE, srcY / CFG.BLOCK_SIZE,
          dstX / CFG.BLOCK_SIZE, dstY / CFG.BLOCK_SIZE,
          this.flip.x, this.flip.y
        );
      }
      // try to also delete the relative data tile
      if (isEmptyTile) {
        this.deleteDataTileAt(
          this.activeLayer,
          dstX / CFG.BLOCK_SIZE, dstY / CFG.BLOCK_SIZE
        );
      }
    };
    this.last.dx = dstTile.x;
    this.last.dy = dstTile.y;
  }
  deleteDataTileAt(layerIndex, x, y) {
    layerIndex = String(layerIndex);
    let tilesets = this.data;
    for (let ts in tilesets) {
      let layers = tilesets[ts];
      for (let ll in layers) {
        let layer = layers[ll];
        if (ll !== layerIndex) continue;
        for (let ii = 0; ii < layer.length; ++ii) {
          let tile = layer[ii];
          if (tile.x === x && tile.y === y) {
            layer.splice(ii, 1);
            break;
          }
        };
      };
    };
  }
  clearFinalLayerContexts() {
    let layers = this.finalLayerContexts;
    for (let key in layers) {
      let ctx = layers[key];
      ctx.clearRect(
        0, 0,
        ctx.canvas.width, ctx.canvas.height
      );
    };
  }
  createDataCollisionTileAt(dataLayer, x, y, state) {
    let tile = this.getTileFromDataLayerAt(dataLayer, x, y);
    if (tile === null) {
      let tile = {
        x: x, y: y, s: state | 0
      };
      dataLayer.push(tile);
    } else {
      tile.x = x;
      tile.y = y;
      tile.s = state | 0;
    }
  }
  createDataTileAt(dataLayer, srcX, srcY, dstX, dstY, flipX, flipY) {
    let tile = this.getTileFromDataLayerAt(dataLayer, dstX, dstY);
    if (tile === null) {
      let tile = {
        x: dstX, y: dstY,
        sx: srcX, sy: srcY,
        fx: flipX | 0,
        fy: flipY | 0
      };
      dataLayer.push(tile);
    } else {
      tile.sx = srcX;
      tile.sy = srcY;
      tile.fx = flipX | 0;
      tile.fy = flipY | 0;
    }
  }
  drawTileAt(ts, dstLayer, srcX, srcY, dstX, dstY, flipX, flipY) {
    let size = CFG.BLOCK_SIZE * CFG.TILESET_FINAL_SCALE;
    let tileBuffer = this.getTileFromTileset(
      ts,
      srcX, srcY,
      flipX, flipY
    );
    let xx = dstX * CFG.TILESET_FINAL_SCALE;
    let yy = dstY * CFG.TILESET_FINAL_SCALE;
    let tx = dstX / CFG.BLOCK_SIZE;
    let ty = dstY / CFG.BLOCK_SIZE;
    dstLayer.clearRect(
      xx, yy,
      size, size
    );
    dstLayer.drawImage(
      tileBuffer.canvas,
      xx, yy,
      size, size
    );
    return this.isEmptyTile(tileBuffer);
  }
  getTileFromTileset(ts, srcX, srcY, flipX, flipY) {
    let tileBuffer = createCanvasBuffer(CFG.BLOCK_SIZE, CFG.BLOCK_SIZE).ctx;
    let reduceX = (srcX < CFG.TILESET_DEFAULT_WIDTH ? 0 : -CFG.TILESET_DEFAULT_WIDTH);
    let srcLayer = srcX < CFG.TILESET_DEFAULT_WIDTH ? "background" : "foreground";
    let layer = ts.layers[srcLayer].canvas;
    if (flipX) tileBuffer.scale(-1, 1);
    if (flipY) tileBuffer.scale(1, -1);
    tileBuffer.drawImage(
      layer,
      srcX + reduceX, srcY,
      CFG.BLOCK_SIZE, CFG.BLOCK_SIZE,
      0, 0,
      CFG.BLOCK_SIZE * (flipX ? -1 : 1), CFG.BLOCK_SIZE * (flipY ? -1 : 1)
    );
    if (flipX || flipY) tileBuffer.scale(1, 1);
    return tileBuffer;
  }
  isEmptyTile(buffer) {
    let width = CFG.BLOCK_SIZE;
    let height = CFG.BLOCK_SIZE;
    let data = buffer.getImageData(0, 0, width, height);
    let pixels = data.data;
    for (let ii = 0; ii < (width * height); ++ii) {
      let index = (ii * 4) | 0;
      let alpha = pixels[index + 3];
      if (alpha !== 0) return false;
    };
    data = null;
    return true;
  }
  resizeContext(ctx, width, height) {
    let canvas = ctx.canvas;
    canvas.width = width;
    canvas.height = height;
    ctx.imageSmoothingEnabled = false;
  }
  draw() {
    this.clear();
    this.drawLayers();
    this.drawGrid(this.elLayersCtx, CFG.BLOCK_SIZE * CFG.TILESET_LAYER_SCALE);
    this.drawGrid(this.finalLayerContexts[2], CFG.BLOCK_SIZE * CFG.TILESET_FINAL_SCALE);
  }
  clear() {
    let layerCtx = this.elLayersCtx;
    layerCtx.clearRect(0, 0, layerCtx.canvas.width, layerCtx.canvas.height);
  }
  drawGrid(ctx, size) {
    let canvas = ctx.canvas;
    let width = canvas.width;
    let height = canvas.height;

    ctx.lineWidth = 1;
    ctx.strokeStyle = `rgba(0,0,0,0.5)`;

    ctx.beginPath();
    for (let xx = 0; xx < width; xx += size) {
      ctx.moveTo(xx, 0);
      ctx.lineTo(xx, height);
    };
    for (let yy = 0; yy < height; yy += size) {
      ctx.moveTo(0, yy);
      ctx.lineTo(width, yy);
    };
    ctx.stroke();
    ctx.closePath();
  }
  drawLayers() {
    let bg = this.layers.background;
    let fg = this.layers.foreground;
    let ctx = this.elLayersCtx;
    let ts = this.tileset;
    ctx.drawImage(
      bg,
      0, 0,
      CFG.TILESET_DEFAULT_WIDTH * CFG.TILESET_LAYER_SCALE,
      CFG.TILESET_DEFAULT_HEIGHT * CFG.TILESET_LAYER_SCALE
    );
    ctx.drawImage(
      fg,
      CFG.TILESET_DEFAULT_WIDTH * CFG.TILESET_LAYER_SCALE, 0,
      CFG.TILESET_DEFAULT_WIDTH * CFG.TILESET_LAYER_SCALE,
      CFG.TILESET_DEFAULT_HEIGHT * CFG.TILESET_LAYER_SCALE
    );
    this.drawSelection(ctx, this.selection.layers, CFG.TILESET_LAYER_SCALE);
  }
  drawSelection(ctx, selection, scale) {
    let ww = ((selection.w - selection.x) + CFG.BLOCK_SIZE) * scale;
    let hh = ((selection.h - selection.y) + CFG.BLOCK_SIZE) * scale;
    ctx.fillStyle = `rgba(255,0,0,0.35)`;
    ctx.fillRect(
      selection.x * scale, selection.y * scale,
      ww, hh
    );
    ctx.lineWidth = 2.0;
    ctx.strokeStyle = `rgba(255,0,0,1)`;
    ctx.strokeRect(
      (selection.x * scale) | 0, (selection.y * scale) | 0,
      ww | 0, hh | 0
    );
  }
};
