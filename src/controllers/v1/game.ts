/**
 * Imports
 */
// libraries
import jsObfuse = require('javascript-obfuscator');
// models
import * as model from '../../models/models';
// middleware
import * as middleware from '../../middleware/middleware';
// tsed stuff
import controller from '../controller';
import {
    BodyParams,
    Controller,
    Delete,
    Get,
    Locals,
    Patch,
    PathParams,
    Post,
    QueryParams, Req,
    Required,
    Res,
    Use
} from '@tsed/common';
import {Description, Returns, ReturnsArray, Summary} from '@tsed/swagger';
import {GameAuth, NoAuth, YesAuth} from '../../middleware/Auth';
import {csrf} from '../../dal/auth';
// services
import * as services from '../../services';
/**
 * this is purely used for typings. please access directly from dal instead of here
 */
import {Redis} from 'ioredis';
import {wss} from '../../start/websockets';
import moment = require("moment");

const COPYRIGHT_DISCLAIMER = `/**
 * Copyright (c) BlocksHub - All Rights Reserved
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * You are not allowed to copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
 * This software includes various open-source libraries which have licenses provided where relevant and required.
 * View our full terms of service here: https://blockshub.net/terms
 */`;

/**
 * Game Controller
 */
@Controller('/game')
export default class GameController extends controller {

    @Get('/search')
    @Summary('Get all games')
    @Returns(200, { type: model.game.GameSearchResult })
    @Returns(400, {type: model.Error, description: 'InvalidCreatorType: CreatorType is invalid\nInvalidSortBy: Sort by value is invalid\nInvalidGenre: Genre is invalid\n'})
    public async getGames(
        @Description('Default: 0')
        @QueryParams('offset', Number) offset: number = 0,
        @Description('Default: 25')
        @QueryParams('limit', Number) limit: number = 25,
        @Description('Default: 1')
        @QueryParams('sortBy', Number) sortBy: number = 1,
        @Description('Default: 1')
        @QueryParams('genre', Number) genre: number = 1,
        @QueryParams('creatorId', Number) creatorId?: number,
        @QueryParams('creatorType', Number) creatorType?: number,
    ) {
        if (!model.game.GameSortOptions[sortBy]) {
            throw new this.BadRequest('InvalidSortBy');
        }
        if (!model.game.GameGenres[genre]) {
            throw new this.BadRequest('InvalidGenre');
        }
        if (typeof creatorType === 'number' && !model.catalog.creatorType[creatorType]) {
            throw new this.BadRequest('InvalidCreatorType');
        }
        // Filter through sort options, seeing which one was chosen
        let creatorConstraint: model.game.GameSearchCreatorConstraint|undefined = undefined;
        if (typeof creatorType === 'number' && typeof creatorId === 'number') {
            creatorConstraint = new model.game.GameSearchCreatorConstraint;
            creatorConstraint.creatorId = creatorId;
            creatorConstraint.creatorType = creatorType;
        }
        let sortCol = '';
        let sortMode: 'asc'|'desc' = 'desc';
        if (sortBy === model.game.GameSortOptions.Featured) {
            // Featured sort (subject to change at any time)
            // TODO: revise this to something more specific
            // like a player_count and visit_count join or something? or a custom column is_featured?
            sortCol = 'player_count';
        } else if (sortBy === model.game.GameSortOptions['Top Players']) {
            // Top players sort (pretty easy; sorted by most to least players)
            sortCol = 'player_count';
        } else if (sortBy === model.game.GameSortOptions['Recently Updated']) {
            // Sort by most recently updated
            sortCol = 'updated_at';
        } else {
            // No sort specified (or invalid), so error
            throw new this.BadRequest('InvalidSortBy');
        }
        // Grab results
        // Return results
        return await this.game.getGames(offset, limit, sortMode, sortCol, genre, creatorConstraint);
    }

    @Get('/:gameId/info')
    @Summary('Get game info')
    @Returns(200, { type: model.game.GameInfo })
    public async getGameInfo(
        @PathParams('gameId', Number) gameId: number,
    ) {
        return await this.game.getInfo(gameId);
    }

