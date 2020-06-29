import { Middleware, Locals, Required, PathParams } from "@tsed/common";
import controller from '../../controllers/controller';
import * as model from '../../models/models';
import { Returns } from "@tsed/swagger";

/**
 * Verify that the req.params.userId is valid.
 */
@Middleware()
export class ValidateUserId extends controller {
    public async use(

        @PathParams('userId', Number) userId: number,
        @Locals('userInfo') session?: model.UserSession,
    ) {
        // Verify User Exists
        let info;
        try {
            info = await this.user.getInfo(userId, ["accountStatus"]);
        }catch(e) {
            if (e && e.message === 'InvalidUserId') {
                throw new this.BadRequest('InvalidUserId');
            }
            throw e;
        }
        if (session && session.staff >= 1) {
            return; // skip validation for staff
        }
        // yay gdpr
        if (info.accountStatus === model.user.accountStatus.deleted) {
            throw new this.BadRequest('InvalidUserId');
        }
    }
}