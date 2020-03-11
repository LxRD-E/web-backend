"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_pubsub_1 = require("../helpers/ioredis_pubsub");
const axios_1 = require("axios");
const Thumbnail = require("../models/v1/thumnails");
const Catalog = require("../models/v1/catalog");
const config_1 = require("../helpers/config");
const crypto = require("crypto");
const _init_1 = require("./_init");
class AvatarDAL extends _init_1.default {
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
        console.log(request.data);
        console.log(request.statusText);
        console.log(request.status);
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
        console.log(JSON.stringify(thumbnailJson));
        const jsonString = JSON.parse(JSON.stringify(thumbnailJson));
        jsonString.UserId = 0;
        const hash = crypto.createHash('sha256').update(JSON.stringify(jsonString)).digest('hex');
        return hash;
    }
    async canUserModifyAvatar(userId) {
        const latestModification = await this.knex("user_avatar").select("date").where({ "userid": userId }).orderBy("id", "desc").limit(1);
        if (!latestModification || !latestModification[0]) {
            return true;
        }
        if (this.moment().isSameOrAfter(this.moment(latestModification[0]["date"]).add(30, "seconds"))) {
            return true;
        }
        return false;
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

