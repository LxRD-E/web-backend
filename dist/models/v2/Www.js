"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../helpers/config");
const crypto = require("crypto");
let versionStr = crypto.randomBytes(16).toString('hex');
class WWWTemplate {
    constructor(props) {
        this.year = new Date().getFullYear();
        this.captchakey = config_1.default.recaptcha.v2.public;
        this.page = {};
        this.v = versionStr;
        for (const [key, value] of Object.entries(props)) {
            this[key] = value;
        }
    }
}
exports.WWWTemplate = WWWTemplate;

