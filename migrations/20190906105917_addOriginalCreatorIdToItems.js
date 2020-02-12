/**
 * Add a Original Creator Type ID to catalog items, so groups know who originally made the item
 */

exports.up = async (knex, Promise) => {
    /**
     * Add Ban Reaosn Column
     */
    await knex.schema.alterTable("catalog", (t) => {
        t.integer("original_creatorid").notNullable().defaultTo(0);
    });
    // Update Existing Items
    const items = await knex("catalog").select("id","creator");
    for (let item of items) {
        await knex("catalog").update({"original_creatorid": item["creator"]}).where({"id":item["id"]});
    }
};

exports.down = async (knex, Promise) => {
    /**
     * Remove Column
     */
    await knex.schema.alterTable("catalog", (t) => {
        t.dropColumn('original_creatorid');
    });
};