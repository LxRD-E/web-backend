"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const knex_1 = require("../helpers/knex");
const ioredis_1 = require("../helpers/ioredis");
const moment = require("moment");
class DAL {
    constructor(knexService = knex_1.default) {
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

