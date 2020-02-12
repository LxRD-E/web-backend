/**
 * Chat System to DB
 */

exports.up = async (knex, Promise) => {
     // Update Existing Items
     const items = await knex("catalog").select("id","original_creatorid",'date_created','category');
     for (let item of items) {
        if (item.category === 2 || item.category === 3 || item.category === 4 || item.category === 7) {
            await knex("catalog_assets").insert({
                'catalogid': item['id'],
                'creatortype': 0, // set to user for now
                'creatorid': item['original_creatorid'],
                'date_created': item['date_created'],
                'filename': item['id'],
                'filetype': 'png',
                'assettype': 0,
            });
        }else if (item.category === 1 || item.category === 5 || item.category === 6) {
            await knex("catalog_assets").insert({
                'catalogid': item['id'],
                'creatortype': 0, // set to user for now
                'creatorid': item['original_creatorid'],
                'date_created': item['date_created'],
                'filename': item['id'],
                'filetype': 'png',
                'assettype': 0,
            });
            await knex("catalog_assets").insert({
                'catalogid': item['id'],
                'creatortype': 0, // set to user for now
                'creatorid': item['original_creatorid'],
                'date_created': item['date_created'],
                'filename': item['id'],
                'filetype': 'mtl',
                'assettype': 2,
            });
            await knex("catalog_assets").insert({
                'catalogid': item['id'],
                'creatortype': 0, // set to user for now
                'creatorid': item['original_creatorid'],
                'date_created': item['date_created'],
                'filename': item['id'],
                'filetype': 'obj',
                'assettype': 1,
            });
        }
     }
};

exports.down = async (knex, Promise) => {
    await knex('catalog_assets').truncate();
};