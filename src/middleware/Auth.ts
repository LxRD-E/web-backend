import { Unauthorized, Conflict } from 'ts-httpexceptions';
import { Request, Response, Middleware, Req, Res } from '@tsed/common';
import { Returns } from '@tsed/swagger';
import * as model from '../models/models';
import * as Auth from '../dal/auth';
import moment = require('moment');

@Middleware()
export class YesAuth {
    public use(@Req() req: Req, @Res() res: Res) {
        if (res.locals.userInfo && res.locals.userInfo.userId && typeof res.locals.userInfo.userId !== 'undefined') {
            return;
        }else{
            throw new Unauthorized('LoginRequired');
        }
    }
}

@Middleware()
export class NoAuth {
    public use(@Req() req: Req, @Res() res: Res) {
        if (!res.locals.userInfo || res.locals.userInfo && typeof res.locals.userInfo.userId === 'undefined') {
            return;
        }else{
            throw new Conflict('LogoutRequired');
        }
    }
}

@Middleware()
export class GameAuth {
    public use(@Req() req: Req, @Res() res: Res) {
        let data = req.query['authCode'];
        if (!data) {
            throw new Unauthorized('LoginRequired');
        }
        let gameAuthData = Auth.decodeGameAuthCode(data);
        if (!moment().add(15, 'seconds').isSameOrAfter(moment(gameAuthData.iat * 1000))) {
            throw new Unauthorized('LoginRequired');
        }
        let userInfo = res.locals.userInfo;
        userInfo = userInfo || {};
        userInfo.userId = gameAuthData.userId;
        userInfo.username = gameAuthData.username;
        // Ok
    }
}