/**
 * The purpose of this update is to add the defaultTime (current_timestamp()) to all date-based functions that this would make sense for.
*/
exports.up = async (knex, Promise) => {
    // Modify Users
    await knex.schema.alterTable("users", (t) => {
        t.dateTime("user_joindate").notNullable().defaultTo(knex.fn.now()).alter();
        t.dateTime("user_lastonline").notNullable().defaultTo(knex.fn.now()).alter();
        t.dateTime("user_birthdate").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify user_avatar
    await knex.schema.alterTable("user_avatar", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify user_emails
    await knex.schema.alterTable("user_emails", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify user_inventory
    await knex.schema.alterTable("user_inventory", (table) => {
        table.dateTime("date_created").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify user_ip
    await knex.schema.alterTable("user_ip", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify user_ip
    await knex.schema.alterTable("user_messages", (table) => {
        table.dateTime("message_date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify user_status
    await knex.schema.alterTable("user_status", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify catalog
    await knex.schema.alterTable("catalog", (table) => {
        table.dateTime("date_created").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify catalog_comments
    await knex.schema.alterTable("catalog_comments", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify forum_threads
    await knex.schema.alterTable("forum_threads", (table) => {
        table.dateTime("date_created").notNullable().defaultTo(knex.fn.now()).alter();
        table.dateTime("date_edited").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify forum_posts
    await knex.schema.alterTable("forum_posts", (table) => {
        table.dateTime("date_created").notNullable().defaultTo(knex.fn.now()).alter();
        table.dateTime("date_edited").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify friendships
    await knex.schema.alterTable("friendships", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify groups
    await knex.schema.alterTable("groups", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify group_shout
    await knex.schema.alterTable("group_shout", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify group_wall
    await knex.schema.alterTable("group_wall", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify moderation_ban
    await knex.schema.alterTable("moderation_ban", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify moderation_currency
    await knex.schema.alterTable("moderation_currency", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify moderation_give
    await knex.schema.alterTable("moderation_give", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify thumbnails
    await knex.schema.alterTable("thumbnails", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify trades
    await knex.schema.alterTable("trades", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
    // Modify transactions
    await knex.schema.alterTable("transactions", (table) => {
        table.dateTime("date").notNullable().defaultTo(knex.fn.now()).alter();
    });
};

exports.down = async (knex, Promise) => {
    // Un-modify Users
    await knex.schema.alterTable("users", (t) => {
        t.dateTime("user_joindate").notNullable().alter();
        t.dateTime("user_lastonline").notNullable().alter();
        t.dateTime("user_birthdate").notNullable().alter();
    });
    // Un-modify user_avatar
    await knex.schema.alterTable("user_avatar", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-modify user_emails
    await knex.schema.alterTable("user_emails", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-modify user_inventory
    await knex.schema.alterTable("user_inventory", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-modify user_ip
    await knex.schema.alterTable("user_ip", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-modify user_messages
    await knex.schema.alterTable("user_messages", (table) => {
        table.dateTime("message_date").notNullable().alter();
    });
    // Un-modify user_status
    await knex.schema.alterTable("user_status", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-modify catalog
    await knex.schema.alterTable("catalog", (table) => {
        table.dateTime("date_created").notNullable().alter();
    });
    // Un-modify catalog
    await knex.schema.alterTable("catalog_comments", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-modify forum_threads
    await knex.schema.alterTable("forum_threads", (table) => {
        table.dateTime("date_created").notNullable().alter();
        table.dateTime("date_edited").notNullable().alter();
    });
    // Un-modify forum_posts
    await knex.schema.alterTable("forum_posts", (table) => {
        table.dateTime("date_created").notNullable().alter();
        table.dateTime("date_edited").notNullable().alter();
    });
    // Un-modify friendships
    await knex.schema.alterTable("friendships", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify groups
    await knex.schema.alterTable("groups", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify group_shout
    await knex.schema.alterTable("group_shout", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify group_wall
    await knex.schema.alterTable("group_wall", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify moderation_ban
    await knex.schema.alterTable("moderation_ban", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify moderation_currency
    await knex.schema.alterTable("moderation_currency", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify moderation_give
    await knex.schema.alterTable("moderation_give", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify thumbnails
    await knex.schema.alterTable("thumbnails", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify trades
    await knex.schema.alterTable("trades", (table) => {
        table.dateTime("date").notNullable().alter();
    });
    // Un-Modify transactions
    await knex.schema.alterTable("transactions", (table) => {
        table.dateTime("date").notNullable().alter();
    });
};