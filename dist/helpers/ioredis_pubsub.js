"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./config");
const ioRedis = require("ioredis");
const ioRedisConfig = {
    password: config_1.default.redis.pass || '',
    host: config_1.default.redis.host,
    connectTimeout: 10000,
    port: config_1.default.redis.port || 6379,
};
exports.default = () => {
    return new ioRedis(ioRedisConfig);
};

