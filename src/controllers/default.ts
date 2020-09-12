/**
 * Imports
 */
// Autoload
import controller from './controller';
import { Controller, Get, Req, Res, PathParams } from '@tsed/common';
import { prom } from '../helpers/prometheus';
import { Summary, Hidden } from '@tsed/swagger';
import config from '../helpers/config';
import pubSub from '../helpers/ioredis_pubsub';
/**
 * Defalt Controller
 */
@Controller('/')
export default class DefaultController extends controller {

    constructor() {
        super();
    }

    @Get('/metrics/:metricsKey')
    @Summary('Metrics information')
    @Hidden()
    public async getMetrics(
        @PathParams('metricsKey', String) key: string,
        @Res() res: Res,
    ) {
        if (key !== config.trackerAuthorization) {
            throw new this.NotFound('NotFound');
        }
        res.header('content-type', 'text/plain');
        return;
        // return prom.register.metrics();
    }

}
