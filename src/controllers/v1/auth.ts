/**
 * Imports
 */
// TSed
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    HeaderParams,
    Locals,
    Patch,
    Post,
    Put,
    QueryParams,
    Req,
    Required,
    Res,
    Session,
    Use,
    UseBefore,
    UseBeforeEach
} from "@tsed/common";
import { Description, Returns, ReturnsArray, Summary } from "@tsed/swagger"; // import swagger Ts.ED module
import { RateLimiterMiddleware } from '../../middleware/RateLimit';
// Models
import * as model from '../../models/models';
// Auth stuff
import { csrf, hashPassword, verifyPassword } from '../../dal/auth';
// Autoload
import controller from '../controller';
import { NoAuth, YesAuth } from "../../middleware/Auth";
import RecaptchaV2 from '../../middleware/RecaptchaV2';
import moment = require('moment');
import crypto = require('crypto');
import * as IpQualityScore from "../../middleware/IpQualityScore";

/**
 * Auth Controller
 */
@Controller('/auth')
@Description('Endpoints that deal directly with user authentication, authorization, credentials, and account creation')
export default class AuthController extends controller {

    constructor() {
        super();
    }

    @Get('/current-country')
    @Summary('Get user country')
    @Returns(200, { type: model.auth.UserCountryResponse })
    public async getCurrentCountry(
        @Req() req: Req,
    ) {
        let ip = req.ip;
        let loc = await this.user.getCountryDataFromIp(ip);
        if (loc) {
            return {
                country: loc.country,
                cookiePromptRequired: loc.eu === '1' || loc.countryCode === 'UK',
            }
        } else {
            return {
                country: 'UNKNOWN',
                cookiePromptRequired: true,
            }
        }
    }

    @Patch('/cookie-consent')
    @Summary('Update cookie consent settings')
    @Use(csrf)
    public async updateCookieConsent(
        @Session() session: any,
        @Required()
        @BodyParams(model.auth.CookieConsentInformation) body: model.auth.CookieConsentInformation,
    ) {
        let ga = body.googleAnalytics;
        if (typeof ga !== 'boolean') {
            throw new this.BadRequest('InvalidParameter');
        }
        if (typeof session !== 'object' || session === null) {
            throw new this.Conflict('Session is not an object.');
        }
        session.googleAnalytics = ga;
        // Ok
        return {}
    }

    @Get('/cookie-consent')
    @Summary('Get current cookie consent information')
    @Description('If the current session has not agreed to any cookies, they are all set to "false" by default.')
    @Returns(200, { type: model.auth.CookieConsentInformation, description: 'Current user cookie consent info' })
    public async getCookieConsent(
        @Session() session: any,
    ) {
        if (typeof session.googleAnalytics !== 'boolean') {
            session.googleAnalytics = false;
        }
        return {
            googleAnalytics: session.googleAnalytics || false,
        }
    }


    @Get('/current-user')
    @Summary('Get the current authenticated user')
    @Use(YesAuth)
    @Returns(200, { description: 'OK' })
    public getCurrentUser(
        @Locals('userInfo') userInfo: model.UserSession,
        @Session() session: any,
    ) {
        let d = userInfo;
        if (typeof session.impersonateUserId === 'number') {
            // @ts-ignore
            d.trueUserId = session.userdata.id;
            // @ts-ignore
            d.isImpersonating = true;
            // @ts-ignore
            d.banned = 0;
        }
        return d;
    }

    @Post('/ping')
    @Summary('Send ping event')
    @Use(csrf, YesAuth)
    @Returns(200, { description: 'OK' })
    public async pingEvent(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams('url', String) url: string,
        @Locals('impersonateUserId') impersonateUserId: number | undefined,
    ) {
        // If requester is staff impersonating, do not give currency/log online status
        if (typeof impersonateUserId !== 'undefined') {
            return {};
        }
        await this.user.logOnlineStatus(userInfo.userId);
        // If over 24 hours since user got award for currency,
        if (moment().isSameOrAfter(moment(userInfo.dailyAward).add(24, 'hours'))) {
            const forUpdate = [
                'users',
                'transactions',
            ]
            await this.transaction(this, forUpdate, async function (trx) {
                // Create transaction
                await trx.economy.createTransaction(userInfo.userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, 'Daily Stipend', model.catalog.creatorType.User, model.catalog.creatorType.User);
                // Give money
                await trx.economy.addToUserBalance(userInfo.userId, 10, model.economy.currencyType.secondary);
                // Log user as awarded (aka update the dailyAward date)
                await trx.user.updateDailyAward(userInfo.userId);
            });
        }
        return {}
    }

