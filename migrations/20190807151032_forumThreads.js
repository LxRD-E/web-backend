exports.up = async (knex, Promise) => {
    await knex.schema.createTable("forum_threads", (t) => {
        t.increments('id').primary();
        // forum_category
        t.integer("category").notNullable();
        // forum_subcategory
        t.integer("sub_category").notNullable();
        // The thread title
        t.string("title", 64);

        // Note: Created thread bodies will appear in the post table, and not in the thread table itself
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("forum_threads");
};