/**
 * This is the initialization migration since we didn't use migrations up until this point.
 */
let prefix = ""; // Default is null. Used if you want to have multiple migrations for some reason
exports.up = async (knex, Promise) => {
    // Create the Users Table
    await knex.schema.createTable(prefix+'users', (table) => {
        table.increments('id').primary();
        table.string("username", 32).notNullable();
        table.unique("username");
        table.string('password', 255).notNullable();
        table.integer("password_changed", 128).defaultTo(0);
        table.bigInteger("user_balance1").defaultTo(0).notNullable();
        table.bigInteger("user_balance2").defaultTo(0).notNullable();
        table.dateTime("user_membership");
        table.dateTime("user_balancedailyaward").notNullable();
        table.string("user_status", 128);
        table.string("user_blurb", 1024);
        table.dateTime("user_joindate").notNullable();
        table.dateTime("user_lastonline").notNullable();
        table.dateTime("user_birthdate").notNullable();
        table.integer("user_theme", 4).notNullable().defaultTo(0);
        table.integer("user_tradingenabled", 1).notNullable().defaultTo(1);
        table.integer("user_staff", 1).notNullable().defaultTo(0);
        table.integer("is_banned", 1).notNullable().defaultTo(0);
    });
    // Create the user_avatar Table
    await knex.schema.createTable(prefix+'user_avatar', (table) => {
        table.increments('id').primary();
        // userid Foreign Key for users table
        table.integer("userid", 20).notNullable();
        // catalog_id Foreign key for catalog table
        table.integer("catalog_id", 20).notNullable();
        // Type (see: models.catalog().catalog_type)
        table.integer("type", 8).notNullable();
        // Datetime when added
        table.dateTime("date").notNullable();
    });

    // Create the user_avatarcolor Table
    await knex.schema.createTable(prefix+'user_avatarcolor', (table) => {
        table.increments('id').primary();
        // userid Foreign Key for users table
        table.integer("userid", 20).notNullable();
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

    // Create the user_emails Table
    await knex.schema.createTable(prefix+'user_emails', (table) => {
        table.increments('id').primary();
        // userid Foreign Key for users table
        table.integer("userid", 20).notNullable();
        table.string("email", 255).notNullable();
        table.string("verification_code", 255).notNullable();
        table.integer("status", 4).notNullable();
        table.dateTime("date").notNullable();
    });

    // Create the user_inventory Table
    await knex.schema.createTable(prefix+'user_inventory', (table) => {
        table.increments('id').primary();
        table.integer("serial", 128).defaultTo(null);
        table.integer("catalog_id", 128).notNullable();
        // userid Foreign Key for users table
        table.integer("user_id", 128).notNullable();
        table.integer("price", 128).notNullable().defaultTo(0);
        table.dateTime("date_created").notNullable();
    });

    // Create the user_ip Table
    await knex.schema.createTable(prefix+'user_ip', (table) => {
        table.increments('id').primary();
        table.integer("userid", 20).defaultTo(null);
        table.string("ip_address", 255).notNullable();
        table.dateTime("date").notNullable();
        table.integer("action", 11).notNullable();
    });

    // Create the user_messages Table
    await knex.schema.createTable(prefix+'user_messages', (table) => {
        table.increments('id').primary();
        table.integer("userid_to", 20).notNullable();
        table.integer("userid_from", 20).notNullable();
        table.string("message_subject", 128).notNullable();
        table.text("message_body").notNullable();
        table.dateTime("message_date").notNullable();
        table.integer("message_read", 1).notNullable().defaultTo(0);
    });

     // Create the user_moderation Table
     await knex.schema.createTable(prefix+'user_moderation', (table) => {
        table.increments('id').primary();
        table.integer("userid", 20).notNullable();
        table.string("reason", 256).notNullable();
        table.dateTime("date").notNullable();
        table.dateTime("until_unbanned").notNullable();
        table.integer("is_terminated", 1).notNullable().defaultTo(0);
    });

    // Create the user_status Table
    await knex.schema.createTable(prefix+'user_status', (table) => {
        table.increments('id').primary();
        table.integer("userid", 20).notNullable();
        table.string("status", 255).notNullable();
        table.dateTime("date").notNullable();
    });

    // Catalog

    // Create the catalog Table
    await knex.schema.createTable(prefix+'catalog', (table) => {
        table.increments('id').primary();
        table.string("name", 256).notNullable();
        table.string("description", 1024).notNullable();
        table.integer("price", 128).notNullable();
        table.integer("average_price", 11).notNullable().defaultTo(0);
        table.dateTime("date_created").notNullable();
        table.integer("currency", 4).notNullable();
        table.integer("category", 24).notNullable();
        // userid of creator
        table.integer("creator", 128).notNullable();
        table.integer("is_collectible", 1).notNullable().defaultTo(0);
        table.integer("max_sales", 11).notNullable().defaultTo(0);
        table.integer("is_for_sale", 1).notNullable().defaultTo(0);
        table.integer("is_pending", 1).notNullable().defaultTo(1);
    });

    // Create the catalog_comments Table
    await knex.schema.createTable(prefix+'catalog_comments', (table) => {
        table.increments('id').primary();
        table.integer("catalog_id", 20).notNullable();
        table.integer("userid", 20).notNullable();
        table.dateTime("date").notNullable();
        table.text("comment").notNullable();
    });

    // Friends

    // Create the friendships Table
    await knex.schema.createTable(prefix+'friendships', (table) => {
        table.increments('id').primary();
        table.integer("userid_one", 128).notNullable();
        table.integer("userid_two", 128).notNullable();
        table.dateTime("date").notNullable();
    });

    // Create the friend_request Table
    await knex.schema.createTable(prefix+'friend_request', (table) => {
        table.increments('id').primary();
        table.integer("userid_requester", 128).notNullable();
        table.integer("userid_requestee", 128).notNullable();
    });

    // Groups

    // Create the groups Table
    await knex.schema.createTable(prefix+'groups', (table) => {
        table.increments('id').primary();
        table.string("name", 75).notNullable();
        table.unique("name");
        table.text("desacription").notNullable();
        table.integer("owner_userid", 20).notNullable();
        table.integer("membercount", 11).notNullable();
        table.dateTime("date").notNullable();
        table.integer("thumbnail_catalogid").notNullable().defaultTo(0);
    });

    // Create the group_members Table
    await knex.schema.createTable(prefix+'group_members', (table) => {
        table.increments('id').primary();
        table.integer("groupid", 20).notNullable();
        table.integer("userid", 20).notNullable();
        table.integer("roleid", 20).notNullable();
    });

    // Create the group_roles Table
    await knex.schema.createTable(prefix+'group_roles', (table) => {
        table.increments('id').primary();
        table.string("name", 50).notNullable();
        table.string("description", 100).notNullable();
        table.integer("groupid", 20).notNullable();
        table.integer("rank", 11).notNullable();
        table.integer("permission_get_wall", 1).notNullable().defaultTo(0);
        table.integer("permission_post_wall", 1).notNullable().defaultTo(0);
        table.integer("permission_get_shout", 1).notNullable().defaultTo(0);
        table.integer("permission_post_shout", 1).notNullable().defaultTo(0);
        table.integer("permission_manage_group", 1).notNullable().defaultTo(0);
    });

    // Create the group_shout Table
    await knex.schema.createTable(prefix+'group_shout', (table) => {
        table.increments('id').primary();
        table.integer("groupid", 20).notNullable();
        table.integer("userid", 20).notNullable();
        table.dateTime("date").notNullable();
        table.text("shout").notNullable();
    });

    // Create the group_wall Table
    await knex.schema.createTable(prefix+'group_wall', (table) => {
        table.increments('id').primary();
        table.integer("groupid", 20).notNullable();
        table.integer("userid", 20).notNullable();
        table.text("content").notNullable();
        table.dateTime("date").notNullable();
    });

    // Moderation

    // Create the moderation_ban Table
    await knex.schema.createTable(prefix+'moderation_ban', (table) => {
        table.increments('id').primary();
        table.integer("userid", 20).notNullable();
        table.integer("userid_modified", 20).notNullable();
        table.dateTime("date").notNullable();
        table.integer("type", 11).notNullable();
    });

    // Create the moderation_currency Table
    await knex.schema.createTable(prefix+'moderation_currency', (table) => {
        table.increments('id').primary();
        table.integer("userid", 20).notNullable();
        table.integer("userid_affected", 20).notNullable();
        table.integer("amount", 11).notNullable();
        table.integer("currency", 1).notNullable();
        table.dateTime("date").notNullable();
    });

    // Create the moderation_give Table
    await knex.schema.createTable(prefix+'moderation_give', (table) => {
        table.increments('id').primary();
        table.integer("userid", 20).notNullable();
        table.integer("userid_to", 20).notNullable();
        table.integer("catalog_id", 20).notNullable();
        table.integer("inventory_id", 20).notNullable();
        table.dateTime("date").notNullable();
    });

    // Thumbnails

    // Create the thumbnails Table
    await knex.schema.createTable(prefix+'thumbnails', (table) => {
        table.increments('id').primary();
        table.string("type", 64).notNullable();
        table.integer("reference_id", 128).notNullable();
        table.string("url", 1024).notNullable();
        table.dateTime("date").notNullable();
    });

    // Trades

    // Create the trades Table
    await knex.schema.createTable(prefix+'trades', (table) => {
        table.increments('id').primary();
        table.string("userid_one", 20).notNullable();
        table.integer("userid_two", 20).notNullable();
        table.integer("status", 1).defaultTo(0);
        table.dateTime("date").notNullable();
    });

    // Create the trade_items Table
    await knex.schema.createTable(prefix+'trade_items', (table) => {
        table.increments('id').primary();
        table.integer("trade_id", 128).notNullable();
        table.integer("userinventory_id", 128).notNullable();
        table.integer("catalog_id", 128).notNullable();
        table.integer("side", 1).notNullable();
    });

    // Transactions

    // Create the transactions Table
    await knex.schema.createTable(prefix+'transactions', (table) => {
        table.increments('id').primary();
        table.integer("userid_to", 128).notNullable();
        table.integer("userid_from", 128).notNullable();
        table.integer("amount", 128).notNullable();
        table.integer("currency", 1).notNullable();
        table.dateTime("date").notNullable();
        table.integer("type", 4).notNullable();
        table.string("description", 256).notNullable();
        table.integer("catalogid", 128).notNullable().defaultTo(0);
        table.integer("user_inventoryid", 128).defaultTo(null);
    });
};

exports.down = async (knex, Promise) => {
    /**
     * Since this is the initialization migration, we don't do anything here to prevent issues in production. Uncomment the following lines to enable dropping of tables.
     */
    let host = require("os").hostname();
    if (host === "DESKTOP-FDRBVV0") {
        await knex.schema.dropTable(prefix+"users");
        await knex.schema.dropTable(prefix+"user_avatar");
        await knex.schema.dropTable(prefix+"user_avatarcolor");
        await knex.schema.dropTable(prefix+"user_emails");
        await knex.schema.dropTable(prefix+"user_inventory");
        await knex.schema.dropTable(prefix+"user_ip");
        await knex.schema.dropTable(prefix+"user_messages");
        await knex.schema.dropTable(prefix+"user_moderation");
        await knex.schema.dropTable(prefix+"user_status");
        // Catalog
        await knex.schema.dropTable(prefix+"catalog");
        await knex.schema.dropTable(prefix+"catalog_comments");
        // Friends
        await knex.schema.dropTable(prefix+"friendships");
        await knex.schema.dropTable(prefix+"friend_request");
        // Groups
        await knex.schema.dropTable(prefix+"groups");
        await knex.schema.dropTable(prefix+"group_members");
        await knex.schema.dropTable(prefix+"group_roles");
        await knex.schema.dropTable(prefix+"group_shout");
        await knex.schema.dropTable(prefix+"group_wall");
        // Moderation
        await knex.schema.dropTable(prefix+"moderation_ban");
        await knex.schema.dropTable(prefix+"moderation_give");
        await knex.schema.dropTable(prefix+"moderation_currency");
        // Thumbnails
        await knex.schema.dropTable(prefix+"thumbnails");
        // Trades
        await knex.schema.dropTable(prefix+"trades");
        await knex.schema.dropTable(prefix+"trade_items");
        // Transactions
        await knex.schema.dropTable(prefix+"transactions");
    }
};
