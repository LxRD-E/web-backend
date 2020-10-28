/**
 * Add trade ads system
 */

exports.up = async (knex, Promise) => {
    // table for the trade ads
    await knex.schema.createTable('trade_ads', t => {
        t.bigIncrements('id').primary().unsigned(); // trade ad id
        t.boolean('is_running').notNullable().defaultTo(false); // is the trade ad still running?

        t.datetime('date').notNullable().defaultTo(knex.fn.now()); // date the trade ad was created

        t.datetime('ended_at').defaultTo(null); // date the trade ad ended. null = not ended
        t.bigInteger('userid_one').unsigned().notNullable(); // the userid who created the trade
        t.bigInteger('userid_two').unsigned().defaultTo(null); // the userid who accepted the trade (null = nobody accepted yet)

        t.bigInteger('userid_one_primary').unsigned().notNullable().defaultTo(0); // primary currency that the trade ad creator will provide
        t.bigInteger('userid_two_primary').unsigned().notNullable().defaultTo(0); // primary currency that the trade ad accepter will provide
    });
    // table for trade ad items
    await knex.schema.createTable('trade_ad_items', t => {
        t.bigIncrements('id').primary().unsigned(); // trade item id
        t.bigInteger('trade_ad_id').notNullable().unsigned(); // id of the trade ad the item belongs to
        t.bigInteger('catalog_id').notNullable().unsigned(); // catalogid of the item
        t.bigInteger('userinventory_id').defaultTo(null).unsigned(); // userinventoryid of the item. null if side is 2 and trade is not completed
        t.integer('side').notNullable().unsigned(); // trade side. 1 = userid_one, 2 = userid_two

        t.index(['userinventory_id']); // add an index to the userinventoryid
        t.index(['catalog_id']); // add an index to the catalogid
        t.index(['trade_ad_id']); // user id index
    });
    await knex.schema.alterTable('trade_ads', t => {
        t.foreign('userid_one').references('users.id'); // user id foreign
        t.foreign('userid_two').references('users.id'); // user id foreign
    });
    await knex.schema.alterTable('trade_ad_items', t => {
        t.foreign('trade_ad_id').references('trade_ads.id'); // trade id foreign
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable('trade_ad_items', t => {
        t.dropForeign(['trade_ad_id']);
    })
    await knex.schema.alterTable('trade_ads', t => {
        t.dropForeign(['userid_one']);
        t.dropForeign(['userid_two']);
    })
    await knex.schema.dropTable("trade_ad_items");
    await knex.schema.dropTable("trade_ads");
};