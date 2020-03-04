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
const util = require("util");
const model = require("../../models/models");
const common_1 = require("@tsed/common");
const multipartfiles_1 = require("@tsed/multipartfiles");
const controller_1 = require("../controller");
const swagger_1 = require("@tsed/swagger");
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
let GroupsController = class GroupsController extends controller_1.default {
    constructor() {
        super();
    }
    async getGroupInfo(groupId) {
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
            if (groupInfo.groupStatus === model.group.groupStatus.locked) {
                throw false;
            }
        }
        catch (e) {
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
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds = [];
        let allIdsValid = true;
        idsArray.forEach((id) => {
            const catalogId = parseInt(id, 10);
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
            throw new this.BadRequest('InvalidIds');
        }
        const result = await this.group.MultiGetNamesFromIds(safeIds);
        return result;
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
    async getInfo(groupId) {
        try {
            const groupInfo = await this.group.getInfo(groupId);
            if (groupInfo.groupStatus === model.group.groupStatus.locked) {
                return ({
                    groupStatus: groupInfo.groupStatus,
                });
            }
            return groupInfo;
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
    }
    async getRoles(groupId) {
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
            if (groupInfo.groupStatus === model.group.groupStatus.locked) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        const roles = await this.group.getRoles(groupId);
        return roles;
    }
    async getRole(userInfo, groupId) {
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        if (!userInfo) {
            const role = await this.group.getRoleSetByRank(groupId, 0);
            return role;
        }
        const role = await this.group.getUserRole(groupId, userInfo.userId);
        return role;
    }
    async getMembers(groupId, roleSetId, offset, limit, sort) {
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
            if (groupInfo.groupStatus === model.group.groupStatus.locked) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        try {
            await this.group.getRoleById(roleSetId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidRolesetId');
        }
        try {
            const members = await this.group.getMembers(groupId, roleSetId, offset, limit, sort);
            const membersCount = await this.group.countMembers(groupId, roleSetId);
            return ({
                "total": membersCount,
                "members": members,
            });
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
    }
    async getShout(userInfo, groupId) {
        await this.getGroupInfo(groupId);
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
        await this.getGroupInfo(groupId);
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.getWall) {
            const wall = await this.group.getWall(groupId, offset, limit, sort);
            return wall;
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async createWallPost(userInfo, groupId, wallPostContent) {
        await this.getGroupInfo(groupId);
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.postWall) {
            if (wallPostContent.length > 255 || wallPostContent.length < 3) {
                throw new this.BadRequest('InvalidWallPost');
            }
            await this.group.createWallPost(groupId, userInfo.userId, wallPostContent);
            return { success: true };
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async deleteWallPost(userInfo, groupId, wallPostId) {
        await this.getGroupInfo(groupId);
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
        const results = await this.group.search(offset, limit, query);
        return results;
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
        return { success: true };
    }
    async join(userInfo, groupId) {
        try {
            let groupData = await this.group.getInfo(groupId);
            if (groupData.groupStatus === model.group.groupStatus.locked) {
                throw new Error('Group is locked');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
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
        await this.group.addUserToGroup(groupId, userInfo.userId, roleset.roleSetId);
        return { success: true };
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
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        if (role.rank === 255) {
            await this.group.updateGroupOwner(groupId, 0);
        }
        await this.group.removeUserFromGroup(groupId, userInfo.userId);
        return { success: true };
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
        await this.getGroupInfo(groupId);
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            const permissionsAreValid = this.group.verifyPermissions(permissions);
            if (!permissionsAreValid) {
                throw new this.BadRequest('InvalidRolesetPermissions');
            }
            try {
                const roleset = await this.group.getRoleSetByRank(groupId, rank);
                if (roleset.roleSetId !== roleSetId) {
                    throw new this.Conflict('RankIdIsTaken');
                }
            }
            catch (e) {
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
            return ({
                success: true,
            });
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async createRoleset(userInfo, groupId, rank, name, description, permissions) {
        if (!rank || rank > 255 || rank <= 0) {
            throw new this.BadRequest('InvalidGroupRank');
        }
        if (!name || name.length > 32 || name.length < 3) {
            throw new this.BadRequest('InvalidRolesetName');
        }
        if (!description || description.length > 128) {
            throw new this.BadRequest('InvalidRolesetDescription');
        }
        await this.getGroupInfo(groupId);
        const role = await this.getAuthRole(userInfo, groupId);
        if (role.permissions.manage) {
            const permissionsAreValid = this.group.verifyPermissions(permissions);
            if (!permissionsAreValid) {
                throw new this.BadRequest('InvalidRolesetPermissions');
            }
            const countRoles = await this.group.getRoles(groupId);
            if (countRoles.length >= 18) {
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
            await this.group.createRoleset(groupId, name, description, rank, permissions);
            return ({
                success: true,
            });
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async deleteRoleset(userInfo, groupId, roleSetId) {
        const userData = userInfo;
        await this.getGroupInfo(groupId);
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
            return ({
                success: true,
            });
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async updateUserRole(userInfo, groupId, userId, roleSetId) {
        await this.getGroupInfo(groupId);
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
            return ({
                'success': true,
            });
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async updateDescription(userInfo, groupId, newDescription) {
        const userData = userInfo;
        if (!newDescription || newDescription.length >= 512) {
            throw new this.BadRequest('InvalidGroupDescription');
        }
        await this.getGroupInfo(groupId);
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
        await this.getGroupInfo(groupId);
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
            const files = await this.catalog.sortFileUploads(multerFiles);
            if (!files["png"] && !files["jpg"]) {
                throw new this.BadRequest('InvalidFileType');
            }
            const groupIconId = await this.catalog.createUserItem(userInfo.userId, groupInfo.groupName, 'Group Icon', model.catalog.isForSale.false, model.catalog.category.GroupIcon, 0, model.economy.currencyType.primary, model.catalog.collectible.false);
            await this.group.updateGroupIconId(groupInfo.groupId, groupIconId);
            (async () => {
                try {
                    if (files.png) {
                        await this.catalog.upload('png', groupIconId, files.png);
                        await this.catalog.createCatalogAsset(groupIconId, userInfo.userId, model.catalog.assetType.Texture, groupIconId.toString(), 'png');
                    }
                    else if (files.jpg) {
                        await this.catalog.upload('jpg', groupIconId, files.jpg);
                        await this.catalog.createCatalogAsset(groupIconId, userInfo.userId, model.catalog.assetType.Texture, groupIconId.toString(), 'jpg');
                    }
                    console.log('uploaded. starting render in 100ms');
                    await util.promisify(setTimeout)(100);
                    const json = await this.catalog.generateAvatarJsonFromCatalogIds(groupIconId, [groupIconId]);
                    const url = await this.avatar.renderAvatar('group', json);
                    await this.catalog.deleteThumbnail(groupIconId);
                    await this.catalog.uploadThumbnail(groupIconId, url);
                }
                catch (e) {
                    console.log(e);
                }
            })();
            return { success: true };
        }
        else {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
    }
    async create(userInfo, name, multerFiles, description) {
        console.log(multerFiles);
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
        const files = await this.catalog.sortFileUploads(multerFiles);
        if (!files["png"] && !files["jpg"]) {
            throw new this.BadRequest('InvalidFileType');
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
        if (files.png) {
            await this.catalog.upload('png', groupIconCatalogId, files.png);
            await this.catalog.createCatalogAsset(groupIconCatalogId, userInfo.userId, model.catalog.assetType.Texture, groupIconCatalogId.toString(), 'png');
        }
        else if (files.jpg) {
            await this.catalog.upload('jpg', groupIconCatalogId, files.jpg);
            await this.catalog.createCatalogAsset(groupIconCatalogId, userInfo.userId, model.catalog.assetType.Texture, groupIconCatalogId.toString(), 'jpg');
        }
        await this.group.updateGroupIconId(groupId, groupIconCatalogId);
        await this.economy.subtractFromUserBalance(userData.userId, model.group.GROUP_CREATION_COST, model.economy.currencyType.primary);
        await this.economy.createTransaction(userData.userId, 1, -model.group.GROUP_CREATION_COST, model.economy.currencyType.primary, model.economy.transactionType.PurchaseOfGroup, "Creation of Group", model.catalog.creatorType.User, model.catalog.creatorType.User);
        (async () => {
            try {
                const json = await this.catalog.generateAvatarJsonFromCatalogIds(groupIconCatalogId, [groupIconCatalogId]);
                const url = await this.avatar.renderAvatar('group', json);
                await this.catalog.uploadThumbnail(groupIconCatalogId, url);
            }
            catch (e) {
            }
        })();
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
            throw false;
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
        return ({
            'success': true,
        });
    }
    async getItems(groupId, offset, limit, sort) {
        try {
            await this.group.getInfo(groupId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        const items = await this.group.getGroupItems(groupId, offset, limit, sort);
        return items;
    }
    async spendGroupFunds(userInfo, groupId, userId, amount, currency) {
        if (!amount || amount <= 0) {
            throw new this.BadRequest('NotEnoughCurrency');
        }
        if (currency !== 1 && currency !== 2) {
            throw new this.BadRequest('InvalidCurrency');
        }
        let groupInfo;
        try {
            groupInfo = await this.group.getInfo(groupId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGroupId');
        }
        if (groupInfo.groupOwnerUserId !== userInfo.userId) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        try {
            const payoutUserInfo = await this.user.getInfo(userId, ['banned']);
            if (payoutUserInfo.banned) {
                throw false;
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidUserId');
        }
        const userRole = await this.group.getUserRole(groupId, userId);
        if (userRole.rank === 0) {
            throw new this.BadRequest('InvalidGroupPermissions');
        }
        const groupFunds = await this.group.getGroupFunds(groupId);
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
        await this.economy.subtractFromGroupBalance(groupId, amount, currency);
        await this.economy.addToUserBalance(userId, amount, currency);
        await this.economy.createTransaction(groupId, userId, -amount, currency, model.economy.transactionType.SpendGroupFunds, "Group Funds Payout", model.catalog.creatorType.User, model.catalog.creatorType.Group);
        await this.economy.createTransaction(userId, groupId, amount, currency, model.economy.transactionType.SpendGroupFunds, "Group Funds Payout", model.catalog.creatorType.Group, model.catalog.creatorType.User);
        return ({
            'success': true,
        });
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
    __param(0, common_1.QueryParams('ids', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "multiGetNames", null);
__decorate([
    common_1.Get('/:groupId/info'),
    swagger_1.Summary('Get group info'),
    swagger_1.Description('This endpoint is a bit exceptional. If the groupStatus is locked, it will only return { groupStatus: 1 } but if it is not locked, it will return all group info'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupId: invalid id\n' }),
    __param(0, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getInfo", null);
__decorate([
    common_1.Get('/:groupId/roles'),
    swagger_1.Summary('Get group roles'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGroupId: \n' }),
    swagger_1.ReturnsArray(200, { type: model.group.roleInfo }),
    __param(0, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getRoles", null);
__decorate([
    common_1.Get('/:groupId/role'),
    swagger_1.Summary('Get the authenticated users role in a group. If not authticated, returns guest info'),
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
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getShout", null);
__decorate([
    common_1.Get('/:groupId/wall'),
    swagger_1.Summary('Get group wall'),
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
    common_1.Put('/:groupId/wall'),
    swagger_1.Summary('Create a wall post'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    __param(0, common_1.QueryParams('name', String)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "search", null);
__decorate([
    common_1.Put('/:groupId/claim'),
    swagger_1.Summary('Claim a group with no owner'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "claimOwnership", null);
__decorate([
    common_1.Put('/:groupId/membership'),
    swagger_1.Summary('Join a group'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "join", null);
__decorate([
    common_1.Delete('/:groupId/membership'),
    swagger_1.Summary('Leave a group'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "leave", null);
__decorate([
    common_1.Patch('/:groupId/role/:roleSetId'),
    swagger_1.Summary('Update a roleset'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
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
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, multipartfiles_1.MultipartFile()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Array]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateIcon", null);
__decorate([
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Post('/create'),
    swagger_1.Summary('Create a group'),
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
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('groupId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('userId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "updateGroupOwner", null);
__decorate([
    common_1.Get('/:groupId/catalog'),
    swagger_1.Summary('Get group catalog'),
    __param(0, common_1.PathParams('groupId', Number)),
    __param(1, common_1.QueryParams('offset', Number)),
    __param(2, common_1.QueryParams('limit', Number)),
    __param(3, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], GroupsController.prototype, "getItems", null);
__decorate([
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Put('/:groupId/payout'),
    swagger_1.Summary('Spend group funds'),
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

