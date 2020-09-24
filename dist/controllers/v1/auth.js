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
const RateLimit_1 = require("../../middleware/RateLimit");
const model = require("../../models/models");
const auth_1 = require("../../dal/auth");
const controller_1 = require("../controller");
const Auth_1 = require("../../middleware/Auth");
const RecaptchaV2_1 = require("../../middleware/RecaptchaV2");
const moment = require("moment");
const crypto = require("crypto");
const IpQualityScore = require("../../middleware/IpQualityScore");
let AuthController = class AuthController extends controller_1.default {
    constructor() {
        super();
    }
    async getCurrentCountry(req) {
        let ip = req.ip;
        let loc = await this.user.getCountryDataFromIp(ip);
        if (loc) {
            return {
                country: loc.country,
                cookiePromptRequired: loc.eu === '1' || loc.countryCode === 'UK',
            };
        }
        else {
            return {
                country: 'UNKNOWN',
                cookiePromptRequired: true,
            };
        }
    }
    async updateCookieConsent(session, body) {
        let ga = body.googleAnalytics;
        if (typeof ga !== 'boolean') {
            throw new this.BadRequest('InvalidParameter');
        }
        if (typeof session !== 'object' || session === null) {
            throw new this.Conflict('Session is not an object.');
        }
        session.googleAnalytics = ga;
        return {};
    }
    async getCookieConsent(session) {
        if (typeof session.googleAnalytics !== 'boolean') {
            session.googleAnalytics = false;
        }
        return {
            googleAnalytics: session.googleAnalytics || false,
        };
    }
    getCurrentUser(userInfo, session) {
        let d = userInfo;
        if (typeof session.impersonateUserId === 'number') {
            d.trueUserId = session.userdata.id;
            d.isImpersonating = true;
            d.banned = 0;
        }
        return d;
    }
    async pingEvent(userInfo, url, impersonateUserId) {
        if (typeof impersonateUserId !== 'undefined') {
            return {};
        }
        await this.user.logOnlineStatus(userInfo.userId);
        if (moment().isSameOrAfter(moment(userInfo.dailyAward).add(24, 'hours'))) {
            const forUpdate = [
                'users',
                'transactions',
            ];
            await this.transaction(this, forUpdate, async function (trx) {
                await trx.economy.createTransaction(userInfo.userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, 'Daily Stipend', model.catalog.creatorType.User, model.catalog.creatorType.User);
                await trx.economy.addToUserBalance(userInfo.userId, 10, model.economy.currencyType.secondary);
                await trx.user.updateDailyAward(userInfo.userId);
            });
        }
        return {};
    }
    async getBanData(userInfo) {
        return this.mod.getBanDataFromUserId(userInfo.userId);
    }
    async requestPasswordReset(res, emailProvided) {
        let email = this.auth.verifyEmail(emailProvided);
        if (!email) {
            throw new this.BadRequest('InvalidEmail');
        }
        res.status(200).json({
            success: true,
        });
        try {
            let userInfo;
            try {
                userInfo = await this.settings.getUserByEmail(email);
            }
            catch (e) {
                console.log('[warn] email is invalid', email, e);
                return;
            }
            let randomCode = crypto.randomBytes(128);
            const stringToken = randomCode.toString('hex');
            await this.user.insertPasswordReset(userInfo.userId, stringToken);
            let url = `https://blockshub.net/reset/password?userId=${userInfo.userId}&code=` + encodeURIComponent(stringToken);
            await this.settings.sendEmail(email, `Password Reset Request`, `Hello ${userInfo.username}\nYou (or someone else) requested your account's password on BlocksHub to be reset. Please copy and paste the link below into your browser to reset your password.\n\n${url}\n`, `Hello ${userInfo.username}<br>You (or someone else) requested your account's password on BlocksHub to be reset. Please click the link below to reset your password.<br><a href="${url}">${url}</a><br>Alternatively, you can copy and paste this URL into your browser<br>${url}<br>`);
        }
        catch (e) {
            console.error(e);
        }
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
                        isTwoFactorRequired: true,
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
                    isTwoFactorRequired: false,
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
        if (session.impersonateUserId) {
            delete session.impersonateUserId;
        }
        return {
            success: true
        };
    }
    async generateTOTPSecret(userInfo) {
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled) {
            throw new this.Conflict('TwoFactorAlreadyEnabled');
        }
        try {
            let res = await this.auth.getCachedTotpResults(userInfo.userId);
            return JSON.parse(res);
        }
        catch (e) {
        }
        let results = await this.auth.generateTOTPSecret();
        await this.auth.setCachedTotpResults(userInfo.userId, JSON.stringify(results));
        return results;
    }
    async deleteTOTP(userInfo, password) {
        let userPassword = await this.user.getPassword(userInfo.userId);
        const valid = await this.auth.verifyPassword(password, userPassword);
        if (!valid) {
            throw new this.BadRequest('InvalidPassword');
        }
        let twoFA = await this.settings.is2faEnabled(userInfo.userId);
        if (!twoFA.enabled) {
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
    async signup(body, session, req) {
        let ip = req.ip;
        const signedUpInPast24Hours = await this.user.checkForIpSignup(ip);
        if (signedUpInPast24Hours && process.env.NODE_ENV !== 'development') {
            throw new this.BadRequest('OneAccountPerIP');
        }
        let birthArray = body.birth;
        let username = body.username;
        let password = body.password;
        const birthYear = birthArray[2];
        const birthMonth = birthArray[1];
        const birthDay = birthArray[0];
        const momentDate = moment(birthYear + "-" + birthMonth + "-" + birthDay, 'YYYY-MM-DD');
        if (!momentDate.isValid()) {
            throw new this.BadRequest('InvalidBirthDate');
        }
        if (momentDate.isSameOrBefore(moment().subtract(100, "years"))) {
            throw new this.BadRequest('InvalidBirthDate');
        }
        const nameCheck = this.user.isUsernameOk(username);
        if (nameCheck !== 'OK') {
            throw new this.BadRequest(nameCheck);
        }
        const forUpdate = [
            'users',
            'user_usernames',
            'user_referral_use',
        ];
        return await this.transaction(this, forUpdate, async function (trx) {
            const birthDateString = momentDate.format('YYYY-MM-DD HH:mm:ss');
            let available = await trx.user.usernameAvailableForSignup(username);
            if (!available) {
                throw new this.BadRequest('InvalidUsername');
            }
            if (!password || password.length < 6) {
                throw new this.BadRequest('InvalidPassword');
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
                userId = await trx.user.createUser(username, hash, birthDateString);
            }
            catch (e) {
                if (e.code && e.code === "ER_DUP_ENTRY") {
                    throw new this.BadRequest('InvalidUsername');
                }
                else {
                    throw e;
                }
            }
            await trx.user.addAvatarColors(userId, {
                "HeadRGB": [255, 255, 255],
                "LegRGB": [255, 255, 255],
                "TorsoRGB": [255, 255, 255],
            });
            await trx.user.addUserThumbnail(userId, "https://cdn.blockshub.net/thumbnails/b9db56f8457b5e64dae256e5a029541dd2820bb641d280dec9669bbab760fa1077a7106cbff4c445d950f60f6297fba5.png");
            await trx.economy.addToUserBalanceV2(userId, 10, model.economy.currencyType.secondary);
            await trx.economy.createTransaction(userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, "Daily Stipend", model.catalog.creatorType.User, model.catalog.creatorType.User);
            await trx.user.logUserIp(userId, ip, model.user.ipAddressActions.SignUp);
            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || process.env.IS_STAGING === '1') {
                let verifiedEmail = req.headers['x-verified-email'];
                if (verifiedEmail) {
                    await trx.settings.insertNewEmail(userId, verifiedEmail, 'example_code');
                    await trx.settings.markEmailAsVerified(userId);
                }
                let startingPrimary = req.headers['x-start-primary'];
                if (startingPrimary) {
                    let primaryNumber = parseInt(startingPrimary, 10);
                    await trx.economy.addToUserBalance(userId, primaryNumber, model.economy.currencyType.primary);
                }
                let startingSecondary = req.headers['x-start-secondary'];
                if (startingSecondary) {
                    let secondaryNumber = parseInt(startingSecondary, 10);
                    await trx.economy.addToUserBalance(userId, secondaryNumber, model.economy.currencyType.secondary);
                }
            }
            if (body.referralId) {
                let referralInfo = await trx.userReferral.getInfoById(body.referralId);
                await trx.userReferral.registerReferralCodeUseForUser(userId, body.referralId);
            }
            session.userdata = {};
            session.userdata.id = userId;
            session.userdata.username = username;
            session.userdata.passwordUpdated = 0;
            return {
                userId: userId,
                username: username,
            };
        });
    }
    async resetPassword(code, numericUserId, newPassword) {
        let info;
        try {
            info = await this.user.getPasswordResetInfo(code);
        }
        catch (e) {
            throw new this.BadRequest('InvalidCode');
        }
        if (info.userId !== numericUserId) {
            throw new this.BadRequest('InvalidCode');
        }
        if (moment().isSameOrAfter(moment(info.dateCreated).add(2, "hours"))) {
            throw new this.BadRequest('InvalidCode');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new this.BadRequest('InvalidPassword');
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
    async startAuthenticationFlowToService(userInfo, returnUrl) {
        if (process.env.NODE_ENV === 'production') {
            if (returnUrl.slice(0, 'https://'.length) !== 'https://') {
                throw new this.BadRequest('AuthenticationServiceConstraintHTTPSRequired');
            }
        }
        if (!returnUrl.slice('https://'.length).match(/\./g)) {
            throw new this.BadRequest('InvalidReturnUrl');
        }
        if (returnUrl.slice(0, 'https://www.blockshub.net'.length) === 'https://www.blockshub.net') {
            throw new this.Conflict('AuthenticationServiceBlacklisted');
        }
        if (returnUrl.slice(0, 'https://blockshub.net'.length) === 'https://blockshub.net') {
            throw new this.Conflict('AuthenticationServiceBlacklisted');
        }
        let generatedJwt = await this.auth.generateAuthServiceJWT(userInfo.userId, userInfo.username);
        return {
            code: generatedJwt,
        };
    }
    async validateAuthenticationCode(code) {
        let result;
        try {
            result = await this.auth.decodeAuthServiceJWT(code);
            if (moment().isSameOrAfter(moment(result.iat * 1000).add(5, 'minutes'))) {
                throw new this.BadRequest('InvalidCode');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidCode');
        }
        return result;
    }
    async getModerationHistory(userInfo) {
        let history = await this.user.getModerationHistory(userInfo.userId);
        return history;
    }
};
__decorate([
    common_1.Get('/current-country'),
    swagger_1.Summary('Get user country'),
    swagger_1.Returns(200, { type: model.auth.UserCountryResponse }),
    __param(0, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCurrentCountry", null);
__decorate([
    common_1.Patch('/cookie-consent'),
    swagger_1.Summary('Update cookie consent settings'),
    common_1.Use(auth_1.csrf),
    __param(0, common_1.Session()),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams(model.auth.CookieConsentInformation)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, model.auth.CookieConsentInformation]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateCookieConsent", null);
__decorate([
    common_1.Get('/cookie-consent'),
    swagger_1.Summary('Get current cookie consent information'),
    swagger_1.Description('If the current session has not agreed to any cookies, they are all set to "false" by default.'),
    swagger_1.Returns(200, { type: model.auth.CookieConsentInformation, description: 'Current user cookie consent info' }),
    __param(0, common_1.Session()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getCookieConsent", null);
__decorate([
    common_1.Get('/current-user'),
    swagger_1.Summary('Get the current authenticated user'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.Returns(200, { description: 'OK' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Session()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getCurrentUser", null);
__decorate([
    common_1.Post('/ping'),
    swagger_1.Summary('Send ping event'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Returns(200, { description: 'OK' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams('url', String)),
    __param(2, common_1.Locals('impersonateUserId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "pingEvent", null);
__decorate([
    common_1.Get('/ban'),
    swagger_1.Summary('Authenticated user ban information'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.Returns(200, { type: model.mod.ModerationAction }),
    swagger_1.Returns(404, controller_1.default.cError('NoBanAvailable: User is not banned\n')),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getBanData", null);
__decorate([
    common_1.Put('/request/password-reset'),
    swagger_1.Summary('Request a password reset'),
    swagger_1.Description('Limited to 5 attempts per hour. Uses RecaptchaV2'),
    common_1.Use(auth_1.csrf, Auth_1.NoAuth, RateLimit_1.RateLimiterMiddleware('passwordResetAttempt'), RecaptchaV2_1.default),
    __param(0, common_1.Res()),
    __param(1, common_1.BodyParams('email', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestPasswordReset", null);
__decorate([
    common_1.Post('/login/two-factor'),
    swagger_1.Summary('Login to an account using the two-factor JWT generated from /auth/login'),
    common_1.Use(auth_1.csrf, Auth_1.NoAuth, RateLimit_1.RateLimiterMiddleware('loginAttempt')),
    swagger_1.Returns(200, { type: model.auth.LoginTwoFactorResponseOK, description: 'User session cookie will be set' }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTwoFactorCode: Token is not valid\n' }),
    swagger_1.Returns(409, {
        type: model.Error,
        description: 'TwoFactorNotRequired: Two factor authentication was disabled for this account. Please login normally.\nTwoFactorCodeExpired: Two-Factor JWT code has expired. Please login again.\n'
    }),
    swagger_1.Returns(429, {
        type: model.Error,
        description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n'
    }),
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
    swagger_1.Returns(200, {
        type: model.auth.LoginRequestOK,
        description: 'Session will be set, unless "isTwoFactorRequired" is true. "twoFactor" is only defined if "isTwoFactorRequired" is true. If "twoFactor" is not undefined, the user will be required to grab their TOTP token and enter it, then the "twoFactor" string and TOTP token should be POSTed to /login/two-factor to complete the login flow'
    }),
    swagger_1.Returns(400, { description: 'InvalidUsernameOrPassword: Invalid Credentials\n', type: model.Error }),
    swagger_1.Returns(409, controller_1.default.cError('LogoutRequired: You must be signed out to perform this action')),
    swagger_1.Returns(429, {
        type: model.Error,
        description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n'
    }),
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
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
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
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "generateTOTPSecret", null);
__decorate([
    common_1.Delete('/totp'),
    swagger_1.Summary('Delete a two-factor authentication code'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
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
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
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
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
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
    swagger_1.Returns(409, controller_1.default.cError('LogoutRequired: Login Required', 'CaptchaValidationFailed: Invalid captcha token, expired, or not provided', 'RequestDisallowed: This request is not allowed')),
    swagger_1.Returns(400, controller_1.default.cError('InvalidBirthDate: Birth Date is invalid', 'InvalidUsername: Username is taken or unavailable', 'InvalidPassword: Password is too weak', 'UsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore', 'UsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space', 'UsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter', 'UsernameConstraintTooLong: Username cannot be over 18 characters', 'UsernameConstrintTooShort: Username must be over 3 characters long', 'OneAccountPerIP: Only one account may be signed up per IP address, every 24 hours')),
    common_1.Use(auth_1.csrf, Auth_1.NoAuth, RecaptchaV2_1.default, IpQualityScore.check({
        maxScore: IpQualityScore.IpMaxScores.Signup,
        strictness: IpQualityScore.IpStrictness.Signup,
    })),
    __param(0, common_1.BodyParams(model.auth.SignupRequest)),
    __param(1, common_1.Session()),
    __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.auth.SignupRequest, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "signup", null);
__decorate([
    common_1.Patch('/reset/password'),
    swagger_1.Summary('Reset user password via code from email'),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidCode: Code is expired or invalid\nInvalidPassword: Password is too short\n'
    }),
    common_1.Use(auth_1.csrf, Auth_1.NoAuth),
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
    common_1.Use(Auth_1.YesAuth),
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
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('username', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changeUsername", null);
__decorate([
    common_1.Post('/authenticate-to-service'),
    swagger_1.Summary('Generate an auth code required to sign into a service'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Returns(200, { type: model.auth.GenerateAuthenticationCodeResponse }),
    swagger_1.Returns(400, {
        type: model.Error,
        description: 'InvalidReturnUrl: Return URL is not valid\nAuthenticationServiceConstraintHTTPSRequired: The returnUrl must use the HTTPS protocol\n'
    }),
    swagger_1.Returns(409, {
        type: model.Error,
        description: 'AuthenticationServiceBlacklisted: The returnUrl is blacklisted and cannot be used\n'
    }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('returnUrl', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "startAuthenticationFlowToService", null);
__decorate([
    common_1.Post('/validate-authentication-code'),
    swagger_1.Summary('Validate an authentication code generated from /api/v1/auth/authenticate-to-service'),
    swagger_1.Description('No CSRF validation or authentication requirement as this is meant for external services. Note that codes can be redeemed multiple times, by multiple parties. Codes expire after 5 minutes, so you are advised to save the results to a session or something depending on what you are using the code for.\n\nNote: You should always validate the code through this endpoint instead of manually decoding the JWT yourself. If you do not verify it here, the code can very easily be spoofed. View a full tutorial here: https://blockshub.net/forum/thread/244?page=1'),
    swagger_1.Returns(200, { type: model.auth.ValidateAuthenticationCodeResponse }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCode: The code is invalid or has expired\n' }),
    __param(0, common_1.Required()),
    __param(0, common_1.BodyParams('code', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "validateAuthenticationCode", null);
__decorate([
    common_1.Get('/moderation/history'),
    swagger_1.Summary('Get a page of moderationHistory for the authenticated user'),
    common_1.Use(Auth_1.YesAuth),
    swagger_1.ReturnsArray(200, { type: model.user.UserModerationAction }),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getModerationHistory", null);
AuthController = __decorate([
    common_1.Controller('/auth'),
    swagger_1.Description('Endpoints that deal directly with user authentication, authorization, credentials, and account creation'),
    __metadata("design:paramtypes", [])
], AuthController);
exports.default = AuthController;

