/**
 * Add Password Resets
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("password_resets", (t) => {
        // Reset id
        t.increments('id').primary().unsigned();
        // User ID
        t.integer('userid').notNullable();
        // Code
        t.string('code', 1024).notNullable();
        // Generation Date
        t.dateTime("date_created").notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("password_resets");
};