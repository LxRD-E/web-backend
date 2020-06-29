import {Locals, Middleware, Req, Res} from "@tsed/common";
import middleware from './_middleware';
import * as model from '../../models/models';

/**
 * Verify that the authenticated user has game developer permissions
 */
@Middleware()
export class ValidateGameCreationPermissions extends middleware {
    public UserCache = this.cache('userId');

    public async use(
        @Locals('userInfo') userInfo: model.UserSession,
        @Res() res: Res,
    ) {
        return;
        /*
        let cacheResults = this.UserCache.checkForCache(userInfo.userId) as {isGameDev: boolean;}|false;
        if (cacheResults) {
            if (!cacheResults.isGameDev) {
                throw new this.Conflict('GameDeveloperPermissionsRequired');
            } else {
                // Ok
                return;
            }
        }
        if (userInfo.staff >= 1) {
            // Is OK
        }else{
            let devStatus = await this.user.getInfo(userInfo.userId, ['isDeveloper']);
            if (devStatus.isDeveloper === 1) {
                // Ok
            }else{
                throw new this.Conflict('GameDeveloperPermissionsRequired');
            }
        }
        // Add to cache
        this.UserCache.addToCache({
            data: {isGameDev: true, userId: userInfo.userId},
            createdAt: new Date().getTime(),
        });

         */
    }
}


@Middleware()
export class ServerAuth extends middleware {
    public async use(
        @Req() req: Req,
        @Res() res: Res,
    ) {
        let auth = req.header('authorization');
        if (!auth) {
            throw new Error('No authorization header specified');
        }
        // Try to decode
        let results = await this.auth.decodeGameServerAuthCode(auth);
        if (this.moment().add(3,'days').isSameOrAfter(this.moment(results.iat * 1000))) {
            throw new Error('Bad authorization header');
        }
        res.locals.userInfo = await this.user.getInfo(results.userId, ['userId', 'username', 'passwordChanged', 'primaryBalance', 'secondaryBalance', 'theme', 'banned', 'staff', 'dailyAward']);
        // Continue
    }
}