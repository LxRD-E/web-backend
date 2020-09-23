import * as feed from './v1/feed';
import * as reportAbuse from './v1/report-abuse';
import * as staff from './v1/staff';
import * as user from './v1/user';
import * as group from './v1/group';
import * as game from './v1/game';
import * as userReferral from './v1/user-referral';
import * as tradeAds from './v1/trade-ads';
import { Middleware, QueryParams, Req } from "@tsed/common";
import StandardController from "../controllers/controller";
import { filterId } from "../helpers/Filter";
import { YesAuth, NoAuth } from "./Auth";
import { csrf } from '../dal/auth';
// generic functions

/**
 * Validate paging info (offset, limit, sort)
 */
@Middleware()
class ValidatePaging extends StandardController {
    public use(
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('sort', String) sort: string = 'desc',
    ) {
        if (sort !== 'desc' && sort !== 'asc') {
            throw new this.BadRequest('InvalidSort');
        }
        if (limit > 100 || limit <= 0) {
            throw new this.BadRequest('InvalidLimit');
        }
        if (offset < 0) {
            throw new this.BadRequest('InvalidOffset');
        }
        if (offset >= Number.MAX_SAFE_INTEGER) {
            throw new this.BadRequest('InvalidOffset');
        }
    }
}

/**
 * Convert a req.query.ids to an array of numbers.
 * @throws InvalidIds if ids are somehow invalid
 * @throws TooManyIds Too many ids were specified (over 25)
 */
@Middleware()
class ConvertIdsToCsv extends StandardController {
    public use(
        @QueryParams('ids', String) ids: string,
        @Req() req: Req,
    ) {
        if (!ids) {
            throw new this.BadRequest('InvalidIds');
        }
        const idsArray = ids.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds: Array<number> = [];
        let allIdsValid = true;
        idsArray.forEach(id => {
            const userId = filterId(id) as number;
            if (!userId) {
                allIdsValid = false
            }
            filteredIds.push(userId);
        });
        if (!allIdsValid) {
            throw new this.BadRequest('InvalidIds');
        }
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25) {
            throw new this.BadRequest('TooManyIds');
        }
        req.query.ids = safeIds;
    }
}

import { Locals } from "@tsed/common";
import { applyDecorators } from "@tsed/core";

function UserInfo(): ParameterDecorator {
    return applyDecorators(
        Locals('userInfo')
    ) as any;
}

export {
    // General Middleware
    ValidatePaging,
    ConvertIdsToCsv,
    // Helpful
    YesAuth,
    NoAuth,
    UserInfo,
    csrf,
    // Service Middleware
    feed,
    reportAbuse,
    staff,
    user,
    group,
    game,
    userReferral,
    tradeAds,
};