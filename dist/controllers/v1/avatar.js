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
const Filter_1 = require("../../helpers/Filter");
const model = require("../../models/models");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const auth_1 = require("../../dal/auth");
const Auth_1 = require("../../middleware/Auth");
const swagger_1 = require("@tsed/swagger");
let AvatarController = class AvatarController extends controller_1.default {
    constructor() {
        super();
    }
    async update(userInfo, body) {
        let LegRGB = body.LegRGB;
        let HeadRGB = body.HeadRGB;
        let TorsoRGB = body.TorsoRGB;
        let Hats = body.Hats;
        let Face = body.Face;
        let TShirt = body.TShirt;
        let Shirt = body.Shirt;
        let Pants = body.Pants;
        let Character = {
            head: body.characterHead,
        };
        let canEdit = await this.avatar.canUserModifyAvatar(userInfo.userId);
        if (!canEdit && process.env.NODE_ENV === 'production') {
            throw new this.BadRequest('AvatarCooldown');
        }
        const LegArray = Filter_1.filterRGB([...LegRGB]);
        const TorsoArray = Filter_1.filterRGB([...TorsoRGB]);
        const HeadArray = Filter_1.filterRGB([...HeadRGB]);
        if (!LegArray || !HeadArray || !TorsoArray) {
            throw new this.BadRequest('InvalidRGBArray');
        }
        const jsonArray = {
            "UserId": userInfo.userId,
            "Leg": LegArray,
            "Head": HeadArray,
            "Torso": TorsoArray,
            "Hats": {
                Texture: [],
                OBJ: [],
                MTL: [],
            },
            "Face": false,
            "Gear": false,
            "TShirt": false,
            "Shirt": false,
            "Pants": false,
            Character: {},
        };
        const filteredHats = Array.from(new Set(Hats));
        if (typeof Face === "number" && Face !== 0) {
            filteredHats.push(Face);
        }
        if (typeof TShirt === "number" && TShirt !== 0) {
            filteredHats.push(TShirt);
        }
        if (typeof Shirt === "number" && Shirt !== 0) {
            filteredHats.push(Shirt);
        }
        if (typeof Pants === "number" && Pants !== 0) {
            filteredHats.push(Pants);
        }
        if (typeof Character.head === 'number') {
            filteredHats.push(Character.head);
        }
        const insertArray = [];
        for (const catalogId of filteredHats) {
            if (typeof catalogId !== 'number') {
                console.log('catalogId is of invalid type: ' + catalogId);
                throw new this.BadRequest('InvalidCatalogIds');
            }
            let owns = await this.user.getUserInventoryByCatalogId(userInfo.userId, catalogId);
            if (owns.length === 0) {
                throw new this.BadRequest('InvalidCatalogIds');
            }
            if (owns[0]) {
                const moderated = await this.catalog.getInfo(owns[0].catalogId, ['status']);
                if (moderated.status !== model.catalog.moderatorStatus.Ready) {
                    continue;
                }
                const assets = await this.catalog.getCatalogItemAssets(owns[0].catalogId);
                if (owns[0].category === model.catalog.category.Head) {
                    if (jsonArray.Character && jsonArray.Character.Head) {
                        continue;
                    }
                }
                if (owns[0].category === model.catalog.category.Hat || owns[0].category === model.catalog.category.Gear) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.MTL: {
                                jsonArray.Hats.MTL.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.OBJ: {
                                jsonArray.Hats.OBJ.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.Texture: {
                                jsonArray.Hats.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                if (owns[0].category === model.catalog.category.Gear) {
                    jsonArray.Gear = true;
                }
                else if (owns[0].category === model.catalog.category.Head) {
                    if (!jsonArray.Character) {
                        jsonArray.Character = {};
                    }
                    jsonArray.Character.Head = {
                        OBJ: [],
                        MTL: [],
                        Texture: [],
                    };
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.MTL: {
                                jsonArray.Character.Head.MTL.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.OBJ: {
                                jsonArray.Character.Head.OBJ.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.Texture: {
                                jsonArray.Character.Head.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.Faces) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Face = { Texture: [] };
                                jsonArray.Face.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.TShirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.TShirt = { Texture: [] };
                                jsonArray.TShirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.Shirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Shirt = { Texture: [] };
                                jsonArray.Shirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.Pants) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Pants = { Texture: [] };
                                jsonArray.Pants.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                insertArray.push({
                    userId: userInfo.userId,
                    catalogId: owns[0].catalogId,
                    category: owns[0].category,
                });
            }
        }
        await this.avatar.deleteAvatar(userInfo.userId);
        await this.avatar.multiAddItemsToAvatar(insertArray);
        await this.avatar.deleteAvatarColoring(userInfo.userId);
        await this.avatar.addAvatarColors(userInfo.userId, HeadRGB, LegRGB, TorsoRGB);
        (async () => {
            try {
                let avatar = await this.avatar.getThumbnailHashUrl(jsonArray);
                if (!avatar) {
                    console.log(JSON.stringify(jsonArray));
                    avatar = await this.avatar.renderAvatar('avatar', jsonArray);
                    await this.avatar.recordThumbnailHash(jsonArray, avatar);
                }
                else {
                    console.log("Hash Found!");
                }
                console.log(avatar);
                if (avatar) {
                    console.log('avatar found');
                    await this.avatar.deletedOldAvatarUrl(userInfo.userId);
                    await this.avatar.addAvatarUrl(userInfo.userId, avatar);
                    await this.avatar.publishAvatarUpdateFinished(userInfo.userId, avatar);
                }
                else {
                    console.log('avatar not found');
                    console.log(avatar);
                }
            }
            catch (e) {
                console.log(e);
            }
        })();
        return { success: true };
    }
    async createOutfit(userInfo, body) {
        let LegRGB = body.LegRGB;
        let HeadRGB = body.HeadRGB;
        let TorsoRGB = body.TorsoRGB;
        let Hats = body.Hats;
        let Face = body.Face;
        let TShirt = body.TShirt;
        let Shirt = body.Shirt;
        let Pants = body.Pants;
        let totalOutfits = await this.avatar.countOutfitsForUser(userInfo.userId);
        if (totalOutfits >= 25) {
            throw new this.BadRequest('MaximumOutfitsReached');
        }
        const LegArray = Filter_1.filterRGB([...LegRGB]);
        const TorsoArray = Filter_1.filterRGB([...TorsoRGB]);
        const HeadArray = Filter_1.filterRGB([...HeadRGB]);
        if (!LegArray || !HeadArray || !TorsoArray) {
            throw new this.BadRequest('InvalidRGBArray');
        }
        const jsonArray = {
            "UserId": userInfo.userId,
            "Leg": LegArray,
            "Head": HeadArray,
            "Torso": TorsoArray,
            "Hats": {
                Texture: [],
                OBJ: [],
                MTL: [],
            },
            "Face": false,
            "Gear": false,
            "TShirt": false,
            "Shirt": false,
            "Pants": false,
            Character: {},
        };
        const filteredHats = Array.from(new Set(Hats));
        if (typeof Face === "number" && Face !== 0) {
            filteredHats.push(Face);
        }
        if (typeof TShirt === "number" && TShirt !== 0) {
            filteredHats.push(TShirt);
        }
        if (typeof Shirt === "number" && Shirt !== 0) {
            filteredHats.push(Shirt);
        }
        if (typeof Pants === "number" && Pants !== 0) {
            filteredHats.push(Pants);
        }
        const insertArray = [];
        for (const catalogId of filteredHats) {
            if (typeof catalogId !== 'number') {
                throw new this.BadRequest('InvalidCatalogIds');
            }
            let owns = await this.user.getUserInventoryByCatalogId(userInfo.userId, catalogId);
            if (owns.length === 0) {
                throw new this.BadRequest('InvalidCatalogIds');
            }
            if (owns[0]) {
                const moderated = await this.catalog.getInfo(owns[0].catalogId, ['status']);
                if (moderated.status !== model.catalog.moderatorStatus.Ready) {
                    continue;
                }
                const assets = await this.catalog.getCatalogItemAssets(owns[0].catalogId);
                if (owns[0].category === model.catalog.category.Head) {
                    if (!jsonArray.Character) {
                        jsonArray.Character = {};
                    }
                    if (jsonArray.Character.Head) {
                        continue;
                    }
                }
                if (owns[0].category === model.catalog.category.Hat || owns[0].category === model.catalog.category.Gear) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.MTL: {
                                jsonArray.Hats.MTL.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.OBJ: {
                                jsonArray.Hats.OBJ.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.Texture: {
                                jsonArray.Hats.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                if (owns[0].category === model.catalog.category.Gear) {
                    jsonArray.Gear = true;
                }
                else if (owns[0].category === model.catalog.category.Head) {
                    if (!jsonArray.Character) {
                        jsonArray.Character = {};
                    }
                    jsonArray.Character.Head = {
                        OBJ: [],
                        MTL: [],
                        Texture: [],
                    };
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.MTL: {
                                jsonArray.Character.Head.MTL.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.OBJ: {
                                jsonArray.Character.Head.OBJ.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.Texture: {
                                jsonArray.Character.Head.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.Faces) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Face = { Texture: [] };
                                jsonArray.Face.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.TShirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.TShirt = { Texture: [] };
                                jsonArray.TShirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.Shirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Shirt = { Texture: [] };
                                jsonArray.Shirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                else if (owns[0].category === model.catalog.category.Pants) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Pants = { Texture: [] };
                                jsonArray.Pants.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                }
                insertArray.push({
                    userId: userInfo.userId,
                    catalogId: owns[0].catalogId,
                    category: owns[0].category,
                });
            }
        }
        let avatarUrl = await this.avatar.getThumbnailHashUrl(jsonArray);
        if (!avatarUrl) {
            throw new this.Conflict('AvatarRenderRequired');
        }
        let outfitId = await this.avatar.createOutfit(userInfo.userId, avatarUrl);
        await this.avatar.multiAddItemsToOutfit(outfitId, insertArray);
        await this.avatar.addColorsToOutfit(outfitId, HeadRGB, LegRGB, TorsoRGB);
        return { success: true };
    }
    async getOutfitById(userInfo, outfitId) {
        let outfitData = await this.avatar.getOutfit(outfitId);
        if (outfitData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidOutfitId');
        }
        let avatarData = await this.avatar.getOutfitAvatar(outfitId);
        let avatarColorData = await this.avatar.getOutfitAvatarColors(outfitId);
        return {
            avatar: avatarData,
            colors: avatarColorData,
        };
    }
    async getUserOutfits(userInfo, offset, limit) {
        let totalOutfits = await this.avatar.countOutfitsForUser(userInfo.userId);
        let userOutfits = await this.avatar.getOutfitsForUser(userInfo.userId, limit, offset);
        return {
            total: totalOutfits,
            outfits: userOutfits,
        };
    }
    async updateOutfitName(userInfo, name, outfitId) {
        let outfitData = await this.avatar.getOutfit(outfitId);
        if (outfitData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidOutfitId');
        }
        if (name.length > 64 || !name || name.length < 1) {
            throw new this.BadRequest('InvalidName');
        }
        await this.avatar.updateOutfitName(outfitId, name);
        return {
            success: true,
        };
    }
    async deleteOutfit(userInfo, outfitId) {
        let outfitData = await this.avatar.getOutfit(outfitId);
        if (outfitData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidOutfitId');
        }
        await this.avatar.deleteOutfit(outfitId);
        return {
            success: true,
        };
    }
    async pollForChanges(userInfo) {
        let result = await this.avatar.setupAvatarUpdateListener(userInfo.userId);
        if (result) {
            return {
                url: result,
            };
        }
        else {
            let currentUrl = await this.user.getThumbnailByUserId(userInfo.userId);
            return {
                url: currentUrl.url,
            };
        }
    }
};
__decorate([
    common_1.Patch('/'),
    swagger_1.Summary('Update the authenticated users avatar'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Returns(400, { type: model.Error, description: 'AvatarCooldown: You cannot update your avatar right now\nInvalidCatalogIds: One or more of the catalog ids specified are invalid and/or not owned by the authenticated user\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams(model.avatar.UpdateAvatarPayload)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, model.avatar.UpdateAvatarPayload]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "update", null);
__decorate([
    common_1.Post('/outfit/create'),
    swagger_1.Summary('Create an outfit'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams(model.avatar.UpdateAvatarPayload)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, model.avatar.UpdateAvatarPayload]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "createOutfit", null);
__decorate([
    common_1.Get('/outfit/:outfitId'),
    swagger_1.Summary('Get an outfit by the {outfitId}'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidOutfitId: OutfitId is invalid or not owned by current user\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('outfitId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "getOutfitById", null);
__decorate([
    common_1.Get('/outfits'),
    swagger_1.Summary('Get the authenticated users outfits'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "getUserOutfits", null);
__decorate([
    common_1.Patch('/outfit/:outfitId/name'),
    swagger_1.Summary('Update an outfit\'s name'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('name', String)),
    __param(2, common_1.PathParams('outfitId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, Number]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "updateOutfitName", null);
__decorate([
    common_1.Delete('/outfit/:outfitId'),
    swagger_1.Summary('Delete an outfit'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('outfitId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "deleteOutfit", null);
__decorate([
    common_1.Get('/poll'),
    swagger_1.Summary("Poll for avatar changes. Timeout is set to 20 seconds, but it may be increased in the future. A 200 does not indiciate the avatar was changed; this endpoint will now give 200 even if no changes were detected (incase changes happened before a connection was setup)"),
    swagger_1.Returns(200, { type: model.avatar.AvatarPollResponseOK, description: 'See URL for avatar URL\n' }),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", Promise)
], AvatarController.prototype, "pollForChanges", null);
AvatarController = __decorate([
    common_1.Controller('/avatar'),
    __metadata("design:paramtypes", [])
], AvatarController);
exports.default = AvatarController;

