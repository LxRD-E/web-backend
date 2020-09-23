"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const any = require("./v1/any");
exports.any = any;
const auth = require("./v1/auth");
exports.auth = auth;
const avatar = require("./v1/avatar");
exports.avatar = avatar;
const billing = require("./v1/billing");
exports.billing = billing;
const catalog = require("./v1/catalog");
exports.catalog = catalog;
const chat = require("./v1/chat");
exports.chat = chat;
const economy = require("./v1/economy");
exports.economy = economy;
const forum = require("./v1/forum");
exports.forum = forum;
const game = require("./v1/game");
exports.game = game;
const group = require("./v1/group");
exports.group = group;
const mod = require("./v1/moderation");
exports.mod = mod;
const notification = require("./v1/notification");
exports.notification = notification;
const settings = require("./v1/settings");
exports.settings = settings;
const staff = require("./v1/staff");
exports.staff = staff;
const thumbnails = require("./v1/thumnails");
exports.thumbnails = thumbnails;
const user = require("./v1/user");
exports.user = user;
const ad = require("./v1/ad");
exports.ad = ad;
const support = require("./v1/support");
exports.support = support;
const feed = require("./v1/feed");
exports.feed = feed;
const reportAbuse = require("./v1/report-abuse");
exports.reportAbuse = reportAbuse;
const currencyExchange = require("./v1/currency-exchange");
exports.currencyExchange = currencyExchange;
const dataPersistence = require("./v1/data-persistence");
exports.dataPersistence = dataPersistence;
const userReferral = require("./v1/user-referral");
exports.userReferral = userReferral;
const tradeAds = require("./v1/trade-ads");
exports.tradeAds = tradeAds;
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
class _errorData {
}
__decorate([
    common_1.Required(),
    swagger_1.Example('InternalServerError'),
    __metadata("design:type", String)
], _errorData.prototype, "code", void 0);
class Error {
    constructor() {
        this.success = false;
    }
}
__decorate([
    common_1.Required(),
    swagger_1.Example(false),
    __metadata("design:type", Boolean)
], Error.prototype, "success", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", _errorData)
], Error.prototype, "error", void 0);
exports.Error = Error;
class UserSession {
}
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSession.prototype, "userId", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserSession.prototype, "username", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSession.prototype, "passwordChanged", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSession.prototype, "banned", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSession.prototype, "theme", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSession.prototype, "primaryBalance", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSession.prototype, "secondaryBalance", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", Number)
], UserSession.prototype, "staff", void 0);
__decorate([
    common_1.Required(),
    __metadata("design:type", String)
], UserSession.prototype, "dailyAward", void 0);
exports.UserSession = UserSession;

