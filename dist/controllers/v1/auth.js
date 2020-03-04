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
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const moment = require("moment");
const RateLimit_1 = require("../../middleware/RateLimit");
const model = require("../../models/models");
const auth_1 = require("../../dal/auth");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
const RecaptchaV2_1 = require("../../middleware/RecaptchaV2");
let AuthController = class AuthController extends controller_1.default {
    constructor() {
        super();
    }
    async loginWithTwoFactor(code, token, userIp, userInfo, session) {
        if (!userIp) {
            userIp = '127.0.0.1';
        }
        let decoded;
        try {
            decoded = this.auth.decodeTwoFactorJWT(code);
        }
        catch (e) {
            console.log('failed to decode: ', e);
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
        if (decoded.expectedIp !== userIp) {
            console.log('ip mis-match');
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
        if (moment(decoded.iat * 1000).subtract(5, 'minutes').isSameOrAfter(moment())) {
            console.log('expired');
            throw new this.Conflict('TwoFactorCodeExpired');
        }
        let userId = decoded.userId;
        let twoFactorInfo = await this.settings.is2faEnabled(userId);
        if (!twoFactorInfo || !twoFactorInfo.enabled) {
            throw new this.Conflict('TwoFactorNotRequired');
        }
        let result;
        try {
            result = await this.auth.validateTOTPSecret(twoFactorInfo.secret, token);
        }
        catch (e) {
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
        if (!result) {
            throw new this.BadRequest('InvalidTwoFactorCode');
        }
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
    async login(username, password, userIp, userInfo, session) {
        if (!userIp) {
            userIp = '127.0.0.1';
        }
        if (userInfo) {
            throw new this.Conflict('LogoutRequired');
        }
        let userId;
        try {
            userId = await this.user.userNameToId(username);
        }
        catch (e) {
            throw new this.BadRequest('InvalidUsernameOrPassword');
        }
        let userData;
        try {
            userData = await this.user.getInfo(userId, ['username', 'passwordChanged']);
            const dbPasswordHashed = await this.user.getPassword(userId);
            const compare = await auth_1.verifyPassword(password, dbPasswordHashed);
            if (compare) {
                await this.user.logUserIp(userId, userIp, model.user.ipAddressActions.Login);
                let twoFactorEnabled = await this.settings.is2faEnabled(userId);
                if (twoFactorEnabled.enabled) {
                    let jwtInfo = this.auth.generateTwoFactorJWT(userId, userIp);
                    return {
                        success: true,
                        userId: userId,
                        username: userData.username,
                        isTwoFactorRequied: true,
                        twoFactor: jwtInfo,
                    };
                }
                session.userdata = {};
                session.userdata.id = userId;
                session.userdata.username = userData.username;
                session.userdata.passwordUpdated = userData.passwordChanged;
                return {
                    userId: userId,
                    username: userData.username,
                    isTwoFactorRequied: false,
                };
            }
            else {
                throw new Error('Invalid password submitted');
            }
        }
        catch (e) {
            console.log(e);
            try {
                await this.user.logUserIp(userId, userIp, model.user.ipAddressActions.UnsuccessfulLoginWithCompletedCaptcha);
            }
            catch (e) {
            }
            throw new this.BadRequest('InvalidUsernameOrPassword');
        }
    }
    async logout(userInfo, session, ipAddress) {
        try {
            await this.user.logUserIp(userInfo.userId, ipAddress, model.user.ipAddressActions.SignOut);
        }
        catch {
        }
        session.userdata = {};
        return {
            success: true
        };
    }
    async generateTOTPSecret(userInfo) {
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled) {
            throw new this.Conflict('TwoFactorAlreadyEnabled');
        }
        let secret = await this.auth.generateTOTPSecret();
        return secret;
    }
    async deleteTOTP(userInfo, password) {
        let userPassword = await this.user.getPassword(userInfo.userId);
        const valid = await this.auth.verifyPassword(password, userPassword);
        if (!valid) {
            throw new this.BadRequest('InvalidPassword');
        }
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled === false) {
            throw new this.Conflict('TwoFactorNotEnabled');
        }
        await this.settings.disable2fa(userInfo.userId);
        return {
            success: true,
        };
    }
    async updateTOTPSecret(userInfo, secret, token, password) {
        let userPassword = await this.user.getPassword(userInfo.userId);
        const valid = await this.auth.verifyPassword(password, userPassword);
        if (!valid) {
            throw new this.BadRequest('InvalidPassword');
        }
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled) {
            throw new this.Conflict('TwoFactorAlreadyEnabled');
        }
        let result;
        try {
            result = await this.auth.validateTOTPSecret(secret, token);
        }
        catch (e) {
            throw new this.BadRequest('InvalidTokenOrSecret');
        }
        if (!result) {
            throw new this.BadRequest('InvalidTokenOrSecret');
        }
        await this.settings.enable2fa(userInfo.userId, secret);
        return {
            success: true,
        };
    }
    async unlock(userInfo) {
        let banData;
        try {
            banData = await this.mod.getBanDataFromUserId(userInfo.userId);
        }
        catch (e) {
            throw new this.Conflict('Unauthorized');
        }
        if (banData['terminated'] === model.mod.terminated.true) {
            throw new this.Conflict('Unauthorized');
        }
        if (moment().isSameOrBefore(banData['untilUnbanned'])) {
            throw new this.Conflict('Unauthorized');
        }
        try {
            await this.user.modifyUserBanStatus(userInfo.userId, model.user.banned.false);
            await this.user.modifyAccountStatus(userInfo.userId, model.user.accountStatus.ok);
        }
        catch (e) {
            throw new Error('Internal');
        }
        return { success: true };
    }
    async signup(body, userIp, session) {
        let birthArray = body.birth;
        let username = body.username;
        let password = body.password;
        const birthYear = birthArray[2];
        const birthMonth = birthArray[1];
        const birthDay = birthArray[0];
        const momentDate = moment(birthYear + "-" + birthMonth + "-" + birthDay, 'YYYY-MM-DD');
        if (!momentDate.isValid()) {
            throw new this.BadRequest('InvalidBirthDate');
            ;
        }
        if (momentDate.isSameOrBefore(moment().subtract(100, "years"))) {
            throw new this.BadRequest('InvalidBirthDate');
            ;
        }
        const birthDateString = momentDate.format('YYYY-MM-DD HH:mm:ss');
        const usernamecheck = await this.user.isUsernameOk(username);
        if (usernamecheck !== 'OK') {
            throw new Error(usernamecheck);
        }
        let available;
        try {
            available = await this.user.usernameAvailableForSignup(username);
        }
        catch (e) {
            throw e;
        }
        if (!available) {
            throw new this.BadRequest('InvalidUsername');
            ;
        }
        if (!password || password.length < 6) {
            throw new this.BadRequest('InvalidPassword');
            ;
        }
        let hash;
        try {
            hash = await auth_1.hashPassword(password);
        }
        catch (e) {
            throw e;
        }
        if (!hash) {
            throw new Error();
        }
        let userId;
        try {
            userId = await this.user.createUser(username, hash, birthDateString);
        }
        catch (e) {
            if (e.code && e.code === "ER_DUP_ENTRY") {
                throw new this.BadRequest('InvalidUsername');
                ;
            }
            else {
                throw e;
            }
        }
        try {
            await this.user.addAvatarColors(userId, {
                "HeadRGB": [255, 255, 255],
                "LegRGB": [255, 255, 255],
                "TorsoRGB": [255, 255, 255],
            });
        }
        catch (e) {
            throw e;
        }
        try {
            await this.user.addUserThumbnail(userId, "https://cdn.hindigamer.club/thumbnails/b9db56f8457b5e64dae256e5a029541dd2820bb641d280dec9669bbab760fa1077a7106cbff4c445d950f60f6297fba5.png");
        }
        catch (e) {
            throw e;
        }
        try {
            await this.economy.addToUserBalance(userId, 10, model.economy.currencyType.secondary);
            await this.economy.createTransaction(userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, "Daily Stipend", model.catalog.creatorType.User, model.catalog.creatorType.User);
        }
        catch (e) {
            throw e;
        }
        try {
            await this.user.logUserIp(userId, userIp, model.user.ipAddressActions.SignUp);
        }
        catch (e) {
        }
        console.log('Return OK');
        session.userdata = {};
        session.userdata.id = userId;
        session.userdata.username = username;
        session.userdata.passwordUpdated = 0;
        return {
            userId: userId,
            username: username,
        };
    }
    async getFeed(userInfo, offset = 0) {
        let friends = await this.user.getFriends(userInfo.userId, 0, 200, 'asc');
        const arrayOfIds = [];
        friends.forEach((obj) => {
            arrayOfIds.push(obj.userId);
        });
        if (arrayOfIds.length === 0) {
            return [];
        }
        let feed = await this.user.multiGetStatus(arrayOfIds, offset, 25);
        return feed;
    }
    async updateStatus(userInfo, newStatus) {
        if (newStatus.length > 255 || newStatus.length < 3) {
            throw new this.BadRequest('InvalidStatus');
            ;
        }
        const latestUpdate = await this.user.getUserLatestStatus(userInfo.userId);
        if (latestUpdate && !moment().isSameOrAfter(moment(latestUpdate.date).add(5, "minutes"))) {
            throw new this.BadRequest('Cooldown');
            ;
        }
        await this.user.updateStatus(userInfo.userId, newStatus);
        return { success: true };
    }
    async resetPassword(code, numericUserId, newPassword) {
        let info;
        try {
            info = await this.user.getPasswordResetInfo(code);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCode');
            ;
        }
        if (info.userId !== numericUserId) {
            throw new this.BadRequest('InvalidCode');
            ;
        }
        if (moment().isSameOrAfter(moment(info.dateCreated).add(2, "hours"))) {
            throw new this.BadRequest('InvalidCode');
            ;
        }
        if (!newPassword || newPassword.length < 6) {
            throw new this.BadRequest('InvalidPassword');
            ;
        }
        let hash;
        try {
            hash = await auth_1.hashPassword(newPassword);
        }
        catch (e) {
            throw e;
        }
        await this.user.updatePassword(numericUserId, hash);
        await this.user.deletePasswordResetRequest(code);
        return {
            'success': true,
        };
    }
    async usernameAvailableForSignup(username) {
        if (!username) {
            throw new this.BadRequest('InvalidUsername');
            ;
        }
        const available = await this.user.isUsernameOk(username);
        if (available !== 'OK') {
            throw new this.BadRequest(available);
        }
        const usernameOk = await this.user.usernameAvailableForSignup(username);
        if (usernameOk) {
            return {
                success: true,
            };
        }
        throw new this.BadRequest('InvalidUsername');
    }
    async usernameAvailableForNameChange(userInfo, username) {
        if (!username) {
            throw new this.BadRequest('InvalidUsername');
        }
        const available = await this.user.isUsernameOk(username);
        if (available !== 'OK') {
            throw new this.BadRequest(available);
        }
        const usernameOk = await this.user.usernameAvailableForNameChange(userInfo.userId, username);
        if (usernameOk) {
            return {
                'success': true,
            };
        }
        throw new this.BadRequest('InvalidUsername');
    }
    async changeUsername(userInfo, newUserName) {
        if (!newUserName) {
            throw new this.BadRequest('InvalidUsername');
        }
        const available = await this.user.isUsernameOk(newUserName);
        if (available !== 'OK') {
            throw new this.BadRequest(available);
        }
        const usernameOk = await this.user.usernameAvailableForNameChange(userInfo.userId, newUserName);
        if (!usernameOk) {
            throw new this.BadRequest('InvalidUsername');
        }
        const usernameChangePrice = 1000;
        if (userInfo.primaryBalance < usernameChangePrice) {
            throw new this.BadRequest('NotEnoughCurrency');
        }
        const latestChange = await this.user.getLatestUsernameChange(userInfo.userId);
        if (latestChange && moment().isSameOrBefore(moment(latestChange.dateCreated).add(5, 'minutes'))) {
            throw new this.BadRequest('Cooldown');
        }
        await this.economy.subtractFromUserBalance(userInfo.userId, usernameChangePrice, model.economy.currencyType.primary);
        await this.economy.createTransaction(userInfo.userId, 1, -usernameChangePrice, model.economy.currencyType.primary, model.economy.transactionType.UsernameChange, 'Username Change', model.catalog.creatorType.User, model.catalog.creatorType.User);
        const oldUsername = userInfo.username;
        await this.user.addUserNameToNameChanges(userInfo.userId, oldUsername);
        await this.user.changeUserName(userInfo.userId, newUserName);
        return {
            success: true,
            newUsername: newUserName,
        };
    }
};
__decorate([
    common_1.Post('/login/two-factor'),
    swagger_1.Summary('Login to an account using the two-factor JWT generated from /auth/login'),
    common_1.Use(auth_1.csrf, Auth_1.NoAuth, RateLimit_1.RateLimiterMiddleware('loginAttempt')),
    swagger_1.Returns(200, { type: model.auth.LoginTwoFactorResponseOK, description: 'User session cookie will be set' }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTwoFactorCode: Token is not valid\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'TwoFactorNotRequired: Two factor authentication was disabled for this account. Please login normally.\nTwoFactorCodeExpired: Two-Factor JWT code has expired. Please login again.\n' }),
    swagger_1.Returns(429, { type: model.Error, description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n' }),
    __param(0, common_1.BodyParams('code', String)),
    __param(1, common_1.BodyParams('token', String)),
    __param(2, common_1.HeaderParams('cf-connecting-ip')),
    __param(3, common_1.Locals('userInfo')),
    __param(4, common_1.Session()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, model.user.UserInfo, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginWithTwoFactor", null);
__decorate([
    common_1.Post('/login'),
    swagger_1.Summary('Login to an account'),
    swagger_1.Description('Note that there is a limit of 25 attempts per hour, per IP address'),
    swagger_1.Returns(200, { type: model.auth.LoginRequestOK, description: 'Session will be set, unless "isTwoFactorRequired" is true. "twoFactor" is only defined if "isTwoFactorRequied" is true. If "twoFactor" is not undefined, the user will be required to grab their TOTP token and enter it, then the "twoFactor" string and TOTP token should be POSTed to /login/two-factor to complete the login flow' }),
    swagger_1.Returns(400, { description: 'InvalidUsernameOrPassword: Invalid Credentials\n', type: model.Error }),
    swagger_1.Returns(409, { description: 'LogoutRequired: You must be signed out to perform this action\n', type: model.Error }),
    swagger_1.Returns(429, { type: model.Error, description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n' }),
    common_1.Use(auth_1.csrf, Auth_1.NoAuth, RateLimit_1.RateLimiterMiddleware('loginAttempt')),
    __param(0, common_1.BodyParams('username', String)),
    __param(1, common_1.BodyParams('password', String)),
    __param(2, common_1.HeaderParams('cf-connecting-ip')),
    __param(3, common_1.Locals('userInfo')),
    __param(4, common_1.Session()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, model.user.UserInfo, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    common_1.Post('/logout'),
    swagger_1.Summary('Logout from the current session'),
    swagger_1.Returns(409, { description: 'LogoutRequired: You must be signed out to perform this action\n', type: model.Error }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Session()),
    __param(2, common_1.HeaderParams('cf-connecting-ip')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    common_1.Post('/generate-totp-secret'),
    swagger_1.Summary('Generate a secret for TOTP'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateTOTPSecret", null);
__decorate([
    common_1.Delete('/totp'),
    swagger_1.Summary('Delete a two-factor authentication code'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Use(RateLimit_1.RateLimiterMiddleware('twoFactorEnableOrDisable')),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('password', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "deleteTOTP", null);
__decorate([
    common_1.Patch('/totp'),
    swagger_1.Summary('Update (or set) the authenticated users TOTP secret'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    common_1.Use(RateLimit_1.RateLimiterMiddleware('twoFactorEnableOrDisable')),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('secret', String)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('token', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('password', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, String, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateTOTPSecret", null);
__decorate([
    common_1.Post('/unlock'),
    swagger_1.Summary('Unlock a banned account'),
    swagger_1.Returns(400, { description: 'Unauthorized: User is not authorized to perform this action\n', type: model.Error }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' }),
    swagger_1.Returns(403, { type: model.Error, description: 'Invalid CSRF Token' }),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "unlock", null);
__decorate([
    common_1.Post('/signup'),
    swagger_1.Summary('Register an account'),
    swagger_1.Returns(200, { description: 'OK', type: model.auth.SignupResponseOK }),
    swagger_1.Returns(409, { description: 'LogoutRequired: Login Required\nCaptchaValidationFailed: Invalid captcha token, expired, or not provided\n' }),
    swagger_1.Returns(403, { description: 'CSRFValidationFailed: Invalid CSRF Token\n' }),
    swagger_1.Returns(400, { description: 'InvalidBirthDate: Birth Date is invalid\nInvalidUsername: Username is taken or unavailable\nInvalidPassword: Password is too weak\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\nOneAccountPerIP: Only one account may be signed up per IP address, every 24 hours\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.NoAuth),
    common_1.Use(RecaptchaV2_1.default),
    __param(0, common_1.BodyParams(model.auth.SignupRequest)),
    __param(1, common_1.HeaderParams('cf-connecting-ip', String)),
    __param(2, common_1.Session()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.auth.SignupRequest, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    common_1.Get('/feed'),
    swagger_1.Summary('Get the authenticated user\'s feed. Hardcoded limit of 25 statuses per request'),
    swagger_1.ReturnsArray(200, { type: model.user.UserStatus }),
    swagger_1.Returns(401, { type: model.Error, description: 'LoginRequired: Login Required\n' }),
    common_1.UseBeforeEach(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.QueryParams('offset')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getFeed", null);
__decorate([
    common_1.Patch('/status'),
    swagger_1.Summary('Update the authenticated user\'s status'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidStatus: Status is too long or too short\nCooldown: You cannot change your status right now\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams("status", String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateStatus", null);
__decorate([
    common_1.Patch('/reset/password'),
    swagger_1.Summary('Reset user password via code from email'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCode: Code is expired or invalid\nInvalidPassword: Password is too short\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.NoAuth),
    __param(0, common_1.Required()),
    __param(0, common_1.BodyParams('code', String)),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('userId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('newPassword', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    common_1.Get('/username/available'),
    swagger_1.Summary('Check if a username is available for signup'),
    swagger_1.Returns(400, { description: 'InvalidUsername: Username is taken or unavailable\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\n' }),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('username', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "usernameAvailableForSignup", null);
__decorate([
    common_1.Get('/username/change/available'),
    swagger_1.Summary('Check if username is available for name change'),
    swagger_1.Returns(400, { description: 'InvalidUsername: Username is taken or unavailable\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\n' }),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.QueryParams('username', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "usernameAvailableForNameChange", null);
__decorate([
    common_1.Patch('/username/change'),
    swagger_1.Summary('Change authenticated user\'s username'),
    swagger_1.Description('User will be charged 1,000 Primary if succesful. User will not have to log in again since their session will update. The authenticated user will be logged out of all sessions other than the one that made this request'),
    swagger_1.Returns(200, { description: 'OK', type: model.auth.UsernameChangedResponseOK }),
    swagger_1.Returns(400, { description: 'InvalidUsername: Username is taken or unavailable\nUsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore\nUsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space\nUsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter\nUsernameConstriantTooLong: Username cannot be over 18 characters\nUsernameConstrintTooShort: Username must be over 3 characters long\nCooldown: You cannot change your username right now\nNotEnoughCurrency: User does not have 1,000+ Primary' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('username', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changeUsername", null);
AuthController = __decorate([
    common_1.Controller('/auth'),
    swagger_1.Description('Endpoints that deal directly with user authentication, authorization, credentials, and account creation'),
    __metadata("design:paramtypes", [])
], AuthController);
exports.default = AuthController;

