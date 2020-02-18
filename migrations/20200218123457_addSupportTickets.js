/**
 * Add ad table
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("support_tickets", (t) => {
        t.bigIncrements('id').primary().unsigned(); // ad id
        t.bigInteger('user_id').notNullable().unsigned(); // userid who created ticket
        t.integer('ticket_status').notNullable().defaultTo(1); // status of the ticket (see ticketstatus enum in models)
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date ticket was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date ticket was last responded to or updated at

        t.string('ticket_title', 255).notNullable(); // title of ticket
        t.string('ticket_body', 4096).notNullable(); // body of ticket
    });
    await knex.schema.createTable("support_ticket_responses", (t) => {
        t.bigIncrements('id').primary().unsigned(); // ticket reply id
        t.bigInteger('support_ticket_id').notNullable().unsigned(); // ticket id
        t.bigInteger('user_id').notNullable().unsigned(); // userid who posted response
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date ticket response was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date ticket response was edited

        t.string('ticket_body', 4096).notNullable(); // body of ticket response
        t.boolean('visible_to_client').notNullable().defaultTo(true); // if reply is visible to creator of ticket
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("support_tickets");
    await knex.schema.dropTable("support_ticket_responses");
};