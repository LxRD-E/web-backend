// Models
import * as model from '../../models/models';
// Middleware
import * as middleware from '../../middleware/middleware';
// Extra models
import {csrf} from '../../dal/auth';
import {YesAuth} from '../../middleware/Auth';
// Extender
import controller from '../controller';
// Tsed
import {BodyParams, Controller, Get, Locals, PathParams, Post, Req, Required, Res, Status, Use} from '@tsed/common';
import {Description, Returns, ReturnsArray, Summary} from '@tsed/swagger';

/**
 * Data Persistence Controller
 */
@Controller('/data-persistence')
@Description('Internal game data persistence method. Note that all methods require middleware.game.ServerAuth, so they will not be accessible to normal players')
export default class DataPersistenceController extends controller {

    constructor()
    {
        super();
    }

    private async confirmOwnership(gameId: number, userId: number) {
        // confirm is owner
        let gameData = await this.game.getInfo(gameId, ['creatorType', 'creatorId']);
        if (gameData.creatorType === model.catalog.creatorType.User) {
            if (gameData.creatorId !== userId) {
                throw new this.Conflict('Unauthorized');
            }
        }else if (gameData.creatorType === model.catalog.creatorType.Group) {
            let groupData = await this.group.getInfo(gameData.creatorId);
            if (groupData.groupOwnerUserId !== userId) {
                throw new this.Conflict('Unauthorized');
            }
        }else{
            throw new Error('Not Implemented');
        }
    }

    @Get('/:gameId/metadata')
    @Summary('Data persistence metadata')
    public metaData(
        @Req() req: Req,
        @Res() res: Res,
        @PathParams('gameId', Number) gameId: number,
    ) {
        throw new Error('Disabled');
    }

    @Get('/:gameId/get/:key')
    @Summary('Get data')
    @Use(middleware.game.ServerAuth)
    @Returns(409, {type: model.Error, description: 'Unauthorized: Not authorized\n'})
    public async get(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @PathParams('key', String) key: string,
    ) {
        // todo: move to middleware or something
        await this.confirmOwnership(gameId, userInfo.userId);
        let data = await this.dataPersistence.get(gameId, key);
        return {
            value: data,
        };
    }

    @Post('/:gameId/set/:key')
    @Summary('Set data')
    @Use(middleware.game.ServerAuth)
    @Returns(409, {type: model.Error, description: 'Unauthorized: Unauthorized\n'})
    public async set(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @PathParams('key', String) key: string,
        @Required()
        @BodyParams(model.dataPersistence.SetDataRequest) request: model.dataPersistence.SetDataRequest,
    ) {
        // todo: move to middleware or something
        await this.confirmOwnership(gameId, userInfo.userId);

        let value = request.value;
        // Set
        await this.dataPersistence.set(gameId, key, value);
        // Return OK
        return {};
    }
}
