"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("../helpers/knex");
const ioredis_1 = require("../helpers/ioredis");
const moment = require("moment");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const Errors_1 = require("../helpers/Errors");
class DAL extends Errors_1.default {
    constructor(knexService = knex_1.default) {
        super();
        this.NotFound = ts_httpexceptions_1.NotFound;
        this.BadRequest = ts_httpexceptions_1.BadRequest;
        this.Conflict = ts_httpexceptions_1.Conflict;
        this.Unauthorized = ts_httpexceptions_1.Unauthorized;
        this.knexTime = (momentObject) => {
            if (!momentObject) {
                return this.moment().format('YYYY-MM-DD HH:mm:ss');
            }
            return momentObject.format('YYYY-MM-DD HH:mm:ss');
        };
        this.knex = knexService;
        this.redis = ioredis_1.default;
        this.moment = moment;
    }
}
exports.default = DAL;

