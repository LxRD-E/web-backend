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
const Filter_1 = require("../../helpers/Filter");
const model = require("../../models/models");
const Auth_1 = require("../../middleware/Auth");
let WWWGroupController = class WWWGroupController extends controller_1.default {
    async users() { return new this.WWWTemplate({ title: 'Search Groups' }); }
    async groupCreate(userInfo) {
        return new this.WWWTemplate({ 'title': 'Create a Group', userInfo: userInfo });
    }
    async groupCatalogCreate(res, userInfo, filteredId, groupName) {
        const userData = userInfo;
        if (!userData) {
            return res.redirect("/login?return=/groups/" + filteredId + "/" + groupName + "/manage");
        }
        if (!filteredId) {
            return res.redirect("/404");
        }
        let groupData;
        let userRole;
        try {
            groupData = await this.group.getInfo(filteredId);
            if (groupData.groupStatus === model.group.groupStatus.locked) {
                return res.redirect("/404");
            }
            userRole = await this.group.getUserRole(filteredId, userData.userId);
        }
        catch (e) {
            return res.redirect("/404");
        }
        if (userRole.permissions.manage === 0) {
            return res.redirect("/groups/" + filteredId + "/" + Filter_1.urlEncode(groupData.groupName));
        }
        let viewData = new this.WWWTemplate({ 'title': 'Create a Catalog Item' });
        viewData.page.groupId = groupData.groupId;
        viewData.page.groupName = groupData.groupName;
        viewData.page.groupEncodedName = Filter_1.urlEncode(groupData.groupName);
        return viewData;
    }
    async redirectToGroupPage(res, filteredCatalogId) {
        if (!filteredCatalogId) {
            return res.redirect("/404");
        }
        let groupData;
        try {
            groupData = await this.group.getInfo(filteredCatalogId);
            const encodedName = Filter_1.urlEncode(groupData.groupName);
            return res.redirect("/groups/" + filteredCatalogId + "/" + encodedName);
        }
        catch (e) {
            return res.redirect("/404");
        }
    }
    async groupPage(userInfo, res, filteredId, groupName) {
        if (!filteredId) {
            return res.redirect("/404");
        }
        let groupData;
        try {
            groupData = await this.group.getInfo(filteredId);
            if (groupData.groupStatus === model.group.groupStatus.locked) {
                return res.redirect("/404");
            }
        }
        catch (e) {
            return res.redirect("/404");
        }
        let viewData = new this.WWWTemplate({ 'title': '' });
        viewData.page.groupId = groupData.groupId;
        viewData.page.groupName = groupData.groupName;
        viewData.page.groupEncodedName = Filter_1.urlEncode(groupData.groupName);
        viewData.page.groupOwnerUserId = groupData.groupOwnerUserId;
        viewData.page.groupMemberCount = groupData.groupMemberCount;
        viewData.page.groupDescription = groupData.groupDescription;
        viewData.page.groupIconCatalogId = groupData.groupIconCatalogId;
        viewData.userInfo = userInfo;
        viewData.title = groupData.groupName;
        return viewData;
    }
    async groupManage(userInfo, res, filteredId, groupName) {
        const userData = userInfo;
        if (!userData) {
            return res.redirect("/login?return=/groups/" + filteredId + "/" + groupName + "/manage");
        }
        if (!filteredId) {
            return res.redirect("/404");
        }
        let groupData;
        let userRole;
        try {
            groupData = await this.group.getInfo(filteredId);
            if (groupData.groupStatus === model.group.groupStatus.locked) {
                return res.redirect("/404");
            }
            userRole = await this.group.getUserRole(filteredId, userData.userId);
        }
        catch (e) {
            return res.redirect("/404");
        }
        if (userRole.permissions.manage === 0) {
            return res.redirect("/groups/" + filteredId + "/" + Filter_1.urlEncode(groupData.groupName));
        }
        let funds;
        try {
            funds = await this.group.getGroupFunds(filteredId);
        }
        catch (e) {
            return res.redirect("/500");
        }
        let viewData = new this.WWWTemplate({ 'title': '' });
        viewData.page.groupId = groupData.groupId;
        viewData.page.Primary = funds.Primary;
        viewData.page.Secondary = funds.Secondary;
        viewData.page.groupName = groupData.groupName;
        viewData.page.groupEncodedName = Filter_1.urlEncode(groupData.groupName);
        viewData.page.groupOwnerUserId = groupData.groupOwnerUserId;
        viewData.page.groupMemberCount = groupData.groupMemberCount;
        viewData.page.groupDescription = groupData.groupDescription;
        viewData.page.groupIconCatalogId = groupData.groupIconCatalogId;
        viewData.title = groupData.groupName;
        return viewData;
    }
};
__decorate([
    common_1.Get('/groups'),
    swagger_1.Summary('Search gropus'),
    common_1.Render('search_groups'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WWWGroupController.prototype, "users", null);
__decorate([
    common_1.Get('/groups/create'),
    swagger_1.Summary('Create group page'),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Render('group_create'),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], WWWGroupController.prototype, "groupCreate", null);
__decorate([
    common_1.Get('/groups/:groupId/:groupName/create'),
    swagger_1.Summary('Group item creation page'),
    common_1.Render('catalog_creategroup'),
    __param(0, common_1.Res()),
    __param(1, common_1.Locals('userInfo')),
    __param(2, common_1.PathParams('groupId', Number)),
    __param(3, common_1.PathParams('groupName', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], WWWGroupController.prototype, "groupCatalogCreate", null);
__decorate([
    common_1.Get('/groups/:groupId'),
    __param(0, common_1.Res()),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], WWWGroupController.prototype, "redirectToGroupPage", null);
__decorate([
    common_1.Get('/groups/:groupId/:groupName'),
    swagger_1.Summary('Group page'),
    common_1.Render('groups'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Res()),
    __param(2, common_1.PathParams('groupId', Number)),
    __param(3, common_1.PathParams('groupName', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Object, Number, String]),
    __metadata("design:returntype", Promise)
], WWWGroupController.prototype, "groupPage", null);
__decorate([
    common_1.Get('/groups/:groupId/:groupName/manage'),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Render('group_manage'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Res()),
    __param(2, common_1.PathParams('groupId', Number)),
    __param(3, common_1.PathParams('groupName', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Object, Number, String]),
    __metadata("design:returntype", Promise)
], WWWGroupController.prototype, "groupManage", null);
WWWGroupController = __decorate([
    common_1.Controller('/')
], WWWGroupController);
exports.WWWGroupController = WWWGroupController;

