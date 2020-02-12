import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, UseBeforeEach } from "@tsed/common";
import { Description, Summary } from "@tsed/swagger"; // import swagger Ts.ED module
import { Exception, NotFound, BadRequest } from "ts-httpexceptions";
import * as Express from 'express';
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
export class WWWAuthController extends controller {
    constructor() {
        super();
    }

    // Ban Redirect
    @Get('/membership/notapproved.aspx')
    @Redirect('/')
    public redirectIfNoLongerBanned() { }

    // Login
    @Get('/login')
    @UseBeforeEach(NoAuth)
    @Render('login')
    public login() {
        return new WWWTemplate({
            title: "Login",
        });
    }

    // Signup page
    @Get('/signup')
    @UseBeforeEach(NoAuth)
    @Render('signup')
    public signup() {
        return new WWWTemplate({
            title: "Signup",
        });
    }

    // Dashboard
    @Get('/dashboard')
    @UseBeforeEach(YesAuth)
    @Render('dashboard')
    public dashboard(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new WWWTemplate({
            title: "Dashboard",
            userInfo: userInfo,
        });
    }

    // User avatar customization
    @Get('/avatar')
    @UseBeforeEach(YesAuth)
    @Render('avatar')
    public Avatar(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new WWWTemplate({
            title: "Avatar",
            userInfo: userInfo,
        });
    }

    /**
     * Load Email Verification Area
     */
    @Get('/email/verify')
    @UseBefore(YesAuth)
    @Render('email_verify')
    public async emailVerification(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @QueryParams('code', String) code: string
    ) {
        return new this.WWWTemplate({'title': 'Email Verification',userInfo: userInfo, page: {'code': code}});
    }

    @Get('/reset/password')
    @UseBefore(NoAuth)
    @Render('reset_password')
    public async resetPassword(
        @Res() res: Res,
        @QueryParams('code', String) code: string,
        @QueryParams('userId', Number) userId: number,
    ) {
        let info;
        try {
            if (!userId) {
                throw false;
            }
            info = await this.user.getPasswordResetInfo(code);
            // Incorrect User ID
            if (info.userId !== userId) {
                throw false;
            }
            // Outdated
            if (moment().isSameOrAfter(moment(info.dateCreated).add(2, "hours"))) {
                throw false;
            }
        }catch(e) {
            return res.redirect("/404");
        }
        let ViewData = new this.WWWTemplate({
            title: 'Reset Password'
        });
        ViewData.page = {
            'code': code,
            'userId': userId,
        }
        return ViewData;
    }

    @Get('/notifications')
    @Summary('Notifications page')
    @UseBefore(YesAuth)
    @Render('notifications')
    public async loadNotifications(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new this.WWWTemplate({
            title: 'Notifications',
            userInfo: userInfo,
        });
    }
}
