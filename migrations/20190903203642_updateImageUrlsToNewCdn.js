/**
 * Update old thumbnail URLs to New CDN URL (eccdn.rblxcdn.com => cdn.hindigamer.club)
 */

exports.up = async (knex, Promise) => {
    /**
     * Update Thumbnails URL to new CDN Url
     */
    // Update Thumbnails
    const thumbnails = await knex("thumbnails").select("id","url").where("url", "like", "%https://eccdn.rblxcdn.com/thumbnails/%");
    for (let url of thumbnails) {
        let newUrl = "https://cdn.hindigamer.club/thumbnails/"+url["url"].slice(37);
        await knex("thumbnails").update({"url": newUrl}).where({"id":url["id"]});
    }
};

exports.down = async (knex, Promise) => {
    /**
     * Undo Thumbnail Changes
     */
    const thumbnails = await knex("thumbnails").select("id","url").where("url", "like", "%https://cdn.hindigamer.club/thumbnails/%");
    for (let url of thumbnails) {
        let newUrl = "https://eccdn.rblxcdn.com/thumbnails/"+url["url"].slice(39);
        await knex("thumbnails").update({"url": newUrl}).where({"id":url["id"]});
    }
};