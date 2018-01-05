import * as CFG from "../../cfg";

import {
  $,
  assert
} from "../../utils";

import {
  isLoadingModalActive
} from "../../screens/index";

export function isActiveTilesetFillMode() {
  return (
    this.isUIInTilesetMode() &&
    (this.isUIInBucketFillMode() || this.isUIInMagicFillMode())
  );
};

export function isUIInFillMode() {
  return this.isActiveTilesetFillMode();
};

export function isUIInCreationMode() {
  return (
    this.isUIInMapCreationMode() ||
    this.isUIInObjectCreationMode()
  );
};

export function isUIInMapEditingMode() {
  return (
    this.isUIInMapResizeMode() ||
    this.isUIInMapCreationMode()
  );
};

export function isUIInSelectMode() {
  return (
    this.isUIInTilesetMode() &&
    this.tsEditMode === CFG.ENGINE_TS_EDIT.SELECT
  );
};

export function isUIInPencilMode() {
  return (
    this.isUIInTilesetMode() &&
    this.tsEditMode === CFG.ENGINE_TS_EDIT.PENCIL
  );
};

export function isUIInPipetteMode() {
  return (
    this.isUIInTilesetMode() &&
    this.tsEditMode === CFG.ENGINE_TS_EDIT.PIPETTE
  );
};

export function isUIInBucketFillMode() {
  return (
    this.isUIInTilesetMode() &&
    this.tsEditMode === CFG.ENGINE_TS_EDIT.BUCKET
  );
};

export function isUIInMagicFillMode() {
  return (
    this.isUIInTilesetMode() &&
    this.tsEditMode === CFG.ENGINE_TS_EDIT.MAGIC
  );
};

export function isUIInAutotileMode() {
  return (
    this.isUIInTilesetMode() &&
    this.tsEditMode === CFG.ENGINE_TS_EDIT.AUTOTILE
  );
};

export function isUIInTilesetMode() {
  return (
    !this.isUIInMapEditingMode() &&
    this.mode === CFG.ENGINE_MODE_TS
  );
};

export function isUIInObjectMode() {
  return (
    !this.isUIInMapEditingMode() &&
    this.mode === CFG.ENGINE_MODE_OBJ
  );
};

export function isUIInOptionMode() {
  return (
    !this.isUIInMapEditingMode() &&
    this.mode === CFG.ENGINE_MODE_OPT
  );
};

export function isUIInMapCreationMode() {
  return this.creation.map !== null;
};

export function isUIInObjectCreationMode() {
  return this.creation.object !== null;
};

export function isUIInMapResizeMode() {
  return this.resizing.map !== null;
};

export function isLeftMousePressed() {
  return this.drag.ldown === true;
};

export function isRightMousePressed() {
  return this.drag.rdown === true;
};

export function isUIInAnyActiveMode() {
  return (
    isLoadingModalActive() ||
    this.isLeftMousePressed() ||
    this.isUIInMapEditingMode() ||
    this.isUIInCreationMode()
  );
};
