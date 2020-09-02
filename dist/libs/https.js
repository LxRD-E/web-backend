"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const STDHttps = require("https");
class HttpError {
    constructor(obj) {
        this.isHttpsError = true;
        for (const key of Object.getOwnPropertyNames(obj)) {
            let val = obj[key];
            this[key] = val;
        }
    }
}
exports.HttpError = HttpError;
exports.get = (url, options) => {
    return new Promise((res, rej) => {
        const trueURL = new URL(url);
        for (const key of Object.getOwnPropertyNames(trueURL)) {
            let val = trueURL[key];
            options[key] = val;
        }
        let buf = [];
        let request = STDHttps.request(options, (httpsRes) => {
            httpsRes.on('data', (d) => {
                buf.push(d);
            });
            httpsRes.on('end', () => {
                try {
                    let result = Buffer.concat(buf);
                    if (options.responseType.toLowerCase() === 'string') {
                        result = result.toString();
                    }
                    httpsRes.statusCode = httpsRes.statusCode;
                    const fullResponse = {
                        status: httpsRes.statusCode,
                        headers: httpsRes.headers,
                        data: result,
                    };
                    if (!httpsRes.statusCode) {
                        return rej(new HttpError(fullResponse));
                    }
                    res(fullResponse);
                }
                catch (e) {
                    rej(new HttpError(e));
                    request.end();
                }
            });
            httpsRes.on('error', (e) => {
                rej(new HttpError(e));
                request.end();
            });
        });
    });
};

