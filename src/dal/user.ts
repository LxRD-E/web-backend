/**
 * Imports
 */
// Models
import * as users from '../models/v1/user';
import * as Catalog from '../models/v1/catalog'
import * as Groups from '../models/v1/group';
import * as Thumbnails from '../models/v1/thumnails';
// Libs
import Config from '../helpers/config';
// AUTH-Stuff
import { decryptPasswordHash, encrypt, encryptPasswordHash, decrypt } from './auth'
// Init
import _init from './_init';
import * as model from '../models/models';
import * as geoip from 'geoip-lite';
import { dynamicSort } from '../helpers/DynamicSort';

/**
 * Encryption/Decryption Keys
 */
const passwordEncryptionKey = Config.encryptionKeys.password;
const ipEncryptionKey = Config.encryptionKeys.ip;

class UsersDAL extends _init {
    /**
     * Grab a user's info. Throws 'false' if invalid userId is provided
     * @param id User's ID
     * @param specificColumns Specific Columns from the Table to grab
     */
    public async getInfo(id: number, specificColumns?: Array<'userId' | 'username' | 'passwordChanged' | 'primaryBalance' | 'secondaryBalance' | 'dailyAward' | 'status' | 'blurb' | 'joinDate' | 'lastOnline' | 'birthDate' | 'theme' | 'tradingEnabled' | 'staff' | 'banned' | 'forumPostCount' | 'forumSignature' | 'accountStatus' | '2faEnabled' | 'isDeveloper'>): Promise<users.UserInfo> {
        if (!specificColumns) {
            specificColumns = ['userId', 'username', 'status', 'joinDate', 'blurb', 'lastOnline', 'banned', 'tradingEnabled', 'staff', 'accountStatus'];
        }
        specificColumns.forEach((element: string, index: number, array: Array<string>): void => {
            if (element === 'userId') {
                array[index] = 'id as userId';
            } else if (element === 'primaryBalance') {
                array[index] = 'user_balance1 as primaryBalance';
            } else if (element === 'secondaryBalance') {
                array[index] = 'user_balance2 as secondaryBalance';
            } else if (element === 'dailyAward') {
                array[index] = 'user_balancedailyaward as dailyAward';
            } else if (element === 'passwordChanged') {
                array[index] = 'password_changed as passwordChanged';
            } else if (element === 'forumSignature') {
                array[index] = 'forum_signature as forumSignature';
            } else if (element === 'forumPostCount') {
                array[index] = 'forum_postcount as forumPostCount';
            } else if (element === 'lastOnline') {
                array[index] = 'user_lastonline as lastOnline';
            } else if (element === 'banned') {
                array[index] = 'is_banned as banned';
            } else if (element === 'banned') {
                array[index] = 'is_banned as banned';
            } else if (element === 'birthDate') {
                array[index] = 'user_birthdate as birthDate';
            } else if (element === 'joinDate') {
                array[index] = 'user_joindate as joinDate';
            } else if (element === 'blurb') {
                array[index] = 'user_blurb as blurb';
            } else if (element === 'staff') {
                array[index] = 'user_staff as staff';
            } else if (element === 'status') {
                array[index] = 'user_status as status';
            } else if (element === 'tradingEnabled') {
                array[index] = 'user_tradingenabled as tradingEnabled';
            } else if (element === 'theme') {
                array[index] = 'user_theme as theme';
            } else if (element === 'staff') {
                array[index] = 'user_staff as staff';
            } else if (element === 'accountStatus') {
                array[index] = 'account_status as accountStatus';
            } else if (element === '2faEnabled') {
                array[index] = '2fa_enabled as 2faEnabled';
            } else if (element === 'isDeveloper') {
                array[index] = 'is_developer as isDeveloper';
            } else if (element === 'isLocked') {
                // array[index] = 'is_locked as isLocked';
            }
        });
        let query = this.knex('users').select(specificColumns).where({ 'users.id': id });
        const userInfoSelect = await query;
        const userInfoData = userInfoSelect[0] as users.UserInfo;
        if (userInfoData === undefined) {
            throw new Error('InvalidUserId');
        }
        return userInfoData;
    }

