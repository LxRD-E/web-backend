/**
 * Imports
 */
// Express
import crypto = require('crypto');
import moment = require('moment');
// Interfaces
import * as model from '../../models/models';
// Autoload
import controller from '../controller';
// TSED
import {
    Locals,
    Required,
    BodyParams,
    Get,
    UseBefore,
    Patch,
    OverrideMiddleware,
    Post,
    UseBeforeEach,
    Session,
    Controller,
    Use
} from '@tsed/common';
import {YesAuth} from '../../middleware/Auth';
import {Summary, Returns} from '@tsed/swagger';
import {csrf} from '../../dal/auth';
import {RateLimiterMiddleware} from '../../middleware/RateLimit';

/**
 * Settings Controller
 */
@Controller('/settings')
export default class SettingsController extends controller {
    // Constructor
    constructor() {
        super();
    }

    @Get('/')
    @Summary('Get user settings')
    @UseBefore(YesAuth)
    @Returns(200, {type: model.settings.UserSettings})
    public async accountSettings(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ): Promise<model.settings.UserSettings> {
        const settingsObject = {
            blurb: "",
            tradingEnabled: 0,
            theme: 0,
            forumSignature: "e",
            email: {},
            '2faEnabled': 0,
        } as model.settings.UserSettings;
        let userInfoModel = await this.user.getInfo(userInfo.userId, ['blurb', 'tradingEnabled', 'theme', 'forumSignature', '2faEnabled', 'birthDate']);
        console.log('date type:', typeof userInfoModel.birthDate);
        settingsObject.blurb = userInfoModel.blurb;
        settingsObject.tradingEnabled = userInfoModel.tradingEnabled;
        settingsObject.theme = userInfoModel.theme;
        settingsObject.forumSignature = userInfoModel.forumSignature;
        settingsObject.forumSignature = userInfoModel.forumSignature;
        settingsObject.birthDate = userInfoModel.birthDate;
        settingsObject["2faEnabled"] = userInfoModel['2faEnabled'];
        const userEmailModel = await this.user.getUserEmail(userInfo.userId);
        const userEmail = await this.settings.getUserEmail(userInfo.userId);
        if (!userEmailModel) {
            settingsObject["email"] = {
                status: model.user.emailVerificationType.false,
                email: null,
            }
        } else {
            if (!userEmail) {
                throw new Error('userEmail is undefined');
            }
            let protectedEmail = userEmail.email as string;
            const matchLen = protectedEmail.match(/.+@/g);
            let totalMatchLen = 0;
            if (matchLen && matchLen[0]) {
                totalMatchLen = matchLen[0].length - 4;
                if (totalMatchLen < 4) {
                    totalMatchLen = 4;
                }
            }
            const hiddenPart = "*".repeat(totalMatchLen);
            protectedEmail = protectedEmail.charAt(0) + hiddenPart + protectedEmail.match(/@.+/g);
            settingsObject["email"] = {
                status: userEmailModel.status,
                email: protectedEmail,
            }
        }
        return settingsObject;
    }

    @Post('/email/verification/resend')
    @Summary('Request a verification email resend')
    @Returns(409, {
        type: model.Error,
        description: 'FloodCheck: Try again later\nNoEmailAttached: There is no email attached to this account\nEmailAlreadyVerified: The email attached to this account is already verified\n'
    })
    @Use(csrf, YesAuth)
    public async requestVerificationEmailResend(
        @Locals('userInfo') UserInfo: model.user.UserInfo,
    ) {
        let userEmail = await this.settings.getUserEmail(UserInfo.userId);
        if (!userEmail) {
            throw new this.Conflict('NoEmailAttached');
        }
        if (userEmail.status !== model.user.emailVerificationType.false) {
            throw new this.Conflict('EmailAlreadyVerified');
        }
        if (!moment().isSameOrAfter(moment(userEmail.date).add(1.15, "hours"))) {
            throw new this.Conflict('FloodCheck');
        }
        // Token Generator
        let emailToken = await new Promise<string>((resolve, reject): void => {
            crypto.randomBytes(128, function (err, buffer) {
                if (err) {
                    reject();
                } else {
                    resolve(buffer.toString('hex'));
                }
            });
        });
        if (!userEmail || !userEmail.email) {
            throw new Error('userEmail is undefined');
        }
        let newEmail = await this.settings.insertNewEmail(UserInfo.userId, userEmail.email, emailToken);
        // Send Verify Request
        try {
            // We don't await this since it can delay requests by a factor of many seconds, so it's better to just send of the request, tell the user it worked, then hope the email was valid.
            this.settings.sendEmail(userEmail.email, "Email Verification", "Thank you for adding a new email to your account. Visit this link to verify it: https://blockshub.net/email/verify?code=" + emailToken, "<h5>Hello,</h5><p>Thank you for adding a new email to your account. Please click <a href=\"https://blockshub.net/email/verify?code=" + emailToken + "\">here</a> to verify it. If you did not request this, you can ignore this email.<br>Thanks!</p>").then().catch(e => {
                console.error('Error sending password verification email', e);
            });
        } catch (e) {
            console.error('email verification caught exception', e);
        }
        // Return Success
        return {success: true};
    }

