import { AllowTypes, Enum, Property, PropertyType, Required } from "@tsed/common";
import { Description } from "@tsed/swagger";

// meta stuff

export const GROUP_NAME_MAX_LENGTH = 32;

export const GROUP_NAME_MIN_LENGTH = 3;

/**
 * Maximum amount of groups a user can be in at once
 */
export const MAX_GROUPS = 100;
/**
 * Maximum amount of roles a group can have
 */
export const MAX_GROUP_ROLES = 32;
/**
 * The maximum rank value for a group roleset's rank
 */
export const MAX_RANK_VALUE = 255;
/**
 * The minimum rank value for a group roleset's rank
 */
export const MIN_RANK_VALUE = 1;

/**
 * The maximum length of the name of a group roleset
 */
export const ROLE_NAME_MAX_LENGTH = 32;
/**
 * The minimum length of the name of a group roleset
 */
export const ROLE_NAME_MIN_LENGTH = 1;

/**
 * The maximum length of the description of a group roleset
 */
export const ROLE_DESCRIPTION_MAX_LENGTH = 255;
/**
 * The minimum length of the description of a group roleset
 */
export const ROLE_DESCRIPTION_MIN_LENGTH = 0;

/**
 * The cost to create a group, in primary
 */
export const GROUP_CREATION_COST = 50;

export class GroupCreationFee {
    @Required()
    cost: number;
}

/**
 * Group Permissions Object
 */
export class groupPermissions {
    @Required()
    getWall: 1 | 0;
    @Required()
    postWall: 1 | 0;
    @Required()
    getShout: 1 | 0;
    @Required()
    postShout: 1 | 0;
    @Required()
    manage: 1 | 0;
}

export enum GroupMemberApprovalStatus {
    'true' = 1,
    'false' = 0
}

/**
 * Is a group locked (aka banned)?
 */
export enum groupStatus {
    locked = 1,
    ok = 0,
}


/**
 * Info about a group
 */
export class groupDetails {
    @PropertyType(Number)
    groupId: number;
    @PropertyType(Number)
    groupName: string;
    @PropertyType(String)
    groupDescription: string;
    @PropertyType(Number)
    groupOwnerUserId: number;
    @PropertyType(Number)
    groupIconCatalogId: number;
    @PropertyType(Number)
    groupMemberCount: number;
    @Required()
    @Enum(groupStatus)
    groupStatus: groupStatus;
    @Enum(GroupMemberApprovalStatus)
    groupMembershipApprovalRequired: GroupMemberApprovalStatus;
}

/**
 * Response from a Catalog Name from it's id
 */
export class MultiGetNames {
    /**
     * The Group's ID
     */
    @Required()
    @Description('The groups ID')
    groupId: number;
    /**
     * The Group's name
     */
    @Required()
    @Description('The groups name')
    groupName: string;
}
/**
 * Group Roleset Info
 */
export class roleInfo {
    /**
     * The ID
     */
    @Required()
    roleSetId: number;
    /**
     * The Name of the Role
     */
    @Required()
    name: string;
    /**
     * Short Description provided by a group admin
     */
    @Required()
    description: string;
    /**
     * The ID of the Group that owns this role
     */
    @Required()
    groupId: number;
    /**
     * The Role's Rank Value (0-255)
     */
    @Required()
    rank: number;
    /**
     * Permissions in the Group
     */
    @Required()
    permissions: groupPermissions;
}
/**
 * Group Funds Object
 */
export class GroupFunds {
    @Required()
    Primary: number;
    @Required()
    Secondary: number;
}

export interface groupMember {
    userId: number;
    roleSetId: number;
}

export class groupShout {
    @Description('UserId that made the shout')
    @PropertyType(Number)
    userId: number;
    @Description('groupId that made the shout')
    @PropertyType(Number)
    groupId: number;
    @PropertyType(String)
    shout: string;
    @PropertyType(String)
    date: string;
    @PropertyType(Number)
    thumbnailCatalogId: number;
}

export interface wall {
    wallPostId: number;
    groupId: number;
    userId: number;
    wallPost: string;
    date: object;
}

/**
 * Type of group ownership change
 */
export enum GroupOwnershipChangeType {
    'LeaveGroup' = 1,
    'ClaimOwnership' = 2,
    'TransferOwnership' = 3,
}

export class GroupOwnershipChangeEntry {
    @Required()
    @Description('userId who was affected by the change')
    userId: number;
    @Required()
    @Description('userId who performed the change')
    actorUserId: number;
    @Required()
    @Description('groupId affected')
    groupId: number;
    @Required()
    @Description('The type of ownership change')
    type: GroupOwnershipChangeType;
    @Required()
    createdAt: string;
}

export class GroupJoinRequest {
    @Required()
    groupId: number;
    @Required()
    userId: number;
}

export class GroupNameChangeEntry {
    @Required()
    moderationGroupNameId: number;
    @Required()
    userId: number;
    @Required()
    groupId: number;
    @Required()
    reason: string;
    @Required()
    oldName: string;
    @Required()
    newName: string;
    @Required()
    createdAt: string;
}

export class GroupStatusChangeEntry {
    @Required()
    moderationGroupStatusId: number;
    @Required()
    userId: number;
    @Required()
    groupId: number;
    @Required()
    reason: string;
    @Required()
    oldStatus: groupStatus;
    @Required()
    newStatus: groupStatus;
    @Required()
    createdAt: string;
}