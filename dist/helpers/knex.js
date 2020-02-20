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
if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        console.log('== start debug stats ==');
        let pool = knexSystem.client.pool;
        let numUsed = pool.numUsed();
        console.log('numUsed: ' + numUsed);
        let numFree = pool.numFree();
        console.log('numFree: ' + numFree);
        let numPendingAcquires = pool.numPendingAcquires();
        console.log('numPendingAcquires: ' + numPendingAcquires);
        let numPendingCreates = pool.numPendingCreates();
        console.log('numPendingCreates: ' + numPendingCreates);
        console.log('== end debug stats ==');
    }, 5000);
}