    @Get('/ban')
    @Summary('Authenticated user ban information')
    @Use(YesAuth)
    @Returns(200, { type: model.mod.ModerationAction })
    @Returns(404, controller.cError('NoBanAvailable: User is not banned\n'))
    public async getBanData(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        return this.mod.getBanDataFromUserId(userInfo.userId);
    }

    @Put('/request/password-reset')
    @Summary('Request a password reset')
    @Description('Limited to 5 attempts per hour. Uses RecaptchaV2')
    @Use(csrf, NoAuth, RateLimiterMiddleware('passwordResetAttempt'), RecaptchaV2)
    public async requestPasswordReset(
        @Res() res: Res,
        @BodyParams('email', String) emailProvided: string,
    ) {
        let email = this.auth.verifyEmail(emailProvided);
        if (!email) {
            throw new this.BadRequest('InvalidEmail');
        }
        // return success
        res.status(200).json({
            success: true,
        });
        // verify and send email in background
        try {
            let userInfo: { userId: number; username: string };
            try {
                userInfo = await this.settings.getUserByEmail(email);
            } catch (e) {
                // no email
                console.log('[warn] email is invalid', email, e);
                return;
            }
            // generate reset link
            let randomCode = crypto.randomBytes(128);
            const stringToken = randomCode.toString('hex');
            // insert code
            await this.user.insertPasswordReset(userInfo.userId, stringToken);
            // create url
            let url = `https://blockshub.net/reset/password?userId=${userInfo.userId}&code=` + encodeURIComponent(stringToken);
            // send email
            await this.settings.sendEmail(email, `Password Reset Request`,
                `Hello ${userInfo.username}\nYou (or someone else) requested your account's password on BlocksHub to be reset. Please copy and paste the link below into your browser to reset your password.\n\n${url}\n`, `Hello ${userInfo.username}<br>You (or someone else) requested your account's password on BlocksHub to be reset. Please click the link below to reset your password.<br><a href="${url}">${url}</a><br>Alternatively, you can copy and paste this URL into your browser<br>${url}<br>`);
        } catch (e) {
            console.error(e);
        }
    }

    @Post('/login/two-factor')
    @Summary('Login to an account using the two-factor JWT generated from /auth/login')
    @Use(csrf, NoAuth, RateLimiterMiddleware('loginAttempt'))
    @Returns(200, { type: model.auth.LoginTwoFactorResponseOK, description: 'User session cookie will be set' })
    @Returns(400, { type: model.Error, description: 'InvalidTwoFactorCode: Token is not valid\n' })
    @Returns(409, {
        type: model.Error,
        description: 'TwoFactorNotRequired: Two factor authentication was disabled for this account. Please login normally.\nTwoFactorCodeExpired: Two-Factor JWT code has expired. Please login again.\n'
    })
    @Returns(429, {
        type: model.Error,
        description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n'
    })
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
        let decoded: { userId: number; expectedIp: string; iat: number; };
        try {
            decoded = this.auth.decodeTwoFactorJWT(code);
        } catch (e) {
            console.log('failed to decode: ', e);
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
        } catch (e) {
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
    @Returns(200, {
        type: model.auth.LoginRequestOK,
        description: 'Session will be set, unless "isTwoFactorRequired" is true. "twoFactor" is only defined if "isTwoFactorRequired" is true. If "twoFactor" is not undefined, the user will be required to grab their TOTP token and enter it, then the "twoFactor" string and TOTP token should be POSTed to /login/two-factor to complete the login flow'
    })
    @Returns(400, { description: 'InvalidUsernameOrPassword: Invalid Credentials\n', type: model.Error })
    @Returns(409, controller.cError(
        'LogoutRequired: You must be signed out to perform this action',
    ))
    @Returns(429, {
        type: model.Error,
        description: 'TooManyRequests: Try again later (see x-ratelimit-reset header for exact timestamp when you can retry)\n'
    })
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
                        isTwoFactorRequired: true,
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
                    isTwoFactorRequired: false,
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
    @Use(csrf, YesAuth)
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
        if (session.impersonateUserId) {
            delete session.impersonateUserId;
        }
        // Return success
        return {
            success: true
        };
    }

    @Post('/generate-totp-secret')
    @Summary('Generate a secret for TOTP')
    @Use(csrf, YesAuth)
    public async generateTOTPSecret(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        let enabled = await this.settings.is2faEnabled(userInfo.userId);
        if (enabled.enabled) {
            throw new this.Conflict('TwoFactorAlreadyEnabled');
        }
        try {
            let res = await this.auth.getCachedTotpResults(userInfo.userId);
            return JSON.parse(res);
        } catch (e) {

        }
        let results = await this.auth.generateTOTPSecret();
        await this.auth.setCachedTotpResults(userInfo.userId, JSON.stringify(results));
        return results;
    }

