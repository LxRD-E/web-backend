import knex from '../helpers/knex';
import Knex = require('knex');

import * as redis from '../helpers/ioredis';
import ioredis = require('ioredis');
import moment = require('moment');

import { NotFound, BadRequest, Conflict, Unauthorized } from 'ts-httpexceptions';
import TSErrorsBase from "../helpers/Errors";
import * as geoip from 'geoip-lite';
import * as countryList from 'country-list';
/**
 * **Database Access Layer**
 * Provides access to knex and redis for DAL services.
 */
export default class DAL extends TSErrorsBase {
    // HTTP Exceptions
    public NotFound = NotFound;
    public BadRequest = BadRequest;
    public Conflict = Conflict;
    public Unauthorized = Unauthorized;
    public knex: Knex;
    public redis: ioredis.Redis;
    public moment: (inp?: moment.MomentInput, format?: moment.MomentFormatSpecification, strict?: boolean) => moment.Moment;
    public geoip = geoip;
    public countryList = countryList;
    public knexTime = (momentObject?: moment.Moment) => {
        if (!momentObject) {
            return this.moment().format('YYYY-MM-DD HH:mm:ss');
        }
        return momentObject.format('YYYY-MM-DD HH:mm:ss');
    }
    constructor(knexService: Knex = knex) {
        super();
        this.knex = knexService;
        this.redis = redis.get();
        this.moment = moment;
    }
}