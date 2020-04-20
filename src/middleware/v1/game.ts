import {Middleware, Locals, Required, PathParams, Res} from "@tsed/common";
import middleware from './_middleware';
import * as model from '../../models/models';
import { Returns } from "@tsed/swagger";

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
            data: {isGameDev: userInfo.staff >= 1, userId: userInfo.userId},
            createdAt: new Date().getTime(),
        });
    }
}