"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("../../helpers/config");
const crypto = require("crypto");
const os = require("os");
let versionStr = crypto.randomBytes(16).toString('hex');
const model = require("../../models/models");
const staff_1 = require("../../dal/staff");
let staff = new staff_1.default();
let currentBannerText = '';
let bannerTextLocked = false;
setInterval(() => {
    if (bannerTextLocked) {
        return;
    }
    bannerTextLocked = true;
    staff.getBannerText()
        .then(txt => {
        if (txt) {
            currentBannerText = txt;
        }
        else {
            currentBannerText = '';
        }
    })
        .catch(e => {
        console.error(e);
    })
        .finally(() => {
        bannerTextLocked = false;
    });
}, 5000);
let HostName = os.hostname();
class WWWTemplate {
    constructor(props) {
        this.year = new Date().getFullYear();
        this.captchakey = config_1.default.recaptcha.v2.public;
        this.page = {};
        this.v = versionStr;
        this.bannerText = currentBannerText;
        this.gameGenres = model.game.GameGenres;
        this.env = process.env.NODE_ENV;
        this.isStaging = process.env.IS_STAGING === '1';
        this.hostName = HostName;
        for (const [key, value] of Object.entries(props)) {
            this[key] = value;
        }
    }
}
exports.WWWTemplate = WWWTemplate;

