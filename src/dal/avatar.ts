/**
 * Imports
 */
import redis from '../helpers/ioredis_pubsub'
import axios from 'axios';
import * as Thumbnail from '../models/v1/thumnails';
import * as Avatar from '../models/v1/avatar';

import * as Users from '../models/v1/user';
import * as Catalog from '../models/v1/catalog';
import * as model from '../models/models';

import config from '../helpers/config';

import _init from './_init';
import crypto = require('crypto');

/**
 * Model used for Avatar and Thumbnail Rendering, as well as controlling the User Avatar
 */
class AvatarDAL extends _init {

    /**
     * Create an outfit. Resolves with a promise containing the ID of the outfit
     * @param userId
     * @param thumbnailUrl
     * @param name
     */
    public async createOutfit(userId: number, thumbnailUrl: string, name?: string): Promise<number> {
        let outfitCreated = await this.knex('user_outfit').insert({
            user_id: userId,
            name: name,
            'outfit_url': thumbnailUrl,
        });
        return outfitCreated[0];
    }

    /**
     * Get an outfit by the {outfitId}
     * @param outfitId 
     */
    public async getOutfit(outfitId: number): Promise<model.avatar.UserOutfit> {
        let outfitData = await this.knex ('user_outfit').select('id as outfitId','user_id as userId','name', 'outfit_url as url').where({
            'id': outfitId,
        }).limit(1);
        return outfitData[0];
    }

    public async deleteOutfit(outfitId: number): Promise<void> {
        await this.knex('user_outfit').delete().where({'id': outfitId});
        await this.knex('user_outfit_avatar').delete().where({'outfit_id': outfitId});
        await this.knex('user_outfit_avatarcolor').delete().where({'outfit_id': outfitId});
    }

    public async updateOutfitName(outfitId: number, newName: string): Promise<void> {
        await this.knex('user_outfit').update({
            'name': newName,
            'updated_at': this.knexTime(),
        }).where({'id': outfitId}).limit(1);
    }

    /**
     * Get outfits for the specified userId
     * @param userId 
     * @param limit 
     * @param offset 
     */
    public async getOutfitsForUser(userId: number, limit: number = 100, offset: number = 0): Promise<model.avatar.UserOutfit[]> {
        return this.knex('user_outfit').select('id as outfitId', 'user_id as userId', 'name', 'outfit_url as url').where({
            'user_id': userId,
        }).limit(limit).offset(offset);
    }

    /**
     * Count outfits for the specified userId
     * @param userId 
     */
    public async countOutfitsForUser(userId: number): Promise<number> {
        let outfits = await this.knex('user_outfit').count('id as total').where({
            'user_id': userId,
        });
        return outfits[0]['total'] as number;
    }

    public async getOutfitAvatar(outfitId: number): Promise<model.avatar.UserOutfitAvatar[]> {
        return this.knex('user_outfit_avatar').select('user_outfit_avatar.catalog_id as catalogId', 'type').where({outfit_id: outfitId});
    }

    public async getOutfitAvatarColors(outfitId: number): Promise<model.avatar.UserOutfitAvatar[]> {
        return this.knex('user_outfit_avatarcolor').select('user_outfit_avatarcolor.*').where({outfit_id: outfitId});
    }

    /**
     * Update the thumbnail URL of an outfit
     * @param outfitId 
     * @param url 
     */
    public async updateOutfitUrl(outfitId: number, url: string): Promise<void> {
        await this.knex('user_outfit').update({
            'outfit_url': url,
        }).where({'id': outfitId});
    }

    /**
     * Add items to the outfit user_outfit_avatar table
     */
    public async multiAddItemsToOutfit(outfitId: number, avatarRequest: Avatar.itemsArray[]): Promise<void> {
        const addItems = [] as any;
        avatarRequest.forEach((obj: Avatar.itemsArray) => {
            addItems.push({
                'catalog_id': obj.catalogId,
                type: obj.category,
                outfit_id: outfitId,
            });
        });
        await this.knex("user_outfit_avatar").insert(addItems);
    }

    /**
     * Add a user's avatar colors to a user outfit
     * @param UserId User's ID
     * @param HeadRGB Array of RGB Values
     * @param LegRGB Array of RGB Values
     * @param TorsoRGB Array of RGB Values
     */
    public async addColorsToOutfit(outfitId: number, HeadRGB: Array<number>, LegRGB: Array<number>, TorsoRGB: Array<number>): Promise<void> {
        await this.knex("user_outfit_avatarcolor").insert({
            outfit_id: outfitId,
            legr: LegRGB[0],
            legg: LegRGB[1],
            legb: LegRGB[2],
            headr: HeadRGB[0],
            headg: HeadRGB[1],
            headb: HeadRGB[2],
            torsor: TorsoRGB[0],
            torsog: TorsoRGB[1],
            torsob: TorsoRGB[2],
        });
    }