    @Delete('/totp')
    @Summary('Delete a two-factor authentication code')
    @Use(csrf, YesAuth)
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
        let twoFA = await this.settings.is2faEnabled(userInfo.userId);
        if (!twoFA.enabled) {
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
    @Use(csrf, YesAuth)
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
        } catch (e) {
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
    @Use(csrf, YesAuth)
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
    @Returns(409, controller.cError(
        'LogoutRequired: Login Required',
        'CaptchaValidationFailed: Invalid captcha token, expired, or not provided',
        'RequestDisallowed: This request is not allowed',
    ))
    @Returns(400, controller.cError(
        'InvalidBirthDate: Birth Date is invalid',
        'InvalidUsername: Username is taken or unavailable',
        'InvalidPassword: Password is too weak',
        'UsernameConstraint1Space1Period1Underscore: Username can only contain 1 space, 1 period, and 1 underscore',
        'UsernameConstriantCannotEndOrStartWithSpace: Username cannot begin or end with a space',
        'UsernameConstraintInvalidCharacters: Username can only contain a space, a period, a underscore, a number, or an english letter',
        'UsernameConstraintTooLong: Username cannot be over 18 characters',
        'UsernameConstrintTooShort: Username must be over 3 characters long',
        'OneAccountPerIP: Only one account may be signed up per IP address, every 24 hours',
    ))
    @Use(csrf, NoAuth, RecaptchaV2, IpQualityScore.check({
        maxScore: IpQualityScore.IpMaxScores.Signup,
        strictness: IpQualityScore.IpStrictness.Signup,
    }))
    public async signup(
        @BodyParams(model.auth.SignupRequest) body: model.auth.SignupRequest,
        @Session() session: Express.Session,
        @Req() req: Req,
    ) {
        /**
         * Check if signed up recently
         */
        let ip = req.ip as string;
        const signedUpInPast24Hours = await this.user.checkForIpSignup(ip);
        if (signedUpInPast24Hours && process.env.NODE_ENV !== 'development') {
            throw new this.BadRequest('OneAccountPerIP');
        }

        let birthArray = body.birth;
        let username = body.username;
        let password = body.password;

        // Confirm birth date provided is valid
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
        // Username Checker
        const nameCheck = this.user.isUsernameOk(username);
        if (nameCheck !== 'OK') {
            throw new this.BadRequest(nameCheck);
        }
        // Start transaction
        const forUpdate = [
            'users',
            'user_usernames',
            'user_referral_use',
        ]
        return await this.transaction(this, forUpdate, async function (trx) {
            const birthDateString = momentDate.format('YYYY-MM-DD HH:mm:ss');
            // Make sure user doesn't already exist
            let available = await trx.user.usernameAvailableForSignup(username);
            if (!available) {
                throw new this.BadRequest('InvalidUsername');
            }
            // Username OK. Let's try password
            if (!password || password.length < 6) {
                throw new this.BadRequest('InvalidPassword');
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
                userId = await trx.user.createUser(username, hash, birthDateString);
            } catch (e) {
                if (e.code && e.code === "ER_DUP_ENTRY") {
                    throw new this.BadRequest('InvalidUsername');
                } else {
                    throw e;
                }
            }
            // Create Avatar Colors
            await trx.user.addAvatarColors(userId, {
                "HeadRGB": [255, 255, 255],
                "LegRGB": [255, 255, 255],
                "TorsoRGB": [255, 255, 255],
            });
            // Add Thumbnail
            await trx.user.addUserThumbnail(userId, "https://cdn.blockshub.net/thumbnails/b9db56f8457b5e64dae256e5a029541dd2820bb641d280dec9669bbab760fa1077a7106cbff4c445d950f60f6297fba5.png");
            // Give First-Time Transaction
            await trx.economy.addToUserBalanceV2(userId, 10, model.economy.currencyType.secondary);
            await trx.economy.createTransaction(userId, 1, 10, model.economy.currencyType.secondary, model.economy.transactionType.DailyStipendSecondary, "Daily Stipend", model.catalog.creatorType.User, model.catalog.creatorType.User);
            // Record Signup
            await trx.user.logUserIp(userId, ip, model.user.ipAddressActions.SignUp);
            // Options for dev env
            if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || process.env.IS_STAGING === '1') {
                let verifiedEmail = req.headers['x-verified-email'] as string;
                if (verifiedEmail) {
                    // add verified email
                    await trx.settings.insertNewEmail(userId, verifiedEmail, 'example_code');
                    await trx.settings.markEmailAsVerified(userId);
                }
                let startingPrimary = req.headers['x-start-primary'] as string;
                if (startingPrimary) {
                    let primaryNumber = parseInt(startingPrimary, 10);
                    // add to balance
                    await trx.economy.addToUserBalance(userId, primaryNumber, model.economy.currencyType.primary);
                }
                let startingSecondary = req.headers['x-start-secondary'] as string;
                if (startingSecondary) {
                    let secondaryNumber = parseInt(startingSecondary, 10);
                    // add to balance
                    await trx.economy.addToUserBalance(userId, secondaryNumber, model.economy.currencyType.secondary);
                }
            }
            // If using referral code, register it
            if (body.referralId) {
                // confirm is valid
                let referralInfo = await trx.userReferral.getInfoById(body.referralId);
                // set
                await trx.userReferral.registerReferralCodeUseForUser(userId, body.referralId);
            }
            // Setup user session
            session.userdata = {};
            session.userdata.id = userId;
            session.userdata.username = username;
            session.userdata.passwordUpdated = 0;
            // Return signup data
            return {
                userId: userId,
                username: username,
            };
        });

    }

