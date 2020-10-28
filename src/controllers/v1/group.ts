/**
 * Imports
 */
// Express
import moment = require('moment');
import crypto = require('crypto');
// Errors
// Interfaces
import * as model from '../../models/models';
import * as middleware from '../../middleware/middleware';
// tsed
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    Patch,
    PathParams,
    Post,
    Put,
    QueryParams,
    Required,
    Use,
    UseBefore,
    UseBeforeEach
} from '@tsed/common';
import { MultipartFile } from "@tsed/multipartfiles";
import { Description, Returns, ReturnsArray, Summary } from '@tsed/swagger';
import { YesAuth } from '../../middleware/Auth';
import { csrf } from '../../dal/auth';

import controller from '../controller';

/**
 * Groups Controller
 */
@Controller('/group')
export class GroupsController extends controller {

    constructor() {
        super();
    }
    /**
     * Get group info if exists. Sets view and returns false if not
     * @param groupId 
     */
    private async getGroupInfo(groupId: number): Promise<model.group.groupDetails> {
        // Verify Group Exists and Isn't Deleted
        let groupInfo: model.group.groupDetails;
        try {
            groupInfo = await this.group.getInfo(groupId);
        } catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        if (groupInfo.groupStatus === model.group.groupStatus.locked) {
            throw new this.BadRequest('InvalidGroupId');
        }
        return groupInfo;
    }

    @Get('/metadata/creation-fee')
    @Summary('Get the cost to create a group')
    @Returns(200, { type: model.group.GroupCreationFee })
    public getGroupCreationFee() {
        return {
            cost: model.group.GROUP_CREATION_COST,
        };
    }

    @Get('/metadata/manage')
    @Summary('Get group manage metadata')
    public getGroupManageRules() {
        return {
            maxRoles: model.group.MAX_GROUP_ROLES,
            rank: {
                min: model.group.MIN_RANK_VALUE,
                max: model.group.MAX_RANK_VALUE,
            },
            roleName: {
                minLength: model.group.ROLE_NAME_MIN_LENGTH,
                maxLength: model.group.ROLE_NAME_MAX_LENGTH,
            },
            roleDescription: {
                minLength: model.group.ROLE_DESCRIPTION_MIN_LENGTH,
                maxLength: model.group.ROLE_DESCRIPTION_MAX_LENGTH,
            },
            rolePermissions: [
                {
                    id: 'getWall',
                    name: 'View Group Wall',
                },
                {
                    id: 'postWall',
                    name: 'Post to Group Wall',
                },
                {
                    id: 'getShout',
                    name: 'View Group Shout',
                },
                {
                    id: 'postShout',
                    name: 'Post to Group Shout',
                },
                {
                    id: 'manage',
                    name: 'Manage the Group',
                }
            ],
        };
    }

    /**
     * Get Names of Multiple Catalog Items at once. Invalid users are filtered out
     * @param ids CSV of User IDs
     */
    @Get('/names')
    @Summary('Multi-get group names')
    @ReturnsArray(200, { type: model.group.MultiGetNames })
    @Returns(400, { type: model.Error, description: 'InvalidIds: One or more IDs are invalid\n' })
    @Use(middleware.ConvertIdsToCsv)
    public async multiGetNames(
        @QueryParams('ids') ids: number[]
    ) {
        return await this.group.MultiGetNamesFromIds(ids);
    }
    /**
     * Get the Authenticated User's Role in a Group
     */
    private async getAuthRole(userData: model.user.UserInfo | undefined = undefined, groupId: number): Promise<model.group.roleInfo> {
        // Grab Roleset Data
        let role;
        try {
            if (!userData) {
                role = await this.group.getRoleSetByRank(groupId, 0);
            } else {
                role = await this.group.getUserRole(groupId, userData.userId);
            }
        } catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        return role;
    }

    @Get('/:groupId/info')
    @Summary('Get group info')
    @Description('This endpoint is a bit exceptional. If the groupStatus is locked (1), it will only return { groupStatus: 1 } but if it is not locked, it will return all group info')
    @Returns(200, { type: model.group.groupDetails })
    @Returns(400, { type: model.Error, description: 'InvalidGroupId: invalid id\n' })
    public async getInfo(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('groupId', Number) groupId: number
    ) {
        try {
            const groupInfo = await this.group.getInfo(groupId);
            if (!userInfo || userInfo && userInfo.staff < 1) {
                if (groupInfo.groupStatus === model.group.groupStatus.locked) {
                    return {
                        groupStatus: groupInfo.groupStatus,
                    };
                }
            }
            return groupInfo;
        } catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
    }


    @Get('/:groupId/roles')
    @Summary('Get group roles')
    @Returns(400, { type: model.Error, description: 'InvalidGroupId: \n' })
    @ReturnsArray(200, { type: model.group.roleInfo })
    @Use(middleware.group.ValidateGroupId)
    public async getRoles(
        @PathParams('groupId', Number) groupId: number
    ): Promise<model.group.roleInfo[]> {
        return await this.group.getRoles(groupId);
    }