    @Patch('/email')
    @Summary('Update users email')
    @Returns(400, {type: model.Error, description: 'InvalidEmail: Email is not of a valid format\n'})
    @Returns(409, {
        type: model.Error,
        description: 'FloodCheck: Try again later\nEmailAlreadyInUse: Email is already in use by this or another account\n'
    })
    @Use(csrf, YesAuth)
    public async updateEmail(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('email', String) newEmailProvided: string
    ) {
        let newEmail = this.auth.verifyEmail(newEmailProvided);
        if (!newEmail) {
            throw new this.BadRequest('InvalidEmail');
        }

        let latestEmail = await this.settings.getUserEmail(userInfo.userId);
        if (latestEmail && !moment().isSameOrAfter(moment(latestEmail.date).add(1, "minute"))) {
            throw new this.Conflict('FloodCheck');
        }
        // Check if email already in use
        if (await this.settings.isEmailInUse(newEmail)) {
            throw new this.Conflict('EmailAlreadyInUse');
        }
        // Token Generator
        let emailToken = await new Promise((resolve, reject): void => {
            crypto.randomBytes(128, function (err, buffer) {
                if (err) {
                    reject();
                } else {
                    resolve(buffer.toString('hex'));
                }
            });
        });
        // Insert Email
        await this.settings.insertNewEmail(userInfo.userId, newEmail, emailToken as string);

        // Send Verify Request
        try {
            // We don't await this since it can delay requests by a factor of many seconds, so it's better to just send of the request, tell the user it worked, then hope the email was valid.
            this.settings.sendEmail(newEmail, "Email Verification", "Thank you for adding a new email to your account. Visit this link to verify it: https://blockshub.net/email/verify?code=" + emailToken, "<h5>Hello,</h5><p>Thank you for adding a new email to your account. Please click <a href=\"https://blockshub.net/email/verify?code=" + emailToken + "\">here</a> to verify it. If you did not request this, you can ignore this email.<br>Thanks!</p>").then().catch(e => {
                console.error('Error sending password verification email', e);
            });
        } catch (e) {

        }
        // Return Success
        return {success: true};
    }

    @Post('/email/verify')
    @Returns(400, {type: model.Error, description: 'InvalidCode: Code is expired or otherwise not valid\n'})
    @Use(csrf, YesAuth)
    public async verifyEmail(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams('id', String) code: string
    ) {
        let latestEmail = await this.settings.getUserEmail(userInfo.userId);
        if (!latestEmail) {
            throw new Error('User does not have a latestemail');
        }
        if (moment().isSameOrBefore(moment(latestEmail.date).add(1, "hours"))) {
            if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(latestEmail.verificationCode))) {
                await this.settings.markEmailAsVerified(userInfo.userId);
                return {success: true};
            } else {
                throw new this.BadRequest('InvalidCode');
            }
        } else {
            throw new this.BadRequest('InvalidCode');
        }
    }

    @Patch('/password')
    @Use(csrf, YesAuth)
    @Summary('Update user password')
    @Returns(400, {
        type: model.Error,
        description: 'InvalidPassword: New password is not valid\nInvalidOldPassword: Old password is not valid\n'
    })
    public async updatePassword(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Session() session: Express.Session,
        @Required()
        @BodyParams('oldPassword', String) oldPassword: string,
        @Required()
        @BodyParams('newPassword', String) newPassword: string
    ) {

        // Verify old password matches
        let userData = await this.user.getInfo(userInfo.userId, ['passwordChanged']);
        let userPassword = await this.user.getPassword(userInfo.userId);
        const valid = await this.auth.verifyPassword(oldPassword, userPassword);
        if (!valid) {
            throw new this.BadRequest('InvalidOldPassword');
        }
        // Verify password is ok
        if (!newPassword || newPassword.length < 6) {
            throw new this.BadRequest('InvalidPassword');
        }
        // Generate Hash of New Password
        let hash = await this.auth.hashPassword(newPassword);
        // Update
        await this.settings.updateUserPassword(userInfo.userId, hash, userInfo.passwordChanged + 1);
        // Update Cookie
        session.userdata.passwordChanged = userData.passwordChanged + 1;
        // Success
        return {};
    }

    @Patch('/blurb')
    @Summary('Update user blurb')
    @Use(csrf, YesAuth)
    @Returns(400, {type: model.Error, description: 'BlurbTooLarge: Blurb is too large\n'})
    public async updateBlurb(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('blurb', String) newBlurb: string
    ) {

        if (newBlurb.length > 512) {
            throw new this.BadRequest('BlurbTooLarge');
        }
        await this.settings.updateBlurb(userInfo.userId, newBlurb);
        return {};
    }

    @Patch('/forum/signature')
    @Summary('Update user forum signature')
    @Returns(400, {
        type: model.Error,
        description: 'SignatureTooLong: Forum Signature is too large (over 512 characters)\n'
    })
    @Use(csrf, YesAuth)
    public async updateForumSignature(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('signature', String) newSignature: string
    ) {

        if (newSignature.length > 512) {
            throw new this.BadRequest('SignatureTooLong');
        }
        await this.settings.updateSignature(userInfo.userId, newSignature);
        return {};
    }

    @Patch('/theme')
    @Summary('Update user theme')
    @Returns(400, {type: model.Error, description: 'InvalidTheme: Theme must be one of: 0,1\n'})
    @Use(csrf, YesAuth)
    public async updateTheme(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('theme', Number) numericTheme: number
    ) {
        if (!numericTheme) {
            numericTheme = 0;
        }
        if (numericTheme !== 1 && numericTheme !== 0) {
            throw new this.BadRequest('InvalidTheme');
        }
        await this.settings.updateTheme(userInfo.userId, numericTheme);
        return {};
    }

    @Patch('/trade')
    @Summary('Enable or disable trading')
    @Use(csrf, YesAuth)
    @Returns(400, {type: model.Error, description: 'InvalidOption: Option selected is invalid\n'})
    public async updateTradingStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('enabled', Number) numericBoolean: number
    ) {
        if (!numericBoolean) {
            numericBoolean = 0;
        }
        if (numericBoolean !== 1 && numericBoolean !== 0) {
            throw new this.BadRequest('InvalidOption');
        }
        await this.settings.updateTradingStatus(userInfo.userId, numericBoolean);
        return {};
    }
}