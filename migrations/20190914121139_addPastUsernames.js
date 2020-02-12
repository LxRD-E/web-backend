/**
 * Add Past Usernames
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("users_usernames", (t) => {
        // id
        t.increments('id').primary().unsigned();
        // Username String
        t.string('username').notNullable();
        // UserID
        t.integer('userid').notNullable();
        // Date Created
        t.dateTime("date_created").notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("users_usernames");
};