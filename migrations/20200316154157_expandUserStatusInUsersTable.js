/**
 * Expand user_status to 255 characters
 */

exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("users", (t) => {
        t.string('user_status', 255).defaultTo(null).collate('utf8mb4_unicode_ci').alter();
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Remove genre column
     */
    await knex.schema.alterTable("users", (t) => {
        t.string('user_status', 128).defaultTo(null).collate('utf8mb4_unicode_ci').alter();
    });
};