    @Patch('/reset/password')
    @Summary('Reset user password via code from email')
    @Returns(400, {
        type: model.Error,
        description: 'InvalidCode: Code is expired or invalid\nInvalidPassword: Password is too short\n'
    })
    @Use(csrf, NoAuth)
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
            throw new this.BadRequest('InvalidCode');
        }
        // If userid does not match
        if (info.userId !== numericUserId) {
            throw new this.BadRequest('InvalidCode');
        }
        // Codes expire after 2 hours
        if (moment().isSameOrAfter(moment(info.dateCreated).add(2, "hours"))) {
            throw new this.BadRequest('InvalidCode');
        }
        // Confirm password is valid
        if (!newPassword || newPassword.length < 6) {
            throw new this.BadRequest('InvalidPassword');
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
            throw new this.BadRequest('InvalidUsername');
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
    @Use(YesAuth)
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
    @Returns(200, { type: model.auth.GenerateAuthenticationCodeResponse })
    @Returns(400, {
        type: model.Error,
        description: 'InvalidReturnUrl: Return URL is not valid\nAuthenticationServiceConstraintHTTPSRequired: The returnUrl must use the HTTPS protocol\n'
    })
    @Returns(409, {
        type: model.Error,
        description: 'AuthenticationServiceBlacklisted: The returnUrl is blacklisted and cannot be used\n'
    })
    public async startAuthenticationFlowToService(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('returnUrl', String) returnUrl: string,
    ) {
        // Skip HTTPs check in development to make testing stuff easier
        if (process.env.NODE_ENV === 'production') {
            // Make sure URL is using HTTPS
            if (returnUrl.slice(0, 'https://'.length) !== 'https://') {
                throw new this.BadRequest('AuthenticationServiceConstraintHTTPSRequired');
            }
        }
        // Make sure URL contains at least one "."
        if (!returnUrl.slice('https://'.length).match(/\./g)) {
            throw new this.BadRequest('InvalidReturnUrl');
        }
        // Make sure URL is not blockshub.net
        // www.blockshub.net
        if (returnUrl.slice(0, 'https://www.blockshub.net'.length) === 'https://www.blockshub.net') {
            throw new this.Conflict('AuthenticationServiceBlacklisted');
        }
        // blockshub.net
        if (returnUrl.slice(0, 'https://blockshub.net'.length) === 'https://blockshub.net') {
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
    @Description('No CSRF validation or authentication requirement as this is meant for external services. Note that codes can be redeemed multiple times, by multiple parties. Codes expire after 5 minutes, so you are advised to save the results to a session or something depending on what you are using the code for.\n\nNote: You should always validate the code through this endpoint instead of manually decoding the JWT yourself. If you do not verify it here, the code can very easily be spoofed. View a full tutorial here: https://blockshub.net/forum/thread/244?page=1')
    @Returns(200, { type: model.auth.ValidateAuthenticationCodeResponse })
    @Returns(400, { type: model.Error, description: 'InvalidCode: The code is invalid or has expired\n' })
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
        } catch (e) {
            throw new this.BadRequest('InvalidCode');
        }
        return result;
    }

    @Get('/moderation/history')
    @Summary('Get a page of moderationHistory for the authenticated user')
    @Use(YesAuth)
    @ReturnsArray(200, { type: model.user.UserModerationAction })
    public async getModerationHistory(
        @Locals('userInfo') userInfo: model.UserSession,
    ) {
        let history = await this.user.getModerationHistory(userInfo.userId);
        return history;
    }
}
