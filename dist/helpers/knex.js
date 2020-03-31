"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const knexLibrary = require("knex");
let mysqlConfig = {
    debug: false,
    client: 'mysql',
    connection: config_1.default["mysql"],
    propagateCreateError: false,
    pool: {
        propagateCreateError: false,
        max: 50,
        min: 1,
    }
};
const knexSystem = knexLibrary(mysqlConfig);
exports.default = knexSystem;

