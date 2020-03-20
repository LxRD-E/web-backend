import { Middleware, Locals, Required, PathParams, BodyParams } from "@tsed/common";
import controller from '../../controllers/controller';
import * as model from '../../models/models';

@Middleware()
export class ConfirmReportReasonValid extends controller {
    public async use(
        @Required()
        @BodyParams('reason', Number) reason: number,
    ) {
        if (!model.reportAbuse.ReportReason[reason]) {
            throw new this.BadRequest('InvalidReportReason');
        }
    }
}