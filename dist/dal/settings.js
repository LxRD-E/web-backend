"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const model = require("../models/models");
const config_1 = require("../helpers/config");
const auth_1 = require("./auth");
const emailEncryptionKey = config_1.default.encryptionKeys.email;
const passwordEncryptionKey = config_1.default.encryptionKeys.password;
const mailjet = require('node-mailjet').connect(config_1.default.mailJet.public, config_1.default.mailJet.private);
const _init_1 = require("./_init");
class SettingsDAL extends _init_1.default {
    async sendEmail(recipient, subject, bodyText, bodyHTML) {
        if (!bodyHTML) {
            bodyHTML = bodyText;
        }
        const request = await mailjet.post("send", { 'version': 'v3.1' }).request({
            "Messages": [
                {
                    "From": {
                        "Email": "support@blockshub.net",
                        "Name": "BlocksHub"
                    },
                    "To": [
                        {
                            "Email": recipient,
                        }
                    ],
                    "Subject": subject,
                    "TextPart": bodyText,
                    "HTMLPart": bodyHTML
                }
            ]
        });
        console.log(request);
    }
    async isEmailInUse(email) {
        let encryptedEmail = await auth_1.encrypt(email, emailEncryptionKey);
        let results = await this.knex('user_emails').select('id').where({ 'email': encryptedEmail }).limit(1).orderBy('id', 'desc');
        if (results[0]) {
            return true;
        }
        return false;
    }
    async getUserByEmail(email) {
        let encryptedEmail = await auth_1.encrypt(email, emailEncryptionKey);
        let results = await this.knex('user_emails')
            .select('id', 'userid')
            .where({ 'email': encryptedEmail, 'status': model.user.emailVerificationType.true })
            .limit(1)
            .orderBy('id', 'desc');
        if (results[0]) {
            let infoForUser = await this.knex('users').select('id as userId', 'username').where({ 'id': results[0]['userid'] });
            if (!infoForUser || !infoForUser[0]) {
                throw new Error('InvalidEmailAddress');
            }
            return infoForUser[0];
        }
        throw new Error('InvalidEmailAddress');
    }
    async insertNewEmail(userId, newEmail, emaiLVerificationCode) {
        const encryptedEmail = await auth_1.encrypt(newEmail, emailEncryptionKey);
        await this.knex("user_emails").insert({
            userid: userId,
            'verification_code': emaiLVerificationCode,
            status: model.user.emailVerificationType.false,
            date: this.moment().format('YYYY-MM-DD HH:mm:ss'),
            email: encryptedEmail,
        });
    }
    async deleteEmailById(emailId) {
        await this.knex('user_emails').delete().where({
            'id': emailId,
        }).limit(1);
    }
    async getUserEmail(userId) {
        const info = await this.knex("user_emails").select('user_emails.id as emailId', "userid as userId", "verification_code as verificationCode", "status", "date", 'email').where({ "userid": userId }).orderBy("id", "desc").limit(1);
        if (info[0] && info[0]["email"]) {
            info[0]["email"] = await auth_1.decrypt(info[0]["email"], emailEncryptionKey);
        }
        return info[0];
    }
    async getUserEmails(userId) {
        const info = await this.knex("user_emails").select('user_emails.id as emailId', "userid as userId", "verification_code as verificationCode", "status", "date", 'email').where({ "userid": userId }).orderBy("id", "desc");
        for (const email of info) {
            if (email['email']) {
                email['email'] = await auth_1.decrypt(email['email'], emailEncryptionKey);
            }
        }
        return info;
    }
    async markEmailAsVerified(userId) {
        await this.knex("user_emails").where({ "userid": userId }).orderBy("id", "desc").limit(1).update({ "status": model.user.emailVerificationType.true });
    }
    async updateUserPassword(userId, newHash, newPasswordCount) {
        const encryptedHash = await auth_1.encryptPasswordHash(newHash);
        await this.knex("users").update({ "password_changed": newPasswordCount }).update("password", encryptedHash).where({ "id": userId }).limit(1);
    }
    async updateBlurb(userId, blurb) {
        await this.knex("users").update({ "user_blurb": blurb }).where({ "id": userId });
    }
    async updateSignature(userId, siggy) {
        await this.knex("users").update({ "forum_signature": siggy }).where({ "id": userId });
    }
    async updateTheme(userId, newTheme) {
        await this.knex("users").update({ "user_theme": newTheme }).where({ "id": userId });
    }
    async updateTradingStatus(userId, isEnabled) {
        await this.knex("users").update({ "user_tradingenabled": isEnabled }).where({ "id": userId });
    }
    async enable2fa(userId, secret) {
        await this.knex('users').update({ '2fa_enabled': true, '2fa_secret': secret }).where({ 'id': userId }).limit(1);
    }
    async disable2fa(userId) {
        await this.knex('users').update({ '2fa_enabled': false, '2fa_secret': null }).where({ 'id': userId }).limit(1);
    }
    async is2faEnabled(userId) {
        let data = await this.knex('users').select('2fa_enabled', '2fa_secret').where({ 'id': userId }).limit(1);
        if (data[0]['2fa_enabled'] === 1) {
            return { enabled: true, secret: data[0]['2fa_secret'] };
        }
        else {
            return { enabled: false };
        }
    }
}
exports.default = SettingsDAL;

