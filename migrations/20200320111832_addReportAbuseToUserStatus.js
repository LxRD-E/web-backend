/**
 * Report a userStatusId as abusive
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("user_status_abuse_report", (t) => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('user_id').notNullable().unsigned(); // userid who reported
        t.bigInteger('userstatus_id').notNullable().unsigned(); // status id
        t.integer('report_reason').notNullable().unsigned(); // reason for report (see model.reportAbuse.ReportReason)
        t.integer('report_status').notNullable().unsigned().defaultTo(1); // the current status of the report.
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date report was created
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_status_abuse_report");
};