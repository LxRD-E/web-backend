/**
 * The purpose of this update is to create the base forum categories & subcategories
*/
exports.up = async (knex, Promise) => {
    // Create Main Category
    let id = await knex("forum_categories").insert({"title":"Website","description":"N/A"});
    // Grab ID To use for the below functions
    id = id[0];
    // Create Sub Categories
    await knex("forum_subcategories").insert({"category":id,"title":"Hub","description":"N/A"});
    await knex("forum_subcategories").insert({"category":id,"title":"Off-Topic","description":"N/A"});
    await knex("forum_subcategories").insert({"category":id,"title":"Marketplace","description":"N/A"});
};

exports.down = async (knex, Promise) => {
    // Delete all forum Categories & Sub Categories
    await knex("forum_categories").del();
    await knex("forum_subcategories").del();
    // Reset Increment
    await knex.raw('ALTER TABLE ' + 'forum_categories' + ' AUTO_INCREMENT = 1');
    await knex.raw('ALTER TABLE ' + 'forum_subcategories' + ' AUTO_INCREMENT = 1');
};