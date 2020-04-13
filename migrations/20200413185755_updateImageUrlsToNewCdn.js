/**
 * Update old thumbnail URLs to New CDN URL (cdn.hindigamer.club => cdn.blockshub.net)
 */

exports.up = async (knex, Promise) => {
    /**
     * Update Thumbnails URL to new CDN Url
     */
    // Update Thumbnails
    const thumbnails = await knex("thumbnails").select("id","url").where("url", "like", "https://cdn.hindigamer.club/%");
    for (let url of thumbnails) {
        let newUrl = "https://cdn.blockshub.net/"+url["url"].slice("https://cdn.hindigamer.club/".length);
        await knex("thumbnails").update({"url": newUrl}).where({"id":url["id"]});
    }
    const gameThumbnails = await knex("game_thumbnails").select("id","thumbnail_url").where("thumbnail_url", "like", "https://cdn.hindigamer.club/%");
    for (let url of gameThumbnails) {
        let newUrl = "https://cdn.blockshub.net/"+url["thumbnail_url"].slice("https://cdn.hindigamer.club/".length);
        await knex("game_thumbnails").update({"thumbnail_url": newUrl}).where({"id":url["id"]});
    }
    const adImages = await knex("user_ads").select("id","image_url").where("image_url", "like", "https://cdn.hindigamer.club/%");
    for (let url of adImages) {
        let newUrl = "https://cdn.blockshub.net/"+url["image_url"].slice("https://cdn.hindigamer.club/".length);
        await knex("user_ads").update({"image_url": newUrl}).where({"id":url["id"]});
    }
    const userOutfits = await knex("user_outfit").select("id","outfit_url").where("outfit_url", "like", "https://cdn.hindigamer.club/%");
    for (let url of userOutfits) {
        let newUrl = "https://cdn.blockshub.net/"+url["outfit_url"].slice("https://cdn.hindigamer.club/".length);
        await knex("user_outfit").update({"outfit_url": newUrl}).where({"id":url["id"]});
    }
};

exports.down = async (knex, Promise) => {
    /**
     * Undo Thumbnail Changes
     */
    const thumbnails = await knex("thumbnails").select("id","url").where("url", "like", "https://cdn.blockshub.com/%");
    for (let url of thumbnails) {
        let newUrl = "https://cdn.hindigamer.club/"+url["url"].slice("https://cdn.blockshub.net/".length);
        await knex("thumbnails").update({"url": newUrl}).where({"id":url["id"]});
    }
    const gameThumbnails = await knex("game_thumbnails").select("id","thumbnail_url").where("thumbnail_url", "like", "https://cdn.blockshub.net/%");
    for (let url of gameThumbnails) {
        let newUrl = "https://cdn.hindigamer.club/"+url["thumbnail_url"].slice("https://cdn.blockshub.net/".length);
        await knex("game_thumbnails").update({"thumbnail_url": newUrl}).where({"id":url["id"]});
    }
    const adImages = await knex("user_ads").select("id","image_url").where("image_url", "like", "https://cdn.blockshub.net/%");
    for (let url of adImages) {
        let newUrl = "https://cdn.hindigamer.club/"+url["image_url"].slice("https://cdn.hindigamer.club/".length);
        await knex("user_ads").update({"image_url": newUrl}).where({"id":url["id"]});
    }
};