    @Get('/metadata')
    @Summary('Get games metaData for current user')
    @Use(YesAuth)
    public async getMetaData(
        @Locals('userInfo') userInfo: model.user.UserInfo,
    ) {
        let canPlayGames = true; // default
        /*
        let canCreateGames = false; // default
        if (userInfo.staff >= 1) {
            canCreateGames = true;
        }

        if (!canCreateGames) {
            let devStatus = await this.user.getInfo(userInfo.userId, ['isDeveloper']);
            if (devStatus.isDeveloper === 1) {
                canCreateGames = true;
            }
        }
        */
        let canCreateGames = true; // yeah
        return {
            canPlayGames: canPlayGames,
            canCreateGames: canCreateGames,
        }
    }

    @Get('/:gameId/thumbnail')
    @Summary('Get a game thumbnail')
    @Description('If no thumbnail available, a placeholder will be provided')
    @Returns(200, { type: model.game.GameThumbnail })
    public async getGameThumbnail(
        @PathParams('gameId', Number) gameId: number,
    ) {
        return await this.game.getGameThumbnail(gameId);
    }

    @Get('/thumbnails')
    @Summary('Multi-get thumbnails by CSV of gameIds')
    @Description('Invalid IDs will be filtered out')
    @ReturnsArray(200, { type: model.game.GameThumbnail })
    @Use(middleware.ConvertIdsToCsv)
    public async multiGetGameThumbnails(
        @Required()
        @QueryParams('ids') gameIds: number[],
    ) {
        return await this.game.multiGetGameThumbnails(gameIds);
    }

