import config from "./rollup.config";
import json from "rollup-plugin-json";
import buble from "rollup-plugin-buble";
import resolve from "rollup-plugin-node-resolve";
import commonjs from "rollup-plugin-commonjs";

config.output = {
  format: "iife",
  file: require("../package.json").browser
};
config.external = [];
config.plugins = [
  json(),
  buble(),
  resolve({
    jsnext: true,
    browser: true
  }),
  commonjs({
    namedExports: {}
  })
];

export default config;
