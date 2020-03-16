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
const Www_1 = require("../../models/v2/Www");
const controller_1 = require("../controller");
const moment = require("moment");
const UserModel = require("../../models/v1/user");
const model = require("../../models/models");
const Auth_1 = require("../../middleware/Auth");
let WWWSupportController = class WWWSupportController extends controller_1.default {
    constructor() {
        super();
    }
    async Support() {
        return new Www_1.WWWTemplate({
            title: "Support",
        });
    }
    async SupportTicket(userInfo, ticketId) {
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
        return new Www_1.WWWTemplate({
            title: "Support",
            page: {
                ticket: info,
                replies: replies,
            },
        });
    }
    async SupportTicketReply(userInfo, ticketId) {
        let info = await this.support.getTicketById(ticketId);
        if (info.userId !== userInfo.userId || info.ticketStatus !== model.support.TicketStatus.PendingCustomerResponse) {
            throw new this.BadRequest('InvalidTicketId');
        }
        info['createdAt'] = moment(info['createdAt']).fromNow();
        info['updatedAt'] = moment(info['updatedAt']).fromNow();
        return new Www_1.WWWTemplate({
            title: "Support Ticket Reply",
            page: {
                ticket: info,
            },
        });
    }
    async RefundPolicy() {
        return new Www_1.WWWTemplate({
            title: "Refund Policy",
        });
    }
    BrowserNotCompatible() {
        return new Www_1.WWWTemplate({
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
        });
    }
    GameHelpSupport() {
        return new Www_1.WWWTemplate({
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
};
__decorate([
    common_1.Get("/"),
    common_1.Render('support'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WWWSupportController.prototype, "Support", null);
__decorate([
    common_1.Get("/ticket/:ticketId"),
    common_1.Render('support_ticket'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWSupportController.prototype, "SupportTicket", null);
__decorate([
    common_1.Get("/ticket/:ticketId/reply"),
    common_1.Render('support_ticket_reply'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('ticketId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [UserModel.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWSupportController.prototype, "SupportTicketReply", null);
__decorate([
    common_1.Get("/refund-policy"),
    common_1.Render('refund_policy'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WWWSupportController.prototype, "RefundPolicy", null);
__decorate([
    common_1.Get('/browser-not-compatible'),
    common_1.Render('support_article'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWSupportController.prototype, "BrowserNotCompatible", null);
__decorate([
    common_1.Get('/game-help'),
    common_1.Render('support_article'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WWWSupportController.prototype, "GameHelpSupport", null);
WWWSupportController = __decorate([
    swagger_1.Hidden(),
    common_1.Controller("/support"),
    __metadata("design:paramtypes", [])
], WWWSupportController);
exports.WWWSupportController = WWWSupportController;

