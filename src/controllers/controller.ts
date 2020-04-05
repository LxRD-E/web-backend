// Import DAL
import { NotFound, BadRequest, Conflict, Unauthorized } from 'ts-httpexceptions';
import * as auth from '../dal/auth';
import user from '../dal/user';
import mod from '../dal/moderation';
import group from '../dal/group';
import game from '../dal/game';
import forum from '../dal/forum';
import economy from '../dal/economy';
import chat from '../dal/chat';
import catalog from '../dal/catalog';
import billing from '../dal/billing';
import avatar from '../dal/avatar';
import notification from '../dal/notification';
import settings from '../dal/settings';
import staff from '../dal/staff';
import ad from '../dal/ad';
import support from '../dal/support';
import reportAbuse from '../dal/report-abuse';
import { WWWTemplate } from '../models/v2/Www';
import xss = require('xss');
import moment = require('moment');
import {numberWithCommas} from '../helpers/Filter';
import Knex = require('knex');
import knex from '../helpers/knex';
/**
 * Standard controller that all other controllers should extend.
 * 
 * Adds dals and some helpers to controller classes
 */
export default class StandardController {
    // HTTP Exceptions
    public NotFound = NotFound;
    public BadRequest = BadRequest;
    public Conflict = Conflict;
    public Unauthorized = Unauthorized;
    // Random Stuff
    public WWWTemplate = WWWTemplate;
    public xss = xss;
    public moment = moment;
    public numberWithCommas = numberWithCommas;
    // DALs
    public auth = auth;
    public user = new user();
    public mod = new mod();
    public group = new group();
    public game = new game();
    public forum = new forum();
    public economy = new economy();
    public chat = new chat();
    public catalog = new catalog();
    public billing = new billing();
    public avatar = new avatar();
    public notification = new notification();
    public settings = new settings();
    public staff = new staff();
    public ad = new ad();
    public support = new support();
    public reportAbuse = new reportAbuse();
    /**
     * Begin a transaction while using normal controller services
     * This method will call trx.commit() internally
     */
    public transaction(callback: (arg1: IStandardControllerTRX) => Promise<any>): Promise<void> {
        return knex.transaction(async (trx) => {
            const newController: IStandardControllerTRX = new StandardController(trx);
            try {
                await callback(newController);
            }catch(e) {
                if (typeof e !== 'object') {
                    console.log('found the one that isnt an object, ',e);
                }
                throw e;
            }
        });
    }
    constructor(knexOverload?: Knex) {
        if (knexOverload) {
            console.log('overloading knex');
            this.user.knex = knexOverload;
            this.mod.knex = knexOverload;
            this.group.knex = knexOverload;
            this.game.knex = knexOverload;
            this.forum.knex = knexOverload;
            this.economy.knex = knexOverload;
            this.chat.knex = knexOverload;
            this.catalog.knex = knexOverload;
            this.billing.knex = knexOverload;
            this.avatar.knex = knexOverload;
            this.notification.knex = knexOverload;
            this.settings.knex = knexOverload;
            this.staff.knex = knexOverload;
            this.ad.knex = knexOverload;
            this.support.knex = knexOverload;
            this.reportAbuse.knex = knexOverload;
        }
    }
}

class IStandardControllerTRX extends StandardController {
}