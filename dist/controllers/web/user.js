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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const controller_1 = require("../controller");
const model = require("../../models/models");
const Auth_1 = require("../../middleware/Auth");
let WWWUsersController = class WWWUsersController extends controller_1.default {
    async profile(filteredUserId) {
        let ViewData = new this.WWWTemplate({ title: '' });
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", "blurb", "tradingEnabled", "staff", 'joinDate', 'lastOnline', 'status', 'accountStatus', 'forumPostCount']);
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }
        let usernameChanges = await this.user.getPastUsernames(filteredUserId);
        const primarySpan = '<span style="color:#28a745;margin-right: -3px;"><img alt="$" style="height: 1rem;" src="https://cdn.blockshub.net/static/money-green-2.svg"/> </span>';
        const secondarySpan = '<span style="color:#ffc107;margin-right: -3px;"><img alt="$" style="height: 1rem;" src="https://cdn.blockshub.net/static/coin-stack-yellow.svg"/> </span>';
        const xssfilter = new this.xss.FilterXSS({
            whiteList: {}
        });
        let filteredBlurb = xssfilter.process(userData.blurb);
        if (filteredBlurb && filteredBlurb.match(/\${primary}/g) || filteredBlurb && filteredBlurb.match(/\${secondary}/g)) {
            const balances = await this.user.getInfo(filteredUserId, ['primaryBalance', 'secondaryBalance']);
            filteredBlurb = filteredBlurb.replace(/\${primary}/g, '<span style="color: #28a745;">' + primarySpan + ' ' + this.numberWithCommas(balances.primaryBalance) + '</span>');
            filteredBlurb = filteredBlurb.replace(/\${secondary}/g, '<span style="color: #ffc107;">' + secondarySpan + ' ' + this.numberWithCommas(balances.secondaryBalance) + '</span>');
        }
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        ViewData.page.blurb = filteredBlurb;
        ViewData.page.forumPostCount = userData.forumPostCount;
        ViewData.page.status = userData.status;
        ViewData.page.tradingEnabled = userData.tradingEnabled;
        ViewData.page.staff = userData.staff;
        ViewData.page.usernameChanges = usernameChanges;
        if (userData.accountStatus === model.user.accountStatus.terminated) {
            ViewData.page.deleted = true;
        }
        ViewData.page.joinDate = this.moment(userData.joinDate);
        ViewData.page.lastOnline = this.moment(userData.lastOnline);
        if (this.moment(userData.lastOnline).isSameOrAfter(this.moment().subtract(3, 'minutes'))) {
            ViewData.page.online = true;
        }
        else {
            ViewData.page.online = false;
        }
        ViewData.title = userData.username + "'s Profile";
        return ViewData;
    }
    async inventory(filteredUserId) {
        let ViewData = new this.WWWTemplate({ title: '' });
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }
        ViewData.title = userData.username + "'s Inventory";
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }
    async friends(filteredUserId) {
        let ViewData = new this.WWWTemplate({ title: '' });
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }
        ViewData.title = userData.username + "'s Friends";
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }
    async groups(filteredUserId) {
        let ViewData = new this.WWWTemplate({ title: '' });
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }
        ViewData.title = userData.username + "'s Groups";
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }
    async games(filteredUserId) {
        let ViewData = new this.WWWTemplate({ title: '' });
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }
        ViewData.title = userData.username + "'s Games";
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }
    async trade(userInfo, filteredUserId) {
        if (userInfo.userId === filteredUserId) {
            throw new this.Conflict('UserCannotBeTradedWith');
        }
        let ViewData = new this.WWWTemplate({ title: 'Trade' });
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus', 'tradingEnabled']);
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.Conflict('UserCannotBeTradedWith');
        }
        if (userData.tradingEnabled !== model.user.tradingEnabled.true) {
            throw new this.Conflict('UserCannotBeTradedWith');
        }
        ViewData.title = 'Open Trade with ' + userData.username;
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }
    async users() { return new this.WWWTemplate({ title: 'Search Users' }); }
};
__decorate([
    common_1.Get('/users/:userId/profile'),
    swagger_1.Summary('Get user\'s profile'),
    common_1.Render('profile'),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WWWUsersController.prototype, "profile", null);
__decorate([
    common_1.Get('/users/:userId/inventory'),
    swagger_1.Summary('Get user\'s inventory'),
    common_1.Render('inventory'),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WWWUsersController.prototype, "inventory", null);
__decorate([
    common_1.Get('/users/:userId/friends'),
    swagger_1.Summary('Get user\'s friends'),
    common_1.Render('friends'),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WWWUsersController.prototype, "friends", null);
__decorate([
    common_1.Get('/users/:userId/groups'),
    swagger_1.Summary('Get user\'s groups'),
    common_1.Render('profile_groups'),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WWWUsersController.prototype, "groups", null);
__decorate([
    common_1.Get('/users/:userId/games'),
    swagger_1.Summary('Get user\'s games'),
    common_1.Render('profile_games'),
    __param(0, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WWWUsersController.prototype, "games", null);
__decorate([
    common_1.Get('/users/:userId/trade'),
    swagger_1.Summary('Open trade request with a user'),
    common_1.Render('trade'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], WWWUsersController.prototype, "trade", null);
__decorate([
    common_1.Get('/users'),
    swagger_1.Summary('Search users'),
    common_1.Render('search_users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WWWUsersController.prototype, "users", null);
WWWUsersController = __decorate([
    common_1.Controller('/')
], WWWUsersController);
exports.WWWUsersController = WWWUsersController;

