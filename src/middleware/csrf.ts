import { EndpointInfo, IMiddleware, Middleware, Req, Res } from "@tsed/common";
import { Forbidden } from 'ts-httpexceptions';
import { NotAcceptable } from "ts-httpexceptions";
import config from '../helpers/config';
import jwt = require('jsonwebtoken');
const decodeJwt = (str: string) => {
    return new Promise((resolve, reject) => {
        jwt.verify(str, config.jwt.csrf, (err: any, cursor: any) => {
            if (err) {
                return reject(err);
            }
            resolve(cursor);
        });
    });
}
const createJwt = (object: any): Promise<string> => {
    return new Promise((resolve, reject) => {
        jwt.sign(object, config.jwt.csrf, {
            algorithm: 'HS512',
        }, (err, encoded) => {
            if (err) {
                return reject (err);
            }
            resolve(encoded);
        });
    });
}

const createCsrfSession = async () => {
    const tokenString = await createJwt({
        'csrf': require('crypto').randomBytes(32).toString('base64'),
    });
    return tokenString;
}

const csrfFailed = async (req: any, res: any) => {
    let cookie = req.cookies['rblxcsrf'];
    // make sure it is valid
    let valid = false;
    let cookieObject: any;
    try {
        cookieObject = await decodeJwt(cookie);
        valid = true;
        if (cookieObject.iat + 300 <= Math.floor(Date.now()/1000)) {
            console.log('expired');
            valid = false;
        }
    }catch(e) {
        console.log('invalid cookie');
        valid = false;
    }
    let csrf = "";
    if (!cookie||!valid) {
        const session = await createCsrfSession();
        res.cookie('rblxcsrf', session, {
            httpOnly: true,
            samesite: 'lax',
            expires: new Date(Date.now() + 86400*30*12 * 1000),
        });
        let jsonObj: any;
        try {
            jsonObj = await decodeJwt(session);
        }catch(e){
            console.log(e);
        }
        csrf = jsonObj.csrf;
    }else{
        csrf = cookieObject.csrf;
    }
    res.set({
        'x-csrf-token': csrf,
        'Access-Control-Expose-Headers': 'x-csrf-token'
    });
    throw new Forbidden('CsrfValidationFailed');
}
/*
export default async (req, res, next) => {
    console.log('begin csrf check');
    const csrf = req.get("x-csrf-token");
    if (!csrf) {
        console.log('not csrf');
        return csrfFailed(req, res);
    }
    let sess;
    try {
        sess = await decodeJwt(req.cookies['rblxcsrf']);
    }catch(e) {
        console.log(e);
        return csrfFailed(req, res);
    }
    if (sess.iat + 300 <= Math.floor(Date.now()/1000)) {
        console.log('expired');
        return csrfFailed(req, res);
    }
    console.log(sess.csrf);
    console.log(csrf);
    if (sess.csrf !== csrf) {
        return csrfFailed(req, res);
    }
    console.log('csrf check pass');
    return next();
} 
*/
@Middleware()
export default class CSRFValidate implements IMiddleware {
    async use(@Req() req: Req, @Res() res: Res, @EndpointInfo() endpoint: EndpointInfo) {
        console.log('begin csrf check');
        const csrf = req.get("x-csrf-token");
        if (!csrf) {
            console.log('not csrf');
            await csrfFailed(req, res);
        }
        let sess: any;
        try {
            sess = await decodeJwt(req.cookies['rblxcsrf']);
        }catch(e) {
            console.log(e);
            await csrfFailed(req, res);
        }
        if (sess.iat + 300 <= Math.floor(Date.now()/1000)) {
            console.log('expired');
            csrfFailed(req, res);
        }
        console.log(sess.csrf);
        console.log(csrf);
        if (sess.csrf !== csrf) {
            await csrfFailed(req, res);
        }
        console.log('csrf check pass');
    }
}