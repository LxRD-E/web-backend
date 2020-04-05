/**
 * Add catalog_comments.is_deleted
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("catalog_comments", (t) => {
        t.boolean('is_deleted').defaultTo(false).notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("catalog_comments", (t) => {
        t.dropColumn('is_deleted');
    });
};