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
const moment = require("moment");
const crypto = require("crypto");
const model = require("../../models/models");
const middleware = require("../../middleware/middleware");
const common_1 = require("@tsed/common");
const multipartfiles_1 = require("@tsed/multipartfiles");
const swagger_1 = require("@tsed/swagger");
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
const controller_1 = require("../controller");
let GroupsController = class GroupsController extends controller_1.default {
    constructor() {
        super();
    }
    async getGroupInfo(groupId) {
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        if (groupInfo.groupStatus === model.group.groupStatus.locked) {
            throw new this.BadRequest('InvalidGroupId');
        }
        return groupInfo;
    }
    getGroupCreationFee() {
        return {
            cost: model.group.GROUP_CREATION_COST,
        };
    }
    getGroupManageRules() {
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
    async multiGetNames(ids) {
        return await this.group.MultiGetNamesFromIds(ids);
    }
    async getAuthRole(userData = undefined, groupId) {
        let role;
        try {
            if (!userData) {
                role = await this.group.getRoleSetByRank(groupId, 0);
            }
            else {
                role = await this.group.getUserRole(groupId, userData.userId);
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        return role;
    }
    async getInfo(userInfo, groupId) {
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
    }
    async getRoles(groupId) {
        return await this.group.getRoles(groupId);
    }
    async getRole(userInfo, groupId) {
        try {
            await this.group.getInfo(groupId);
        }
        catch (e) {
            if (e && e.message === 'InvalidGroupId') {
                throw new this.BadRequest('InvalidGroupId');
            }
            throw e;
        }
        if (!userInfo) {
            return await this.group.getRoleSetByRank(groupId, 0);
        }
        return await this.group.getUserRole(groupId, userInfo.userId);
    }
    async getMembers(groupId, roleSetId, offset, limit, sort) {
        try {
            await this.group.getRoleById(roleSetId);
        }
        catch (e) {
            if (e && e.message === 'InvalidRolesetId')
                throw new this.BadRequest('InvalidRolesetId');
            throw e;
        }
        const members = await this.group.getMembers(groupId, roleSetId, offset, limit, sort);
        const membersCount = await this.group.countMembers(groupId, roleSetId);
        return {
            "total": membersCount,
            "members": members,
        };
    }
    async getShout(userInfo, groupId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.getShout) {
            const shout = await this.group.getShout(groupId);
            if (!shout) {
                return {};
            }
            return shout;
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async getWall(userInfo, groupId, offset, limit, sort) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.getWall) {
            return await this.group.getWall(groupId, offset, limit, sort);
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async getFunds(userInfo, groupId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            return await this.group.getGroupFunds(groupId);
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async createWallPost(userInfo, groupId, wallPostContent) {
        if (wallPostContent.length > 255 || wallPostContent.length < 3) {
            throw new this.BadRequest('InvalidWallPost');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.postWall) {
            await this.group.createWallPost(groupId, userInfo.userId, wallPostContent);
            return { success: true };
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async deleteWallPost(userInfo, groupId, wallPostId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            await this.group.deleteWallPost(groupId, wallPostId);
            return { success: true };
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async search(query, offset = 0, limit = 48) {
        if (query && query.length > 32) {
            throw new this.BadRequest('InvalidQuery');
        }
        return await this.group.search(offset, limit, query);
    }
    async updateGroupApprovalStatus(userInfo, groupId, approvalStatus) {
        const groupInfo = await this.getGroupInfo(groupId);
        if (groupInfo.groupOwnerUserId !== userInfo.userId) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        if (approvalStatus !== 1 && approvalStatus !== 0) {
            throw new this.BadRequest('InvalidApprovalStatus');
        }
        await this.group.updateGroupApprovalRequiredStatus(groupId, approvalStatus);
        return {
            success: true,
        };
    }
    async claimOwnership(userInfo, groupId) {
        const groupInfo = await this.getGroupInfo(groupId);
        if (groupInfo.groupOwnerUserId !== 0) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.rank === 0) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        let roleset;
        try {
            roleset = await this.group.getRoleSetByRank(groupId, 255);
        }
        catch (e) {
            throw new this.BadRequest('InvalidRolesetId');
        }
        await this.group.updateUserRolesetInGroup(groupId, roleset.roleSetId, userInfo.userId);
        await this.group.updateGroupOwner(groupId, userInfo.userId);
        await this.group.recordGroupOwnershipChange(groupId, model.group.GroupOwnershipChangeType.ClaimOwnership, userInfo.userId, userInfo.userId);
        return { success: true };
    }
    async join(userInfo, groupId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.rank !== 0) {
            throw new this.Conflict('AlreadyGroupMember');
        }
        const groupCount = await this.user.countGroups(userInfo.userId);
        if (groupCount >= model.group.MAX_GROUPS) {
            throw new this.BadRequest('TooManyGroups');
        }
        const roleset = await this.group.getRoleForNewMembers(groupId);
        if (roleset.rank >= 255) {
            throw new this.BadRequest('InvalidRolesetId');
        }
        let isPendingMember = await this.group.isUserPendingToJoinGroup(groupId, userInfo.userId);
        if (isPendingMember) {
            throw new this.Conflict('GroupJoinRequestPending');
        }
        let isApprovalRequired = await this.group.doesGroupRequireApprovalForNewMembers(groupId);
        if (isApprovalRequired) {
            await this.group.insertPendingGroupMember(groupId, userInfo.userId);
            return {
                success: true,
                doesUserRequireApproval: true,
            };
        }
        await this.group.addUserToGroup(groupId, userInfo.userId, roleset.roleSetId);
        return { success: true, doesUserRequireApproval: false };
    }
    async leave(userInfo, groupId) {
        try {
            await this.group.getInfo(groupId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.rank === 0) {
            let pendingUser = await this.group.isUserPendingToJoinGroup(groupId, userInfo.userId);
            if (pendingUser) {
                await this.group.removeUserFromPendingGroupJoins(groupId, userInfo.userId);
                return {
                    success: true,
                };
            }
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        if (role.rank === 255) {
            await this.group.updateGroupOwner(groupId, 0);
            await this.group.recordGroupOwnershipChange(groupId, model.group.GroupOwnershipChangeType.LeaveGroup, userInfo.userId, userInfo.userId);
        }
        await this.group.removeUserFromGroup(groupId, userInfo.userId);
        return { success: true };
    }
    async getGroupOwnershipChanges(userInfo, groupId, limit = 100, offset = 0) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return await this.group.getGroupOwnershipChanges(groupId, limit, offset);
    }
    async getJoinRequests(userInfo, groupId, limit = 100, offset = 0) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return await this.group.getPendingMembers(groupId, offset, limit);
    }
    async approveJoinRequest(userInfo, groupId, userId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let joinRequestExists = await this.group.isUserPendingToJoinGroup(groupId, userId);
        if (!joinRequestExists) {
            throw new this.BadRequest('InvalidJoinRequest');
        }
        const roleOfMemberToApprove = await this.group.getUserRole(groupId, userId);
        if (roleOfMemberToApprove.rank !== 0) {
            await this.group.removeUserFromPendingGroupJoins(groupId, userId);
            return {
                success: true,
            };
        }
        const groupCount = await this.user.countGroups(userId);
        if (groupCount >= model.group.MAX_GROUPS) {
            await this.group.removeUserFromPendingGroupJoins(groupId, userId);
            throw new this.BadRequest('TooManyGroups');
        }
        const roleSetForNewMembers = await this.group.getRoleForNewMembers(groupId);
        if (roleSetForNewMembers.rank >= 255) {
            throw new this.BadRequest('InvalidRolesetId');
        }
        await this.group.addUserToGroup(groupId, userId, roleSetForNewMembers.roleSetId);
        await this.group.removeUserFromPendingGroupJoins(groupId, userId);
        return {
            success: true,
        };
    }
    async declineJoinRequest(userInfo, groupId, userId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (!role.permissions.manage) {
            throw new this.BadRequest('InvalidPermissions');
        }
        let joinRequestExists = await this.group.isUserPendingToJoinGroup(groupId, userId);
        if (!joinRequestExists) {
            throw new this.BadRequest('InvalidJoinRequest');
        }
        const roleOfMemberToDecline = await this.group.getUserRole(groupId, userId);
        if (roleOfMemberToDecline.rank !== 0) {
            await this.group.removeUserFromPendingGroupJoins(groupId, userId);
            throw new this.Conflict('UserAlreadyInGroup');
        }
        await this.group.removeUserFromPendingGroupJoins(groupId, userId);
        return {
            success: true,
        };
    }
    async removeUserFromGroup(userInfo, groupId, userId) {
        const groupInfo = await this.getGroupInfo(groupId);
        if (groupInfo.groupOwnerUserId !== userInfo.userId) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        if (userId === userInfo.userId) {
            throw new this.BadRequest('CannotKickOwner');
        }
        let inGroup = await this.group.getUserRole(groupId, userId);
        if (inGroup.rank === 0) {
            throw new this.BadRequest('UserNotInGroup');
        }
        await this.group.removeUserFromGroup(groupId, userId);
        return {
            success: true,
        };
    }
    async updateRoleset(userInfo, groupId, roleSetId, rank, name, description, permissions) {
        if (!rank || rank > 255 || rank <= 0) {
            throw new this.BadRequest('InvalidGroupRank');
        }
        if (!name || name.length > 32 || name.length < 3) {
            throw new this.BadRequest('InvalidRolesetName');
        }
        if (!description || description.length > 128) {
            throw new this.BadRequest('InvalidRolesetDescription');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            const permissionsAreValid = this.group.verifyPermissions(permissions);
            if (!permissionsAreValid) {
                throw new this.BadRequest('InvalidRolesetPermissions');
            }
            const takenRoleset = await this.group.getRoleSetByRank(groupId, rank);
            if (takenRoleset.roleSetId !== roleSetId) {
                throw new this.Conflict('RankIdIsTaken');
            }
            const roleset = await this.group.getRoleById(roleSetId);
            if (roleset.groupId !== groupId) {
                throw new this.BadRequest('InvalidGroupId');
            }
            if (roleset.rank >= role.rank && roleset.rank !== 255) {
                throw new this.BadRequest('InvalidGroupPermissions');
            }
            if (roleset.rank === 0) {
                throw new this.BadRequest('InvalidRolesetId');
            }
            if (roleset.rank === 255) {
                permissions.getShout = 1;
                permissions.postShout = 1;
                permissions.getWall = 1;
                permissions.postWall = 1;
                permissions.manage = 1;
                rank = 255;
                if (role.rank !== 255) {
                    throw new this.BadRequest('InvalidGroupPermissions');
                }
            }
            else {
                if (role.rank <= rank || rank > 255 || rank <= 0) {
                    throw new this.BadRequest('InvalidRank');
                }
            }
            await this.group.updateRoleset(roleSetId, name, description, rank, permissions);
            return {};
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async createRoleset(userInfo, groupId, rank, name, description, permissions) {
        if (!rank || rank > model.group.MAX_RANK_VALUE || rank <= model.group.MIN_RANK_VALUE) {
            throw new this.BadRequest('InvalidGroupRank');
        }
        if (!name || name.length > model.group.ROLE_NAME_MAX_LENGTH || name.length < model.group.ROLE_NAME_MIN_LENGTH) {
            throw new this.BadRequest('InvalidRolesetName');
        }
        if (!description || description.length > model.group.ROLE_DESCRIPTION_MAX_LENGTH) {
            throw new this.BadRequest('InvalidRolesetDescription');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            const permissionsAreValid = this.group.verifyPermissions(permissions);
            if (!permissionsAreValid) {
                throw new this.BadRequest('InvalidRolesetPermissions');
            }
            const countRoles = await this.group.getRoles(groupId);
            if (countRoles.length >= model.group.MAX_GROUP_ROLES) {
                throw new this.BadRequest('TooManyRolesets');
            }
            let exists = false;
            try {
                exists = await this.group.getRoleSetByRank(groupId, rank);
            }
            catch {
            }
            if (exists) {
                throw new this.BadRequest('RankAlreadyExists');
            }
            if (role.rank <= rank || rank >= 255 || rank <= 0) {
                throw new this.BadRequest('InvalidGroupRank');
            }
            let id = await this.group.createRoleset(groupId, name, description, rank, permissions);
            return {
                success: true,
                roleSetId: id,
            };
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async deleteRoleset(userInfo, groupId, roleSetId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            const roleset = await this.group.getRoleById(roleSetId);
            if (roleset.groupId !== groupId) {
                throw new this.Conflict('InvalidGroupId');
            }
            const roleOnJoin = await this.group.getRoleForNewMembers(groupId);
            if (roleOnJoin.roleSetId === roleset.groupId) {
                throw new this.Conflict('CannotDeleteFirstRoleInGroup');
            }
            if (roleset.rank >= role.rank) {
                throw new this.Conflict('InvalidGroupPermissions');
            }
            if (roleset.rank === 0 || roleset.rank === 255) {
                throw new this.Conflict('InvalidRolesetId');
            }
            const members = await this.group.getMembers(groupId, roleSetId, 0, 1, 'asc');
            if (members.length > 0) {
                throw new this.Conflict('RolesetHasMembers');
            }
            await this.group.deleteRoleset(roleset.roleSetId);
            return {};
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async updateUserRole(userInfo, groupId, userId, roleSetId) {
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            let roleset;
            try {
                roleset = await this.group.getRoleById(roleSetId);
            }
            catch (e) {
                throw new this.Conflict('InvalidRolesetId');
            }
            if (roleset.groupId !== groupId) {
                throw new this.Conflict('InvalidGroupId');
            }
            if (roleset.rank >= role.rank) {
                throw new this.Conflict('InvalidRolesetId');
            }
            if (roleset.rank === 0 || roleset.rank === 255) {
                throw new this.Conflict('InvalidRolesetId');
            }
            let userCurrentRole;
            try {
                userCurrentRole = await this.group.getUserRole(groupId, userId);
            }
            catch (e) {
                throw new this.Conflict('UserNotInGroup');
            }
            if (userCurrentRole.rank === 255 || userCurrentRole.rank === 0 || userCurrentRole.rank >= role.rank) {
                throw new this.Conflict('CannotRankUser');
            }
            await this.group.updateUserRolesetInGroup(groupId, roleSetId, userId);
            return {};
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async updateDescription(userInfo, groupId, newDescription) {
        if (!newDescription || newDescription.length >= 512) {
            throw new this.BadRequest('InvalidGroupDescription');
        }
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            await this.group.updateDescription(groupId, newDescription);
            return ({
                'success': true,
            });
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async updateShout(userInfo, groupId, newShout) {
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
            }
            else {
                throw new this.BadRequest('ShoutCooldown');
            }
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async updateIcon(userInfo, groupId, multerFiles) {
        const groupInfo = await this.getGroupInfo(groupId);
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            let sorted = await this.catalog.sortFilesSimple(multerFiles);
            let fileToUse = undefined;
            let file = sorted[0];
            if (!file) {
                throw new this.BadRequest('NoFilesSpecified');
            }
            if (file.trueMime !== 'image/gif' && file.trueMime !== 'image/png' && file.trueMime !== 'image/jpeg') {
                throw new this.BadRequest('NoFilesSpecified');
            }
            fileToUse = file.buffer;
            const groupIconId = await this.catalog.createUserItem(userInfo.userId, groupInfo.groupName, 'Group Icon', model.catalog.isForSale.false, model.catalog.category.GroupIcon, 0, model.economy.currencyType.primary, model.catalog.collectible.false);
            await this.group.updateGroupIconId(groupInfo.groupId, groupIconId);
            let buffer = await this.group.cropGroupImage(fileToUse);
            const renderIcon = async () => {
                try {
                    await this.catalog.upload(file.extension, groupIconId, fileToUse);
                    await this.catalog.createCatalogAsset(groupIconId, userInfo.userId, model.catalog.assetType.Texture, groupIconId.toString(), 'png');
                    console.log('uploaded. starting render in 100ms');
                    let randomName = crypto.randomBytes(48).toString('hex');
                    let url = 'https://cdn.blockshub.net/thumbnails/' + randomName;
                    await this.ad.uploadGeneralThumbnail(randomName, buffer.image, buffer.mime);
                    await this.catalog.deleteThumbnail(groupIconId);
                    await this.catalog.uploadThumbnail(groupIconId, url);
                }
                catch (e) {
                    console.error(e);
                }
            };
            renderIcon();
            return { success: true };
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async create(userInfo, name, multerFiles, description) {
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
        const groupCount = await this.user.countGroups(userData.userId);
        if (groupCount >= model.group.MAX_GROUPS) {
            throw new this.BadRequest('TooManyGroups');
        }
        const balance = userData.primaryBalance;
        if (balance < model.group.GROUP_CREATION_COST) {
            throw new this.BadRequest('NotEnoughCurrency');
        }
        let groupId;
        try {
            groupId = await this.group.create(name, description, userData.userId, 0);
        }
        catch (e) {
            if (e.code && e.code === "ER_DUP_ENTRY") {
                throw new this.BadRequest('GroupNameTaken');
            }
            throw e;
        }
        await this.group.createRoleset(groupId, 'Guest', 'A Guest User', 0, {
            'getShout': 0,
            'postShout': 0,
            'getWall': 0,
            'postWall': 0,
            'manage': 0,
        });
        await this.group.createRoleset(groupId, 'Member', 'A Group Member', 1, {
            'getShout': 1,
            'postShout': 0,
            'getWall': 1,
            'postWall': 0,
            'manage': 0,
        });
        await this.group.createRoleset(groupId, 'Owner', 'The Group Owner', 255, {
            'getShout': 1,
            'postShout': 1,
            'getWall': 1,
            'postWall': 1,
            'manage': 1,
        });
        const ownerRolesetId = await this.group.getRoleSetByRank(groupId, 255);
        await this.group.addUserToGroup(groupId, userData.userId, ownerRolesetId.roleSetId);
        let groupIconCatalogId = await this.catalog.createGroupItem(groupId, userData.userId, name, 'Group Icon', model.catalog.isForSale.false, model.catalog.category.GroupIcon, 0, model.economy.currencyType.primary, model.catalog.collectible.false, 0, model.catalog.moderatorStatus.Pending);
        let sorted = await this.catalog.sortFilesSimple(multerFiles);
        let fileToUse = undefined;
        let file = sorted[0];
        if (!file) {
            throw new this.BadRequest('NoFilesSpecified');
        }
        if (file.trueMime !== 'image/gif' && file.trueMime !== 'image/png' && file.trueMime !== 'image/jpeg') {
            throw new this.BadRequest('NoFilesSpecified');
        }
        fileToUse = file.buffer;
        let buffer = await this.group.cropGroupImage(fileToUse);
        const renderIcon = async () => {
            try {
                await this.catalog.upload(file.extension, groupIconCatalogId, fileToUse);
                await this.catalog.createCatalogAsset(groupIconCatalogId, userInfo.userId, model.catalog.assetType.Texture, groupIconCatalogId.toString(), 'png');
                console.log('uploaded. starting render in 100ms');
                let randomName = crypto.randomBytes(48).toString('hex');
                let url = 'https://cdn.blockshub.net/thumbnails/' + randomName;
                await this.ad.uploadGeneralThumbnail(randomName, buffer.image, buffer.mime);
                await this.catalog.deleteThumbnail(groupIconCatalogId);
                await this.catalog.uploadThumbnail(groupIconCatalogId, url);
            }
            catch (e) {
                console.error(e);
            }
        };
        renderIcon().then(() => { }).catch(e => console.error);
        await this.group.updateGroupIconId(groupId, groupIconCatalogId);
        await this.economy.subtractFromUserBalance(userData.userId, model.group.GROUP_CREATION_COST, model.economy.currencyType.primary);
        await this.economy.createTransaction(userData.userId, 1, -model.group.GROUP_CREATION_COST, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfGroup, "Creation of Group", model.catalog.creatorType.User, model.catalog.creatorType.User);
        return {
            success: true,
            id: groupId,
        };
    }
    async updateGroupOwner(userInfo, groupId, userId) {
        const userData = userInfo;
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        if (groupInfo.groupOwnerUserId !== userData.userId) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        let transferInfo;
        transferInfo = await this.user.getInfo(userId, ['banned']);
        if (transferInfo.banned) {
            throw new this.BadRequest('InvalidUserId');
        }
        const userRole = await this.group.getUserRole(groupId, userId);
        if (userRole.rank === 0 || userRole.rank === 255) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        const ownerRole = await this.group.getRoleSetByRank(groupId, 255);
        await this.group.updateUserRolesetInGroup(groupId, ownerRole.roleSetId, userId);
        const newRole = await this.group.getRoleForNewMembers(groupId);
        await this.group.updateUserRolesetInGroup(groupId, newRole.roleSetId, userData.userId);
        await this.group.updateGroupOwner(groupId, userId);
        await this.group.recordGroupOwnershipChange(groupId, model.group.GroupOwnershipChangeType.TransferOwnership, userId, userInfo.userId);
        return {};
    }
    async getItems(groupId, offset, limit, sort) {
        return await this.group.getGroupItems(groupId, offset, limit, sort);
    }
    async spendGroupFunds(userInfo, groupId, userId, amount, currency) {
        if (!amount || amount <= 0) {
            throw new this.BadRequest('NotEnoughCurrency');
        }
        if (!model.economy.currencyType[currency]) {
            throw new this.BadRequest('InvalidCurrency');
        }
        const forUpdate = [
            'groups',
            'users',
        ];
        await this.transaction(this, forUpdate, async function (trx) {
            let groupInfo;
            try {
                groupInfo = await trx.group.getInfo(groupId);
            }
            catch (e) {
                throw new this.BadRequest('InvalidGroupId');
            }
            if (groupInfo.groupOwnerUserId !== userInfo.userId) {
                throw new this.BadRequest('InvalidGroupPermissions');
            }
            let payoutUserInfo;
            try {
                payoutUserInfo = await trx.user.getInfo(userId, ['banned']);
            }
            catch (e) {
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
            const groupFunds = await trx.group.getGroupFunds(groupId);
            if (currency === 1) {
                if (groupFunds.Primary < amount) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
            }
            else if (currency === 2) {
                if (groupFunds.Secondary < amount) {
                    throw new this.BadRequest('NotEnoughCurrency');
                }
            }
            await trx.economy.subtractFromGroupBalance(groupId, amount, currency);
            await trx.economy.addToUserBalance(userId, amount, currency);
            await trx.economy.createTransaction(groupId, userId, -amount, currency, model.economy.transactionType.SpendGroupFunds, "Group Funds Payout", model.catalog.creatorType.User, model.catalog.creatorType.Group);
            await trx.economy.createTransaction(userId, groupId, amount, currency, model.economy.transactionType.SpendGroupFunds, "Group Funds Payout", model.catalog.creatorType.Group, model.catalog.creatorType.User);
        });
        return {};
    }
};
__decorate([
    common_1.Get('/metadata/creation-fee'),
    swagger_1.Summary('Get the cost to create a group'),
    swagger_1.Returns(200, { type: model.group.GroupCreationFee }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "getGroupCreationFee", null);
__decorate([
    common_1.Get('/metadata/manage'),
    swagger_1.Summary('Get group manage metadata'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GroupsController.prototype, "getGroupManageRules", null);
__decorate([
    common_1.Get('/names'),
    swagger_1.Summary('Multi-get group names'),
    swagger_1.ReturnsArray(200, { type: model.group.MultiGetNames }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidIds: One or more IDs are invalid\n' }),
    common_1.Use(middleware.ConvertIdsToCsv),
    __param(0, common_1.QueryParams('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "multiGetNames", null);
__decorate([
    common_1.Get('/:groupId/info'),
    swagger_1.Summary('Get group info'),
    swagger_1.Description('This endpoint is a bit exceptional. If the groupStatus is locked (1), it will only return { groupStatus: 1 } but if it is not locked, it will return all group info'),
    swagger_1.Returns(200, { type: model.group.groupDetails }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupId: invalid id\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getInfo", null);
__decorate([
    common_1.Get('/:groupId/roles'),
    swagger_1.Summary('Get group roles'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupId: \n' }),
    swagger_1.ReturnsArray(200, { type: model.group.roleInfo }),
    common_1.Use(middleware.group.ValidateGroupId),
    __param(0, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getRoles", null);
__decorate([
    common_1.Get('/:groupId/role'),
    swagger_1.Summary('Get the authenticated users role in a group. If not authenticated, returns guest info'),
    swagger_1.Returns(200, { type: model.group.roleInfo }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupId: \n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getRole", null);
__decorate([
    common_1.Get('/:groupId/members/:roleSetId'),
    swagger_1.Summary('Get the users of the {roleSetId}'),
    common_1.Use(middleware.group.ValidateGroupId, middleware.ValidatePaging),
    __param(0, common_1.PathParams('groupId', Number)),
    __param(1, common_1.PathParams('roleSetId', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __param(3, common_1.QueryParams('limit', Number)),
    __param(4, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getMembers", null);
__decorate([
    common_1.Get('/:groupId/shout'),
    swagger_1.Summary('Get group\'s current shout'),
    common_1.Use(middleware.group.ValidateGroupId),
    swagger_1.Returns(200, { type: model.group.groupShout }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getShout", null);
__decorate([
    common_1.Get('/:groupId/wall'),
    swagger_1.Summary('Get group wall'),
    common_1.Use(middleware.group.ValidateGroupId, middleware.ValidatePaging),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.QueryParams('offset', Number)),
    __param(3, common_1.QueryParams('limit', Number)),
    __param(4, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getWall", null);
__decorate([
    common_1.Get('/:groupId/funds'),
    swagger_1.Summary('Get group funds (User must have manage permission)'),
    common_1.Use(middleware.group.ValidateGroupId),
    swagger_1.Returns(200, { type: model.group.GroupFunds, description: 'Group Funds' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getFunds", null);
__decorate([
    common_1.Put('/:groupId/wall'),
    swagger_1.Summary('Create a wall post'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.BodyParams('content', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createWallPost", null);
__decorate([
    common_1.Delete('/:groupId/wall/:wallPostId'),
    swagger_1.Summary('Delete a wall post'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.PathParams('wallPostId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteWallPost", null);
__decorate([
    common_1.Get('/search'),
    swagger_1.ReturnsArray(200, { type: model.group.groupDetails }),
    common_1.Use(middleware.ValidatePaging),
    __param(0, common_1.QueryParams('name', String)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "search", null);
__decorate([
    common_1.Patch('/:groupId/approval-required'),
    swagger_1.Summary('Set a group\'s approval required status'),
    swagger_1.Description('Currently requires ownership permission but may be downgraded to Manage in the future'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupPermissions: You must be owner to apply this change\nInvalidApprovalStatus: approvalStatus must be 0 or 1\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('approvalStatus', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateGroupApprovalStatus", null);
__decorate([
    common_1.Put('/:groupId/claim'),
    swagger_1.Summary('Claim a group with no owner'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "claimOwnership", null);
__decorate([
    common_1.Put('/:groupId/membership'),
    swagger_1.Summary('Join a group'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "join", null);
__decorate([
    common_1.Delete('/:groupId/membership'),
    swagger_1.Summary('Leave a group, or remove yourself from a group join request'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "leave", null);
__decorate([
    common_1.Get('/:groupId/ownership-changes'),
    swagger_1.Summary('Get an array of group ownership changes for the {groupId}'),
    swagger_1.Description('Requester must have manage permission'),
    common_1.Use(Auth_1.YesAuth, middleware.group.ValidateGroupId),
    swagger_1.ReturnsArray(200, { type: model.group.GroupOwnershipChangeEntry }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getGroupOwnershipChanges", null);
__decorate([
    common_1.Get('/:groupId/join-requests'),
    swagger_1.Summary('Get a page of group join requests'),
    swagger_1.Description('Requester must have manage permission'),
    common_1.Use(Auth_1.YesAuth, middleware.group.ValidateGroupId),
    swagger_1.ReturnsArray(200, { type: model.group.GroupJoinRequest }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('offset', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getJoinRequests", null);
__decorate([
    common_1.Post('/:groupId/join-request'),
    swagger_1.Summary('Approve a join request'),
    swagger_1.Description('This will give the {userId} the lowest rank possible in the {groupId}. Requester must have manage permission'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidPermissions: Requester must have manage permission\nInvalidJoinRequest: Join request does not exist\nTooManyGroups: userId is in too many groups. Request has been deleted\nInvalidRolesetId: Unknown\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.BodyParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "approveJoinRequest", null);
__decorate([
    common_1.Delete('/:groupId/join-request'),
    swagger_1.Summary('Decline a join request'),
    swagger_1.Description('Requester must have manage permisison'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupId: Group Id is invalid\nInvalidPermissions: Requester must have manage permission\nInvalidJoinRequest: Join request does not exist\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'UserAlreadyInGroup: User is already a member of the group. Request has been deleted, but they will not be removed from the group\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.BodyParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "declineJoinRequest", null);
__decorate([
    common_1.Delete('/:groupId/member/:userId'),
    swagger_1.Summary('Remove a user from a group'),
    swagger_1.Description('Requester must be owner of group'),
    swagger_1.Returns(400, { type: model.Error, description: 'CannotKickOwner: The owner cannot kick theirself\nInvalidGroupPermissions: Only the owner can kick members\nUserNotInGroup: User is not a member of this group\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.PathParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "removeUserFromGroup", null);
__decorate([
    common_1.Patch('/:groupId/role/:roleSetId'),
    swagger_1.Summary('Update a roleset'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.PathParams('roleSetId', Number)),
    __param(3, common_1.BodyParams('rank', Number)),
    __param(4, common_1.BodyParams('name', String)),
    __param(5, common_1.BodyParams('description', String)),
    __param(6, common_1.BodyParams('permissions', model.group.groupPermissions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number, String, String, model.group.groupPermissions]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateRoleset", null);
__decorate([
    common_1.Put('/:groupId/role'),
    swagger_1.Summary('Create a roleset'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.BodyParams('rank', Number)),
    __param(3, common_1.BodyParams('name', String)),
    __param(4, common_1.BodyParams('description', String)),
    __param(5, common_1.BodyParams('permissions', model.group.groupPermissions)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, String, String, model.group.groupPermissions]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "createRoleset", null);
__decorate([
    common_1.Delete('/:groupId/roleset/:roleSetId'),
    swagger_1.Summary('Delete a roleset. Cannot contain members, else will error'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.PathParams('roleSetId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "deleteRoleset", null);
__decorate([
    common_1.Patch('/:groupId/member/:userId'),
    swagger_1.Summary('Update a users role in a group'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.PathParams('userId', Number)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('role', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateUserRole", null);
__decorate([
    common_1.Patch('/:groupId/description'),
    swagger_1.Summary('Update group description'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('description', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateDescription", null);
__decorate([
    common_1.Patch('/:groupId/shout'),
    swagger_1.Summary('Update group shout'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.group.ValidateGroupId),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('shout', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateShout", null);
__decorate([
    common_1.Patch('/:groupId/icon'),
    swagger_1.Summary('Update group icon'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, multipartfiles_1.MultipartFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Array]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateIcon", null);
__decorate([
    common_1.Post('/create'),
    swagger_1.Summary('Create a group'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('name', String)),
    __param(2, common_1.Required()),
    __param(2, multipartfiles_1.MultipartFile()),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('description', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, Array, String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "create", null);
__decorate([
    common_1.Patch('/:groupId/transfer'),
    swagger_1.Summary('Update group ownership. Must be owner'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateGroupOwner", null);
__decorate([
    common_1.Get('/:groupId/catalog'),
    swagger_1.Summary('Get group catalog'),
    common_1.Use(middleware.ValidatePaging, middleware.group.ValidateGroupId),
    __param(0, common_1.PathParams('groupId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getItems", null);
__decorate([
    common_1.Put('/:groupId/payout'),
    swagger_1.Summary('Spend group funds'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('userId', Number)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('amount', Number)),
    __param(4, common_1.Required()),
    __param(4, common_1.BodyParams('currency', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "spendGroupFunds", null);
GroupsController = __decorate([
    common_1.Controller('/group'),
    __metadata("design:paramtypes", [])
], GroupsController);
exports.GroupsController = GroupsController;

