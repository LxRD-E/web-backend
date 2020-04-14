/**
 * Update old thumbnail_hashes URLs to New CDN URL (cdn.hindigamer.club => cdn.blockshub.net)
 */

exports.up = async (knex, Promise) => {
    // Update Thumbnails
    const thumbnails = await knex("thumbnail_hashes").select("id","url").where("url", "like", "https://cdn.hindigamer.club/%");
    for (let url of thumbnails) {
        let newUrl = "https://cdn.blockshub.net/"+url["url"].slice("https://cdn.hindigamer.club/".length);
        await knex("thumbnail_hashes").update({"url": newUrl}).where({"id":url["id"]});
    }
};

exports.down = async (knex, Promise) => {
    /**
     * Undo Thumbnail Changes
     */
    const thumbnails = await knex("thumbnail_hashes").select("id","url").where("url", "like", "https://cdn.blockshub.com/%");
    for (let url of thumbnails) {
        let newUrl = "https://cdn.hindigamer.club/"+url["url"].slice("https://cdn.blockshub.net/".length);
        await knex("thumbnail_hashes").update({"url": newUrl}).where({"id":url["id"]});
    }
};