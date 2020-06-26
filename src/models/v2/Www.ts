import { Required, Minimum, Maximum, MaxLength, MinLength, Req } from "@tsed/common";
import config from '../../helpers/config';
import crypto = require('crypto');
import fs = require('fs');
import path = require('path');
import os = require('os');
let versionStr = crypto.randomBytes(16).toString('hex');
// game geners
import * as model from '../../models/models';
// banner text stuff
import StaffDAL  from '../../dal/staff';
let staff = new StaffDAL();
let currentBannerText: string = '';
let bannerTextLocked = false;
setInterval(() => {
    if (bannerTextLocked) {
        return;
    }
    bannerTextLocked= true;
    staff.getBannerText()
    .then(txt => {
        if (txt) {
            currentBannerText = txt;
        }else{
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

import * as UserModel from '../../models/v1/user';
export class WWWTemplate {
    constructor(props: WWWTemplate) {
        for (const [key, value] of Object.entries(props)) {
            // @ts-ignore
            this[key] = value;
        }
    }
    /**
     * The Current Year. Defaults to ```new Date().getFullYear();```
     */
    year?: number = new Date().getFullYear();

    /**
     * Page Title
     */
    title: string;
    /**
     * Recaptcha V2 Key
     */
    captchakey? = config.recaptcha.v2.public;
    /**
     * Page Info to Send to View
     */
    page?: any = {};

    /**
     * JS Version String
     */
    v?: string = versionStr;

    /**
     * UserInfo Object
     */
    userInfo?: UserModel.SessionUserInfo;

    /**
     * Banner Thing
     */
    bannerText?: string = currentBannerText;

    /**
     * Game Genres (for footer)
     */
    gameGenres?: any = model.game.GameGenres;

    /**
     * Current ENV
     */
    env?: string = process.env.NODE_ENV;

    /**
     * is the server a staging server?
     */
    isStaging?: boolean = process.env.IS_STAGING === '1';

    /**
     * Os host name
     */
    hostName?: string = HostName;
}
