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
@Controller("/support")
export class WWWSupportController extends controller {
    constructor() {
        super();
    }

    @Get("/")
    @Render('support')
    public async Support() {
        return new WWWTemplate({
            title: "Support",
        });
    }

    @Get("/ticket/:ticketId")
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
            page: {
                ticket: info,
                replies: replies,
            },
        });
    }

    @Get("/ticket/:ticketId/reply")
    @Render('support_ticket_reply')
    @Use(YesAuth)
    public async SupportTicketReply(
        @Locals('userInfo') userInfo: UserModel.SessionUserInfo,
        @PathParams('ticketId', Number) ticketId: number,
    ) {
        let info = await this.support.getTicketById(ticketId);
        if (info.userId !== userInfo.userId || info.ticketStatus !== model.support.TicketStatus.PendingCustomerResponse) {
            throw new this.BadRequest('InvalidTicketId');
        }
        info['createdAt'] = moment(info['createdAt']).fromNow();
        info['updatedAt'] = moment(info['updatedAt']).fromNow();
        return new WWWTemplate({
            title: "Support Ticket Reply",
            page: {
                ticket: info,
            },
        });
    }

    @Get("/refund-policy")
    @Render('refund_policy')
    public async RefundPolicy() {
        return new WWWTemplate({
            title: "Refund Policy",
        });
    }

    @Get('/browser-not-compatible')
    @Render('support_article')
    public BrowserNotCompatible() {
        return new WWWTemplate({
            title: 'Browser Not Compatible',
            page: {
                article: `
                <h1>Browser Not Supported</h1>
                <p>
                Unfortunately, due to security concerns, your browser cannot be supported. We do not block browsers from using our games unless we absolutely have to, in order to protect users from account theft, viruses, or other malicious activity.
                </p>
                <p style="margin-top:1rem;">
                Please use a more up-to-date browser, such as <a href="https://www.google.com/chrome/" rel="nofollow">Google Chrome</a> or <a rel="nofollow" href="https://www.mozilla.org/firefox/">Mozilla Firefox</a>.
                </p>`
            }
        })
    }

    @Get('/game-help')
    @Render('support_article')
    public GameHelpSupport() {
        return new WWWTemplate({
            title: 'Help Playing Games',
            page: {
                article: `<h1>General Game Help</h1><br><p>We're really sorry for the inconvience you may be experiencing right now. Our game engine is still in the very early stages, so unfortunately, there will be many bugs.<br><br>You should read through this article and try any of the troubleshooting steps provided. If nothing matches your problem, or nothing fixes your problem, you can <a href="/support">create a support ticket here</a>.</p>

                <div style="margin-top:1rem;"></div>

                <h3>Unsupported Setups/Browsers</h3>
                <p>Although we try to support as many browsers and operating systems as we can, there are some that we just cannot support either for technical or privacy/security reasons. Below is a list of browsers and operating systems we do not support and will not offer support for.</p>
                <ul>
                    <li>All versions of Microsoft Internet Explorer <span style="font-style: italic;">(does not include edge)</span></li>
                    <li>Operating systems that are not currently receiving security updates (Windows: currently Windows 7 and below, Mac: macOS 12 and below)</li>
                </ul>

                <div style="margin-top:1rem;"></div>


                <h3>White screen when trying to play any game</h3>
                <p>
                This error usually means that something couldn't be loaded. Although a white screen is expected for a second or two while the game loads, if a white screen persists for any longer than 3 seconds or so, the game was likely unable to be loaded. This usually means that you should try to update your web browser, and disable any browsing extensions (if any) that might be causing issues. If the problem is still not solved after using a modern web browser, contact our support team for more info.
                </p>

                <div style="margin-top:1rem;"></div>

                <h3>"This content cannot be displayed in an iframe"</h3>
                <img src="https://cdn.hindigamer.club/static/support-img/Screenshot_1.png" style="width:100%;height: auto;max-width:600px;" />
                <p>Unfortunately, this error means that your browser is not supported by our game engine. We are currently working on a downloadable game engine to elevate problems like this on older operating systems, but until we release it, you will have to use a more up-to-date web browser such as <a href="https://www.google.com/chrome/" rel="nofollow">Google Chrome</a> or <a rel="nofollow" href="https://www.mozilla.org/firefox/">Mozilla Firefox</a>. If you are using the most up-to-date version of either browser, then your operating system is likely not supported by us.
                
                `,
            }
        });
    } 
}
