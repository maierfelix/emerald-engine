import * as CFG from "../cfg";

export function commitTask(task) {
  if (this.pos) {
    this.tasks.splice(this.tasks.length - this.pos, this.pos);
    this.pos = 0;
  }
  this.tasks.push(task);
  if (this.tasks.length > CFG.ENGINE_MAX_STATE_LEVELS) this.tasks.shift();
};

export function redoTask() {
  if (!this.pos) return;
  let task = this.tasks[this.tasks.length - this.pos];
  if (!task) return;
  this.fireTask(task, CFG.ENGINE_TASK_REDO);
  this.pos--;
};

export function undoTask() {
  let task = this.tasks[this.tasks.length - this.pos - 1];
  if (!task) return;
  this.fireTask(task, CFG.ENGINE_TASK_UNDO);
  this.pos++;
};

export function fireTask(task, state) {
  let kind = task.kind;
  switch (kind) {
    case CFG.ENGINE_TASKS.MAP_TILE_CHANGE:
      this.executeMapTileDraw(task, state);
    break;
  };
};

export function executeMapTileDraw(task, state) {
  console.log(task, state);
  let changes = task.changes;
  let maps = [];
  let updates = [];
  for (let ii = 0; ii < changes.length; ++ii) {
    let change = changes[ii];
    let map = change.map;
    let layer = change.layer;
    let tileset = change.tileset;
    let sx = (state === CFG.ENGINE_TASK_UNDO) ? change.sx : change.dx;
    let sy = (state === CFG.ENGINE_TASK_UNDO) ? change.sy : change.dy;
    // we allow to undo/redo on multiple maps in one task
    if (maps.indexOf(map) <= -1) {
      maps.push(map);
      updates.push({ map, layer });
    }
    map.drawTileBuffered(tileset, sx, sy, change.tx, change.ty, layer);
  };
  // finally update the gpu textures of all affected maps
  for (let ii = 0; ii < updates.length; ++ii) {
    let update = updates[ii];
    let map = update.map;
    let layer = update.layer;
    let texture = map.textures[layer - 1];
    let textureGL = map.texturesGL[layer - 1];
    this.gl.updateGLTextureByCanvas(
      textureGL,
      texture.canvas,
      0, 0
    );
  };
  // when UI is in fill mode, redraw the fill preview
  if (this.isUIInFillMode()) this.onUIMapFill(this.mx, this.my, true);
};
