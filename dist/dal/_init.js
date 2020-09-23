"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("../helpers/knex");
const redis = require("../helpers/ioredis");
const moment = require("moment");
const ts_httpexceptions_1 = require("ts-httpexceptions");
const Errors_1 = require("../helpers/Errors");
const geoip = require("geoip-lite");
const countryList = require("country-list");
class DAL extends Errors_1.default {
    constructor(knexService = knex_1.default) {
        super();
        this.NotFound = ts_httpexceptions_1.NotFound;
        this.BadRequest = ts_httpexceptions_1.BadRequest;
        this.Conflict = ts_httpexceptions_1.Conflict;
        this.Unauthorized = ts_httpexceptions_1.Unauthorized;
        this.geoip = geoip;
        this.countryList = countryList;
        this.knexTime = (momentObject) => {
            if (!momentObject) {
                return this.moment().format('YYYY-MM-DD HH:mm:ss');
            }
            return momentObject.format('YYYY-MM-DD HH:mm:ss');
        };
        this.knex = knexService;
        this.redis = redis.get();
        this.moment = moment;
    }
}
exports.default = DAL;

