import {Controller, Get, Locals, PathParams, QueryParams, Render, Res, Use, UseBefore} from "@tsed/common";
import * as model from '../../models/models';
import controller from '../controller'
// Models
import {YesAuth} from "../../middleware/Auth";

@Controller("/")
export class WWWCurrencyExchangeController extends controller {
    constructor() {
        super();
    }

    @Render('currency-exchange')
    @Get('/currency-exchange')
    @Use(YesAuth)
    public async subCategory(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
    ) {
        return new this.WWWTemplate({title: 'Currency Exchange'});
    }
}