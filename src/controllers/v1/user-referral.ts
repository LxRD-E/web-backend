import {Controller, Get, IParamOptions, ParamTypes, PathParams, Put, QueryParams, Required, Use} from "@tsed/common";
import {Description, Returns, Summary} from "@tsed/swagger";
import controller, {cError, paging} from "../controller";


import * as middleware from '../../middleware/middleware';
import * as model from '../../models/models';

/**
 * User Referral Controller
 */
@Controller('/user-referral')
@Description('Endpoints regarding user referral system')
export class UserReferralController extends controller {
    constructor() {
        super();
    }

    @Get('/code/:referralId/info')
    @Summary('Get referral code information by the {referralId}')
    @Returns(200, {
        type: model.userReferral.UserReferralInfo,
    })
    @Returns(404,
        controller.cError(
            'InvalidReferralId: referralId is invalid or does not exist',
        )
    )
    public async getReferralCodeInfo(
        @PathParams('referralId', Number) referralId: number,
    ) {
        return await this.userReferral.getInfoById(referralId);
    }

    @Get('/my/referral')
    @Summary('Get the authenticated users referral info (who referred the authenticated user)')
    @Returns(200, {
        type: model.userReferral.UserReferralInfo,
    })
    @Returns(404, controller.cError(
        'NotFound: User was not referred or referral code was deleted'
    ))
    @Use(middleware.YesAuth)
    public getAuthenticatedUserReferralData(
        @middleware.UserInfo() sess: model.UserSession,
    ) {
        return this.userReferral.getReferralUsedByUser(sess.userId);
    }

    @Get('/my/referral-code')
    @Summary('Get the referral code created by the authenticated user')
    @Returns(200, {
        type: model.userReferral.ExtendedUserReferralInfo,
    })
    @Returns(400, cError(
        'NotFound: Referral does not exist'
    ))
    @Use(middleware.YesAuth)
    public getReferralCode(
        @middleware.UserInfo() sess: model.UserSession,
    ) {
        return this.userReferral.getReferralCodeCreatedByUser(sess.userId);
    }

    @Put('/my/referral-code')
    @Summary('Create a referral code to use to refer other users')
    @Returns(200, {
        type: model.userReferral.UserReferralInfo,
    })
    @Returns(409, cError(
        'ReferralAlreadyExists: A referral for this user already exists'
    ))
    @Use(middleware.YesAuth, middleware.csrf)
    public createReferralCode(
        @middleware.UserInfo() sess: model.UserSession,
    ) {
        return this.userReferral.createReferralCode(sess.userId);
    }

    @Get('/code/:referralId/uses')
    @Summary('Get a page of referral code uses')
    @Returns(200, {
        type: model.userReferral.UserReferralUseResult
    })
    @Returns(404, cError('InvalidReferralId: Referral ID is invalid or does not exist'))
    @Returns(400, cError(...paging))
    @Use(
        // Require authentication
        middleware.YesAuth,
        // Confirm paging params are valid
        middleware.ValidatePaging,
        // Confirm referralId is valid
        middleware.userReferral.ValidateId,
    )
    public async getUserReferralUses(
        @Required()
        @PathParams('referralId', Number) referralId: number,
        @QueryParams('limit', Number) limit: number = 100,
        @QueryParams('offset', Number) offset: number = 0,
    ) {
        return this.userReferral.getReferralCodeUses(referralId, offset, limit);
    }

    @Get('/my/referral-contest/entry')
    @Summary('Get the referral contest entry for the {userId}')
    @Returns(200, {
        type: model.userReferral.UserReferralContestEntry
    })
    @Returns(404, cError('NotFound: A contest entry could not be located'))
    @Use(middleware.YesAuth)
    public getUserReferralContestEntry(
        @middleware.UserInfo() sess: model.UserSession,
    ) {
        return this.userReferral.getReferralContestStatusForUser(sess.userId);
    }
}