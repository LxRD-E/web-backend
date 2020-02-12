/**
 * Encrypt certain User Info
 */

const config = JSON.parse(require("fs").readFileSync("./config.json"));

const crypto = require("crypto");
const emailEncryptionKey = config.encryptionKeys.email;
const passwordEncryptionKey = config.encryptionKeys.password;
const ipEncryptionKey = config.encryptionKeys.ip;
// Encryption Function
function encrypt(text, key) {
    let iv = '0'.repeat(32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([
        encrypted,
        cipher.final()
    ]);
    return encrypted.toString('hex');
}

function decrypt(encryptedString, key) {
    let iv = '0'.repeat(32);
    // let iv = Buffer.from(key.slice(0, 16));
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedString, 'hex'));
    decrypted = Buffer.concat([
        decrypted,
        decipher.final(),
    ]);
    return decrypted.toString();
}

exports.up = async (knex, Promise) => {
    /**
     * EMAILS
     */
    // Up Key Sizes
    await knex.schema.alterTable("user_emails", (t) => {
        t.string("email", 512).nullable().alter();
    });
    // Encrypt Existing User Emails
    const existingEmails = await knex("user_emails").select("id","email");
    for (let email of existingEmails) {
        await knex("user_emails").update("email", encrypt(email["email"], emailEncryptionKey)).where({"id":email["id"]});
    }
    /**
     * PASSWORDS
     */
    // Up Key Sizes
    await knex.schema.alterTable("users", (t) => {
        t.string("password", 512).nullable().alter();
    });
    // Encrypt Existing User Password Hashes
    const existingPassword = await knex("users").select("id","password");
    for (let user of existingPassword) {
        await knex("users").update("password", encrypt(user["password"], passwordEncryptionKey)).where({"id":user["id"]});
    }
    /**
     * IP addresses
     */
    // Up Key Sizes
    await knex.schema.alterTable("user_ip", (t) => {
        t.string("ip_address", 512).nullable().alter();
    });
    // Encrypt Existing User IP addresses
    const existingIps = await knex("user_ip").select("id","ip_address");
    for (let ip of existingIps) {
        await knex("user_ip").update("ip_address", encrypt(ip["ip_address"], ipEncryptionKey)).where({"id":ip["id"]});
    }
};

exports.down = async (knex, Promise) => {
    /**
     * EMAILS
     */
    // Decrypt User Emails
    const existingEmails = await knex("user_emails").select("id","email");
    for (let email of existingEmails) {
        await knex("user_emails").update("email", decrypt(email["email"], emailEncryptionKey)).where({"id":email["id"]});
    }
    // Down Key Sizes
    await knex.schema.alterTable("user_emails", (t) => {
        t.string("email", 255).nullable().alter();
    });
    /**
     * PASSWORDS
     */
    // Decrypt User Passwords
    const existingPasswords = await knex("users").select("id","password");
    for (let user of existingPasswords) {
        await knex("users").update("password", decrypt(user["password"], passwordEncryptionKey)).where({"id":user["id"]});
    }
    // Down Key Sizes
    await knex.schema.alterTable("users", (t) => {
        t.string("password", 255).nullable().alter();
    });

    /**
     * IP addresses
     */
    // Encrypt Existing User IPs
    const existingIps = await knex("user_ip").select("id","ip_address");
    for (let ip of existingIps) {
        await knex("user_ip").update("ip_address", decrypt(ip["ip_address"], ipEncryptionKey)).where({"id":ip["id"]});
    }
    // Down Key Sizes
    await knex.schema.alterTable("user_ip", (t) => {
        t.string("ip_address", 255).nullable().alter();
    });
};