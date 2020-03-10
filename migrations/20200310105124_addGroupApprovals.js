/**
 * Add weight to approval_required to groups so that members will have to be approved before joining a group
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("groups", (t) => {
        t.boolean('approval_required').defaultTo(0).notNullable();
    });
    await knex.schema.createTable("group_members_pending", (t) => {
        t.bigIncrements('id').primary().unsigned(); // group member id
        t.bigInteger('group_id').notNullable().unsigned(); // group id the user requested to join
        t.bigInteger('user_id').notNullable().unsigned(); // userid who requested to join the group
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date request was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date request was last responded to or updated at
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove approval column
     */
    await knex.schema.alterTable("groups", (t) => {
        t.dropColumn('approval_required');
    });
    await knex.schema.dropTable("group_members_pending");
};