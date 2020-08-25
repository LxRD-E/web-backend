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
const model = require("../../models/models");
const middleware = require("../../middleware/middleware");
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
const services = require("../../services");
const websockets_1 = require("../../start/websockets");
const moment = require("moment");
const COPYRIGHT_DISCLAIMER = `/**
 * Copyright (c) BlocksHub - All Rights Reserved
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * You are not allowed to copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
 * This software includes various open-source libraries which have licenses provided where relevant and required.
 * View our full terms of service here: https://blockshub.net/terms
 */`;
let GameController = class GameController extends controller_1.default {
    async getGames(offset = 0, limit = 25, sortBy = 1, genre = 1, creatorId, creatorType) {
        if (!model.game.GameSortOptions[sortBy]) {
            throw new this.BadRequest('InvalidSortBy');
        }
        if (!model.game.GameGenres[genre]) {
            throw new this.BadRequest('InvalidGenre');
        }
        if (typeof creatorType === 'number' && !model.catalog.creatorType[creatorType]) {
            throw new this.BadRequest('InvalidCreatorType');
        }
        let creatorConstraint = undefined;
        if (typeof creatorType === 'number' && typeof creatorId === 'number') {
            creatorConstraint = new model.game.GameSearchCreatorConstraint;
            creatorConstraint.creatorId = creatorId;
            creatorConstraint.creatorType = creatorType;
        }
        let sortCol = '';
        let sortMode = 'desc';
        if (sortBy === model.game.GameSortOptions.Featured) {
            sortCol = 'player_count';
        }
        else if (sortBy === model.game.GameSortOptions['Top Players']) {
            sortCol = 'player_count';
        }
        else if (sortBy === model.game.GameSortOptions['Recently Updated']) {
            sortCol = 'updated_at';
        }
        else {
            throw new this.BadRequest('InvalidSortBy');
        }
        return await this.game.getGames(offset, limit, sortMode, sortCol, genre, creatorConstraint);
    }
    async getGameInfo(gameId) {
        return await this.game.getInfo(gameId);
    }
    async getMetaData(userInfo) {
        let canPlayGames = true;
        let canCreateGames = true;
        return {
            canPlayGames: canPlayGames,
            canCreateGames: canCreateGames,
        };
    }
    async getGameThumbnail(gameId) {
        return await this.game.getGameThumbnail(gameId);
    }
    async multiGetGameThumbnails(gameIds) {
        return await this.game.multiGetGameThumbnails(gameIds);
    }
    async getOriginalMap(userInfo, gameId) {
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === model.catalog.creatorType.User) {
            if (gameInfo.creatorId === userInfo.userId) {
                const map = await this.game.getGameMap(gameId);
                return (await this.game.getMapContent(map.scriptUrl)).toString();
            }
        }
        else if (gameInfo.creatorType === model.catalog.creatorType.Group) {
            let groupData = await this.group.getUserRole(gameInfo.creatorId, userInfo.userId);
            if (groupData.permissions.manage) {
                const map = await this.game.getGameMap(gameId);
                return (await this.game.getMapContent(map.scriptUrl)).toString();
            }
        }
        else {
            throw new this.Conflict('NotImplemented');
        }
        throw new this.Conflict('InvalidPermissions');
    }
    async decodeGameAuth(authCode) {
        let verifyAuthCode = await this.auth.decodeGameAuthCode(authCode);
        if (!moment().add(15, 'seconds').isSameOrAfter(verifyAuthCode.iat * 1000)) {
            throw new Error('InvalidAuthCode');
        }
        return verifyAuthCode;
    }
    async generateGameAuth(userInfo) {
        return await this.auth.generateGameAuthCode(userInfo.userId, userInfo.username);
    }
    async getOriginalScripts(userInfo, gameId) {
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === model.catalog.creatorType.User) {
            if (gameInfo.creatorId === userInfo.userId) {
                const scripts = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
                for (const script of scripts) {
                    script.content = await this.game.getScriptContent(script.scriptUrl);
                    script.content = script.content.toString();
                }
                return scripts;
            }
        }
        else if (gameInfo.creatorType === model.catalog.creatorType.Group) {
            let groupData = await this.group.getUserRole(gameInfo.creatorId, userInfo.userId);
            if (groupData.permissions.manage) {
                const scripts = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
                for (const script of scripts) {
                    script.content = await this.game.getScriptContent(script.scriptUrl);
                    script.content = script.content.toString();
                }
                return scripts;
            }
        }
        else {
            throw new this.Conflict('NotImplemented');
        }
        throw new this.Conflict('InvalidPermissions');
    }
    async getMap(userInfo, gameId, res, req) {
        let origin = req.header('origin');
        res.set('access-control-allow-origin', origin);
        res.set('access-control-allow-credentials', 'false');
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        }
        catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.Conflict('InvalidGameState');
        }
        const map = await this.game.getGameMap(gameId);
        const mapContent = await this.game.getMapContent(map.scriptUrl);
        return await services.encryptScript.async.encryptAndObfuscateScript(mapContent.toString());
    }
    async getClientScripts(gameId, res, req) {
        let origin = req.header('origin');
        res.set('access-control-allow-origin', origin);
        res.set('access-control-allow-credentials', 'false');
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        }
        catch (e) {
            console.error('error grabbing game info: ' + e);
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.Conflict('InvalidGameState');
        }
        const scripts = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
        let scriptString = '';
        for (const script of scripts) {
            const content = (await this.game.getScriptContent(script.scriptUrl)).toString();
            scriptString = scriptString + '\n' + content;
        }
        return await services.encryptScript.async.encryptAndObfuscateScript(scriptString);
    }
    async createGame(userInfo, gameName, gameDescription) {
        const games = await this.game.countGames(userInfo.userId, model.catalog.creatorType.User);
        if (games >= 5) {
            throw new this.BadRequest('TooManyGames');
        }
        if (gameName.length >= 32 || gameName.length < 1 || gameDescription.length >= 512) {
            throw new this.BadRequest('InvalidNameOrDescription');
        }
        const gameId = await this.game.create(userInfo.userId, model.catalog.creatorType.User, gameName, gameDescription);
        await this.game.createGameThumbnail(gameId, 'https://cdn.blockshub.net/game/default_assets/Screenshot_5.png', model.game.GameThumbnailModerationStatus.Approved);
        return {
            success: true,
            gameId: gameId,
        };
    }
    async verifyOwnership(userInfo, gameId) {
        const gameInfo = await this.game.getInfo(gameId);
        if (gameInfo.creatorType === 1) {
            throw new Error('Game is not of valid creator type');
        }
        if (gameInfo.creatorType === 0 && gameInfo.creatorId !== userInfo.userId) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return gameInfo;
    }
    async updateGame(userInfo, gameId, gameName, gameDescription, maxPlayers, genre) {
        await this.verifyOwnership(userInfo, gameId);
        if (gameName.length >= 32 || gameName.length < 1 || gameDescription.length >= 512) {
            throw new this.BadRequest('InvalidNameOrDescription');
        }
        if (maxPlayers < 1 || maxPlayers > 10) {
            throw new this.BadRequest('InvalidMaxPlayers');
        }
        if (!model.game.GameGenres[genre]) {
            throw new this.BadRequest('InvalidGenre');
        }
        await this.game.updateGameInfo(gameId, gameName, gameDescription, maxPlayers, genre);
        return {
            success: true,
        };
    }
    async updateMapScript(userInfo, gameId, newScriptContent) {
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const scriptName = await this.game.getGameMap(gameId);
        await this.game.uploadMap(newScriptContent, scriptName.scriptUrl);
        return {
            success: true,
        };
    }
    async deleteScript(userInfo, gameId, scriptId) {
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const scriptInfo = await this.game.getGameScript(scriptId);
        if (!scriptInfo || scriptInfo.gameId !== gameInfo.gameId) {
            throw new this.BadRequest('InvalidScriptId');
        }
        await this.game.deleteGameScript(scriptId);
        await this.game.deleteScript(scriptInfo.scriptUrl);
        return {
            success: true,
        };
    }
    async createClientScript(userInfo, gameId, scriptContent) {
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const existingScripts = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
        if (existingScripts.length >= 10) {
            throw new this.BadRequest('TooManyScripts');
        }
        const scriptUrl = await this.game.uploadScript(scriptContent);
        const scriptId = await this.game.createScript(gameId, model.game.ScriptType.client, scriptUrl);
        return {
            success: true,
        };
    }
    async createServerScript(userInfo, gameId, scriptContent) {
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const existingScripts = await this.game.getAllGameScripts(gameId);
        if (existingScripts.length >= 10) {
            throw new this.BadRequest('TooManyScripts');
        }
        const scriptUrl = await this.game.uploadScript(scriptContent);
        const scriptId = await this.game.createScript(gameId, model.game.ScriptType.server, scriptUrl);
        return {
            success: true,
        };
    }
    async updateScriptContent(userInfo, gameId, scriptContent, scriptId) {
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const scriptInfo = await this.game.getGameScript(scriptId);
        if (!scriptInfo || scriptInfo.gameId !== gameInfo.gameId) {
            throw new Error('InvalidScriptId');
        }
        await this.game.uploadScript(scriptContent, scriptInfo.scriptUrl);
        return {
            success: true,
        };
    }
    async requestGameJoin(userInfo, gameId) {
        const gameInfo = await this.game.getInfo(gameId, ['maxPlayers', 'gameState']);
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.BadRequest('InvalidGameState');
        }
        let gameServerId;
        await this.game.leaveServer(userInfo.userId).catch((e) => { console.error(e); });
        const servers = await this.game.getOpenServersForGame(gameId, gameInfo.maxPlayers);
        if (servers.length === 0) {
            gameServerId = await this.game.createGameServer(gameId);
        }
        else {
            const serverToJoin = servers[0];
            gameServerId = serverToJoin.gameServerId;
        }
        await this.game.joinServer(userInfo.userId, gameServerId);
        await this.game.incrementVisitCount(gameId);
        return {
            success: true,
            serverId: gameServerId,
        };
    }
    async listenForServerEvents(gameServerId) {
        return await this.game.listenForServerEvents(gameServerId);
    }
    async leaveAllGames(userInfo) {
        await this.game.leaveServer(userInfo.userId).catch((e) => { });
        return {
            success: true,
        };
    }
};
__decorate([
    common_1.Get('/search'),
    swagger_1.Summary('Get all games'),
    swagger_1.Returns(200, { type: model.game.GameSearchResult }),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidCreatorType: CreatorType is invalid\nInvalidSortBy: Sort by value is invalid\nInvalidGenre: Genre is invalid\n' }),
    __param(0, swagger_1.Description('Default: 0')),
    __param(0, common_1.QueryParams('offset', Number)),
    __param(1, swagger_1.Description('Default: 25')),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, swagger_1.Description('Default: 1')),
    __param(2, common_1.QueryParams('sortBy', Number)),
    __param(3, swagger_1.Description('Default: 1')),
    __param(3, common_1.QueryParams('genre', Number)),
    __param(4, common_1.QueryParams('creatorId', Number)),
    __param(5, common_1.QueryParams('creatorType', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGames", null);
__decorate([
    common_1.Get('/:gameId/info'),
    swagger_1.Summary('Get game info'),
    swagger_1.Returns(200, { type: model.game.GameInfo }),
    __param(0, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGameInfo", null);
__decorate([
    common_1.Get('/metadata'),
    swagger_1.Summary('Get games metaData for current user'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getMetaData", null);
__decorate([
    common_1.Get('/:gameId/thumbnail'),
    swagger_1.Summary('Get a game thumbnail'),
    swagger_1.Description('If no thumbnail available, a placeholder will be provided'),
    swagger_1.Returns(200, { type: model.game.GameThumbnail }),
    __param(0, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGameThumbnail", null);
__decorate([
    common_1.Get('/thumbnails'),
    swagger_1.Summary('Multi-get thumbnails by CSV of gameIds'),
    swagger_1.Description('Invalid IDs will be filtered out'),
    swagger_1.ReturnsArray(200, { type: model.game.GameThumbnail }),
    common_1.Use(middleware.ConvertIdsToCsv),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "multiGetGameThumbnails", null);
__decorate([
    common_1.Get('/edit-mode/:gameId/map'),
    swagger_1.Summary('Get un-obfuscated game map'),
    swagger_1.Returns(200, { type: String }),
    common_1.Use(middleware.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getOriginalMap", null);
__decorate([
    common_1.Get('/auth/client/decode'),
    swagger_1.Summary('Decode game auth code'),
    __param(0, common_1.Required()),
    __param(0, common_1.QueryParams('code', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "decodeGameAuth", null);
__decorate([
    common_1.Get('/auth/client/generate'),
    swagger_1.Summary('Generate game auth code'),
    common_1.Use(middleware.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "generateGameAuth", null);
__decorate([
    common_1.Get('/edit-mode/:gameId/scripts'),
    swagger_1.Summary('Get un-obfuscated game scripts'),
    swagger_1.ReturnsArray(200, { type: model.game.OriginalScriptData }),
    common_1.Use(middleware.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getOriginalScripts", null);
__decorate([
    common_1.Get('/:gameId/map'),
    swagger_1.Summary('Get the map of a {gameId}. Authentication required'),
    swagger_1.Returns(200, { type: String }),
    common_1.Use(Auth_1.GameAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.Res()),
    __param(3, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getMap", null);
__decorate([
    common_1.Get('/:gameId/scripts'),
    swagger_1.Summary('Get a game\'s client scripts.'),
    common_1.Use(Auth_1.GameAuth),
    __param(0, common_1.PathParams('gameId', Number)),
    __param(1, common_1.Res()),
    __param(2, common_1.Req()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getClientScripts", null);
__decorate([
    common_1.Post('/create'),
    swagger_1.Summary('Create a game'),
    swagger_1.Returns(409, { type: model.Error, description: 'GameDeveloperPermissionsRequired: User requires game dev permission\n' }),
    swagger_1.Returns(400, { type: model.Error, description: 'TooManyGames: User has reached max games count\nInvalidNameOrDescription: Name must be between 1 and 32 characters; description must be less than 512 characters\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.game.ValidateGameCreationPermissions),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams('name', String)),
    __param(2, common_1.BodyParams('description', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, String, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createGame", null);
__decorate([
    common_1.Patch('/:gameId'),
    swagger_1.Summary('Update a game'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidNameOrDescription: Name must be between 1 and 32 characters; description can be at most 512 characters\nInvalidMaxPlayers: Must be between 1 and 10\nInvalidGenre: Please specify a valid model.game.GameGenres\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.game.ValidateGameCreationPermissions),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('name', String)),
    __param(3, common_1.BodyParams('description', String)),
    __param(4, common_1.BodyParams('maxPlayers', Number)),
    __param(5, common_1.BodyParams('genre', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "updateGame", null);
__decorate([
    common_1.Patch('/:gameId/map'),
    swagger_1.Summary('Update the map script of a {gameId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.game.ValidateGameCreationPermissions),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "updateMapScript", null);
__decorate([
    common_1.Delete('/:gameId/script/:scriptId'),
    swagger_1.Summary('Delete a game script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.game.ValidateGameCreationPermissions),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.PathParams('scriptId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "deleteScript", null);
__decorate([
    common_1.Post('/:gameId/script/client'),
    swagger_1.Summary('Create a client script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.game.ValidateGameCreationPermissions),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createClientScript", null);
__decorate([
    common_1.Post('/:gameId/script/server'),
    swagger_1.Summary('Create a server script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.game.ValidateGameCreationPermissions),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createServerScript", null);
__decorate([
    common_1.Patch('/:gameId/script/:scriptId'),
    swagger_1.Summary('Update a script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth, middleware.game.ValidateGameCreationPermissions),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __param(3, common_1.PathParams('scriptId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number, String, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "updateScriptContent", null);
__decorate([
    common_1.Post('/:gameId/join'),
    swagger_1.Summary('Join a game'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGameState: Game state does not allow joining\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.UserSession, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "requestGameJoin", null);
GameController = __decorate([
    common_1.Controller('/game')
], GameController);
exports.default = GameController;
websockets_1.wss.on('connection', async function connection(ws, req, authCode) {
    if (req.url !== '/game-sockets/websocket.aspx') {
        return;
    }
    console.log(authCode);
    console.log('connection started');
    if (!authCode) {
        console.log('no session');
        ws.close();
        return;
    }
    const context = {
        'UserInfo': {
            'userId': authCode.userId,
            'username': authCode.username,
            'theme': 0,
            'primaryBalance': 0,
            'secondaryBalance': 0,
            'passwordChange': 0,
            'staff': 0,
            'banned': 0,
        },
    };
    let listenerSetup = false;
    let listener;
    const setupListenForGameServerEvents = async (serverId) => {
        if (listenerSetup === true) {
            ws.close();
            return;
        }
        listenerSetup = true;
        listener = await new GameController().listenForServerEvents(serverId);
        listener.on('message', (channel, message) => {
            ws.send(message);
        });
    };
    ws.on('close', async () => {
        console.log('Ws Closed');
        await new GameController().leaveAllGames(context.UserInfo);
        if (listener) {
            listener.disconnect();
        }
    });
    ws.on('message', async function incoming(ev) {
        console.log('ws message recieved');
        let data;
        try {
            data = JSON.parse(ev);
        }
        catch {
            return;
        }
        if (data.cmd && data.cmd === 'join') {
            const id = data.gameId;
            const serverId = await new GameController().requestGameJoin(context.UserInfo, id);
            ws.send(JSON.stringify(serverId));
            setupListenForGameServerEvents(serverId.serverId);
        }
    });
});