    @Get('/:groupId/role')
    @Summary('Get the authenticated users role in a group. If not authenticated, returns guest info')
    @Returns(200, { type: model.group.roleInfo })
    @Returns(400, { type: model.Error, description: 'InvalidGroupId: \n' })
    public async getRole(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number
    ): Promise<model.group.roleInfo> {
        // Verify Group Exists but ignore if locked
        try {
            await this.group.getInfo(groupId);
        } catch (e) {
            if (e && e.message === 'InvalidGroupId') {
                throw new this.BadRequest('InvalidGroupId');
            }
            throw e;
        }
        // Grab Role
        if (!userInfo) {
            return await this.group.getRoleSetByRank(groupId, 0);
        }
        return await this.group.getUserRole(groupId, userInfo.userId);
    }

    @Get('/:groupId/members/:roleSetId')
    @Summary('Get the users of the {roleSetId}')
    @Use(middleware.group.ValidateGroupId, middleware.ValidatePaging)
    public async getMembers(
        @PathParams('groupId', Number) groupId: number,
        @PathParams('roleSetId', Number) roleSetId: number,
        @QueryParams('offset', Number) offset: number,
        @QueryParams('limit', Number) limit: number,
        @QueryParams('sort', String) sort: any
    ) {
        // Verify role exists
        try {
            await this.group.getRoleById(roleSetId);
        } catch (e) {
            if (e && e.message === 'InvalidRolesetId')
                throw new this.BadRequest('InvalidRolesetId');
            throw e;
        }
        // Grab Role
        const members = await this.group.getMembers(groupId, roleSetId, offset, limit, sort);
        const membersCount = await this.group.countMembers(groupId, roleSetId);
        return {
            "total": membersCount,
            "members": members,
        };
    }

