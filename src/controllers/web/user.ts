import { Controller, Get, Post, Render, Redirect, PathParams, QueryParams, UseBefore } from '@tsed/common';
import { Summary } from '@tsed/swagger';
import controller from '../controller';
import * as model from '../../models/models';
import { YesAuth } from '../../middleware/Auth';

@Controller('/')
export class WWWUsersController extends controller {
    
    @Get('/users/:userId/profile')
    @Summary('Get user\'s profile')
    @Render('profile')
    public async profile(
        @PathParams('userId', Number) filteredUserId: number
    ) {
        // Create View Data
        let ViewData = new this.WWWTemplate({ title: '' });
        // Grab user info
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", "blurb", "tradingEnabled", "staff", 'joinDate', 'lastOnline', 'status', 'accountStatus', 'forumPostCount']);
        // If deleted, throw 404
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }
        // Grab username changes (if any)
        let usernameChanges = await this.user.getPastUsernames(filteredUserId);
        // Define currency stuff:
        // Currency Variable Check
        const primarySpan = '<span style="color:#28a745;margin-right: -3px;"><img alt="$" style="height: 1rem;" src="https://cdn.hindigamer.club/static/money-green-2.svg"/> </span>';
        const secondarySpan = '<span style="color:#ffc107;margin-right: -3px;"><img alt="$" style="height: 1rem;" src="https://cdn.hindigamer.club/static/coin-stack-yellow.svg"/> </span>';
        // Define XSS Filter
        const xssfilter = new this.xss.FilterXSS({
            whiteList: {

            }
        });
        // Process Blurb
        let filteredBlurb = xssfilter.process(userData.blurb);
        // If blurb contains variables
        if (filteredBlurb && filteredBlurb.match(/\${primary}/g) || filteredBlurb && filteredBlurb.match(/\${secondary}/g)) {
            // Grab Balance
            const balances = await this.user.getInfo(filteredUserId, ['primaryBalance', 'secondaryBalance']);
            // Setup Blurb
            filteredBlurb = filteredBlurb.replace(/\${primary}/g, '<span style="color: #28a745;">' + primarySpan + ' ' + this.numberWithCommas(balances.primaryBalance) + '</span>');
            filteredBlurb = filteredBlurb.replace(/\${secondary}/g, '<span style="color: #ffc107;">' + secondarySpan + ' ' + this.numberWithCommas(balances.secondaryBalance) + '</span>');
        }
        // Setup View Info
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        ViewData.page.blurb = filteredBlurb;
        ViewData.page.forumPostCount = userData.forumPostCount;
        ViewData.page.status = userData.status;
        ViewData.page.tradingEnabled = userData.tradingEnabled;
        ViewData.page.staff = userData.staff;
        ViewData.page.usernameChanges = usernameChanges;
        // If deleted, mark as deleted
        if (userData.accountStatus === model.user.accountStatus.terminated) {
            ViewData.page.deleted = true;
        }
        ViewData.page.joinDate = this.moment(userData.joinDate);
        ViewData.page.lastOnline = this.moment(userData.lastOnline);
        // If only, show user as online
        if (this.moment(userData.lastOnline).isSameOrAfter(this.moment().subtract(3, 'minutes'))) {
            ViewData.page.online = true;
        } else {
            ViewData.page.online = false;
        }

        ViewData.title = userData.username + "'s Profile";
        return ViewData;
    }

    @Get('/users/:userId/inventory')
    @Summary('Get user\'s inventory')
    @Render('inventory')
    public async inventory(
        @PathParams('userId', Number) filteredUserId: number
    ) {
        // Create View Data
        let ViewData = new this.WWWTemplate({ title: '' });
        // Grab user info
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        // If deleted, throw 404
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }

        ViewData.title = userData.username + "'s Inventory";
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }

    @Get('/users/:userId/friends')
    @Summary('Get user\'s friends')
    @Render('friends')
    public async friends(
        @PathParams('userId', Number) filteredUserId: number
    ) {
        // Create View Data
        let ViewData = new this.WWWTemplate({ title: '' });
        // Grab user info
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        // If deleted, throw 404
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }

        ViewData.title = userData.username + "'s Friends";
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }

    @Get('/users/:userId/groups')
    @Summary('Get user\'s groups')
    @Render('profile_groups')
    public async groups(
        @PathParams('userId', Number) filteredUserId: number
    ) {
        // Create View Data
        let ViewData = new this.WWWTemplate({ title: '' });
        // Grab user info
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        // If deleted, throw 404
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }

        ViewData.title = userData.username + "'s Groups";
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }

    @Get('/users/:userId/trade')
    @Summary('Open trade request with a user')
    @Render('trade')
    @UseBefore(YesAuth)
    public async trade(
        @PathParams('userId', Number) filteredUserId: number
    ) {
        // Create View Data
        let ViewData = new this.WWWTemplate({ title: '' });
        // Grab user info
        let userData = await this.user.getInfo(filteredUserId, ["userId", "username", 'accountStatus']);
        // If deleted, throw 404
        if (userData.accountStatus === model.user.accountStatus.deleted) {
            throw new this.NotFound('InvalidUserId');
        }

        ViewData.title = 'Open Trade with '+userData.username;
        ViewData.page = {};
        ViewData.page.userId = userData.userId;
        ViewData.page.username = userData.username;
        return ViewData;
    }

    @Get('/users')
    @Summary('Search users')
    @Render('search_users')
    public async users() { return new this.WWWTemplate({ title: 'Search Users' }); }
}
