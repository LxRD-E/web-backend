/**
 * Add user status reactions. Currently, only "❤️" is supported
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("user_status_comment", (t) => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('user_id').notNullable().unsigned(); // userid who commented
        t.bigInteger('status_id').notNullable().unsigned(); // status commented to
        t.string('comment', 4096).notNullable().collate('utf8mb4_unicode_ci'); // comment content
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date comment was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date comment was created
    });
    await knex.schema.alterTable("user_status", (t) => {
        t.integer('comment_count').unsigned().defaultTo(0).notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_status_comment");
};