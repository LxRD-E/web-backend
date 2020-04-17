import {Middleware, Locals, Required, PathParams, Res} from "@tsed/common";
import controller from '../../controllers/controller';
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
export class ValidateGroupId extends controller {
    private CachedGroupInfo: IValidateGroupInfoCacheEntry[] = [];

    public checkForCache(groupId: number): boolean {
        const maxCacheTimeInMilliSeconds = 30 * 1000;
        let _newArr = [];
        let success = false;
        for (const entry of this.CachedGroupInfo) {
            if (entry.createdAt + maxCacheTimeInMilliSeconds >= new Date().getTime()) {
                _newArr.push(entry);
                if (entry.data.groupId === groupId) {
                    console.log('Cached');
                    success = true;
                }
            }
        }
        this.CachedGroupInfo = _newArr;
        return success;
    }

    public async use(
        @PathParams('groupId', Number) groupId: number,
        @Res() res: Res,
    ) {
        if (this.checkForCache(groupId)) {
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
        this.CachedGroupInfo.push({
            data: groupInfo,
            createdAt: new Date().getTime(),
        });
        // Ok
    }
}