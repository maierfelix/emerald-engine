import * as CFG from "../../cfg";

export function addObject(object) {
  this.objects.push(object);
};

export function removeObject(target) {
  for (let ii = 0; ii < this.objects.length; ++ii) {
    let object = this.objects[ii];
    if (object === target) this.objects.splice(ii, 1);
  };
};

export function updateObject() {

};
