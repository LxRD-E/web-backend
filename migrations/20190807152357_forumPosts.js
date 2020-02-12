exports.up = async (knex, Promise) => {
    await knex.schema.createTable("forum_posts", (t) => {
        t.increments('id').primary();
        // forum_category
        t.integer("category").notNullable();
        // forum_subcategory
        t.integer("sub_category").notNullable();
        // The thread id
        t.integer("threadid", 20).notNullable();
        // User who posted
        t.integer("userid", 20).notNullable();
        // Date Created
        t.dateTime("date_created").notNullable().defaultTo(knex.fn.now());
        // Date Last Edited
        t.dateTime("date_edited").notNullable().defaultTo(knex.fn.now());
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("forum_posts");
};