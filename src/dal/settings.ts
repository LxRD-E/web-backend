/**
 * Imports
 */
// import * as Model from './interface';
import * as model from '../models/models';

import Config from '../helpers/config';
import { encrypt, decrypt, encryptPasswordHash, decryptPasswordHash } from './auth';
/**
 * Encryption Keys
 */
const emailEncryptionKey = Config.encryptionKeys.email;
const passwordEncryptionKey = Config.encryptionKeys.password;

const mailjet = require('node-mailjet').connect(Config.mailJet.public, Config.mailJet.private)

import _init from './_init';
class SettingsDAL extends _init {
    /**
     * Send an Emai;
     * @param recipient Email Address
     * @param subject Email Subject
     * @param bodyText Text/Normal Body
     * @param bodyHTML HTML Body. Defaults to bodyText
     */
    public async sendEmail(recipient: string, subject: string, bodyText: string, bodyHTML?: string): Promise<void> {
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
                            // "Name": "passenger 1"
                        }
                    ],
                    "Subject": subject,
                    "TextPart": bodyText,
                    "HTMLPart": bodyHTML
                }
            ]
        });
        console.log(request);
        /*
        if (!bodyHTML) {
            bodyHTML = bodyText;
        }
        const conf = {
            user: Config.email.user,
            pass: Config.email.pass,
            to: recipient,
            subject: subject,
            text: bodyText,
            html: bodyHTML,
        };
        const send = require('gmail-send')(conf);
        await send();
        */
    }

    public async isEmailInUse(email: string): Promise<boolean> {
        let encryptedEmail = await encrypt(email, emailEncryptionKey);
        let results = await this.knex('user_emails').select('id').where({ 'email': encryptedEmail }).limit(1).orderBy('id', 'desc');
        if (results[0]) {
            return true;
        }
        return false;
    }

    /**
     * Get a user by their email address.
     * @param email 
     * @throws InvalidEmailAddress
     */
    public async getUserByEmail(email: string): Promise<{
        userId: number;
        username: string;
    }> {
        let encryptedEmail = await encrypt(email, emailEncryptionKey);
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

    /**
     * Insert a New Email for a User
     * @param userId 
     * @param newEmail 
     * @param emaiLVerificationCode 
     */
    public async insertNewEmail(userId: number, newEmail: string, emaiLVerificationCode: string): Promise<void> {
        const encryptedEmail = await encrypt(newEmail, emailEncryptionKey);
        await this.knex("user_emails").insert({
            userid: userId,
            'verification_code': emaiLVerificationCode,
            status: model.user.emailVerificationType.false,
            date: this.moment().format('YYYY-MM-DD HH:mm:ss'),
            email: encryptedEmail,
        });
    }

    /**
     * Delete an email by the {emailId}
     * @param emailId 
     */
    public async deleteEmailById(emailId: number): Promise<void> {
        await this.knex('user_emails').delete().where({
            'id': emailId,
        }).limit(1);
    }

    /**
     * Get a user's email info
     * @param userId 
     */
    public async getUserEmail(userId: number): Promise<model.settings.EmailModel | undefined> {
        const info = await this.knex("user_emails").select(
            'user_emails.id as emailId',
            "userid as userId",
            "verification_code as verificationCode",
            "status",
            "date",
            'email',
        ).where({ "userid": userId }).orderBy("id", "desc").limit(1);
        if (info[0] && info[0]["email"]) {
            info[0]["email"] = await decrypt(info[0]["email"], emailEncryptionKey);
        }
        return info[0];
    }

    /**
     * Get All Emails associated with a specific userId
     * @param userId 
     */
    public async getUserEmails(userId: number): Promise<model.settings.EmailModel[]> {
        const info = await this.knex("user_emails").select(
            'user_emails.id as emailId',
            "userid as userId",
            "verification_code as verificationCode",
            "status",
            "date",
            'email',
        ).where({ "userid": userId }).orderBy("id", "desc");
        for (const email of info) {
            if (email['email']) {
                email['email'] = await decrypt(email['email'], emailEncryptionKey);
            }
        }
        return info;
    }

    /**
     * Mark a user's email as verified
     */
    public async markEmailAsVerified(userId: number): Promise<void> {
        await this.knex("user_emails").where({ "userid": userId }).orderBy("id", "desc").limit(1).update({ "status": model.user.emailVerificationType.true });
    }

    /**
     * Update a user's password
     * @param userId User's ID
     * @param newHash New Password Hash
     * @param newPasswordCount passwordChanged in session incremented by one 
     */
    public async updateUserPassword(userId: number, newHash: string, newPasswordCount: number): Promise<void> {
        const encryptedHash = await encryptPasswordHash(newHash);
        await this.knex("users").update({ "password_changed": newPasswordCount }).update("password", encryptedHash).where({ "id": userId }).limit(1);
    }

    /**
     * Update a User's Blurb
     */
    public async updateBlurb(userId: number, blurb: string): Promise<void> {
        await this.knex("users").update({ "user_blurb": blurb }).where({ "id": userId });
    }

    /**
     * Update a User's Signature
     */
    public async updateSignature(userId: number, siggy: string): Promise<void> {
        await this.knex("users").update({ "forum_signature": siggy }).where({ "id": userId });
    }

    /**
     * Update a User's Signature
     */
    public async updateTheme(userId: number, newTheme: model.user.theme): Promise<void> {
        await this.knex("users").update({ "user_theme": newTheme }).where({ "id": userId });
    }

    /**
     * Update a User's Trading Status
     */
    public async updateTradingStatus(userId: number, isEnabled: model.user.tradingEnabled): Promise<void> {
        await this.knex("users").update({ "user_tradingenabled": isEnabled }).where({ "id": userId });
    }

    /**
     * Enable 2fa and set secret
     */
    public async enable2fa(userId: number, secret: string): Promise<void> {
        await this.knex('users').update({ '2fa_enabled': true, '2fa_secret': secret }).where({ 'id': userId }).limit(1);
    }

    /**
     * Disable 2fa
     */
    public async disable2fa(userId: number): Promise<void> {
        await this.knex('users').update({ '2fa_enabled': false, '2fa_secret': null }).where({ 'id': userId }).limit(1);
    }

    /**
     * Check if 2fa enabled. If enabled, secret is returned, otherwise it isnt
     */
    public async is2faEnabled(userId: number): Promise<{ enabled: false } | { enabled: true; secret: string }> {
        let data = await this.knex('users').select('2fa_enabled', '2fa_secret').where({ 'id': userId }).limit(1);
        if (data[0]['2fa_enabled'] === 1) {
            return { enabled: true, secret: data[0]['2fa_secret'] };
        } else {
            return { enabled: false };
        }
    }
}

export default SettingsDAL;
