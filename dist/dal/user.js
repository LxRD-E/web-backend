"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const users = require("../models/v1/user");
const Catalog = require("../models/v1/catalog");
const Groups = require("../models/v1/group");
const Thumbnails = require("../models/v1/thumnails");
const config_1 = require("../helpers/config");
const auth_1 = require("./auth");
const _init_1 = require("./_init");
const passwordEncryptionKey = config_1.default.encryptionKeys.password;
const ipEncryptionKey = config_1.default.encryptionKeys.ip;
class UsersDAL extends _init_1.default {
    async getInfo(id, specificColumns) {
        if (!specificColumns) {
            specificColumns = ['userId', 'username', 'status', 'joinDate', 'blurb', 'lastOnline', 'banned', 'membership', 'tradingEnabled', 'staff', 'accountStatus'];
        }
        specificColumns.forEach((element, index, array) => {
            if (element === 'userId') {
                array[index] = 'id as userId';
            }
            else if (element === 'primaryBalance') {
                array[index] = 'user_balance1 as primaryBalance';
            }
            else if (element === 'secondaryBalance') {
                array[index] = 'user_balance2 as secondaryBalance';
            }
            else if (element === 'dailyAward') {
                array[index] = 'user_balancedailyaward as dailyAward';
            }
            else if (element === 'passwordChanged') {
                array[index] = 'password_changed as passwordChanged';
            }
            else if (element === 'membership') {
                array[index] = 'user_membership as membership';
            }
            else if (element === 'forumSignature') {
                array[index] = 'forum_signature as forumSignature';
            }
            else if (element === 'forumPostCount') {
                array[index] = 'forum_postcount as forumPostCount';
            }
            else if (element === 'lastOnline') {
                array[index] = 'user_lastonline as lastOnline';
            }
            else if (element === 'banned') {
                array[index] = 'is_banned as banned';
            }
            else if (element === 'banned') {
                array[index] = 'is_banned as banned';
            }
            else if (element === 'birthDate') {
                array[index] = 'user_birthdate as birthDate';
            }
            else if (element === 'joinDate') {
                array[index] = 'user_joindate as joinDate';
            }
            else if (element === 'blurb') {
                array[index] = 'user_blurb as blurb';
            }
            else if (element === 'staff') {
                array[index] = 'user_staff as staff';
            }
            else if (element === 'status') {
                array[index] = 'user_status as status';
            }
            else if (element === 'membership') {
                array[index] = 'user_membership as membership';
            }
            else if (element === 'tradingEnabled') {
                array[index] = 'user_tradingenabled as tradingEnabled';
            }
            else if (element === 'tradingEnabled') {
                array[index] = 'user_tradingenabled as tradingEnabled';
            }
            else if (element === 'theme') {
                array[index] = 'user_theme as theme';
            }
            else if (element === 'staff') {
                array[index] = 'user_staff as staff';
            }
            else if (element === 'accountStatus') {
                array[index] = 'account_status as accountStatus';
            }
        });
        const userInfoSelect = await this.knex('users').select(specificColumns).where({ 'users.id': id });
        const userInfoData = userInfoSelect[0];
        if (userInfoData === undefined) {
            throw false;
        }
        return userInfoData;
    }
    async updateDailyAward(userId) {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex('users').update({ 'user_balancedailyaward': time }).where({ 'id': userId }).limit(1);
    }
    async updateStaffRank(userId, newStaffRank) {
        await this.knex('users').update({ 'user_staff': newStaffRank }).where({ 'id': userId }).limit(1);
    }
    async getPastUsernames(userId) {
        const usernames = await this.knex('users_usernames').select('id as userNameId', 'username', 'userid as userId', 'date_created as dateCreated').where({ 'userid': userId }).orderBy('id', 'desc');
        return usernames;
    }
    async getLatestUsernameChange(userId) {
        const username = await this.knex('users_usernames').select('id as userNameId', 'username', 'userid as userId', 'date_created as dateCreated').where({ 'userid': userId }).orderBy('id', 'desc').limit(1);
        return username[0];
    }
    async isUsernameOk(username) {
        const onlyOneCharacterAllowedOf = [
            /\ /g,
            /\./g,
            /\_/g,
        ];
        for (const Regex of onlyOneCharacterAllowedOf) {
            const matches = username.match(Regex);
            if (matches && matches.length > 1) {
                return 'UsernameConstraint1Space1Period1Underscore';
            }
        }
        if (username.charAt(0) === " " || username.charAt(username.length - 1) === " ") {
            return 'UsernameConstriantCannotEndOrStartWithSpace';
        }
        const finalRegex = /[^a-zA-Z\d _.]/g;
        const GoodUsername = username.replace(finalRegex, '');
        if (GoodUsername !== username) {
            return 'UsernameConstraintInvalidCharacters';
        }
        if (GoodUsername.length > 18) {
            return 'UsernameConstriantTooLong';
        }
        if (GoodUsername.length < 3) {
            return 'UsernameConstrintTooShort';
        }
        return 'OK';
    }
    async getPastUsernameByName(username) {
        const nameInfo = await this.knex('users_usernames').select('id as userNameId', 'username', 'userid as userId', 'date_created as dateCreated').where({ 'username': username }).orderBy('id', 'desc').limit(1);
        if (!nameInfo[0]) {
            throw false;
        }
        return nameInfo[0];
    }
    async usernameAvailableForNameChange(contextUserId, username) {
        try {
            await this.userNameToId(username);
            return false;
        }
        catch (e) {
        }
        try {
            const pastUsernameInfo = await this.getPastUsernameByName(username);
            if (pastUsernameInfo.userId !== contextUserId) {
                return false;
            }
            return true;
        }
        catch (e) {
        }
        return true;
    }
    async addUserNameToNameChanges(userId, userName) {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex('users_usernames').insert({
            'username': userName,
            'userid': userId,
            'date_created': time,
        });
    }
    async changeUserName(userId, userName) {
        await this.knex('users').update({
            'username': userName,
        }).where({ 'users.id': userId }).limit(1);
    }
    async usernameAvailableForSignup(username) {
        try {
            await this.userNameToId(username);
            return false;
        }
        catch (e) {
        }
        try {
            await this.getPastUsernameByName(username);
            return false;
        }
        catch (e) {
        }
        return true;
    }
    async getPassword(userId) {
        const password = await this.knex('users').select('password').where({ 'users.id': userId });
        if (!password[0]) {
            throw false;
        }
        const decryptedPassword = await auth_1.decrypt(password[0]["password"], passwordEncryptionKey);
        return decryptedPassword;
    }
    async userNameToId(username) {
        const select = await this.knex('users').select('users.id as userId').where({ 'users.username': username });
        if (!select[0]) {
            let oldUsernames = await this.knex('users_usernames').select('userid as userId').where({ 'username': username }).limit(1);
            if (oldUsernames[0]) {
                return oldUsernames[0]['userId'];
            }
            throw false;
        }
        return select[0]['userId'];
    }
    async getUserEmail(id, specificColumns) {
        if (!specificColumns) {
            specificColumns = ['status'];
        }
        specificColumns.forEach((element, index, array) => {
            if (element === 'userId') {
                array[index] = 'userid as userId';
            }
            else if (element === 'verificationCode') {
                array[index] = 'verification_code as verificationCode';
            }
        });
        const select = await this.knex('user_emails').select(specificColumns).where({ 'userid': id }).limit(1).orderBy('id', 'desc');
        return select[0];
    }
    async logOnlineStatus(id) {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("users").update({ "user_lastonline": time }).where({ "users.id": id }).limit(1);
    }
    async createUser(username, hashedPassword, birthdate) {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const encryptedHash = await auth_1.encrypt(hashedPassword, passwordEncryptionKey);
        const insert = await this.knex('users').insert({
            'username': username,
            'password': encryptedHash,
            'password_changed': 0,
            'user_balance1': 0,
            'user_balance2': 0,
            'user_joindate': date,
            'user_lastonline': date,
            'user_birthdate': birthdate,
            'user_theme': users.theme.Light,
            'user_tradingenabled': users.tradingEnabled.true,
            'user_staff': users.staff.false,
            'is_banned': users.banned.false,
            'forum_postcount': 0,
            'user_membership': date,
            'user_balancedailyaward': date,
        });
        return insert[0];
    }
    async encryptIpAddress(ipAddress) {
        const encryptedIP = await auth_1.encrypt(ipAddress, ipEncryptionKey);
        return encryptedIP;
    }
    async logUserIp(userId, ipAddress, action) {
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        await this.knex("user_ip").insert({
            'userid': userId,
            'ip_address': encryptedIP,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'action': action
        });
    }
    async getUserIpAddresses(userId) {
        const ips = await this.knex('user_ip').distinct('ip_address as encryptedIpAddress').where({
            'userid': userId,
        });
        const encryptedIPs = [];
        for (const ip of ips) {
            encryptedIPs.push(ip.encryptedIpAddress);
        }
        return encryptedIPs;
    }
    async getUserIdsAssociatedWithIpAddress(encryptedIpAddress) {
        const ids = await this.knex('user_ip').distinct('userid as userId').where({
            'ip_address': encryptedIpAddress,
        });
        const userIds = [];
        for (const user of ids) {
            userIds.push(user.userId);
        }
        return userIds;
    }
    async checkForIpSignup(ipAddress) {
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        const results = await this.knex("user_ip").select("date").where({ 'ip_address': encryptedIP }).limit(1).orderBy("id", "desc");
        if (!results[0]) {
            return false;
        }
        if (this.moment().isSameOrAfter(this.moment(results[0]['ip_address']).add(1, 'days'))) {
            return false;
        }
        return true;
    }
    async addUserThumbnail(id, url) {
        await this.knex('thumbnails').del().where({ 'reference_id': id, 'type': Thumbnails.Type.UserThumb });
        await this.knex('thumbnails').insert({
            'reference_id': id,
            'type': Thumbnails.Type.UserThumb,
            'url': url,
        });
    }
    async getAvatar(id) {
        const userAvatar = await this.knex('user_avatar').select('user_avatar.catalog_id as catalogId', 'userid as userId', 'type', 'date').where({ userid: id });
        return userAvatar;
    }
    async wearingItem(userId, catalogId) {
        const userAvatar = await this.knex('user_avatar').select('user_avatar.id').where({ userid: userId, 'catalog_id': catalogId });
        if (userAvatar.length >= 1) {
            return true;
        }
        return false;
    }
    async getAvatarColors(id) {
        const userAvatarColors = await this.knex('user_avatarcolor').select('user_avatarcolor.*').where({ userid: id });
        return userAvatarColors;
    }
    async addAvatarColors(id, colorRequest) {
        await this.knex('user_avatarcolor').del().where({ 'userid': id });
        const insertRequest = {
            'userid': id,
            'headr': colorRequest["HeadRGB"][0],
            'headg': colorRequest["HeadRGB"][1],
            'headb': colorRequest["HeadRGB"][2],
            'legr': colorRequest["LegRGB"][0],
            'legg': colorRequest["LegRGB"][1],
            'legb': colorRequest["LegRGB"][2],
            'torsor': colorRequest["TorsoRGB"][0],
            'torsob': colorRequest["TorsoRGB"][1],
            'torsog': colorRequest["TorsoRGB"][2],
        };
        await this.knex('user_avatarcolor').insert(insertRequest);
    }
    async modifyUserBanStatus(id, type) {
        await this.knex('users').update({ 'is_banned': type }).where({ 'users.id': id });
        return true;
    }
    async modifyAccountStatus(userId, type) {
        await this.knex('users').update({ 'account_status': type }).where({ 'id': userId });
    }
    async deleteAccount(id) {
        await this.knex('users').update({ 'is_deleted': 1 }).where({ 'users.id': id });
    }
    async getFriends(id, offset, limit, sortOrder) {
        const friends = await this.knex('friendships').select('friendships.userid_two as userId', 'friendships.date', 'users.user_status as UserStatus').where({ 'userid_one': id }).offset(offset).limit(limit).innerJoin('users', 'users.id', 'friendships.userid_two').orderBy('friendships.id', sortOrder);
        return friends;
    }
    async countFriends(id) {
        const friendCount = await this.knex('friendships').select('id', 'userid_two as userId', 'date').where({ 'userid_one': id });
        return friendCount.length;
    }
    async getFriendRequests(userId, offset) {
        const awaitAccepting = await this.knex('friend_request').select('userid_requester as userId').where({ 'userid_requestee': userId }).limit(25).offset(offset);
        return awaitAccepting;
    }
    async MultiGetNamesFromIds(ids) {
        const query = this.knex('users').select('id as userId', 'username', 'users.account_status as accountStatus');
        ids.forEach((id) => {
            query.orWhere({ 'users.id': id });
        });
        const usernames = await query;
        usernames.forEach((user) => {
            if (user.accountStatus === users.accountStatus.deleted) {
                user.username = "[ Deleted Account " + user.userId + "]";
            }
            delete user.accountStatus;
        });
        return usernames;
    }
    async getThumbnailByUserId(id) {
        const thumbnail = await this.knex('thumbnails').select('thumbnails.url', 'reference_id as userId').where({ 'reference_id': id, 'type': Thumbnails.Type.UserThumb });
        return thumbnail[0];
    }
    async multiGetThumbnailsFromIds(ids) {
        const query = this.knex('thumbnails').select('thumbnails.url', 'reference_id as userId');
        ids.forEach((id) => {
            query.orWhere({ 'reference_id': id, 'type': Thumbnails.Type.UserThumb });
        });
        const thumbnails = await query;
        return thumbnails;
    }
    async multiGetStatus(ids, offset, limit) {
        const query = this.knex('user_status').select('user_status.userid as userId', 'user_status.status', 'user_status.date').limit(limit).offset(offset).orderBy('user_status.id', 'desc');
        ids.forEach((id) => {
            query.orWhere({ 'user_status.userid': id, });
        });
        const UserStatuses = await query;
        return UserStatuses;
    }
    async areUsersFriends(firstUserId, secondUserId) {
        const query = await this.knex("friendships").select("id").where({ "userid_one": firstUserId, "userid_two": secondUserId });
        if (query[0] !== undefined) {
            return true;
        }
        return false;
    }
    async getFriendshipStatus(firstUserId, secondUserId) {
        if (firstUserId === secondUserId) {
            return {
                areFriends: false,
                canSendFriendRequest: false,
                canAcceptFriendRequest: false,
                awaitingAccept: false,
            };
        }
        const alreadyFriends = await this.areUsersFriends(firstUserId, secondUserId);
        if (alreadyFriends) {
            return {
                areFriends: true,
                canSendFriendRequest: false,
                canAcceptFriendRequest: false,
                awaitingAccept: false,
            };
        }
        const canAccept = await this.knex("friend_request").select("id").where({ "userid_requester": secondUserId, "userid_requestee": firstUserId });
        if (canAccept[0]) {
            return {
                areFriends: false,
                canSendFriendRequest: false,
                canAcceptFriendRequest: true,
                awaitingAccept: false,
            };
        }
        const request = await this.knex("friend_request").select("id").where({ "userid_requestee": secondUserId, "userid_requester": firstUserId });
        if (request[0]) {
            return {
                areFriends: false,
                canSendFriendRequest: false,
                canAcceptFriendRequest: false,
                awaitingAccept: true,
            };
        }
        return {
            areFriends: false,
            canSendFriendRequest: true,
            canAcceptFriendRequest: false,
            awaitingAccept: false,
        };
    }
    async sendFriendRequest(userIdOne, userIdTwo) {
        await this.knex("friend_request").insert({ "userid_requester": userIdOne, "userid_requestee": userIdTwo });
    }
    async createFriendship(userIdOne, userIdTwo) {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("friend_request").where({ "userid_requester": userIdOne, "userid_requestee": userIdTwo }).del();
        await this.knex("friend_request").where({ "userid_requestee": userIdOne, "userid_requester": userIdTwo }).del();
        await this.knex("friendships").insert({ "userid_one": userIdOne, "userid_two": userIdTwo, "date": date });
        await this.knex("friendships").insert({ "userid_two": userIdOne, "userid_one": userIdTwo, "date": date });
    }
    async deleteFriendship(userIdOne, userIdTwo) {
        await this.knex("friend_request").where({ "userid_requester": userIdOne, "userid_requestee": userIdTwo }).del();
        await this.knex("friend_request").where({ "userid_requestee": userIdOne, "userid_requester": userIdTwo }).del();
        await this.knex('friendships').delete().where({
            'userid_one': userIdOne,
            'userid_two': userIdTwo,
        });
        await this.knex('friendships').delete().where({
            'userid_one': userIdTwo,
            'userid_two': userIdOne,
        });
    }
    async getInventory(id, category, offset, limit, orderBy) {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.category': category }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial').orderBy('user_inventory.id', orderBy).limit(limit).offset(offset);
        return inventory;
    }
    async countInventory(id, category) {
        const count = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.category': category }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').count("user_inventory.id as Total");
        if (!count || !count[0] || !count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"];
    }
    async getCollectibleInventory(id, offset, limit, orderBy) {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.is_collectible': Catalog.collectible.true }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'catalog.average_price as averagePrice').orderBy('user_inventory.id', orderBy).limit(limit).offset(offset);
        return inventory;
    }
    async countCollectibleInventory(id) {
        const count = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.is_collectible': Catalog.collectible.true }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').count("user_inventory.id as Total");
        if (!count || !count[0] || !count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"];
    }
    async getUserInventoryByCatalogId(userId, catalogId) {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.user_id': userId, 'user_inventory.catalog_id': catalogId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial').orderBy('user_inventory.id', "desc");
        return inventory;
    }
    async getItemByInventoryId(userInventoryId) {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.id': userInventoryId }).select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'user_inventory.user_id as userId').orderBy('user_inventory.id', "desc");
        return inventory[0];
    }
    async editItemPrice(userInventoryId, newPrice) {
        await this.knex("user_inventory").update({ "price": newPrice }).where({ "id": userInventoryId });
    }
    async takeAllItemsOffSale(userId) {
        await this.knex("user_inventory").update({ "price": 0 }).where({ 'user_id': userId });
    }
    async getGroups(userId) {
        const groups = await this.knex("group_members").select("groups.id as groupId", "groups.name as groupName", "groups.description as groupDescription", "groups.owner_userid as groupOwnerUserId", "groups.thumbnail_catalogid as groupIconCatalogId", "groups.membercount as groupMemberCount", "group_members.userid as userId", "group_members.roleid as userRolesetId", "group_roles.name as userRolesetName", "group_roles.rank as userRolsetRank").where({ "group_members.userid": userId, "groups.status": Groups.groupStatus.ok }).innerJoin("groups", "groups.id", "group_members.groupid").innerJoin("group_roles", "group_roles.id", "group_members.roleid").orderBy("group_roles.rank", "desc");
        return groups;
    }
    async countGroups(userId) {
        const count = await this.knex("group_members").count("id as Total").where({ "userid": userId });
        if (!count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"];
    }
    async getUserLatestStatus(userId) {
        const result = await this.knex("user_status").select("userid as userId", "status", "date").where({ "userid": userId }).limit(1).orderBy("id", "desc");
        return result[0];
    }
    async updateStatus(userId, newStatus) {
        await this.knex("users").update({ "user_status": newStatus }).where({ "users.id": userId });
        await this.knex("user_status").insert({
            "userid": userId,
            "status": newStatus,
            "date": this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }
    async search(offset, limit, sort, sortBy, query) {
        const search = this.knex("users").select(['id as userId', 'username', 'user_status as status', 'user_joindate as joinDate', 'user_lastonline as lastOnline', 'user_staff as staff']).limit(limit).offset(offset).orderBy(sortBy, sort);
        if (query) {
            search.where('users.username', 'like', '%' + query + '%');
        }
        search.where({ 'users.account_status': users.accountStatus.ok });
        const results = await search;
        return results;
    }
    async multiGetForumInfo(userIds) {
        const query = this.knex('users').select("id as userId", "forum_postcount as postCount", "user_staff as permissionLevel", "forum_signature as signature").limit(25);
        userIds.forEach((k) => {
            query.orWhere({ "id": k });
        });
        const forumData = await query;
        return forumData;
    }
    async incrementPostCount(userId) {
        const userInfo = await this.getInfo(userId, ['forumPostCount']);
        const currentCount = userInfo.forumPostCount;
        await this.knex("users").update({
            'forum_postcount': currentCount + 1,
        }).where({ 'id': userId });
    }
    async updatePassword(userId, newPasswordHash) {
        const encryptedPasswordHash = auth_1.encrypt(newPasswordHash, passwordEncryptionKey);
        await this.knex('users').update({
            'password': encryptedPasswordHash,
        }).where({ 'id': userId });
    }
    async getPasswordResetInfo(code) {
        const info = await this.knex("password_resets").select("id as passwordResetId", "userid as userId", "code", "date_created as dateCreated").where({ 'code': code });
        if (!info[0]) {
            throw false;
        }
        return info[0];
    }
    async deletePasswordResetRequest(code) {
        await this.knex("password_resets").delete().where({ 'code': code });
    }
    async insertPasswordReset(userId, code) {
        await this.knex("password_resets").insert({
            'userid': userId,
            'code': code,
            'date_created': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }
}
exports.default = UsersDAL;

