import knex from '../helpers/knex';
import Knex = require('knex');

import redis from '../helpers/ioredis';
import ioredis = require('ioredis');
import moment = require('moment');

/**
 * **Database Access Layer**
 * Provides access to knex and redis for DAL services.
 */
export default class DAL {
    public knex: Knex;
    public redis: ioredis.Redis;
    public moment: (inp?: moment.MomentInput, format?: moment.MomentFormatSpecification, strict?: boolean) => moment.Moment;
    constructor(knexService: Knex = knex) {
        this.knex = knexService;
        this.redis = redis;
        this.moment = moment;
    }
}