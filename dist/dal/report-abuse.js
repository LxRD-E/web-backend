"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../models/models");
const _init_1 = require("./_init");
class ReportAbuseDAL extends _init_1.default {
    constructor() {
        super(...arguments);
        this.AlreadyReportedUserStatusIDs = [];
    }
    async reportUserStatusId(userStatusId, userId, reason) {
        if (this.AlreadyReportedUserStatusIDs.includes(userStatusId)) {
            throw new Error('StatusId was already reported.');
        }
        await this.knex.transaction(async (trx) => {
            let alreadyReported = await trx('user_status_abuse_report').select('id').where({
                'userstatus_id': userStatusId,
            }).limit(1).forUpdate('user_status_abuse_report');
            if (alreadyReported[0]) {
                this.AlreadyReportedUserStatusIDs.push(userStatusId);
                throw new Error('This report has already been recieved - it will not be inserted.');
            }
            await trx('user_status_abuse_report').insert({
                user_id: userId,
                userstatus_id: userStatusId,
                report_reason: reason,
            }).forUpdate('user_status_abuse_report');
            await trx.commit();
        });
        this.AlreadyReportedUserStatusIDs.push(userStatusId);
    }
    async latestReportedUserStatuses() {
        let statuses = await this.knex('user_status_abuse_report')
            .select('user_status_abuse_report.id as reportId', 'user_status_abuse_report.user_id as reportUserId', 'user_status_abuse_report.userstatus_id as userStatusId', 'user_status_abuse_report.report_reason as reportReason', 'user_status_abuse_report.report_status as reportStatus', 'user_status_abuse_report.created_at as createdAt', 'user_status.status', 'user_status.userid as userId')
            .limit(1)
            .orderBy('user_status_abuse_report.id', 'asc')
            .where({
            'user_status_abuse_report.report_status': model.reportAbuse.ReportStatus.PendingReview
        })
            .innerJoin('user_status', 'user_status.id', 'user_status_abuse_report.userstatus_id');
        return statuses;
    }
    async updateUserStatusReportStatus(reportId, newStatus) {
        await this.knex('user_status_abuse_report').update({
            'report_status': newStatus,
        }).where({
            'id': reportId,
        });
    }
}
exports.default = ReportAbuseDAL;

