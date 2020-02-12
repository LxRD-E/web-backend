import { Controller, Get, Post, Render, Redirect, PathParams, QueryParams, UseBefore } from '@tsed/common';
import { Summary } from '@tsed/swagger';
import controller from '../controller';
import * as model from '../../models/models';
import { YesAuth } from '../../middleware/Auth';

@Controller('/')
export class WWWEconomyController extends controller {
    @Get('/transactions')
    @Summary('Get user transaction history')
    @Render('transactions')
    @UseBefore(YesAuth)
    public transactions() {
        return new this.WWWTemplate({
            title: 'Transactions',
        });
    }
    @Get('/trades')
    @Summary('Get list of user trades')
    @Render('trades')
    @UseBefore(YesAuth)
    public trades() {
        return new this.WWWTemplate({
            title: 'Trades',
        });
    }
}
