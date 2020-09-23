"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../../models/models");
const Filter_1 = require("../../helpers/Filter");
const common_1 = require("@tsed/common");
const controller_1 = require("../controller");
const swagger_1 = require("@tsed/swagger");
const auth_1 = require("../../dal/auth");
const Auth_1 = require("../../middleware/Auth");
const multipartfiles_1 = require("@tsed/multipartfiles");
let CatalogController = class CatalogController extends controller_1.default {
    constructor() {
        super();
        this.temporarilyDisabledCatalogMethods = `
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
    async countAllItems() {
        const total = await this.catalog.countAllItemsForSale();
        return {
            total,
        };
    }
    async getInfo(id) {
        try {
            return await this.catalog.getInfo(id, [
                'catalogId',
                'catalogName',
                'description',
                'price',
                'averagePrice',
                'forSale',
                'maxSales',
                'collectible',
                'status',
                'creatorId',
                'creatorType',
                'userId',
                'category',
                'dateCreated',
                'currency',
            ]);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
    }
    getCategories() {
        return model.catalog.category;
    }
    async getSoloThumbnailAndRedirect(res, id) {
        if (!id) {
            return res.redirect("https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
        const thumbnail = await this.catalog.getThumbnailById(id);
        if (!thumbnail) {
            return res.redirect("https://cdn.blockshub.net/thumbnails/d8f9737603db2d077e9c6f2d5bd3eec1db8ff9fc8ef64784a5e4e6580c4519ba.png");
        }
        return res.redirect(thumbnail.url);
    }
    async getSoloThumbnail(id) {
        if (!id) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        return await this.catalog.getThumbnailById(id);
    }
    async getCatalogItemSalesCount(id) {
        const data = await this.catalog.countSales(id);
        return {
            sales: data,
        };
    }
    async multiGetThumbnails(ids) {
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds = [];
        idsArray.forEach((id) => {
            const userId = Filter_1.filterId(id);
            if (userId) {
                filteredIds.push(userId);
            }
        });
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25 || safeIds.length < 1) {
            throw new this.BadRequest('TooManyIds');
        }
        return await this.catalog.multiGetThumbnailsFromIds(safeIds);
    }
    async MultiGetNames(ids) {
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds = [];
        let allIdsValid = true;
        idsArray.forEach((id) => {
            const catalogId = Filter_1.filterId(id);
            if (!catalogId) {
                allIdsValid = false;
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
    async searchCatalog(offset, limit = 25, category, orderBy = 'id', orderByType = 'desc', query) {
        if (orderBy !== "id" && orderBy !== "price") {
            throw new this.BadRequest('InvalidOrderBy');
        }
        if (orderByType !== "desc" && orderByType !== "asc") {
            throw new this.BadRequest('InvalidOrderByType');
        }
        if (limit > 100 || limit < 1) {
            limit = 25;
        }
        const goodCategory = Filter_1.filterId(category);
        let categoryEnum;
        if (goodCategory === model.catalog.searchCategory.Any || goodCategory === model.catalog.searchCategory.Collectibles || goodCategory === model.catalog.searchCategory.Featured) {
            categoryEnum = goodCategory;
        }
        else if (Object.values(model.catalog.category).includes(goodCategory)) {
            categoryEnum = goodCategory;
        }
        else {
            throw new this.BadRequest('InvalidCategory');
        }
        let SearchResults = await this.catalog.getCatalog(offset, limit, categoryEnum, orderBy, orderByType, query);
        if (category === model.catalog.searchCategory.Collectibles) {
            let arrayOfCatalogIds = [];
            for (const item of SearchResults) {
                arrayOfCatalogIds.push(item.catalogId);
            }
            let lowestPrices = await this.catalog.getLowestPriceOfCollectibleCatalogItems(arrayOfCatalogIds);
            for (const item of lowestPrices) {
                for (const result of SearchResults) {
                    if (result.catalogId === item.catalogId) {
                        result.collectibleLowestPrice = item.price;
                        break;
                    }
                }
            }
        }
        return SearchResults;
    }
    async updateItemInfo(userInfo, catalogId, newName, newDescription, isForSale, newPrice, currency, stock, collectible, moderation, category) {
        let CatalogInfo;
        try {
            CatalogInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'creatorId', 'creatorType', 'status', 'category', 'collectible']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (CatalogInfo.status !== model.catalog.moderatorStatus.Ready && userInfo.staff < 1) {
            throw new this.BadRequest('InvalidModerationStatus');
        }
        if (userInfo.staff >= 2) {
        }
        else if (CatalogInfo.creatorType === model.catalog.creatorType.User) {
            if (CatalogInfo.creatorId !== userInfo.userId) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        else if (CatalogInfo.creatorType === model.catalog.creatorType.Group) {
            const groupRole = await this.group.getUserRole(CatalogInfo.creatorId, userInfo.userId);
            if (groupRole.permissions.manage === 0) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
        if (!newName) {
            newName = CatalogInfo.catalogName;
        }
        if (!newDescription) {
            newDescription = CatalogInfo.description;
        }
        if (newName.length > 32 || newName.length < 3) {
            throw new this.BadRequest('InvalidCatalogName');
        }
        if (newDescription.length > 256) {
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
        if (!category) {
            category = CatalogInfo.category;
        }
        console.log('cat', category);
        if (typeof model.catalog.category[category] !== 'string') {
            throw new this.BadRequest('InvalidCategory');
        }
        let newStock = 0;
        let newCollectible = model.catalog.collectible.false;
        let moderationStatus = CatalogInfo.status;
        if (userInfo.staff >= 2) {
            newStock = Filter_1.filterId(stock);
            if (!newStock) {
                newStock = 0;
            }
            if (!collectible) {
                collectible = CatalogInfo.collectible;
            }
            newCollectible = collectible;
            if (newCollectible !== 1 && newCollectible !== 0) {
                throw new this.BadRequest('InvalidCollectibleState');
            }
            const newModerationStatus = moderation;
            if (newModerationStatus !== model.catalog.moderatorStatus.Moderated && newModerationStatus !== model.catalog.moderatorStatus.Pending && newModerationStatus !== model.catalog.moderatorStatus.Ready) {
                throw new this.BadRequest('InvalidModerationStatus');
            }
            moderationStatus = newModerationStatus;
        }
        else {
            category = CatalogInfo.category;
        }
        await this.catalog.updateCatalogItemInfo(catalogId, newName, newDescription, newPrice, currency, newStock, newCollectible, isForSale, moderationStatus, category);
        return { success: true };
    }
    async getOwners(catalogId, offset = 0, limit = 100, sort = 'desc') {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const owners = await this.catalog.getOwners(catalogId, offset, limit, sort);
        return owners;
    }
    async getRecommended(catalogId) {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const recommended = await this.catalog.getRecommended(catalogId);
        return recommended;
    }
    async getComments(catalogId, offset = 0) {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const numericOffset = Filter_1.filterOffset(offset);
        const Comments = await this.catalog.getComments(catalogId, numericOffset);
        return Comments;
    }
    async createComment(userInfo, catalogId, comment) {
        try {
            await this.catalog.getInfo(catalogId, ['catalogId']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (comment.length > 250 || comment.length < 3) {
            throw new this.BadRequest('InvalidComment');
        }
        await this.catalog.createComment(catalogId, userInfo.userId, comment);
        return { success: true };
    }
    async deleteComment(userInfo, catalogId, commentId) {
        let info;
        try {
            info = await this.catalog.getComment(catalogId, commentId);
            if (info.isDeleted === 1) {
                throw new Error('CommentAlreadyDeleted');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidCommentId');
        }
        if (info.userId !== userInfo.userId && userInfo.staff >= 1 === false) {
            throw new this.BadRequest('InvalidCommentId');
        }
        await this.catalog.deleteComment(catalogId, commentId);
        return {
            success: true,
        };
    }
    async getCharts(catalogId) {
        let itemInfo;
        try {
            itemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'collectible']);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (itemInfo.collectible !== model.catalog.collectible.true) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        return await this.catalog.getCharts(catalogId);
    }
    async getSellers(catalogId, offset = 0) {
        try {
            const itemInfo = await this.catalog.getInfo(catalogId, ['catalogId', 'collectible']);
            if (itemInfo.collectible !== model.catalog.collectible.true) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const itemsForSale = await this.catalog.getSellers(catalogId, offset);
        const totalSellers = await this.catalog.countSellers(catalogId);
        return {
            total: totalSellers,
            sellers: itemsForSale,
        };
    }
    async updateItemFiles(userInfo, catalogId, uploadedFiles) {
        if (userInfo.staff < 1) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let category;
        try {
            const catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'category']);
            category = catalogData.category;
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        const files = await this.catalog.sortFileUploads(uploadedFiles);
        if (files.jpg === false && files.png === false && files.mtl === false && files.obj === false) {
            throw new this.BadRequest('NoFileSpecified');
        }
        await this.catalog.deleteAssociatedCatalogAssets(catalogId);
        if (files.obj) {
            await this.catalog.upload('obj', catalogId, files.obj);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.OBJ, catalogId.toString(), 'obj');
        }
        if (files.png) {
            await this.catalog.upload('png', catalogId, files.png);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'png');
        }
        if (files.jpg) {
            await this.catalog.upload('jpg', catalogId, files.jpg);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'jpg');
        }
        if (files.mtl) {
            if (files.png) {
                await this.catalog.upload('mtl', catalogId, files.mtl, true);
            }
            else {
                await this.catalog.upload('mtl', catalogId, files.mtl);
            }
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.MTL, catalogId.toString(), 'mtl');
        }
        const reRenderItem = async () => {
            try {
                let url;
                const json = await this.catalog.generateAvatarJsonFromCatalogIds(catalogId, [catalogId]);
                if (category === model.catalog.category.Gear) {
                    url = await this.avatar.renderAvatar('item', json);
                }
                else if (category === model.catalog.category.Hat) {
                    url = await this.avatar.renderAvatar('item', json);
                }
                else {
                    url = await this.avatar.renderAvatar('avatar', json);
                }
                await this.catalog.deleteThumbnail(catalogId);
                await this.catalog.uploadThumbnail(catalogId, url);
            }
            catch (e) {
                console.log(e);
            }
        };
        reRenderItem().then(d => {
        })
            .catch(e => {
            console.error(e);
        });
        return { success: true, id: catalogId };
    }
    async forceThumbnailRegen(userInfo, catalogId, yieldUntilComplete = false, setThumbnailOnFinish = true) {
        let category;
        try {
            const catalogData = await this.catalog.getInfo(catalogId, ['catalogId', 'category']);
            category = catalogData.category;
        }
        catch (e) {
            throw new this.BadRequest('InvalidCatalogId');
        }
        if (userInfo.staff < 1) {
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
                }
                else if (category === model.catalog.category.Hat) {
                    url = await this.avatar.renderAvatar('item', json);
                }
                else if (category === model.catalog.category.GroupIcon) {
                    url = await this.avatar.renderAvatar('group', json);
                }
                else {
                    url = await this.avatar.renderAvatar('avatar', json);
                }
                if (setThumbnailOnFinish) {
                    await this.catalog.deleteThumbnail(catalogId);
                    await this.catalog.uploadThumbnail(catalogId, url);
                }
                return url;
            }
            catch (e) {
                console.error(e);
                throw e;
            }
        };
        if (yieldUntilComplete) {
            let data = await regenAvatar();
            if (!setThumbnailOnFinish) {
                return {
                    success: true,
                    url: data,
                };
            }
        }
        else {
            regenAvatar().then().catch(e => {
                console.error(e);
            });
        }
        return { success: true };
    }
    async create(userInfo, uploadedFiles, category, isForSale, price, currency, name, description, groupId, isCollectible, stock, uploadAsStaff) {
        let staffMode = false;
        if (userInfo.staff >= 2 && uploadAsStaff === "true") {
            staffMode = true;
        }
        let files;
        if (staffMode) {
            files = await this.catalog.sortFileUploads(uploadedFiles, 15 * 1024 * 1024);
        }
        else {
            files = await this.catalog.sortFileUploads(uploadedFiles);
            if (files.obj !== false) {
                throw new this.BadRequest('InvalidOBJSpecified');
            }
            if (files.mtl !== false) {
                throw new this.BadRequest('InvalidMTLSpecified');
            }
        }
        if (files.jpg === false && files.png === false && files.mtl === false && files.obj === false) {
            throw new this.BadRequest('NoFileSpecified');
        }
        if (category !== model.catalog.category.Faces && category !== model.catalog.category.Pants && category !== model.catalog.category.Shirt && category !== model.catalog.category.TShirt) {
            if (!staffMode) {
                throw new this.BadRequest('InvalidCategory');
            }
            else {
                if (model.catalog.category[category] === undefined) {
                    throw new this.BadRequest('InvalidCategory');
                }
            }
        }
        if (!isForSale) {
            price = 0;
            currency = model.economy.currencyType.secondary;
        }
        else {
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
            throw new this.BadRequest('InvalidCatalogName');
        }
        if (description.length > 256) {
            throw new this.BadRequest('InvalidCatalogDescription');
        }
        const groupUpload = Filter_1.filterId(groupId);
        if (groupUpload) {
            const groupInfo = await this.group.getInfo(groupUpload);
            if (groupInfo.groupStatus === model.group.groupStatus.locked) {
                throw new this.BadRequest('InvalidPermissions');
            }
            const role = await this.group.getUserRole(groupUpload, userInfo.userId);
            if (role.permissions.manage !== 1) {
                throw new this.BadRequest('InvalidPermissions');
            }
        }
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
            moderationStatus = model.catalog.moderatorStatus.Ready;
        }
        let catalogId;
        if (groupUpload && !staffMode) {
            catalogId = await this.catalog.createGroupItem(groupUpload, creatorId, name, description, isForSale, category, price, currency, collectible, maxSales, moderationStatus);
        }
        else {
            catalogId = await this.catalog.createUserItem(creatorId, name, description, isForSale, category, price, currency, collectible, maxSales, moderationStatus);
        }
        if (!staffMode) {
            await this.catalog.createItemForUserInventory(userInfo.userId, catalogId);
        }
        if (files.obj) {
            await this.catalog.upload('obj', catalogId, files.obj);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.OBJ, catalogId.toString(), 'obj');
        }
        if (files.png) {
            await this.catalog.upload('png', catalogId, files.png);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'png');
        }
        if (files.jpg) {
            await this.catalog.upload('jpg', catalogId, files.jpg);
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.Texture, catalogId.toString(), 'jpg');
        }
        if (files.mtl) {
            if (files.png) {
                await this.catalog.upload('mtl', catalogId, files.mtl, true);
            }
            else {
                await this.catalog.upload('mtl', catalogId, files.mtl);
            }
            await this.catalog.createCatalogAsset(catalogId, userInfo.userId, model.catalog.assetType.MTL, catalogId.toString(), 'mtl');
        }
        const backgroundRender = async () => {
            try {
                const json = await this.catalog.generateAvatarJsonFromCatalogIds(catalogId, [catalogId]);
                let url;
                if (category === model.catalog.category.Gear) {
                    url = await this.avatar.renderAvatar('item', json);
                }
                else if (category === model.catalog.category.Hat) {
                    url = await this.avatar.renderAvatar('item', json);
                }
                else {
                    url = await this.avatar.renderAvatar('avatar', json);
                }
                await this.catalog.uploadThumbnail(catalogId, url);
            }
            catch (e) {
                console.log(e);
            }
        };
        backgroundRender().then().catch(e => {
            console.error(e);
        });
        return { success: true, id: catalogId };
    }
    async deleteCatalogItem(userInfo, catalogId) {
        const forUpdate = [
            'user_inventory'
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            let item;
            try {
                item = await trx.catalog.getInfo(catalogId, ['category', 'catalogId']);
            }
            catch (e) {
                throw new this.BadRequest('InvalidCatalogId');
            }
            let allowedCategories = [
                model.catalog.category.TShirt,
                model.catalog.category.Shirt,
                model.catalog.category.Pants,
            ];
            let allowedForDeletion = false;
            for (const cat of allowedCategories) {
                if (item.category === cat) {
                    allowedForDeletion = true;
                }
            }
            if (!allowedForDeletion) {
                throw new this.Conflict('ItemCannotBeDeleted');
            }
            let userItems = await trx.user.getUserInventoryByCatalogId(userInfo.userId, item.catalogId);
            for (const userItem of userItems) {
                await trx.catalog.deleteUserInventoryId(userItem.userInventoryId);
            }
        });
        return {};
    }
};
__decorate([
    common_1.Get('/all-items/count'),
    swagger_1.Summary('Count all catalog items that have a price above 0 and are for-sale'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "countAllItems", null);
__decorate([
    common_1.Get('/:catalogId/info'),
    swagger_1.Summary('Get catalog item info by catalogId'),
    __param(0, common_1.Required()),
    __param(0, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getInfo", null);
__decorate([
    common_1.Get('/categories'),
    swagger_1.Summary('Get all catalog item categories'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CatalogController.prototype, "getCategories", null);
__decorate([
    common_1.Get('/:catalogId/thumbnail/redirect'),
    swagger_1.Summary('Get catalog item thumbnail and redirect to url. Will redirect to placeholder if invalid catalogId or not available'),
    __param(0, common_1.Res()),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getSoloThumbnailAndRedirect", null);
__decorate([
    common_1.Get('/:catalogId/thumbnail'),
    swagger_1.Summary('Get catalog item thumbnail model'),
    __param(0, common_1.Required()),
    __param(0, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getSoloThumbnail", null);
__decorate([
    common_1.Get('/:catalogId/sales/count'),
    swagger_1.Summary('Count catalog item sales'),
    swagger_1.Returns(200, { type: class {
        } }),
    __param(0, common_1.Required()),
    __param(0, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getCatalogItemSalesCount", null);
__decorate([
    common_1.Get('/thumbnails'),
    swagger_1.Summary('Multi-get thumbnails by catalogId'),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('ids', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "multiGetThumbnails", null);
__decorate([
    common_1.Get('/names'),
    swagger_1.Summary('Multi-get catalog item names by catalogId'),
    swagger_1.Description('Invalid IDs will be filtered out'),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('ids', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "MultiGetNames", null);
__decorate([
    common_1.Get('/'),
    swagger_1.Summary('Search the catalog'),
    __param(0, common_1.QueryParams('offset', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, common_1.QueryParams('category', Number)),
    __param(3, common_1.QueryParams('orderBy', String)),
    __param(4, common_1.QueryParams('orderByType', String)),
    __param(5, common_1.QueryParams('q', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "searchCatalog", null);
__decorate([
    common_1.Patch('/:catalogId/info'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCatalogId: catalogId is invalid\nInvalidModerationStatus: Moderation status is invalid\nInvalidPermissions: Requester is not authorized to edit this item\nInvalidCatalogName: Name is invalid\nInvalidCatalogDescription: Description is invalid\nInvalidIsForSaleOption: isForSale must be 0 or 1\nConstraintPriceTooHigh: Price is too high\nInvalidCurrency: Currency type is invalid\nInvalidCategory: Category is invalid\nInvalidCollectibleState: collectible must be 0 or 1\nInvalidModerationStatus: Moderation status is not valid\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('catalogId', Number)),
    __param(2, common_1.BodyParams('name', String)),
    __param(3, common_1.BodyParams('description', String)),
    __param(4, common_1.BodyParams('isForSale', Number)),
    __param(5, common_1.BodyParams('price', Number)),
    __param(6, common_1.BodyParams('currency', Number)),
    __param(7, common_1.BodyParams('stock', Number)),
    __param(8, common_1.BodyParams('collectible', Number)),
    __param(9, common_1.BodyParams('moderation', Number)),
    __param(10, common_1.BodyParams('category', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, String, Number, Number, Number, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "updateItemInfo", null);
__decorate([
    common_1.Get('/:catalogId/owners'),
    swagger_1.Summary('Get owners of a catalog item'),
    __param(0, common_1.PathParams('catalogId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getOwners", null);
__decorate([
    common_1.Get('/:catalogId/recommended'),
    swagger_1.Summary('Get similar catalog items based off {catalogId}'),
    __param(0, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getRecommended", null);
__decorate([
    common_1.Get('/:catalogId/comments'),
    swagger_1.Summary('Get comments posted to a catalogItem'),
    __param(0, common_1.PathParams('catalogId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getComments", null);
__decorate([
    common_1.Post('/:catalogId/comment'),
    swagger_1.Summary('Create a comment for a catalog item'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('comment', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "createComment", null);
__decorate([
    common_1.Delete('/:catalogId/comment/:commentId'),
    swagger_1.Summary('Delete a catalog item comment'),
    swagger_1.Description('This endpoint is meant for users wishing to delete their own comments, although it will also delete comments made by any user, as long as the requester is a staff member'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCommentId CommentId is invalid\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __param(2, common_1.PathParams('commentId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "deleteComment", null);
__decorate([
    swagger_1.Summary('Get charts for a collectible catalog item'),
    common_1.Get('/:catalogId/charts'),
    __param(0, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getCharts", null);
__decorate([
    common_1.Get('/:catalogId/sellers'),
    swagger_1.Summary('Get sellers of a collectible catalog item'),
    __param(0, common_1.PathParams('catalogId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "getSellers", null);
__decorate([
    common_1.Patch('/:catalogId/files'),
    swagger_1.Summary('Update a catalog item\'s files'),
    swagger_1.Description('Restricted to staff use only'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __param(2, multipartfiles_1.MultipartFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Array]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "updateItemFiles", null);
__decorate([
    common_1.Put('/:catalogId/thumbnail/regenerate'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Boolean, Boolean]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "forceThumbnailRegen", null);
__decorate([
    common_1.Post('/create'),
    swagger_1.Summary('Create a catalog item'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Returns(200, { description: 'OK', type: model.catalog.CatalogCreationSuccessResponse }),
    swagger_1.Returns(400, { description: 'InvalidOBJSpecified: OBJ required for category but not specified or invalid\nInvalidMTLSpecified: MTL required for category but not specified or invalid\nNoFileSpecified: No file was specified in the request\nInvalidCategory: Category is invalid or not allowed for current user\nInvalidPrice: Price is not valid\nInvalidCurrency: Currency is not valid\nConstraintPriceTooHigh: Price is too high\nInvalidCatalogName: Catalog Name is too large, too small, or otherwise invalid\nInvalidCatalogDescription: Description is too large or otherwise invalid\nInvalidPermissions: User does not have permission to upload to the groupId specified\n', type: model.Error }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, multipartfiles_1.MultipartFile()),
    __param(2, common_1.BodyParams('category', Number)),
    __param(3, common_1.BodyParams('isForSale', Number)),
    __param(4, common_1.BodyParams('price', Number)),
    __param(5, common_1.BodyParams('currency', Number)),
    __param(6, swagger_1.Description('Must be between 3 and 32 characters')),
    __param(6, common_1.BodyParams('name', String)),
    __param(7, swagger_1.Description('Must be between 0 and 256 characters')),
    __param(7, common_1.BodyParams('description', String)),
    __param(8, common_1.BodyParams('groupId')),
    __param(9, common_1.BodyParams('is_collectible')),
    __param(10, common_1.BodyParams('stock')),
    __param(11, swagger_1.Description('This parameter is silently ignored if userInfo.staff >= 2 is false')),
    __param(11, common_1.BodyParams('uploadAsStaff', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Array, Number, Number, Number, Number, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "create", null);
__decorate([
    common_1.Delete('/:catalogId/inventory'),
    swagger_1.Summary('Delete a userInventoryItem owned by the authenticated user'),
    swagger_1.Description('This will delete all userInventoryItems with the catalogId specified that belong to the authenticated user'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCatalogId: The catalogId specified is invalid\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'ItemCannotBeDeleted: This item cannot be deleted\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('catalogId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], CatalogController.prototype, "deleteCatalogItem", null);
CatalogController = __decorate([
    common_1.Controller('/catalog'),
    __metadata("design:paramtypes", [])
], CatalogController);
exports.CatalogController = CatalogController;

