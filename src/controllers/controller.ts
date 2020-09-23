// Import DAL
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
import currencyExchange from '../dal/currency-exchange';
import dataPersistence from '../dal/data-persistence';
import userReferral from '../dal/user-referral';
import tradeAds from '../dal/trade-ads';
// Model stuff
import { WWWTemplate } from '../models/v2/Www';
// Filters
import { numberWithCommas } from '../helpers/Filter';
// Events
import * as event from '../events/events';
// External libraries
import knex from '../helpers/knex';
import TSErrorsBase from "../helpers/Errors";
import xss = require('xss');
import moment = require('moment');
import Knex = require('knex');
import { QueryBuilder } from "knex";
import * as model from "../models/models";

type ValidTableNames = 'catalog' | 'catalog_assets' | 'catalog_comments' | 'chat_messages' | 'currency_exchange_fund' | 'currency_exchange_position' | 'currency_exchange_record' | 'currency_products' | 'currency_transactions' | 'forum_categories' | 'forum_posts' | 'forum_subcategories' | 'forum_threads' | 'friendships' | 'friend_request' | 'game' | 'game_map' | 'game_script' | 'game_server' | 'game_server_players' | 'game_thumbnails' | 'groups' | 'group_members' | 'group_members_pending' | 'group_ownership_change' | 'group_roles' | 'group_shout' | 'group_wall' | 'knex_migrations' | 'knex_migrations_lock' | 'moderation_ban' | 'moderation_currency' | 'moderation_give' | 'password_resets' | 'support_tickets' | 'support_ticket_responses' | 'thumbnails' | 'thumbnail_hashes' | 'trades' | "trade_items" | 'transactions' | 'users' | 'user_usernames' | 'user_ads' | 'user_avatar' | 'user_avatarcolor' | 'user_emails' | 'user_inventory' | 'user_ip' | 'user_messages' | 'user_moderation' | 'user_outfit' | 'user_outfit_avatar' | 'user_outfit_avatarcolor' | 'user_staff_comments' | 'user_status' | 'user_status_abuse_report' | 'user_status_comment' | 'user_status_comment_reply' | 'user_status_reactions';

type TransactionThis<T> = {
    auth: never;
    user: never;
    mod: never;
    group: never;
    game: never;
    forum: never;
    economy: never;
    chat: never;
    catalog: never;
    billing: never;
    avatar: never;
    notification: never;
    settings: never;
    staff: never;
    ad: never;
    support: never;
    tradeAds: never;
} & T;

/**
 * Standard controller that all other controllers should extend.
 * 
 * Adds dals and some helpers to controller classes
 */
export default class StandardController extends TSErrorsBase {
    // Random Stuff
    public WWWTemplate = WWWTemplate;
    public xss = xss;
    public moment = moment;
    public numberWithCommas = numberWithCommas;
    public static cError(...ers: string[]) {
        return {
            type: model.Error,
            description: ers.join('\n'),
        };
    }
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
    public currencyExchange = new currencyExchange();
    public dataPersistence = new dataPersistence();
    public userReferral = new userReferral();
    public tradeAds = new tradeAds();
    public event = event;
    /**
     * Begin a transaction while using normal controller services
     * This method will call trx.commit() internally
     *
     * # Note: Do not use an arrow function with this method. Typing will break.
     */
    public transaction<A extends this, T extends (this: TransactionThis<A>, arg1: IStandardControllerTRX) => Promise<any>>(thisParam: any, forUpdate: string[], callback: T): Promise<ReturnType<T>> {
        // Yeah, runtime type checks are dumb but if everybody writes proper unit tests then this shouldn't be an issue...
        if (process.env.NODE_ENV === 'development') {
            let stringifiedCallback = callback.toString();
            if (stringifiedCallback.slice(0, 'async function '.length) !== 'async function ' && stringifiedCallback.slice(0, 'function '.length) !== 'function ') {
                throw new Error('StandardController.transaction() does not support arrow functions.');
            }
        }
        return knex.transaction(async (trx) => {
            const newController: IStandardControllerTRX = new StandardController(trx);
            try {
                const originalKnex = newController.user.knex;
                for (const item of Object.getOwnPropertyNames(newController)) {
                    // @ts-ignore
                    let val = newController[item];
                    if (typeof val.knex !== 'undefined') {
                        val.knex = (tableName: string): QueryBuilder<any[]> => {
                            let newKnex = originalKnex(tableName);
                            if (forUpdate) {
                                return newKnex.forUpdate(forUpdate);
                            }
                            return newKnex;
                        }
                        val.knex.transaction = originalKnex.transaction;
                    }
                }
                return await callback.apply(thisParam, [newController]);
            } catch (e) {
                if (typeof e !== 'object') {
                    console.log('found the one that isnt an object, ', e);
                }
                throw e;
            }
        });
    }
    constructor(knexOverload?: Knex) {
        super();
        if (knexOverload) {
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
            this.currencyExchange.knex = knexOverload;
            this.userReferral.knex = knexOverload;
            this.tradeAds.knex = knexOverload;
        }
    }
}

class IStandardControllerTRX extends StandardController {
}

/**
 * Short for "controllerError". Joins all strings with new line
 * @param msg
 */
export const cError = (...msg: string[]) => {
    return {
        type: model.Error,
        description: msg.join('\n'),
    }
}
/**
 * Array of paging errors
 */
export const paging = ['InvalidOffset: Offset is invalid', 'InvalidLimit: limit is invalid'];