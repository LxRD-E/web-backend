/**
 * Imports
 */
// Express
// Errors
/// import CatalogError from './error';
// models
import * as model from '../../models/models';
import { filterOffset, filterId } from '../../helpers/Filter';
/// import {invalidParam} from '../../middleware/paramsvalidate';
// Autoload
import { Controller, Get, PathParams, QueryParams, BodyParams, Required, Res, Patch, UseBeforeEach, UseBefore, Locals, Post, Put } from '@tsed/common';
import controller from '../controller';
import { Summary, Description } from '@tsed/swagger';
import { csrf } from '../../dal/auth';
import { YesAuth } from '../../middleware/Auth';
import { MultipartFile } from '@tsed/multipartfiles';
/**
 * Catalog Controller
 */
@Controller('/catalog')
export class CatalogController extends controller {
    constructor() {
        super();
    }
    /**
     * Get a catalog item's Info
     * @param id Catalog Item's ID
     */
    @Get('/:catalogId/info')
    @Summary('Get catalog item info by catalogId')
    public async getInfo(
        @Required()
        @PathParams('catalogId', Number) id: number
    ): Promise<model.catalog.CatalogInfo> {
        try {
            const CatalogInfo = await this.catalog.getInfo(id);
            return CatalogInfo;
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
    }

    @Get('/:catalogId/thumbnail/redirect')
    @Summary('Get catalog item thumbnail and redirect to url. Will redirect to placeholder if invalid catalogId or not available')
    public async getSoloThumbnailAndRedirect(
        @Res() res: Res,
        @Required()
        @PathParams('catalogId', Number) id: number
    ) {
        // Filter Catalog ID
        if (!id) {
            return res.redirect("https://cdn.hindigamer.club/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
        const thumbnail = await this.catalog.getThumbnailById(id);
        if (!thumbnail) {
            return res.redirect("https://cdn.hindigamer.club/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
        return res.redirect(thumbnail.url);
    }

    @Get('/:catalogId/thumbnail')
    @Summary('Get catalog item thumbnail model')
    public async getSoloThumbnail(
        @Required()
        @PathParams('catalogId', Number) id: number
    ) {
        // Filter Catalog ID
        if (!id) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const thumbnail = await this.catalog.getThumbnailById(id);
        return thumbnail;
    }

    /**
     * Multi-Get Catalog Thumbnails at once
     * @param ids CSV of IDs
     */
    @Get('/thumbnails')
    @Summary('Multi-get thumbnails by catalogId')
    public async multiGetThumbnails(
        @Required()
        @QueryParams('ids', String) ids: string
    ): Promise<model.catalog.ThumbnailResponse[]> {
        // Convert CSV to array
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds: Array<number> = [];
        idsArray.forEach((id) => {
            const userId = filterId(id) as number;
            if (userId) {
                filteredIds.push(userId);
            }
        });
        // Remove duplcates
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25 || safeIds.length < 1) {
            throw new this.BadRequest('TooManyIds');
        }
        const thumbnails = await this.catalog.multiGetThumbnailsFromIds(safeIds);
        return thumbnails;
    }

    /**
     * Get Names of Multiple Catalog Items at once. Invalid users are filtered out
     * @param ids CSV of User IDs
     */
    @Get('/names')
    @Summary('Multi-get catalog item names by catalogId')
    @Description('Invalid IDs will be filtered out')
    public async MultiGetNames(
        @Required()
        @QueryParams('ids', String) ids: string
    ): Promise<model.catalog.MultiGetNames[]> {
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds: Array<number> = [];
        let allIdsValid = true;
        idsArray.forEach((id) => {
            const catalogId = filterId(id) as number;
            if (!catalogId) {
                allIdsValid = false
            }
            filteredIds.push(catalogId);
        });
        if (!allIdsValid) {
            throw new this.BadRequest('InvalidIds');
        }
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25) {
            throw new this.BadRequest('TooManyIds');
        }
        let result = await this.catalog.MultiGetNamesFromIds(safeIds);
        return result;
    }


    /**
     * Search the Catalog
     * @param offset 
     * @param category 
     * @param orderBy 
     * @param orderByType 
     * @param query Optional search query
     */
    @Get('/')
    @Summary('Search the catalog')
    public async searchCatalog(
        @QueryParams('offset', Number) offset: number,
        @QueryParams('category', Number) category: number,
        @QueryParams('orderBy', String) orderBy: string = 'id',
        @QueryParams('orderByType', String) orderByType: string = 'desc',
        @QueryParams('q', String) query?: string
    ): Promise<model.catalog.SearchResults[]> {
        if (orderBy !== "id" && orderBy !== "price") {
            throw new this.BadRequest('InvalidOrderBy');
        }
        if (orderByType !== "desc" && orderByType !== "asc") {
            throw new this.BadRequest('InvalidOrderByType');
        }
        const goodCategory = filterId(category) as number;
        let categoryEnum: model.catalog.searchCategory | model.catalog.category;
        if (goodCategory === model.catalog.searchCategory.Any || goodCategory === model.catalog.searchCategory.Collectibles || goodCategory === model.catalog.searchCategory.Featured) {
            categoryEnum = goodCategory;
        } else if (Object.values(model.catalog.category).includes(goodCategory)) {
            categoryEnum = goodCategory;
        } else {
            throw new this.BadRequest('InvalidCategory');
        }
        let SearchResults = await this.catalog.getCatalog(offset, categoryEnum, orderBy, orderByType, query);
        if (category === model.catalog.searchCategory.Collectibles) {
            let arrayOfCatalogIds: number[] = [];
            for (const item of SearchResults) {
                item.currency = model.economy.currencyType.primary;
                arrayOfCatalogIds.push(item.catalogId);
            }
            let lowestPrices = await this.catalog.getLowestPriceOfCollectibleCatalogItems(arrayOfCatalogIds);
            for (const item of lowestPrices) {
                for (const result of SearchResults) {
                    if (result.catalogId === item.catalogId) {
                        result.price = item.price;
                        break;
                    }
                }
            }
        }
        return SearchResults;
    }

    /**
     * Update a Catalog Item
     * @param catalogId Catalog Item ID
     */
    @Patch('/:catalogId/info')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateItemInfo(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('catalogId', Number) catalogId: number,
        @BodyParams('name', String) newName: string,
        @BodyParams('description', String) newDescription: string,
        @BodyParams('isForSale', Number) isForSale: number,
        @BodyParams('price', Number) newPrice: number,
        @BodyParams('currency', Number) currency: number,
        @BodyParams('stock', Number) stock: number,
        @BodyParams('collectible', Number) collectible: number,
        @BodyParams('moderation', Number) moderation: number
    ) {
        // Confirm is creator and/or has perms
        let CatalogInfo;
        try {
            CatalogInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'creatorId', 'creatorType', 'status']);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (CatalogInfo.status !== model.catalog.moderatorStatus.Ready && userInfo.staff < 1) {
            throw new this.BadRequest('InvalidModerationStatus');
        }
        if (userInfo.staff >= 2) {
            // idk yet
        } else if (CatalogInfo.creatorType === model.catalog.creatorType.User) {
            if (CatalogInfo.creatorId !== userInfo.userId) {
                throw new this.BadRequest('InvalidPermissions');
            }
        } else if (CatalogInfo.creatorType === model.catalog.creatorType.Group) {
            const groupRole = await this.group.getUserRole(CatalogInfo.creatorId, userInfo.userId);
            if (groupRole.permissions.manage === 0) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        // String
        if (newName.length > 32 || newName.length < 3) {
            // Too long
            throw new this.BadRequest('InvalidCatalogName');
        }
        // String
        if (newDescription.length > 256) {
            // Too long
            throw new this.BadRequest('InvalidCatalogDescription');
        }
        if (isForSale !== 1 && isForSale !== 0) {
            throw new this.BadRequest('InvalidIsForSaleOption');
        }
        if (!newPrice) {
            newPrice = 0;
        }
        if (newPrice > 1000000) {
            throw new this.BadRequest('ConstraintPriceTooHigh');
        }
        if (!currency) {
            currency = model.economy.currencyType.secondary;
        }
        if (currency !== model.economy.currencyType.primary && currency !== model.economy.currencyType.secondary) {
            throw new this.BadRequest('InvalidCurrency');
        }
        let newStock = 0;
        let newCollectible = model.catalog.collectible.false;
        let moderationStatus = CatalogInfo.status;
        if (userInfo.staff >= 2) {
            newStock = filterId(stock) as number;
            if (!newStock) {
                newStock = 0;
            }
            newCollectible = collectible;
            if (collectible !== 1 && collectible !== 0) {
                throw new this.BadRequest('InvalidCollectibleState');
            }
            const newModerationStatus = moderation;
            if (newModerationStatus !== model.catalog.moderatorStatus.Moderated && newModerationStatus !== model.catalog.moderatorStatus.Pending && newModerationStatus !== model.catalog.moderatorStatus.Ready) {
                // Invalid moderation status
                throw new this.BadRequest('InvalidModerationStatus');
            }
            moderationStatus = newModerationStatus;
        }
        await this.catalog.updateCatalogItemInfo(catalogId, newName, newDescription, newPrice, currency, newStock, newCollectible, isForSale, moderationStatus);
        return { success: true };
    }


    /**
     * Get the owners of a Catalog Item
     * @param catalogId Catalog ID
     * @param offset Offset
     */
    @Get('/:catalogId/owners')
    @Summary('Get owners of a catalog item')
    public async getOwners(
        @PathParams('catalogId', Number) catalogId: number,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('sort', String) sort: any = 'desc'
    ): Promise<model.user.FullUserInventory[]> {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const owners = await this.catalog.getOwners(catalogId, offset, limit, sort);
        return owners;
    }


    /**
     * Get recommended Catalog Items based off an existing Catalog ID
     * @param catalogId Catalog Item ID to base recommendations on
     */
    @Get('/:catalogId/recommended')
    @Summary('Get similar catalog items based off {catalogId}')
    public async getRecommended(
        @PathParams('catalogId', Number) catalogId: number,
    ): Promise<model.catalog.SearchResults[]> {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        // Grab recommendations
        const recommended = await this.catalog.getRecommended(catalogId);
        return recommended;
    }


    /**
     * Get Comments of a catalog item
     * @param catalogId Catalog Item ID to get comments for
     */
    @Get('/:catalogId/comments')
    @Summary('Get comments posted to a catalogItem')
    public async getComments(
        @PathParams('catalogId', Number) catalogId: number,
        @QueryParams('offset', Number) offset: number = 0
    ) {
        // Verify item exists
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        // Filter Offset
        const numericOffset = filterOffset(offset);
        // Grab Comments
        const Comments = await this.catalog.getComments(catalogId, numericOffset);
        return Comments;
    }

    /**
     * Create a Comment on a Catalog Item
     */
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Post('/:catalogId/comment')
    @Summary('Create a comment for a catalog item')
    public async createComment(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('catalogId', Number) catalogId: number,
        @Required()
        @BodyParams('comment', String) comment: string,
    ) {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (comment.length > 250 || comment.length < 3) {
            throw new this.BadRequest('InvalidComment');
        }
        await this.catalog.createComment(catalogId, userInfo.userId, comment);
        return { success: true };
    }

    /**
     * Get Charts for a Collectible Catalog Item
     * @param catalogId Catalog ID
     */
    @Summary('Get charts for a collectible catalog item')
    @Get('/:catalogId/charts')
    public async getCharts(
        @PathParams('catalogId', Number) catalogId: number,
    ): Promise<model.catalog.ChartData[]> {
        // Verify item exists
        try {
            const itemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'collectible']);
            if (itemInfo.collectible !== model.catalog.collectible.true) {
                throw false;
            }
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        // Grab Charts
        const charts = await this.catalog.getCharts(catalogId);
        return charts;
    }

    /**
     * 
     * @param catalogId Catalog Item ID
     * @param offset Offset
     */
    @Get('/:catalogId/sellers')
    @Summary('Get sellers of a collectible catalog item')
    public async getSellers(
        @PathParams('catalogId', Number) catalogId: number,
        @QueryParams('offset', Number) offset: number = 0
    ): Promise<{ total: number; sellers: model.user.FullUserInventory[] }> {
        // Verify item exists
        try {
            const itemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'collectible']);
            if (itemInfo.collectible !== model.catalog.collectible.true) {
                throw false;
            }
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const itemsForSale = await this.catalog.getSellers(catalogId, offset);
        const totalSellers = await this.catalog.countSellers(catalogId);
        return {
            total: totalSellers,
            sellers: itemsForSale,
        };
    }


    /**
     * Update an item's files. This endpoint is restricted for staff use only
     */
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Patch('/:catalogId/files')
    public async updateItemFiles(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('catalogId', Number) catalogId: number,
        @MultipartFile() uploadedFiles: Express.Multer.File[]
    ) {
        if (userInfo.staff < 1) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let category;
        try {
            const catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'category']);
            category = catalogData.category;
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        // Files
        const files = await this.catalog.sortFileUploads(uploadedFiles);
        // Verify Files were Uploaded
        if (files.jpg === false && files.png === false && files.mtl === false && files.obj === false) {
            throw new this.BadRequest('NoFileSpecified');
        }
        // Upload File(s)
        // Clear Old Assets
        await this.catalog.deleteAssociatedCatalogAssets(catalogId);
        // Upload New Ones
        if (files.obj) {
            await this.catalog.upload('obj', catalogId, files.obj as Buffer);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.OBJ, catalogId.toString(), 'obj');
        }
        if (files.png) {
            await this.catalog.upload('png', catalogId, files.png as Buffer);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'png');
        }
        if (files.jpg) {
            await this.catalog.upload('jpg', catalogId, files.jpg as Buffer);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'jpg');
        }
        if (files.mtl) {
            if (files.png) {
                await this.catalog.upload('mtl', catalogId, files.mtl as Buffer, true);
            } else {
                await this.catalog.upload('mtl', catalogId, files.mtl as Buffer);
            }
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.MTL, catalogId.toString(), 'mtl');
        }
        (async (): Promise<void> => {
            // Begin Background Render
            try {
                let url;
                const json = await this.catalog.generateAvatarJsonFromCatalogIds(catalogId, [catalogId]);
                if (category === model.catalog.category.Gear) {
                    url = await this.avatar.renderAvatar('item', json);
                } else if (category === model.catalog.category.Hat) {
                    url = await this.avatar.renderAvatar('item', json);
                } else {
                    // Generate Thumb
                    url = await this.avatar.renderAvatar('avatar', json);
                }
                // Delete Old Thumb
                await this.catalog.deleteThumbnail(catalogId);
                // Upload/Save thumb
                await this.catalog.uploadThumbnail(catalogId, url);
            } catch (e) {
                console.log(e);
            }
        })();
        // Return Success
        return { success: true, id: catalogId };
    }



    /**
     * Force a Catalog Item's Thumbnail to be Regenernated
     * @param catalogId 
     */
    @Put('/:catalogId/thumbnail/regenerate')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async forceThumbnailRegen(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('catalogId', Number) catalogId: number
    ): Promise<{ success: true }> {
        let category;
        try {
            const catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'category']);
            category = catalogData.category;
        } catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const userData = userInfo;
        if (userData.staff < 1) {
            throw new this.BadRequest('InvalidPermissions');
        }
        const regenAvatar = async () => {
            try {
                const json = await this.catalog.generateAvatarJsonFromCatalogIds(catalogId, [catalogId]);
                if (!json) {
                    throw new Error('No Category specified or invalid');
                }
                let url;
                if (category === model.catalog.category.Gear) {
                    url = await this.avatar.renderAvatar('item', json);
                } else if (category === model.catalog.category.Hat) {
                    url = await this.avatar.renderAvatar('item', json);
                } else if (category === model.catalog.category.GroupIcon) {
                    url = await this.avatar.renderAvatar('group', json);
                } else {
                    // Generate Thumb
                    url = await this.avatar.renderAvatar('avatar', json);
                }
                // Delete Old Thumb
                await this.catalog.deleteThumbnail(catalogId);
                // Upload/Save thumb
                await this.catalog.uploadThumbnail(catalogId, url);
            } catch (e) {
                console.log(e);
            }
        }
        regenAvatar().then().catch(e => {
            console.error(e);
        });
        // Give OK
        return { success: true };
    }


    /**
     * Create a Catalog Item
     * @param uploadAsStaff Upload the item as System?
     */
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Summary('Create a catalog item')
    @Post('/create')
    public async create(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @MultipartFile() uploadedFiles: Express.Multer.File[],
        @BodyParams('uploadAsStaff', String) uploadAsStaff: string,
        @BodyParams('category', Number) category: number,
        @BodyParams('isForSale', Number) isForSale: number,
        @BodyParams('price', Number) price: number,
        @BodyParams('currency', Number) currency: number,
        @BodyParams('name', String) name: string,
        @BodyParams('description', String) description: string,
        @BodyParams('groupId') groupId?: string,
        @BodyParams('is_collectible') isCollectible?: string,
        @BodyParams('stock') stock?: string
    ): Promise<{ success: true; id: number }> {
        let staffMode = false;
        if (userInfo.staff >= 2 && uploadAsStaff === "true") {
            staffMode = true;
        }
        // Files
        let files;
        if (staffMode) {
            files = await this.catalog.sortFileUploads(uploadedFiles, 15 * 1024 * 1024);
        } else {
            files = await this.catalog.sortFileUploads(uploadedFiles);
            // Disallow OBJ/MTL Uploads for Non-Staff
            if (files.obj !== false) {
                throw new this.BadRequest('InvalidOBJSpecified');
            }
            if (files.mtl !== false) {
                throw new this.BadRequest('InvalidMTLSpecified');
            }
        }
        // Verify Files were Uploaded
        if (files.jpg === false && files.png === false && files.mtl === false && files.obj === false) {
            throw new this.BadRequest('NoFileSpecified');
        }
        // Verify category is correct
        if (category !== model.catalog.category.Faces && category !== model.catalog.category.Pants && category !== model.catalog.category.Shirt && category !== model.catalog.category.TShirt) {
            if (!staffMode) {
                throw new this.BadRequest('InvalidCategory');
            } else {
                if (model.catalog.category[category] === undefined) {
                    throw new this.BadRequest('InvalidCategory');
                }
            }
        }
        // Setup Meta Info (price, description, name, etc)
        if (!isForSale) {
            price = 0;
            currency = model.economy.currencyType.secondary;
        } else {
            if (isNaN(price)) {
                throw new this.BadRequest('InvalidPrice');
            }
            if (currency !== model.economy.currencyType.primary && currency !== model.economy.currencyType.secondary) {
                throw new this.BadRequest('InvalidCurrency');
            }
            if (price > 1000000) {
                throw new this.BadRequest('ConstraintPriceTooHigh');
            }
            if (price < 0) {
                price = 0;
            }
        }
        if (name.length > 32 || name.length < 3) {
            // Too long
            throw new this.BadRequest('InvalidCatalogName');
        }
        if (description.length > 256) {
            // Too long
            throw new this.BadRequest('InvalidCatalogDescription');
        }
        // Check if uploading for group
        const groupUpload = filterId(groupId) as number;
        if (groupUpload) {
            // Make sure group exists and isnt locked
            const groupInfo = await this.group.getInfo(groupUpload);
            if (groupInfo.groupStatus === model.group.groupStatus.locked) {
                throw new this.BadRequest('InvalidPermissions');
            }
            const role = await this.group.getUserRole(groupUpload, userInfo.userId);
            // Doesn't have perms for upload
            if (role.permissions.manage !== 1) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        // Insert Item into DB
        let moderationStatus = model.catalog.moderatorStatus.Pending;
        let collectible = model.catalog.collectible.false;
        let maxSales = 0;
        let creatorId = userInfo.userId;
        if (staffMode) {
            creatorId = 1;
            if (isCollectible) {
                collectible = parseInt(isCollectible, 10);
            }
            if (stock) {
                maxSales = parseInt(stock, 10);
            }
            // Default for all staff uploads
            moderationStatus = model.catalog.moderatorStatus.Ready;
        }
        let catalogId;
        if (groupUpload && !staffMode) {
            catalogId = await this.catalog.createGroupItem(groupUpload, creatorId, name, description, isForSale, category, price, currency, collectible, maxSales, moderationStatus);
        } else {
            catalogId = await this.catalog.createUserItem(creatorId, name, description, isForSale, category, price, currency, collectible, maxSales, moderationStatus);
        }
        if (!staffMode) {
            // disabled so users can buy their own stuff (for whatever reason...)
            // await this.catalog.createItemForUserInventory(userInfo.userId, catalogId);
        }
        // Upload File(s)
        if (files.obj) {
            await this.catalog.upload('obj', catalogId, files.obj as Buffer);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.OBJ, catalogId.toString(), 'obj');
        }
        if (files.png) {
            await this.catalog.upload('png', catalogId, files.png as Buffer);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'png');
        }
        if (files.jpg) {
            await this.catalog.upload('jpg', catalogId, files.jpg as Buffer);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'jpg');
        }
        if (files.mtl) {
            if (files.png) {
                await this.catalog.upload('mtl', catalogId, files.mtl as Buffer, true);
            } else {
                await this.catalog.upload('mtl', catalogId, files.mtl as Buffer);
            }
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.MTL, catalogId.toString(), 'mtl');
        }
        const backgroundRender = async () => {
            // Begin Background Render
            try {
                const json = await this.catalog.generateAvatarJsonFromCatalogIds(catalogId, [catalogId]);
                let url;
                if (category === model.catalog.category.Gear) {
                    url = await this.avatar.renderAvatar('item', json);
                } else if (category === model.catalog.category.Hat) {
                    url = await this.avatar.renderAvatar('item', json);
                } else {
                    // Generate Thumb
                    url = await this.avatar.renderAvatar('avatar', json);
                }
                // Upload/Save thumb
                await this.catalog.uploadThumbnail(catalogId, url);
            } catch (e) {
                console.log(e);
            }
        }
        backgroundRender().then().catch(e => {
            console.error(e);
        });
        // Return Success
        return { success: true, id: catalogId };
    }

    private temporarilyDisabledCatalogMethods = `
    public async getItemTexture(catalogId: number): Promise<string> {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId','category']);
        }catch(e) {
            throw invalidParam('id');
        }
        // Grab and return
        try {
            const texture = await this.catalog.getAsset(catalogId+".png");
            return texture;
        }catch(e) {
            throw CatalogError(0);
        }
    }

    public async getItemObj(catalogId: number): Promise<string> {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId','category']);
        }catch(e) {
            throw invalidParam('id');
        }
        // Grab and return
        try {
            const file = await this.catalog.getAsset(catalogId+".obj");
            const editedString = file.toString().replace(/mtllib.+/g, 'mtllib '+catalogId+"/mtl.mtl");
            // Set Type
            return editedString;
        }catch(e) {
            throw CatalogError(0);
        }
    }

    public async getItemMtl(catalogId: number): Promise<string> {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId','category']);
        }catch(e) {
            throw invalidParam('id');
        }
        // Grab and return
        try {
            const file = await this.catalog.getAsset(catalogId+".mtl");
            let editedString = file.toString().replace(/map_Kd.+/g, 'map_Kd '+catalogId+"/texture");
            editedString = editedString.toString().replace(/map_Ka.+/g, 'map_Ka '+catalogId+"/texture");
            editedString = editedString.toString().replace(/map_d.+/g, 'map_d '+catalogId+"/texture");
            return editedString;
        }catch(e) {
            throw CatalogError(0);
        }
    }
    `;
}