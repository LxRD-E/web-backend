import { Middleware } from "@tsed/common";
import controller from '../../controllers/controller';
import * as model from '../../models/models';

/**
 * Validate that the tradeads feature flag is enabled
 */
@Middleware()
export class ValidateFeatureFlag extends controller {
    public async use() {
        if (!model.tradeAds.isEnabled) {
            // trade ads are not yet enabled on this branch/codebase
            throw new this.Conflict('NotEnabled');
        }
    }
}
