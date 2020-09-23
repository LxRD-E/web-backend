/**
 * Imports
 */
import { currencyType } from './economy';
import { PropertyType, Required } from '@tsed/common';
import { Example, Description } from '@tsed/swagger';
/**
 * Enums
 */
/**
 * Category of Item
 */
export enum category {
    'Hat' = 1,
    'Shirt',
    'Pants',
    'Faces',
    'Gear',
    'Shoes',
    'TShirt',
    /**
     * Static Image Re-sized to square for group icons
     */
    'GroupIcon',
    /**
     * Head Model - Consists of OBJ
     */
    'Head',
}
export enum assetType {
    'Texture' = 0,
    'OBJ',
    'MTL',
}
export enum collectible {
    true = 1,
    false = 0,
}
export enum isForSale {
    true = 1,
    false = 0,
}
export enum moderatorStatus {
    'Ready' = 0,
    'Pending',
    'Moderated',
}
export enum searchCategory {
    'Featured' = 10,
    'Any' = 11,
    'Collectibles' = 20,
}
/**
 * Type of Creator for an item
 */
export enum creatorType {
    'User' = 0,
    'Group',
}
/**
 * Catalog Data from the catalog table
 */
export interface CatalogInfo {
    /**
     * The Catalog Item's Unique ID (unsigned int)
     */
    catalogId: number;
    /**
     * The name of the catalog item
     */
    catalogName: string;
    /**
     * The item's description
     */
    description: string;
    /**
     * The Price of the Catalog Item (unsigned int)
     */
    price: number;
    /**
     * The Average Sales Price of the Catalog item
     */
    averagePrice?: number;
    /**
     * The date the item was created
     */
    dateCreated: string;
    /**
     * The Type Of Currency the item sells for
     */
    currency: currencyType;
    /**
     * The Item's Category
     */
    category: category;
    /**
     * Is the item collectible?
     */
    collectible: collectible;
    /**
     * If the item is collectible, what is the maximum number of copies that can be sold before it goes offsale? Note that this value being anything other than 0 means the item is a unique collectible
     */
    maxSales: number;
    /**
     * Is the item for sale/can it be purchased new?
     */
    forSale: isForSale;
    /**
     * Is the item currently awaiting moderator approval?
     */
    status: moderatorStatus;
    /**
     * The Creator's User ID or Group ID
     */
    creatorId: number;
    /**
     * The type of creator
     */
    creatorType: creatorType;
    /**
     * The Original Creator of the Item
     */
    userId: number;
}
export interface CatalogAssetItem {
    assetId: number;
    dateCreated: string;
    assetType: assetType;
    fileName: string;
    fileType: 'png' | 'obj' | 'mtl' | 'jpg';
}
export interface FilesInterface {
    png: boolean | Buffer;
    jpg: boolean | Buffer;
    obj: boolean | Buffer;
    mtl: boolean | Buffer;
}
export class CatalogCreationSuccessResponse {
    @Required()
    @Example(true)
    success: true;
    @Required()
    @Description('the id of the catalogItem created')
    id: number;
}
export class CatalogItemComment {
    @Required()
    userId: number;
    @Required()
    date: string;
    @Required()
    comment: string;
    @Required()
    isDeleted: 0 | 1;
}
export class SearchResults {
    @Required()
    catalogId: number;
    @Required()
    catalogName: string;
    @Required()
    price: number;
    @Required()
    currency: currencyType;
    @Required()
    userId: number;
    @Required()
    collectible: collectible;
    @Required()
    maxSales: number | null;
    @PropertyType(Number)
    @Description('This will onl appear when category is collectible. Null if item has no sellers.')
    collectibleLowestPrice: number | null;
    @PropertyType(Number)
    @Description('This will only appear when category is collectible')
    averagePrice: number;
}
/**
 * catalog_comments
 */
export interface Comments {
    commentId: number;
    catalogId: number;
    userId: number;
    date: Record<string, any>;
    comment: string;
}
/**
 * Average Price Chart
 */
export interface ChartData {
    amount: number;
    date: Record<string, any>;
}

/**
 * Response from a Catalog Name from it's id
 */
export interface MultiGetNames {
    /**
     * The Catalog Item's ID
     */
    catalogId: number;
    /**
     * The catalog item's name
     */
    catalogName: string;
}

/**
 * Response from retrieving a thumbnail by the CatalogID
 */
export interface ThumbnailResponse {
    /**
     * The Catalog Item's ID
     */
    catalogId: number;
    /**
     * The URL
     */
    url: string;
}

export class LowestPriceCollectibleItems {
    catalogId: number;
    price: number | null;
}

export class ISortFilesResults {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    buffer: Buffer;
    size: number;
    extension: string;
    trueMime: string;
}
