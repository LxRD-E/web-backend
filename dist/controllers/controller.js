"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth = require("../dal/auth");
const user_1 = require("../dal/user");
const moderation_1 = require("../dal/moderation");
const group_1 = require("../dal/group");
const game_1 = require("../dal/game");
const forum_1 = require("../dal/forum");
const economy_1 = require("../dal/economy");
const chat_1 = require("../dal/chat");
const catalog_1 = require("../dal/catalog");
const billing_1 = require("../dal/billing");
const avatar_1 = require("../dal/avatar");
const notification_1 = require("../dal/notification");
const settings_1 = require("../dal/settings");
const staff_1 = require("../dal/staff");
const ad_1 = require("../dal/ad");
const support_1 = require("../dal/support");
const report_abuse_1 = require("../dal/report-abuse");
const currency_exchange_1 = require("../dal/currency-exchange");
const data_persistence_1 = require("../dal/data-persistence");
const user_referral_1 = require("../dal/user-referral");
const trade_ads_1 = require("../dal/trade-ads");
const Www_1 = require("../models/v2/Www");
const Filter_1 = require("../helpers/Filter");
const event = require("../events/events");
const knex_1 = require("../helpers/knex");
const Errors_1 = require("../helpers/Errors");
const xss = require("xss");
const moment = require("moment");
const model = require("../models/models");
class StandardController extends Errors_1.default {
    constructor(knexOverload) {
        super();
        this.WWWTemplate = Www_1.WWWTemplate;
        this.xss = xss;
        this.moment = moment;
        this.numberWithCommas = Filter_1.numberWithCommas;
        this.auth = auth;
        this.user = new user_1.default();
        this.mod = new moderation_1.default();
        this.group = new group_1.default();
        this.game = new game_1.default();
        this.forum = new forum_1.default();
        this.economy = new economy_1.default();
        this.chat = new chat_1.default();
        this.catalog = new catalog_1.default();
        this.billing = new billing_1.default();
        this.avatar = new avatar_1.default();
        this.notification = new notification_1.default();
        this.settings = new settings_1.default();
        this.staff = new staff_1.default();
        this.ad = new ad_1.default();
        this.support = new support_1.default();
        this.reportAbuse = new report_abuse_1.default();
        this.currencyExchange = new currency_exchange_1.default();
        this.dataPersistence = new data_persistence_1.default();
        this.userReferral = new user_referral_1.default();
        this.tradeAds = new trade_ads_1.default();
        this.event = event;
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
    static cError(...ers) {
        return {
            type: model.Error,
            description: ers.join('\n'),
        };
    }
    transaction(thisParam, forUpdate, callback) {
        if (process.env.NODE_ENV === 'development') {
            let stringifiedCallback = callback.toString();
            if (stringifiedCallback.slice(0, 'async function '.length) !== 'async function ' && stringifiedCallback.slice(0, 'function '.length) !== 'function ') {
                throw new Error('StandardController.transaction() does not support arrow functions.');
            }
        }
        return knex_1.default.transaction(async (trx) => {
            const newController = new StandardController(trx);
            try {
                const originalKnex = newController.user.knex;
                for (const item of Object.getOwnPropertyNames(newController)) {
                    let val = newController[item];
                    if (typeof val.knex !== 'undefined') {
                        val.knex = (tableName) => {
                            let newKnex = originalKnex(tableName);
                            if (forUpdate) {
                                return newKnex.forUpdate(forUpdate);
                            }
                            return newKnex;
                        };
                        val.knex.transaction = originalKnex.transaction;
                    }
                }
                return await callback.apply(thisParam, [newController]);
            }
            catch (e) {
                if (typeof e !== 'object') {
                    console.log('found the one that isnt an object, ', e);
                }
                throw e;
            }
        });
    }
}
exports.default = StandardController;
class IStandardControllerTRX extends StandardController {
}
exports.cError = (...msg) => {
    return {
        type: model.Error,
        description: msg.join('\n'),
    };
};
exports.paging = ['InvalidOffset: Offset is invalid', 'InvalidLimit: limit is invalid'];

