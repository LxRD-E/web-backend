import {Middleware, Locals, Required, PathParams, Res} from "@tsed/common";
import middleware from './_middleware';
import * as model from '../../models/models';
import { Returns } from "@tsed/swagger";


interface IValidateGroupInfoCacheEntry {
    data: any;
    createdAt: number;
}
/**
 * Verify that the req.params.groupId is valid.
 */
@Middleware()
export class ValidateGroupId extends middleware {
    private GroupCache = this.cache('groupId');

    public async use(
        @PathParams('groupId', Number) groupId: number,
        @Res() res: Res,
    ) {
        if (this.GroupCache.checkForCache(groupId)) {
            return;
        }
        // Verify Group Exists and Isn't Deleted
        let groupInfo: model.group.groupDetails;
        try {
            groupInfo = await this.group.getInfo(groupId);
        } catch (e) {
            if (e && e.message === 'InvalidGroupId') {
                throw new this.BadRequest('InvalidGroupId');
            }
            throw e;
        }
        if (groupInfo.groupStatus === model.group.groupStatus.locked) {
            throw new this.BadRequest('InvalidGroupId');
        }
        this.GroupCache.addToCache({
            data: groupInfo,
            createdAt: new Date().getTime(),
        });
        // Ok
    }
}