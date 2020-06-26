"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const knexLibrary = require("knex");
let thingToExport;
if (process.env.NODE_ENV !== 'test') {
    let mysqlConfig = {
        debug: false,
        client: 'mysql',
        connection: config_1.default["mysql"],
        propagateCreateError: false,
        pool: {
            propagateCreateError: false,
            max: 50,
            min: 3,
        }
    };
    thingToExport = knexLibrary(mysqlConfig);
}
else {
    const func = (table) => {
        console.error('process.env is test; knex should not be accessed. exiting with code 1');
        process.exit(1);
    };
    thingToExport = func;
}
exports.default = thingToExport;

