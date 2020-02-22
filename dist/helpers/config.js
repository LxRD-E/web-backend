"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const auth_1 = require("../dal/auth");
const secretEncryptionKey = process.env['SECRET_ENCRYPTION_KEY'];
const secretEncryptionIV = process.env['SECRET_ENCRYPTION_IV'];
if (!secretEncryptionKey || !secretEncryptionIV) {
    console.error('No decryption key or iv was specified in env: SECRET_ENCRYPTION_KEY, SECRET_ENCRYPTION_IV. Exiting with code 1.');
    process.exit(1);
}
const configString = JSON.parse(auth_1.decrypt(fs_1.readFileSync(path_1.join(__dirname, '../../config.json')).toString(), secretEncryptionKey, secretEncryptionIV));
const configJson = JSON.parse(JSON.stringify(configString));
exports.default = configJson;

