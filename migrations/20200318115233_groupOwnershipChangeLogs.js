/**
 * Add group_ownership_change so if someone changes ownership they can see what happened
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("group_ownership_change", (t) => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('user_id').notNullable().unsigned(); // userid who beceame or left ownership
        t.bigInteger('actor_user_id').notNullable().unsigned(); // userid who changed ownership
        t.bigInteger('group_id').notNullable().unsigned(); // groupid affected by change
        t.bigInteger('type').notNullable().unsigned(); // how they became owner
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date action was performed
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("group_ownership_change");
};