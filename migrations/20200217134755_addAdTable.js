/**
 * Add ad table
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("user_ads", (t) => {
        t.bigIncrements('id').primary().unsigned(); // ad id
        t.bigInteger('user_id').notNullable().unsigned(); // userid who created ad
        t.bigInteger('bid_amount').notNullable().unsigned(); // amount bided in latest session
        t.bigInteger('total_bid_amount').notNullable().unsigned(); // total amount bided all-time
        t.bigInteger('views').notNullable().unsigned(); // views from last ad spending
        t.bigInteger('total_views').notNullable().unsigned(); // all-time views
        t.bigInteger('clicks').notNullable().unsigned(); // clicks from last ad spending
        t.bigInteger('total_clicks').notNullable().unsigned(); // all-time clicks
        t.bigInteger('catalogasset_id').notNullable().unsigned(); // catalog asset id of advertisment
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date ad was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date money was last spent on ad
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_ads");
};