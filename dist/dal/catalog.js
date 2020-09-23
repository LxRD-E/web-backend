"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../models/models");
const config_1 = require("../helpers/config");
const fs = require("fs");
const fileType = require("file-type");
const aws = require("aws-sdk");
const _init_1 = require("./_init");
class CatalogDAL extends _init_1.default {
    async getInfo(id, specificColumns = ['catalogId', 'catalogName', 'description', 'price', 'averagePrice', 'forSale', 'maxSales', 'collectible', 'status', 'creatorId', 'creatorType', 'userId'], forUpdate) {
        specificColumns.forEach((element, index, array) => {
            if (element === 'catalogId') {
                array[index] = 'id as catalogId';
            }
            else if (element === 'catalogName') {
                array[index] = 'name as catalogName';
            }
            else if (element === 'averagePrice') {
                array[index] = 'average_price as averagePrice';
            }
            else if (element === 'dateCreated') {
                array[index] = 'date_created as dateCreated';
            }
            else if (element === 'collectible') {
                array[index] = 'is_collectible as collectible';
            }
            else if (element === 'maxSales') {
                array[index] = 'max_sales as maxSales';
            }
            else if (element === 'forSale') {
                array[index] = 'is_for_sale as forSale';
            }
            else if (element === 'status') {
                array[index] = 'is_pending as status';
            }
            else if (element === 'userId') {
                array[index] = 'original_creatorid as userId';
            }
            else if (element === 'creatorId') {
                array[index] = 'creator as creatorId';
            }
            else if (element === 'creatorType') {
                array[index] = 'creator_type as creatorType';
            }
        });
        let query = this.knex('catalog').select(specificColumns).where({ 'catalog.id': id });
        if (forUpdate) {
            query = query.forUpdate(forUpdate);
        }
        const CatalogInfo = await query;
        if (!CatalogInfo[0]) {
            throw false;
        }
        return CatalogInfo[0];
    }
    async countSales(id) {
        const data = await this.knex("user_inventory").count("id as Total").where({ "catalog_id": id });
        return data[0]["Total"];
    }
    async multiGetThumbnailsFromIds(ids) {
        const query = this.knex('thumbnails').select('thumbnails.url', 'thumbnails.reference_id as catalogId').innerJoin('catalog', 'catalog.id', 'thumbnails.reference_id');
        ids.forEach((id) => {
            query.orWhere({
                'thumbnails.reference_id': id,
                'thumbnails.type': 'catalog',
                'catalog.is_pending': model.catalog.moderatorStatus.Ready
            });
        });
        const thumbnails = await query;
        return thumbnails;
    }
    async MultiGetNamesFromIds(ids) {
        const query = this.knex('catalog').select('name as catalogName', 'id as catalogId');
        ids.forEach((id) => {
            query.orWhere({ 'catalog.id': id });
        });
        const usernames = await query;
        return usernames;
    }
    async getThumbnailById(id) {
        const thumbnail = await this.knex('thumbnails').select('thumbnails.url', 'thumbnails.reference_id as catalogId', 'thumbnails.id as thumbnailId').where({
            'thumbnails.reference_id': id,
            'thumbnails.type': 'catalog',
            'catalog.is_pending': model.catalog.moderatorStatus.Ready
        }).innerJoin('catalog', 'catalog.id', 'thumbnails.reference_id').orderBy('thumbnails.id', 'desc').limit(1);
        return thumbnail[0];
    }
    async countAllItemsForSale() {
        const count = await this.knex("catalog").count('id as Total').where({ 'catalog.is_for_sale': model.catalog.isForSale.true }).andWhere('catalog.price', '>', 0);
        return count[0]['Total'];
    }
    async getCatalog(offset, limit, category, orderBy, orderByType, query) {
        const selectQuery = this.knex("catalog").select("catalog.id as catalogId", "catalog.name as catalogName", "catalog.price", "catalog.currency", "catalog.creator as creatorId", "catalog.creator_type as creatorType", "catalog.original_creatorid as userId", "catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(limit).offset(offset).orderBy(orderBy, orderByType);
        if (category === model.catalog.searchCategory.Any) {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.true,
                "is_pending": model.catalog.moderatorStatus.Ready
            });
        }
        else if (category === model.catalog.searchCategory.Featured) {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.true,
                "is_pending": model.catalog.moderatorStatus.Ready,
                'catalog.original_creatorid': 1,
                'catalog.creator_type': model.catalog.creatorType.User
            });
        }
        else if (category === model.catalog.searchCategory.Collectibles) {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.false,
                "is_pending": model.catalog.moderatorStatus.Ready,
                "is_collectible": model.catalog.collectible.true
            });
            selectQuery.select('catalog.average_price as averagePrice');
        }
        else {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.true,
                "is_pending": model.catalog.moderatorStatus.Ready,
                "category": category
            });
        }
        if (query) {
            selectQuery.andWhere("name", "like", "%" + query + "%");
        }
        const catalogResults = await selectQuery;
        return catalogResults;
    }
    async getLowestPriceOfCollectibleCatalogItems(catalogIds) {
        let lowestPriceQuery = this.knex('user_inventory').select('catalog_id as catalogId', 'price').orderBy('price', 'desc');
        for (const item of catalogIds) {
            lowestPriceQuery = lowestPriceQuery.orWhere('catalog_id', '=', item).andWhere('price', '>', 0);
        }
        let queryCompleted = await lowestPriceQuery;
        for (const catalogId of catalogIds) {
            let good = false;
            for (const completed of queryCompleted) {
                if (completed.catalogId === catalogId) {
                    good = true;
                }
            }
            if (good) {
                continue;
            }
            else {
                queryCompleted.push({ catalogId: catalogId, price: null });
            }
        }
        return queryCompleted;
    }
    async updateCatalogItemInfo(catalogId, name, description, price, currency, stock, collectible, isForSale, moderation, newCategory) {
        await this.knex("catalog").update({
            "name": name,
            "description": description,
            "price": price,
            "currency": currency,
            "max_sales": stock,
            "is_collectible": collectible,
            "is_for_sale": isForSale,
            "is_pending": moderation,
            'category': newCategory,
        }).where({ "id": catalogId }).limit(1);
    }
    async getOwners(catalogId, offset, limit, orderBy) {
        const owners = await this.knex('user_inventory').where({ 'user_inventory.catalog_id': catalogId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'user_inventory.user_id as userId').orderBy('user_inventory.id', orderBy).limit(limit).offset(offset);
        return owners;
    }
    async getRecommended(catalogId) {
        const itemData = await this.getInfo(catalogId, ['creatorId', 'creatorType']);
        const recommended = await this.knex("catalog").select("catalog.id as catalogId", "catalog.name as catalogName", "catalog.price", "catalog.currency", "catalog.creator as creatorId", "catalog.creator_type as creatorType", "catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(6).where({
            "creator": itemData.creatorId,
            "creator_type": itemData.creatorType
        }).orderBy('id', 'desc').andWhere("catalog.id", "!=", catalogId).andWhere({
            'is_pending': model.catalog.moderatorStatus.Ready,
            'is_for_sale': model.catalog.isForSale.true,
        });
        return recommended;
    }
    async getComments(catalogId, offset) {
        const Comments = await this.knex("catalog_comments").select("id as commentId", "catalog_id as catalogId", "userid as userId", "date", "comment").where({
            "catalog_id": catalogId,
            'is_deleted': 0
        }).limit(25).offset(offset).orderBy('id', 'desc');
        return Comments;
    }
    async getCharts(catalogId) {
        const time = this.moment().subtract(365, 'days').format('YYYY-MM-DD HH:mm:ss');
        const transactions = await this.knex("transactions").where("catalogid", "=", catalogId).andWhere("amount", "<", 0).andWhere("currency", "=", 1).andWhere("date", ">", time).andWhere("transactions.userid_from", "!=", 1).select("transactions.amount", "transactions.date");
        transactions.forEach((k) => {
            k["amount"] = Math.abs(k["amount"]);
        });
        return transactions;
    }
    async calculateAveragePrice(catalogId, currentAveragePrice, salePrice) {
        if (salePrice <= 0) {
            return 0;
        }
        if (currentAveragePrice == salePrice) {
            return currentAveragePrice;
        }
        if (currentAveragePrice <= 0) {
            return salePrice;
        }
        if (currentAveragePrice > salePrice) {
            return Math.floor(currentAveragePrice * .9) + (salePrice * .1);
        }
        else {
            return Math.ceil(currentAveragePrice * .9) + (salePrice * .1);
        }
    }
    async setAveragePrice(catalogId, value) {
        await this.knex('catalog').update({
            'average_price': value,
        }).where({ 'id': catalogId });
    }
    async getSellers(catalogId, offset) {
        const items = await this.knex('user_inventory').where({ 'user_inventory.catalog_id': catalogId }).andWhere('user_inventory.price', ">", 0).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'user_inventory.user_id as userId').orderBy('user_inventory.price', 'asc').limit(25).offset(offset);
        return items;
    }
    async countSellers(catalogId) {
        const items = await this.knex('user_inventory').where({ 'user_inventory.catalog_id': catalogId }).andWhere('user_inventory.price', ">", 0).count('id as Total').orderBy('user_inventory.price', 'asc');
        if (!items || !items[0]) {
            return 0;
        }
        return items[0]["Total"];
    }
    async createCatalogAsset(catalogId, creatorId, assetType, fileName, fileType) {
        const creatorType = model.catalog.creatorType.User;
        await this.knex('catalog_assets').insert({
            'creatorid': creatorId,
            'creatortype': creatorType,
            'date_created': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'assettype': assetType,
            'filename': fileName,
            'filetype': fileType,
            'catalogid': catalogId,
        });
    }
    async deleteAssociatedCatalogAssets(catalogId) {
        await this.knex('catalog_assets').delete().where({
            'catalogid': catalogId,
        });
    }
    async getCatalogItemAssets(catalogId) {
        const assets = await this.knex('catalog_assets').select('id as assetId', 'date_created as dateCreated', 'assettype as assetType', 'filename as fileName', 'filetype as fileType').where({ 'catalogid': catalogId });
        if (!assets[0]) {
            throw new Error('This item (' + catalogId + ') does not contain any assets');
        }
        return assets;
    }
    async deleteAsset(assetId) {
        await this.knex('catalog_assets').delete().where({ 'id': assetId }).limit(1);
    }
    async createUserItem(userId, name, description, isForSale, category, price, currency, isCollectible, maxSales = 0, moderationStatus = model.catalog.moderatorStatus.Pending) {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const id = await this.knex("catalog").insert({
            "name": name,
            "description": description,
            "price": price,
            "average_price": 0,
            "date_created": date,
            "currency": currency,
            "category": category,
            "creator": userId,
            "creator_type": model.catalog.creatorType.User,
            "is_collectible": isCollectible,
            "max_sales": maxSales,
            "is_for_sale": isForSale,
            "is_pending": moderationStatus,
            "original_creatorid": userId,
        });
        return id[0];
    }
    async createGroupItem(groupId, userId, name, description, isForSale, category, price, currency, isCollectible, maxSales = 0, moderationStatus = model.catalog.moderatorStatus.Pending) {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const id = await this.knex("catalog").insert({
            "name": name,
            "description": description,
            "price": price,
            "average_price": 0,
            "date_created": date,
            "currency": currency,
            "category": category,
            "creator": groupId,
            "creator_type": model.catalog.creatorType.Group,
            "is_collectible": isCollectible,
            "max_sales": maxSales,
            "is_for_sale": isForSale,
            "is_pending": moderationStatus,
            "original_creatorid": userId,
        });
        return id[0];
    }
    async createItemForUserInventory(userId, catalogId, serial) {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        if (serial === undefined) {
            serial = null;
        }
        const itemId = await this.knex("user_inventory").insert({
            "serial": serial,
            "catalog_id": catalogId,
            "user_id": userId,
            "price": 0,
            "date_created": date,
        });
        return itemId[0];
    }
    upload(type, assetId, fileBuffer, fixMtlTextures = false, fixMtlType = 'png') {
        return new Promise((resolve, reject) => {
            let meta = 'text/plain';
            if (type === 'png') {
                meta = 'image/png';
            }
            else if (type === 'jpg') {
                meta = 'image/jpg';
            }
            function cont() {
                const s3 = new aws.S3({
                    endpoint: config_1.default.aws.endpoint,
                    accessKeyId: config_1.default.aws.accessKeyId,
                    secretAccessKey: config_1.default.aws.secretAccessKey,
                });
                s3.putObject({
                    Bucket: config_1.default.aws.buckets.assets,
                    Key: assetId.toString() + '.' + type,
                    Body: fileBuffer,
                    ACL: 'public-read',
                    ContentType: meta,
                    CacheControl: 'public, max-age=31536000',
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    }
                    else {
                        resolve();
                    }
                });
            }
            if (fixMtlTextures) {
                if (type !== 'mtl') {
                    return reject('Cannot use fixMtlTextures with a type that is not OBJ');
                }
                let fileAsString = fileBuffer.toString();
                fileAsString = fileAsString.toString().replace(/map_Kd.+/g, 'map_Kd ' + assetId + "." + fixMtlType);
                fileAsString = fileAsString.toString().replace(/map_Ka.+/g, 'map_Ka ' + assetId + "." + fixMtlType);
                fileAsString = fileAsString.toString().replace(/map_d.+/g, 'map_d ' + assetId + "." + fixMtlType);
                fileBuffer = Buffer.from(fileAsString);
            }
            cont();
        });
    }
    async uploadThumbnail(catalogId, url) {
        await this.knex("thumbnails").insert({
            "reference_id": catalogId,
            "type": model.thumbnails.Type.ItemThumb,
            "url": url,
            "date": this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }
    async deleteThumbnail(catalogId) {
        await this.knex("thumbnails").delete().where({
            "reference_id": catalogId,
            "type": model.thumbnails.Type.ItemThumb,
        });
    }
    async updateIsForSale(catalogId, newValue) {
        await this.knex("catalog").update({
            "catalog.is_for_sale": newValue,
        }).where({ "id": catalogId }).limit(1);
    }
    async updateModerationStatus(catalogId, newValue) {
        await this.knex("catalog").update({
            "catalog.is_pending": newValue,
        }).where({ "id": catalogId }).limit(1);
    }
    async deleteUserInventoryId(userInventoryId) {
        await this.knex("user_inventory").delete().where({
            "id": userInventoryId,
        });
    }
    async getItemByUserInventoryId(userInventoryId, forUpdate) {
        let query = this.knex('user_inventory').where({ 'user_inventory.id': userInventoryId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'user_inventory.user_id as userId').orderBy('user_inventory.price', 'asc').limit(1);
        if (forUpdate) {
            query = query.forUpdate(forUpdate);
        }
        const items = await query;
        if (!items[0]) {
            throw false;
        }
        return items[0];
    }
    async updateUserInventoryIdOwner(userInventoryId, userId) {
        await this.knex('user_inventory').update({ 'user_id': userId }).where({ 'id': userInventoryId });
    }
    async createComment(catalogId, userId, comment) {
        await this.knex('catalog_comments').insert({
            'catalog_id': catalogId,
            'userid': userId,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'comment': comment,
        });
    }
    async getComment(catalogId, commentId) {
        let comment = await this.knex('catalog_comments').select('userid as userId', 'date', 'comment', 'is_deleted as isDeleted').where({
            'id': commentId
        }).limit(1);
        if (!comment[0]) {
            throw new Error('InvalidCommentId');
        }
        if (comment[0] && comment[0].catalogId !== catalogId) {
            throw new Error('InvalidCommentId');
        }
        return comment[0];
    }
    async deleteComment(catalogId, commentId) {
        await this.knex('catalog_comments').delete().where({
            'id': commentId,
            'is_deleted': 1,
        }).limit(1);
    }
    addBuffersIfNotExists(uploadedFiles, maxFileSize) {
        return new Promise((res, rej) => {
            const scanFile = async (file) => {
                let buffer = file['buffer'];
                if (typeof buffer === 'undefined') {
                    let newBuffer = await new Promise((res, rej) => {
                        fs.readFile(file.path, (err, data) => {
                            res(data);
                        });
                    });
                    file['buffer'] = newBuffer;
                }
            };
            let promises = [];
            for (const file of uploadedFiles) {
                if (file.size > maxFileSize) {
                    continue;
                }
                promises.push(scanFile(file));
            }
            Promise.all(promises).then(() => {
                res();
            }).catch(e => rej);
        });
    }
    async sortFilesSimple(uploadedFiles, maxFileSize = 5 * 1024 * 1024) {
        await this.addBuffersIfNotExists(uploadedFiles, maxFileSize);
        let returnArr = [];
        for (const file of uploadedFiles) {
            if (!file || !file.buffer) {
                continue;
            }
            if (file.size > maxFileSize) {
                continue;
            }
            let type = await fileType.fromBuffer(file.buffer);
            if (typeof type !== "undefined") {
                file.trueMime = type.mime;
                if (type.mime === "image/png") {
                    file.extension = 'png';
                }
                if (type.mime === "image/jpeg") {
                    file.extension = 'jpg';
                }
                if (type.mime === "image/gif") {
                    file.extension = 'gif';
                }
                returnArr.push(file);
            }
        }
        return returnArr;
    }
    async sortFileUploads(uploadedFiles, maxFileSize = 5 * 1024 * 1024) {
        await this.addBuffersIfNotExists(uploadedFiles, maxFileSize);
        const files = {
            png: false,
            jpg: false,
            obj: false,
            mtl: false,
        };
        for (const file of uploadedFiles) {
            if (!file || !file.buffer) {
                continue;
            }
            if (file.size > maxFileSize) {
                continue;
            }
            let type = await fileType.fromBuffer(file.buffer);
            if (typeof type !== "undefined") {
                if (type.mime === "image/png") {
                    files.png = file.buffer;
                }
                if (type.mime === "image/jpeg") {
                    files.jpg = file.buffer;
                }
            }
            else {
                if (file.fieldname === "obj") {
                    files.obj = file.buffer;
                }
                if (file.fieldname === "mtl") {
                    files.mtl = file.buffer;
                }
            }
        }
        return files;
    }
    getAsset(itemString) {
        console.log(itemString);
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config_1.default.aws.endpoint,
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            });
            s3.getObject({
                Bucket: config_1.default.aws.buckets.assets,
                Key: itemString,
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    console.log(data.Body);
                    if (data.Body) {
                        resolve(data.Body);
                    }
                    else {
                        reject(new Error('Invalid Asset Returned'));
                    }
                }
            });
        });
    }
    async generateAvatarJsonFromCatalogIds(userIdOrCatalogId, catalogIds, LegRGB = [255, 255, 255], HeadRGB = [255, 255, 255], TorsoRGB = [255, 255, 255]) {
        if (LegRGB.length !== 3) {
            throw new Error('LegRGB is not length of 3');
        }
        if (HeadRGB.length !== 3) {
            throw new Error('HeadRGB is not length of 3');
        }
        if (TorsoRGB.length !== 3) {
            throw new Error('TorsoRGB is not length of 3');
        }
        LegRGB.forEach((value, index, arr) => {
            if (value < 0 || value > 255) {
                throw new Error('LegRGB Values must be between 1 and 255');
            }
            arr[index] = arr[index] / 255;
        });
        HeadRGB.forEach((value, index, arr) => {
            if (value < 0 || value > 255) {
                throw new Error('HeadRGB Values must be between 1 and 255');
            }
            arr[index] = arr[index] / 255;
        });
        TorsoRGB.forEach((value, index, arr) => {
            if (value < 0 || value > 255) {
                throw new Error('TorsoRGB Values must be between 1 and 255');
            }
            arr[index] = arr[index] / 255;
        });
        const object = {
            Head: HeadRGB,
            Leg: LegRGB,
            Torso: TorsoRGB,
            UserId: userIdOrCatalogId,
            Face: false,
            Hats: {
                Texture: [],
                OBJ: [],
                MTL: [],
            },
            Gear: false,
            TShirt: false,
            Shirt: false,
            Pants: false,
            Character: {},
        };
        for (const hat of catalogIds) {
            const catalogInfo = await this.getInfo(hat, ['category']);
            if (catalogInfo.category === model.catalog.category.Gear) {
                object.Gear = true;
            }
            if (!object.Character) {
                object.Character = {};
            }
            if (catalogInfo.category === model.catalog.category.Head) {
                if (object.Character.Head) {
                    continue;
                }
            }
            if (catalogInfo.category === model.catalog.category.TShirt) {
                const assets = await this.getCatalogItemAssets(hat);
                for (const asset of assets) {
                    switch (asset.assetType) {
                        case model.catalog.assetType.Texture: {
                            object.TShirt = { Texture: [] };
                            object.TShirt.Texture.push(asset.fileName + '.' + asset.fileType);
                            break;
                        }
                    }
                }
            }
            else if (catalogInfo.category === model.catalog.category.Shirt) {
                const assets = await this.getCatalogItemAssets(hat);
                for (const asset of assets) {
                    switch (asset.assetType) {
                        case model.catalog.assetType.Texture: {
                            object.Shirt = { Texture: [] };
                            object.Shirt.Texture.push(asset.fileName + '.' + asset.fileType);
                            break;
                        }
                    }
                }
            }
            else if (catalogInfo.category === model.catalog.category.Faces) {
                const assets = await this.getCatalogItemAssets(hat);
                for (const asset of assets) {
                    switch (asset.assetType) {
                        case model.catalog.assetType.Texture: {
                            if (asset.fileType === 'jpg') {
                                break;
                            }
                            object.Face = { Texture: [] };
                            object.Face.Texture.push(asset.fileName + '.' + asset.fileType);
                            break;
                        }
                    }
                }
            }
            else if (catalogInfo.category === model.catalog.category.Pants) {
                const assets = await this.getCatalogItemAssets(hat);
                for (const asset of assets) {
                    switch (asset.assetType) {
                        case model.catalog.assetType.Texture: {
                            object.Pants = { Texture: [] };
                            object.Pants.Texture.push(asset.fileName + '.' + asset.fileType);
                            break;
                        }
                    }
                }
            }
            else {
                const assets = await this.getCatalogItemAssets(hat);
                for (const asset of assets) {
                    switch (asset.assetType) {
                        case model.catalog.assetType.MTL: {
                            object.Hats.MTL.push(asset.fileName + '.' + asset.fileType);
                            break;
                        }
                        case model.catalog.assetType.OBJ: {
                            object.Hats.OBJ.push(asset.fileName + '.' + asset.fileType);
                            break;
                        }
                        case model.catalog.assetType.Texture: {
                            object.Hats.Texture.push(asset.fileName + '.' + asset.fileType);
                            break;
                        }
                    }
                }
            }
        }
        return object;
    }
}
exports.default = CatalogDAL;

