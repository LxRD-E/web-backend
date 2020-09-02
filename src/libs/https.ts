interface IResponse<T> {
    status: number;
    headers: {
        [key: string]: string | undefined;
    }
    data: T;
}
interface IExtraRequestOptions {
    responseType: 'string' | 'buffer';
}

import * as STDHttps from 'https';

export class HttpError {
    public isHttpsError: boolean = true;
    constructor(obj: any) {
        for (const key of Object.getOwnPropertyNames(obj)) {
            let val = obj[key];
            // @ts-ignore
            this[key] = val;
        }
    }
}

/**
 * HTTP Get Request
 * @param url 
 * @param options 
 */
export const get = <ResponseType = any>(url: string, options: STDHttps.RequestOptions & IExtraRequestOptions): Promise<IResponse<ResponseType>> => {
    return new Promise((res, rej) => {

        const trueURL = new URL(url);
        for (const key of Object.getOwnPropertyNames(trueURL)) {
            // @ts-ignore
            let val = trueURL[key];
            // @ts-ignore
            options[key] = val;
        }
        let buf: Uint8Array[] = []
        let request = STDHttps.request(options, (httpsRes) => {
            // ...
            httpsRes.on('data', (d) => {
                buf.push(d);
            });
            httpsRes.on('end', () => {
                try {
                    let result: any = Buffer.concat(buf);
                    if (options.responseType.toLowerCase() === 'string') {
                        result = result.toString();
                    }
                    httpsRes.statusCode = httpsRes.statusCode as number;
                    const fullResponse = {
                        status: httpsRes.statusCode,
                        headers: httpsRes.headers as any,
                        data: result,
                    }
                    if (!httpsRes.statusCode) {
                        return rej(new HttpError(fullResponse));
                    }
                    res(fullResponse)
                } catch (e) {
                    rej(new HttpError(e));
                    request.end();
                }
            });
            httpsRes.on('error', (e) => {
                rej(new HttpError(e));
                request.end();
            })
        });
    });
}