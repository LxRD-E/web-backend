/**
 * Game Server DB
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("user_staff_comments", (t) => {
        t.increments('id').primary().unsigned();
        t.integer('user_id').notNullable().unsigned();
        t.integer('staff_userid').notNullable().unsigned();
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        t.text('comment').notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_staff_comments");
};