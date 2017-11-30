import json from "rollup-plugin-json";

export default {
  input: "src/index.js",
  name: "emerald_engine",
  external: [],
  plugins: [
    json()
  ]
};
