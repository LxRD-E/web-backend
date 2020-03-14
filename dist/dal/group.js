"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const groups = require("../models/v1/group");
const catalog = require("../models/v1/catalog");
const _init_1 = require("./_init");
class GroupsDAL extends _init_1.default {
    formatRoleset(roleSetData) {
        return {
            roleSetId: roleSetData.roleSetId,
            name: roleSetData.name,
            description: roleSetData.description,
            groupId: roleSetData.groupId,
            rank: roleSetData.rank,
            permissions: {
                getWall: roleSetData.getWall,
                postWall: roleSetData.postWall,
                getShout: roleSetData.getShout,
                postShout: roleSetData.postShout,
                manage: roleSetData.manage,
            }
        };
    }
    async getInfo(groupId) {
        const info = await this.knex("groups").select("groups.id as groupId", "groups.name as groupName", "groups.description as groupDescription", "groups.owner_userid as groupOwnerUserId", "groups.membercount as groupMemberCount", "groups.thumbnail_catalogid as groupIconCatalogId", "groups.status as groupStatus", 'groups.approval_required as groupMembershipApprovalRequired').where({ "groups.id": groupId }).limit(1);
        if (!info[0]) {
            throw false;
        }
        return info[0];
    }
    async MultiGetNamesFromIds(ids) {
        const query = this.knex('groups').select('name as groupName', 'id as groupId');
        ids.forEach((id) => {
            query.orWhere({ 'groups.id': id });
        });
        const usernames = await query;
        return usernames;
    }
    async getRoleById(roleSetId) {
        const rolesetInfo = await this.knex("group_roles").select("id as roleSetId", "name", "description", "groupid as groupId", "rank", "permission_get_wall as getWall", "permission_post_wall as postWall", "permission_get_shout as getShout", "permission_post_shout as postShout", "permission_manage_group as manage").where({ "id": roleSetId });
        if (!rolesetInfo[0]) {
            throw false;
        }
        return this.formatRoleset(rolesetInfo[0]);
    }
    async getRoleSetByRank(groupId, rank) {
        const role = await this.knex("group_roles").select("id as roleSetId", "name", "description", "groupid as groupId", "rank", "permission_get_wall as getWall", "permission_post_wall as postWall", "permission_get_shout as getShout", "permission_post_shout as postShout", "permission_manage_group as manage").where({ "groupid": groupId, "rank": rank });
        if (!role[0]) {
            throw new Error('InvalidRankOrGroupId');
        }
        return this.formatRoleset(role[0]);
    }
    async getUserRole(groupId, userId) {
        const roleset = await this.knex("group_members").select("roleid as roleSetId").where({ "groupid": groupId, "userid": userId });
        if (!roleset[0]) {
            const roleSet = await this.getRoleSetByRank(groupId, 0);
            return roleSet;
        }
        const role = await this.getRoleById(roleset[0].roleSetId);
        return role;
    }
    async getRoles(groupId) {
        const roles = await this.knex("group_roles").select("id as roleSetId", "name", "description", "groupid as groupId", "rank", "permission_get_wall as getWall", "permission_post_wall as postWall", "permission_get_shout as getShout", "permission_post_shout as postShout", "permission_manage_group as manage").where({ "groupid": groupId }).orderBy("rank", "asc");
        const formattedRoles = [];
        for (const role of roles) {
            formattedRoles.push(this.formatRoleset(role));
        }
        return formattedRoles;
    }
    async getMembers(groupId, roleSetId, offset, limit, sort) {
        const members = await this.knex("group_members").select("userid as userId", "roleid as roleSetId").where({ "groupid": groupId, "roleid": roleSetId }).limit(limit).offset(offset).orderBy("id", sort);
        return members;
    }
    async countMembers(groupId, roleSetId) {
        const members = await this.knex("group_members").count("id as Total").where({ "groupid": groupId, "roleid": roleSetId });
        return members[0]["Total"];
    }
    async getShout(groupId) {
        const shout = await this.knex("group_shout").select("userid as userId", "shout", "date", 'groupid as groupId').where({ "groupid": groupId }).limit(1).orderBy("id", "desc");
        return shout[0];
    }
    async getShouts(groupIds, limit = 100, offset = 0) {
        let shout = this.knex("group_shout").select("group_shout.userid as userId", "group_shout.shout", "group_shout.date", 'group_shout.groupid as groupId', 'groups.thumbnail_catalogid as thumbnailCatalogId').orderBy("group_shout.id", "desc").limit(limit).offset(offset).innerJoin('groups', 'groups.id', 'group_shout.groupid');
        for (const item of groupIds) {
            shout = shout.orWhere('groupid', '=', item);
        }
        const shoutResults = await shout;
        return shoutResults;
    }
    async getWall(groupId, offset, limit, orderBy) {
        const wall = await this.knex("group_wall").select("id as wallPostId", "groupid as groupId", "userid as userId", "content as wallPost", "date").where({ "groupid": groupId }).orderBy("id", orderBy).limit(limit).offset(offset);
        return wall;
    }
    async createWallPost(groupId, userId, content) {
        await this.knex("group_wall").insert({
            "groupid": groupId,
            "userid": userId,
            "content": content,
            "date": this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }
    async deleteWallPost(groupId, wallPostId) {
        await this.knex("group_wall").delete().where({
            "groupid": groupId,
            "id": wallPostId,
        });
    }
    async search(offset, limit, query) {
        const groupResults = this.knex("groups").select("groups.id as groupId", "groups.name as groupName", "groups.description as groupDescription", "groups.owner_userid as groupOwnerUserId", "groups.membercount as groupMemberCount", "groups.thumbnail_catalogid as groupIconCatalogId", "groups.status as groupStatus").limit(limit).orderBy("membercount", "desc").offset(offset);
        const results = await groupResults;
        return results;
    }
    async getRoleForNewMembers(groupId) {
        const role = await this.knex("group_roles").select("id as roleSetId", "name", "description", "groupid as groupId", "rank", "permission_get_wall as getWall", "permission_post_wall as postWall", "permission_get_shout as getShout", "permission_post_shout as postShout", "permission_manage_group as manage").where({ "groupid": groupId }).andWhere("rank", ">", 0).orderBy("rank", "asc").limit(1);
        if (!role[0]) {
            throw false;
        }
        return role[0];
    }
    async addUserToGroup(groupId, userId, roleSetId) {
        await this.knex.transaction(async (trx) => {
            await trx("group_members").insert({
                "groupid": groupId,
                "userid": userId,
                "roleid": roleSetId,
            });
            await this.updateGroupMembersCountTRX(trx, groupId);
            await trx.commit();
        });
    }
    async updateGroupMembersCountTRX(trx, groupId) {
        const currentMemberCount = await trx("group_members").count("id as Total").where({ "groupid": groupId }).forUpdate('group_members', 'groups');
        await trx('groups').update({ "membercount": currentMemberCount[0]["Total"] }).where({ "id": groupId });
    }
    async removeUserFromGroup(groupId, userId) {
        await this.knex.transaction(async (trx) => {
            await trx("group_members").delete().where({
                "groupid": groupId,
                "userid": userId,
            });
            await this.updateGroupMembersCountTRX(trx, groupId);
            await trx.commit();
        });
    }
    async updateGroupMemberCount(groupId) {
        await this.knex.transaction(async (trx) => {
            const currentMemberCount = await trx("group_members").count("id as Total").where({ "groupid": groupId }).forUpdate('group_members', 'groups');
            await trx('groups').update({ "membercount": currentMemberCount[0]["Total"] }).where({ "id": groupId });
            await trx.commit();
        });
    }
    async verifyPermissions(permissions) {
        if (!permissions) {
            return false;
        }
        if (permissions.getShout !== 1 && permissions.getShout !== 0) {
            return false;
        }
        if (permissions.getWall !== 1 && permissions.getWall !== 0) {
            return false;
        }
        if (permissions.postWall !== 1 && permissions.postWall !== 0) {
            return false;
        }
        if (permissions.postShout !== 1 && permissions.postShout !== 0) {
            return false;
        }
        if (permissions.manage !== 1 && permissions.manage !== 0) {
            return false;
        }
        return true;
    }
    async updateRoleset(roleSetId, name, description, rank, permissions) {
        await this.knex("group_roles").update({
            'name': name,
            'description': description,
            'rank': rank,
            'permission_get_wall': permissions.getWall,
            'permission_get_shout': permissions.getShout,
            'permission_post_wall': permissions.postWall,
            'permission_post_shout': permissions.postShout,
            'permission_manage_group': permissions.manage,
        }).where({ "id": roleSetId });
    }
    async createRoleset(groupId, name, description, rank, permissions) {
        await this.knex("group_roles").insert({
            'groupid': groupId,
            'name': name,
            'description': description,
            'rank': rank,
            'permission_get_wall': permissions.getWall,
            'permission_get_shout': permissions.getShout,
            'permission_post_wall': permissions.postWall,
            'permission_post_shout': permissions.postShout,
            'permission_manage_group': permissions.manage,
        });
    }
    async deleteRoleset(roleSetId) {
        await this.knex("group_roles").delete().where({ "id": roleSetId });
    }
    async updateUserRolesetInGroup(groupId, roleSetId, userId) {
        await this.knex("group_members").update({
            'roleid': roleSetId,
        }).where({ 'groupid': groupId, 'userid': userId });
    }
    async updateDescription(groupId, description) {
        await this.knex("groups").update({
            'description': description,
        }).where({ 'id': groupId });
    }
    async updateShout(groupId, userId, shout) {
        await this.knex("group_shout").insert({
            'groupid': groupId,
            'userid': userId,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'shout': shout,
        });
    }
    async create(name, description, userId, groupIconCatalogId) {
        const groupInfo = await this.knex("groups").insert({
            'name': name,
            'description': description,
            'owner_userid': userId,
            'membercount': 1,
            'status': groups.groupStatus.ok,
            'thumbnail_catalogId': groupIconCatalogId,
        });
        return groupInfo[0];
    }
    async updateGroupIconId(groupId, iconId) {
        await this.knex("groups").update({
            'thumbnail_catalogid': iconId,
        }).where({ 'id': groupId });
    }
    async updateGroupOwner(groupId, userId) {
        await this.knex("groups").update({
            'owner_userid': userId,
        }).where({ 'id': groupId });
    }
    async doesGroupRequireApprovalForNewMembers(groupId) {
        let status = await this.knex('groups').select('approval_required').where({
            'id': groupId,
        }).limit(1);
        if (status[0]['approval_required'] === 1) {
            return true;
        }
        return false;
    }
    async insertPendingGroupMember(groupId, userId) {
        await this.knex('group_members_pending').insert({
            'group_id': groupId,
            'user_id': userId,
        });
    }
    async isUserPendingToJoinGroup(groupId, userId) {
        let result = await this.knex('group_members_pending').select('id').where({
            'group_id': groupId,
            'user_id': userId,
        }).limit(1);
        if (result[0] && result[0]['id']) {
            return true;
        }
        return false;
    }
    async removeUserFromPendingGroupJoins(groupId, userId) {
        await this.knex('group_members_pending').delete().where({
            'group_id': groupId,
            'user_id': userId,
        });
    }
    async getPendingMembers(groupId, offset, limit) {
        let page = await this.knex('group_members_pending').select('group_id as groupId', 'user_id as userId').limit(limit).offset(offset);
        return page;
    }
    async updateGroupApprovalRequiredStatus(groupId, approvalRequired) {
        await this.knex("groups").update({
            'approval_required': approvalRequired,
        }).where({ 'id': groupId });
    }
    async getGroupItems(groupId, offset, limit, sort) {
        const selectQuery = this.knex("catalog").select("catalog.id as catalogId", "catalog.name as catalogName", "catalog.price", "catalog.currency", "catalog.creator as creatorId", "catalog.creator_type as creatorType", "catalog.original_creatorid as userId", "catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(25).offset(offset).orderBy('id', sort).where({
            'creator': groupId,
            'creator_type': catalog.creatorType.Group,
            'is_for_sale': catalog.isForSale.true,
        });
        return selectQuery;
    }
    async getGroupFunds(groupId) {
        const funds = await this.knex("groups").select("balance_one as Primary", "balance_two as Secondary").where({ 'id': groupId });
        return funds[0];
    }
}
exports.default = GroupsDAL;

