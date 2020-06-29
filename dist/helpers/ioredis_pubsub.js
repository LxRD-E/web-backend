"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const IORedis = require("ioredis");
let redis;
let exportedFunc;
if (process.env.NODE_ENV !== 'test') {
    const ioRedisConfig = {
        password: config_1.default.redis.pass || '',
        host: config_1.default.redis.host,
        connectTimeout: 1000,
        port: config_1.default.redis.port || 6379,
        enableOfflineQueue: true,
        sentinelPassword: config_1.default.redis.pass || '',
    };
    exportedFunc = () => {
        let conn = new IORedis(ioRedisConfig);
        conn.on('error', (ev) => {
            console.log('IORedis Error:');
            console.log(ev);
        });
        return conn;
    };
}
else {
    let _testingExportFunc = () => {
        console.error('ioredis_pubsub should not be accessed in unit testing. exiting');
        process.exit(1);
    };
    exportedFunc = _testingExportFunc;
}
exports.default = exportedFunc;

