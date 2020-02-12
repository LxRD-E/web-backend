/**
 * Add private reasons to user moderation history
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Ban Reaosn Column
     */
    await knex.schema.alterTable("user_moderation", (t) => {
        t.string("private_reason").nullable();
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Ban Reason Column
     */
    await knex.schema.alterTable("user_moderation", (t) => {
        t.dropColumn('private_reason');
    });
};