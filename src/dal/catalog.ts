/**
 * Imports
 */
import * as model from '../models/models';
import config from '../helpers/config';
// node stuff
import fs = require('fs');
import fileType = require('file-type');
import aws = require('aws-sdk');
// dal parent
import _init from './_init';

/**
 * Catalog Data Access Layer
 */

/*
If I call the function like this:
getInfo(['id']);

The return type should be:
{ "id": number }


And if I call it like this:
getInfo(['id','name']);

The return type should be:
{ "id": number; name: string; }

Is this possible?

interface IResponse {
    id: number;
    name: string;
}
const getInfo = <T>(arg: Array<'id'|'name'> = ['id']) => {
    let data = {
        'id': 1,
        'name': 'Hello',
    };
    let newObject: any = {};
    if (arg.includes('id')) {
        newObject['id'] = data['id'];
    }
    if (arg.includes('name')) {
        newObject['name'] = data['name'];
    }
    return newObject;
}
let data = getInfo(['id']);
*/


class CatalogDAL extends _init {
    /**
     * Get the info of a catalogId
     */
    public async getInfo<catalogIdType, columnsType, forUpdateType>(
        id: number,
        specificColumns: Array<'catalogId' | 'catalogName' | 'description' | 'price' | 'averagePrice' | 'dateCreated' | 'currency' | 'category' | 'collectible' | 'maxSales' | 'forSale' | 'status' | 'creatorId' | 'creatorType' | 'userId'> = ['catalogId', 'catalogName', 'description', 'price', 'averagePrice', 'forSale', 'maxSales', 'collectible', 'status', 'creatorId', 'creatorType', 'userId'],
        forUpdate?: string[]
    ): Promise<model.catalog.CatalogInfo> {
        specificColumns.forEach((element: string, index: number, array: Array<string>): void => {
            if (element === 'catalogId') {
                array[index] = 'id as catalogId';
            } else if (element === 'catalogName') {
                array[index] = 'name as catalogName';
            } else if (element === 'averagePrice') {
                array[index] = 'average_price as averagePrice';
            } else if (element === 'dateCreated') {
                array[index] = 'date_created as dateCreated';
            } else if (element === 'collectible') {
                array[index] = 'is_collectible as collectible';
            } else if (element === 'maxSales') {
                array[index] = 'max_sales as maxSales';
            } else if (element === 'forSale') {
                array[index] = 'is_for_sale as forSale';
            } else if (element === 'status') {
                array[index] = 'is_pending as status';
            } else if (element === 'userId') {
                array[index] = 'original_creatorid as userId';
            } else if (element === 'creatorId') {
                array[index] = 'creator as creatorId';
            } else if (element === 'creatorType') {
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

    /**
     * Count the sales a catalog item has
     * @param id Catalog ID
     */
    public async countSales(id: number): Promise<number> {
        const data = await this.knex("user_inventory").count("id as Total").where({ "catalog_id": id });
        return data[0]["Total"] as number;
    }

    /**
     * Get Multiple Thumbnails of Catalog Items from their ID
     * @param ids Array of Catalog IDs
     */
    public async multiGetThumbnailsFromIds(ids: Array<number>): Promise<Array<model.catalog.ThumbnailResponse>> {
        const query = this.knex('thumbnails').select('thumbnails.url', 'thumbnails.reference_id as catalogId').innerJoin('catalog', 'catalog.id', 'thumbnails.reference_id');
        ids.forEach((id) => {
            query.orWhere({
                'thumbnails.reference_id': id,
                'thumbnails.type': 'catalog',
                'catalog.is_pending': model.catalog.moderatorStatus.Ready
            });
        });
        const thumbnails = await query;
        return thumbnails as Array<model.catalog.ThumbnailResponse>;
    }

    /**
     * Get Usernames from an Array of IDs
     * @param ids Array of IDs
     */
    public async MultiGetNamesFromIds(ids: Array<number>): Promise<Array<model.catalog.MultiGetNames>> {
        const query = this.knex('catalog').select('name as catalogName', 'id as catalogId');
        ids.forEach((id) => {
            query.orWhere({ 'catalog.id': id });
        });
        const usernames = await query;
        return usernames as Array<model.catalog.MultiGetNames>;
    }

    /**
     * Get a catalog item's thumbnail from their ID
     * @param id User ID
     */
    public async getThumbnailById(id: number): Promise<model.catalog.ThumbnailResponse> {
        const thumbnail = await this.knex('thumbnails').select('thumbnails.url', 'thumbnails.reference_id as catalogId', 'thumbnails.id as thumbnailId').where({
            'thumbnails.reference_id': id,
            'thumbnails.type': 'catalog',
            'catalog.is_pending': model.catalog.moderatorStatus.Ready
        }).innerJoin('catalog', 'catalog.id', 'thumbnails.reference_id').orderBy('thumbnails.id', 'desc').limit(1);
        return thumbnail[0] as model.catalog.ThumbnailResponse;
    }

    /**
     * Count items for sale that are not free
     */
    public async countAllItemsForSale(): Promise<number> {
        // Filter Sort
        const count = await this.knex("catalog").count('id as Total').where({ 'catalog.is_for_sale': model.catalog.isForSale.true }).andWhere('catalog.price', '>', 0);
        return count[0]['Total'] as number;
    }

    /**
     * Search for an item in the catalog
     * @param offset
     * @param category
     * @param orderBy
     * @param orderByType
     * @param query Optional. Query
     */
    public async getCatalog(offset: number, limit: number, category: model.catalog.searchCategory | model.catalog.category, orderBy: 'price' | 'id', orderByType: 'desc' | 'asc', query?: string): Promise<model.catalog.SearchResults[]> {
        // Filter Sort
        const selectQuery = this.knex("catalog").select("catalog.id as catalogId", "catalog.name as catalogName", "catalog.price", "catalog.currency", "catalog.creator as creatorId", "catalog.creator_type as creatorType", "catalog.original_creatorid as userId", "catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(limit).offset(offset).orderBy(orderBy, orderByType);
        if (category === model.catalog.searchCategory.Any) {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.true,
                "is_pending": model.catalog.moderatorStatus.Ready
            });
        } else if (category === model.catalog.searchCategory.Featured) {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.true,
                "is_pending": model.catalog.moderatorStatus.Ready,
                'catalog.original_creatorid': 1,
                'catalog.creator_type': model.catalog.creatorType.User
            });
        } else if (category === model.catalog.searchCategory.Collectibles) {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.false,
                "is_pending": model.catalog.moderatorStatus.Ready,
                "is_collectible": model.catalog.collectible.true
            });
            selectQuery.select('catalog.average_price as averagePrice')
        } else {
            selectQuery.where({
                "is_for_sale": model.catalog.isForSale.true,
                "is_pending": model.catalog.moderatorStatus.Ready,
                "category": category
            });
        }
        // Add optional search query
        if (query) {
            selectQuery.andWhere("name", "like", "%" + query + "%");
        }
        const catalogResults = await selectQuery;
        return catalogResults as model.catalog.SearchResults[];
    }

    /**
     * Given an array of catalogIds, this method will return a model.catalog.LowestPriceCollectibleItems[] containing the lowest sales price
     * of each catalogId. If there is no lowest price (i.e. nobody is selling it), then the price will be set as "null"
     * @param catalogIds
     */
    public async getLowestPriceOfCollectibleCatalogItems(catalogIds: number[]): Promise<model.catalog.LowestPriceCollectibleItems[]> {
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
            } else {
                queryCompleted.push({ catalogId: catalogId, price: null });
            }
        }
        return queryCompleted;
    }

    /**
     * Update a catalog item's info
     * @param catalogId Catalog Item's ID
     */
    public async updateCatalogItemInfo(catalogId: number, name: string, description: string, price: number, currency: model.economy.currencyType, stock: number, collectible: model.catalog.collectible, isForSale: model.catalog.isForSale, moderation: model.catalog.moderatorStatus, newCategory: model.catalog.category): Promise<void> {
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

    /**
     * Get Owners of a Catalog Item
     * @param catalogId Catalog ID
     */
    public async getOwners(catalogId: number, offset: number, limit: number, orderBy: 'asc' | 'desc'): Promise<model.user.FullUserInventory[]> {
        const owners = await this.knex('user_inventory').where({ 'user_inventory.catalog_id': catalogId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'user_inventory.user_id as userId').orderBy('user_inventory.id', orderBy).limit(limit).offset(offset);
        return owners as model.user.FullUserInventory[];
    }

    /**
     * Get 6 recommendations based off an asset
     * @param catalogId Catalog Item ID
     */
    public async getRecommended(catalogId: number): Promise<model.catalog.SearchResults[]> {
        const itemData = await this.getInfo(catalogId, ['creatorId', 'creatorType']);
        const recommended = await this.knex("catalog").select("catalog.id as catalogId", "catalog.name as catalogName", "catalog.price", "catalog.currency", "catalog.creator as creatorId", "catalog.creator_type as creatorType", "catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(6).where({
            "creator": itemData.creatorId,
            "creator_type": itemData.creatorType
        }).orderBy('id', 'desc').andWhere("catalog.id", "!=", catalogId).andWhere({
            'is_pending': model.catalog.moderatorStatus.Ready,
            'is_for_sale': model.catalog.isForSale.true,
        });
        return recommended as model.catalog.SearchResults[];
    }

    /**
     * Get an item's Comments
     * @param catalogId Catalog ID
     */
    public async getComments(catalogId: number, offset: number): Promise<model.catalog.Comments[]> {
        const Comments = await this.knex("catalog_comments").select("id as commentId", "catalog_id as catalogId", "userid as userId", "date", "comment").where({
            "catalog_id": catalogId,
            'is_deleted': 0
        }).limit(25).offset(offset).orderBy('id', 'desc');
        return Comments as model.catalog.Comments[];
    }

    /**
     * Get an item's charts
     * @param catalogId Catalog Item ID
     */
    public async getCharts(catalogId: number): Promise<model.catalog.ChartData[]> {
        const time = this.moment().subtract(365, 'days').format('YYYY-MM-DD HH:mm:ss');
        const transactions = await this.knex("transactions").where("catalogid", "=", catalogId).andWhere("amount", "<", 0).andWhere("currency", "=", 1).andWhere("date", ">", time).andWhere("transactions.userid_from", "!=", 1).select("transactions.amount", "transactions.date");
        transactions.forEach((k) => {
            // Remove Decimals & convert negative to positive
            k["amount"] = Math.abs(k["amount"]);
        });
        return transactions as model.catalog.ChartData[];
    }

    /**
     * Calculate an Item's Average Sale Price
     * @param catalogId
     * @param currentAveragePrice
     * @param salePrice
     */
    public async calculateAveragePrice(catalogId: number, currentAveragePrice: number, salePrice: number): Promise<number> {
        /*
        const time = this.moment().subtract(360, 'days').format('YYYY-MM-DD HH:mm:ss');
        const transactions = await this.knex("transactions").where("catalogid", "=", catalogId).andWhere("amount", "<", 0).andWhere("currency", "=", 1).andWhere("date", ">", time).andWhere("transactions.userid_from", "!=", 1).select("transactions.amount","transactions.date");
        let averagePrice = 0;
        transactions.forEach((k) => {
            // Remove Decimals & convert negative to positive
            averagePrice += Math.abs(k["amount"]);
        });
        averagePrice = Math.floor(averagePrice / transactions.length);

         */
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
        } else {
            return Math.ceil(currentAveragePrice * .9) + (salePrice * .1);
        }
    }

    /**
     * Update an item's Cached Average Price
     * @param catalogId
     * @param value
     */
    public async setAveragePrice(catalogId: number, value: number): Promise<void> {
        await this.knex('catalog').update({
            'average_price': value,
        }).where({ 'id': catalogId });
    }

    /**
     * Get Sellers of a Catalog Item
     * @param catalogId Catalog Item ID
     * @param offset Offset
     */
    public async getSellers(catalogId: number, offset: number): Promise<model.user.FullUserInventory[]> {
        const items = await this.knex('user_inventory').where({ 'user_inventory.catalog_id': catalogId }).andWhere('user_inventory.price', ">", 0).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'user_inventory.user_id as userId').orderBy('user_inventory.price', 'asc').limit(25).offset(offset);
        return items as model.user.FullUserInventory[];
    }

    /**
     * Count the number of users selling an item
     * @param catalogId Catalog ID
     */
    public async countSellers(catalogId: number): Promise<number> {
        const items = await this.knex('user_inventory').where({ 'user_inventory.catalog_id': catalogId }).andWhere('user_inventory.price', ">", 0).count('id as Total').orderBy('user_inventory.price', 'asc');
        if (!items || !items[0]) {
            return 0;
        }
        return items[0]["Total"] as number;
    }

    /**
     * Create an asset for a Catalog Item
     * @param catalogId
     * @param creatorId
     * @param assetType
     * @param fileName
     * @param fileType
     */
    public async createCatalogAsset(catalogId: number, creatorId: number, assetType: model.catalog.assetType, fileName: string, fileType: 'png' | 'jpg' | 'obj' | 'mtl'): Promise<void> {
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

    /**
     * Delete all associated catalog assets to an item
     * @param catalogId
     */
    public async deleteAssociatedCatalogAssets(catalogId: number): Promise<void> {
        await this.knex('catalog_assets').delete().where({
            'catalogid': catalogId,
        });
    }

    /**
     * Get Asset(s) for a Catalog Item. Will throw error if no assets exist
     * @param catalogId
     */
    public async getCatalogItemAssets(catalogId: number): Promise<model.catalog.CatalogAssetItem[]> {
        const assets = await this.knex('catalog_assets').select('id as assetId', 'date_created as dateCreated', 'assettype as assetType', 'filename as fileName', 'filetype as fileType').where({ 'catalogid': catalogId });
        if (!assets[0]) {
            throw new Error('This item (' + catalogId + ') does not contain any assets');
        }
        return assets;
    }

    /**
     * Delete a Specific Asset
     * @param assetId
     */
    public async deleteAsset(assetId: number): Promise<void> {
        await this.knex('catalog_assets').delete().where({ 'id': assetId }).limit(1);
    }

    /**
     * Create a Catalog Item. Returns Catalog ID of created item
     * @param userId Creator's User ID
     * @param name Item's Name
     * @param description
     * @param isForSale
     * @param category
     * @param price
     * @param currency
     * @param isCollectible is the item collectible?
     * @param maxSales If the item is a unique collectible, how many sales can it have before it goes off sale?
     * @param moderationStatus
     */
    public async createUserItem(userId: number, name: string, description: string, isForSale: model.catalog.isForSale, category: model.catalog.category, price: number, currency: model.economy.currencyType, isCollectible: model.catalog.collectible, maxSales = 0, moderationStatus = model.catalog.moderatorStatus.Pending): Promise<number> {
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
        return id[0] as number;
    }

    /**
     * Create a Catalog Item for a Group. Returns Catalog ID of created item
     * @param groupId Group's ID
     * @param userId Creator's User ID
     * @param name Item's Name
     * @param description
     * @param isForSale
     * @param category
     * @param price
     * @param isCollectible is the item collectible?
     * @param maxSales If the item is a unique collectible, how many sales can it have before it goes offsale?
     */
    public async createGroupItem(groupId: number, userId: number, name: string, description: string, isForSale: model.catalog.isForSale, category: model.catalog.category, price: number, currency: model.economy.currencyType, isCollectible: model.catalog.collectible, maxSales = 0, moderationStatus = model.catalog.moderatorStatus.Pending): Promise<number> {
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
        return id[0] as number;
    }

    /**
     * Create an Item for a user. Returns the inventory id
     * @param userId User's ID
     * @param catalogId Catalog Item ID
     */
    public async createItemForUserInventory(userId: number, catalogId: number, serial?: null | number): Promise<number> {
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
        return itemId[0] as number;
    }

    /**
     * Upload a file to the CDN
     * @param type The Type of the File
     * @param assetId The Catalog Asset ID
     * @param fileBuffer A Buffer Containing the File. Don't perform any encoding on this
     * @param fixMtlTextures Fix Textures for MTL file to match catalogid
     * @param fixMtlType PNG or JPG
     */
    public upload(type: 'png' | 'jpg' | 'obj' | 'mtl' | 'gif', assetId: number, fileBuffer: Buffer, fixMtlTextures = false, fixMtlType: 'png' | 'jpg' = 'png'): Promise<void> {
        return new Promise((resolve, reject): void => {
            let meta = 'text/plain';
            if (type === 'png') {
                meta = 'image/png';
            } else if (type === 'jpg') {
                meta = 'image/jpg';
            }

            function cont(): void {
                const s3 = new aws.S3({
                    endpoint: config.aws.endpoint,
                    accessKeyId: config.aws.accessKeyId,
                    secretAccessKey: config.aws.secretAccessKey,
                });
                s3.putObject({
                    Bucket: config.aws.buckets.assets,
                    Key: assetId.toString() + '.' + type,
                    Body: fileBuffer,
                    ACL: 'public-read',
                    ContentType: meta,
                    CacheControl: 'public, max-age=31536000',
                }, function (err, data) {
                    if (err) {
                        console.log(err);
                        reject(err)
                    } else {
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
            /*
            if (type === 'jpg') {
                Jimp.read(fileBuffer).then(photo => {
                    file().then((o) => {
                        photo.writeAsync(o.path+'.png').then(() => {
                            fs.readFile(o.path+'.png', function(err, data) {
                                if (err) {
                                    return reject(err);
                                }
                                fileBuffer = data;
                                type = 'png';
                                o.cleanup().then(cont).catch(reject);
                            });
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
                
            }else{
                cont();
            }
            */
        });
        /*
        return new Promise((resolve, reject): void => {
            let fileString = "";
            if (type === 'png' || type === 'jpg') {
                fileString = fileBuffer.toString('base64');
            }else{
                fileString = fileBuffer.toString();
            }
            const options = {
                hostname: config.cdn.host,
                port: config.cdn.port,
                path: '/upload.php?key=' + config.cdn.key + "&type="+type+"&doPhpValidation="+fixMtlTextures+"&name="+catalogId,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(fileString),
                },
            };
            let uploadLib;
            if (config.cdn.tls) {
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
                    reject(err);
                });
                res.on('close', () => {
                    resolve();
                });
            });
            req.write(fileString);
            req.end();
        });
        */
    }

    /**
     * Upload a Catalog Item's Thumbnail URL
     * @param catalogId Catalog Item ID
     * @param url URL
     */
    public async uploadThumbnail(catalogId: number, url: string): Promise<void> {
        await this.knex("thumbnails").insert({
            "reference_id": catalogId,
            "type": model.thumbnails.Type.ItemThumb,
            "url": url,
            "date": this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Delete Thumbnail(s) for a specific catalog item
     * @param catalogId Catalog Item
     */
    public async deleteThumbnail(catalogId: number): Promise<void> {
        await this.knex("thumbnails").delete().where({
            "reference_id": catalogId,
            "type": model.thumbnails.Type.ItemThumb,
        });
    }

    /**
     * Update an item's isForSale status
     * @param catalogId Catalog ID
     * @param newValue
     */
    public async updateIsForSale(catalogId: number, newValue: model.catalog.isForSale): Promise<void> {
        await this.knex("catalog").update({
            "catalog.is_for_sale": newValue,
        }).where({ "id": catalogId }).limit(1);
    }

    /**
     * Update an item's Moderation Status
     * @param catalogId Catalog ID
     * @param newValue
     */
    public async updateModerationStatus(catalogId: number, newValue: model.catalog.moderatorStatus): Promise<void> {
        await this.knex("catalog").update({
            "catalog.is_pending": newValue,
        }).where({ "id": catalogId }).limit(1);
    }

    /**
     * Delete an item a user owns via the User Inventory ID
     * @param userInventoryId User Inventory ID
     */
    public async deleteUserInventoryId(userInventoryId: number): Promise<void> {
        await this.knex("user_inventory").delete().where({
            "id": userInventoryId,
        });
    }

    /**
     * Get User Inventory Item Details by it's userInventoryId
     * @param userInventoryId Item ID
     */
    public async getItemByUserInventoryId(userInventoryId: number, forUpdate?: string[]): Promise<model.user.FullUserInventory> {
        let query = this.knex('user_inventory').where({ 'user_inventory.id': userInventoryId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'user_inventory.user_id as userId').orderBy('user_inventory.price', 'asc').limit(1);
        if (forUpdate) {
            query = query.forUpdate(forUpdate);
        }
        const items = await query;
        if (!items[0]) {
            throw false;
        }
        return items[0] as model.user.FullUserInventory;
    }

    /**
     * Update a User Inventory Item ID's Owner
     * @param userInventoryId
     * @param userId
     */
    public async updateUserInventoryIdOwner(userInventoryId: number, userId: number): Promise<void> {
        await this.knex('user_inventory').update({ 'user_id': userId }).where({ 'id': userInventoryId });
    }

    /**
     * Create a Comment on a Catalog Item
     * @param catalogId
     * @param userId
     * @param comment
     */
    public async createComment(catalogId: number, userId: number, comment: string): Promise<void> {
        await this.knex('catalog_comments').insert({
            'catalog_id': catalogId,
            'userid': userId,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'comment': comment,
        });
    }

    /**
     * Get a Comment on a Catalog Item
     */
    public async getComment(catalogId: number, commentId: number): Promise<model.catalog.CatalogItemComment> {
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

    /**
     * Delete a Comment on a Catalog Item
     */
    public async deleteComment(catalogId: number, commentId: number): Promise<void> {
        await this.knex('catalog_comments').delete().where({
            'id': commentId,
            'is_deleted': 1,
        }).limit(1);
    }

    private addBuffersIfNotExists(uploadedFiles: any[], maxFileSize: number): Promise<void> {
        return new Promise((res, rej) => {
            const scanFile = async (file: any) => {
                let buffer = file['buffer'];
                if (typeof buffer === 'undefined') {
                    let newBuffer = await new Promise((res, rej) => {
                        fs.readFile(file.path, (err, data) => {
                            res(data);
                        });
                    });
                    file['buffer'] = newBuffer;
                }
            }
            let promises = [];
            for (const file of uploadedFiles) {
                if (file.size > maxFileSize) {
                    continue; // silent skip
                }
                promises.push(scanFile(file));
            }
            Promise.all(promises).then(() => {
                res();
            }).catch(e => rej);
        });
    }

    public async sortFilesSimple(uploadedFiles: any[], maxFileSize = 5 * 1024 * 1024): Promise<model.catalog.ISortFilesResults[]> {
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

    /**
     * Sort File Uploads. Returns object of files
     * @param files
     * @param maxFileSize Max size of file(s), in bytes
     */
    public async sortFileUploads(uploadedFiles: any, maxFileSize = 5 * 1024 * 1024): Promise<model.catalog.FilesInterface> {
        await this.addBuffersIfNotExists(uploadedFiles, maxFileSize);

        interface UploadedFile {
            fieldname: string;
            size: number;
            buffer?: Buffer;
        }

        const files = {
            png: false,
            jpg: false,
            obj: false,
            mtl: false,
        } as model.catalog.FilesInterface;
        for (const file of uploadedFiles as UploadedFile[]) {
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
            } else {
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

    /**
     * Get an asset's contents. Resolves with buffer of contents
     * @param itemString Full item name with file extension. Examples: 1.png, 1.jpg, 1.mtl, 1.obj, etc
     */
    public getAsset(itemString: string): Promise<string> {
        console.log(itemString);
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config.aws.endpoint,
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            });
            s3.getObject({
                Bucket: config.aws.buckets.assets,
                Key: itemString,
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err)
                } else {
                    console.log(data.Body);
                    if (data.Body) {
                        resolve(data.Body as unknown as string);
                    } else {
                        reject(new Error('Invalid Asset Returned'));
                    }
                }
            });
        });
        /*
        return new Promise((resolve, reject): void => {
            const dataString = new Stream.Transform();
            const options = {
                hostname: config.cdn.host,
                port: config.cdn.port,
                path: '/render/froast_hats/'+itemString,
                method: 'GET',
                headers: {
                    'authorization': config.cdn.getKey
                },
            };
            let uploadLib;
            if (config.cdn.tls) {
                uploadLib = https;
            } else {
                uploadLib = http;
            }
            // let dataString = "";
            const req = uploadLib.request(options, (res) => {
                res.on('data', (d) => {
                    dataString.push(d);
                });
                res.on('error', (err) => {
                    reject(err);
                });
                res.on('close', () => {
                    try {
                        if (res.statusCode !== 200) {
                            reject();
                        }else{
                            resolve(dataString.read());
                        }
                    } catch (e) {
                        reject();
                    }
                });
            });
            req.end();
        });
        */
    }

    /**
     * Generate a Avatar JSON to send to backend from parameters. Default color is 255,255,255
     * @param userIdOrCatalogId The UserID or Catalog ID. You can also use Date.now() if desired
     * @param catalogIds The Array of Hat, Gear, Shirt, Pants, or Face Catalog IDs
     * @param LegRGB The Leg RGB Array. Max len is 3
     * @param HeadRGB The Head RGB Array. Max len is 3
     * @param TorsoRGB The TorsoRGB RGB Array. Max len is 3
     */
    public async generateAvatarJsonFromCatalogIds(userIdOrCatalogId: number, catalogIds: number[], LegRGB = [255, 255, 255], HeadRGB = [255, 255, 255], TorsoRGB = [255, 255, 255]): Promise<model.avatar.JsonArrayInterfaceWithAssets> {
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
        const object: model.avatar.JsonArrayInterfaceWithAssets = {
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
                object.Character = {}
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
            } else if (catalogInfo.category === model.catalog.category.Shirt) {
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
            } else if (catalogInfo.category === model.catalog.category.Faces) {
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
            } else if (catalogInfo.category === model.catalog.category.Pants) {
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
            } else {
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
        /// console.log(JSON.stringify(object));
        return object;
    }
}

export default CatalogDAL;
