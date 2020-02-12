/**
 * Imports
 */
// TSed
import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, Err, Post, BodyParams, HeaderParams, Session, UseBeforeEach, PropertyType, MinItems, MaxItems, Maximum, Minimum, Patch } from "@tsed/common";
import { Description, Summary, Returns, ReturnsArray } from "@tsed/swagger"; // import swagger Ts.ED module
import moment = require('moment');
// Models
import * as model from '../../models/models';
// Auth stuff
import { setSession, isAuthenticated, verifyPassword, saveSession, hashPassword, csrf } from '../../dal/auth';
// Autoload
import controller from '../controller';
import { NoAuth, YesAuth } from "../../middleware/Auth";
import RecaptchaV2 from '../../middleware/RecaptchaV2';
/**
 * Auth Controller
 */
@Controller('/auth')
@Description('Endpoints that deal directly with user authentication, authorization, credentials, and account creation')
export default class AuthController extends controller {

    constructor() {
        super();
    }

    @Post('/login')
    @Summary('Login to an account')
    @Returns(400, { description: 'InvalidUsernameOrPassword: Invalid Credentials\n', type: model.Error })
    @Returns(409, { description: 'LogoutRequired: You must be signed out to perform this action\n', type: model.Error })
    @UseBeforeEach(csrf)
    @UseBefore(NoAuth)
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
                try {
                    await this.user.logUserIp(userId, userIp, model.user.ipAddressActions.Login);
                } catch (e) {
                    throw new Error('Unable to log user ip address');
                }
                // Setup user session
                session.userdata = {};
                session.userdata.id = userId;
                session.userdata.username = userData.username;
                session.userdata.passwordUpdated = userData.passwordChanged;
                return {
                    userId: userId,
                    username: userData.username,
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
            throw new this.BadRequest('InvalidUsernameOrPassword');;
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

    @Get('/feed')
    @Summary('Get the authenticated user\'s feed. Hardcoded limit of 25 statuses per request')
    @ReturnsArray(200, { type: model.user.UserStatus })
    @Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' })
    @UseBeforeEach(YesAuth)
    public async getFeed(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @QueryParams('offset') offset: number = 0
    ) {
        let friends = await this.user.getFriends(userInfo.userId, 0, 200, 'asc');
        const arrayOfIds: Array<number> = [];
        friends.forEach((obj) => {
            arrayOfIds.push(obj.userId);
        });
        if (arrayOfIds.length === 0) {
            return [];
        }
        let feed = await this.user.multiGetStatus(arrayOfIds, offset, 25);
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
        if (newStatus.length > 255 || newStatus.length < 3) {
            throw new this.BadRequest('InvalidStatus');;
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
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
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
}
