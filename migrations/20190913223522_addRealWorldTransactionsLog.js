/**
 * Add Real-World Transactions
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("currency_transactions", (t) => {
        // id
        t.increments('id').primary().unsigned();
        // USD Price paid
        t.float('usd_price').notNullable();
        // USD recieved excluding paypal fees
        t.float('usd_gross').notNullable();
        // Purchase Type
        t.integer('transaction_type').notNullable();
        // Buyer First Name
        t.string('first_name').notNullable();
        // Buyer Last Name
        t.string('last_name').notNullable();
        // Buyer EMail
        t.string('email').notNullable();
        // Capture IDs Json
        t.string('captureids_json').notNullable();
        // Product ID
        t.integer('product_id').notNullable();
        // Date
        t.dateTime("date_created").notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("currency_transactions");
};