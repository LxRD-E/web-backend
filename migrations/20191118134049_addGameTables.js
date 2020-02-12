/**
 * Game Tables to DB
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("game", (t) => {
        t.increments('id').primary().unsigned();
        t.string('name').notNullable();
        t.text('description').notNullable();
        t.integer('max_players').notNullable().defaultTo(1);
        t.integer('icon_assetid').notNullable().defaultTo(0).unsigned();
        t.integer('thumbnail_assetid').notNullable().defaultTo(0).unsigned();
        t.integer('visit_count').notNullable().defaultTo(0).unsigned();
        t.integer('player_count').notNullable().defaultTo(0);
        t.integer('like_count').notNullable().defaultTo(0);
        t.integer('dislike_count').notNullable().defaultTo(0);
        t.integer('game_state').notNullable().defaultTo(1);
        t.integer('creator_id').notNullable().unsigned();
        t.integer('creator_type').notNullable();
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    });
    await knex.schema.createTable("game_script", (t) => {
        t.increments('id').primary().unsigned();
        t.string('name').notNullable().defaultTo('Script');
        t.string('script_url').notNullable();
        t.integer('game_id').notNullable();
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
        t.integer('script_type').notNullable();
    });
    await knex.schema.createTable("game_map", (t) => {
        t.increments('id').primary().unsigned();
        t.string('script_url').notNullable();
        t.integer('game_id').notNullable();
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("game");
    await knex.schema.dropTable("game_script");
    await knex.schema.dropTable("game_map");
};