import config from "./rollup.config";
import json from "rollup-plugin-json";
import buble from "rollup-plugin-buble";
import resolve from "rollup-plugin-node-resolve";

config.input = "src/server/index.js";
config.output = {
  format: "cjs",
  file: require("../package.json").server
};
config.external = [
  "fs",
  "url",
  "http"
];
config.plugins = [
  json(),
  buble(),
  resolve({
    jsnext: true
  })
];

export default config;
