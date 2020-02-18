"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_httpexceptions_1 = require("ts-httpexceptions");
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
const Www_1 = require("../models/v2/Www");
const xss = require("xss");
const moment = require("moment");
const Filter_1 = require("../helpers/Filter");
class StandardController {
    constructor() {
        this.NotFound = ts_httpexceptions_1.NotFound;
        this.BadRequest = ts_httpexceptions_1.BadRequest;
        this.Conflict = ts_httpexceptions_1.Conflict;
        this.Unauthorized = ts_httpexceptions_1.Unauthorized;
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
    }
}
exports.default = StandardController;

