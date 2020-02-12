/**
 * Chat System to DB
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("chat_messages", (t) => {
        // id
        t.increments('id').primary().unsigned();
        // userid from
        t.integer('userid_from').notNullable().unsigned();
        // userid to
        t.integer('userid_to').notNullable().unsigned();
        // content
        t.string('content').notNullable();
        // date
        t.dateTime("date_created").notNullable().defaultTo(knex.fn.now());
        // did userid_to read?
        t.integer('read').notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("chat_messages");
};