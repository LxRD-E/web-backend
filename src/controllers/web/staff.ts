import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, UseBeforeEach } from "@tsed/common";
import { Description, Summary } from "@tsed/swagger"; // import swagger Ts.ED module
import { Exception, NotFound, BadRequest } from "ts-httpexceptions";
import * as Express from 'express';
import * as model from '../../models/models';
import { WWWTemplate } from '../../models/v2/Www';
import controller from '../controller'
import moment = require("moment");
import xss = require('xss');
import Config from '../../helpers/config';
// Models
import * as UserModel from '../../models/v1/user';
import { NoAuth, YesAuth } from "../../middleware/Auth";
import {numberWithCommas} from '../../helpers/Filter';
import * as Middleware from '../../middleware/middleware';

@Controller("/")
@UseBefore(Middleware.staff.AddPermissionsToLocals)
export class WWWStaffController extends controller {
    constructor() {
        super();
    }

    @Get('/staff')
    @Render('staff_users')
    public async listOfStaff() {
        return new this.WWWTemplate({title: 'Staff'});
    }

    @Get('/staff/directory')
    @Use(YesAuth)
    @Render('staff/index')
    public async directoryStaff(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Staff Directory', userInfo: userInfo});
    }

    @Get('/staff/create')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.UploadStaffAssets))
    @Render('staff/create')
    public async createItem(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Staff Create', userInfo: userInfo});
    }

    @Get('/staff/currency-product')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ManageCurrencyProducts))
    @Render('staff/currency_product')
    public async currencyProductEditor(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Currency Products', userInfo: userInfo});
    }

    @Get('/staff/ban')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.BanUser))
    @Render('staff/ban')
    public async ban(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Ban a User', userInfo: userInfo});
    }

    @Get('/staff/unban')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.UnbanUser))
    @Render('staff/unban')
    public async unban(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Unban a User', userInfo: userInfo});
    }

    @Get('/staff/password')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ResetPassword))
    @Render('staff/password')
    public async resetPassword(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Reset a password', userInfo: userInfo});
    }

    @Get('/staff/catalog')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewPendingItems))
    @Render('staff/catalog_moderation')
    public async catalogPending(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Items Awaiting Moderator Approval', userInfo: userInfo});
    }

    @Get('/staff/report-abuse/user-status')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewAbuseReports))
    @Render('staff/report-abuse/user-status')
    public async reportAbuseUserStatus(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'User Status Reports', userInfo: userInfo});
    }

    @Get('/staff/give')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.GiveItemToUser))
    @Render('staff/give')
    public async giveItem(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Give an Item', userInfo: userInfo});
    }

    @Get('/staff/give/currency')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.GiveCurrencyToUser))
    @Render('staff/give_currency')
    public async giveCurrency(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Give Currency', userInfo: userInfo});
    }

    @Get('/staff/banner')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ManageBanner))
    @Render('staff/banner')
    public async editBanner(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Edit Banner', userInfo: userInfo});
    }

    @Get('/staff/user/profile')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewUserInformation))
    @Render('staff/user/profile')
    public async moderationProfile(
        @Locals('userInfo') localUserData: UserModel.SessionUserInfo,
        @Required()
        @QueryParams('userId', Number) userId: number
    ) {
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
            userInfo = await this.user.getInfo(userId, ['accountStatus','userId','username','primaryBalance','secondaryBalance','blurb','staff','birthDate','dailyAward','lastOnline','status','joinDate','forumSignature', '2faEnabled', 'isDeveloper']);
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
        }catch(e) {
            console.log(e);
            throw new this.BadRequest('InvalidUserId');
        }
        let ViewData = new WWWTemplate({'title': userInfo.username+"'s Moderation Profile"});
        ViewData.page.online = isOnline;
        ViewData.page.isOver13 = isOver13;
        ViewData.page.isEmailVerified = isEmailVerified;
        ViewData.page.userInfo = userInfo;
        ViewData.page.ModerationHistory = moderationHistory;
        ViewData.page.userEmails = userEmails;
        ViewData.page.twoFactorEnabled = twoFactorEnabled;

        const staffPermissionSelect: {string: string; selected: boolean}[] = [];
        let currentUserInfo = await this.staff.getPermissions(userInfo.userId);
        if (currentUserInfo.includes(model.staff.Permission.ManageStaff) || localUserData.staff >= 100) {
            for (const perm of alreadySelectedPermissions) {
                let int = parseInt(perm as any, 10);
                if (!isNaN(int)) {
                    let str = model.staff.Permission[int];
                    staffPermissionSelect.push({
                        string: str,
                        selected: true,
                    })
                }
            }

            for (const extraPerm in allStaffPermissionTypes) {
                let int = parseInt(extraPerm as any, 10);
                if (isNaN(int)) {
                    let included = staffPermissionSelect.map(val => {return val.string === extraPerm});
                    if (!included[0]) {
                        staffPermissionSelect.push({
                            string: extraPerm,
                            selected: false,
                        })
                    }
                }
            }
        }
        ViewData.page.staffPermissionSelect = staffPermissionSelect;
        return ViewData;
    }

    @Get('/staff/user/trades')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.GiveItemToUser))
    @Render('staff/user/trades')
    public async moderationTrades(
        @Locals('userInfo') localUserData: UserModel.SessionUserInfo,
        @Required()
        @QueryParams('userId', Number) userId: number
    ) {
        const staff = localUserData.staff > 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let userInfo;
        try {
            userInfo = await this.user.getInfo(userId, ['userId','username']);
        }catch(e) {
            console.log(e);
            throw new this.BadRequest('InvalidUserId');
        }
        let ViewData = new WWWTemplate({'title': userInfo.username+"'s Trades"});
        ViewData.page.userId = userInfo.userId;
        ViewData.page.username = userInfo.username;
        return ViewData;
    }

    @Get('/staff/groups/manage')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ManageGroup))
    @Render('staff/groups/manage')
    public async moderationGroup(
        @Locals('userInfo') localUserData: UserModel.SessionUserInfo,
        @Required()
        @QueryParams('groupId', Number) groupId: number
    ) {
        const staff = localUserData.staff >= 2;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let groupInfo: model.group.groupDetails;
        try {
            groupInfo = await this.group.getInfo(groupId);
        }catch(e) {
            console.log(e);
            throw new this.BadRequest('InvalidGroupId');
        }
        let ViewData = new WWWTemplate({'title': "Manage \""+groupInfo.groupName+"\""});
        ViewData.page = {
            groupInfo: groupInfo,  
        };
        return ViewData;
    }

    @Get('/staff/forums')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ManageForumCategories))
    @Render('staff/forums')
    public async modifyForums(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        let cats: any = await this.forum.getCategories();
        let subs: any = await this.forum.getSubCategories();
        for (const sub of subs) {
            for (const cat of cats) {
                if (sub.categoryId === cat.categoryId) {
                    sub['category'] = cat;
                }
            }
        }
        return new this.WWWTemplate({title: 'Modify Forum Categories/SubCategories', userInfo: userInfo, page: {
            subs: subs,
            cats: cats,
        }});
    }

    @Get('/staff/tickets')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ManageSupportTickets))
    @Render('staff/tickets')
    public async staffTickets(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'View Tickets Awaiting Response', userInfo: userInfo});
    }

    @Get('/staff/user/search')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ReviewUserInformation))
    @Render('staff/user/search')
    public async searchUsers(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Search Users', userInfo: userInfo});
    }

    @Get('/staff/user/search_results')
    @Use(YesAuth, Middleware.staff.validate(model.staff.Permission.ManagePublicUserInfo))
    @Render('staff/user/search_results')
    public async searchUsersResults(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @Req() req: Req,
    ) {
        let query: string|undefined;
        let column: string|undefined;
        if (req.query.email) {
            query = req.query.email;
            column = 'email';
        }
        if (req.query.username) {
            query = req.query.username;
            column= 'username';
        }
        if (req.query.userId) {
            query = req.query.userId;
            column = 'userId';
        }
        if (!column || !query) {
            throw new this.BadRequest('SchemaValidationFailed');
        }
        let results: {userId: number; username: string}[] = [];
        if (column === 'email') {
            try {
                let result = await this.settings.getUserByEmail(query)
                results.push(result);
            }catch(e) {

            }
        }else if (column === 'username') {
            try {
                let result = await this.user.userNameToId(query);
                results.push({
                    userId: result,
                    username: query,
                });
            }catch(e) {

            }
        }else if (column === 'userId') {
            try {
                let result = await this.user.getInfo(parseInt(query, 10), ['userId','username']);
                results.push({
                    userId: result.userId,
                    username: result.username,
                });
            }catch(e){
                console.error(e);
            }
        }
        return new this.WWWTemplate({title: 'Search Users', page: {
            results: results,
            column: column,
            query: query,
        }});
    }
}
