import { Controller, Get, All, Next, Req, Res, UseBefore, Render, QueryParams, PathParams, Redirect, Response, Request, Locals, UseAfter, Required, Use, UseBeforeEach } from "@tsed/common";
import { Description, Summary } from "@tsed/swagger"; // import swagger Ts.ED module
import { Exception, NotFound, BadRequest } from "ts-httpexceptions";
import * as model from '../../models/models';
import { WWWTemplate } from '../../models/v2/Www';
import controller from '../controller'
import moment = require("moment");
import xss = require('xss');
import Config from '../../helpers/config';
// Models
import { NoAuth, YesAuth } from "../../middleware/Auth";
import {numberWithCommas} from '../../helpers/Filter';

@Controller("/")
export class WWWGameController extends controller {
    constructor() {
        super();
    }


    @Render('game_create')
    @Get('/game/create')
    @Use(YesAuth)
    public async gameCreate(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @PathParams('subCategoryId', Number) numericId: number,
        @QueryParams('page', Number) page?: number,
    ) {
        let rank = 0;
        if (userData) {
            rank = userData.staff;
        }
        if (rank >= 1 !== true) {
            throw new this.Conflict('InvalidPermissions');
        }
        let ViewData = new this.WWWTemplate({title: 'Create a Game'});
        ViewData.page = {};
        return ViewData;
    }

    @Render('game_view')
    @Get('/game/:gameId')
    public async gamePage(
        @PathParams('gameId', Number) gameId: number,
    ) {
        let gameInfo: model.game.GameInfo;
        let gameThumb: model.game.GameThumbnail;
        try {
            gameInfo = await this.game.getInfo(gameId, [
                'gameId',
                'gameName',
                'gameDescription',
                'updatedAt',
                'playerCount',
                'visitCount',
                'creatorType',
                'creatorId',
            ]);
            gameThumb = await this.game.getGameThumbnail(gameId);
        }catch(e) {
            // Invalid ID
            throw new this.BadRequest('InvalidGameId');
        }
        let ViewData = new this.WWWTemplate({'title': gameInfo.gameName});
        ViewData.page = {};
        ViewData.page.gameInfo = gameInfo;
        if (gameInfo.creatorType === 0) {
            // By User
            const creatorName = await this.user.getInfo(gameInfo.creatorId, ['username','accountStatus']);
            if (creatorName.accountStatus === model.user.accountStatus.deleted) {
                ViewData.page.creatorName = '[Deleted'+gameInfo.creatorId+']';
            }else{
                ViewData.page.creatorName = creatorName.username;
            }
            ViewData.page.thumbnailId = gameInfo.creatorId;
        }else{
            // By Group
            const creatorName = await this.group.getInfo(gameInfo.creatorId);
            ViewData.page.creatorName = creatorName.groupName;
            ViewData.page.thumbnailId = creatorName.groupIconCatalogId;
        }
        ViewData.page.ThumbnailURL = gameThumb.url;
        ViewData.title = gameInfo.gameName;
        return ViewData;
    }
    /**
     * Load the Play Page
     */
    @Get('/play')
    @Render('play')
    public async play() {
        let ViewData = new this.WWWTemplate({
            title: 'Free 3D Games',
            page: {
                genres: model.game.GameGenres,
                sorts: model.game.GameSortOptions,
            }
        })
        return ViewData;
    }
    /**
     * Load Game Play Page
     */
    @Get('/game/:gameId/play')
    @Summary('Load game play page')
    @Use(YesAuth)
    @Render('game')
    public async gamePlay(
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @PathParams('gameId', Number) gameId: number
    ) {
        // Confirm place is valid
        try {
            const gameInfo = await this.game.getInfo(gameId, ['gameState']);
            if (gameInfo.gameState !== 1) {
                throw Error('Game state does not allow playing');
            }
        }catch(e) {
            // Invalid ID
            throw new this.BadRequest('InvalidGameId');
        }
        let ViewData = new this.WWWTemplate({'title': 'Play'});
        ViewData.page.gameId = gameId;
        return ViewData;
    }

    /**
     * Load Games Edit Page
     */
    @Get('/game/:gameId/edit')
    @Summary('Game edit page')
    @Use(YesAuth)
    @Render('game_edit')
    public async gameEdit(
        @Locals('userInfo') userInfo: model.user.SessionUserInfo,
        @PathParams('gameId', Number) gameId: number,
    ) {
        // Confirm place is valid
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId, [
                'gameId',
                'gameName',
                'gameDescription',
                'updatedAt',
                'playerCount',
                'visitCount',
                'creatorType',
                'creatorId',
                'maxPlayers',
            ]);
        }catch(e) {
            // Invalid ID
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType !== 0) {
            // temp until group perms are sorted out
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === 0 && gameInfo.creatorId !== userInfo.userId) {
            // no edit perms
            throw new this.BadRequest('InvalidPermissions');
        }
        // Grab Map Script
        console.log('getting map');
        const mapScript = await this.game.getGameMap(gameId);
        const mapScriptContent = await this.game.getMapContent(mapScript.scriptUrl);
        let ViewData = new this.WWWTemplate({'title': 'Edit Game'});
        ViewData.page = {};
        ViewData.page.scripts = {
            map: mapScriptContent,
            server: [] as {content: string; id: number}[],
            client: [] as {content: string; id: number}[],
        };
        console.log('getting all scripts');
        const allScripts = await this.game.getAllGameScripts(gameId);
        for (const script of allScripts) {
            const content = await this.game.getScriptContent(script.scriptUrl);
            if (script.scriptType === 1) {
                ViewData.page.scripts.server.push({content: content, id: script.scriptId});
            }else{
                ViewData.page.scripts.client.push({content: content, id: script.scriptId});
            }
        }
        console.log('returning view');
        ViewData.page.gameInfo = gameInfo;
        ViewData.title = 'Edit: ' + gameInfo.gameName;
        return ViewData;
    }
}