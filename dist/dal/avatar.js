"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_pubsub_1 = require("../helpers/ioredis_pubsub");
const axios_1 = require("axios");
const Thumbnail = require("../models/v1/thumnails");
const Catalog = require("../models/v1/catalog");
const config_1 = require("../helpers/config");
const _init_1 = require("./_init");
const crypto = require("crypto");
class AvatarDAL extends _init_1.default {
    async createOutfit(userId, thumbnailUrl, name) {
        let outfitCreated = await this.knex('user_outfit').insert({
            user_id: userId,
            name: name,
            'outfit_url': thumbnailUrl,
        });
        return outfitCreated[0];
    }
    async getOutfit(outfitId) {
        let outfitData = await this.knex('user_outfit').select('id as outfitId', 'user_id as userId', 'name', 'outfit_url as url').where({
            'id': outfitId,
        }).limit(1);
        return outfitData[0];
    }
    async deleteOutfit(outfitId) {
        await this.knex('user_outfit').delete().where({ 'id': outfitId });
        await this.knex('user_outfit_avatar').delete().where({ 'outfit_id': outfitId });
        await this.knex('user_outfit_avatarcolor').delete().where({ 'outfit_id': outfitId });
    }
    async updateOutfitName(outfitId, newName) {
        await this.knex('user_outfit').update({
            'name': newName,
            'updated_at': this.knexTime(),
        }).where({ 'id': outfitId }).limit(1);
    }
    async getOutfitsForUser(userId, limit = 100, offset = 0) {
        return this.knex('user_outfit').select('id as outfitId', 'user_id as userId', 'name', 'outfit_url as url').where({
            'user_id': userId,
        }).limit(limit).offset(offset);
    }
    async countOutfitsForUser(userId) {
        let outfits = await this.knex('user_outfit').count('id as total').where({
            'user_id': userId,
        });
        return outfits[0]['total'];
    }
    async getOutfitAvatar(outfitId) {
        return this.knex('user_outfit_avatar').select('user_outfit_avatar.catalog_id as catalogId', 'type').where({ outfit_id: outfitId });
    }
    async getOutfitAvatarColors(outfitId) {
        return this.knex('user_outfit_avatarcolor').select('user_outfit_avatarcolor.*').where({ outfit_id: outfitId });
    }
    async updateOutfitUrl(outfitId, url) {
        await this.knex('user_outfit').update({
            'outfit_url': url,
        }).where({ 'id': outfitId });
    }
    async multiAddItemsToOutfit(outfitId, avatarRequest) {
        const addItems = [];
        avatarRequest.forEach((obj) => {
            addItems.push({
                'catalog_id': obj.catalogId,
                type: obj.category,
                outfit_id: outfitId,
            });
        });
        await this.knex("user_outfit_avatar").insert(addItems);
    }
    async addColorsToOutfit(outfitId, HeadRGB, LegRGB, TorsoRGB) {
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
    async multiAddItemsToAvatar(avatarRequest) {
        const addItems = [];
        avatarRequest.forEach((obj) => {
            addItems.push({
                userid: obj.userId,
                'catalog_id': obj.catalogId,
                type: obj.category,
                date: this.moment().format('YYYY-MM-DD HH:mm:ss'),
            });
        });
        await this.knex("user_avatar").insert(addItems);
    }
    async addAvatarColors(UserId, HeadRGB, LegRGB, TorsoRGB) {
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
    async deleteAvatar(userId) {
        await this.knex("user_avatar").delete().where({ "userid": userId });
    }
    async deleteAvatarCatalogId(userId, catalogId) {
        await this.knex("user_avatar").delete().where({ "userid": userId, 'catalog_id': catalogId });
    }
    async deleteAvatarColoring(userId) {
        await this.knex("user_avatarcolor").delete().where({ "userid": userId });
    }
    async addAvatarUrl(userId, url) {
        await this.knex("thumbnails").insert({
            "reference_id": userId,
            "type": Thumbnail.Type.UserThumb,
            "url": url,
        });
    }
    async deletedOldAvatarUrl(userId) {
        await this.knex("thumbnails").delete().where({ "reference_id": userId, "type": Thumbnail.Type.UserThumb });
    }
    async renderAvatar(type, jsonArray) {
        const url = config_1.default.render.url;
        const jsonString = jsonArray;
        if (type === 'item') {
            type = 'avatar';
        }
        const request = await axios_1.default.post(url + '?key=' + config_1.default.render.key + "&type=" + type + "&id=" + jsonArray.UserId, jsonString, {});
        let body = request.data;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            }
            catch {
            }
        }
        console.log(request.status, request.statusText);
        console.log(request.data);
        if (typeof body === 'string' || body.error || body.success === false || body.image == null) {
            throw Error('No url was specified in body.');
        }
        return body.image;
    }
    async getThumbnailHashUrl(thumbnailJson) {
        const hash = this.createThumbnailHash(thumbnailJson);
        const result = await this.knex("thumbnail_hashes").select("id as thumbnailHashId", "url", "date_created as dateCreated").where({ 'hash': hash }).limit(1).orderBy('id', 'desc');
        if (!result[0]) {
            return;
        }
        if (this.moment().isSameOrAfter(this.moment(result[0]['dateCreated']).add(1, 'years'))) {
            return;
        }
        return result[0]['url'];
    }
    async recordThumbnailHash(thumbnailJson, url) {
        const hash = this.createThumbnailHash(thumbnailJson);
        await this.knex("thumbnail_hashes").insert({
            'hash': hash,
            'url': url,
            'date_created': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }
    createThumbnailHash(thumbnailJson) {
        const jsonString = JSON.parse(JSON.stringify(thumbnailJson));
        jsonString.UserId = 0;
        return crypto.createHash('sha256').update(JSON.stringify(jsonString)).digest('hex');
    }
    async canUserModifyAvatar(userId) {
        const latestModification = await this.knex("user_avatar").select("date").where({ "userid": userId }).orderBy("id", "desc").limit(1);
        if (!latestModification || !latestModification[0]) {
            return true;
        }
        return this.moment().isSameOrAfter(this.moment(latestModification[0]["date"]).add(15, "seconds"));
    }
    async generateAvatarFromModels(userId, avatarColors, avatar) {
        const avatarObject = {
            UserId: userId,
            Hats: [],
            Face: false,
            Gear: false,
            Torso: [
                avatarColors[0].torsor / 255,
                avatarColors[0].torsog / 255,
                avatarColors[0].torsob / 255,
            ],
            Head: [
                avatarColors[0].headr / 255,
                avatarColors[0].headg / 255,
                avatarColors[0].headb / 255,
            ],
            Leg: [
                avatarColors[0].legr / 255,
                avatarColors[0].legg / 255,
                avatarColors[0].legb / 255,
            ],
            TShirt: false,
            Shirt: false,
            Pants: false,
        };
        for (const obj of avatar) {
            if (obj.type === Catalog.category.Hat) {
                avatarObject.Hats.push(obj.catalogId);
            }
            else if (obj.type === Catalog.category.Faces) {
                avatarObject.Face = obj.catalogId;
            }
            else if (obj.type === Catalog.category.Gear) {
                avatarObject.Gear = true;
                avatarObject.Hats.push(obj.catalogId);
            }
            else if (obj.type === Catalog.category.Shirt) {
                avatarObject.Shirt = obj.catalogId;
            }
            else if (obj.type === Catalog.category.Pants) {
                avatarObject.Pants = obj.catalogId;
            }
            else if (obj.type === Catalog.category.TShirt) {
                avatarObject.TShirt = obj.catalogId;
            }
        }
        return avatarObject;
    }
    setupAvatarUpdateListener(userId) {
        return new Promise((resolve, reject) => {
            let discon = false;
            const listener = ioredis_pubsub_1.default();
            listener.on('connect', async () => {
                await listener.subscribe('AvatarUpdate' + userId);
            });
            listener.on('message', (channel, message) => {
                if (channel === 'AvatarUpdate' + userId) {
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
    async publishAvatarUpdateFinished(userId, url) {
        return new Promise((resolve, reject) => {
            const listener = ioredis_pubsub_1.default();
            listener.on('connect', async () => {
                await listener.publish('AvatarUpdate' + userId, url);
                listener.disconnect();
                resolve();
            });
        });
    }
}
exports.default = AvatarDAL;

