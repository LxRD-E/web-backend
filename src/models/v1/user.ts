import * as Catalog from './catalog';
import * as Groups from './group';
import { Required, PropertyType } from '@tsed/common';
import { Example, Description } from '@tsed/swagger';
/**
 * Interfaces
 */

export interface UserIpAddress {
    userId: number;
    encryptedIpAddress: string;
    date: string;
    action: ipAddressActions;
};

/**
 * Interface of the users table
 */
export class UserInfo {
    /**
     * The user's ID. All ids are unsigned ints
     */
    @Required()
    userId: number;
    /**
     * The user's username
     */
    @Required()
    username: string;
    /**
     * The total count of password updates on a user's account. This is stored in the session as well, so that when the user updates their password from another session. If the session's passwordChanged count differs from the one in the database they will be logged out.
     */
    @Required()
    passwordChanged: number;
    /**
     * The balance of the user's first currency
     */
    @Required()
    primaryBalance: number;
    /**
     * The balance of the user's second currency
     */
    @Required()
    secondaryBalance: number;
    /**
     * The date that the user's membership expires
     * @deprecated
     */
    @Required()
    membership: Date;
    /**
     * The date that the user last recieved their daily currency
     */
    @Required()
    dailyAward: Date;
    /**
     * The user's status
     */
    @Required()
    status: string;
    /**
     * The blurb (aka description) of the user
     */
    @Required()
    blurb: string;
    /**
     * The date the user joined the website on
     */
    @Required()
    joinDate: Date;
    /**
     * The date the user last visited the website
     */
    @Required()
    lastOnline: Date;
    /**
     * The birthdate the user provided on sign up
     */
    @Required()
    birthDate: Date;
    /**
     * The theme the user has the website set to
     */
    @Required()
    theme: theme;
    /**
     * If the user has trading enabled or not
     */
    @Required()
    tradingEnabled: tradingEnabled;
    /**
     * The rank of the user in the staff system. Defaults to 0
     */
    @Required()
    staff: staff;
    /**
     * True if the user is banned
     */
    @Required()
    banned: banned;
    /**
     * User's Account Status
     */
    @Required()
    accountStatus: accountStatus;
    /**
     * The post count of the user in the forums
     */
    @Required()
    forumPostCount: number;
    /**
     * The user's forum signature
     */
    @PropertyType(String)
    forumSignature: string | null;
}

export interface PastUsernames {
    userNameId: number;
    username: string;
    userId: number;
    dateCreated: string;
}

/**
 * Interface of the user_avatar table
 */
export class UserAvatarItem {
    /**
     * The user's id
     */
    @Required()
    userId: number;
    /**
     * The Catalog ID
     */
    @Required()
    catalogId: number;
    /**
     * The Catalog Category Enum
     */
    @Required()
    type: number;
    /**
     * The Date the item was added
     */
    @Required()
    date: string;
}

/**
 * Interface of the user_avatarcolor table
 */
export class UserAvatarColor {
    /**
     * ID in the database
     */
    @Required()
    id: number;
    /**
     * User's ID
     */
    @Required()
    userid: number;
    /**
     * R Value of Legs
     */
    @Required()
    legr: number;
    /**
     * G Value of Legs
     */
    @Required()
    legg: number;
    /**
     * B Value of Legs
     */
    @Required()
    legb: number;
    /**
     * R Value of Head
     */
    @Required()
    headr: number;
    /**
     * G Value of Head
     */
    @Required()
    headg: number;
    /**
     * B Value of Head
     */
    @Required()
    headb: number;
    /**
     * R Value of Torso
     */
    @Required()
    torsor: number;
    /**
     * G Value of Torso
     */
    @Required()
    torsog: number;
    /**
     * B Value of Torso
     */
    @Required()
    torsob: number;
}
/**
 * Frienship Object
 */
export class Friendship {
    /**
     * The User Involved with the Friendship
     */
    @Required()
    userId: number;
    /**
     * The date the Friendship was estalished
     */
    @Required()
    date: string;
    /**
     * The status of the userId
     */
    @PropertyType(String)
    UserStatus?: string|null;
}
export interface FriendshipRequest {
    /**
     * User who requested
     */
    userId: number;
}
export class ForumInfo {
    @Required()
    postCount: number;
    @Required()
    permissionLevel: number;
    @PropertyType(String)
    signature: string|null;
}
/**
 * Response from a username from it's id
 */
export class MultiGetUsernames {
    /**
     * The User ID
     */
    @Required()
    userId: number;
    /**
     * The user's name
     */
    @Required()
    username: string;
}

/**
 * Response from retrieving a thumbnail by the UserID
 */
export class ThumbnailResponse {
    /**
     * The User's ID
     */
    @Required()
    userId: number;
    /**
     * The URL
     */
    @Required()
    url: string;
}
/**
 * Interface for Retrival of Multiple Users' Statuses
 */
export class UserStatus {
    @Required()
    userId: number;
    @Required()
    status: string|null;
    @Required()
    date: string;
}
/**
 * Friendship Status between Two Users
 */
