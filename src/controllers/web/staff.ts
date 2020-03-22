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

@Controller("/")
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
    @UseBefore(YesAuth)
    @Render('staff/index')
    public async directoryStaff(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Staff Directory', userInfo: userInfo});
    }

    @Get('/staff/create')
    @UseBefore(YesAuth)
    @Render('staff/create')
    public async createItem(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Staff Create', userInfo: userInfo});
    }

    @Get('/staff/currency-product')
    @UseBefore(YesAuth)
    @Render('staff/currency_product')
    public async currencyProductEditor(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 3 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Currency Products', userInfo: userInfo});
    }

    @Get('/staff/ban')
    @UseBefore(YesAuth)
    @Render('staff/ban')
    public async ban(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 2 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Ban a User', userInfo: userInfo});
    }

    @Get('/staff/unban')
    @UseBefore(YesAuth)
    @Render('staff/unban')
    public async unban(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 2 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Unban a User', userInfo: userInfo});
    }

    @Get('/staff/password')
    @UseBefore(YesAuth)
    @Render('staff/password')
    public async resetPassword(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 2 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Reset a password', userInfo: userInfo});
    }

    @Get('/staff/catalog')
    @UseBefore(YesAuth)
    @Render('staff/catalog_moderation')
    public async catalogPending(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Items Awaiting Moderator Approval', userInfo: userInfo});
    }

    @Get('/staff/report-abuse/user-status')
    @UseBefore(YesAuth)
    @Render('staff/report-abuse/user-status')
    public async reportAbuseUserStatus(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'User Status Reports', userInfo: userInfo});
    }

    @Get('/staff/give')
    @UseBefore(YesAuth)
    @Render('staff/give')
    public async giveItem(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 3 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Give an Item', userInfo: userInfo});
    }

    @Get('/staff/give/currency')
    @UseBefore(YesAuth)
    @Render('staff/give_currency')
    public async giveCurrency(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 3 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Give Currency', userInfo: userInfo});
    }

    @Get('/staff/banner')
    @UseBefore(YesAuth)
    @Render('staff/banner')
    public async editBanner(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 2 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Edit Banner', userInfo: userInfo});
    }

    @Get('/staff/user/profile')
    @UseBefore(YesAuth)
    @Render('staff/user/profile')
    public async moderationProfile(
        @Locals('userInfo') localUserData: UserModel.SessionUserInfo,
        @Required()
        @QueryParams('userId', Number) userId: number
    ) {
        const staff = localUserData.staff > 1 ? true : false;
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
        try {
            userInfo = await this.user.getInfo(userId, ['accountStatus','userId','username','primaryBalance','secondaryBalance','blurb','staff','birthDate','dailyAward','lastOnline','status','joinDate','forumSignature', '2faEnabled']);
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
        return ViewData;
    }

    @Get('/staff/groups/manage')
    @UseBefore(YesAuth)
    @Render('staff/groups/manage')
    public async moderationGroup(
        @Locals('userInfo') localUserData: UserModel.SessionUserInfo,
        @Required()
        @QueryParams('groupId', Number) groupId: number
    ) {
        const staff = localUserData.staff >= 2 ? true : false;
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
    @UseBefore(YesAuth)
    @Render('staff/forums')
    public async modifyForums(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 3 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let cats = await this.forum.getCategories();
        let subs = await this.forum.getSubCategories();
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
    @UseBefore(YesAuth)
    @Render('staff/tickets')
    public async staffTickets(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'View Tickets Awaiting Response', userInfo: userInfo});
    }

    @Get('/staff/user/search')
    @Use(YesAuth)
    @Render('staff/user/search')
    public async searchUsers(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        const staff = userInfo.staff >= 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return new this.WWWTemplate({title: 'Search Users', userInfo: userInfo});
    }

    @Get('/staff/user/search_results')
    @Use(YesAuth)
    @Render('staff/user/search_results')
    public async searchUsersResults(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @Req() req: Req,
    ) {
        const staff = userInfo.staff >= 1 ? true : false;
        if (!staff) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let query: string;
        let column: string;
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
        console.log(column);
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
