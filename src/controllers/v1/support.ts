/**
 * Imports
 */
// Models
import * as model from '../../models/models';
// Autoloads
import controller from '../controller';
import {BodyParams, Controller, Get, Locals, PathParams, Post, Use} from '@tsed/common';
import {csrf} from '../../dal/auth';
import {YesAuth} from '../../middleware/Auth';
import {Returns, Summary} from '@tsed/swagger';
import RecaptchaV2 from '../../middleware/RecaptchaV2';

/**
 * Support Controller
 */
@Controller('/support')
export default class SupportController extends controller {

    constructor() {
        super();
    }

    @Get('/my/tickets')
    @Summary('Fetch user-created tickets')
    @Use(YesAuth)
    public async getMyTickets(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        return await this.support.getTicketsByUser(userInfo.userId);
    }

    @Get('/ticket/:ticketId/info')
    @Summary('Get ticket data for the {ticketId}')
    @Use(YesAuth)
    @Returns(200, {type: model.support.SupportTicket})
    @Returns(400, controller.cError('InvalidTicketId: TicketId is invalid or does not belong to the authenticated user'))
    public async getTicketById(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('ticketId', Number) ticketId: number
    ) {
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        return ticketInfo;
    }

    @Get('/ticket/:ticketId/replies')
    @Summary('Get replies to ticket')
    @Use(YesAuth)
    public async getTicketReplies(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number
    ) {
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        return await this.support.getTicketReplies(ticketId);
    }

    @Post('/ticket/create')
    @Summary('Create a ticket')
    @Use(csrf, YesAuth, RecaptchaV2)
    public async createTicket(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams('title', String) title: string,
        @BodyParams('body', String) body: string,
    ) {
        if (title.length > 255 || title.length < 3) {
            throw new this.BadRequest('InvalidTitle');
        }
        if (body.length > 4096 || body.length < 10) {
            throw new this.BadRequest('InvalidBody');
        }
        await this.support.createTicket(userInfo.userId, title, body);
        return {
            success: true,
        };
    }

    @Post('/ticket/:ticketId/close')
    @Summary('Close a ticket')
    @Use(csrf, YesAuth)
    public async closeTicket(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number
    ) {
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        await this.support.updateTicketStatus(ticketId, model.support.TicketStatus.Closed);
        return {
            success: true,
        };
    }

    @Post('/ticket/:ticketId/reply')
    @Summary('Reply to a ticket')
    @Use(csrf, YesAuth)
    public async replyToTicket(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('ticketId', Number) ticketId: number,
        @BodyParams('body', String) body: string,
    ) {
        if (body.length > 4096 || body.length < 5) {
            throw new this.BadRequest('InvalidBody');
        }
        let ticketInfo = await this.support.getTicketById(ticketId);
        if (ticketInfo.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidTicketId');
        }
        if (ticketInfo.ticketStatus !== model.support.TicketStatus.PendingCustomerResponse) {
            throw new this.BadRequest('TicketStatusDoesNotAllowReply');
        }
        // update status
        await this.support.updateTicketStatus(ticketId, model.support.TicketStatus.PendingSupportResponse);
        // insert body
        await this.support.replyToTicket(ticketId, userInfo.userId, body);
        return {
            success: true,
        };
    }
}