    /**
     * Get a group's shout
     */
    @Get('/:groupId/shout')
    @Summary('Get group\'s current shout')
    @Use(middleware.group.ValidateGroupId)
    @Returns(200, { type: model.group.groupShout })
    public async getShout(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number
    ) {
        const role = await this.getAuthRole(userInfo, groupId);

        if (role.permissions.getShout) {
            const shout = await this.group.getShout(groupId);
            if (!shout) {
                return {};
            }
            return shout;
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    /**
     * Get a group's wall
     */
    @Get('/:groupId/wall')
    @Summary('Get group wall')
    @Use(middleware.group.ValidateGroupId, middleware.ValidatePaging)
    public async getWall(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @QueryParams('offset', Number) offset: number,
        @QueryParams('limit', Number) limit: number,
        @QueryParams('sort', String) sort: any
    ) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.getWall) {
            return await this.group.getWall(groupId, offset, limit, sort);
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    @Get('/:groupId/funds')
    @Summary('Get group funds (User must have manage permission)')
    @Use(middleware.group.ValidateGroupId)
    @Returns(200, { type: model.group.GroupFunds, description: 'Group Funds' })
    public async getFunds(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
    ) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            return await this.group.getGroupFunds(groupId);
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    @Put('/:groupId/wall')
    @Summary('Create a wall post')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async createWallPost(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @BodyParams('content', String) wallPostContent: string
    ) {
        // Wall post content validation
        if (wallPostContent.length > 255 || wallPostContent.length < 3) {
            throw new this.BadRequest('InvalidWallPost');
        }
        // Grab roleset
        const role = await this.getAuthRole(userInfo, groupId);
        // Roleset validation
        if (role.permissions.postWall) {
            await this.group.createWallPost(groupId, userInfo.userId, wallPostContent);
            return { success: true };
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    @Delete('/:groupId/wall/:wallPostId')
    @Summary('Delete a wall post')
    @Use(csrf, YesAuth)
    public async deleteWallPost(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @PathParams('wallPostId', Number) wallPostId: number
    ) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            await this.group.deleteWallPost(groupId, wallPostId);
            return { success: true };
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    @Get('/search')
    @ReturnsArray(200, { type: model.group.groupDetails })
    @Use(middleware.ValidatePaging)
    public async search(
        @QueryParams('name', String) query: string,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 48
    ) {
        if (query && query.length > 32) {
            throw new this.BadRequest('InvalidQuery');
        }
        return await this.group.search(offset, limit, query);
    }

    @Patch('/:groupId/approval-required')
    @Summary('Set a group\'s approval required status')
    @Description('Currently requires ownership permission but may be downgraded to Manage in the future')
    @Returns(400, { type: model.Error, description: 'InvalidGroupPermissions: You must be owner to apply this change\nInvalidApprovalStatus: approvalStatus must be 0 or 1\n' })
    @Use(csrf, YesAuth)
    public async updateGroupApprovalStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @Required()
        @BodyParams('approvalStatus', Number) approvalStatus: number,
    ) {
        // Verify Group Exists
        const groupInfo = await this.getGroupInfo(groupId);
        if (groupInfo.groupOwnerUserId !== userInfo.userId) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        // Verify approvalStatus is valid
        if (approvalStatus !== 1 && approvalStatus !== 0) {
            throw new this.BadRequest('InvalidApprovalStatus');
        }
        // Update group approval status
        await this.group.updateGroupApprovalRequiredStatus(groupId, approvalStatus);
        // Return success
        return {
            success: true,
        };
    }

    @Put('/:groupId/claim')
    @Summary('Claim a group with no owner')
    @Use(csrf, YesAuth)
    public async claimOwnership(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number
    ) {
        // Verify Group Exists
        const groupInfo = await this.getGroupInfo(groupId);
        if (groupInfo.groupOwnerUserId !== 0) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        // Get Role
        const role = await this.getAuthRole(userInfo, groupId);
        // Cannot be a guest
        if (role.rank === 0) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        let roleset;
        try {
            roleset = await this.group.getRoleSetByRank(groupId, 255);
        } catch (e) {
            // Invalid Role
            throw new this.BadRequest('InvalidRolesetId');
        }
        // Join Group
        // Update group_members
        await this.group.updateUserRolesetInGroup(groupId, roleset.roleSetId, userInfo.userId);
        // Update Owner
        await this.group.updateGroupOwner(groupId, userInfo.userId);
        // Record claim
        await this.group.recordGroupOwnershipChange(groupId, model.group.GroupOwnershipChangeType.ClaimOwnership, userInfo.userId, userInfo.userId);
        // Return Success
        return { success: true };
    }

    @Put('/:groupId/membership')
    @Summary('Join a group')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async join(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number
    ) {
        // Get Role
        const role = await this.getAuthRole(userInfo, groupId);
        // Must be a guest in this group to join it
        if (role.rank !== 0) {
            throw new this.Conflict('AlreadyGroupMember');
        }
        // Count current groups
        const groupCount = await this.user.countGroups(userInfo.userId);
        if (groupCount >= model.group.MAX_GROUPS) {
            throw new this.BadRequest('TooManyGroups');
        }
        const roleset = await this.group.getRoleForNewMembers(groupId);
        // Basic exploit checking
        if (roleset.rank >= 255) {
            throw new this.BadRequest('InvalidRolesetId');
        }
        // Check if user is a pending member
        let isPendingMember = await this.group.isUserPendingToJoinGroup(groupId, userInfo.userId);
        if (isPendingMember) {
            throw new this.Conflict('GroupJoinRequestPending');
        }
        // Check if group approval is required
        let isApprovalRequired = await this.group.doesGroupRequireApprovalForNewMembers(groupId);
        if (isApprovalRequired) {
            // Insert user to pending table
            await this.group.insertPendingGroupMember(groupId, userInfo.userId);
            // Return success, with approval required
            return {
                success: true,
                doesUserRequireApproval: true,
            };
        }
        // Role is valid
        await this.group.addUserToGroup(groupId, userInfo.userId, roleset.roleSetId);
        return { success: true, doesUserRequireApproval: false };
    }

    @Delete('/:groupId/membership')
    @Summary('Leave a group, or remove yourself from a group join request')
    @Use(csrf, YesAuth)
    public async leave(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number
    ) {
        // Verify group exists, ignoring locked state
        try {
            await this.group.getInfo(groupId);
        } catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        // Get Role
        const role = await this.getAuthRole(userInfo, groupId);
        // Must not be a guest
        if (role.rank === 0) {
            // Maybe user is pending in group? Lets check
            let pendingUser = await this.group.isUserPendingToJoinGroup(groupId, userInfo.userId);
            if (pendingUser) {
                // Delete pending request
                await this.group.removeUserFromPendingGroupJoins(groupId, userInfo.userId);
                // Return success
                return {
                    success: true,
                };
            }
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        // Remove from group
        if (role.rank === 255) {
            // Update owner to 0
            await this.group.updateGroupOwner(groupId, 0);
            // Record ownership change
            await this.group.recordGroupOwnershipChange(groupId, model.group.GroupOwnershipChangeType.LeaveGroup, userInfo.userId, userInfo.userId);
        }
        await this.group.removeUserFromGroup(groupId, userInfo.userId);
        return { success: true };
    }

    @Get('/:groupId/ownership-changes')
    @Summary('Get an array of group ownership changes for the {groupId}')
    @Description('Requester must have manage permission')
    @Use(YesAuth, middleware.group.ValidateGroupId)
    @ReturnsArray(200, { type: model.group.GroupOwnershipChangeEntry })
    public async getGroupOwnershipChanges(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('offset', Number) offset: number = 0,
    ) {
        // First, make sure requester has manage permissions
        // Grab role of requester
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            // user is not authorized
            throw new this.BadRequest('InvalidPermissions');
        }
        // Return results
        return await this.group.getGroupOwnershipChanges(groupId, limit, offset);
    }

    @Get('/:groupId/join-requests')
    @Summary('Get a page of group join requests')
    @Description('Requester must have manage permission')
    @Use(YesAuth, middleware.group.ValidateGroupId)
    @ReturnsArray(200, { type: model.group.GroupJoinRequest })
    public async getJoinRequests(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('offset', Number) offset: number = 0,
    ) {
        // First, make sure requester has manage permissions
        // Grab role of requester
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            // user is not authorized
            throw new this.BadRequest('InvalidPermissions');
        }
        // Grab result
        return await this.group.getPendingMembers(groupId, offset, limit);
    }

    /**
     * Accept a join request
     * @param userInfo 
     * @param groupId the groupId of the group
     * @param userId the userId to accept into the group
     */
    @Post('/:groupId/join-request')
    @Summary('Approve a join request')
    @Description('This will give the {userId} the lowest rank possible in the {groupId}. Requester must have manage permission')
    @Returns(400, { type: model.Error, description: 'InvalidPermissions: Requester must have manage permission\nInvalidJoinRequest: Join request does not exist\nTooManyGroups: userId is in too many groups. Request has been deleted\nInvalidRolesetId: Unknown\n' })
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async approveJoinRequest(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @BodyParams('userId', Number) userId: number,
    ) {
        // First, make sure requester has manage permissions
        // Grab role of requester
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            // user is not authorized
            throw new this.BadRequest('InvalidPermissions');
        }
        // Make sure join request exists
        let joinRequestExists = await this.group.isUserPendingToJoinGroup(groupId, userId);
        if (!joinRequestExists) {
            // Error
            throw new this.BadRequest('InvalidJoinRequest');
        }

        // Grab role of user to approve
        const roleOfMemberToApprove = await this.group.getUserRole(groupId, userId);
        // Must be a guest in this group to join it
        if (roleOfMemberToApprove.rank !== 0) {
            // Somehow user is already in group? Delete request and return success
            await this.group.removeUserFromPendingGroupJoins(groupId, userId);
            return {
                success: true,
            };
        }
        // Count current groups
        const groupCount = await this.user.countGroups(userId);
        if (groupCount >= model.group.MAX_GROUPS) {
            // Too many groups, so remove join request
            await this.group.removeUserFromPendingGroupJoins(groupId, userId);
            throw new this.BadRequest('TooManyGroups');
        }
        // Get the roleset for new members
        const roleSetForNewMembers = await this.group.getRoleForNewMembers(groupId);
        // Basic exploit checking
        if (roleSetForNewMembers.rank >= 255) {
            throw new this.BadRequest('InvalidRolesetId');
        }
        // Role is valid, so add to group
        await this.group.addUserToGroup(groupId, userId, roleSetForNewMembers.roleSetId);
        // Delete join request
        await this.group.removeUserFromPendingGroupJoins(groupId, userId);
        // Return success
        return {
            success: true,
        };
    }

    @Delete('/:groupId/join-request')
    @Summary('Decline a join request')
    @Description('Requester must have manage permisison')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    @Returns(400, { type: model.Error, description: 'InvalidGroupId: Group Id is invalid\nInvalidPermissions: Requester must have manage permission\nInvalidJoinRequest: Join request does not exist\n' })
    @Returns(409, { type: model.Error, description: 'UserAlreadyInGroup: User is already a member of the group. Request has been deleted, but they will not be removed from the group\n' })
    public async declineJoinRequest(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @BodyParams('userId', Number) userId: number,
    ) {
        // First, make sure requester has manage permissions
        // Grab role of requester
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            // user is not authorized
            throw new this.BadRequest('InvalidPermissions');
        }
        // Make sure join request exists
        let joinRequestExists = await this.group.isUserPendingToJoinGroup(groupId, userId);
        if (!joinRequestExists) {
            // Error
            throw new this.BadRequest('InvalidJoinRequest');
        }

        // Grab role of user to decline
        const roleOfMemberToDecline = await this.group.getUserRole(groupId, userId);
        // Must be a guest in this group to join it
        if (roleOfMemberToDecline.rank !== 0) {
            // Somehow user is already in group? Delete request and error
            await this.group.removeUserFromPendingGroupJoins(groupId, userId);
            throw new this.Conflict('UserAlreadyInGroup');
        }
        // Delete join request
        await this.group.removeUserFromPendingGroupJoins(groupId, userId);
        // Return success
        return {
            success: true,
        };
    }

