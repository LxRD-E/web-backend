import { Middleware, Locals, Required, PathParams } from "@tsed/common";
import controller from '../../controllers/controller';
import * as model from '../../models/models';
import { Returns } from "@tsed/swagger";

@Middleware()
@Returns(400, {type: model.Error,description: 'Test Test 1234'})
export class ConfirmPermissionForStatus extends controller {
    public async use(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('userStatusId', Number) userStatusId: number,
    ) {
        let statusData: model.user.UserStatus;
        try {
            statusData = await this.user.getStatusById(userStatusId);
        }catch(e) {
            throw new this.BadRequest('InvalidStatusId');
        }
        // check if the owner of the userStatusId is the authenticated user or friends with the authenticated user
        let info = await this.user.getFriendshipStatus(userInfo.userId, statusData.userId);
        if (!info.areFriends && userInfo.userId !== statusData.userId) {
            // user is not authorized to view status and thus cannot access it
            throw new this.BadRequest('InvalidStatusId');
        }
    }
}