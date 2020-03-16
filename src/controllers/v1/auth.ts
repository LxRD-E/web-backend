/**
 * Imports
 */
// TSed
import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, Err, Post, BodyParams, HeaderParams, Session, UseBeforeEach, PropertyType, MinItems, MaxItems, Maximum, Minimum, Patch, Delete } from "@tsed/common";
import { Description, Summary, Returns, ReturnsArray, Hidden } from "@tsed/swagger"; // import swagger Ts.ED module
import moment = require('moment');
import { RateLimiterMiddleware } from '../../middleware/RateLimit';
// Models
import * as model from '../../models/models';
// Auth stuff
import { setSession, isAuthenticated, verifyPassword, saveSession, hashPassword, csrf } from '../../dal/auth';
// Autoload
import controller from '../controller';
import { NoAuth, YesAuth } from "../../middleware/Auth";
import RecaptchaV2 from '../../middleware/RecaptchaV2';
import { UserInfo } from "../../models/v1/user";
/**
 * Auth Controller
 */
@Controller('/auth')
@Description('Endpoints that deal directly with user authentication, authorization, credentials, and account creation')
export default class AuthController extends controller {

    constructor() {
        super();
    }

    @Post('/login/two-factor')
    @Summary('Login to an account using the two-factor JWT generated from /auth/login')
    @Use(csrf, NoAuth, RateLimiterMiddleware('loginAttempt'))
    @Returns(200, {type: model.auth.LoginTwoFactorResponseOK, description: 'User session cookie will be set'})
    @Returns(400, {type: model.Error, description: 'InvalidTwoFactorCode: Token is not valid\n'})
    @Returns(409, {type: model.Error, description: 'TwoFactorNotRequired: Two factor authentication was disabled for this account. Please login normally.\nTwoFactorCodeExpired: Two-Factor JWT code has expired. Please login again.\n'})
    @Returns(429, {type: model.Error, description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n'})
    public async loginWithTwoFactor(
        @BodyParams('code', String) code: string,
        @BodyParams('token', String) token: string,
        @HeaderParams('cf-connecting-ip') userIp: string,
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Session() session: Express.Session,
    ) {
        // probably dev env
        if (!userIp) {
            userIp = '127.0.0.1';
        }
        let decoded: {userId: number; expectedIp: string; iat: number;};
        try {
            decoded = this.auth.decodeTwoFactorJWT(code);
        }catch(e) {
            console.log('failed to decode: ',e);
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
        // Ip does not match
        if (decoded.expectedIp !== userIp) {
            console.log('ip mis-match');
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
        // Expired
        if (moment(decoded.iat * 1000).subtract(5, 'minutes').isSameOrAfter(moment())) {
            console.log('expired');
            throw new this.Conflict('TwoFactorCodeExpired');
        }
        let userId = decoded.userId;
        let twoFactorInfo = await this.settings.is2faEnabled(userId);
        if (!twoFactorInfo || !twoFactorInfo.enabled) {
            throw new this.Conflict('TwoFactorNotRequired');
        }
        // Validate secret
        let result: boolean;
        try {
            result = await this.auth.validateTOTPSecret(twoFactorInfo.secret, token);
        }catch(e) {
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
        if (!result) {
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
        // 2FA token is GOOD. Create session
        let userData = await this.user.getInfo(userId, ['username', 'passwordChanged']);
        session.userdata = {};
        session.userdata.id = userId;
        session.userdata.username = userData.username;
        session.userdata.passwordUpdated = userData.passwordChanged;
        return {
            userId: userId,
            username: userData.username,
        };
    }

    @Post('/login')
    @Summary('Login to an account')
    @Description('Note that there is a limit of 25 attempts per hour, per IP address')
    @Returns(200, { type: model.auth.LoginRequestOK, description: 'Session will be set, unless "isTwoFactorRequired" is true. "twoFactor" is only defined if "isTwoFactorRequied" is true. If "twoFactor" is not undefined, the user will be required to grab their TOTP token and enter it, then the "twoFactor" string and TOTP token should be POSTed to /login/two-factor to complete the login flow'})
    @Returns(400, { description: 'InvalidUsernameOrPassword: Invalid Credentials\n', type: model.Error })
    @Returns(409, { description: 'LogoutRequired: You must be signed out to perform this action\n', type: model.Error })
    @Returns(429, {type: model.Error, description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n'})
    @Use(csrf, NoAuth, RateLimiterMiddleware('loginAttempt'))
    public async login(
        @BodyParams('username', String) username: string,
        @BodyParams('password', String) password: string,
        @HeaderParams('cf-connecting-ip') userIp: string,
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Session() session: Express.Session,
    ) {
        // probably dev env
        if (!userIp) {
            userIp = '127.0.0.1';
        }
        // If user is logged in, return error
        if (userInfo) {
            throw new this.Conflict('LogoutRequired');
        }
        let userId: number;
        try {
            userId = await this.user.userNameToId(username);
        } catch (e) {
            throw new this.BadRequest('InvalidUsernameOrPassword');
        }
        let userData;
        try {
            userData = await this.user.getInfo(userId, ['username', 'passwordChanged']);
            const dbPasswordHashed = await this.user.getPassword(userId);
            const compare = await verifyPassword(password, dbPasswordHashed);
            if (compare) {
                // Record Login
                await this.user.logUserIp(userId, userIp, model.user.ipAddressActions.Login);
                // Check if 2fa required
                let twoFactorEnabled = await this.settings.is2faEnabled(userId);
                if (twoFactorEnabled.enabled) {
                    // Create JWT
                    let jwtInfo = this.auth.generateTwoFactorJWT(userId, userIp);
                    return {
                        success: true,
                        userId: userId,
                        username: userData.username,
                        isTwoFactorRequied: true,
                        twoFactor: jwtInfo,
                    };
                }
                // Setup user session
                session.userdata = {};
                session.userdata.id = userId;
                session.userdata.username = userData.username;
                session.userdata.passwordUpdated = userData.passwordChanged;
                return {
                    userId: userId,
                    username: userData.username,
                    isTwoFactorRequied: false,
                };
            } else {
                throw new Error('Invalid password submitted');
            }
        } catch (e) {
            console.log(e);
            // Record Attempted Signup
            try {
                await this.user.logUserIp(userId, userIp, model.user.ipAddressActions.UnsuccessfulLoginWithCompletedCaptcha);
            } catch (e) {

            }
            throw new this.BadRequest('InvalidUsernameOrPassword');
        }
    }

    @Post('/logout')
    @Summary('Logout from the current session')
    @Returns(409, { description: 'LogoutRequired: You must be signed out to perform this action\n', type: model.Error })
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async logout(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Session() session: Express.Session,
        @HeaderParams('cf-connecting-ip') ipAddress: string,
    ) {
        // Log logout
        try {
            await this.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.SignOut);
        } catch {

        }
        // Delete userdata
        session.userdata = {};
        // Return success
        return {
            success: true
        };
    }

    @Post('/generate-totp-secret')
    @Summary('Generate a secret for TOTP')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async generateTOTPSecret(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled) {
            throw new this.Conflict('TwoFactorAlreadyEnabled');
        }
        let secret = await this.auth.generateTOTPSecret();
        return secret;
    }

    @Delete('/totp')
    @Summary('Delete a two-factor authentication code')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Use(RateLimiterMiddleware('twoFactorEnableOrDisable'))
    public async deleteTOTP(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('password', String) password: string,
    ) {
        // Verify password
        let userPassword = await this.user.getPassword(userInfo.userId);
        const valid = await this.auth.verifyPassword(password, userPassword);
        if (!valid) {
            throw new this.BadRequest('InvalidPassword');
        }
        // Check if not enabled
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled === false) {
            throw new this.Conflict('TwoFactorNotEnabled');
        }
        // Delete 2fa
        await this.settings.disable2fa(userInfo.userId);
        // Return success
        return {
            success: true,
        };
    }

    @Patch('/totp')
    @Summary('Update (or set) the authenticated users TOTP secret')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Use(RateLimiterMiddleware('twoFactorEnableOrDisable'))
    public async updateTOTPSecret(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('secret', String) secret: string,
        @Required()
        @BodyParams('token', String) token: string,
        @Required()
        @BodyParams('password', String) password: string,
    ) {
        // Verify password
        let userPassword = await this.user.getPassword(userInfo.userId);
        const valid = await this.auth.verifyPassword(password, userPassword);
        if (!valid) {
            throw new this.BadRequest('InvalidPassword');
        }
        // Check if already enabled
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled) {
            throw new this.Conflict('TwoFactorAlreadyEnabled');
        }
        // Validate secret
        let result: boolean;
        try {
            result = await this.auth.validateTOTPSecret(secret, token);
        }catch(e) {
            throw new this.BadRequest('InvalidTokenOrSecret');
        }
        if (!result) {
            throw new this.BadRequest('InvalidTokenOrSecret');
        }
        // Set in database
        await this.settings.enable2fa(userInfo.userId, secret);
        // Return
        return {
            success: true,
        };
    }

    @Post('/unlock')
    @Summary('Unlock a banned account')
    @Returns(400, { description: 'Unauthorized: User is not authorized to perform this action\n', type: model.Error })
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' })
    @Returns(403, { type: model.Error, description: 'Invalid CSRF Token' })
    public async unlock(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        let banData;
        try {
            banData = await this.mod.getBanDataFromUserId(userInfo.userId);
        } catch (e) {
            throw new this.Conflict('Unauthorized');
        }
        // If account is terminated, do not unlock
        if (banData['terminated'] === model.mod.terminated.true) {
            throw new this.Conflict('Unauthorized');
        }
        // If it's too early to allow unlocking
        if (moment().isSameOrBefore(banData['untilUnbanned'])) {
            throw new this.Conflict('Unauthorized');
        }
        // Good to go
        try {
            // Unban user
            await this.user.modifyUserBanStatus(userInfo.userId, model.user.banned.false);
            // Update status
            await this.user.modifyAccountStatus(userInfo.userId, model.user.accountStatus.ok);
        } catch (e) {
            throw new Error('Internal')
        }
        // Return success
        return { success: true };
    }

    @Post('/signup')
    @Summary('Register an account')
    @Returns(200, { description: 'OK', type: model.auth.SignupResponseOK })
    @Returns(409, { description: 'LogoutRequired: Login Required\nCaptchaValidationFailed: Invalid captcha token, expired, or not provided\n' })
    @Returns(403, { description: 'CSRFValidationFailed: Invalid CSRF Token\n' })
    @Returns(400, { description: 'InvalidBirthDate: Birth Date is invalid\nInvalidUsername: Username is taken or unavailable\nInvalidPassword: Password is too weak\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\nOneAccountPerIP: Only one account may be signed up per IP address, every 24 hours\n' })
    @UseBeforeEach(csrf)
    @UseBefore(NoAuth)
    @Use(RecaptchaV2)
    public async signup(
        @BodyParams(model.auth.SignupRequest) body: model.auth.SignupRequest,
        @HeaderParams('cf-connecting-ip', String) userIp: string,
        @Session() session: Express.Session,
    ) {
        /**
         * Check if signed up recently
         */
        /*
        const signedUpInPast24Hours = await this.user.checkForIpSignup(userIp);
        if (signedUpInPast24Hours) {
            throw new this.BadRequest('OneAccountPerIP');;
        }
        */
        let birthArray = body.birth;
        let username = body.username;
        let password = body.password;

        const birthYear = birthArray[2];
        const birthMonth = birthArray[1];
        const birthDay = birthArray[0];
        const momentDate = moment(birthYear + "-" + birthMonth + "-" + birthDay, 'YYYY-MM-DD');
        if (!momentDate.isValid()) {
            throw new this.BadRequest('InvalidBirthDate');;
        }
        if (momentDate.isSameOrBefore(moment().subtract(100, "years"))) {
            throw new this.BadRequest('InvalidBirthDate');;
        }
        const birthDateString = momentDate.format('YYYY-MM-DD HH:mm:ss');
        // Username Checker
        const usernamecheck = await this.user.isUsernameOk(username);
        if (usernamecheck !== 'OK') {
            throw new Error(usernamecheck);
        }
        // Make sure user doesn't already exist
        let available;
        try {
            available = await this.user.usernameAvailableForSignup(username);
        } catch (e) {
            throw e;
        }
        if (!available) {
            throw new this.BadRequest('InvalidUsername');;
        }
        // Username OK. Let's try password
        if (!password || password.length < 6) {
            throw new this.BadRequest('InvalidPassword');;
        }
        // Seems good so far
        let hash: string;
        try {
            hash = await hashPassword(password);
        } catch (e) {
            throw e;
        }
        if (!hash) {
            throw new Error();
        }
        // Create User
        let userId;
        try {
            userId = await this.user.createUser(username, hash, birthDateString);
        } catch (e) {
            if (e.code && e.code === "ER_DUP_ENTRY") {
                throw new this.BadRequest('InvalidUsername');;
            } else {
                throw e;
            }
        }
        // Create Avatar Colors
        try {
            await this.user.addAvatarColors(userId, {
                "HeadRGB": [255, 255, 255],
                "LegRGB": [255, 255, 255],
                "TorsoRGB": [255, 255, 255],
            });
        } catch (e) {
            throw e;
        }
        // Add Thumbnail
        try {
            await this.user.addUserThumbnail(userId, "https://cdn.hindigamer.club/thumbnails/b9db56f8457b5e64dae256e5a029541dd2820bb641d280dec9669bbab760fa1077a7106cbff4c445d950f60f6297fba5.png");
        } catch (e) {
            throw e;
        }
        // Give First-Time Transaction
        try {
            await this.economy.addToUserBalance(userId, 10, model.economy.currencyType.secondary);
            await this.economy.createTransaction(userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, "Daily Stipend", model.catalog.creatorType.User, model.catalog.creatorType.User);
        } catch (e) {
            throw e;
        }
        // Record Signup
        try {
            await this.user.logUserIp(userId, userIp, model.user.ipAddressActions.SignUp);
        } catch (e) {

        }
        console.log('Return OK');
        /*
        // Return Success
        return {
            userId: userId,
            username: username,
            passwordChanged: 0,
        }
        */
        // Setup user session
        session.userdata = {};
        session.userdata.id = userId;
        session.userdata.username = username;
        session.userdata.passwordUpdated = 0;
        return {
            userId: userId,
            username: username,
        };
    }

    @Get('/feed/friends')
    @Summary('Get the authenticated user\'s friends feed. Includes their own statuses.')
    @ReturnsArray(200, { type: model.user.UserStatusForAuthenticated })
    @Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' })
    @UseBeforeEach(YesAuth)
    public async getFeedForFriends(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset') offset: number = 0,
        @QueryParams('limit', Number) limit = 100,
    ) {
        let friends = await this.user.getFriends(userInfo.userId, 0, 200, 'asc');
        const arrayOfIds: Array<number> = [];
        friends.forEach((obj) => {
            arrayOfIds.push(obj.userId);
        });
        arrayOfIds.push(userInfo.userId);
        if (arrayOfIds.length === 0) {
            return [];
        }
        let feed = await this.user.multiGetStatus(arrayOfIds, offset, limit);
        let idsForStatus = [];
        for (const id of feed) {
            idsForStatus.push(id.statusId);
        }
        let resultsForMultiGetReactionStatus = await this.user.multiGetReactionStatusForUser(userInfo.userId, idsForStatus, '❤️');
        for (const item of feed as any[]) {
            for (const reactionInfo of resultsForMultiGetReactionStatus) {
                if (reactionInfo.statusId === item.statusId) {
                    item.didReactWithHeart = reactionInfo.didReact;
                    break;
                }
            }
        }
        return feed;
    }

    @Post('/feed/friends/:userStatusId/comment')
    @Summary('Add a comment to the {userStatusId}')
    @Use(csrf, YesAuth)
    public async addCommentToStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @BodyParams('comment', String) comment: string,
    ) {
        if (!comment || !comment.replace(/\s+/g, '') || comment.length > 4096) {
            throw new this.BadRequest('InvalidComment');
        }
        let canPost = await this.user.canUserPostCommentToStatus(userInfo.userId);
        if (!canPost) {
            throw new this.Conflict('Cooldown');
        }
        let statusData = await this.user.getStatusById(statusId);
        // check if friends
        let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
        if (!info.areFriends && userInfo.userId !== statusData.userId) {
            throw new this.BadRequest('InvalidStatusId');
        }
        // add comment
        await this.user.addCommentToStatus(statusId, userInfo.userId, comment);
        // return success
        return {
            success: true,
        };
    }

    @Get('/feed/friends/:userStatusId/comments')
    @Summary('Get comments to the {userStatusId}')
    @ReturnsArray(200, {type: model.user.UserStatusComment})
    @Use(YesAuth)
    public async getCommentsForStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 25,
    ) {
        let statusData = await this.user.getStatusById(statusId);
        // check if friends
        let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
        if (!info.areFriends && userInfo.userId !== statusData.userId) {
            throw new this.BadRequest('InvalidStatusId');
        }
        let comments = await this.user.getCommentsToStatus(statusId, offset, limit);
        return comments;
    }


    @Post('/feed/friends/:userStatusId/react')
    @Summary('Add a heart reaction to the {userStatusId}')
    @Use(csrf, YesAuth)
    public async addReactionToStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @BodyParams('reactionType', String) reactionType: string,
    ) {
        if (reactionType !== 'heart') {
            throw new this.BadRequest('InvalidReactionType');
        } 
        let statusData = await this.user.getStatusById(statusId);
        // check if friends
        let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
        if (!info.areFriends && userInfo.userId !== statusData.userId) {
            throw new this.BadRequest('InvalidStatusId');
        }
        // Check if already reacted
        if (await this.user.checkIfAlreadyReacted(statusId, userInfo.userId, '❤️')) {
            throw new this.Conflict('AlreadyReactedToStatus');
        }
        // add reaction
        await this.user.addReactionToStatus(statusId, userInfo.userId, '❤️');
        // return success
        return {
            success: true,
        };
    }

    @Delete('/feed/friends/:userStatusId/react')
    @Summary('Delete your reaction to a {userStatusId}')
    @Use(csrf, YesAuth)
    public async deleteReactionToStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('userStatusId', Number) statusId: number,
        @BodyParams('reactionType', String) reactionType: string,
    ) {
        if (reactionType !== 'heart') {
            throw new this.BadRequest('InvalidReactionType');
        }
        let statusData = await this.user.getStatusById(statusId);
        // check if friends
        let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
        if (!info.areFriends && userInfo.userId !== statusData.userId) {
            throw new this.BadRequest('InvalidStatusId');
        }
        // Check if not already reacted
        if (!await this.user.checkIfAlreadyReacted(statusId, userInfo.userId, '❤️')) {
            throw new this.Conflict('NotReactedToStatus');
        }
        // delete reaction
        await this.user.removeReactionToStatus(statusId, userInfo.userId, '❤️');
        // return success
        return {
            success: true,
        };
    }

