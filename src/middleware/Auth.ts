import { Unauthorized, Conflict } from 'ts-httpexceptions';
import { Request, Response, Middleware, Req, Res } from '@tsed/common';

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