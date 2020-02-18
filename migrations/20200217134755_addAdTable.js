/**
 * Add ad table
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("user_ads", (t) => {
        t.bigIncrements('id').primary().unsigned(); // ad id
        t.bigInteger('user_id').notNullable().unsigned(); // userid who created ad
        t.bigInteger('bid_amount').notNullable().unsigned().defaultTo(0); // amount bid in latest session
        t.bigInteger('total_bid_amount').notNullable().unsigned().defaultTo(0); // total amount bid all-time
        t.bigInteger('views').notNullable().unsigned().defaultTo(0); // views from last ad spending
        t.bigInteger('total_views').notNullable().unsigned().defaultTo(0); // all-time views
        t.bigInteger('clicks').notNullable().unsigned().defaultTo(0); // clicks from last ad spending
        t.bigInteger('total_clicks').notNullable().unsigned().defaultTo(0); // all-time clicks
        t.integer('moderation_status').notNullable().defaultTo(0); // current moderation status of image (0 = pending, 1 = approved, 2 = declined)
        t.string('image_url', 1024).notNullable().defaultTo(0); // url of image
        t.string('title', 256).notNullable(); // title of the ad (appears on <img src="image_url" title="title here" />)
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date ad was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date money was last spent on ad

        t.integer('ad_type').notNullable(); // Type of ad
        t.integer('ad_redirectid').notNullable(); // What the ad will redirect to, based off type. I.e, if ad_type is group and ad_redirectid is "1", clicking the ad will take you to /groups/1/
        t.integer('ad_displaytype').notNullable(); // The display type of the ad; e.g. banner, leaderboard, etc
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_ads");
};