    @Delete('/:groupId/member/:userId')
    @Summary('Remove a user from a group')
    @Description('Requester must be owner of group')
    @Returns(400, { type: model.Error, description: 'CannotKickOwner: The owner cannot kick theirself\nInvalidGroupPermissions: Only the owner can kick members\nUserNotInGroup: User is not a member of this group\n' })
    @Use(csrf, YesAuth)
    public async removeUserFromGroup(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @PathParams('userId', Number) userId: number,
    ) {
        // Verify Group Exists & requester is owner
        const groupInfo = await this.getGroupInfo(groupId);
        if (groupInfo.groupOwnerUserId !== userInfo.userId) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        // Confirm user is not owner
        if (userId === userInfo.userId) {
            throw new this.BadRequest('CannotKickOwner');
        }
        // Confirm user is in group
        let inGroup = await this.group.getUserRole(groupId, userId);
        if (inGroup.rank === 0) {
            throw new this.BadRequest('UserNotInGroup');
        }
        // Delete user
        await this.group.removeUserFromGroup(groupId, userId);
        // Return success
        return {
            success: true,
        }
    }

    @Patch('/:groupId/role/:roleSetId')
    @Summary('Update a roleset')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async updateRoleset(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @PathParams('roleSetId', Number) roleSetId: number,
        @BodyParams('rank', Number) rank: number,
        @BodyParams('name', String) name: string,
        @BodyParams('description', String) description: string,
        @BodyParams('permissions', model.group.groupPermissions) permissions: model.group.groupPermissions
    ) {
        if (!rank || rank > 255 || rank <= 0) {
            throw new this.BadRequest('InvalidGroupRank');
        }
        // Validate Name
        if (!name || name.length > 32 || name.length < 3) {
            throw new this.BadRequest('InvalidRolesetName');
        }
        // Validate Description
        if (!description || description.length > 128) {
            throw new this.BadRequest('InvalidRolesetDescription');
        }
        const role = await this.getAuthRole(userInfo, groupId);

        if (role.permissions.manage) {
            // Verify Permissions
            const permissionsAreValid = this.group.verifyPermissions(permissions);
            if (!permissionsAreValid) {
                throw new this.BadRequest('InvalidRolesetPermissions');
            }
            // Verify Roleset
            // Check if rank is already taken
            const takenRoleset = await this.group.getRoleSetByRank(groupId, rank);
            if (takenRoleset.roleSetId !== roleSetId) {
                throw new this.Conflict('RankIdIsTaken');
            }

            // Grab Roleset to Edit
            const roleset = await this.group.getRoleById(roleSetId);
            if (roleset.groupId !== groupId) {
                throw new this.BadRequest('InvalidGroupId');
            }
            // Can only modify rolesets of ranks below their current rank
            if (roleset.rank >= role.rank && roleset.rank !== 255) {
                throw new this.BadRequest('InvalidGroupPermissions');
            }
            // You cannot modify perms of guest or owner roles
            if (roleset.rank === 0) {
                throw new this.BadRequest('InvalidRolesetId');
            }
            // If editing owner
            if (roleset.rank === 255) {
                // Set all perms to true
                permissions.getShout = 1;
                permissions.postShout = 1;
                permissions.getWall = 1;
                permissions.postWall = 1;
                permissions.manage = 1;
                rank = 255;
                if (role.rank !== 255) {
                    throw new this.BadRequest('InvalidGroupPermissions');
                }
            } else {
                // New rank value cannot be the same or higher than authenticated user's rank
                if (role.rank <= rank || rank > 255 || rank <= 0) {
                    throw new this.BadRequest('InvalidRank');
                }
            }
            // Update
            await this.group.updateRoleset(roleSetId, name, description, rank, permissions);
            return {};
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    @Put('/:groupId/role')
    @Summary('Create a roleset')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async createRoleset(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @BodyParams('rank', Number) rank: number,
        @BodyParams('name', String) name: string,
        @BodyParams('description', String) description: string,
        @BodyParams('permissions', model.group.groupPermissions) permissions: model.group.groupPermissions
    ) {
        if (!rank || rank > model.group.MAX_RANK_VALUE || rank <= model.group.MIN_RANK_VALUE) {
            throw new this.BadRequest('InvalidGroupRank');
        }
        // Validate Name
        if (!name || name.length > model.group.ROLE_NAME_MAX_LENGTH || name.length < model.group.ROLE_NAME_MIN_LENGTH) {
            throw new this.BadRequest('InvalidRolesetName');
        }
        // Validate Description
        if (!description || description.length > model.group.ROLE_DESCRIPTION_MAX_LENGTH) {
            throw new this.BadRequest('InvalidRolesetDescription');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            // Verify Permissions
            const permissionsAreValid = this.group.verifyPermissions(permissions);
            if (!permissionsAreValid) {
                throw new this.BadRequest('InvalidRolesetPermissions');
            }
            // Verify Roleset
            // Max Rolesets Check
            const countRoles = await this.group.getRoles(groupId);
            if (countRoles.length >= model.group.MAX_GROUP_ROLES) {
                throw new this.BadRequest('TooManyRolesets');
            }
            // Check for Duplicate Rank
            let exists: any = false;
            try {
                exists = await this.group.getRoleSetByRank(groupId, rank);
            } catch {

            }
            if (exists) {
                throw new this.BadRequest('RankAlreadyExists');
            }
            // New rank value cannot be the same or higher than authenticated user's rank
            if (role.rank <= rank || rank >= 255 || rank <= 0) {
                throw new this.BadRequest('InvalidGroupRank');
            }
            // Create
            let id = await this.group.createRoleset(groupId, name, description, rank, permissions);
            return {
                success: true,
                roleSetId: id,
            };
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    /**
     * Delete a Roleset
     * @param groupId 
     * @param roleSetId 
     */
    @Delete('/:groupId/roleset/:roleSetId')
    @Summary('Delete a roleset. Cannot contain members, else will error')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async deleteRoleset(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @PathParams('roleSetId', Number) roleSetId: number
    ) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            // Grab Roleset to Edit
            const roleset = await this.group.getRoleById(roleSetId);
            if (roleset.groupId !== groupId) {
                throw new this.Conflict('InvalidGroupId');
            }
            // Verify It isn't lowest possible role
            const roleOnJoin = await this.group.getRoleForNewMembers(groupId);
            // If it is equal then...
            if (roleOnJoin.roleSetId === roleset.groupId) {
                throw new this.Conflict('CannotDeleteFirstRoleInGroup');
            }
            // Can only delete rolesets of ranks below their current rank
            if (roleset.rank >= role.rank) {
                throw new this.Conflict('InvalidGroupPermissions');
            }
            // You cannot delete guest or owner roles
            if (roleset.rank === 0 || roleset.rank === 255) {
                throw new this.Conflict('InvalidRolesetId');
            }
            // Confirm roleset is empty
            const members = await this.group.getMembers(groupId, roleSetId, 0, 1, 'asc');
            if (members.length > 0) {
                throw new this.Conflict('RolesetHasMembers');
            }
            // Delete Roleset
            await this.group.deleteRoleset(roleset.roleSetId);
            return {};
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    /**
     * Update a user's Role in a Group
     * @param groupId 
     * @param userId 
     * @param roleSetId 
     */
    @Patch('/:groupId/member/:userId')
    @Summary('Update a users role in a group')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async updateUserRole(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @Required()
        @PathParams('userId', Number) userId: number,
        @Required()
        @BodyParams('role', Number) roleSetId: number
    ) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            // Grab Roleset to Edit
            let roleset;
            try {
                roleset = await this.group.getRoleById(roleSetId);
            } catch (e) {
                throw new this.Conflict('InvalidRolesetId');
            }
            if (roleset.groupId !== groupId) {
                throw new this.Conflict('InvalidGroupId');
            }
            // Can only rank users to ranks below their current rank
            if (roleset.rank >= role.rank) {
                throw new this.Conflict('InvalidRolesetId');
            }
            // You rank users to guest or owner
            if (roleset.rank === 0 || roleset.rank === 255) {
                throw new this.Conflict('InvalidRolesetId');
            }
            // Grab Current Role of User to Rank
            let userCurrentRole;
            try {
                userCurrentRole = await this.group.getUserRole(groupId, userId);
            } catch (e) {
                throw new this.Conflict('UserNotInGroup');
            }
            if (userCurrentRole.rank === 255 || userCurrentRole.rank === 0 || userCurrentRole.rank >= role.rank) {
                throw new this.Conflict('CannotRankUser');
            }
            // Update Role
            await this.group.updateUserRolesetInGroup(groupId, roleSetId, userId);
            return {};
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    /**
     * Update a Group's Description
     * @param groupId 
     * @param newDescription 
     */
    @Patch('/:groupId/description')
    @Summary('Update group description')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async updateDescription(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @Required()
        @BodyParams('description', String) newDescription: string
    ) {
        // Validate Description
        if (!newDescription || newDescription.length >= 512) {
            throw new this.BadRequest('InvalidGroupDescription');
        }
        const role = await this.getAuthRole(userInfo, groupId);

        if (role.permissions.manage) {
            await this.group.updateDescription(groupId, newDescription);
            return ({
                'success': true,
            });
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    /**
     * Update a Group's Shout
     * @param groupId 
     * @param newShout 
     */
    @Patch('/:groupId/shout')
    @Summary('Update group shout')
    @Use(csrf, YesAuth, middleware.group.ValidateGroupId)
    public async updateShout(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @Required()
        @BodyParams('shout', String) newShout: string
    ) {
        // Validate Shout
        if (!newShout || newShout.length > 255 || newShout.length < 3) {
            throw new this.BadRequest('InvalidGroupShout');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            let latestShout = await this.group.getShout(groupId);
            if (!latestShout || latestShout && moment().isSameOrAfter(moment(latestShout.date).add(1, 'minutes'))) {
                await this.group.updateShout(groupId, userInfo.userId, newShout);
                return ({
                    'success': true,
                });
            } else {
                throw new this.BadRequest('ShoutCooldown');
            }
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    @Patch('/:groupId/icon')
    @Summary('Update group icon')
    @Use(csrf, YesAuth)
    public async updateIcon(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('groupId', Number) groupId: number,
        @MultipartFile() multerFiles: Express.Multer.File[]
    ) {
        const groupInfo = await this.getGroupInfo(groupId);
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            // Files
            let sorted = await this.catalog.sortFilesSimple(multerFiles);
            let fileToUse: Buffer | undefined = undefined;
            let file = sorted[0];
            if (!file) {
                throw new this.BadRequest('NoFilesSpecified');
            }
            if (file.trueMime !== 'image/gif' && file.trueMime !== 'image/png' && file.trueMime !== 'image/jpeg') {
                throw new this.BadRequest('NoFilesSpecified');
            }
            fileToUse = file.buffer;
            // Upload Files
            const groupIconId = await this.catalog.createUserItem(userInfo.userId, groupInfo.groupName, 'Group Icon', model.catalog.isForSale.false, model.catalog.category.GroupIcon, 0, model.economy.currencyType.primary, model.catalog.collectible.false);
            // Update Group Icon Id
            await this.group.updateGroupIconId(groupInfo.groupId, groupIconId);
            // crop image (and confirm the file *is* a valid image)
            let buffer = await this.group.cropGroupImage(fileToUse);
            // Render Icon
            const renderIcon = async () => {
                try {
                    // upload
                    await this.catalog.upload(file.extension as any, groupIconId, fileToUse as Buffer);
                    await this.catalog.createCatalogAsset(groupIconId, userInfo.userId, model.catalog.assetType.Texture, groupIconId.toString(), 'png');
                    console.log('uploaded. starting render in 100ms');
                    // generate random name for group icon
                    let randomName = crypto.randomBytes(48).toString('hex');
                    // grab url
                    let url = 'https://cdn.blockshub.net/thumbnails/' + randomName;
                    // upload group icon
                    await this.ad.uploadGeneralThumbnail(randomName, buffer.image, buffer.mime);
                    // const json = await this.catalog.generateAvatarJsonFromCatalogIds(groupIconId, [groupIconId]);
                    // const url = await this.avatar.renderAvatar('group', json);
                    // Delete Old Icon(s)
                    await this.catalog.deleteThumbnail(groupIconId);
                    // Upload New
                    await this.catalog.uploadThumbnail(groupIconId, url);
                } catch (e) {
                    console.error(e);
                }
            };
            renderIcon();

            // OK
            return { success: true };
        } else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }

    /**
     * Create a Group
     */
    @Post('/create')
    @Summary('Create a group')
    @Use(csrf, YesAuth)
    public async create(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('name', String) name: string,
        @Required()
        @MultipartFile() multerFiles: Express.Multer.File[],
        @Required()
        @BodyParams('description', String) description: string
    ) {
        const userData = userInfo;
        if (!name || name.length < 3 || name.length > 32) {
            throw new this.BadRequest('InvalidGroupName');
        }
        if (!description) {
            description = "";
        }
        if (description && description.length > 512) {
            throw new this.BadRequest('InvalidGroupDescription');
        }
        // Verify groups count
        const groupCount = await this.user.countGroups(userData.userId);
        if (groupCount >= model.group.MAX_GROUPS) {
            throw new this.BadRequest('TooManyGroups');
        }
        // Check balance
        const balance = userData.primaryBalance;
        if (balance < model.group.GROUP_CREATION_COST) {
            throw new this.BadRequest('NotEnoughCurrency');
        }
        // Create Group
        let groupId: number;
        try {
            groupId = await this.group.create(name, description, userData.userId, 0);
        } catch (e) {
            if (e.code && e.code === "ER_DUP_ENTRY") {
                throw new this.BadRequest('GroupNameTaken');
            }
            throw e;
        }
        // Create Roles
        // Guest
        await this.group.createRoleset(groupId, 'Guest', 'A Guest User', 0, {
            'getShout': 0,
            'postShout': 0,
            'getWall': 0,
            'postWall': 0,
            'manage': 0,
        });
        // Member
        await this.group.createRoleset(groupId, 'Member', 'A Group Member', 1, {
            'getShout': 1,
            'postShout': 0,
            'getWall': 1,
            'postWall': 0,
            'manage': 0,
        });
        // Owner
        await this.group.createRoleset(groupId, 'Owner', 'The Group Owner', 255, {
            'getShout': 1,
            'postShout': 1,
            'getWall': 1,
            'postWall': 1,
            'manage': 1,
        });
        // Grab Owner ID
        const ownerRolesetId = await this.group.getRoleSetByRank(groupId, 255);
        // Add User to Group
        await this.group.addUserToGroup(groupId, userData.userId, ownerRolesetId.roleSetId);
        let groupIconCatalogId = await this.catalog.createGroupItem(groupId, userData.userId, name, 'Group Icon', model.catalog.isForSale.false, model.catalog.category.GroupIcon, 0, model.economy.currencyType.primary, model.catalog.collectible.false, 0, model.catalog.moderatorStatus.Pending);

        // Files
        let sorted = await this.catalog.sortFilesSimple(multerFiles);
        let fileToUse: Buffer | undefined = undefined;
        let file = sorted[0];
        if (!file) {
            throw new this.BadRequest('NoFilesSpecified');
        }
        if (file.trueMime !== 'image/gif' && file.trueMime !== 'image/png' && file.trueMime !== 'image/jpeg') {
            throw new this.BadRequest('NoFilesSpecified');
        }
        fileToUse = file.buffer;
        // crop image (and confirm the file *is* a valid image)
        let buffer = await this.group.cropGroupImage(fileToUse);
        // Render Icon
        const renderIcon = async () => {
            try {
                // upload
                await this.catalog.upload(file.extension as any, groupIconCatalogId, fileToUse as Buffer);
                await this.catalog.createCatalogAsset(groupIconCatalogId, userInfo.userId, model.catalog.assetType.Texture, groupIconCatalogId.toString(), 'png');
                console.log('uploaded. starting render in 100ms');
                // generate random name for group icon
                let randomName = crypto.randomBytes(48).toString('hex');
                // grab url
                let url = 'https://cdn.blockshub.net/thumbnails/' + randomName;
                // upload group icon
                await this.ad.uploadGeneralThumbnail(randomName, buffer.image, buffer.mime);
                // const json = await this.catalog.generateAvatarJsonFromCatalogIds(groupIconId, [groupIconId]);
                // const url = await this.avatar.renderAvatar('group', json);
                // Delete Old Icon(s)
                await this.catalog.deleteThumbnail(groupIconCatalogId);
                // Upload New
                await this.catalog.uploadThumbnail(groupIconCatalogId, url);
            } catch (e) {
                console.error(e);
            }
        };
        renderIcon().then(() => { }).catch(e => console.error);
        // Update Group Icon ID
        await this.group.updateGroupIconId(groupId, groupIconCatalogId);
        // Complete Transaction
        // Subtract
        await this.economy.subtractFromUserBalance(userData.userId, model.group.GROUP_CREATION_COST, model.economy.currencyType.primary);
        // Create Transaction
        await this.economy.createTransaction(userData.userId, 1, -model.group.GROUP_CREATION_COST, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfGroup, "Creation of Group", model.catalog.creatorType.User, model.catalog.creatorType.User);
        // Return success
        return {
            success: true,
            id: groupId,
        };
    }

    @Patch('/:groupId/transfer')
    @Summary('Update group ownership. Must be owner')
    @Use(csrf, YesAuth)
    public async updateGroupOwner(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('groupId', Number) groupId: number,
        @Required()
        @BodyParams('userId', Number) userId: number
    ) {
        const userData = userInfo;
        // Confirm group is valid
        let groupInfo: model.group.groupDetails;
        try {
            groupInfo = await this.group.getInfo(groupId);
        } catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        // Confirm requester is owner
        if (groupInfo.groupOwnerUserId !== userData.userId) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        // Transfer
        let transferInfo;
        transferInfo = await this.user.getInfo(userId, ['banned']);
        if (transferInfo.banned) {
            throw new this.BadRequest('InvalidUserId');
        }
        const userRole = await this.group.getUserRole(groupId, userId);
        if (userRole.rank === 0 || userRole.rank === 255) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        // Grab Owner ROle
        const ownerRole = await this.group.getRoleSetByRank(groupId, 255);
        // Update Role
        await this.group.updateUserRolesetInGroup(groupId, ownerRole.roleSetId, userId);
        // Update Former Owner Role
        const newRole = await this.group.getRoleForNewMembers(groupId);
        await this.group.updateUserRolesetInGroup(groupId, newRole.roleSetId, userData.userId);
        // Update Group Ownership Property in Groups Table
        await this.group.updateGroupOwner(groupId, userId);
        // Record ownership change
        await this.group.recordGroupOwnershipChange(groupId, model.group.GroupOwnershipChangeType.TransferOwnership, userId, userInfo.userId);
        // Return success
        return {};
    }

    @Get('/:groupId/catalog')
    @Summary('Get group catalog')
    @Use(middleware.ValidatePaging, middleware.group.ValidateGroupId)
    public async getItems(
        @PathParams('groupId', Number) groupId: number,
        @QueryParams('offset', Number) offset: number,
        @QueryParams('limit', Number) limit: number,
        @QueryParams('sort', String) sort: any
    ) {
        return await this.group.getGroupItems(groupId, offset, limit, sort);
    }

    @Put('/:groupId/payout')
    @Summary('Spend group funds')
    @Use(csrf, YesAuth)
    public async spendGroupFunds(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('groupId', Number) groupId: number,
        @Required()
        @BodyParams('userId', Number) userId: number,
        @Required()
        @BodyParams('amount', Number) amount: number,
        @Required()
        @BodyParams('currency', Number) currency: number
    ) {
        // Validate Amount
        if (!amount || amount <= 0) {
            throw new this.BadRequest('NotEnoughCurrency');
        }
        // Validate Currency
        if (!model.economy.currencyType[currency]) {
            throw new this.BadRequest('InvalidCurrency');
        }
        const forUpdate = [
            'groups',
            'users',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            // Confirm group is valid
            let groupInfo: model.group.groupDetails;
            try {
                groupInfo = await trx.group.getInfo(groupId);
            } catch (e) {
                throw new this.BadRequest('InvalidGroupId');
            }
            // Confirm requester is owner
            if (groupInfo.groupOwnerUserId !== userInfo.userId) {
                throw new this.BadRequest('InvalidGroupPermissions');
            }
            // Begin
            let payoutUserInfo;
            try {
                payoutUserInfo = await trx.user.getInfo(userId, ['banned']);
            } catch (e) {
                if (e && e.message === 'InvalidUserId')
                    throw new this.BadRequest('InvalidUserId');
                throw e;
            }
            if (payoutUserInfo.banned) {
                throw new this.BadRequest('InvalidUserId');
            }
            const userRole = await trx.group.getUserRole(groupId, userId);
            if (userRole.rank === 0) {
                throw new this.BadRequest('InvalidGroupPermissions');
            }
            // Grab Funds
            const groupFunds = await trx.group.getGroupFunds(groupId);
            if (currency === 1) {
                if (groupFunds.Primary < amount) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
            } else if (currency === 2) {
                if (groupFunds.Secondary < amount) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
            }
            // Subtract from group
            await trx.economy.subtractFromGroupBalance(groupId, amount, currency);
            // Give to User
            await trx.economy.addToUserBalance(userId, amount, currency);
            // Create Group transaction
            await trx.economy.createTransaction(groupId, userId, -amount, currency, model.economy.transactionType.SpendGroupFunds, "Group Funds Payout", model.catalog.creatorType.User, model.catalog.creatorType.Group);
            // Create User Transaction
            await trx.economy.createTransaction(userId, groupId, amount, currency, model.economy.transactionType.SpendGroupFunds, "Group Funds Payout", model.catalog.creatorType.Group, model.catalog.creatorType.User);
        });
        // Return success
        return {};
    }
}
