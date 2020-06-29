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
const model = require("../../models/models");
const Www_1 = require("../../models/v2/Www");
const controller_1 = require("../controller");
const moment = require("moment");
const UserModel = require("../../models/v1/user");
const Auth_1 = require("../../middleware/Auth");
const Middleware = require("../../middleware/middleware");
let WWWStaffController = class WWWStaffController extends controller_1.default {
    constructor() {
        super();
    }
    async listOfStaff() {
        return new this.WWWTemplate({ title: 'Staff' });
    }
    async directoryStaff(userInfo) {
        return new this.WWWTemplate({ title: 'Staff Directory', userInfo: userInfo });
    }
    async createItem(userInfo) {
        return new this.WWWTemplate({ title: 'Staff Create', userInfo: userInfo });
    }
    async currencyProductEditor(userInfo) {
        return new this.WWWTemplate({ title: 'Currency Products', userInfo: userInfo });
    }
    async ban(userInfo) {
        return new this.WWWTemplate({ title: 'Ban a User', userInfo: userInfo });
    }
    async unban(userInfo) {
        return new this.WWWTemplate({ title: 'Unban a User', userInfo: userInfo });
    }
    async resetPassword(userInfo) {
        return new this.WWWTemplate({ title: 'Reset a password', userInfo: userInfo });
    }
    async catalogPending(userInfo) {
        return new this.WWWTemplate({ title: 'Items Awaiting Moderator Approval', userInfo: userInfo });
    }
    async reportAbuseUserStatus(userInfo) {
        return new this.WWWTemplate({ title: 'User Status Reports', userInfo: userInfo });
    }
    async giveItem(userInfo) {
        return new this.WWWTemplate({ title: 'Give an Item', userInfo: userInfo });
    }
    async giveCurrency(userInfo) {
        return new this.WWWTemplate({ title: 'Give Currency', userInfo: userInfo });
    }
    async editBanner(userInfo) {
        return new this.WWWTemplate({ title: 'Edit Banner', userInfo: userInfo });
    }
    async moderationProfile(localUserData, userId) {
        const staff = localUserData.staff > 1;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let userInfo;
        let moderationHistory;
        let isOnline = false;
        let isOver13 = false;
        let isEmailVerified = false;
        let userEmails = [];
        let twoFactorEnabled = false;
        let allStaffPermissionTypes = model.staff.Permission;
        let alreadySelectedPermissions = await this.staff.getPermissions(userId);
        try {
            userInfo = await this.user.getInfo(userId, ['accountStatus', 'userId', 'username', 'primaryBalance', 'secondaryBalance', 'blurb', 'staff', 'birthDate', 'dailyAward', 'lastOnline', 'status', 'joinDate', 'forumSignature', '2faEnabled', 'isDeveloper']);
            if (userInfo['2faEnabled'] === 1) {
                twoFactorEnabled = true;
            }
            if (moment().isSameOrAfter(moment(userInfo.birthDate).add(13, 'years'))) {
                isOver13 = true;
            }
            if (moment(userInfo.lastOnline).isSameOrAfter(moment().subtract(5, 'minutes'))) {
                isOnline = true;
            }
            moderationHistory = await this.staff.getModerationHistory(userId);
            const emailInfo = await this.settings.getUserEmail(userId);
            if (emailInfo && emailInfo.status === model.user.emailVerificationType.true) {
                isEmailVerified = true;
            }
            userEmails = await this.settings.getUserEmails(userId);
        }
        catch (e) {
            console.log(e);
            throw new this.BadRequest('InvalidUserId');
        }
        let ViewData = new Www_1.WWWTemplate({ 'title': userInfo.username + "'s Moderation Profile" });
        ViewData.page.online = isOnline;
        ViewData.page.isOver13 = isOver13;
        ViewData.page.isEmailVerified = isEmailVerified;
        ViewData.page.userInfo = userInfo;
        ViewData.page.ModerationHistory = moderationHistory;
        ViewData.page.userEmails = userEmails;
        ViewData.page.twoFactorEnabled = twoFactorEnabled;
        const staffPermissionSelect = [];
        let currentUserInfo = await this.staff.getPermissions(userInfo.userId);
        if (currentUserInfo.includes(model.staff.Permission.ManageStaff) || localUserData.staff >= 100) {
            for (const perm of alreadySelectedPermissions) {
                let int = parseInt(perm, 10);
                if (!isNaN(int)) {
                    let str = model.staff.Permission[int];
                    staffPermissionSelect.push({
                        string: str,
                        selected: true,
                    });
                }
            }
            for (const extraPerm in allStaffPermissionTypes) {
                let int = parseInt(extraPerm, 10);
                if (isNaN(int)) {
                    let included = staffPermissionSelect.map(val => { return val.string === extraPerm; });
                    if (!included[0]) {
                        staffPermissionSelect.push({
                            string: extraPerm,
                            selected: false,
                        });
                    }
                }
            }
        }
        ViewData.page.staffPermissionSelect = staffPermissionSelect;
        return ViewData;
    }
    async moderationTrades(localUserData, userId) {
        const staff = localUserData.staff > 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let userInfo;
        try {
            userInfo = await this.user.getInfo(userId, ['userId', 'username']);
        }
        catch (e) {
            console.log(e);
            throw new this.BadRequest('InvalidUserId');
        }
        let ViewData = new Www_1.WWWTemplate({ 'title': userInfo.username + "'s Trades" });
        ViewData.page.userId = userInfo.userId;
        ViewData.page.username = userInfo.username;
        return ViewData;
    }
    async moderationGroup(localUserData, groupId) {
        const staff = localUserData.staff >= 2;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
        }
        catch (e) {
            console.log(e);
            throw new this.BadRequest('InvalidGroupId');
        }
        let ViewData = new Www_1.WWWTemplate({ 'title': "Manage \"" + groupInfo.groupName + "\"" });
        ViewData.page = {
            groupInfo: groupInfo,
        };
        return ViewData;
    }
    async modifyForums(userInfo) {
        let cats = await this.forum.getCategories();
        let subs = await this.forum.getSubCategories();
        for (const sub of subs) {
            for (const cat of cats) {
                if (sub.categoryId === cat.categoryId) {
                    sub['category'] = cat;
                }
            }
        }
        return new this.WWWTemplate({ title: 'Modify Forum Categories/SubCategories', userInfo: userInfo, page: {
                subs: subs,
                cats: cats,
            } });
    }
    async staffTickets(userInfo) {
        return new this.WWWTemplate({ title: 'View Tickets Awaiting Response', userInfo: userInfo });
    }
    async searchUsers(userInfo) {
        return new this.WWWTemplate({ title: 'Search Users', userInfo: userInfo });
    }
    async searchUsersResults(userInfo, req) {
        let query;
        let column;
        if (req.query.email) {
            query = req.query.email;
            column = 'email';
        }
        if (req.query.username) {
            query = req.query.username;
            column = 'username';
        }
        if (req.query.userId) {
            query = req.query.userId;
            column = 'userId';
        }
        if (!column || !query) {
            throw new this.BadRequest('SchemaValidationFailed');
        }
        let results = [];
        if (column === 'email') {
            try {
                let result = await this.settings.getUserByEmail(query);
                results.push(result);
            }
            catch (e) {
            }
        }
        else if (column === 'username') {
            try {
                let result = await this.user.userNameToId(query);
                results.push({
                    userId: result,
                    username: query,
                });
            }
            catch (e) {
            }
        }
        else if (column === 'userId') {
            try {
                let result = await this.user.getInfo(parseInt(query, 10), ['userId', 'username']);
                results.push({
                    userId: result.userId,
                    username: result.username,
                });
            }
            catch (e) {
                console.error(e);
            }
        }
        return new this.WWWTemplate({ title: 'Search Users', page: {
                results: results,
                column: column,
                query: query,
            } });
    }
};
__decorate([
    common_1.Get('/staff'),
    common_1.Render('staff_users'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "listOfStaff", null);
__decorate([
    common_1.Get('/staff/directory'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('staff/index'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "directoryStaff", null);
__decorate([
    common_1.Get('/staff/create'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.UploadStaffAssets)),
    common_1.Render('staff/create'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "createItem", null);
__decorate([
    common_1.Get('/staff/currency-product'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ManageCurrencyProducts)),
    common_1.Render('staff/currency_product'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "currencyProductEditor", null);
__decorate([
    common_1.Get('/staff/ban'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.BanUser)),
    common_1.Render('staff/ban'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "ban", null);
__decorate([
    common_1.Get('/staff/unban'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.UnbanUser)),
    common_1.Render('staff/unban'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "unban", null);
__decorate([
    common_1.Get('/staff/password'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ResetPassword)),
    common_1.Render('staff/password'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "resetPassword", null);
__decorate([
    common_1.Get('/staff/catalog'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewPendingItems)),
    common_1.Render('staff/catalog_moderation'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "catalogPending", null);
__decorate([
    common_1.Get('/staff/report-abuse/user-status'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewAbuseReports)),
    common_1.Render('staff/report-abuse/user-status'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "reportAbuseUserStatus", null);
__decorate([
    common_1.Get('/staff/give'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.GiveItemToUser)),
    common_1.Render('staff/give'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "giveItem", null);
__decorate([
    common_1.Get('/staff/give/currency'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.GiveCurrencyToUser)),
    common_1.Render('staff/give_currency'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "giveCurrency", null);
__decorate([
    common_1.Get('/staff/banner'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ManageBanner)),
    common_1.Render('staff/banner'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "editBanner", null);
__decorate([
    common_1.Get('/staff/user/profile'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewUserInformation)),
    common_1.Render('staff/user/profile'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.QueryParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "moderationProfile", null);
__decorate([
    common_1.Get('/staff/user/trades'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.GiveItemToUser)),
    common_1.Render('staff/user/trades'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.QueryParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "moderationTrades", null);
__decorate([
    common_1.Get('/staff/groups/manage'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ManageGroup)),
    common_1.Render('staff/groups/manage'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.QueryParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "moderationGroup", null);
__decorate([
    common_1.Get('/staff/forums'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ManageForumCategories)),
    common_1.Render('staff/forums'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "modifyForums", null);
__decorate([
    common_1.Get('/staff/tickets'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ManageSupportTickets)),
    common_1.Render('staff/tickets'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "staffTickets", null);
__decorate([
    common_1.Get('/staff/user/search'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewUserInformation)),
    common_1.Render('staff/user/search'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "searchUsers", null);
__decorate([
    common_1.Get('/staff/user/search_results'),
    common_1.Use(Auth_1.YesAuth, Middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo)),
    common_1.Render('staff/user/search_results'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Object]),
    __metadata("design:returntype", Promise)
], WWWStaffController.prototype, "searchUsersResults", null);
WWWStaffController = __decorate([
    common_1.Controller("/"),
    common_1.UseBefore(Middleware.staff.AddPermissionsToLocals),
    __metadata("design:paramtypes", [])
], WWWStaffController);
exports.WWWStaffController = WWWStaffController;