    @Get('/feed/groups')
    @Summary('Get the authenticated user\'s groups feed.')
    @ReturnsArray(200, { type: model.group.groupShout })
    @Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' })
    @UseBeforeEach(YesAuth)
    public async getFeedForGroups(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset') offset: number = 0,
        @QueryParams('limit', Number) limit = 100,
    ) {
        let groups = await this.user.getGroups(userInfo.userId);
        const arrayOfIds: Array<number> = [];
        groups.forEach(obj => arrayOfIds.push(obj.groupId));
        if (arrayOfIds.length === 0) {
            // Return empty array
            return [];
        }
        // grab perms of each groupId to make sure user can view shout
        let goodGroups: number[] = [];
        for (const item of arrayOfIds) {
            let permissions = await this.group.getUserRole(item, userInfo.userId);
            if (permissions.permissions.getShout) {
                goodGroups.push(item);
            }
        }
        let feed = await this.group.getShouts(goodGroups, limit, offset);
        return feed;
    }

    @Patch('/status')
    @Summary('Update the authenticated user\'s status')
    @Returns(400, { type: model.Error, description: 'InvalidStatus: Status is too long or too short\nCooldown: You cannot change your status right now\n' })
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams("status", String) newStatus: string
    ) {
        if (newStatus.length > 255 || newStatus.length < 1) {
            throw new this.BadRequest('InvalidStatus');
        }
        const latestUpdate = await this.user.getUserLatestStatus(userInfo.userId);
        if (latestUpdate && !moment().isSameOrAfter(moment(latestUpdate.date).add(5, "minutes"))) {
            throw new this.BadRequest('Cooldown');;
        }
        await this.user.updateStatus(userInfo.userId, newStatus);
        return { success: true };
    }

    @Patch('/reset/password')
    @Summary('Reset user password via code from email')
    @Returns(400, { type: model.Error, description: 'InvalidCode: Code is expired or invalid\nInvalidPassword: Password is too short\n' })
    @UseBeforeEach(csrf)
    @UseBefore(NoAuth)
    public async resetPassword(
        @Required()
        @BodyParams('code', String) code: string,
        @Required()
        @BodyParams('userId', Number) numericUserId: number,
        @Required()
        @BodyParams('newPassword', String) newPassword: string
    ) {
        let info;
        try {
            info = await this.user.getPasswordResetInfo(code);
        } catch (e) {
            throw new this.BadRequest('InvalidCode');;
        }
        // If userid does not match
        if (info.userId !== numericUserId) {
            throw new this.BadRequest('InvalidCode');;
        }
        // Codes expire after 2 hours
        if (moment().isSameOrAfter(moment(info.dateCreated).add(2, "hours"))) {
            throw new this.BadRequest('InvalidCode');;
        }
        // Confirm password is valid
        if (!newPassword || newPassword.length < 6) {
            throw new this.BadRequest('InvalidPassword');;
        }
        // Seems good so far
        let hash: string;
        try {
            hash = await hashPassword(newPassword);
        } catch (e) {
            throw e;
        }
        // Reset
        // Update Password
        await this.user.updatePassword(numericUserId, hash);
        // Delete Request
        await this.user.deletePasswordResetRequest(code);
        // Return Success
        return {
            'success': true,
        };
    }

    @Get('/username/available')
    @Summary('Check if a username is available for signup')
    @Returns(400, { description: 'InvalidUsername: Username is taken or unavailable\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\n' })
    public async usernameAvailableForSignup(
        @Required()
        @QueryParams('username', String) username: string
    ) {
        if (!username) {
            throw new this.BadRequest('InvalidUsername');;
        }
        const available = await this.user.isUsernameOk(username);
        if (available !== 'OK') {
            throw new this.BadRequest(available);
        }
        // Check
        const usernameOk = await this.user.usernameAvailableForSignup(username);
        if (usernameOk) {
            return {
                success: true,
            };
        }
        throw new this.BadRequest('InvalidUsername');
    }

    @Get('/username/change/available')
    @Summary('Check if username is available for name change')
    @Returns(400, { description: 'InvalidUsername: Username is taken or unavailable\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\n' })
    @UseBefore(YesAuth)
    public async usernameAvailableForNameChange(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @QueryParams('username', String) username: string
    ) {
        if (!username) {
            throw new this.BadRequest('InvalidUsername');
        }
        const available = await this.user.isUsernameOk(username);
        if (available !== 'OK') {
            throw new this.BadRequest(available);
        }
        // Check
        const usernameOk = await this.user.usernameAvailableForNameChange(userInfo.userId, username);
        if (usernameOk) {
            return {
                'success': true,
            };
        }
        throw new this.BadRequest('InvalidUsername');
    }

    @Patch('/username/change')
    @Summary('Change authenticated user\'s username')
    @Description('User will be charged 1,000 Primary if succesful. User will not have to log in again since their session will update. The authenticated user will be logged out of all sessions other than the one that made this request')
    @Returns(200, { description: 'OK', type: model.auth.UsernameChangedResponseOK })
    @Returns(400, { description: 'InvalidUsername: Username is taken or unavailable\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\nCooldown: You cannot change your username right now\nNotEnoughCurrency: User does not have 1,000+ Primary' })
    @Use(csrf, YesAuth)
    public async changeUsername(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('username', String) newUserName: string
    ) {
        if (!newUserName) {
            throw new this.BadRequest('InvalidUsername');
        }
        const available = await this.user.isUsernameOk(newUserName);
        if (available !== 'OK') {
            throw new this.BadRequest(available);
        }
        // Check
        const usernameOk = await this.user.usernameAvailableForNameChange(userInfo.userId, newUserName);
        if (!usernameOk) {
            throw new this.BadRequest('InvalidUsername');
        }
        // Change Username
        // Check if has enough
        const usernameChangePrice = 1000;
        if (userInfo.primaryBalance < usernameChangePrice) {
            throw new this.BadRequest('NotEnoughCurrency');
        }
        // Check if changed recently
        const latestChange = await this.user.getLatestUsernameChange(userInfo.userId);
        if (latestChange && moment().isSameOrBefore(moment(latestChange.dateCreated).add(5, 'minutes'))) {
            throw new this.BadRequest('Cooldown');
        }
        // If has enough, deduct
        await this.economy.subtractFromUserBalance(userInfo.userId, usernameChangePrice, model.economy.currencyType.primary);
        // Create Transaction
        await this.economy.createTransaction(userInfo.userId, 1, -usernameChangePrice, model.economy.currencyType.primary, model.economy.transactionType.UsernameChange, 'Username Change', model.catalog.creatorType.User, model.catalog.creatorType.User);
        // Change Username
        const oldUsername = userInfo.username;
        // Record old username
        await this.user.addUserNameToNameChanges(userInfo.userId, oldUsername);
        // Update New Username
        await this.user.changeUserName(userInfo.userId, newUserName);
        // Return Success
        return {
            success: true,
            newUsername: newUserName,
        };
    }

    @Post('/authenticate-to-service')
    @Summary('Generate an auth code required to sign into a service')
    @Use(csrf, YesAuth)
    @Returns(200, {type: model.auth.GenerateAuthenticationCodeResponse})
    @Returns(400, {type:model.Error, description: 'InvalidReturnUrl: Return URL is not valid\nAuthenticationServiceConstraintHTTPSRequired: The returnUrl must use the HTTPS protocol\n'})
    @Returns(409, {type: model.Error, description: 'AuthenticationServiceBlacklisted: The returnUrl is blacklisted and cannot be used\n'})
    public async startAuthenticationFlowToService(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('returnUrl', String) returnUrl: string,
    ) {
        // Skip HTTPs check in development to make testing stuff easier
        if (process.env.NODE_ENV === 'production') {
            // Make sure URL is using HTTPS
            if (returnUrl.slice(0,'https://'.length) !== 'https://') {
                throw new this.BadRequest('AuthenticationServiceConstraintHTTPSRequired');
            }
        }
        // Make sure URL contains at least one "."
        if (!returnUrl.slice('https://'.length).match(/\./g)) {
            throw new this.BadRequest('InvalidReturnUrl');
        }
        // Make sure URL is not hindigamer.club
        // www.hindigamer.club
        if (returnUrl.slice(0,'https://www.hindigamer.club'.length) === 'https://www.hindigamer.club') {
            throw new this.Conflict('AuthenticationServiceBlacklisted');
        }
        // hindigamer.club
        if (returnUrl.slice(0,'https://hindigamer.club'.length) === 'https://hindigamer.club') {
            throw new this.Conflict('AuthenticationServiceBlacklisted');
        }
        // Ok, so now we can generate the JWT
        let generatedJwt = await this.auth.generateAuthServiceJWT(userInfo.userId, userInfo.username);
        return {
            code: generatedJwt,
        };
    }

    @Post('/validate-authentication-code')
    @Summary('Validate an authentication code generated from /api/v1/auth/authenticate-to-service')
    @Description('No CSRF validation or authentication requirement as this is meant for external services. Note that codes can be redeemed multiple times, by multiple parties. Codes expire after 5 minutes, so you are advised to save the results to a session or something depending on what you are using the code for.\n\nNote: You should always validate the code through this endpoint instead of manually decoding the JWT yourself. If you do not verify it here, the code can very easily be spoofed. View a full tutorial here: https://hindigamer.club/forum/thread/244?page=1')
    @Returns(200, {type: model.auth.ValidateAuthenticationCodeResponse})
    @Returns(400, {type: model.Error, description: 'InvalidCode: The code is invalid or has expired\n'})
    public async validateAuthenticationCode(
        @Required()
        @BodyParams('code', String) code: string,
    ) {
        // try to validate it
        let result;
        try {
            result = await this.auth.decodeAuthServiceJWT(code);
            if (moment().isSameOrAfter(moment(result.iat * 1000).add(5, 'minutes'))) {
                throw new this.BadRequest('InvalidCode');
            }
        }catch(e) {
            throw new this.BadRequest('InvalidCode');
        }
        return result;
    }

    @Get('/moderation/history')
    @Summary('Get a page of moderationHistory for the authenticated user')
    @Use(YesAuth)
    @ReturnsArray(200, {type: model.user.UserModerationAction})
    public async getModerationHistory(
        @Locals('userInfo') userInfo: model.UserSession,
    ) {
        let history = await this.user.getModerationHistory(userInfo.userId);
        return history;
    }
}
