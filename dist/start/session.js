"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../helpers/config");
const options = config_1.default.redis;
const session = require("express-session");
exports.parser = session({
    name: 'rbxsession',
    secret: config_1.default.session.secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: config_1.default.session.secure,
        maxAge: 86400 * 1000 * 30 * 12,
        sameSite: 'lax',
    },
});
exports.default = exports.parser;