export class FriendshipStatus {
    /**
     * Are the users friends?
     */
    @Description('Are the users friends?')
    @Required()
    areFriends: boolean;
    /**
     * Can you send a friend request to the user?
     */
    @Description('Can you send a friend request to the user?')
    @Required()
    canSendFriendRequest: boolean;
    /**
     * Can a friend request sent from the other user be accepted?
     */
    @Description('Can a friend request sent from the other user be accepted?')
    @Required()
    canAcceptFriendRequest: boolean;
    /**
     * Are you waiting for the other user to accept your friend request?
     */
    @Description('Are you waiting for the other user to accept your friend request?')
    @Required()
    awaitingAccept: boolean;
}
/**
 * Request made to Update Avatar Color
 */
export interface UserColorRequest {
    HeadRGB: number[];
    LegRGB: number[];
    TorsoRGB: number[];
}

export interface InsertAvatarColor extends UserAvatarColor {
    id: never;
}
/**
 * User Email Model
 */
export interface EmailModel {
    id: number;
    userId: number;
    verificationCode: string;
    status: emailVerificationType;
    date: string;
}
/**
 * User Inventory Table
 */
export class UserInventory {
    @Required()
    userInventoryId: number;
    @Required()
    catalogId: number;
    @Required()
    price: number;
    @Required()
    catalogName: string;
    @Required()
    collectible: Catalog.collectible;
    @Required()
    category: Catalog.category;
}
export class UserCollectibleInventory extends UserInventory {
    @Required()
    averagePrice: number;
}
/**
 * Full user inventory table
 */
export interface FullUserInventory extends UserInventory {
    userId: number;
}

/**
 * User Groups Table
 */
export class UserGroups extends Groups.groupDetails {
    @Required()
    groupStatus: never;
    /**
     * User's ID
     */
    @Required()
    userId: number;
    /**
     * ID of the user's Roleset in the group
     */
    @Required()
    userRolesetId: number;
    /**
     * Name of User's Role
     */
    @Required()
    userRolesetName: string;
    /**
     * Value of user's rank (1-255)
     */
    @Required()
    userRolsetRank: number;
}
export interface PasswordResetInfo {
    passwordResetId: number;
    userId: number;
    dateCreated: string;
    code: string;
}
/**
 * Enums
 */

/**
 * Is a user's email verified?
 */
export enum emailVerificationType {
    true = 1,
    false = 0,
}
/**
 * IP Address Action Types
 */
export enum ipAddressActions {
    'Login' = 0,
    'SignUp',
    'SignOut',
    'UnsuccessfulLoginWithCompletedCaptcha',
    'UnsuccessfulLoginWithoutCaptcha',
    'PurchaseOfItem',
    'TradeSent',
    'TradeCompleted',
    'PutItemForSale',
}
/**
 * Is a user banned?
 */
export enum banned {
    true = 1,
    false = 0,
}
/**
 * Is a user deleted?
 */
export enum accountStatus {
    'ok' = 0,
    'banned' = 1,
    'terminated' = 2,
    'deleted' = 3,
}
/**
 * The staff rank of a user. Default is 0
 */
export enum staff {
    false = 0,
    'Mod' = 1,
    'Admin' = 2,
    'Owner' = 3,
}
/**
 * Does a user have trading enabled?
 */
export enum tradingEnabled {
    true = 1,
    false = 0,
}
/**
 * The theme a user has the website set to
 */
export enum theme {
    'Light' = 0,
    'Dark' = 1,
}
/**
 * User Ban Status
 */
export enum banType {
    true = 1,
    false = 0,
}

export class SessionUserInfo {
    userId: number;
    username: string;
    passwordChanged: number;
    banned: banned;
    theme: theme;
    primaryBalance: number;
    secondaryBalance: number;
    staff: staff;
}

export class UserInfoResponse {
    @Required()
    userId: number;
    @Required()
    username: string;
    @PropertyType(String)
    status?: string|null;
    @Required()
    joinDate: string;
    @PropertyType(String)
    blurb?: string|null;
    @Required()
    lastOnline: string;
    @Required()
    banned: banned;
    @Required()
    membership: string;
    @Required()
    tradingEnabled: tradingEnabled;
    @Required()
    staff: staff;
    @Required()
    accountStatus: accountStatus;
}

export class UserAvatarResponse {
    @Required()
    @PropertyType(UserAvatarItem)
    avatar: UserAvatarItem[];
    @Required()
    @PropertyType(UserAvatarColor)
    color: UserAvatarColor[];
}

export class UserFriendsResponse {
    @Required()
    total: number;
    @Required()
    @PropertyType(Friendship)
    friends: Friendship[];
}

export class SoloThumbnailResponse {
    @Required()
    @Example(true)
    success: boolean;
    @Required()
    url: string;
}

export class UserInventoryResponse { 
    @Required()
    total: number; 
    @Required()
    @PropertyType(UserInventory)
    items: UserInventory[] 
}

export class UserCollectibleInventoryResponse { 
    @Required()
    total: number; 
    @Required()
    @PropertyType(UserCollectibleInventory)
    items: UserCollectibleInventory[] 
}

export class UserGroupsResponse {
    @Required()
    total: number;
    @Required()
    @PropertyType(UserGroups)
    groups: UserGroups[];
}

export class SearchResult {
    @Required()
    userId: number;
    @Required()
    username: string;
    @PropertyType(String)
    status: string|null;
    @Required()
    joinDate: string;
    @Required()
    lastOnline: string;
    @Required()
    staff: staff;
}