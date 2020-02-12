exports.up = async (knex, Promise) => {
    await knex.schema.createTable("forum_subcategories", (t) => {
        t.increments('id').primary();
        t.integer("category").notNullable();
        t.string("title", 64);
        t.string("description", 256);
        // This is an int that corrosponds to the user_staff level (0 is anyone registered, etc)
        t.integer("read_permission_level", 1).defaultTo(0).notNullable();
        t.integer("post_permission_level", 1).defaultTo(0).notNullable();
    });
};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("forum_subcategories");
};