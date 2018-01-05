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
  let commit = this.tasks.splice(this.tasks.length - this.pos, this.pos);
  this.pos = 0;
  commit.map(tasks => {
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
  let commit = this.tasks.shift();
  commit.map(task => {
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
