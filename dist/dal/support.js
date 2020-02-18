"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../models/models");
const _init_1 = require("./_init");
class SupportDAL extends _init_1.default {
    async getTicketsByUser(userId) {
        let tickets = await this.knex('support_tickets').select('id as ticketId', 'ticket_status as ticketStatus', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt', 'ticket_title as ticketTitle', 'ticket_body as ticketBody').where({ 'user_id': userId }).orderBy('id', 'desc');
        return tickets;
    }
    async getTicketsAwaitingSupportResponse() {
        let tickets = await this.knex('support_tickets').select('id as ticketId', 'ticket_status as ticketStatus', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt', 'ticket_title as ticketTitle', 'ticket_body as ticketBody').where({ 'ticket_status': model.support.TicketStatus.PendingSupportResponse }).orderBy('id', 'asc');
        return tickets;
    }
    async getTicketById(ticketId) {
        let ticket = await this.knex('support_tickets').select('id as ticketId', 'ticket_status as ticketStatus', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt', 'ticket_title as ticketTitle', 'ticket_body as ticketBody').where({ 'id': ticketId }).limit(1);
        if (!ticket[0]) {
            throw new Error('InvalidTicketId');
        }
        return ticket[0];
    }
    async getTicketReplies(ticketId) {
        let replies = await this.knex('support_ticket_responses').select('id as replyId', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt', 'ticket_body as ticketBody').where({ 'support_ticket_id': ticketId, 'visible_to_client': true });
        return replies;
    }
    async getTicketRepliesAll(ticketId) {
        let replies = await this.knex('support_ticket_responses').select('id as replyId', 'user_id as userId', 'created_at as createdAt', 'updated_at as updatedAt', 'ticket_body as ticketBody').where({ 'support_ticket_id': ticketId });
        return replies;
    }
    async createTicket(userId, title, body) {
        await this.knex('support_tickets').insert({
            'user_id': userId,
            'ticket_title': title,
            'ticket_body': body,
        });
    }
    async updateTicketStatus(ticketId, status) {
        await this.knex('support_tickets').update({ 'ticket_status': status }).where({ 'id': ticketId });
    }
    async replyToTicket(ticketId, userId, body, visibleToClient = true) {
        if (visibleToClient) {
            await this.knex('support_tickets').update({ 'updated_at': this.knexTime() }).where({ 'id': ticketId });
        }
        await this.knex('support_ticket_responses').insert({
            'support_ticket_id': ticketId,
            'user_id': userId,
            'ticket_body': body,
            'visible_to_client': visibleToClient,
        });
    }
}
exports.default = SupportDAL;

