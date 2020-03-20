import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, UseBeforeEach } from "@tsed/common";
import { Description, Summary } from "@tsed/swagger"; // import swagger Ts.ED module
import { Exception, NotFound, BadRequest } from "ts-httpexceptions";
import * as model from '../../models/models';
import { WWWTemplate } from '../../models/v2/Www';
import controller from '../controller'
import moment = require("moment");
import xss = require('xss');
import Config from '../../helpers/config';
import _ = require('lodash');
// Models
import { NoAuth, YesAuth } from "../../middleware/Auth";
import {numberWithCommas} from '../../helpers/Filter';

@Controller("/report-abuse/")
export class WWWReportAbuseController extends controller {
    constructor() {
        super();
    }
    @Get('/user-status/:userStatusId')
    @Render('report-abuse/user-status')
    @Use(YesAuth)
    public reportUserStatus(
        @PathParams('userStatusId', Number) userStatusId: number,
    ) {
        return new this.WWWTemplate({
            title: 'Report Abuse',
            page: {
                reasons: model.reportAbuse.ReportReason,
                userStatusId: userStatusId,
            }
        });
    }
}