import { Controller, Get, Post, Render, Redirect, PathParams, QueryParams, UseBefore } from '@tsed/common';
import { Summary } from '@tsed/swagger';
import controller from '../controller';
import * as model from '../../models/models';
import { YesAuth } from '../../middleware/Auth';

@Controller('/')
export class WWWSettingsController extends controller {
    @Get('/settings')
    @Summary('Get user settings')
    @Render('settings')
    @UseBefore(YesAuth)
    public transactions() {
        return new this.WWWTemplate({
            title: 'Account Settings',
        });
    }
}
