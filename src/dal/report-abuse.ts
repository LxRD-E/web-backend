/**
 * Imports
 */
import * as model from '../models/models';

import _init from './_init';

export default class ReportAbuseDAL extends _init {
    /**
     * Array of {userStatusId} that were already reported.
     * If a {userStatusId} appears in this array, it should prevent {this.reportUserStatusId()} from inserting a report
     */
    private AlreadyReportedUserStatusIDs: number[] = [];

    /**
     * Report a userStatusId as abusive
     * @param userStatusId The userStatusId to report
     * @param userId The userId reporting the status
     * @param reason The {model.reportAbuse.ReportReason}
     */
    public async reportUserStatusId(
        userStatusId: number,
        userId: number,
        reason: model.reportAbuse.ReportReason,
    ) {
        // just a light checker to prevent db stress
        if (this.AlreadyReportedUserStatusIDs.includes(userStatusId)) {
            // throw
            throw new Error('StatusId was already reported.')
        }
        // create transaction so that multiple reports arent created for the same item
        await this.knex.transaction(async (trx) => {
            // confirm not already reported
            let alreadyReported = await trx('user_status_abuse_report').select('id').where({
                'userstatus_id': userStatusId,
            }).limit(1).forUpdate('user_status_abuse_report');
            if (alreadyReported[0]) {
                // Ending of transaction that inserts this will not happen, so we insert into alreadyReported here
                // We don't do it at the begining or end of the transaction since if either one errors, it will either not be or still be inserted which is not what we want (since if it fails for some reason, nobody would be able to report a potentially mailicous userStatusId)
                this.AlreadyReportedUserStatusIDs.push(userStatusId);
                // Throw a general error. This error probably shouldn't happen too often, since reports should be caught by the AlreadyReportedUserStatusIDs at the end of the transaction, but it can still happen due to load balancing issues and stuff like that
                throw new Error('This report has already been recieved - it will not be inserted.');
            }
            // insert report
            await trx('user_status_abuse_report').insert({
                user_id: userId,
                userstatus_id: userStatusId,
                report_reason: reason,
            }).forUpdate('user_status_abuse_report');
            // commit transaction
            await trx.commit();
        });
        // Transaction was successful, so insert into alreadyinserted array
        this.AlreadyReportedUserStatusIDs.push(userStatusId);
    }

    /**
     * Get the latest reports of UserStatuses that have a report_status of {model.reportAbuse.ReportStatus.PendingReview}.
     * 
     * Limit of 1 result; sorted by reportId ASC
     */
    public async latestReportedUserStatuses(): Promise<model.reportAbuse.ReportedStatusEntry[]> {
        let statuses = await this.knex('user_status_abuse_report')
        .select(
            // user_status_abuse_report
            'user_status_abuse_report.id as reportId',
            'user_status_abuse_report.user_id as reportUserId',
            'user_status_abuse_report.userstatus_id as userStatusId',
            'user_status_abuse_report.report_reason as reportReason',
            'user_status_abuse_report.report_status as reportStatus',
            'user_status_abuse_report.created_at as createdAt',
            // user_status
            'user_status.status',
            'user_status.userid as userId'
        )
        .limit(1)
        .orderBy('user_status_abuse_report.id','asc')
        .where({
            'user_status_abuse_report.report_status': model.reportAbuse.ReportStatus.PendingReview
        })
        .innerJoin('user_status','user_status.id','user_status_abuse_report.userstatus_id');

        return statuses;
    }

    /**
     * Update the status of a userStatusReport. This will not delete the status
     * @param reportId 
     * @param newStatus 
     */
    public async updateUserStatusReportStatus(reportId: number, newStatus: model.reportAbuse.ReportStatus): Promise<void> {
        await this.knex('user_status_abuse_report').update({
            'report_status': newStatus,
        }).where({
            'id': reportId,
        })
    }
}

