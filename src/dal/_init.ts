import knex from '../helpers/knex';
import Knex = require('knex');

import redis from '../helpers/ioredis';
import ioredis = require('ioredis');
import moment = require('moment');

import { NotFound, BadRequest, Conflict, Unauthorized } from 'ts-httpexceptions';
/**
 * **Database Access Layer**
 * Provides access to knex and redis for DAL services.
 */
export default class DAL {
    // HTTP Exceptions
    public NotFound = NotFound;
    public BadRequest = BadRequest;
    public Conflict = Conflict;
    public Unauthorized = Unauthorized;
    public knex: Knex;
    public redis: ioredis.Redis;
    public moment: (inp?: moment.MomentInput, format?: moment.MomentFormatSpecification, strict?: boolean) => moment.Moment;
    public knexTime = (momentObject?: moment.Moment) => {
        if (!momentObject) {
            return this.moment().format('YYYY-MM-DD HH:mm:ss');
        }
        return momentObject.format('YYYY-MM-DD HH:mm:ss');
    }
    constructor(knexService: Knex = knex) {
        this.knex = knexService;
        this.redis = redis;
        this.moment = moment;
    }
}