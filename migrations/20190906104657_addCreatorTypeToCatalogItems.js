/**
 * Add a Creator Type ID to catalog items, so that groups can make items
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Ban Reaosn Column
     */
    await knex.schema.alterTable("catalog", (t) => {
        t.integer("creator_type").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Ban Reason Column
     */
    await knex.schema.alterTable("catalog", (t) => {
        t.dropColumn('creator_type');
    });
};