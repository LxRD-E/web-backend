/**
 * Add user oufits
 */

exports.up = async (knex, Promise) => {
    await knex.schema.createTable("user_outfit", (t) => {
        t.bigIncrements('id').primary().unsigned(); // outfit id
        t.bigInteger('user_id').notNullable().unsigned(); // outfit creator
        t.string('name', 255).notNullable().defaultTo('Untitled Outfit'); // name of the outfit
        t.string('outfit_url', 1024); // outfit thumbnail url
        t.datetime('created_at').notNullable().defaultTo(knex.fn.now()); // date request was created
        t.datetime('updated_at').notNullable().defaultTo(knex.fn.now()); // date request was last responded to or updated at
    });

    // Create the user_avatar Table
    await knex.schema.createTable('user_outfit_avatar', (table) => {
        table.increments('id').primary();
        // outfit id Foreign Key for user_outfit table
        table.integer("outfit_id", 20).notNullable();
        // catalog_id Foreign key for catalog table
        table.integer("catalog_id", 20).notNullable();
        // Type (see: models.catalog.catalog_type)
        table.integer("type", 8).notNullable();
    });

    // Create the user_avatarcolor Table
    await knex.schema.createTable('user_outfit_avatarcolor', (table) => {
        table.increments('id').primary();
        // outfit id Foreign Key for user_outfit table
        table.integer("outfit_id", 20).notNullable();
        // Leg
        table.integer("legr", 11).notNullable();
        table.integer("legb", 11).notNullable();
        table.integer("legg", 11).notNullable();
        // Head
        table.integer("headr", 11).notNullable();
        table.integer("headg", 11).notNullable();
        table.integer("headb", 11).notNullable();
        // Torso
        table.integer("torsor", 11).notNullable();
        table.integer("torsob", 11).notNullable();
        table.integer("torsog", 11).notNullable();
    });

};

exports.down = async (knex, Promise) => {
    await knex.schema.dropTable("user_outfit");
    await knex.schema.dropTable("user_outfit_avatar");
    await knex.schema.dropTable("user_outfit_avatarcolor");
};