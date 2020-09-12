"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const Crypto = require("crypto");
let configJson = {
    encryptionKeys: {},
    coinpayments: {},
    trackerAuthorization: "",
    baseUrl: {
        play: "https://play.blockshub.net",
        www: "https://www.blockshub.net",
        api: "https://api.blockshub.net",
        tracker: "https://perftrack.bhmanager.club",
    }
};
const decrypt = (encryptedString, key, iv) => {
    if (typeof iv !== 'string' && typeof iv !== 'object') {
        console.warn('[warning] no iv specified for auth.decrypt(), using default of NULL');
        iv = Buffer.from('0'.repeat(32), 'hex');
    }
    const decipher = Crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(Buffer.from(encryptedString, 'hex'));
    decrypted = Buffer.concat([
        decrypted,
        decipher.final(),
    ]);
    return decrypted.toString();
};
console.log('process.env.node_env check');
if (process.env.NODE_ENV !== 'test') {
    const configString = JSON.parse(fs_1.readFileSync(path_1.join(__dirname, '../../config.json')).toString());
    if (configString.redis.host === '127.0.0.1') {
        configString.redis.host = 'localhost';
    }
    configJson = Object.freeze(configString);
}
else {
    console.warn('[warning] empty config ');
}
exports.default = configJson;

