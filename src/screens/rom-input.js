import {
  $
} from "../utils";

export default function(db) {
  let el = $("#rom_drop");
  el.style.display = "block";
  return new Promise((resolve) => {
    el.ondragover = (e) => {
      e.stopPropagation();
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    };
    el.ondrop = (e) => {
      e.stopPropagation();
      e.preventDefault();
      let file = e.dataTransfer.files[0];
      let name = file.name;
      let ext = name.substr(name.lastIndexOf("."), name.length);
      if (ext !== ".gba") console.warn(`Invalid ROM file extension!`);
      let reader = new FileReader();
      reader.onload = (e) => {
        let buffer = reader.result;
        let view = new Uint8Array(buffer);
        let tra = db.transaction(["ROMData"], "readwrite");
        tra.objectStore("ROMData").put(view, "key");
        el.style.display = "none";
        resolve(view);
      };
      reader.readAsArrayBuffer(file);
    };
  });
};
