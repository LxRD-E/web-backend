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
import { NoAuth, YesAuth } from "../../middleware/Auth";
import {numberWithCommas} from '../../helpers/Filter';

@Hidden()
@Controller("/")
export class WWWController extends controller {
    constructor() {
        super();
    }


    @Get('/play')
    public gamesPage(
        @Res() res: Res,
    ) {
        res.status(503).send('<p>Coming Soon!</p>').end();
    }

    @Get('/discord')
    @Redirect('https://discord.gg/CAjZfcZ')
    public redirectToDiscord() {}

    @Get("/")
    @Render('index')
    public async Index(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
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

    @Get("/support")
    @Render('support')
    public async Support(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new WWWTemplate({
            title: "Support",
            userInfo: userInfo,
        });
    }

    @Get("/support/ticket/:ticketId")
    @Render('support_ticket')
    @Use(YesAuth)
    public async SupportTicket(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @PathParams('ticketId', Number) ticketId: number,
    ) {
        let info = await this.support.getTicketById(ticketId);
        if (info.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        info['createdAt'] = moment(info['createdAt']).fromNow();
        info['updatedAt'] = moment(info['updatedAt']).fromNow();
        let replies = await this.support.getTicketReplies(ticketId);
        for (const reply of replies) {
            reply['createdAt'] = moment(reply['createdAt']).fromNow();
            reply['updatedAt'] = moment(reply['updatedAt']).fromNow();
        }
        return new WWWTemplate({
            title: "Support",
            userInfo: userInfo,
            page: {
                ticket: info,
                replies: replies,
            },
        });
    }

    @Get("/support/ticket/:ticketId/reply")
    @Render('support_ticket_reply')
    @Use(YesAuth)
    public async SupportTicketReply(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @PathParams('ticketId', Number) ticketId: number,
    ) {
        let info = await this.support.getTicketById(ticketId);
        if (info.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        info['createdAt'] = moment(info['createdAt']).fromNow();
        info['updatedAt'] = moment(info['updatedAt']).fromNow();
        return new WWWTemplate({
            title: "Support Ticket Reply",
            userInfo: userInfo,
            page: {
                ticket: info,
            },
        });
    }

    @Get("/support/refund-policy")
    @Render('refund_policy')
    public async RefundPolicy(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
    ) {
        return new WWWTemplate({
            title: "Refund Policy",
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
