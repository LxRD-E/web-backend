/**
 * Add weight to forum categories/subcategories so that they can be re-arragned
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("forum_subcategories", (t) => {
        t.integer('weight').defaultTo(0).notNullable();
    });
    await knex.schema.alterTable("forum_categories", (t) => {
        t.integer('weight').defaultTo(0).notNullable();
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove weight
     */
    await knex.schema.alterTable("forum_subcategories", (t) => {
        t.dropColumn('weight');
    });
    await knex.schema.alterTable("forum_categories", (t) => {
        t.dropColumn('weight');
    });
};