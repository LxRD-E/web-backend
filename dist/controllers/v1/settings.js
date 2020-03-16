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
const crypto = require("crypto");
const moment = require("moment");
const model = require("../../models/models");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const Auth_1 = require("../../middleware/Auth");
const swagger_1 = require("@tsed/swagger");
const auth_1 = require("../../dal/auth");
let SettingsController = class SettingsController extends controller_1.default {
    constructor() {
        super();
    }
    async accountSettings(userInfo) {
        const settingsObject = {
            blurb: "",
            tradingEnabled: 0,
            theme: 0,
            forumSignature: "e",
            email: {},
            '2faEnabled': 0,
        };
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
            };
        }
        else {
            let protectedEmail = userEmail.email;
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
            };
        }
        return settingsObject;
    }
    async updateEmail(userInfo, newEmail) {
        const validate = (email) => {
            const expression = /(?!.*\.{2})^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
            return expression.test(String(email).toLowerCase());
        };
        if (!validate(newEmail)) {
            throw new this.BadRequest('InvalidEmail');
        }
        let stuffBeforeAtSign = newEmail.slice(0, newEmail.indexOf('@'));
        let domain = newEmail.slice(newEmail.indexOf('@') + 1).toLowerCase();
        let emailDomainWithoutSuffix = domain.slice(0, domain.indexOf('.'));
        if (emailDomainWithoutSuffix === 'gmail' || emailDomainWithoutSuffix === 'googlemail') {
            stuffBeforeAtSign = stuffBeforeAtSign.replace(/\./g, '');
            if (stuffBeforeAtSign.indexOf('+') !== -1) {
                stuffBeforeAtSign = stuffBeforeAtSign.slice(0, stuffBeforeAtSign.indexOf('+'));
            }
            newEmail = stuffBeforeAtSign + '@gmail.com';
        }
        console.log(newEmail);
        newEmail = newEmail.toLowerCase();
        let latestEmail = await this.settings.getUserEmail(userInfo.userId);
        if (latestEmail && !moment().isSameOrAfter(moment(latestEmail.date).add(1, "minute"))) {
            throw new this.Conflict('FloodCheck');
        }
        if (await this.settings.isEmailInUse(newEmail)) {
            throw new this.Conflict('EmailAlreadyInUse');
        }
        let emailToken = await new Promise((resolve, reject) => {
            crypto.randomBytes(128, function (err, buffer) {
                if (err) {
                    reject();
                }
                else {
                    resolve(buffer.toString('hex'));
                }
            });
        });
        await this.settings.insertNewEmail(userInfo.userId, newEmail, emailToken);
        try {
            this.settings.sendEmail(newEmail, "Email Verification", "Thank you for adding a new email to your account. Visit this link to verify it: https://hindigamer.club/email/verify?code=" + emailToken, "<h5>Hello,</h5><p>Thank you for adding a new email to your account. Please click <a href=\"https://hindigamer.club/email/verify?code=" + emailToken + "\">here</a> to verify it. If you did not request this, you can ignore this email.<br>Thanks!</p>").then().catch(e => {
                console.error('Error sending password verification email', e);
            });
        }
        catch (e) {
        }
        return { success: true };
    }
    async verifyEmail(userInfo, code) {
        let latestEmail;
        try {
            latestEmail = await this.settings.getUserEmail(userInfo.userId);
            if (moment().isSameOrBefore(moment(latestEmail.date).add(3, "hours"))) {
                if (crypto.timingSafeEqual(Buffer.from(code), Buffer.from(latestEmail.verificationCode))) {
                    await this.settings.markEmailAsVerified(userInfo.userId);
                    return { success: true };
                }
                else {
                    throw new this.BadRequest('InvalidCode');
                }
            }
            else {
                throw new this.BadRequest('InvalidCode');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidCode');
        }
    }
    async updatePassword(userInfo, session, oldPassword, newPassword) {
        let userData = await this.user.getInfo(userInfo.userId, ['passwordChanged']);
        let userPassword = await this.user.getPassword(userInfo.userId);
        const valid = await this.auth.verifyPassword(oldPassword, userPassword);
        if (!valid) {
            throw new this.BadRequest('InvalidOldPassword');
        }
        if (!newPassword || newPassword.length < 6) {
            throw new this.BadRequest('InvalidPassword');
        }
        let hash = await this.auth.hashPassword(newPassword);
        await this.settings.updateUserPassword(userInfo.userId, hash, userInfo.passwordChanged + 1);
        session.userdata.passwordChanged = userData.passwordChanged + 1;
        return { success: true };
    }
    async updateBlurb(userInfo, newBlurb) {
        if (newBlurb.length > 512) {
            throw new this.BadRequest('BlurbTooLarge');
        }
        await this.settings.updateBlurb(userInfo.userId, newBlurb);
        return { success: true };
    }
    async updateForumSignature(userInfo, newSignature) {
        if (newSignature.length > 512) {
            throw new this.BadRequest('SignatureTooLong');
        }
        await this.settings.updateSignature(userInfo.userId, newSignature);
        return { success: true };
    }
    async updateTheme(userInfo, numericTheme) {
        if (!numericTheme) {
            numericTheme = 0;
        }
        if (numericTheme !== 1 && numericTheme !== 0) {
            throw new this.BadRequest('InvalidTheme');
        }
        await this.settings.updateTheme(userInfo.userId, numericTheme);
        return { success: true };
    }
    async updateTradingStatus(userInfo, numericBoolean) {
        if (!numericBoolean) {
            numericBoolean = 0;
        }
        if (numericBoolean !== 1 && numericBoolean !== 0) {
            throw new this.BadRequest('InvalidOption');
        }
        await this.settings.updateTradingStatus(userInfo.userId, numericBoolean);
        return { success: true };
    }
};
__decorate([
    common_1.Get('/'),
    swagger_1.Summary('Get user settings'),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.Returns(200, { type: model.settings.UserSettings }),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "accountSettings", null);
__decorate([
    common_1.Patch('/email'),
    swagger_1.Summary('Update users email'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidEmail: Email is not of a valid format\n' }),
    swagger_1.Returns(409, { type: model.Error, description: 'FloodCheck: Try again later\nEmailAlreadyInUse: Email is already in use by this or another account\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('email', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateEmail", null);
__decorate([
    common_1.Post('/email/verify'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCode: Code is expired or otherwise not valid\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams('id', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "verifyEmail", null);
__decorate([
    common_1.Patch('/password'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.Summary('Update user password'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidPassword: New password is not valid\nInvalidOldPassword: Old password is not valid\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Session()),
    __param(2, common_1.Required()),
    __param(2, common_1.BodyParams('oldPassword', String)),
    __param(3, common_1.Required()),
    __param(3, common_1.BodyParams('newPassword', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Object, String, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updatePassword", null);
__decorate([
    common_1.Patch('/blurb'),
    swagger_1.Summary('Update user blurb'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.Returns(400, { type: model.Error, description: 'BlurbTooLarge: Blurb is too large\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('blurb', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateBlurb", null);
__decorate([
    common_1.Patch('/forum/signature'),
    swagger_1.Summary('Update user forum signature'),
    swagger_1.Returns(400, { type: model.Error, description: 'SignatureTooLong: Forum Signature is too large (over 512 characters)\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('signature', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateForumSignature", null);
__decorate([
    common_1.Patch('/theme'),
    swagger_1.Summary('Update user theme'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidTheme: Theme must be one of: 0,1\n' }),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('theme', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateTheme", null);
__decorate([
    common_1.Patch('/trade'),
    swagger_1.Summary('Enable or disable trading'),
    common_1.UseBeforeEach(auth_1.csrf),
    common_1.UseBefore(Auth_1.YesAuth),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidOption: Option selected is invalid\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Required()),
    __param(1, common_1.BodyParams('enabled', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateTradingStatus", null);
SettingsController = __decorate([
    common_1.Controller('/settings'),
    __metadata("design:paramtypes", [])
], SettingsController);
exports.default = SettingsController;

