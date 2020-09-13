import * as Catalog from './catalog';
import { Required, PropertyType, Property } from '@tsed/common';
import { Type } from '@tsed/core';

export interface itemsArray {
    userId: number;
    catalogId: number;
    category: Catalog.category;
}

export interface avatarRequestModel {
    userid: number;
    catalog_id: number;
    type: number;
    date: string;
}

// JSON To send to backend render service
export interface jsonArrayInterface {
    UserId: number;
    Leg: Array<number>;
    Head: Array<number>;
    Torso: Array<number>;
    Hats: Array<number>;
    Face: number | boolean;
    Gear: boolean;
    TShirt: number | boolean;
    Shirt: number | boolean;
    Pants: number | boolean;
}

/**
 * JSON Object to send to Backend Render Service
 */
export interface JsonArrayInterfaceWithAssets {
    UserId: number;
    Leg: Array<number>;
    Head: Array<number>;
    Torso: Array<number>;
    Hats: JsonAvatarFileTypes;
    Face: JsonAvatarImageFileTypes | boolean;
    Gear: boolean;
    TShirt: JsonAvatarImageFileTypes | boolean;
    Shirt: JsonAvatarImageFileTypes | boolean;
    Pants: JsonAvatarImageFileTypes | boolean;
    Character?: CharacterOverwrides;
}

interface CharacterOverwrides {
    Head?: JsonAvatarFileTypes;
}

interface JsonAvatarImageFileTypes {
    Texture: string[];
}

interface JsonAvatarFileTypes extends JsonAvatarImageFileTypes {
    OBJ: string[];
    MTL: string[];
}

export interface ClothingJsonCreationObject {
    Shirt?: number;
    Pants?: number;
    TShirt?: number;
    Face?: number;
}

export class UpdateAvatarPayload {
    @PropertyType(Number)
    LegRGB: Array<number>;
    @PropertyType(Number)
    HeadRGB: Array<number>;
    @PropertyType(Number)
    TorsoRGB: Array<number>;
    @PropertyType(Number)
    Hats: Array<number>;
    @PropertyType(Number)
    Face: number | boolean;
    @PropertyType(Number)
    TShirt: number | boolean;
    @PropertyType(Number)
    Shirt: number | boolean;
    @PropertyType(Number)
    Pants: number | boolean;
    @PropertyType(Number)
    characterHead: number | undefined;
}

export class AvatarPollResponseOK {
    @Required()
    url: string;
}

export class UserOutfit {
    @Required()
    outfitId: number;
    @Required()
    userId: number;
    @Required()
    name: string;
    @Required()
    url: string;
}

export class UserOutfitAvatar {
    @Required()
    catalogId: number;
    @Required()
    type: number;
}