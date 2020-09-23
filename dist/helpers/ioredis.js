"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const IORedis = require("ioredis");
let redis;
let get = () => {
    return redis;
};
exports.get = get;
if (process.env.NODE_ENV !== 'test') {
    const ioRedisConfig = {
        password: config_1.default.redis.pass || '',
        host: config_1.default.redis.host,
        connectTimeout: 1000,
        port: config_1.default.redis.port || 6379,
        enableOfflineQueue: true,
        sentinelPassword: config_1.default.redis.pass || '',
    };
    redis = new IORedis(ioRedisConfig);
    redis.on('error', (ev) => {
        console.error('IORedis Error:', ev);
        try {
            redis.disconnect();
        }
        catch (err) {
            console.error('ioredis disconnect error', err);
        }
        redis = new IORedis(ioRedisConfig);
    });
}
exports.default = redis;

