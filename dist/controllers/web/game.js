"use strict";
/* istanbul ignore next */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
/* istanbul ignore next */
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
/* istanbul ignore next */
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
/* istanbul ignore next */
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
/* istanbul ignore next */
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const model = require("../../models/models");
const controller_1 = require("../controller");
const moment = require("moment");
const _ = require("lodash");
const Auth_1 = require("../../middleware/Auth");
let WWWGameController = class WWWGameController extends controller_1.default {
    constructor() {
        super();
    }
    async gameCreate(userData, numericId, page) {
        let rank = 0;
        if (userData) {
            rank = userData.staff;
        }
        if (rank >= 1 !== true) {
            throw new this.Conflict('InvalidPermissions');
        }
        let ViewData = new this.WWWTemplate({ title: 'Create a Game' });
        ViewData.page = {};
        return ViewData;
    }
    async gamePage(gameId) {
        let gameInfo;
        let gameThumb;
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        let ViewData = new this.WWWTemplate({ 'title': gameInfo.gameName });
        ViewData.page = {};
        ViewData.page.gameInfo = gameInfo;
        if (gameInfo.creatorType === 0) {
            const creatorName = await this.user.getInfo(gameInfo.creatorId, ['username', 'accountStatus']);
            if (creatorName.accountStatus === model.user.accountStatus.deleted) {
                ViewData.page.creatorName = '[Deleted' + gameInfo.creatorId + ']';
            }
            else {
                ViewData.page.creatorName = creatorName.username;
            }
            ViewData.page.thumbnailId = gameInfo.creatorId;
        }
        else {
            const creatorName = await this.group.getInfo(gameInfo.creatorId);
            ViewData.page.creatorName = creatorName.groupName;
            ViewData.page.thumbnailId = creatorName.groupIconCatalogId;
        }
        ViewData.page.ThumbnailURL = gameThumb.url;
        ViewData.title = gameInfo.gameName;
        ViewData.page.gameGenreString = model.game.GameGenres[gameInfo.genre];
        ViewData.page.genres = model.game.GameGenres;
        let possibleGenres = [];
        for (const genre in model.game.GameGenres) {
            let numberVal = parseInt(genre, 10);
            if (Number.isInteger(numberVal)) {
                possibleGenres.push(numberVal);
            }
        }
        ViewData.page.recommendedGenres = _.sampleSize(possibleGenres, 4);
        return ViewData;
    }
    async play() {
        let ViewData = new this.WWWTemplate({
            title: 'Free 3D Games',
            page: {
                genres: model.game.GameGenres,
                sorts: model.game.GameSortOptions,
            }
        });
        return ViewData;
    }
    async gamePlay(userData, gameId) {
        console.log('Loading play page!');
        try {
            const gameInfo = await this.game.getInfo(gameId, ['gameState']);
            if (gameInfo.gameState !== 1) {
                throw Error('Game state does not allow playing');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        let gameAuthCode = await this.auth.generateGameAuthCode(userData.userId, userData.username);
        let ViewData = new this.WWWTemplate({ 'title': 'Play' });
        ViewData.page.gameId = gameId;
        ViewData.page.authCode = gameAuthCode;
        return ViewData;
    }
    browserCompatibilityCheck(res) {
        res.send(`<!DOCTYPE html><html><head><title>Checking your browser...</title></head><body><script nonce="${res.locals.nonce}">try{alert("Sorry, your browser is not supported.");window.top.location.href = "/support/browser-not-compatible";}catch(e){}</script></body></html>`);
        return;
    }
    async gamePlaySandbox(userData, gameId, authCode) {
        try {
            const gameInfo = await this.game.getInfo(gameId, ['gameState']);
            if (gameInfo.gameState !== 1) {
                throw Error('Game state does not allow playing');
            }
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        let verifyAuthCode = await this.auth.decodeGameAuthCode(authCode);
        if (!moment().add(15, 'seconds').isSameOrAfter(verifyAuthCode.iat * 1000)) {
            throw new Error('InvalidAuthCode');
        }
        let ViewData = new this.WWWTemplate({ 'title': 'Play' });
        ViewData.page.gameId = gameId;
        ViewData.page.authCode = authCode;
        return ViewData;
    }
    async gameEdit(userInfo, gameId) {
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
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType !== 0) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === 0 && gameInfo.creatorId !== userInfo.userId) {
            throw new this.BadRequest('InvalidPermissions');
        }
        console.log('getting map');
        const mapScript = await this.game.getGameMap(gameId);
        const mapScriptContent = await this.game.getMapContent(mapScript.scriptUrl);
        let ViewData = new this.WWWTemplate({ 'title': 'Edit Game' });
        ViewData.page = {};
        ViewData.page.scripts = {
            map: mapScriptContent,
            server: [],
            client: [],
        };
        console.log('getting all scripts');
        const allScripts = await this.game.getAllGameScripts(gameId);
        for (const script of allScripts) {
            const content = await this.game.getScriptContent(script.scriptUrl);
            if (script.scriptType === 1) {
                ViewData.page.scripts.server.push({ content: content, id: script.scriptId });
            }
            else {
                ViewData.page.scripts.client.push({ content: content, id: script.scriptId });
            }
        }
        console.log('returning view');
        ViewData.page.gameInfo = gameInfo;
        ViewData.title = 'Edit: ' + gameInfo.gameName;
        ViewData.page.genres = model.game.GameGenres;
        return ViewData;
    }
};
__decorate([
    common_1.Render('game_create'),
    common_1.Get('/game/create'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('subCategoryId', Number)),
    __param(2, common_1.QueryParams('page', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], WWWGameController.prototype, "gameCreate", null);
__decorate([
    common_1.Render('game_view'),
    common_1.Get('/game/:gameId'),
    __param(0, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], WWWGameController.prototype, "gamePage", null);
__decorate([
    common_1.Get('/play'),
    common_1.Render('play'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], WWWGameController.prototype, "play", null);
__decorate([
    common_1.Get('/game/:gameId/play'),
    swagger_1.Summary('Load game play page'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('game'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWGameController.prototype, "gamePlay", null);
__decorate([
    common_1.Get('/game-check/browser-compatibility'),
    swagger_1.Summary('Confirm browser respects iframe sandbox attribute'),
    __param(0, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], WWWGameController.prototype, "browserCompatibilityCheck", null);
__decorate([
    common_1.Get('/game/:gameId/sandbox'),
    swagger_1.Summary('Load game play page sandbox'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('game_sandbox'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.Required()),
    __param(2, common_1.QueryParams('authCode', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], WWWGameController.prototype, "gamePlaySandbox", null);
__decorate([
    common_1.Get('/game/:gameId/edit'),
    swagger_1.Summary('Game edit page'),
    common_1.Use(Auth_1.YesAuth),
    common_1.Render('game_edit'),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.SessionUserInfo, Number]),
    __metadata("design:returntype", Promise)
], WWWGameController.prototype, "gameEdit", null);
WWWGameController = __decorate([
    common_1.Controller("/"),
    __metadata("design:paramtypes", [])
], WWWGameController);
exports.WWWGameController = WWWGameController;

