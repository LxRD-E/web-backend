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
import {encrypt, decrypt, encryptPasswordHash, decryptPasswordHash} from './auth'
// Init
import _init from './_init';
import * as model from '../models/models';
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
    public async getInfo(id: number, specificColumns?: Array<'userId' | 'username' | 'passwordChanged' | 'primaryBalance' | 'secondaryBalance' | 'membership' | 'dailyAward' | 'status' | 'blurb' | 'joinDate' | 'lastOnline' | 'birthDate' | 'theme' | 'tradingEnabled' | 'staff' | 'banned' | 'forumPostCount' | 'forumSignature' | 'accountStatus' | '2faEnabled'>): Promise<users.UserInfo> {
        if (!specificColumns) {
            specificColumns = ['userId', 'username', 'status', 'joinDate', 'blurb', 'lastOnline', 'banned', 'membership', 'tradingEnabled', 'staff', 'accountStatus'];
        }
        specificColumns.forEach((element: string, index: number, array: Array<string>): void => {
            if (element === 'userId') {
                array[index] = 'id as userId';
            }else if (element === 'primaryBalance') {
                array[index] = 'user_balance1 as primaryBalance';
            }else if (element === 'secondaryBalance') {
                array[index] = 'user_balance2 as secondaryBalance';
            }else if (element === 'dailyAward') {
                array[index] = 'user_balancedailyaward as dailyAward';
            }else if (element === 'passwordChanged') {
                array[index] = 'password_changed as passwordChanged';
            }else if (element === 'membership') {
                array[index] = 'user_membership as membership';
            }else if (element === 'forumSignature') {
                array[index] = 'forum_signature as forumSignature';
            }else if (element === 'forumPostCount') {
                array[index] = 'forum_postcount as forumPostCount';
            }else if (element === 'lastOnline') {
                array[index] = 'user_lastonline as lastOnline';
            }else if (element === 'banned') {
                array[index] = 'is_banned as banned';
            }else if (element === 'banned') {
                array[index] = 'is_banned as banned';
            }else if (element === 'birthDate') {
                array[index] = 'user_birthdate as birthDate';
            }else if (element === 'joinDate') {
                array[index] = 'user_joindate as joinDate';
            }else if (element === 'blurb') {
                array[index] = 'user_blurb as blurb';
            }else if (element === 'staff') {
                array[index] = 'user_staff as staff';
            }else if (element === 'status') {
                array[index] = 'user_status as status';
            }else if (element === 'membership') {
                array[index] = 'user_membership as membership';
            }else if (element === 'tradingEnabled') {
                array[index] = 'user_tradingenabled as tradingEnabled';
            }else if (element === 'tradingEnabled') {
                array[index] = 'user_tradingenabled as tradingEnabled';
            }else if (element === 'theme') {
                array[index] = 'user_theme as theme';
            }else if (element === 'staff') {
                array[index] = 'user_staff as staff';
            }else if (element === 'accountStatus') {
                array[index] = 'account_status as accountStatus';
            }else if (element === '2faEnabled') {
                array[index] = '2fa_enabled as 2faEnabled';
            }
        });
        const userInfoSelect = await this.knex('users').select(specificColumns).where({'users.id': id });
        const userInfoData = userInfoSelect[0] as users.UserInfo;
        if (userInfoData === undefined) {
            throw false;
        }
        return userInfoData;
    }

    /**
     * Update a user's daily award to the current date
     */
    public async updateDailyAward(userId: number): Promise<void> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex('users').update({'user_balancedailyaward':time}).where({'id': userId}).limit(1);
    }

    /**
     * Update a user's staff rank
     */
    public async updateStaffRank(userId: number, newStaffRank: number): Promise<void> {
        await this.knex('users').update({'user_staff':newStaffRank}).where({'id': userId}).limit(1);
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
        ).where({'userid': userId}).orderBy('id', 'desc');
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
        ).where({'userid': userId}).orderBy('id', 'desc').limit(1);
        return username[0];
    }

    /**
     * Check if a Username is ok for signup, name changes, etc. Returned string corrosponds with AuthError code.
     */
    public async isUsernameOk(username: string): Promise<string> {
        const onlyOneCharacterAllowedOf =  [
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
        // So far looks good to go... Let's make sure the begining and end don't have a space (to prevent stuff like impersonating)
        if (username.charAt(0) === " " || username.charAt(username.length-1) === " ") {
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
        ).where({'username': username}).orderBy('id', 'desc').limit(1);
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
            await this.userNameToId(username);
            return false;
        }catch(e) {
            // Doesn't Exist
        }
        // Check if exists in past username
        try {
            const pastUsernameInfo = await this.getPastUsernameByName(username);
            if (pastUsernameInfo.userId !== contextUserId) {
                return false;
            }
            return true;
        }catch(e) {
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
     * @param userId 
     * @param userName 
     */
    public async changeUserName(userId: number, userName: string): Promise<void> {
        await this.knex('users').update({
            'username': userName,
        }).where({'users.id':userId}).limit(1);
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
        }catch(e) {
            // Doesn't Exist
        }
        // Check if exists in past username
        try {
            await this.getPastUsernameByName(username);
            return false;
        }catch(e) {
            // Doesn't Exist
        }
        return true;
    }

    /**
     * Get a user's decrypted password hash
     * @param userId 
     */
    public async getPassword(userId: number): Promise<string> {
        const password = await this.knex('users').select('password').where({'users.id': userId });
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
        const select = await this.knex('users').select('users.id as userId').where({'users.username':username});
        if (!select[0]) {
            let oldUsernames = await this.knex('users_usernames').select('userid as userId').where({'username': username}).limit(1);
            if (oldUsernames[0]) {
                return oldUsernames[0]['userId'];
            }
            throw false;
        }
        return select[0]['userId'];
    }

    /**
     * Grab a user's email metadata. Returns empty object if no email. Use models.settings.getUserEmail for the user's decrypted email address
     * @param id User ID
     * @param specificColumns Specific Email Columns
     */
    async getUserEmail(id: number, specificColumns?: Array<'id'|'userId'|'verificationCode'|'status'|'date'>): Promise<users.EmailModel> {
        if (!specificColumns) {
            specificColumns = ['status'];
        }
        specificColumns.forEach((element: string, index: number, array: Array<string>): void => {
            if (element === 'userId') {
                array[index] = 'userid as userId';
            }else if (element === 'verificationCode') {
                array[index] = 'verification_code as verificationCode';
            }
        });
        const select = await this.knex('user_emails').select(specificColumns).where({'userid':id}).limit(1).orderBy('id', 'desc');
        return select[0];
    }

    /**
     * Mark a user as Online
     * @param userId User's ID
     */
    public async logOnlineStatus(id: number): Promise<void> {
        const time = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("users").update({"user_lastonline":time}).where({"users.id":id}).limit(1);
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
            'user_membership': date,
            'user_balancedailyaward': date,
        });
        return insert[0];
    }

    /**
     * Encrypt an IP Address
     * @param ip 
     */
    public async encryptIpAddress(ipAddress: string): Promise<string> {
        const encryptedIP = await encrypt(ipAddress, ipEncryptionKey);
        return encryptedIP;
    }

    /**
     * Log a User's Ip Address
     * @param userId 
     * @param ipAddress 
     * @param action 
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
     * Get IP Addresses used on an account
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
        for (const user of ids) {
            userIds.push(user.userId);
        }
        return userIds;
    }

    /**
     * Check if an IP has signed up in the last 24 hours
     */
    public async checkForIpSignup(ipAddress: string): Promise<boolean> {
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        const results = await this.knex("user_ip").select("date").where({'ip_address': encryptedIP}).limit(1).orderBy("id","desc");
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
        await this.knex('thumbnails').del().where({'reference_id':id,'type':Thumbnails.Type.UserThumb});
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
        const userAvatar = await this.knex('user_avatar').select('user_avatar.catalog_id as catalogId','userid as userId','type','date').where({userid: id});
        return userAvatar as users.UserAvatarItem[];
    }

    /**
     * Check if a user is wearing a specific catalogId
     * @param userId 
     * @param catalogId 
     */
    public async wearingItem(userId: number, catalogId: number): Promise<boolean> {
        const userAvatar = await this.knex('user_avatar').select('user_avatar.id').where({userid: userId,'catalog_id':catalogId});
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
        const userAvatarColors = await this.knex('user_avatarcolor').select('user_avatarcolor.*').where({userid: id});
        return userAvatarColors as users.UserAvatarColor[];
    }

    /**
     * Add avatar RGB Colors to the Database. This will also clear any old ones
     * @param id User ID
     * @param colorRequest 
     */
    public async addAvatarColors(id: number, colorRequest: users.UserColorRequest): Promise<void> {
        await this.knex('user_avatarcolor').del().where({'userid':id});
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
        await this.knex('users').update({'is_banned':type}).where({'users.id':id});
        return true;
    }

    /**
     * Update an account's status
     * @param userId 
     * @param type New status
     */
    public async modifyAccountStatus(userId: number, type: users.accountStatus): Promise<void> {
        await this.knex('users').update({'account_status':type}).where({'id':userId});
    }

    /**
     * Delete a user's account
     */
    public async deleteAccount(id: number): Promise<void> {
        await this.knex('users').update({'is_deleted':1}).where({'users.id':id});
    }

    /**
     * Get an array of a user's friends
     * @param id User ID
     */
    public async getFriends(id: number, offset: number, limit: number, sortOrder: 'asc'|'desc'): Promise<Array<users.Friendship>> {
        const friends = await this.knex('friendships').select('friendships.userid_two as userId','friendships.date','users.user_status as UserStatus').where({'userid_one':id}).offset(offset).limit(limit).innerJoin('users', 'users.id', 'friendships.userid_two').orderBy('friendships.id', sortOrder);
        return friends as Array<users.Friendship>;
    }

    /**
     * Get a user's total count of friends
     */
    public async countFriends(id: number): Promise<number> {
        const friendCount = await this.knex('friendships').select('id','userid_two as userId','date').where({'userid_one':id});
        return friendCount.length;
    }

    /**
     * Get pending friend requests
     * @param userId 
     * @param offset 
     */
    public async getFriendRequests(userId: number, offset: number): Promise<users.FriendshipRequest[]> {
        const awaitAccepting = await this.knex('friend_request').select('userid_requester as userId').where({'userid_requestee':userId}).limit(25).offset(offset);
        return awaitAccepting;
    }

    /**
     * Get Usernames from an Array of IDs
     * @param ids Array of IDs
     */
    public async MultiGetNamesFromIds(ids: Array<number>): Promise<Array<users.MultiGetUsernames>> {
        const query = this.knex('users').select('id as userId','username','users.account_status as accountStatus');
        ids.forEach((id) => {
            query.orWhere({'users.id':id});
        });
        const usernames = await query;
        usernames.forEach((user: users.UserInfo) => {
            if (user.accountStatus === users.accountStatus.deleted) {
                user.username = "[Deleted"+user.userId+"]";
            }
            delete user.accountStatus;
        });
        return usernames as Array<users.MultiGetUsernames>;
    }

    /**
     * Get a user's thumbnail from their ID
     * @param id User ID
     */
    public async getThumbnailByUserId(id: number): Promise<users.ThumbnailResponse> {
        const thumbnail = await this.knex('thumbnails').select('thumbnails.url','reference_id as userId').where({'reference_id':id,'type':Thumbnails.Type.UserThumb});
        return thumbnail[0] as users.ThumbnailResponse;
    }

    /**
     * Get Multiple Thumbnails of Users from their User ID
     * @param ids Array of User IDs
     */
    public async multiGetThumbnailsFromIds(ids: Array<number>): Promise<Array<users.ThumbnailResponse>> {
        const query = this.knex('thumbnails').select('thumbnails.url','reference_id as userId');
        ids.forEach((id) => {
            query.orWhere({'reference_id':id,'type':Thumbnails.Type.UserThumb});
        });
        const thumbnails = await query;
        return thumbnails as Array<users.ThumbnailResponse>;
    }

    /**
     * Retrieve Multiple Statuses from UserIds at once
     */
    public async multiGetStatus(ids: Array<number>, offset: number, limit: number): Promise<Array<users.UserStatus>> {
        const query = this.knex('user_status').select('user_status.userid as userId','user_status.status', 'user_status.date').limit(limit).offset(offset).orderBy('user_status.id', 'desc');
        ids.forEach((id) => {
            query.orWhere({'user_status.userid':id,});
        });
        const UserStatuses = await query;
        return UserStatuses as Array<users.UserStatus>;
    }

    /**
     * Check if two users are friends with eachother
     * @param firstUserId First User ID
     * @param secondUserId Second User ID
     */
    public async areUsersFriends(firstUserId: number, secondUserId: number): Promise<boolean> {
        const query = await this.knex("friendships").select("id").where({"userid_one":firstUserId,"userid_two":secondUserId});
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
        const canAccept = await this.knex("friend_request").select("id").where({"userid_requester":secondUserId,"userid_requestee":firstUserId});
        if (canAccept[0]) {
            return {
                areFriends: false,
                canSendFriendRequest: false,
                canAcceptFriendRequest: true,
                awaitingAccept: false,
            } as users.FriendshipStatus;
        }
        // Check if first user sent request
        const request = await this.knex("friend_request").select("id").where({"userid_requestee":secondUserId,"userid_requester":firstUserId});
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
        await this.knex("friend_request").insert({"userid_requester": userIdOne,"userid_requestee":userIdTwo});
    }

    /**
     * Create a friendship between two users. This will also delete any pending requests
     * @param userIdOne User ID
     * @param userIdTwo User ID
     */
    public async createFriendship(userIdOne: number, userIdTwo: number): Promise<void> {
        const date = this.moment().format('YYYY-MM-DD HH:mm:ss');
        await this.knex("friend_request").where({"userid_requester": userIdOne,"userid_requestee":userIdTwo}).del();
        await this.knex("friend_request").where({"userid_requestee": userIdOne,"userid_requester":userIdTwo}).del();
        await this.knex("friendships").insert({"userid_one": userIdOne,"userid_two":userIdTwo,"date":date});
        await this.knex("friendships").insert({"userid_two": userIdOne,"userid_one":userIdTwo,"date":date});
    }
    /**
     * Delete an established friendship
     * @param userIdOne 
     * @param userIdTwo 
     */
    public async deleteFriendship(userIdOne: number, userIdTwo: number): Promise<void> {
        // Delete Requests
        await this.knex("friend_request").where({"userid_requester": userIdOne,"userid_requestee":userIdTwo}).del();
        await this.knex("friend_request").where({"userid_requestee": userIdOne,"userid_requester":userIdTwo}).del();
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
    public async getInventory(id: number, category: Catalog.category, offset: number, limit: number, orderBy: 'asc'|'desc'): Promise<Array<users.UserInventory>> {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.user_id': id, 'catalog.category': category }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId','user_inventory.catalog_id as catalogId','user_inventory.price as price','catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial').orderBy('user_inventory.id', orderBy).limit(limit).offset(offset);
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
    public async getCollectibleInventory(id: number, offset: number, limit: number, orderBy: 'asc'|'desc'): Promise<Array<users.UserCollectibleInventory>> {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.user_id': id,'catalog.is_collectible': Catalog.collectible.true }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId','user_inventory.catalog_id as catalogId','user_inventory.price as price','catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial','catalog.average_price as averagePrice').orderBy('user_inventory.id', orderBy).limit(limit).offset(offset);
        return inventory as users.UserCollectibleInventory[];
    }

    /**
     * Count a user's collectible items of a specific category
     * @param id User ID
     * @param category Category to search for
     */
    public async countCollectibleInventory(id: number): Promise<number> {
        const count = await this.knex('user_inventory').where({ 'user_inventory.user_id': id,'catalog.is_collectible': Catalog.collectible.true }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').count("user_inventory.id as Total");
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
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.user_id': userId, 'user_inventory.catalog_id': catalogId }).innerJoin('catalog', 'catalog.id', '=', 'user_inventory.catalog_id').select('user_inventory.id as userInventoryId','user_inventory.catalog_id as catalogId','user_inventory.price as price','catalog.name as catalogName', 'catalog.is_collectible as collectible', 'catalog.category', 'user_inventory.serial').orderBy('user_inventory.id', "desc");
        return inventory as users.UserInventory[];
    }

    /**
     * Get a user_inventory item by it's id
     * @param userInventoryId Inventory ID
     */
    public async getItemByInventoryId(userInventoryId: number): Promise<users.FullUserInventory> {
        const inventory = await this.knex('user_inventory').where({ 'user_inventory.id': userInventoryId}).select('user_inventory.id as userInventoryId','user_inventory.catalog_id as catalogId','user_inventory.price as price','user_inventory.user_id as userId').orderBy('user_inventory.id', "desc");
        return inventory[0] as users.FullUserInventory;
    }

    /**
     * Edit a user_inventory item's price
     * @param userInventoryId Catalog Item's Inventory ID
     * @param newPrice The new price
     */
    public async editItemPrice(userInventoryId: number, newPrice: number): Promise<void> {
        await this.knex("user_inventory").update({"price":newPrice}).where({"id":userInventoryId});
    }

    /**
     * Take all the userid's items offsale. This is useful, for instance, if the player is about to be banned.
     */
    public async takeAllItemsOffSale(userId: number): Promise<void> {
        await this.knex("user_inventory").update({"price":0}).where({'user_id':userId});
    }

    /**
     * Get a user's groups from their ID
     * @param userId User's ID
     */
    public async getGroups(userId: number): Promise<users.UserGroups[]> {
        const groups = await this.knex("group_members").select("groups.id as groupId","groups.name as groupName","groups.description as groupDescription", "groups.owner_userid as groupOwnerUserId", "groups.thumbnail_catalogid as groupIconCatalogId", "groups.membercount as groupMemberCount", "group_members.userid as userId","group_members.roleid as userRolesetId","group_roles.name as userRolesetName","group_roles.rank as userRolsetRank").where({"group_members.userid":userId,"groups.status":Groups.groupStatus.ok}).innerJoin("groups", "groups.id", "group_members.groupid").innerJoin("group_roles", "group_roles.id", "group_members.roleid").orderBy("group_roles.rank", "desc");
        return groups as users.UserGroups[];
    }

    /**
     * Coun the amount of groups a user is a member of
     * @param userId User's ID
     */
    public async countGroups(userId: number): Promise<number> {
        const count = await this.knex("group_members").count("id as Total").where({"userid":userId});
        if (!count[0]["Total"]) {
            return 0;
        }
        return count[0]["Total"] as number;
    }

    /**
     * Get User's Latest Status (including date)
     */
    public async getUserLatestStatus(userId: number): Promise<users.UserStatus> {
        const result = await this.knex("user_status").select("userid as userId","status","date").where({"userid":userId}).limit(1).orderBy("id", "desc");
        return result[0] as users.UserStatus;
    }

    /**
     * Add a user's status to the DB/Update it
     * @param userId 
     * @param newStatus 
     */
    public async updateStatus(userId: number, newStatus: string): Promise<void> {
        await this.knex("users").update({"user_status":newStatus}).where({"users.id":userId});
        await this.knex("user_status").insert({
            "userid": userId,
            "status": newStatus,
            "date": this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Search Users. If no query is provided, users are returned by ID DESC order
     * @param offset 
     * @param limit 
     * @param sort 
     * @param query 
     */
    public async search(offset: number, limit: number, sort: 'asc'|'desc', sortBy: 'id'|'user_lastonline', query?: string): Promise<users.SearchResult[]> {
        
        const search = this.knex("users").select(['id as userId', 'username', 'user_status as status', 'user_joindate as joinDate', 'user_lastonline as lastOnline', 'user_staff as staff']).limit(limit).offset(offset).orderBy(sortBy, sort);
        if (query) {
            search.where('users.username', 'like', '%'+query+'%');
        }
        search.where({'users.account_status': users.accountStatus.ok});
        const results = await search;
        return results;
    }

    /**
     * Get Forum Info for Users
     * @param userIds 
     */
    public async multiGetForumInfo(userIds: number[]): Promise<users.ForumInfo[]> {
        const query = this.knex('users').select("id as userId","forum_postcount as postCount","user_staff as permissionLevel","forum_signature as signature").limit(25);
        userIds.forEach((k) => {
            query.orWhere({ "id": k })
        });
        const forumData = await query;
        return forumData;
    }

    /**
     * Increment a user's Post Count
     */
    public async incrementPostCount(userId: number): Promise<void> {
        const userInfo = await this.getInfo(userId, ['forumPostCount']);
        const currentCount = userInfo.forumPostCount;
        await this.knex("users").update({
            'forum_postcount': currentCount + 1,
        }).where({'id': userId});
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
        }).where({'id': userId});
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
        ).where({'code': code});
        if (!info[0]) {
            throw new Error('InvalidCode');
        }
        return info[0];
    }

    /**
     * Delete a Password Reset Request
     */
    public async deletePasswordResetRequest(code: string): Promise<void> {
        await this.knex("password_resets").delete().where({'code': code});
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
     * Check if a user has used the ipaddress specified for an action(s) specified. Will only check the latest of each action
     * @param userId 
     * @param actionsToCheckFor 
     */
    public async checkIfIpIsNew(userId: number, ipAddress: string, actionsToCheckFor: model.user.ipAddressActions[]|model.user.ipAddressActions): Promise<boolean> {
        const time = this.moment().subtract(30, 'days').format('YYYY-MM-DD HH:mm:ss');
        const encryptedIP = await this.encryptIpAddress(ipAddress);
        if (typeof actionsToCheckFor === 'object') {
            // Array
            let query = this.knex("user_ip").select("date").limit(1).orderBy("id","desc");
            for (const item of actionsToCheckFor) {
                query = query.orWhere({'ip_address': encryptedIP,'action': item, 'userid': userId}).andWhere('date','>',time);
            }
            let results = await query;
            if (!results[0]) {
                return true;
            }else{
                return false;
            }
        }else{
            // Single action
            let results = await this.knex("user_ip").select("date").where({'ip_address': encryptedIP,'action': actionsToCheckFor,'userid': userId}).andWhere('date','>',time).limit(1).orderBy("id","desc");
            if (!results[0]) {
                return true;
            }else{
                return false;
            }
        }
    }
}

export default UsersDAL;
