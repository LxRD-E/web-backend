/**
 * Add staff group update logs
 */

exports.up = async (knex, Promise) => {
    // table for the group status update logs
    await knex.schema.createTable('moderation_group_status', t => {
        t.bigIncrements('id').primary().unsigned(); // log id
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date the group was updated
        t.bigInteger('user_id').unsigned().notNullable(); // the userid who updated the group
        t.bigInteger('group_id').unsigned().notNullable(); // the groupid that got updated
        t.integer('old_status').notNullable(); // the old status
        t.integer('status').notNullable(); // the new status
        t.string('reason', 1024).notNullable(); // reason for group status update
    });
    // table for the group name update logs
    await knex.schema.createTable('moderation_group_name', t => {
        t.bigIncrements('id').primary().unsigned(); // log id
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date the group was updated
        t.bigInteger('user_id').unsigned().notNullable(); // the userid who updated the group
        t.bigInteger('group_id').unsigned().notNullable(); // the groupid that got updated
        t.string('old_name', 75).notNullable(); // the old name
        t.string('name', 75).notNullable(); // the new name
        t.string('reason', 1024).notNullable(); // reason for group name change
    });
    await knex.schema.alterTable('moderation_group_status', t => {
        // index userid and groupid
        t.index(['group_id']);
        t.index(['user_id']);
    });
    await knex.schema.alterTable('moderation_group_name', t => {
        // index userid and groupid
        t.index(['group_id']);
        t.index(['user_id']);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("moderation_group_status");
    await knex.schema.dropTable("moderation_group_name");
};