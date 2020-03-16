/**
 * Add user status reactions. Currently, only "❤️" is supported
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("user_status_reactions", (t) => {
        t.bigIncrements('id').primary().unsigned(); // internal
        t.bigInteger('user_id').notNullable().unsigned(); // userid who reacted
        t.bigInteger('status_id').notNullable().unsigned(); // status reacted to
        t.string('reaction', 255).notNullable().collate('utf8mb4_unicode_ci'); // reaction that was added
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date reaction was created
    });
    await knex.schema.alterTable("user_status", (t) => {
        t.integer('reaction_count_heart').unsigned().defaultTo(0).notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_status_reactions");
};