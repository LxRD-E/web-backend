/**
 * Imports
 */
// Models
import { filterRGB } from '../../helpers/Filter';
import * as model from '../../models/models';
// Autoload
import controller from '../controller';
import { BodyParams, Locals, UseBeforeEach, UseBefore, Patch, Controller, Get, Err, ModelStrict } from '@tsed/common';
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
     * @param LegRGB RGB Array
     * @param HeadRGB RGB Array
     * @param TorsoRGB RGB Array
     * @param Hats Array of Hat Catalog IDs
     * @param Face Face Catalog ID
     * @param TShirt TShirt Catalog ID
     * @param Shirt Shirt Catalog ID
     * @param Pants Pants Catalog ID
     */
    @Patch('/')
    @Summary('Update the authenticated users avatar')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Returns(400, {type: model.Error, description: 'AvatarCooldown: You cannot update your avatar right now\nInvalidCatalogIds: One or more of the catalog ids specified are invalid and/or not owned by the authenticated user\n'})
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
        // Perform a rate-limit check
        let canEdit = await this.avatar.canUserModifyAvatar(userInfo.userId);
        if (!canEdit) {
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
        } as model.avatar.JsonArrayInterfaceWithAssets;
        // Filter Hats
        const filteredHats = Array.from(new Set(Hats));
        if (typeof Face === "number") {
            filteredHats.push(Face);
        }
        if (typeof TShirt === "number") {
            filteredHats.push(TShirt);
        }
        if (typeof Shirt === "number") {
            filteredHats.push(Shirt);
        }
        if (typeof Pants === "number") {
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
                } else if (owns[0].category === model.catalog.category.Head) {
                    if (!jsonArray.Character) {
                        jsonArray.Character = {};
                    }
                    if (!jsonArray.Character.Head) {
                        jsonArray.Character.Head = {
                            Texture: [],
                            OBJ: [],
                            MTL: [],
                        }
                    }
                    const arr = jsonArray.Character.Head;
                    for (const asset of assets) {
                        switch (asset.assetType) {
                            case model.catalog.assetType.MTL: {
                                arr.MTL.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.OBJ: {
                                arr.OBJ.push(asset.fileName + '.' + asset.fileType);
                                break;
                            }
                            case model.catalog.assetType.Texture: {
                                arr.Texture.push(asset.fileName + '.' + asset.fileType);
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
                avatar = false as any;
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

    /**
     * Setup Changes Polling
     */
    @Get('/poll')
    @Summary("Poll for avatar changes. Timeout is set to 20 seconds, but it may be increased in the future")
    @Returns(400, {type: model.Error, description: 'NoUpdates: No updates are available\n'})
    public async pollForChanges(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ): Promise<{ url: string }> {
        let result = await this.avatar.setupAvatarUpdateListener(userInfo.userId);
        if (result) {
            return {
                url: result,
            };
        } else {
            throw new this.BadRequest('NoUpdates');
        }
    }
}
