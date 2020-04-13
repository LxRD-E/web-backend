/**
 * Add ad table
 */

exports.up = async (knex, Promise) => {
    /**
     * Remove old icon_assetid and thumbnail_assetid
     */
    await knex.schema.alterTable("game", (t) => {
        t.dropColumn('icon_assetid');
        t.dropColumn('thumbnail_assetid');
    });
    // Create new game_thumbnails table
    await knex.schema.createTable("game_thumbnails", (t) => {
        t.bigIncrements('id').primary().unsigned(); // game thumbnail id
        t.bigInteger('game_id').notNullable().unsigned(); // id of the game the icon belongs to
        t.integer('moderation_status').notNullable().defaultTo(0); // the mod status of the thumbnail
        t.string('thumbnail_url', 2048).notNullable(); // the URL of the thumbnail
    });
    // Add thumbnails to all games
    let allGames = await knex('game').select('id');
    for (const game of allGames) {
        await knex('game_thumbnails').insert({
            game_id: game.id,
            moderation_status: 1,
            thumbnail_url: 'https://cdn.blockshub.net/game/default_assets/Screenshot_5.png',
        });
    }
};

exports.down = async (knex, Promise) => {
    throw new Error('bruh bruh bruh bruh bruh');
};