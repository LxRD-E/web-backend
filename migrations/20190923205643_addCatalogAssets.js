/**
 * Chat System to DB
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("catalog_assets", (t) => {
        // id
        t.increments('id').primary().unsigned();
        // creator id
        t.integer('creatorid').notNullable();
        // creator type
        t.integer('creatortype').notNullable();
        // creation date
        t.datetime('date_created').notNullable().defaultTo(knex.fn.now());
        // asset type
        t.integer('assettype').notNullable();
        // filename
        t.string('filename').notNullable();
        // file type
        t.string('filetype').notNullable();
        // catalog id
        t.integer('catalogid').notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("catalog_assets");
};