    /**
     * Add items to the user's user_avatar table.
     */
    public async multiAddItemsToAvatar(avatarRequest: Avatar.itemsArray[]): Promise<void> {
        const addItems = [] as Avatar.avatarRequestModel[];
        avatarRequest.forEach((obj: Avatar.itemsArray) => {
            addItems.push({
                userid: obj.userId,
                'catalog_id': obj.catalogId,
                type: obj.category,
                date: this.moment().format('YYYY-MM-DD HH:mm:ss'),
            });
        });
        await this.knex("user_avatar").insert(addItems);
    }

    /**
     * Add a user's new avatar coloring to the avatarcolor table
     * @param UserId User's ID
     * @param HeadRGB Array of RGB Values
     * @param LegRGB Array of RGB Values
     * @param TorsoRGB Array of RGB Values
     */
    public async addAvatarColors(UserId: number, HeadRGB: Array<number>, LegRGB: Array<number>, TorsoRGB: Array<number>): Promise<void> {
        await this.knex("user_avatarcolor").insert({
            userid: UserId,
            legr: LegRGB[0],
            legg: LegRGB[1],
            legb: LegRGB[2],
            headr: HeadRGB[0],
            headg: HeadRGB[1],
            headb: HeadRGB[2],
            torsor: TorsoRGB[0],
            torsog: TorsoRGB[1],
            torsob: TorsoRGB[2],
        });
    }

    /**
     * Delete a user's Avatar items from the user_avatar
     * @param userId User's ID
     */
    public async deleteAvatar(userId: number): Promise<void> {
        await this.knex("user_avatar").delete().where({ "userid": userId });
    }

    /**
     * Delete a specific catalog ID from a user's avatar
     * @param userId User's ID
     */
    public async deleteAvatarCatalogId(userId: number, catalogId: number): Promise<void> {
        await this.knex("user_avatar").delete().where({ "userid": userId, 'catalog_id': catalogId });
    }

    /**
     * Delete a user's Avatar coloring from the user_avatar
     * @param userId User's ID
     */
    public async deleteAvatarColoring(userId: number): Promise<void> {
        await this.knex("user_avatarcolor").delete().where({ "userid": userId });
    }

    /**
     * Add a new Thumbnail to the Thumbnails table
     * @param userId User's ID
     * @param url URL of Thumbnail
     */
    public async addAvatarUrl(userId: number, url: string): Promise<void> {
        await this.knex("thumbnails").insert({
            "reference_id": userId,
            "type": Thumbnail.Type.UserThumb,
            "url": url,
        });
    }

    /**
     * Delete an Old Avatar from the Thumbnails Table
     * @param userId User's ID
     */
    public async deletedOldAvatarUrl(userId: number): Promise<void> {
        await this.knex("thumbnails").delete().where({ "reference_id": userId, "type": Thumbnail.Type.UserThumb });
    }

