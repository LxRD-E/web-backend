/**
 * Add User Types to transactions, for transactions to groups
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Ban Reaosn Column
     */
    await knex.schema.alterTable("transactions", (t) => {
        t.integer("from_type").notNullable().defaultTo(0);
    });
    // Update Existing Items
    await knex("transactions").update({"from_type": 0});
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Ban Reason Column
     */
    await knex.schema.alterTable("transactions", (t) => {
        t.dropColumn('from_type');
    });
};