    /**
     * Update a user's daily award to the current date
     */
    public async updateDailyAward(userId: number): Promise<void> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex('users').update({ 'user_balancedailyaward': time }).where({ 'id': userId }).limit(1);
    }

    /**
     * Update a user's staff rank
     */
    public async updateStaffRank(userId: number, newStaffRank: number): Promise<void> {
        await this.knex('users').update({ 'user_staff': newStaffRank }).where({ 'id': userId }).limit(1);
    }

    /**
     * Get a user's past username(s). Empty array if none
     * @param userId 
     */
    public async getPastUsernames(userId: number): Promise<users.PastUsernames[]> {
        const usernames = await this.knex('users_usernames').select(
            'id as userNameId',
            'username',
            'userid as userId',
            'date_created as dateCreated',
        ).where({ 'userid': userId }).orderBy('id', 'desc');
        return usernames;
    }

    /**
     * Get a user's latest username change
     * @param userId 
     */
    public async getLatestUsernameChange(userId: number): Promise<users.PastUsernames> {
        const username = await this.knex('users_usernames').select(
            'id as userNameId',
            'username',
            'userid as userId',
            'date_created as dateCreated',
        ).where({ 'userid': userId }).orderBy('id', 'desc').limit(1);
        return username[0];
    }

    /**
     * Check if a Username is ok for signup, name changes, etc. Returned string corrosponds with HTTPErrors code, or "OK" if username is good.
     */
    public isUsernameOk(username: string): string {
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
        // So far looks good to go... Let's make sure the beginning and end don't have a space (to prevent stuff like impersonating)
        if (username.charAt(0) === " " || username.charAt(username.length - 1) === " ") {
            return 'UsernameConstriantCannotEndOrStartWithSpace';
        }
        // Filter out special characters with this regex string
        const finalRegex = /[^a-zA-Z\d _.]/g;
        // Replace final chars with nothing
        const GoodUsername = username.replace(finalRegex, '');
        // If character(s) were removed, return error
        if (GoodUsername !== username) {
            return 'UsernameConstraintInvalidCharacters';
        }
        // Too long
        if (GoodUsername.length > 18) {
            return 'UsernameConstriantTooLong';
        }
        // Too short
        if (GoodUsername.length < 3) {
            return 'UsernameConstrintTooShort';
        }
        // GOOD
        return 'OK';
    }

    /**
     * Get a past username's info from it's username. Throws false if not exists
     * @param username 
     */
    public async getPastUsernameByName(username: string): Promise<users.PastUsernames> {
        const nameInfo = await this.knex('users_usernames').select(
            'id as userNameId',
            'username',
            'userid as userId',
            'date_created as dateCreated',
        ).where({ 'username': username }).orderBy('id', 'desc').limit(1);
        if (!nameInfo[0]) {
            throw false;
        }
        return nameInfo[0];
    }

    /**
     * Check if a username is available for a user to change their username to
     * @param contextUserId 
     * @param username Name to try
     */
    public async usernameAvailableForNameChange(contextUserId: number, username: string): Promise<boolean> {
        // Check if already exists
        try {
            let result = await this.userNameToId(username);
            if (result !== contextUserId) {
                return false;
            }
        } catch (e) {
            // Doesn't Exist
        }
        // Check if exists in past username
        try {
            const pastUsernameInfo = await this.getPastUsernameByName(username);
            return pastUsernameInfo.userId === contextUserId;
        } catch (e) {
            // Doesn't Exist
        }
        return true;
    }

    /**
     * Add a user's old username to name changes table
     * @param userId 
     * @param userName 
     */
    public async addUserNameToNameChanges(userId: number, userName: string): Promise<void> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex('users_usernames').insert({
            'username': userName,
            'userid': userId,
            'date_created': time,
        });
    }

    /**
     * Change a user's name
     * @param userId The userId
     * @param userName The new username
     */
    public async changeUserName(userId: number, userName: string): Promise<void> {
        await this.knex('users').update({
            'username': userName,
        }).where({ 'users.id': userId }).limit(1);
    }

    /**
     * Check if a username is available for signup
     * @param username Name to try
     */
    public async usernameAvailableForSignup(username: string): Promise<boolean> {
        // Check if already exists
        try {
            await this.userNameToId(username);
            return false;
        } catch (e) {
            // Doesn't Exist
        }
        // Check if exists in past username
        try {
            await this.getPastUsernameByName(username);
            return false;
        } catch (e) {
            // Doesn't Exist
        }
        return true;
    }

    /**
     * Get a user's decrypted password hash
     * @param userId 
     */
    public async getPassword(userId: number): Promise<string> {
        const password = await this.knex('users').select('password').where({ 'users.id': userId });
        if (!password[0]) {
            // User doesn't exist
            throw new Error('InvalidUserId');
        }
        const decryptedPassword = await decryptPasswordHash(password[0]["password"]);
        return decryptedPassword as string;
    }

    /**
     * Convert a Username to it's ID
     * @param username Username String
     */
    public async userNameToId(username: string): Promise<number> {
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

    /**
     * Grab a user's email metadata. Returns empty object if no email. 
     * 
     * @notice Use models.settings.getUserEmail for the user's decrypted email address
     * @param id User ID
     * @param specificColumns Specific Email Columns
     */
    async getUserEmail(id: number, specificColumns?: Array<'id' | 'userId' | 'verificationCode' | 'status' | 'date'>): Promise<users.EmailModel> {
        if (!specificColumns) {
            specificColumns = ['status'];
        }
        specificColumns.forEach((element: string, index: number, array: Array<string>): void => {
            if (element === 'userId') {
                array[index] = 'userid as userId';
            } else if (element === 'verificationCode') {
                array[index] = 'verification_code as verificationCode';
            }
        });
        const select = await this.knex('user_emails').select(specificColumns).where({ 'userid': id }).limit(1).orderBy('id', 'desc');
        return select[0];
    }

    /**
     * Update the {user_lastonline} column of a user to the current time
     * @param id
     */
    public async logOnlineStatus(id: number): Promise<void> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("users").update({ "user_lastonline": time }).where({ "users.id": id }).limit(1);
    }

    /**
     * Create a new User and return UserId (if successful)
     * @param username Username
     * @param hashedPassword The password hash
     * @param birthdate Birthdate string
     */
    public async createUser(username: string, hashedPassword: string, birthdate: string): Promise<number> {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        const encryptedHash = await encryptPasswordHash(hashedPassword);
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

    /**
     * Encrypt an IP Address. This method currently doesn't have to be a promise, but if we move to threading for encryption/decryption, it will need to be async
     * @param ip 
     */
    public async encryptIpAddress(ipAddress: string): Promise<string> {
        const encryptedIP = await encrypt(ipAddress, ipEncryptionKey);
        return encryptedIP;
    }

    /**
     * Decrypt an IP address
     * @param ipAddress 
     */
    public async decryptIpAddress(ipAddress: string): Promise<string> {
        const decrypted = await decrypt(ipAddress, ipEncryptionKey);
        return decrypted;
    }

    /**
     * Log a User's Ip Address
     * @param userId The userId
     * @param ipAddress The IP Address to log
     * @param action Specific IP address action
     */
    public async logUserIp(userId: number, ipAddress: string, action: users.ipAddressActions): Promise<void> {
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        await this.knex("user_ip").insert({
            'userid': userId,
            'ip_address': encryptedIP,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'action': action
        });
    }

    /**
     * Given a userId, this method will return an array of encrypted IP addresses associated with the account.
     * @param userId 
     */
    public async getUserIpAddresses(userId: number): Promise<string[]> {
        const ips = await this.knex('user_ip').distinct('ip_address as encryptedIpAddress').where({
            'userid': userId,
        });
        const encryptedIPs = [] as string[];
        for (const ip of ips) {
            encryptedIPs.push(ip.encryptedIpAddress);
        }
        return encryptedIPs;
    }

    /**
     * Get User IDs associated with a specific IP Address
     * @param encryptedIpAddress 
     */
    public async getUserIdsAssociatedWithIpAddress(encryptedIpAddress: string): Promise<number[]> {
        const ids = await this.knex('user_ip').distinct('userid as userId').where({
            'ip_address': encryptedIpAddress,
        });
        const userIds = [] as number[];
        ids.forEach(id => userIds.push(id.userId));
        return userIds;
    }

    /**
     * Given an IP address, this method will check if it has been used within the last 24 hours for a signup.
     * 
     * If it has been used, it will return true. Otherwise, it will return false.
     */
    public async checkForIpSignup(ipAddress: string): Promise<boolean> {
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

    /**
     * Add a user's thumbnail to the Database. This will clear old thumbs as well
     * @param id User ID
     * @param url Thumbnail URL
     */
    async addUserThumbnail(id: number, url: string): Promise<void> {
        await this.knex('thumbnails').del().where({ 'reference_id': id, 'type': Thumbnails.Type.UserThumb });
        await this.knex('thumbnails').insert({
            'reference_id': id,
            'type': Thumbnails.Type.UserThumb,
            'url': url,
        });
    }

    /**
     * Get a user's avatar from their UserID
     * @param id User's ID
     */
    public async getAvatar(id: number): Promise<users.UserAvatarItem[]> {
        const userAvatar = await this.knex('user_avatar').select('user_avatar.catalog_id as catalogId', 'userid as userId', 'type', 'date').where({ userid: id });
        return userAvatar as users.UserAvatarItem[];
    }

    /**
     * Check if a user is wearing a specific catalogId
     * @param userId 
     * @param catalogId 
     */
    public async wearingItem(userId: number, catalogId: number): Promise<boolean> {
        const userAvatar = await this.knex('user_avatar').select('user_avatar.id').where({ userid: userId, 'catalog_id': catalogId });
        if (userAvatar.length >= 1) {
            return true;
        }
        return false;
    }

    /**
     * Get a user's avatar colorings from their UserID
     * @param id User's ID
     */
    public async getAvatarColors(id: number): Promise<users.UserAvatarColor[]> {
        const userAvatarColors = await this.knex('user_avatarcolor').select('user_avatarcolor.*').where({ userid: id });
        return userAvatarColors as users.UserAvatarColor[];
    }

    /**
     * Add avatar RGB Colors to the Database. This will also clear any old ones
     * @param id User ID
     * @param colorRequest 
     */
    public async addAvatarColors(id: number, colorRequest: users.UserColorRequest): Promise<void> {
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
        } as users.InsertAvatarColor;
        await this.knex('user_avatarcolor').insert(insertRequest);
    }

    /**
     * Unban or Ban a user
     * @param id User's ID
     */
    public async modifyUserBanStatus(id: number, type: users.banned): Promise<boolean> {
        await this.knex('users').update({ 'is_banned': type }).where({ 'users.id': id });
        return true;
    }

    /**
     * Update an account's status
     * @param userId 
     * @param type New status
     */
    public async modifyAccountStatus(userId: number, type: users.accountStatus): Promise<void> {
        await this.knex('users').update({ 'account_status': type }).where({ 'id': userId });
    }

    /**
     * Delete a user's account
     */
    public async deleteAccount(id: number): Promise<void> {
        await this.knex('users').update({ 'is_deleted': 1 }).where({ 'users.id': id });
    }

    /**
     * Get an array of a user's friends
     * @param id User ID
     */
    public async getFriends(id: number, offset: number, limit: number, sortOrder: 'asc' | 'desc'): Promise<Array<users.Friendship>> {
        const friends = await this.knex('friendships').select('friendships.userid_two as userId', 'friendships.date', 'users.user_status as UserStatus').where({ 'userid_one': id }).offset(offset).limit(limit).innerJoin('users', 'users.id', 'friendships.userid_two').orderBy('friendships.id', sortOrder);
        return friends as Array<users.Friendship>;
    }

    /**
     * Get a user's total count of friends
     */
    public async countFriends(id: number): Promise<number> {
        const friendCount = await this.knex('friendships').select('id', 'userid_two as userId', 'date').where({ 'userid_one': id });
        return friendCount.length;
    }

    /**
     * Get pending friend requests
     * @param userId 
     * @param offset 
     */
    public async getFriendRequests(userId: number, offset: number): Promise<users.FriendshipRequest[]> {
        const awaitAccepting = await this.knex('friend_request').select('userid_requester as userId').where({ 'userid_requestee': userId }).limit(25).offset(offset);
        return awaitAccepting;
    }

    /**
     * Get Usernames from an Array of IDs
     * @param ids Array of IDs
     */
    public async MultiGetNamesFromIds(ids: Array<number>): Promise<Array<users.MultiGetUsernames>> {
        const query = this.knex('users').select('id as userId', 'username', 'users.account_status as accountStatus');
        ids.forEach((id) => {
            query.orWhere({ 'users.id': id });
        });
        const usernames = await query;
        usernames.forEach((user: users.UserInfo) => {
            if (user.accountStatus === users.accountStatus.deleted) {
                user.username = "[Deleted" + user.userId + "]";
            }
            // @ts-ignore
            delete user.accountStatus;
        });
        return usernames as Array<users.MultiGetUsernames>;
    }

    /**
     * Get a user's thumbnail from their ID
     * @param id User ID
     */
    public async getThumbnailByUserId(id: number): Promise<users.ThumbnailResponse> {
        const thumbnail = await this.knex('thumbnails').select('thumbnails.url', 'reference_id as userId').where({ 'reference_id': id, 'type': Thumbnails.Type.UserThumb });
        return thumbnail[0] as users.ThumbnailResponse;
    }

    /**
     * Get Multiple Thumbnails of Users from their User ID
     * @param ids Array of User IDs
     */
    public async multiGetThumbnailsFromIds(ids: Array<number>): Promise<Array<users.ThumbnailResponse>> {
        const query = this.knex('thumbnails').select('thumbnails.url', 'reference_id as userId');
        ids.forEach((id) => {
            query.orWhere({ 'reference_id': id, 'type': Thumbnails.Type.UserThumb });
        });
        const thumbnails = await query;
        return thumbnails as Array<users.ThumbnailResponse>;
    }

    /**
     * Retrieve Multiple Statuses from UserIds at once
     */
    public async multiGetStatus(ids: Array<number>, offset: number, limit: number): Promise<Array<users.UserStatus>> {
        const query = this.knex('user_status').select('user_status.id as statusId', 'user_status.userid as userId', 'user_status.status', 'user_status.date', 'reaction_count_heart as heartReactionCount', 'comment_count as commentCount').limit(limit).offset(offset).orderBy('user_status.id', 'desc');
        ids.forEach((id) => {
            query.orWhere({ 'user_status.userid': id, });
        });
        const UserStatuses = await query;
        return UserStatuses as Array<users.UserStatus>;
    }

    public async canUserPostCommentToStatus(userId: number): Promise<boolean> {
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
        // now check replies
        let latestCommentReplies = await this.knex('user_status_comment_reply')
            .select('id')
            .where('created_at', '>', timeToCheck)
            .andWhere({
                'user_id': userId,
            })
        if (latestCommentReplies.length >= 25) {
            return false;
        }
        return true;
    }

    /**
     * Mutli-get the heart status for statusIds in respect to the {userId}
     */
    public async multiGetReactionStatusForUser(userId: number, statusIds: number[], reactionType: string): Promise<model.user.UserReactionInformation[]> {
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

    public async getStatusById(statusId: number): Promise<users.UserStatus> {
        const query = this.knex('user_status').select('user_status.id as statusId', 'user_status.userid as userId', 'user_status.status', 'user_status.date', 'reaction_count_heart as heartReactionCount', 'comment_count as commentCount').limit(1).where('id', '=', statusId);
        const UserStatuses = await query;
        if (!UserStatuses[0]) {
            throw new Error('InvalidStatusId');
        }
        return UserStatuses[0];
    }

    /**
     * Update a userStatus by it's id. Mostly meant for mod stuff
     * @param statusId 
     * @param newStatus 
     */
    public async updateStatusByid(statusId: number, newStatus: string): Promise<void> {
        await this.knex('user_status').update({ 'status': newStatus }).where({ 'id': statusId }).limit(1);
    }

    public async multiGetStatusById(statusIds: number[]): Promise<users.UserStatus[]> {
        let query = this.knex('user_status').select('user_status.id as statusId', 'user_status.userid as userId', 'user_status.status', 'user_status.date', 'reaction_count_heart as heartReactionCount', 'comment_count as commentCount');
        for (const id of statusIds) {
            query = query.orWhere('id', '=', id);
        }
        const UserStatuses = await query;
        return UserStatuses;
    }

    public async checkIfAlreadyReacted(statusId: number, userId: number, reactionType: string) {
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

    public async getUsersWhoReactedToStatus(statusId: number, reactionType: string): Promise<{ userId: number }[]> {
        if (reactionType !== '❤️') {
            throw new Error('Reaction type is not supported by this method. UsersDAL.checkIfAlreadyReacted()');
        }
        let reactions = await this.knex('user_status_reactions').select('user_id as userId').where({
            'status_id': statusId,
            'reaction': reactionType,
        }).limit(25);
        return reactions;
    }

    public async addCommentToStatus(statusId: number, userId: number, comment: string) {
        await this.knex.transaction(async (trx) => {
            // Add comment
            await trx('user_status_comment').insert({
                'status_id': statusId,
                'user_id': userId,
                'comment': comment,
            }).forUpdate('user_status', 'user_status_comment');
            // Increment reaction count
            await trx('user_status').increment('comment_count').where({
                'id': statusId,
            }).forUpdate('user_status', 'user_status_comment');
            // Commit
            await trx.commit();
            // Ok
        });
    }

    public async replyToUserStatusComment(commentId: number, userId: number, reply: string) {
        await this.knex.transaction(async (trx) => {
            // Add comment
            await trx('user_status_comment_reply').insert({
                'userstatuscomment_id': commentId,
                'user_id': userId,
                'comment': reply,
            }).forUpdate('user_status_comment_reply', 'user_status_comment');
            // Increment reply count
            await trx('user_status_comment').increment('reply_count').where({
                'id': commentId,
            }).forUpdate('user_status_comment_reply', 'user_status_comment');
            // Commit
            await trx.commit();
            // Ok
        });
    }

    public async getUserStatusCommentById(commentId: number, statusId: number): Promise<model.user.UserStatusComment> {
        let comments = await this.knex('user_status_comment').select('id as userStatusCommentId', 'user_id as userId', 'status_id as statusId', 'comment', 'created_at as createdAt', 'updated_at as updatedAt', 'reply_count as replyCount').limit(1).orderBy('id', 'asc').where({ 'id': commentId, 'status_id': statusId });
        if (comments[0]) {
            return comments[0];
        }
        throw new Error('InvalidCommentId');
    }

    public async getCommentsToStatus(statusId: number, offset: number, limit: number): Promise<model.user.UserStatusComment[]> {
        let comments = await this.knex('user_status_comment').select('id as userStatusCommentId', 'user_id as userId', 'status_id as statusId', 'comment', 'created_at as createdAt', 'updated_at as updatedAt', 'reply_count as replyCount').limit(limit).offset(offset).orderBy('id', 'asc').where({ 'status_id': statusId });
        return comments;
    }

    public async getRepliesToStatusComment(commentId: number, offset: number, limit: number): Promise<model.user.UserStatusCommentReply[]> {
        let comments = await this.knex('user_status_comment_reply').select('id as commentReplyId', 'user_id as userId', 'comment', 'created_at as createdAt', 'updated_at as updatedAt').limit(limit).offset(offset).where({ 'userstatuscomment_id': commentId });
        return comments;
    }

    public async addReactionToStatus(statusId: number, userId: number, reactionType: string) {
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
            // Add reaction
            await trx('user_status_reactions').insert({
                'status_id': statusId,
                'user_id': userId,
                'reaction': reactionType,
            }).forUpdate('user_status', 'user_status_reactions');
            // Increment reaction count
            if (reactionType === '❤️') {
                await trx('user_status').increment('reaction_count_heart').where({
                    'id': statusId,
                }).forUpdate('user_status', 'user_status_reactions');
            } else {
                throw new Error('Cannot increment reaction count for invalid reactionType');
            }
            // Commit
            await trx.commit();
            // Ok
        });
    }

    public async removeReactionToStatus(statusId: number, userId: number, reactionType: string) {
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
            // Add reaction
            await trx('user_status_reactions').delete().where({
                'status_id': statusId,
                'user_id': userId,
                'reaction': reactionType,
            }).forUpdate('user_status', 'user_status_reactions');
            // Increment reaction count
            if (reactionType === '❤️') {
                await trx('user_status').decrement('reaction_count_heart').where({
                    'id': statusId,
                }).forUpdate('user_status', 'user_status_reactions');
            } else {
                throw new Error('Cannot decrement reaction count for invalid reactionType');
            }
            // Commit
            await trx.commit();
            // Ok
        });
    }

    /**
     * Check if two users are friends with eachother
     * @param firstUserId First User ID
     * @param secondUserId Second User ID
     */
    public async areUsersFriends(firstUserId: number, secondUserId: number): Promise<boolean> {
        const query = await this.knex("friendships").select("id").where({ "userid_one": firstUserId, "userid_two": secondUserId });
        if (query[0] !== undefined) {
            return true;
        }
        return false;
    }

    /**
     * Get the Friendship Status between two users, in the context of firstUserId
     * @param firstUserId First User ID
     * @param secondUserId Second User ID
     */
    public async getFriendshipStatus(firstUserId: number, secondUserId: number): Promise<users.FriendshipStatus> {
        if (firstUserId === secondUserId) {
            return {
                areFriends: false,
                canSendFriendRequest: false,
                canAcceptFriendRequest: false,
                awaitingAccept: false,
            } as users.FriendshipStatus;
        }
        const alreadyFriends = await this.areUsersFriends(firstUserId, secondUserId);
        if (alreadyFriends) {
            return {
                areFriends: true,
                canSendFriendRequest: false,
                canAcceptFriendRequest: false,
                awaitingAccept: false,
            } as users.FriendshipStatus;
        }
        // Check if second user sent request
        const canAccept = await this.knex("friend_request").select("id").where({ "userid_requester": secondUserId, "userid_requestee": firstUserId });
        if (canAccept[0]) {
            return {
                areFriends: false,
                canSendFriendRequest: false,
                canAcceptFriendRequest: true,
                awaitingAccept: false,
            } as users.FriendshipStatus;
        }
        // Check if first user sent request
        const request = await this.knex("friend_request").select("id").where({ "userid_requestee": secondUserId, "userid_requester": firstUserId });
        if (request[0]) {
            return {
                areFriends: false,
                canSendFriendRequest: false,
                canAcceptFriendRequest: false,
                awaitingAccept: true,
            } as users.FriendshipStatus;
        }
        return {
            areFriends: false,
            canSendFriendRequest: true,
            canAcceptFriendRequest: false,
            awaitingAccept: false,
        } as users.FriendshipStatus;
    }

    /**
     * Send a Friend Request to a User
     * @param userIdOne Context User, aka requester
     * @param userIdTwo User to send Friend Request to, aka requestee
     */
    public async sendFriendRequest(userIdOne: number, userIdTwo: number): Promise<void> {
        await this.knex.transaction(async (trx) => {
            // confirm requests dont already exist
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

    /**
     * Create a friendship between two users. This will also delete any pending requests
     * @param userIdOne User ID
     * @param userIdTwo User ID
     */
    public async createFriendship(userIdOne: number, userIdTwo: number): Promise<void> {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("friend_request").where({ "userid_requester": userIdOne, "userid_requestee": userIdTwo }).del();
        await this.knex("friend_request").where({ "userid_requestee": userIdOne, "userid_requester": userIdTwo }).del();
        await this.knex("friendships").insert({ "userid_one": userIdOne, "userid_two": userIdTwo, "date": date });
        await this.knex("friendships").insert({ "userid_two": userIdOne, "userid_one": userIdTwo, "date": date });
    }
    /**
     * Delete an established friendship
     * @param userIdOne 
     * @param userIdTwo 
     */
    public async deleteFriendship(userIdOne: number, userIdTwo: number): Promise<void> {
        // Delete Requests
        await this.knex("friend_request").where({ "userid_requester": userIdOne, "userid_requestee": userIdTwo }).del();
        await this.knex("friend_request").where({ "userid_requestee": userIdOne, "userid_requester": userIdTwo }).del();
        // Delete Friendship
        await this.knex('friendships').delete().where({
            'userid_one': userIdOne,
            'userid_two': userIdTwo,
        });
        await this.knex('friendships').delete().where({
            'userid_one': userIdTwo,
            'userid_two': userIdOne,
        });
    }

    /**
     * Get a user's inventory sorted by category
     * @param id User ID
     * @param category Category Enum
     * @param offset Offset
     */
    public async getInventory(id: number, category: Catalog.category, offset: number, limit: number, orderBy: 'asc' | 'desc'): Promise<Array<users.UserInventory>> {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.category': category }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial').orderBy('user_inventory.id', orderBy).limit(limit).offset(offset);
        return inventory as users.UserInventory[];
    }

    /**
     * Count a user's item's of a specific category
     * @param id User ID
     * @param category Category to search for
     */
    public async countInventory(id: number, category: Catalog.category): Promise<number> {
        const count = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.category': category }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').count("user_inventory.id as Total");
        if (!count || !count[0] || !count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"] as number;
    }

    /**
     * Get a user's collectible inventory sorted by category
     * @param id User ID
     * @param category Category Enum
     * @param offset Offset
     */
    public async getCollectibleInventory(
        id: number,
        offset: number,
        limit: number,
        orderBy: 'asc' | 'desc'
    ): Promise<users.UserCollectibleInventoryResponse> {
        // grab inventory with limit+1
        const inventory = await this.knex('user_inventory')
            .where({
                'user_inventory.user_id': id,
                'catalog.is_collectible': Catalog.collectible.true
            }).innerJoin(
                'catalog',
                'catalog.id',
                '=',
                'user_inventory.catalog_id'
            ).select(
                'user_inventory.id as userInventoryId',
                'user_inventory.catalog_id as catalogId',
                'user_inventory.price as price',
                'catalog.name as catalogName',
                'catalog.is_collectible as collectible',
                'catalog.category',
                'user_inventory.serial',
                'catalog.average_price as averagePrice'
            ).orderBy(
                'user_inventory.id',
                orderBy
            ).limit(limit + 1).offset(offset);
        // if more than limit returned, more are available
        if (inventory.length > limit) {
            return {
                areMoreAvailable: true,
                items: inventory.slice(0, limit),
            }
        } else {
            // less than limit returned, so no more available
            return {
                areMoreAvailable: false,
                items: inventory,
            }
        }
    }

    /**
     * Search a user's collectible inventory sorted by category
     * @param id User ID
     */
    public async searchCollectibleInventory(
        id: number,
        query: string,
        offset: number,
        limit: number
    ): Promise<users.UserCollectibleInventoryResponse> {
        // temporary until we find a better solution...
        query = query.replace('%', '\%');
        // grab inventory with limit+1
        const inventory = await this.knex('user_inventory')
            .where({
                'user_inventory.user_id': id,
                'catalog.is_collectible': Catalog.collectible.true
            }).innerJoin(
                'catalog',
                'catalog.id',
                '=',
                'user_inventory.catalog_id'
            ).select(
                'user_inventory.id as userInventoryId',
                'user_inventory.catalog_id as catalogId',
                'user_inventory.price as price',
                'catalog.name as catalogName',
                'catalog.is_collectible as collectible',
                'catalog.category',
                'user_inventory.serial',
                'catalog.average_price as averagePrice'
            ).limit(limit + 1).offset(offset)
            .where(
                'catalog.name',
                'like',
                '%' + query + '%'
            );
        // if more than limit returned, more are available
        if (inventory.length > limit) {
            return {
                areMoreAvailable: true,
                items: inventory.slice(0, limit),
            }
        } else {
            // less than limit returned, so no more available
            return {
                areMoreAvailable: false,
                items: inventory,
            }
        }
    }

    /**
     * Count a user's collectible items of a specific category
     * @param id User ID
     * @param category Category to search for
     */
    public async countCollectibleInventory(id: number): Promise<number> {
        const count = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.is_collectible': Catalog.collectible.true }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').count("user_inventory.id as Total");
        if (!count || !count[0] || !count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"] as number;
    }

    /**
     * Return an array of catalog items the user owns that have the same catalogid as the one specified
     * @param userId User ID
     * @param catalogId Catalog Item's ID
     */
    public async getUserInventoryByCatalogId(userId: number, catalogId: number): Promise<Array<users.UserInventory>> {
        let query = this.knex('user_inventory').where({ 'user_inventory.user_id': userId, 'user_inventory.catalog_id': catalogId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial').orderBy('user_inventory.id', "desc");
        const inventory = await query;
        return inventory as users.UserInventory[];
    }

    /**
     * Get an array of unique catalogIds owned by the {userId} that are collectible
     * @param userId 
     */
    public async getUniqueOwnedCollectibleCatalogIds(userId: number): Promise<number[]> {
        let query = await this.knex('user_inventory').distinct('user_inventory.catalog_id').where({
            'user_id': userId
        });
        return query;
    }

    /**
     * Get a user_inventory item by it's id
     * @param userInventoryId Inventory ID
     */
    public async getItemByInventoryId(userInventoryId: number): Promise<users.FullUserInventory> {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.id': userInventoryId }).select('user_inventory.id as userInventoryId', 'user_inventory.catalog_id as catalogId', 'user_inventory.price as price', 'user_inventory.user_id as userId').orderBy('user_inventory.id', "desc");
        return inventory[0] as users.FullUserInventory;
    }

    /**
     * Edit a user_inventory item's price
     * @param userInventoryId Catalog Item's Inventory ID
     * @param newPrice The new price
     */
    public async editItemPrice(userInventoryId: number, newPrice: number): Promise<void> {
        await this.knex("user_inventory").update({ "price": newPrice }).where({ "id": userInventoryId });
    }

    /**
     * Take all the userid's items offsale. This is useful, for instance, if the player is about to be banned.
     */
    public async takeAllItemsOffSale(userId: number): Promise<void> {
        await this.knex("user_inventory").update({ "price": 0 }).where({ 'user_id': userId });
    }

    /**
     * Get a user's groups from their ID
     * @param userId User's ID
     */
    public async getGroups(userId: number): Promise<users.UserGroups[]> {
        const groups = await this.knex("group_members").select("groups.id as groupId", "groups.name as groupName", "groups.description as groupDescription", "groups.owner_userid as groupOwnerUserId", "groups.thumbnail_catalogid as groupIconCatalogId", "groups.membercount as groupMemberCount", "group_members.userid as userId", "group_members.roleid as userRolesetId", "group_roles.name as userRolesetName", "group_roles.rank as userRolsetRank").where({ "group_members.userid": userId, "groups.status": Groups.groupStatus.ok }).innerJoin("groups", "groups.id", "group_members.groupid").innerJoin("group_roles", "group_roles.id", "group_members.roleid").orderBy("group_roles.rank", "desc");
        return groups as users.UserGroups[];
    }

    /**
     * Coun the amount of groups a user is a member of
     * @param userId User's ID
     */
    public async countGroups(userId: number): Promise<number> {
        const count = await this.knex("group_members").count("id as Total").where({ "userid": userId });
        if (!count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"] as number;
    }

    /**
     * Get User's Latest Status (including date)
     */
    public async getUserLatestStatus(userId: number): Promise<users.UserStatus> {
        const result = await this.knex("user_status").select("userid as userId", "status", "date").where({ "userid": userId }).limit(1).orderBy("id", "desc");
        return result[0] as users.UserStatus;
    }

    /**
     * Add a user's status to the DB/Update it
     * @param userId 
     * @param newStatus 
     */
    public async updateStatus(userId: number, newStatus: string): Promise<number> {
        await this.knex("users").update({ "user_status": newStatus }).where({ "users.id": userId });
        let idOfStatus = await this.knex("user_status").insert({
            "userid": userId,
            "status": newStatus,
            "date": this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
        return idOfStatus[0];
    }

    /**
     * Update users user_status but dont make a new status for the user
     * @param userId 
     * @param newStatus 
     */
    public async updateStatusWithoutInsert(userId: number, newStatus: string): Promise<void> {
        await this.knex("users").update({ "user_status": newStatus }).where({ "users.id": userId });
    }

    /**
     * Search Users. If no query is provided, users are returned by ID DESC order
     * @param offset 
     * @param limit 
     * @param sort 
     * @param query 
     */
    public async search(offset: number, limit: number, sort: 'asc' | 'desc', sortBy: 'id' | 'user_lastonline', query?: string): Promise<users.SearchResult[]> {

        const search = this.knex("users").select(['id as userId', 'username', 'user_status as status', 'user_joindate as joinDate', 'user_lastonline as lastOnline', 'user_staff as staff']).limit(limit).offset(offset).orderBy(sortBy, sort);
        if (query) {
            search.where('users.username', 'like', '%' + query + '%');
        }
        search.where({ 'users.account_status': users.accountStatus.ok });
        const results = await search;
        return results;
    }

    /**
     * Get Forum Info for Users
     * @param userIds 
     */
    public async multiGetForumInfo(userIds: number[]): Promise<users.ForumInfo[]> {
        const query = this.knex('users').select("id as userId", "forum_postcount as postCount", "user_staff as permissionLevel", "forum_signature as signature").limit(25);
        userIds.forEach((k) => {
            query.orWhere({ "id": k })
        });
        const forumData = await query;
        return forumData;
    }

    /**
     * Increment a user's Post Count
     * @deprecated Use transactions instead
     */
    public async incrementPostCount(userId: number): Promise<void> {
        await this.knex("users").where({ 'id': userId }).increment('forum_postcount');
    }

    /**
     * Update a user's password
     * @param userId 
     * @param newPasswordHash 
     */
    public async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
        const encryptedPasswordHash = encryptPasswordHash(newPasswordHash);
        await this.knex('users').update({
            'password': encryptedPasswordHash,
        }).where({ 'id': userId });
    }

    /**
     * Get Password Reset Info by Code String
     * @param code 
     */
    public async getPasswordResetInfo(code: string): Promise<users.PasswordResetInfo> {
        const info = await this.knex("password_resets").select(
            "id as passwordResetId",
            "userid as userId",
            "code",
            "date_created as dateCreated",
        ).where({ 'code': code });
        if (!info[0]) {
            throw new Error('InvalidCode');
        }
        return info[0];
    }

    /**
     * Delete a Password Reset Request
     */
    public async deletePasswordResetRequest(code: string): Promise<void> {
        await this.knex("password_resets").delete().where({ 'code': code });
    }

    /**
     * Insert a Password Reset Request
     */
    public async insertPasswordReset(userId: number, code: string): Promise<void> {
        await this.knex("password_resets").insert({
            'userid': userId,
            'code': code,
            'date_created': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Get known unique IPs of the {userId}
     * @param userId 
     */
    public async getKnownUniqueIps(userId: number, limit: number = 100): Promise<string[]> {
        let query = this.knex("user_ip").distinct('ip_address').limit(limit).where({
            'userid': userId,
        })
        let res = await query;
        let updates: Promise<any>[] = [];
        for (const item of res) {
            updates.push(this.decryptIpAddress(item['ip_address']));
        }
        let stringIps: string[] = await Promise.all(updates);
        return stringIps;
    }

    /**
     * Get country information from an ip
     * @param ip 
     */
    public getCountryDataFromIp(ip: string): geoip.Lookup & { countryCode: string } | undefined {
        let result: any = this.geoip.lookup(ip);
        if (!result) {
            return;
        }
        result.countryCode = result.country;
        result.country = this.countryList.getName(result.countryCode)
        return result;
    }

    /**
     * Get ip actions
     * @param actionType 
     * @param sort asc or desc, defaults to desc
     */
    public async getIpActions(actionType?: number, sort: 'asc' | 'desc' = 'desc', limit: number = 100, offset: number = 0): Promise<model.user.IPActionEntry[]> {
        let query = this.knex('user_ip').select('id as actionId', 'userid as userId', 'ip_address as encryptedIpAddress', 'date', 'action').limit(limit).offset(offset);
        if (typeof actionType === 'number') {
            query.where({
                'action': actionType,
            })
        }
        if (sort === 'desc') {
            query.orderBy('id', 'desc');
        }
        let results = await query;
        let newResults: any[] = [];
        let newResultsProms: any[] = [];
        const processResult = async (val: any) => {
            let ip = await this.decryptIpAddress(val.encryptedIpAddress);
            let country = this.getCountryDataFromIp(ip);
            val.country = (country && country.country) || 'UNKNOWN';
            delete val.encryptedIpAddress;
            newResults.push(val);
        }
        for (const item of results) {
            newResultsProms.push(processResult(item));
        }
        await Promise.all(newResultsProms);
        return newResults.sort(dynamicSort('-actionId'));
    }

    /**
     * Check if a user has used the ipaddress specified for an action(s) specified. Will only check the latest of each action
     * @param userId 
     * @param actionsToCheckFor 
     */
    public async checkIfIpIsNew(userId: number, ipAddress: string, actionsToCheckFor: model.user.ipAddressActions[] | model.user.ipAddressActions): Promise<boolean> {
        const time = this.moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss');
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        if (typeof actionsToCheckFor === 'object') {
            // Array
            let query = this.knex("user_ip").select("date").limit(1).orderBy("id", "desc");
            for (const item of actionsToCheckFor) {
                query = query.orWhere({ 'ip_address': encryptedIP, 'action': item, 'userid': userId }).andWhere('date', '>', time);
            }
            let results = await query;
            if (!results[0]) {
                return true;
            } else {
                return false;
            }
        } else {
            // Single action
            let results = await this.knex("user_ip").select("date").where({ 'ip_address': encryptedIP, 'action': actionsToCheckFor, 'userid': userId }).andWhere('date', '>', time).limit(1).orderBy("id", "desc");
            if (!results[0]) {
                return true;
            } else {
                return false;
            }
        }
    }

    /**
     * Get the full moderation history of a {userId}
     * @param userId 
     */
    public async getModerationHistory(userId: number): Promise<model.user.UserModerationAction[]> {
        return this.knex('user_moderation').select(['id as moderationActionId', 'userid as userId', 'reason', 'date as createdAt', 'until_unbanned as until', 'is_terminated as terminated']).orderBy('id', 'desc').where({
            'userid': userId,
        });
    }

    /**
     * Give or take away game developer permissions for the userId
     * @param userId
     * @param isDeveloper
     */
    public async updateIsDeveloper(userId: number, isDeveloper: boolean): Promise<void> {
        await this.knex('users').update({ 'is_developer': isDeveloper }).where({
            'id': userId,
        }).limit(1);
    }

    /**
     * Get leaderboards sorted by option
     * @param sort 
     * @param limit 
     * @param offset 
     */
    public async getLeaderboardSorted(sort: string, accountStatus: string, limit: number, offset: number): Promise<model.user.UserLeaderboardSortedEntry[]> {
        if (!model.staff.UserLeadboardSortOptions.includes(sort)) {
            sort = model.staff.UserLeadboardSortOptions[0];
        }
        if (!model.staff.UserLeaderboardAccountStatus.includes(accountStatus)) {
            accountStatus = model.staff.UserLeaderboardAccountStatus[0];
        }

        let query = this.knex('users').select('id as userId', 'username', 'user_balance1 as primaryBalance', 'user_balance2 as secondaryBalance', 'user_lastonline as lastOnline', 'account_status as accountStatus', 'user_staff as staff').limit(limit).offset(offset);
        if (sort === 'PrimaryCurrencyDesc') {
            query = query.orderBy('user_balance1', 'desc');
        } else if (sort === 'SecondaryCurrencyDesc') {
            query = query.orderBy('user_balance2', 'desc');
        } else if (sort === 'UserIdAsc') {
            query = query.orderBy('id', 'asc');
        } else if (sort === 'LastOnlineAsc') {
            query = query.orderBy('user_lastonline', 'asc');
        } else if (sort === 'LastOnlineDesc') {
            query = query.orderBy('user_lastonline', 'desc');
        }

        if (accountStatus === 'ok') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.ok,
            })
        } else if (accountStatus === 'banned') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.banned,
            })
        } else if (accountStatus === 'terminated') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.terminated,
            })
        } else if (accountStatus === 'deleted') {
            query = query.andWhere({
                'account_status': model.user.accountStatus.deleted,
            })
        }
        return await query;
    }
}

export default UsersDAL;
