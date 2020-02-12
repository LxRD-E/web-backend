/**
 * Add Thumnail Hashes for Avatars, so that the system won't have to re-generate avatars that have been generated in the past
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("thumbnail_hashes", (t) => {
        // Hash id
        t.increments('id').primary().unsigned();
        // Hash itself
        t.string('hash', 512).notNullable();
        // Thumbnail URL
        t.string('url', 512).notNullable();
        // Generation Date
        t.dateTime("date_created").notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Thumbnail hashes
     */
    await knex.schema.dropTable("thumbnail_hashes");
};