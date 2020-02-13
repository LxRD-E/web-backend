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
import { Locals, Required, BodyParams, Get, UseBefore, Patch, OverrideMiddleware, Post, UseBeforeEach, Session, Controller } from '@tsed/common';
import { YesAuth } from '../../middleware/Auth';
import { Summary, Returns } from '@tsed/swagger';
import { csrf } from '../../dal/auth';
/**
 * Settings Controller
 */
@Controller('/settings')
export default class SettingsController extends controller {
    // Constructor
    constructor() {
        super();
    }
    /**
     * Get the authenicated user's account settings
     */
    @Get('/')
    @Summary('Get user settings')
    @UseBefore(YesAuth)
    @Returns(200, { type: model.settings.UserSettings })
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
        let userInfoModel = await this.user.getInfo(userInfo.userId, ['blurb', 'tradingEnabled', 'theme', 'forumSignature', '2faEnabled']);
        settingsObject.blurb = userInfoModel.blurb;
        settingsObject.tradingEnabled = userInfoModel.tradingEnabled;
        settingsObject.theme = userInfoModel.theme;
        settingsObject.forumSignature = userInfoModel.forumSignature;
        settingsObject.forumSignature = userInfoModel.forumSignature;
        settingsObject["2faEnabled"] = userInfoModel['2faEnabled'];
        const userEmailModel = await this.user.getUserEmail(userInfo.userId);
        const userEmail = await this.settings.getUserEmail(userInfo.userId);
        if (!userEmailModel) {
            settingsObject["email"] = {
                status: model.user.emailVerificationType.false,
                email: null,
            }
        } else {
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

    /**
     * Update the Authenticated User's Email
     * @param newEmail 
     */
    @Patch('/email')
    @Summary('Update users email')
    @Returns(400, { type: model.Error, description: 'InvalidEmail: Email is not of a valid format\n' })
    @Returns(409, { type: model.Error, description: 'FloodCheck: Try again later\n' })
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateEmail(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('email', String) newEmail: string
    ) {
        // Email Validation Function ;-;
        const validate = (email: string): boolean => {
            const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;

            return expression.test(String(email).toLowerCase())
        }
        // If invalid email specified
        if (!validate(newEmail)) {
            throw new this.BadRequest('InvalidEmail');
        }
        let latestEmail = await this.settings.getUserEmail(userInfo.userId);
        if (!moment().isSameOrAfter(moment(latestEmail.date).add(1, "minute"))) {
            throw new this.Conflict('FloodCheck');
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
            this.settings.sendEmail(newEmail, "Email Verification", "Thank you for adding a new email to your account. Visit this link to verify it: https://hindigamer.club/email/verify?code=" + emailToken, "<h5>Hello,</h5><p>Thank you for adding a new email to your account. Please click <a href=\"https://hindigamer.club/email/verify?code=" + emailToken + "\">here</a> to verify it.<br>Thanks!</p>").then().catch();
        } catch (e) {

        }
        // Return Success
        return { success: true };
    }

    /**
     * Verify user's email
     */
    @Post('/email/verify')
    @Returns(400, { type: model.Error, description: 'InvalidCode: Code is expired or otherwise not valid\n' })
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async verifyEmail(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams('id', String) code: string
    ) {
        let latestEmail;
        try {
            latestEmail = await this.settings.getUserEmail(userInfo.userId);
            if (moment().isSameOrBefore(moment(latestEmail.date).add(3, "hours"))) {
                if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(latestEmail.verificationCode))) {
                    await this.settings.markEmailAsVerified(userInfo.userId);
                    return { success: true };
                } else {
                    throw new this.BadRequest('InvalidCode');
                }
            } else {
                throw new this.BadRequest('InvalidCode');
            }
        } catch (e) {
            throw new this.BadRequest('InvalidCode');
        }
    }

    /**
     * Update Authenticated User's Password
     */
    @Patch('/password')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Summary('Update user password')
    @Returns(400, { type: model.Error, description: 'InvalidPassword: New password is not valid\nInvalidOldPassword: Old password is not valid\n' })
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
        let userPassword = await this.user.getPassword(userData.userId);
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
        session.userdata.passwordChanged = userInfo.passwordChanged + 1;
        // Success
        return { success: true };
    }

    /**
     * Update Authenticated User's Blurb
     */
    @Patch('/blurb')
    @Summary('Update user blurb')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
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
        return { success: true };
    }

    /**
     * Update Authenticated User's Forum Signature
     */
    @Patch('/forum/signature')
    @Summary('Update user forum signature')
    @Returns(400, {type: model.Error, description: 'SignatureTooLong: Forum Signature is too large (over 512 characters)\n'})
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateForumSignature(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('signature', String) newSignature: string
    ) {

        if (newSignature.length > 512) {
            throw new this.BadRequest('SignatureTooLong');
        }
        await this.settings.updateSignature(userInfo.userId, newSignature);
        return { success: true };
    }

    /**
     * Update Authenticated User's Forum Signature
     */
    @Patch('/theme')
    @Summary('Update user theme')
    @Returns(400, {type: model.Error, description: 'InvalidTheme: Theme must be one of: 0,1\n'})
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    public async updateTheme(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('theme', Number) numericTheme: number
    ): Promise<{ success: true }> {
        if (!numericTheme) {
            numericTheme = 0;
        }
        if (numericTheme !== 1 && numericTheme !== 0) {
            throw new this.BadRequest('InvalidTheme');
        }
        await this.settings.updateTheme(userInfo.userId, numericTheme);
        return { success: true };
    }

    /**
     * Enable/Disable Trading for Authenticated User
     * @param enabled 
     */
    @Patch('/trade')
    @Summary('Enable or disable trading')
    @UseBeforeEach(csrf)
    @UseBefore(YesAuth)
    @Returns(400, {type: model.Error, description: 'InvalidOption: Option selected is invalid\n'})
    public async updateTradingStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @BodyParams('enabled', Number) numericBoolean: number
    ): Promise<{ success: true }> {
        if (!numericBoolean) {
            numericBoolean = 0;
        }
        if (numericBoolean !== 1 && numericBoolean !== 0) {
            throw new this.BadRequest('InvalidOption');
        }
        await this.settings.updateTradingStatus(userInfo.userId, numericBoolean);
        return { success: true };
    }
}