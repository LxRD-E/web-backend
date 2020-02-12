"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const configString = JSON.parse(fs_1.readFileSync(path_1.join(__dirname, '../../config.json')).toString());
const configJson = Object.freeze(configString);
exports.default = configJson;

