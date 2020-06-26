import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, UseBeforeEach } from "@tsed/common";
import { Description, Summary, Hidden } from "@tsed/swagger"; // import swagger Ts.ED module
import { Exception, NotFound, BadRequest } from "ts-httpexceptions";
import * as Express from 'express';
import { WWWTemplate } from '../../models/v2/Www';
import controller from '../controller'
import moment = require("moment");
import xss = require('xss');
import Config from '../../helpers/config';
// Models
import * as UserModel from '../../models/v1/user';
import * as model from '../../models/models';
import { NoAuth, YesAuth } from "../../middleware/Auth";
import {numberWithCommas} from '../../helpers/Filter';

@Hidden()
@Controller("/")
export class WWWController extends controller {
    constructor() {
        super();
    }

    @Get('/perf.txt')
    @Summary('Perf')
    public performanceTest() {
        return 'BWS OK';
    }

    @Get('/discord')
    @Redirect('https://discord.gg/CAjZfcZ')
    public redirectToDiscord() {}

    @Get("/")
    @Render('index')
    public async Index(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @Res() res: Res,
    ) {
        if (userInfo) {
            return res.redirect(302, '/dashboard');
        }
        return new WWWTemplate({
            title: "Homepage",
            userInfo: userInfo,
        });
    }

    @Get("/terms")
    @Render('terms')
    public async Terms(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new WWWTemplate({
            title: "Terms of Service",
            userInfo: userInfo,
        });
    }

    /**
     * Load the Currency Shop
     */
    @Get('/currency')
    @UseBefore(YesAuth)
    @Render('currency')
    public async buyCurrency() {
        // Grab Catalog Items
        let count = 0;
        try {
            count = await this.catalog.countAllItemsForSale();
        }catch(e) {
            // lol
            count = 1500;
        }
        let wwwTemp = new WWWTemplate({
            title: 'Currency',
        });
        wwwTemp.page.catalogCount = count;
        wwwTemp.page.clientId = Config.paypal.clientid;
        return wwwTemp;
    }

}