    @Get('/edit-mode/:gameId/map')
    @Summary('Get un-obfuscated game map')
    @Returns(200, {type: String})
    @Use(middleware.YesAuth)
    public async getOriginalMap(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
    ) {
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        } catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === model.catalog.creatorType.User) {
            if (gameInfo.creatorId === userInfo.userId) {
                const map = await this.game.getGameMap(gameId);
                return (await this.game.getMapContent(map.scriptUrl)).toString()
            }
        }else if (gameInfo.creatorType === model.catalog.creatorType.Group) {
            let groupData = await this.group.getUserRole(gameInfo.creatorId, userInfo.userId);
            if (groupData.permissions.manage) {
                const map = await this.game.getGameMap(gameId);
                return (await this.game.getMapContent(map.scriptUrl)).toString()
            }
        }else{
            throw new this.Conflict('NotImplemented');
        }
        throw new this.Conflict('InvalidPermissions');
    }

    @Get('/auth/client/decode')
    @Summary('Decode game auth code')
    public async decodeGameAuth(
        @Required()
        @QueryParams('code', String) authCode: string,
    ) {
        // verify auth code
        let verifyAuthCode = await this.auth.decodeGameAuthCode(authCode);
        if (!moment().add(15, 'seconds').isSameOrAfter(verifyAuthCode.iat * 1000)) {
            throw new Error('InvalidAuthCode');
        }
        return verifyAuthCode;
    }

    @Get('/auth/client/generate')
    @Summary('Generate game auth code')
    @Use(middleware.YesAuth)
    public async generateGameAuth(
        @Locals('userInfo') userInfo: model.UserSession,
    ) {
        return await this.auth.generateGameAuthCode(userInfo.userId, userInfo.username);
    }

    @Get('/edit-mode/:gameId/scripts')
    @Summary('Get un-obfuscated game scripts')
    @ReturnsArray(200, {type: model.game.OriginalScriptData})
    @Use(middleware.YesAuth)
    public async getOriginalScripts(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
    ) {
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        } catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.creatorType === model.catalog.creatorType.User) {
            if (gameInfo.creatorId === userInfo.userId) {
                const scripts: any[] = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
                for (const script of scripts) {
                    script.content = await this.game.getScriptContent(script.scriptUrl);
                    script.content = script.content.toString();
                }
                return scripts;
            }
        }else if (gameInfo.creatorType === model.catalog.creatorType.Group) {
            let groupData = await this.group.getUserRole(gameInfo.creatorId, userInfo.userId);
            if (groupData.permissions.manage) {
                const scripts: any[] = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
                for (const script of scripts) {
                    script.content = await this.game.getScriptContent(script.scriptUrl);
                    script.content = script.content.toString();
                }
                return scripts;
            }
        }else{
            throw new this.Conflict('NotImplemented');
        }
        throw new this.Conflict('InvalidPermissions');
    }

    @Get('/:gameId/map')
    @Summary('Get the map of a {gameId}. Authentication required')
    @Returns(200, { type: String })
    @Use(GameAuth)
    public async getMap(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @Res() res: Res,
        @Req() req: Req,
    ) {
        let origin = req.header('origin');
        res.set('access-control-allow-origin', origin);
        res.set('access-control-allow-credentials', 'false');
        // Confirm Exists
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        } catch (e) {
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.Conflict('InvalidGameState');
        }
        // Game Exists, so grab map/content
        const map = await this.game.getGameMap(gameId);
        const mapContent = await this.game.getMapContent(map.scriptUrl);
        // Return encrypted/obfuscated
        return await services.encryptScript.async.encryptAndObfuscateScript(mapContent.toString());
    }

    @Get('/:gameId/scripts')
    @Summary('Get a game\'s client scripts.')
    @Use(GameAuth)
    public async getClientScripts(
        @PathParams('gameId', Number) gameId: number,
        @Res() res: Res,
        @Req() req: Req,
    ): Promise<string> {
        let origin = req.header('origin');
        res.set('access-control-allow-origin', origin);
        res.set('access-control-allow-credentials', 'false');
        // Confirm Exists
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        } catch (e) {
            console.error('error grabbing game info: ' + e);
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.Conflict('InvalidGameState');
        }
        // Game Exists, so grab map/content
        const scripts = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
        let scriptString = '';
        for (const script of scripts) {
            const content = (await this.game.getScriptContent(script.scriptUrl)).toString();
            scriptString = scriptString + '\n' + content;
        }
        return await services.encryptScript.async.encryptAndObfuscateScript(scriptString);
    }

    /**
     * Create a Game
     */
    @Post('/create')
    @Summary('Create a game')
    @Returns(409, { type: model.Error, description: 'GameDeveloperPermissionsRequired: User requires game dev permission\n' })
    @Returns(400, { type: model.Error, description: 'TooManyGames: User has reached max games count\nInvalidNameOrDescription: Name must be between 1 and 32 characters; description must be less than 512 characters\n' })
    @Use(csrf, YesAuth, middleware.game.ValidateGameCreationPermissions)
    public async createGame(
        @Locals('userInfo') userInfo: model.UserSession,
        @BodyParams('name', String) gameName: string,
        @BodyParams('description', String) gameDescription: string
    ) {
        const games = await this.game.countGames(userInfo.userId, model.catalog.creatorType.User);
        if (games >= 5) {
            // Too many places
            throw new this.BadRequest('TooManyGames');
        }
        if (gameName.length >= 32 || gameName.length < 1 || gameDescription.length >= 512) {
            throw new this.BadRequest('InvalidNameOrDescription');
        }
        // Create game
        const gameId = await this.game.create(userInfo.userId, model.catalog.creatorType.User, gameName, gameDescription);
        // Create thumbnail
        await this.game.createGameThumbnail(gameId, 'https://cdn.blockshub.net/game/default_assets/Screenshot_5.png', model.game.GameThumbnailModerationStatus.Approved);
        // Return success
        return {
            success: true,
            gameId: gameId,
        };
    }

    private async verifyOwnership(userInfo: model.UserSession, gameId: number): Promise<model.game.GameInfo> {
        const gameInfo = await this.game.getInfo(gameId);
        if (gameInfo.creatorType === 1) {
            // temporary
            throw new Error('Game is not of valid creator type');
        }
        if (gameInfo.creatorType === 0 && gameInfo.creatorId !== userInfo.userId) {
            throw new this.BadRequest('InvalidPermissions');
        }
        return gameInfo;
    }

    /**
     * Update a Game
     */
    @Patch('/:gameId')
    @Summary('Update a game')
    @Returns(400, { type: model.Error, description: 'InvalidNameOrDescription: Name must be between 1 and 32 characters; description can be at most 512 characters\nInvalidMaxPlayers: Must be between 1 and 10\nInvalidGenre: Please specify a valid model.game.GameGenres\n' })
    @Use(csrf, YesAuth, middleware.game.ValidateGameCreationPermissions)
    public async updateGame(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @BodyParams('name', String) gameName: string,
        @BodyParams('description', String) gameDescription: string,
        @BodyParams('maxPlayers', Number) maxPlayers: number,
        @BodyParams('genre', Number) genre: number,
    ): Promise<{ success: true }> {
        await this.verifyOwnership(userInfo, gameId);
        if (gameName.length >= 32 || gameName.length < 1 || gameDescription.length >= 512) {
            throw new this.BadRequest('InvalidNameOrDescription');
        }
        if (maxPlayers < 1 || maxPlayers > 10) {
            throw new this.BadRequest('InvalidMaxPlayers');
        }
        // verify genre
        if (!model.game.GameGenres[genre]) {
            throw new this.BadRequest('InvalidGenre');
        }
        // Update
        await this.game.updateGameInfo(gameId, gameName, gameDescription, maxPlayers, genre);
        // OK
        return {
            success: true,
        };
    }

    @Patch('/:gameId/map')
    @Summary('Update the map script of a {gameId}')
    @Use(csrf, YesAuth, middleware.game.ValidateGameCreationPermissions)
    public async updateMapScript(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @BodyParams('script', String) newScriptContent: string
    ) {
        // Verify Ownership
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        // Grab Map Script
        const scriptName = await this.game.getGameMap(gameId);
        // Upload It
        await this.game.uploadMap(newScriptContent, scriptName.scriptUrl);
        // OK
        return {
            success: true,
        };
    }

    @Delete('/:gameId/script/:scriptId')
    @Summary('Delete a game script')
    @Use(csrf, YesAuth, middleware.game.ValidateGameCreationPermissions)
    public async deleteScript(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @PathParams('scriptId', Number) scriptId: number
    ): Promise<{ success: true }> {
        // Verify Ownership
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const scriptInfo = await this.game.getGameScript(scriptId);
        if (!scriptInfo || scriptInfo.gameId !== gameInfo.gameId) {
            throw new this.BadRequest('InvalidScriptId');
        }
        // Delete From DB
        await this.game.deleteGameScript(scriptId);
        // Delete Actual File
        await this.game.deleteScript(scriptInfo.scriptUrl);
        // Return OK
        return {
            success: true,
        };
    }

    @Post('/:gameId/script/client')
    @Summary('Create a client script')
    @Use(csrf, YesAuth, middleware.game.ValidateGameCreationPermissions)
    public async createClientScript(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @BodyParams('script', String) scriptContent: string
    ): Promise<{ success: true }> {
        // Verify Ownership
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const existingScripts = await this.game.getGameScripts(gameId, model.game.ScriptType.client);
        if (existingScripts.length >= 10) {
            throw new this.BadRequest('TooManyScripts');
        }
        // Add Content
        const scriptUrl = await this.game.uploadScript(scriptContent);
        // Add to DB
        const scriptId = await this.game.createScript(gameId, model.game.ScriptType.client, scriptUrl);
        // Ok
        return {
            success: true,
        };
    }

    @Post('/:gameId/script/server')
    @Summary('Create a server script')
    @Use(csrf, YesAuth, middleware.game.ValidateGameCreationPermissions)
    public async createServerScript(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @BodyParams('script', String) scriptContent: string
    ): Promise<{ success: true }> {
        // Verify Ownership
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const existingScripts = await this.game.getAllGameScripts(gameId);
        if (existingScripts.length >= 10) {
            throw new this.BadRequest('TooManyScripts');
        }
        // Add Content
        const scriptUrl = await this.game.uploadScript(scriptContent);
        // Add to DB
        const scriptId = await this.game.createScript(gameId, model.game.ScriptType.server, scriptUrl);
        // Ok
        return {
            success: true,
        };
    }

    @Patch('/:gameId/script/:scriptId')
    @Summary('Update a script')
    @Use(csrf, YesAuth, middleware.game.ValidateGameCreationPermissions)
    public async updateScriptContent(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number,
        @BodyParams('script', String) scriptContent: string,
        @PathParams('scriptId', Number) scriptId: number
    ): Promise<{ success: true }> {
        // Verify Ownership
        const gameInfo = await this.verifyOwnership(userInfo, gameId);
        const scriptInfo = await this.game.getGameScript(scriptId);
        if (!scriptInfo || scriptInfo.gameId !== gameInfo.gameId) {
            throw new Error('InvalidScriptId');
        }
        // Update
        await this.game.uploadScript(scriptContent, scriptInfo.scriptUrl);
        // OK
        return {
            success: true,
        };
    }

    @Post('/:gameId/join')
    @Summary('Join a game')
    @Returns(400, { type: model.Error, description: 'InvalidGameState: Game state does not allow joining\n' })
    public async requestGameJoin(
        @Locals('userInfo') userInfo: model.UserSession,
        @PathParams('gameId', Number) gameId: number
    ): Promise<{ success: true; serverId: number }> {
        //  Check if game is valid
        const gameInfo = await this.game.getInfo(gameId, ['maxPlayers', 'gameState']);
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.BadRequest('InvalidGameState');
        }
        let gameServerId;
        // Kick out of existing game (if any)
        await this.game.leaveServer(userInfo.userId).catch((e) => { console.error(e) })
        // Grab Servers
        const servers = await this.game.getOpenServersForGame(gameId, gameInfo.maxPlayers);
        if (servers.length === 0) {
            // No servers, so create one
            gameServerId = await this.game.createGameServer(gameId);
        } else {
            const serverToJoin = servers[0];
            // Return
            gameServerId = serverToJoin.gameServerId;
        }
        // Join the Server
        await this.game.joinServer(userInfo.userId, gameServerId);
        // Increment Visit Count
        await this.game.incrementVisitCount(gameId);
        // Return Info
        return {
            success: true,
            serverId: gameServerId,
        };
    }

    /**
     * Grab Server Events Listener
     * @param gameServerId 
     */
    public async listenForServerEvents(
        gameServerId: number
    ): Promise<Redis> {
        return await this.game.listenForServerEvents(gameServerId);
    }

    /**
     * Leave all games
     */
    public async leaveAllGames(
        userInfo: model.user.UserInfo,
    ): Promise<{ success: true }> {
        // Kick out of existing game (if any)
        await this.game.leaveServer(userInfo.userId).catch((e) => { })
        // OK
        return {
            success: true,
        };
    }
}


