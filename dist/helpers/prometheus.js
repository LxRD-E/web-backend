"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promClient = require("prom-client");
promClient.collectDefaultMetrics();
const existingMaps = {};
exports.get = (name, help) => {
    if (existingMaps[name]) {
        return existingMaps[name];
    }
    let obj = {
        counter: new promClient.Counter({ name: name + '_counter', help: help }),
        historGram: new promClient.Histogram({ name: name + '_historgram', help: help }),
    };
    existingMaps[name] = obj;
    return obj;
};
exports.prom = promClient;

