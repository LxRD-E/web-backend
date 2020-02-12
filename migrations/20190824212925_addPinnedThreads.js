/**
 * Add Mod-Type Options to forum_threads Table
 */
exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("forum_threads", (t) => {
        t.integer("thread_pinned").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("forum_threads", (t) => {
        t.dropColumn("thread_pinned");
    });
};