/**
 * yeah this is really fucking ugly but till someone has a better idea, its goin' here
 * -beak
 */
/**
 * WSS Route
 */
wss.on('connection', async function connection(ws: any, req: any, authCode: { userId: number; username: string; }) {
    if (req.url !== '/game-sockets/websocket.aspx') {
        // someone elses job
        return;
    }
    console.log(authCode);
    console.log('connection started');
    // If no session, close
    if (!authCode) {
        console.log('no session');
        ws.close();
        return;
    }
    // Setup Listener
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
    let listener: Redis;
    const setupListenForGameServerEvents = async (serverId: number): Promise<void> => {
        if (listenerSetup === true) {
            ws.close(); // Double connection issue;
            return;
        }
        listenerSetup = true;
        // Setup Listener
        listener = await new GameController().listenForServerEvents(serverId);
        // Pub events to client
        listener.on('message', (channel, message): void => {
            ws.send(message);
        });
    }
    ws.on('close', async () => {
        console.log('Ws Closed');
        // Disconnect
        await new GameController().leaveAllGames(context.UserInfo as any);
        if (listener) {
            listener.disconnect();
        }
    });
    // On message
    ws.on('message', async function incoming(ev: string) {
        console.log('ws message recieved');
        let data;
        try {
            data = JSON.parse(ev);
        } catch{
            // Error parsing data. Ignore for now...
            return;
        }
        if (data.cmd && data.cmd === 'join') {
            const id = data.gameId;
            const serverId = await new GameController().requestGameJoin(context.UserInfo as any, id);
            // Send ID
            ws.send(JSON.stringify(serverId));
            // Setup Listener for Events
            setupListenForGameServerEvents(serverId.serverId);
        }
    });
});