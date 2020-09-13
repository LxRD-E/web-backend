/**
 * Imports
 */
// Models
import { filterRGB } from '../../helpers/Filter';
import * as model from '../../models/models';
// Autoload
import controller from '../controller';
import { BodyParams, Locals, UseBeforeEach, UseBefore, Patch, Controller, Get, Err, ModelStrict, Post, PathParams, Use, QueryParams, Required, Delete } from '@tsed/common';
import { csrf } from '../../dal/auth';
import { YesAuth } from '../../middleware/Auth';
import { Summary, Returns } from '@tsed/swagger';
/**
 * Avatar Controller
 */
@Controller('/avatar')
export default class AvatarController extends controller {

    constructor() {
        super();
    }
    /**
     * Update the Authenticated User's Avatar
     * @param userInfo
     * @param body
     */
    @Patch('/')
    @Summary('Update the authenticated users avatar')
    @Use(csrf, YesAuth)
    @Returns(400, { type: model.Error, description: 'AvatarCooldown: You cannot update your avatar right now\nInvalidCatalogIds: One or more of the catalog ids specified are invalid and/or not owned by the authenticated user\n' })
    public async update(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams(model.avatar.UpdateAvatarPayload) body: model.avatar.UpdateAvatarPayload,
    ) {
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
        }
        // Perform a rate-limit check
        let canEdit = await this.avatar.canUserModifyAvatar(userInfo.userId);
        if (!canEdit && process.env.NODE_ENV === 'production') {
            throw new this.BadRequest('AvatarCooldown');
        }
        // Filter RGB Values
        // Array is duplicated since direct RGB values have to be saved in the database, not color3 (which this converts rgb to if its valid)
        const LegArray = filterRGB([...LegRGB]) as Array<number>;
        const TorsoArray = filterRGB([...TorsoRGB]) as Array<number>;
        const HeadArray = filterRGB([...HeadRGB]) as Array<number>;
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
        } as model.avatar.JsonArrayInterfaceWithAssets;
        // Filter Hats
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
        // Array of Items to Insert into DB
        const insertArray = [];

        for (const catalogId of filteredHats) {
            // Check if owns
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
                // If Awaiting moderation approval, skip item
                if (moderated.status !== model.catalog.moderatorStatus.Ready) {
                    continue;
                }
                // Grab Assets of Catalog Item
                const assets = await this.catalog.getCatalogItemAssets(owns[0].catalogId);
                if (owns[0].category === model.catalog.category.Head) {
                    // Only allow one head
                    if (jsonArray.Character && jsonArray.Character.Head) {
                        continue
                    }
                }
                // If hat or body part
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
                    // jsonArray.Gear = owns[0].catalogId;
                } else if (owns[0].category === model.catalog.category.Head) {
                    if (!jsonArray.Character) {
                        jsonArray.Character = {};
                    }
                    jsonArray.Character.Head = {
                        OBJ: [],
                        MTL: [],
                        Texture: [],
                    }
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
                } else if (owns[0].category === model.catalog.category.Faces) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Face = { Texture: [] };
                                jsonArray.Face.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                } else if (owns[0].category === model.catalog.category.TShirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.TShirt = { Texture: [] };
                                jsonArray.TShirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                } else if (owns[0].category === model.catalog.category.Shirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Shirt = { Texture: [] };
                                jsonArray.Shirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                } else if (owns[0].category === model.catalog.category.Pants) {
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
        // Remove old avatar items. note: this doesn't delete the picture
        await this.avatar.deleteAvatar(userInfo.userId);
        // Add new items
        await this.avatar.multiAddItemsToAvatar(insertArray);
        // Delete old coloring
        await this.avatar.deleteAvatarColoring(userInfo.userId);
        // Add new coloring
        await this.avatar.addAvatarColors(userInfo.userId, HeadRGB, LegRGB, TorsoRGB);
        // Submit Render Request
        (async (): Promise<void> => {
            try {
                // Check if hash exists
                let avatar = await this.avatar.getThumbnailHashUrl(jsonArray);
                // tmp
                // avatar = false as any;
                if (!avatar) {
                    /**
                     * TODO:
                     * This might be moved to background task so that avatars don't break everytime the server has to reboot (such as for updates). Although it would likely be a bit slower than the current implementation, it would probably scale much better. Until then, I'm leaving this as-is for now unless this really becomes and issue
                    */
                    // Render Avatar
                    console.log(JSON.stringify(jsonArray));
                    avatar = await this.avatar.renderAvatar('avatar', jsonArray);
                    // Record Hash
                    await this.avatar.recordThumbnailHash(jsonArray, avatar);
                } else {
                    console.log("Hash Found!");
                }
                console.log(avatar);
                if (avatar) {
                    console.log('avatar found');
                    // Delete Old Avatar
                    await this.avatar.deletedOldAvatarUrl(userInfo.userId);
                    // Add Avatar
                    await this.avatar.addAvatarUrl(userInfo.userId, avatar);
                    // Publish Update
                    await this.avatar.publishAvatarUpdateFinished(userInfo.userId, avatar);
                    // OK
                } else {
                    console.log('avatar not found');
                    console.log(avatar);
                }
            } catch (e) {
                // Log exception
                console.log(e);
            }
        })();
        // Return Response
        return { success: true };
    }

    @Post('/outfit/create')
    @Summary('Create an outfit')
    @Use(csrf, YesAuth)
    public async createOutfit(
        @Locals('userInfo') userInfo: model.UserSession,
        @BodyParams(model.avatar.UpdateAvatarPayload) body: model.avatar.UpdateAvatarPayload,
    ) {
        let LegRGB = body.LegRGB;
        let HeadRGB = body.HeadRGB;
        let TorsoRGB = body.TorsoRGB;
        let Hats = body.Hats;
        let Face = body.Face;
        let TShirt = body.TShirt;
        let Shirt = body.Shirt;
        let Pants = body.Pants;
        // Perform a rate-limit check
        let totalOutfits = await this.avatar.countOutfitsForUser(userInfo.userId);
        if (totalOutfits >= 25) {
            throw new this.BadRequest('MaximumOutfitsReached');
        }
        // Filter RGB Values
        // Array is duplicated since direct RGB values have to be saved in the database, not color3 (which this converts rgb to if its valid)
        const LegArray = filterRGB([...LegRGB]) as Array<number>;
        const TorsoArray = filterRGB([...TorsoRGB]) as Array<number>;
        const HeadArray = filterRGB([...HeadRGB]) as Array<number>;
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
        } as model.avatar.JsonArrayInterfaceWithAssets;
        // Filter Hats
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
        // Array of Items to Insert into DB
        const insertArray = [];

        for (const catalogId of filteredHats) {
            // Check if owns
            if (typeof catalogId !== 'number') {
                throw new this.BadRequest('InvalidCatalogIds');
            }
            let owns = await this.user.getUserInventoryByCatalogId(userInfo.userId, catalogId);
            if (owns.length === 0) {
                throw new this.BadRequest('InvalidCatalogIds');
            }
            if (owns[0]) {
                const moderated = await this.catalog.getInfo(owns[0].catalogId, ['status']);
                // If Awaiting moderation approval, skip item
                if (moderated.status !== model.catalog.moderatorStatus.Ready) {
                    continue;
                }
                // Grab Assets of Catalog Item
                const assets = await this.catalog.getCatalogItemAssets(owns[0].catalogId);
                if (owns[0].category === model.catalog.category.Head) {
                    if (!jsonArray.Character) {
                        jsonArray.Character = {}
                    }
                    if (jsonArray.Character.Head) {
                        continue;
                    }
                }
                // If hat
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
                    // jsonArray.Gear = owns[0].catalogId;
                } else if (owns[0].category === model.catalog.category.Head) {
                    if (!jsonArray.Character) {
                        jsonArray.Character = {}
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
                } else if (owns[0].category === model.catalog.category.Faces) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Face = { Texture: [] };
                                jsonArray.Face.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                } else if (owns[0].category === model.catalog.category.TShirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.TShirt = { Texture: [] };
                                jsonArray.TShirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                } else if (owns[0].category === model.catalog.category.Shirt) {
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.Texture: {
                                jsonArray.Shirt = { Texture: [] };
                                jsonArray.Shirt.Texture.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                        }
                    }
                } else if (owns[0].category === model.catalog.category.Pants) {
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
        // Check if hash exists
        let avatarUrl = await this.avatar.getThumbnailHashUrl(jsonArray);
        if (!avatarUrl) {
            throw new this.Conflict('AvatarRenderRequired');
        }
        let outfitId = await this.avatar.createOutfit(userInfo.userId, avatarUrl);
        // Add new items
        await this.avatar.multiAddItemsToOutfit(outfitId, insertArray);
        // Add new coloring
        await this.avatar.addColorsToOutfit(outfitId, HeadRGB, LegRGB, TorsoRGB);
        // Return Response
        return { success: true };
    }

    @Get('/outfit/:outfitId')
    @Summary('Get an outfit by the {outfitId}')
    @Use(YesAuth)
    @Returns(400, { type: model.Error, description: 'InvalidOutfitId: OutfitId is invalid or not owned by current user\n' })
    public async getOutfitById(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('outfitId', Number) outfitId: number,
    ) {
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

    @Get('/outfits')
    @Summary('Get the authenticated users outfits')
    @Use(YesAuth)
    public async getUserOutfits(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset', Number) offset: number,
        @QueryParams('limit', Number) limit: number,
    ) {
        let totalOutfits = await this.avatar.countOutfitsForUser(userInfo.userId);
        let userOutfits = await this.avatar.getOutfitsForUser(userInfo.userId, limit, offset);
        return {
            total: totalOutfits,
            outfits: userOutfits,
        };
    }

    @Patch('/outfit/:outfitId/name')
    @Summary('Update an outfit\'s name')
    @Use(csrf, YesAuth)
    public async updateOutfitName(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('name', String) name: string,
        @PathParams('outfitId', Number) outfitId: number,
    ) {
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

    @Delete('/outfit/:outfitId')
    @Summary('Delete an outfit')
    @Use(csrf, YesAuth)
    public async deleteOutfit(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('outfitId', Number) outfitId: number,
    ) {
        let outfitData = await this.avatar.getOutfit(outfitId);
        if (outfitData.userId !== userInfo.userId) {
            throw new this.BadRequest('InvalidOutfitId');
        }
        await this.avatar.deleteOutfit(outfitId);
        return {
            success: true,
        };
    }

    /**
     * Setup Changes Polling
     */
    @Get('/poll')
    @Summary("Poll for avatar changes. Timeout is set to 20 seconds, but it may be increased in the future. A 200 does not indiciate the avatar was changed; this endpoint will now give 200 even if no changes were detected (incase changes happened before a connection was setup)")
    @Returns(200, { type: model.avatar.AvatarPollResponseOK, description: 'See URL for avatar URL\n' })
    @Use(YesAuth)
    public async pollForChanges(
        @Locals('userInfo') userInfo: model.UserSession,
    ) {
        let result = await this.avatar.setupAvatarUpdateListener(userInfo.userId);
        if (result) {
            return {
                url: result,
            };
        } else {
            // send
            let currentUrl = await this.user.getThumbnailByUserId(userInfo.userId);
            return {
                url: currentUrl.url,
            };
        }
    }
}
