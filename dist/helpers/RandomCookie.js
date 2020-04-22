"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require('fs');
const path = require('path');
let currentCookieIndex = 0;
let cookiesArray = fs.readFileSync(path.join(__dirname, '../../cookies.txt')).toString().split('\n');
let cookies = [];
for (let cook of cookiesArray) {
    cook = cook.replace('\r', '');
    cookies.push(cook);
}
if (cookies.length === 0) {
    console.error('please create a cookies.txt file in the root of the project directory, with a new roblox cookie on each line (without the ".ROBLOSECURITY" part)');
    process.exit();
}
console.log('[cookie.js] loaded ' + cookies.length + ' cookies.');
exports.default = {
    cookiesReady: false,
    getCookie: () => {
        currentCookieIndex++;
        let cookieToGrab = cookies[currentCookieIndex];
        if (cookieToGrab === undefined) {
            currentCookieIndex = 0;
            return cookies[0];
        }
        else {
            return cookieToGrab;
        }
    },
    badCookie: (badCookie) => {
        let newCookiesArr = [];
        for (const cookie of cookies) {
            if (badCookie !== cookie) {
                newCookiesArr.push(cookie);
            }
        }
        cookies = newCookiesArr;
    }
};

