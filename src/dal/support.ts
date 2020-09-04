import * as model from '../models/models';
import _init from './_init';

/**
 * Support Ticket DAL
 */
export default class SupportDAL extends _init {

    public async getTicketsByUser(userId: number): Promise<model.support.SupportTicket[]> {
        return this.knex('support_tickets').select(
            'id as ticketId',
            'ticket_status as ticketStatus',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
            'ticket_title as ticketTitle',
            'ticket_body as ticketBody',
        ).where({ 'user_id': userId }).orderBy('id', 'desc');
    }

    public async getTickets(status?: model.support.TicketStatus): Promise<model.support.SupportTicket[]> {
        let query = this.knex('support_tickets').select(
            'id as ticketId',
            'ticket_status as ticketStatus',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
            'ticket_title as ticketTitle',
            'ticket_body as ticketBody',
        ).orderBy('id', 'asc');
        if (typeof status !== 'undefined') {
            query = query.where({ 'ticket_status': status });
        }
        return query;
    }

    public async getTicketsNotClosed(): Promise<model.support.SupportTicket[]> {
        return this.knex('support_tickets').select(
            'id as ticketId',
            'ticket_status as ticketStatus',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
            'ticket_title as ticketTitle',
            'ticket_body as ticketBody',
        ).where('ticket_status', '!=', model.support.TicketStatus.Closed).orderBy('id', 'asc');
    }

    public async getTicketById(ticketId: number): Promise<model.support.SupportTicket> {
        let ticket = await this.knex('support_tickets').select(
            'id as ticketId',
            'ticket_status as ticketStatus',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
            'ticket_title as ticketTitle',
            'ticket_body as ticketBody',
        ).where({ 'id': ticketId }).limit(1);
        if (!ticket[0]) {
            throw new Error('InvalidTicketId');
        }
        return ticket[0];
    }

    public async getTicketReplies(ticketId: number): Promise<model.support.SupportTicketReply[]> {
        return this.knex('support_ticket_responses').select(
            'id as replyId',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
            'ticket_body as ticketBody',
        ).where({ 'support_ticket_id': ticketId, 'visible_to_client': true });
    }

    public async getTicketRepliesAll(ticketId: number): Promise<model.support.SupportTicketReply[]> {
        return this.knex('support_ticket_responses').select(
            'id as replyId',
            'user_id as userId',
            'created_at as createdAt',
            'updated_at as updatedAt',
            'ticket_body as ticketBody',
        ).where({ 'support_ticket_id': ticketId });
    }

    public async createTicket(
        userId: number,
        title: string,
        body: string,
    ): Promise<void> {
        await this.knex('support_tickets').insert({
            'user_id': userId,
            'ticket_title': title,
            'ticket_body': body,
        });
    }

    public async updateTicketStatus(ticketId: number, status: model.support.TicketStatus): Promise<void> {
        await this.knex('support_tickets').update({ 'ticket_status': status }).where({ 'id': ticketId });
    }

    public async replyToTicket(ticketId: number, userId: number, body: string, visibleToClient: boolean = true): Promise<void> {
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

