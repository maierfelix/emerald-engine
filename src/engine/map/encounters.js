import * as CFG from "../../cfg";

export class Encounter {
  constructor(pkmnId, area, chance, minLvl, maxLvl, node = null) {
    this.id = pkmnId;
    this.area = area;
    this.chance = chance;
    this.minLvl = minLvl;
    this.maxLvl = maxLvl;
    this.node = node;
  }
};

export function getEncounterByNode(node) {
  for (let ii = 0; ii < this.encounters.length; ++ii) {
    let encounter = this.encounters[ii];
    let elEncounter = encounter.node;
    if (elEncounter === node) return encounter;
  };
  return null;
};

export function addEncounter(pkmnId, area, chance, minLvl, maxLvl, node = null) {
  let encounter = new Encounter(pkmnId, area, chance, minLvl, maxLvl, node);
  this.encounters.push(encounter);
};

export function removeEncounterByNode(node) {
  for (let ii = 0; ii < this.encounters.length; ++ii) {
    let elEncounter = this.encounters[ii].node;
    if (elEncounter === node) {
      this.encounters.splice(ii, 1);
      break;
    }
  };
};

export function updateEncounterByNode(node) {
  let encounter = this.getEncounterByNode(node);
  if (!encounter) console.warn(`Cannot update encounter`, node);
  let elPkmnBtn = node.querySelector(".ts-btn-select");
  let elPkmnChance = node.querySelector(".engine-ui-encount-chance");
  let elPkmnMinLvl = node.querySelector(".engine-ui-encount-min");
  let elPkmnMaxLvl = node.querySelector(".engine-ui-encount-max");
  encounter.id = elPkmnBtn.selectedIndex + 1;
  encounter.chance = elPkmnChance.value | 0;
  encounter.minLvl = elPkmnMinLvl.value | 0;
  encounter.maxLvl = elPkmnMaxLvl.value | 0;
};
