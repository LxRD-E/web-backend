import { Middleware, Locals, Required, PathParams } from "@tsed/common";
import controller from '../../controllers/controller';
import * as model from '../../models/models';
import { Returns } from "@tsed/swagger";

/**
 * Verify that the req.path.referralId is valid
 */
@Middleware()
export class ValidateId extends controller {
    public async use(
        @PathParams('referralId', Number) referralId: number,
    ) {
        // Verify referral Exists
        await this.userReferral.getInfoById(referralId);
        // Yay, continue
    }
}