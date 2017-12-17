import * as CFG from "./cfg";

class Storage {
  constructor(key) {
    this.key = key;
    this.data = this.getCachedState();
  }
};

Storage.prototype.createInitialStorageEntry = function() {
  localStorage.setItem(this.key, `{}`);
};

Storage.prototype.getCachedState = function() {
  let data = localStorage.getItem(this.key);
  if (!data) {
    this.createInitialStorageEntry();
    data = localStorage.getItem(this.key);
  }
  return JSON.parse(data);
};

Storage.prototype.syncWithStorage = function() {
  let data = JSON.stringify(this.data);
  localStorage.setItem(this.key, data);
};

Storage.prototype.read = function(key) {
  return this.data[key];
};

Storage.prototype.write = function(key, value) {
  let split = key.split(".");
  if (split.length) {
    let obj = this.data;
    split.map((key, index) => {
      if (index < split.length - 1) obj = obj[key];
      else obj[key] = value;
    });
  } else {
    this.data[key] = value;
  }
  this.syncWithStorage();
  return this.data[key];
};

const STORAGE = new Storage(CFG.STORAGE_MAIN_KEY);

export default STORAGE;
