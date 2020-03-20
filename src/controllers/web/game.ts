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
                'genre',
                'createdAt',
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
        ViewData.page.gameGenreString = model.game.GameGenres[gameInfo.genre];
        ViewData.page.genres = model.game.GameGenres;
        ViewData.page.GameGenreDescriptions = model.game.GameGenreDescriptions;
        ViewData.page.GameGenreThumbnails = model.game.GameGenreThumbnails;
        let possibleGenres: number[] = [];
        for (const genre in model.game.GameGenres) {
            let numberVal = parseInt(genre, 10);
            if (Number.isInteger(numberVal)) {
                possibleGenres.push(numberVal);
            } 
        }
        ViewData.page.recommendedGenres = _.sampleSize(possibleGenres, 4);
        return ViewData;
    }
    /**
     * Load the Play Page
     */
    @Get('/play')
    @Render('play')
    public play(
        @QueryParams('genre', Number) genre: number,
    ) {
        if (!model.game.GameGenres[genre]) {
            genre = 1;
        }
        let title = 'Free 3D Games';
        if (genre !== 1) {
            title = 'Free 3D '+model.game.GameGenres[genre]+ ' Games';
        }
        let ViewData = new this.WWWTemplate({
            title: title,
            page: {
                genres: model.game.GameGenres,
                sorts: model.game.GameSortOptions,
                genre: genre,
            }
        })
        return ViewData;
    }
    @Get('/game/genre/:gameGenre')
    @Summary('Get the gamePage of a gameGenre')
    public gameGenre(
        @PathParams('gameGenre', String) gameGernre: string,
        @Res() res: Res,
    ) {
        if (!isNaN(parseInt(gameGernre, 10))) {
            return res.redirect('/play');
        }
        let genreToRedirectTo = model.game.GameGenres[gameGernre];
        if (genreToRedirectTo) {
            return res.redirect('/play?genre='+genreToRedirectTo+'&sortBy=1');
        }else{
            return res.redirect('/play');
        }
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
        console.log('Loading play page!');
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
        // generate an auth code
        let gameAuthCode = await this.auth.generateGameAuthCode(userData.userId, userData.username);
        let ViewData = new this.WWWTemplate({'title': 'Play'});
        ViewData.page.gameId = gameId;
        ViewData.page.authCode = gameAuthCode;

        return ViewData;
    }

    @Get('/game-check/browser-compatibility')
    @Summary('Confirm browser respects iframe sandbox attribute')
    public browserCompatibilityCheck(
        @Res() res: Res,
    ) {
        res.set('x-frame-options','sameorigin');
        res.send(`<!DOCTYPE html><html><head><title>Checking your browser...</title></head><body><script nonce="${res.locals.nonce}">try{alert("Sorry, your browser is not supported.");window.top.location.href = "/support/browser-not-compatible";}catch(e){}</script></body></html>`);
        return;
    }

    /**
     * Load Game Play Page Sandbox
     */
    @Get('/game/:gameId/sandbox')
    @Summary('Load game play page sandbox')
    @Use(YesAuth)
    @Render('game_sandbox')
    public async gamePlaySandbox(
        @Res() res: Res,
        @Locals('userInfo') userData: model.user.SessionUserInfo,
        @PathParams('gameId', Number) gameId: number,
        @Required()
        @QueryParams('authCode', String) authCode: string,
    ) {
        res.set('x-frame-options','sameorigin');
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
        // verify auth code
        let verifyAuthCode = await this.auth.decodeGameAuthCode(authCode);
        if (!moment().add(15, 'seconds').isSameOrAfter(verifyAuthCode.iat * 1000)) {
            throw new Error('InvalidAuthCode');
        }
        // OK, continue
        let ViewData = new this.WWWTemplate({'title': 'Play'});
        ViewData.page.gameId = gameId;
        ViewData.page.authCode = authCode;
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
                'genre',
                'createdAt',
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
        ViewData.page.genres = model.game.GameGenres;
        return ViewData;
    }
}