import * as CFG from "../../cfg";

import {
  $,
  assert
} from "../../utils";

import {
  showAlertModal,
  closeAlertModal
} from "../../screens/index";

import Entity from "../entities/index";

export function resetUIObjMenus() {
  let entities = this.plugins.entities;
  for (let name in entities) {
    let elMenu = $(`#engine-ui-obj-${name}`);
    elMenu.style.display = "none";
  };
};

export function setUIObjMode(index) {
  this.resetUIObjMenus();
  this.objMode = index;
  if (index < 0) return;
  let name = $(`#engine-ui-obj-type`).children[index].innerHTML;
  let elMenu = $(`#engine-ui-obj-${name}`);
  elMenu.style.display = "block";
};

export function addUIObjectTypeItem(name) {
  let item = document.createElement("option");
  item.innerHTML = name;
  $(`#engine-ui-obj-type`).appendChild(item);
};

export function addUIObjectTypeMenu(entity) {
  let menu = $(`#engine-ui-obj-mode-menu`);
  let node = entity.sandbox;
  menu.appendChild(node);
};

export function setActiveObject(object) {
  this.currentObject = object;
  this.refreshUIMapObject(object);
};

export function selectObject(object) {
  this.setActiveObject(object);
  this.creation.object = object;
};

export function onUIObjectAdd() {
  let map = this.currentMap;
  let object = new Entity(map);
  let rel = this.getRelativeMapTile(this.mx, this.my);
  object.x = rel.x - map.x;
  object.y = rel.y - map.y;
  object.width = 1;
  object.height = 1;
  object.kind = CFG.ENGINE_BOX_TYPES.ENTITY;
  map.addObject(object);
  this.selectObject(object);
  this.setUIMapStatsModeVisibility(true);
  this.updateMapStatsModeUI(this.creation.object);
};

export function onUIObjectAddAbort(kill = false) {
  if (kill) {
    let object = this.creation.object;
    object.kill();
    object = null;
    this.setActiveObject(null);
  }
  this.creation.object = null;
  this.setUIMapStatsModeVisibility(false);
};

export function onUIObjectDelete(object) {
  showAlertModal(`Do you really want to delete this object?`).then((answer) => {
    if (answer) {
      let map = object.map;
      let position = { x: object.x, y: object.y };
      map.createMutatorSession();
      this.commitTask({
        kind: CFG.ENGINE_TASKS.OBJECT_DELETE,
        changes: [{ object, position }]
      });
      this.endCommitSession();
      object.kill();
      this.selectObject(null);
    }
    closeAlertModal();
  });
};

export function isObjectPlaceable(object) {
  let map = object.map;
  return map.coordsInBounds(object.x, object.y);
};

export function onUIPlaceNewObject(object) {
  let map = object.map;
  if (this.isObjectPlaceable(object)) {
    let position = { x: object.x, y: object.y };
    // sync
    let move = this.selection.objectMove;
    move.ox = object.x;
    move.oy = object.y;
    map.createMutatorSession();
    this.commitTask({
      kind: CFG.ENGINE_TASKS.OBJECT_CREATE,
      changes: [{ object, position }]
    });
    this.endCommitSession();
    this.onUIObjectAddAbort();
  }
};

export function onUIObjectMove(object, ox, oy, nx, ny) {
  let task = {
    object,
    current: { x: nx, y: ny },
    original: { x: ox, y: oy }
  };
  object.x = nx;
  object.y = ny;
  object.map.createMutatorSession();
  this.commitTask({
    kind: CFG.ENGINE_TASKS.OBJECT_MOVE,
    changes: [task]
  });
  this.endCommitSession();
};

export function onUIUpdateObjectProperty(object, property, value, mutation) {
  if (!object.hasOwnProperty(property)) {
    console.warn(`Invalid object property ${property}`, object);
  }
  // mutation, dont update UI (got already updated by the user)
  if (mutation) {
    let task = {
      object,
      current: value,
      original: object[property],
      property: property
    };
    object.map.createMutatorSession();
    this.commitTask({
      kind: CFG.ENGINE_TASKS.OBJECT_PROPERTY,
      changes: [task]
    });
    this.endCommitSession();
  }
  object[property] = value;
  // no user-mutation, update the UI
  if (!mutation) this.setUIActiveMapObject(object);
};

export function refreshUIMapObject(object) {
  if (object) this.setUIActiveMapObject(object);
  else this.resetUIActiveMapObject();
};

export function resetUIActiveMapObject() {
  $(`#engine-ui-obj-settings`).style.display = "none";
  let elPosX = $(`#engine-ui-obj-pos-x`);
  let elPosY = $(`#engine-ui-obj-pos-y`);
  let elOpacity = $(`#engine-ui-obj-opacity`);
  let elCollidable = $(`#engine-ui-obj-collidable`);
  elPosX.value = ``;
  elPosY.value = ``;
  elOpacity.value = 1.0;
  elCollidable.checked = false;
};

export function setUIActiveMapObject(object) {
  this.resetUIActiveMapObject();
  $(`#engine-ui-obj-settings`).style.display = "block";
  let elPosX = $(`#engine-ui-obj-pos-x`);
  let elPosY = $(`#engine-ui-obj-pos-y`);
  let elOpacity = $(`#engine-ui-obj-opacity`);
  let elCollidable = $(`#engine-ui-obj-collidable`);
  elPosX.value = object.x;
  elPosY.value = object.y;
  elOpacity.value = object.opacity;
  elCollidable.checked = object.collidable;
  if (!this.isLeftMousePressed() && !this.isUIInCreationMode()) {
    let move = this.selection.objectMove;
    move.ox = object.x;
    move.oy = object.y;
  }
};
