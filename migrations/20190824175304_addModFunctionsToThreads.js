/**
 * Add Mod-Type Options to forum_threads Table
 */
exports.up = async (knex, Promise) => {
    await knex.schema.alterTable("forum_threads", (t) => {
        t.integer("thread_locked").notNullable().defaultTo(0);
        t.integer("thread_deleted").notNullable().defaultTo(0);
    });
    await knex.schema.alterTable("forum_posts", (t) => {
        t.integer("post_deleted").notNullable().defaultTo(0);
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.alterTable("forum_threads", (t) => {
        t.dropColumn("thread_locked");
        t.dropColumn("thread_deleted");
    });
    await knex.schema.alterTable("forum_posts", (t) => {
        t.dropColumn("post_deleted");
    });
};