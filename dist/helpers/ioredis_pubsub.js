"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const ioRedis = require("ioredis");
const ioRedisConfig = {
    password: config_1.default.redis.pass || '',
    host: config_1.default.redis.host,
    connectTimeout: 10000,
    port: config_1.default.redis.port || 6379,
    enableOfflineQueue: true,
    sentinelPassword: config_1.default.redis.pass || '',
};
exports.default = () => {
    let conn = new ioRedis(ioRedisConfig);
    conn.on('error', (ev) => {
        console.log('IORedis Error:');
        console.log(ev);
    });
    return conn;
};

