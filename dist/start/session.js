"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../helpers/config");
const options = config_1.default.redis;
const redis = require("redis");
const session = require("express-session");
let RedisStore = require('connect-redis')(session);
const redisConfig = {
    password: config_1.default.redis.pass || '',
    host: config_1.default.redis.host,
    port: config_1.default.redis.port || 6379,
    enable_offline_queue: true,
    auth_pass: config_1.default.redis.pass || '',
    no_ready_check: true,
};
let redisClient = redis.createClient(redisConfig);
redisClient.unref();
redisClient.on('error', (e) => {
    console.log('Redis Error');
    console.log(e);
});
let store = new RedisStore({ client: redisClient });
exports.parser = session({
    name: 'blockshub-session',
    secret: config_1.default.session.secret,
    resave: false,
    store: store,
    saveUninitialized: true,
    cookie: {
        secure: config_1.default.session.secure,
        maxAge: (86400 * 30 * 12) * 1000,
        sameSite: 'lax',
        domain: config_1.default.session.domain || '.blockshub.hh',
    },
});
exports.default = exports.parser;

