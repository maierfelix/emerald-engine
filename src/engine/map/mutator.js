import * as CFG from "../../cfg";

import {
  uid,
  assert
} from "../../utils";

export function createMutatorSession() {
  this.resetMutatorSession();
  this.recordMutations = true;
};

export function resetMutatorSession() {
  this.mutations = [];
  this.recordMutations = false;
};

export function isRecordingMutations() {
  return this.recordMutations === true;
};

export function hasMutations() {
  return this.mutations.length > 0;
};

export function endMutatorSession() {
  let mutations = this.mutations;
  this.resetMutatorSession();
  return mutations;
};

export function tileAlreadyMutated(x, y, layer) {
  if (!this.isRecordingMutations()) return true;
  let muts = this.mutations;
  let length = muts.length;
  for (let ii = 0; ii < length; ++ii) {
    let mut = muts[ii];
    if (mut.tx === x && mut.ty === y && mut.layer === layer) return true;
  };
  return false;
};

export function getTileMutationAt(x, y, layer) {
  let muts = this.mutations;
  let length = muts.length;
  for (let ii = 0; ii < length; ++ii) {
    let mut = muts[ii];
    if (mut.tx === x && mut.ty === y && mut.layer === layer) return mut;
  };
  return null;
};