    /**
     * Render an avatar. If successful, resolve with object containing URL. Else, reject
     * @param jsonArray 
     */
    public async renderAvatar(type: 'avatar'|'item'|'face'|'group', jsonArray: Avatar.JsonArrayInterfaceWithAssets): Promise<string> {
        const url = config.render.url;
        const jsonString = jsonArray;
        if (type === 'item') {
            type = 'avatar';
        }
        const request = await axios.post(url+'?key=' + config.render.key + "&type="+type+"&id="+jsonArray.UserId, jsonString, {});
        let body = request.data;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            }catch{
                // err
            }
        }
        console.log(request.status, request.statusText);
        console.log(request.data);
        if (typeof body === 'string' || body.error || body.success === false || body.image == null) {
            throw Error('No url was specified in body.');
        }
        return body.image as string;
        
        /*
        return new Promise((resolve, reject): void => {
            const jsonString = JSON.stringify(jsonArray);
            const options = {
                hostname: config.render.host,
                port: config.render.port,
                path: '/index.php?key=' + config.render.key + "&type="+type+"&id="+jsonArray.UserId,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(jsonString),
                },
            };
            let uploadLib;
            if (config.render.tls) {
                uploadLib = https;
            } else {
                uploadLib = http;
            }
            let dataString = "";
            const req = uploadLib.request(options, (res) => {
                res.on('data', (d) => {
                    dataString += d;
                });
                res.on('error', (err) => {
                    console.log(err);
                    reject(err);
                });
                res.on('close', () => {
                    console.log('connection was closed.');
                    console.log('we recieved this:');
                    console.log(dataString);
                    try {
                        const jsonString = JSON.parse(dataString);
                        if (jsonString && jsonString.image) {
                            console.log(jsonString.image);
                            resolve(jsonString.image);
                        }else{
                            console.log(dataString);
                            reject("Returned object does not contain image URL "+dataString);
                        }
                    } catch (e) {
                        console.log(dataString);
                        reject("Unable to Parse JSON " + dataString);
                    }
                });
            });
            req.write(jsonString);
            req.end();
        });
        */
        
    }

    /**
     * Get a Thumbnail's Hash URL. Returns void if no hash found
     * @param thumbnailJson 
     */
    public async getThumbnailHashUrl(thumbnailJson: Avatar.JsonArrayInterfaceWithAssets): Promise<string|void> {
        const hash = this.createThumbnailHash(thumbnailJson);
        const result = await this.knex("thumbnail_hashes").select("id as thumbnailHashId","url","date_created as dateCreated").where({'hash': hash}).limit(1).orderBy('id', 'desc');
        // If no results
        if (!result[0]) {
            return;
        }
        // If expired (aka 1 year old)
        if (this.moment().isSameOrAfter(this.moment(result[0]['dateCreated']).add(1, 'years'))) {
            return;
        }
        // Seems good to go
        return result[0]['url'];
    }

    /**
     * Record a Thumbnail Hash
     */
    public async recordThumbnailHash(thumbnailJson: Avatar.JsonArrayInterfaceWithAssets, url: string): Promise<void> {
        const hash = this.createThumbnailHash(thumbnailJson);
        await this.knex("thumbnail_hashes").insert({
            'hash': hash,
            'url': url,
            'date_created': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Generate a Avatar Thumbnail Hash
     * @param thumbnailJson 
     */
    public createThumbnailHash(thumbnailJson: Avatar.JsonArrayInterfaceWithAssets): string {
        // console.log(JSON.stringify(thumbnailJson));
        // Duplicate json object
        const jsonString = JSON.parse(JSON.stringify(thumbnailJson)) as Avatar.JsonArrayInterfaceWithAssets;
        // Set UserID to 0
        jsonString.UserId = 0;
        // Sort hats
        /*
        jsonString.Hats.MTL = jsonString.Hats.MTL.sort();
        jsonString.Hats.OBJ = jsonString.Hats.OBJ.sort();
        jsonString.Hats.Texture = jsonString.Hats.Texture.sort();
        */
        // create hash
        return crypto.createHash('sha256').update(JSON.stringify(jsonString)).digest('hex');
    }

    /**
     * Check if the rate-limit time for avatar editing has passed
     * @param userId User's ID
     */
    public async canUserModifyAvatar(userId: number): Promise<boolean> {
        const latestModification = await this.knex("user_avatar").select("date").where({"userid":userId}).orderBy("id", "desc").limit(1);
        if (!latestModification || !latestModification[0]) {
            return true;
        }
        return this.moment().isSameOrAfter(this.moment(latestModification[0]["date"]).add(15, "seconds"));

    }

    /**
     * Generate User Avatar from existing stuff (colors & assets that the user is wearing)
     * @param userId 
     * @param avatarColors 
     * @param avatar 
     */
    public async generateAvatarFromModels(userId: number, avatarColors: Users.UserAvatarColor[], avatar: Users.UserAvatarItem[]): Promise<Avatar.jsonArrayInterface> {
        const avatarObject = {
            UserId: userId,
            Hats: [],
            Face: false,
            Gear: false,
            Torso: [
                avatarColors[0].torsor/255,
                avatarColors[0].torsog/255,
                avatarColors[0].torsob/255,
            ],
            Head: [
                avatarColors[0].headr/255,
                avatarColors[0].headg/255,
                avatarColors[0].headb/255,
            ],
            Leg: [
                avatarColors[0].legr/255,
                avatarColors[0].legg/255,
                avatarColors[0].legb/255,
            ],
            TShirt: false,
            Shirt: false,
            Pants: false,
        } as Avatar.jsonArrayInterface;
        for (const obj of avatar) {
            if (obj.type === Catalog.category.Hat) {
                avatarObject.Hats.push(obj.catalogId);
            }else if (obj.type === Catalog.category.Faces) {
                avatarObject.Face = obj.catalogId;
            }else if (obj.type === Catalog.category.Gear) {
                avatarObject.Gear = true;
                avatarObject.Hats.push(obj.catalogId);
            }else if (obj.type === Catalog.category.Shirt) {
                avatarObject.Shirt = obj.catalogId;
            }else if (obj.type === Catalog.category.Pants) {
                avatarObject.Pants = obj.catalogId;
            }else if (obj.type === Catalog.category.TShirt) {
                avatarObject.TShirt = obj.catalogId;
            }
        }
        return avatarObject;
    }

    /**
     * Listen for avatar changes. Returns null after 20 seconds, otherwise returns image URL
     * @param userId The userId
     */
    public setupAvatarUpdateListener(userId: number): Promise<string|void> {
        return new Promise((resolve, reject): void => {
            let discon = false;
            const listener = redis();
            listener.on('connect', async () => {
                await listener.subscribe('AvatarUpdate'+userId);
            });
            listener.on('message', (channel: string, message: string) => {
                if (channel === 'AvatarUpdate'+userId) {
                    resolve(message);
                    listener.unsubscribe();
                    listener.disconnect();
                    discon = true;
                }
            });
            setTimeout(() => {
                if (discon) {
                    return;
                }
                listener.unsubscribe();
                listener.disconnect();
                resolve();
            }, 20000);
        });
    }

    /**
     * Publish an avatar update is finished
     * @param userId The userId
     */
    public async publishAvatarUpdateFinished(userId: number, url: string): Promise<void> {
        return new Promise((resolve, reject): void => {
            const listener = redis();
            listener.on('connect', async () => {
                await listener.publish('AvatarUpdate'+userId, url);
                listener.disconnect();
                resolve();
            });
        });
    }
}

export default AvatarDAL;
