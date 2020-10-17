"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const users = require("../models/v1/user");
const Catalog = require("../models/v1/catalog");
const Groups = require("../models/v1/group");
const Thumbnails = require("../models/v1/thumnails");
const config_1 = require("../helpers/config");
const auth_1 = require("./auth");
const _init_1 = require("./_init");
const model = require("../models/models");
const DynamicSort_1 = require("../helpers/DynamicSort");
const passwordEncryptionKey = config_1.default.encryptionKeys.password;
const ipEncryptionKey = config_1.default.encryptionKeys.ip;
class UsersDAL extends _init_1.default {
    async getInfo(id, specificColumns) {
        if (!specificColumns) {
            specificColumns = ['userId', 'username', 'status', 'joinDate', 'blurb', 'lastOnline', 'banned', 'tradingEnabled', 'staff', 'accountStatus'];
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
            else if (element === '2faEnabled') {
                array[index] = '2fa_enabled as 2faEnabled';
            }
            else if (element === 'isDeveloper') {
                array[index] = 'is_developer as isDeveloper';
            }
            else if (element === 'isLocked') {
            }
        });
        let query = this.knex('users').select(specificColumns).where({ 'users.id': id });
        const userInfoSelect = await query;
        const userInfoData = userInfoSelect[0];
        if (userInfoData === undefined) {
            throw new Error('InvalidUserId');
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
    isUsernameOk(username) {
        const onlyOneCharacterAllowedOf = [
            / /g,
            /\./g,
            /_/g,
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
            let result = await this.userNameToId(username);
            if (result !== contextUserId) {
                return false;
            }
        }
        catch (e) {
        }
        try {
            const pastUsernameInfo = await this.getPastUsernameByName(username);
            return pastUsernameInfo.userId === contextUserId;
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
            throw new Error('InvalidUserId');
        }
        const decryptedPassword = await auth_1.decryptPasswordHash(password[0]["password"]);
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
        const encryptedHash = await auth_1.encryptPasswordHash(hashedPassword);
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
            'user_balancedailyaward': date,
            'id': null,
        });
        return insert[0];
    }
    async encryptIpAddress(ipAddress) {
        const encryptedIP = await auth_1.encrypt(ipAddress, ipEncryptionKey);
        return encryptedIP;
    }
    async decryptIpAddress(ipAddress) {
        const decrypted = await auth_1.decrypt(ipAddress, ipEncryptionKey);
        return decrypted;
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
        ids.forEach(id => userIds.push(id.userId));
        return userIds;
    }
    async checkForIpSignup(ipAddress) {
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        const results = await this.knex("user_ip").select("date", 'id').where({ 'ip_address': encryptedIP, 'action': model.user.ipAddressActions.SignUp }).limit(1).orderBy("id", "desc");
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
                user.username = "[Deleted" + user.userId + "]";
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
        const query = this.knex('user_status').select('user_status.id as statusId', 'user_status.userid as userId', 'user_status.status', 'user_status.date', 'reaction_count_heart as heartReactionCount', 'comment_count as commentCount').limit(limit).offset(offset).orderBy('user_status.id', 'desc');
        ids.forEach((id) => {
            query.orWhere({ 'user_status.userid': id, });
        });
        const UserStatuses = await query;
        return UserStatuses;
    }
    async canUserPostCommentToStatus(userId) {
        let timeToCheck = this.knexTime(this.moment().subtract(1, 'hour'));
        let latestComments = await this.knex('user_status_comment')
            .select('id')
            .where('created_at', '>', timeToCheck)
            .andWhere({
            'user_id': userId,
        });
        if (latestComments.length >= 25) {
            return false;
        }
        let latestCommentReplies = await this.knex('user_status_comment_reply')
            .select('id')
            .where('created_at', '>', timeToCheck)
            .andWhere({
            'user_id': userId,
        });
        if (latestCommentReplies.length >= 25) {
            return false;
        }
        return true;
    }
    async multiGetReactionStatusForUser(userId, statusIds, reactionType) {
        let query = this.knex('user_status_reactions').select('id', 'status_id');
        for (const status of statusIds) {
            query = query.orWhere({
                'user_id': userId,
                'status_id': status,
                'reaction': reactionType,
            });
        }
        let results = await query;
        let multiStatusItem = [];
        for (const item of statusIds) {
            let didReact = false;
            for (const otherItem of results) {
                if (otherItem.status_id === item) {
                    didReact = true;
                    break;
                }
            }
            multiStatusItem.push({
                statusId: item,
                userId: userId,
                didReact: didReact,
            });
        }
        return multiStatusItem;
    }
    async getStatusById(statusId) {
        const query = this.knex('user_status').select('user_status.id as statusId', 'user_status.userid as userId', 'user_status.status', 'user_status.date', 'reaction_count_heart as heartReactionCount', 'comment_count as commentCount').limit(1).where('id', '=', statusId);
        const UserStatuses = await query;
        if (!UserStatuses[0]) {
            throw new Error('InvalidStatusId');
        }
        return UserStatuses[0];
    }
    async updateStatusByid(statusId, newStatus) {
        await this.knex('user_status').update({ 'status': newStatus }).where({ 'id': statusId }).limit(1);
    }
    async multiGetStatusById(statusIds) {
        let query = this.knex('user_status').select('user_status.id as statusId', 'user_status.userid as userId', 'user_status.status', 'user_status.date', 'reaction_count_heart as heartReactionCount', 'comment_count as commentCount');
        for (const id of statusIds) {
            query = query.orWhere('id', '=', id);
        }
        const UserStatuses = await query;
        return UserStatuses;
    }
    async checkIfAlreadyReacted(statusId, userId, reactionType) {
        if (reactionType !== '❤️') {
            throw new Error('Reaction type is not supported by this method. UsersDAL.checkIfAlreadyReacted()');
        }
        let alreadyReacted = await this.knex('user_status_reactions').select('id').where({
            'status_id': statusId,
            'user_id': userId,
            'reaction': reactionType,
        }).limit(1);
        if (alreadyReacted && alreadyReacted[0]) {
            return true;
        }
        return false;
    }
    async getUsersWhoReactedToStatus(statusId, reactionType) {
        if (reactionType !== '❤️') {
            throw new Error('Reaction type is not supported by this method. UsersDAL.checkIfAlreadyReacted()');
        }
        let reactions = await this.knex('user_status_reactions').select('user_id as userId').where({
            'status_id': statusId,
            'reaction': reactionType,
        }).limit(25);
        return reactions;
    }
    async addCommentToStatus(statusId, userId, comment) {
        await this.knex.transaction(async (trx) => {
            await trx('user_status_comment').insert({
                'status_id': statusId,
                'user_id': userId,
                'comment': comment,
            }).forUpdate('user_status', 'user_status_comment');
            await trx('user_status').increment('comment_count').where({
                'id': statusId,
            }).forUpdate('user_status', 'user_status_comment');
            await trx.commit();
        });
    }
    async replyToUserStatusComment(commentId, userId, reply) {
        await this.knex.transaction(async (trx) => {
            await trx('user_status_comment_reply').insert({
                'userstatuscomment_id': commentId,
                'user_id': userId,
                'comment': reply,
            }).forUpdate('user_status_comment_reply', 'user_status_comment');
            await trx('user_status_comment').increment('reply_count').where({
                'id': commentId,
            }).forUpdate('user_status_comment_reply', 'user_status_comment');
            await trx.commit();
        });
    }
    async getUserStatusCommentById(commentId, statusId) {
        let comments = await this.knex('user_status_comment').select('id as userStatusCommentId', 'user_id as userId', 'status_id as statusId', 'comment', 'created_at as createdAt', 'updated_at as updatedAt', 'reply_count as replyCount').limit(1).orderBy('id', 'asc').where({ 'id': commentId, 'status_id': statusId });
        if (comments[0]) {
            return comments[0];
        }
        throw new Error('InvalidCommentId');
    }
    async getCommentsToStatus(statusId, offset, limit) {
        let comments = await this.knex('user_status_comment').select('id as userStatusCommentId', 'user_id as userId', 'status_id as statusId', 'comment', 'created_at as createdAt', 'updated_at as updatedAt', 'reply_count as replyCount').limit(limit).offset(offset).orderBy('id', 'asc').where({ 'status_id': statusId });
        return comments;
    }
    async getRepliesToStatusComment(commentId, offset, limit) {
        let comments = await this.knex('user_status_comment_reply').select('id as commentReplyId', 'user_id as userId', 'comment', 'created_at as createdAt', 'updated_at as updatedAt').limit(limit).offset(offset).where({ 'userstatuscomment_id': commentId });
        return comments;
    }
    async addReactionToStatus(statusId, userId, reactionType) {
        if (reactionType !== '❤️') {
            throw new Error('Reaction type is not supported by this transaction. UsersDAL.addReactionToStatus()');
        }
        await this.knex.transaction(async (trx) => {
            let alreadyReacted = await trx('user_status_reactions').select('id').where({
                'status_id': statusId,
                'user_id': userId,
                'reaction': reactionType,
            }).limit(1).forUpdate('user_status_reactions', 'user_status');
            if (alreadyReacted && alreadyReacted[0]) {
                throw new Error('AlreadyReactedToStatus');
            }
            await trx('user_status_reactions').insert({
                'status_id': statusId,
                'user_id': userId,
                'reaction': reactionType,
            }).forUpdate('user_status', 'user_status_reactions');
            if (reactionType === '❤️') {
                await trx('user_status').increment('reaction_count_heart').where({
                    'id': statusId,
                }).forUpdate('user_status', 'user_status_reactions');
            }
            else {
                throw new Error('Cannot increment reaction count for invalid reactionType');
            }
            await trx.commit();
        });
    }
    async removeReactionToStatus(statusId, userId, reactionType) {
        if (reactionType !== '❤️') {
            throw new Error('Reaction type is not supported by this transaction. UsersDAL.addReactionToStatus()');
        }
        await this.knex.transaction(async (trx) => {
            let alreadyReacted = await trx('user_status_reactions').select('id').where({
                'status_id': statusId,
                'user_id': userId,
                'reaction': reactionType,
            }).limit(1).forUpdate('user_status_reactions', 'user_status');
            if (!alreadyReacted || !alreadyReacted[0]) {
                throw new Error('NotReactedToStatus');
            }
            await trx('user_status_reactions').delete().where({
                'status_id': statusId,
                'user_id': userId,
                'reaction': reactionType,
            }).forUpdate('user_status', 'user_status_reactions');
            if (reactionType === '❤️') {
                await trx('user_status').decrement('reaction_count_heart').where({
                    'id': statusId,
                }).forUpdate('user_status', 'user_status_reactions');
            }
            else {
                throw new Error('Cannot decrement reaction count for invalid reactionType');
            }
            await trx.commit();
        });
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
        await this.knex.transaction(async (trx) => {
            let firstUserAlreadyRequested = await trx('friend_request').select('id').where({
                'userid_requester': userIdOne,
                'userid_requestee': userIdTwo,
            }).limit(1).forUpdate('friend_request');
            if (firstUserAlreadyRequested[0]) {
                throw new Error('userIdOne has already created this request.');
            }
            let secondUserAlreadyRequested = await trx('friend_request').select('id').where({
                'userid_requestee': userIdOne,
                'userid_requester': userIdTwo,
            }).limit(1).forUpdate('friend_request');
            if (secondUserAlreadyRequested[0]) {
                throw new Error('userIdTwo has already created this request.');
            }
            await trx('friend_request').insert({ "userid_requester": userIdOne, "userid_requestee": userIdTwo }).forUpdate('friend_request');
        });
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
        const inventory = await this.knex('user_inventory')
            .where({
            'user_inventory.user_id': id,
            'catalog.is_collectible': Catalog.collectible.true
        }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'catalog.average_price as averagePrice').orderBy('user_inventory.id', orderBy).limit(limit + 1).offset(offset);
        if (inventory.length > limit) {
            return {
                areMoreAvailable: true,
                items: inventory.slice(0, limit),
            };
        }
        else {
            return {
                areMoreAvailable: false,
                items: inventory,
            };
        }
    }
    async searchCollectibleInventory(id, query, offset, limit) {
        query = query.replace('%', '\%');
        const inventory = await this.knex('user_inventory')
            .where({
            'user_inventory.user_id': id,
            'catalog.is_collectible': Catalog.collectible.true
        }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial', 'catalog.average_price as averagePrice').limit(limit + 1).offset(offset)
            .where('catalog.name', 'like', '%' + query + '%');
        if (inventory.length > limit) {
            return {
                areMoreAvailable: true,
                items: inventory.slice(0, limit),
            };
        }
        else {
            return {
                areMoreAvailable: false,
                items: inventory,
            };
        }
    }
    async countCollectibleInventory(id) {
        const count = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.is_collectible': Catalog.collectible.true }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').count("user_inventory.id as Total");
        if (!count || !count[0] || !count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"];
    }
    async getUserInventoryByCatalogId(userId, catalogId) {
        let query = this.knex('user_inventory').where({ 'user_inventory.user_id': userId, 'user_inventory.catalog_id': catalogId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial').orderBy('user_inventory.id', "desc");
        const inventory = await query;
        return inventory;
    }
    async getUniqueOwnedCollectibleCatalogIds(userId) {
        let query = await this.knex('user_inventory').distinct('user_inventory.catalog_id').where({
            'user_id': userId
        });
        return query;
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
        let idOfStatus = await this.knex("user_status").insert({
            "userid": userId,
            "status": newStatus,
            "date": this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
        return idOfStatus[0];
    }
    async updateStatusWithoutInsert(userId, newStatus) {
        await this.knex("users").update({ "user_status": newStatus }).where({ "users.id": userId });
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
        await this.knex("users").where({ 'id': userId }).increment('forum_postcount');
    }
    async updatePassword(userId, newPasswordHash) {
        const encryptedPasswordHash = auth_1.encryptPasswordHash(newPasswordHash);
        await this.knex('users').update({
            'password': encryptedPasswordHash,
        }).where({ 'id': userId });
    }
    async getPasswordResetInfo(code) {
        const info = await this.knex("password_resets").select("id as passwordResetId", "userid as userId", "code", "date_created as dateCreated").where({ 'code': code });
        if (!info[0]) {
            throw new Error('InvalidCode');
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
    async getKnownUniqueIps(userId, limit = 100) {
        let query = this.knex("user_ip").distinct('ip_address').limit(limit).where({
            'userid': userId,
        });
        let res = await query;
        let updates = [];
        for (const item of res) {
            updates.push(this.decryptIpAddress(item['ip_address']));
        }
        let stringIps = await Promise.all(updates);
        return stringIps;
    }
    getCountryDataFromIp(ip) {
        let result = this.geoip.lookup(ip);
        if (!result) {
            return;
        }
        result.countryCode = result.country;
        result.country = this.countryList.getName(result.countryCode);
        return result;
    }
    async getIpActions(actionType, sort = 'desc', limit = 100, offset = 0) {
        let query = this.knex('user_ip').select('id as actionId', 'userid as userId', 'ip_address as encryptedIpAddress', 'date', 'action').limit(limit).offset(offset);
        if (typeof actionType === 'number') {
            query.where({
                'action': actionType,
            });
        }
        if (sort === 'desc') {
            query.orderBy('id', 'desc');
        }
        let results = await query;
        let newResults = [];
        let newResultsProms = [];
        const processResult = async (val) => {
            let ip = await this.decryptIpAddress(val.encryptedIpAddress);
            let country = this.getCountryDataFromIp(ip);
            val.country = (country && country.country) || 'UNKNOWN';
            delete val.encryptedIpAddress;
            newResults.push(val);
        };
        for (const item of results) {
            newResultsProms.push(processResult(item));
        }
        await Promise.all(newResultsProms);
        return newResults.sort(DynamicSort_1.dynamicSort('-actionId'));
    }
    async checkIfIpIsNew(userId, ipAddress, actionsToCheckFor) {
        const time = this.moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss');
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        if (typeof actionsToCheckFor === 'object') {
            let query = this.knex("user_ip").select("date").limit(1).orderBy("id", "desc");
            for (const item of actionsToCheckFor) {
                query = query.orWhere({ 'ip_address': encryptedIP, 'action': item, 'userid': userId }).andWhere('date', '>', time);
            }
            let results = await query;
            if (!results[0]) {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            let results = await this.knex("user_ip").select("date").where({ 'ip_address': encryptedIP, 'action': actionsToCheckFor, 'userid': userId }).andWhere('date', '>', time).limit(1).orderBy("id", "desc");
            if (!results[0]) {
                return true;
            }
            else {
                return false;
            }
        }
    }
    async getModerationHistory(userId) {
        return this.knex('user_moderation').select(['id as moderationActionId', 'userid as userId', 'reason', 'date as createdAt', 'until_unbanned as until', 'is_terminated as terminated']).orderBy('id', 'desc').where({
            'userid': userId,
        });
    }
    async updateIsDeveloper(userId, isDeveloper) {
        await this.knex('users').update({ 'is_developer': isDeveloper }).where({
            'id': userId,
        }).limit(1);
    }
    async getLeaderboardSorted(sort, accountStatus, limit, offset) {
        if (!model.staff.UserLeadboardSortOptions.includes(sort)) {
            sort = model.staff.UserLeadboardSortOptions[0];
        }
        if (!model.staff.UserLeaderboardAccountStatus.includes(accountStatus)) {
            accountStatus = model.staff.UserLeaderboardAccountStatus[0];
        }
        let query = this.knex('users').select('id as userId', 'username', 'user_balance1 as primaryBalance', 'user_balance2 as secondaryBalance', 'user_lastonline as lastOnline', 'account_status as accountStatus', 'user_staff as staff').limit(limit).offset(offset);
        if (sort === 'PrimaryCurrencyDesc') {
            query = query.orderBy('user_balance1', 'desc');
        }
        else if (sort === 'SecondaryCurrencyDesc') {
            query = query.orderBy('user_balance2', 'desc');
        }
        else if (sort === 'UserIdAsc') {
            query = query.orderBy('id', 'asc');
        }
        else if (sort === 'LastOnlineAsc') {
            query = query.orderBy('user_lastonline', 'asc');
        }
        else if (sort === 'LastOnlineDesc') {
            query = query.orderBy('user_lastonline', 'desc');
        }
        if (accountStatus === 'ok') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.ok,
            });
        }
        else if (accountStatus === 'banned') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.banned,
            });
        }
        else if (accountStatus === 'terminated') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.terminated,
            });
        }
        else if (accountStatus === 'deleted') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.deleted,
            });
        }
        return await query;
    }
}
exports.default = UsersDAL;

