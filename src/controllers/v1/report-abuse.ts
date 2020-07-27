/**
 * Imports
 */
// TSed
import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, Err, Post, BodyParams, HeaderParams, Session, UseBeforeEach, PropertyType, MinItems, MaxItems, Maximum, Minimum, Patch, Delete } from "@tsed/common";
import { Description, Summary, Returns, ReturnsArray, Hidden } from "@tsed/swagger"; // import swagger Ts.ED module
import moment = require('moment');
import { RateLimiterMiddleware } from '../../middleware/RateLimit';
// Models
import * as model from '../../models/models';
// Middleware
import * as middleware from '../../middleware/middleware';
// Auth stuff
import { csrf } from '../../dal/auth';
// Autoload
import controller from '../controller';
import { NoAuth, YesAuth } from "../../middleware/Auth";
import RecaptchaV2 from '../../middleware/RecaptchaV2';
import { UserInfo } from "../../models/v1/user";
/**
 * Abuse reports controller
 */
@Controller('/report-abuse')
@Description('Report website content as rule-breaking')
export default class ReportAbuseController extends controller {

    constructor() {
        super();
    }

    @Get('/metadata/reasons')
    @Summary('Get report abuse reasons')
    public getReportAbuseReasons() {
        return model.reportAbuse.ReportReason;
    }

    @Post('/feed/friends/:userStatusId')
    @Summary('Report a userStatusId as abusive')
    @Description('Note this endpoint will always return OK, even if content could not be reported')
    @Use(
        // Confirm csrf
        csrf, 
        // Confirm user is authenticated
        YesAuth, 
        // Confirm feed permission is OK
        middleware.feed.ConfirmPermissionForStatus, 
        // confirm report reason is OK
        middleware.reportAbuse.ConfirmReportReasonValid
    )
    @Returns(200, {description: 'User status reported'})
    public async reportUserStatus(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Required()
        @PathParams('userStatusId', Number) userStatusId: number,
        @Required()
        @BodyParams('reason', Number) reason: number,
        @Res() res: Res,
    ) {
        // send OK before doing anything 
        res.status(200).send({
            success: true,
        });
        try {
            await this.reportAbuse.reportUserStatusId(userStatusId, userInfo.userId, reason);
        }catch(e) {
            console.error(e);
        }
    }

}
