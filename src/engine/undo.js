import * as CFG from "../cfg";

export function startCommit() {
  this.currentCommit = [];
  this.tasks.push(this.currentCommit);
};

export function endCommit() {
  this.currentCommit = null;
};

export function commitSingleTask(task) {
  this.commitTask(task);
  this.endCommit();
};

export function commitTask(task) {
  let isNewCommit = !this.currentCommit;
  if (isNewCommit) {
    if (this.pos) this.spliceCommits();
    this.startCommit();
  }
  this.currentCommit.push(task);
  if (isNewCommit) {
    if (this.tasks.length > CFG.ENGINE_MAX_STATE_LEVELS) this.shiftCommits();
  }
};

export function spliceCommits() {
  let items = this.tasks.splice(this.tasks.length - this.pos, this.pos);
  this.pos = 0;
  items.map(tasks => {
    tasks.map(task => {
      // if the spliced task is a map creation
      // then make sure to free the map's gpu textures
      if (task.kind === CFG.ENGINE_TASKS.MAP_CREATE) {
        let changes = task.changes;
        changes.map(change => this.removeMap(change.map));
      }
    });
  });
};

export function shiftCommits() {
  let tasks = this.tasks.shift();
  tasks.map(task => {
    // if the shifted task is a map delete
    // then make sure to free the map's gpu textures
    if (task.kind === CFG.ENGINE_TASKS.MAP_DELETE) {
      let changes = task.changes;
      changes.map(change => this.removeMap(change.map));
    }
  });
};

export function redoTask() {
  if (!this.pos) return;
  let tasks = this.tasks[this.tasks.length - this.pos];
  if (!tasks) return;
  this.fireTasks(tasks, CFG.ENGINE_TASK_REDO);
  this.pos--;
};

export function undoTask() {
  let tasks = this.tasks[this.tasks.length - this.pos - 1];
  if (!tasks) return;
  this.fireTasks(tasks, CFG.ENGINE_TASK_UNDO);
  this.pos++;
};

export function fireTasks(tasks, state) {
  for (let ii = 0; ii < tasks.length; ++ii) {
    let task = tasks[ii];
    switch (task.kind) {
      case CFG.ENGINE_TASKS.MAP_DELETE:
        this.executeMapLifeOperation(task, state);
      break;
      case CFG.ENGINE_TASKS.MAP_CREATE:
        this.executeMapLifeOperation(task, (!state) | 0);
      break;
      case CFG.ENGINE_TASKS.MAP_RESIZE:
        this.executeMapResize(task, state);
      break;
      case CFG.ENGINE_TASKS.MAP_TILE_CHANGE:
        this.executeMapTileDraw(task, state);
      break;
      case CFG.ENGINE_TASKS.MAP_AUTOTILE:
        this.executeMapAutoTileDraw(task, state);
      break;
    };
  };
};

export function executeMapResize(task, state) {
  console.log("[TASK]: Map resize", task, state);
  let isUndo = (state === CFG.ENGINE_TASK_UNDO);
  let isRedo = (state === CFG.ENGINE_TASK_REDO);
  let changes = task.changes;
  if (isUndo) {
    changes.map(change => {
      let map = change.map;
      let original = change.original;
      map.destroy();
      map.x = original.x;
      map.y = original.y;
      map.useData(change.data);
      map.setBoundings(original.w, original.h);
      map.refreshMapTextures();
      map.resetMargins();
    });
  }
  else if (isRedo) {
    changes.map(change => {
      let map = change.map;
      let margin = change.margin;
      let original = change.current;
      map.x = original.x;
      map.y = original.y;
      map.width = original.w;
      map.height = original.h;
      map.resize(margin.x, margin.y, margin.w, margin.h);
      map.resetMargins();
    });
  }
};

export function executeMapLifeOperation(task, state) {
  console.log("[TASK]: Map life", task, state);
  let isUndo = (state === CFG.ENGINE_TASK_UNDO);
  let isRedo = (state === CFG.ENGINE_TASK_REDO);
  let changes = task.changes;
  if (isUndo) {
    changes.map(change => {
      this.addMap(change.map);
      this.setUIActiveMap(change.map);
    });
  }
  else if (isRedo) {
    changes.map(change => {
      this.removeMap(change.map, false);
    });
  }
};

export function executeMapTileDraw(task, state) {
  console.log("[TASK]: Map tile draw", task, state);
  let isUndo = (state === CFG.ENGINE_TASK_UNDO);
  let isRedo = (state === CFG.ENGINE_TASK_REDO);
  let changes = task.changes;
  let maps = [];
  let updates = [];
  for (let ii = 0; ii < changes.length; ++ii) {
    let change = changes[ii];
    let map = change.map;
    let layer = change.layer;
    let tileset = isUndo ? change.oTileset : change.nTileset;
    let sx = isUndo ? change.sx : change.dx;
    let sy = isUndo ? change.sy : change.dy;
    // we allow to undo/redo on multiple maps in one task
    if (maps.indexOf(map) <= -1) {
      maps.push(map);
      updates.push({ map, layers: [layer] });
    } else {
      updates[maps.indexOf(map)].layers.push(layer);
    }
    map.drawTileBuffered(tileset, sx, sy, change.tx, change.ty, layer);
  };
  // finally update the gpu textures of all affected maps
  for (let ii = 0; ii < updates.length; ++ii) {
    let update = updates[ii];
    let map = update.map;
    let layers = update.layers;
    for (let ll = 0; ll < layers.length; ++ll) {
      let layer = layers[ll];
      let texture = map.textures[layer - 1];
      let textureGL = map.texturesGL[layer - 1];
      this.gl.updateGLTextureByCanvas(
        textureGL,
        texture.canvas,
        0, 0
      );
    };
  };
  // when UI is in fill mode, redraw the fill preview
  if (this.isUIInFillMode()) this.onUIMapFill(this.mx, this.my, true);
};

export function executeMapAutoTileDraw(task, state) {
  console.log("[TASK]: Map autotile draw", task, state);
  let isUndo = (state === CFG.ENGINE_TASK_UNDO);
  let isRedo = (state === CFG.ENGINE_TASK_REDO);
  let changes = task.changes;
  let original = task.original;
  let maps = [];
  if (isUndo) {
    changes.map(change => {
      let map = change.map;
      // refresh all chanegd maps, but only one time
      if (maps.indexOf(map.id) <= -1) {
        map.useData(original);
        map.refreshMapTextures();
        maps.push(map.id);
        console.log("Refreshing map", map);
      }
    });
  }
  else if (isRedo) {
    this.executeMapTileDraw(task, state);
  }
};
