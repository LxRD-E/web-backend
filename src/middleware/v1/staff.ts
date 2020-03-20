import { Middleware, Locals, Required, PathParams } from "@tsed/common";
import controller from '../../controllers/controller';
import * as model from '../../models/models';
import { Returns } from "@tsed/swagger";

export class StaffValidateLevelOne extends controller {
    public async use(
        @Locals('userInfo') userInfo: model.UserSession,
    ) {
        if (userInfo.staff >= 1 === false) {
            // user is not authorized
            throw new this.BadRequest('InvalidPermissions');
        }
    }
}