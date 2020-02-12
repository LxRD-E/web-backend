/**
 * Add User Types to transactions, for transactions to groups
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Ban Reaosn Column
     */
    await knex.schema.alterTable("transactions", (t) => {
        t.integer("to_type").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Ban Reason Column
     */
    await knex.schema.alterTable("transactions", (t) => {
        t.dropColumn('to_type');
    });
};