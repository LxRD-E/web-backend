/**
 * Imports
 */
// libraries
import jsObfuse = require('javascript-obfuscator');
/**
 * **warning** this library is insecure. see issue #1
 * @deprecated
 */
import SimpleCrypto from "simple-crypto-js";

// models
import * as model from '../../models/models';

import controller from '../controller';
import { QueryParams, Get, Controller, PathParams, Use, Locals, Res, Post, BodyParams, Patch, Delete, Required } from '@tsed/common';
import { Summary, ReturnsArray, Returns, Description } from '@tsed/swagger';
import { YesAuth, NoAuth, GameAuth } from '../../middleware/Auth';
import { csrf } from '../../dal/auth';
/**
 * this is purely used for typings. please access directly from dal instead of here
 */
import { Redis } from 'ioredis';
import { wss } from '../../start/websockets';

import config from '../../helpers/config';
const GAME_KEY = config.encryptionKeys.game;

const allowedDomains = [] as string[];
if (process.env.NODE_ENV === 'development') {
    allowedDomains.push(
        'http://localhost/',
        'http://localhost:3000/',
        'http://localhost',
        'http://localhost:3000',
    );
} else {
    allowedDomains.push(
        'https://hindigamer.club/',
        'https://www.hindigamer.club/',
        'https://www.hindigamer.club',
        'https://hindigamer.club',
    );
}


const scriptOptions = {
    transformObjectKeys: true,
    debugProtection: true,
    compact: true,
    log: false,
    sourceMap: false,
    rotateStringArray: true,
    selfDefending: true,
    stringArray: true,
    stringArrayEncoding: 'rc4' as any, // eslint-disable-line
    stringArrayThreshold: 1,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.8,
    renameGlobals: true,

    // these break stuff for some reason ... not really important anyway though (except the domainlock part ;-;)

    // disableConsoleOutput: true,
    domainLock: allowedDomains,
};

const COPYRIGHT_DISCLAIMER = `/**
 * Copyright (c) Hindi Gamer Club - All Rights Reserved
 * Unauthorized copying of this file, via any medium, is strictly prohibited.
 * You are not allowed to copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.
 * This software includes various open-source libraries which have licenses provided where relevent and required.
 * View our full terms of service here: https://hindigamer.club/terms
 */`;
let simpleCryptoData = model.game.getSimpleCrypto();

// todo: move this to an aws bucket or something...
const script = jsObfuse.obfuscate(`
        (function() {
            ${simpleCryptoData.lib}

            const gameAuthCode = $('#gamedata').attr('data-authcode');

            /**
            * Game Data
            */
            const gamedata = document.getElementById('gamedata');
            if (!gamedata) {
                window.location.href = "/game/error";
            }
            const gameId = parseInt(gamedata.getAttribute('data-gameid'), 10);
            if (!gameId || isNaN(gameId)) {
                window.location.href = "/game/error";
            }
            let gameServerId = 0;

                // Join Game

                let wsurl = "wss://"+window.location.host+"/game-sockets/websocket.aspx";
                if (window.location.host.slice(0,9) === 'localhost') {
                    wsurl = "ws://localhost:8080/game-sockets/websocket.aspx";
                }


                var isTrying = false;
                function attemptRetry(closeEvent) {
                    if (!isTrying) {
                        isTrying = true;
                        setTimeout(function() {
                            setupListen();
                            isTrying = false;
                        }, 1500);
                    }
                }

                function handleWsMessage(event) {

                }

                function setupListen() {
                        var sock = new WebSocket(wsurl+'?gameAuth='+gameAuthCode);
                        sock.onmessage = function (event) {
                            handleWsMessage(event)
                        }
                        sock.onopen = function(event) {
                            handleWsMessage(event)
                            // Connect to game
                            sock.send(JSON.stringify({
                                cmd: 'join',
                                gameId: gameId,
                            }));
                        }
                        sock.onclose = function(event) {
                            alert('Connection to the Game Server has been lost.');
                            window.location.reload();
                        }
                        sock.onerror = function(event) {
                            alert('Connection to the Game Server has been lost.');
                            window.location.reload();
                        }
                        window.onbeforeunload = function () {
                            sock.close();
                        }
                }
                setupListen()

                /*
            request('/game/'+gameId+'/join?authCode='+gameAuthCode, 'POST', JSON.stringify({}))
                .then((d) => {
                    gameServerId = d.serverId;
                    // Setup WSS here
                }).catch((e) => {
                    alert(e.responseJSON.message);
                    window.location.href = "/";
                });
                */
            
            /**
                * Global Babylon Vars
                */
            BABYLON.OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY = false;
            BABYLON.OBJFileLoader.OPTIMIZE_WITH_UV = true;
            
            // Converts from degrees to radians.
            Math.radians = function(degrees) {
                return degrees * Math.PI / 180;
            };
            
            // Converts from radians to degrees.
            Math.degrees = function(radians) {
                return radians * 180 / Math.PI;
            };
            
            function rotateVector(vect, quat) {
                var matr = new BABYLON.Matrix();
                quat.toRotationMatrix(matr);
                var rotatedvect = BABYLON.Vector3.TransformCoordinates(vect, matr);
                return rotatedvect;
            }
            
            window.addEventListener('DOMContentLoaded', function() {
                // Canvas
                var canvas = document.getElementById('renderCanvas');
                // Game Engine
                var engine = new BABYLON.Engine(canvas, true);
                // Create Scene
                var createScene = function () {
                    var scene = new BABYLON.Scene(engine);
                    // Use Right Handed (since I believe it's what blender uses)
                    scene.useRightHandedSystem = true;
            
                    var gravityVector = new BABYLON.Vector3(0, -9.81, 0);
                    var physicsPlugin = new BABYLON.CannonJSPlugin();
                    scene.enablePhysics(gravityVector, physicsPlugin);
                    // Setup Player Camera
                    var camera = new BABYLON.ArcRotateCamera("Camera", Math.PI / 4, Math.PI / 6, 45, new BABYLON.Vector3(0, 10, -10), scene);
                    camera.maxZ = 100000;
                    camera.angularSensibilityX = 2500;
                    camera.angularSensibilityY = 2500;
                    camera.panningSensibility = 2500;
                    camera.checkCollisions = true;
                    camera.wheelPrecision = 10;
                    camera.useInputToRestoreState = true;
            
                    camera.allowUpsideDown = false;
                    // Attach the camera to the canvas.
                    camera.attachControl(canvas, false);
                    camera.useBouncingBehavior = false;
                    camera.useAutoRotationBehavior = false;
                    camera.useFramingBehavior = false;
                
                    // Create a basic light, aiming 0,1,0 - meaning, to the sky.
                    var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
                    light.intensity = 1;
            
                    // Skybox
                    var skybox = BABYLON.Mesh.CreateBox("BackgroundSkybox", 2048, scene, undefined, BABYLON.Mesh.BACKSIDE);
                
                    // Create and tweak the background material.
                    var backgroundMaterial = new BABYLON.BackgroundMaterial("backgroundMaterial", scene);
                    backgroundMaterial.reflectionTexture = new BABYLON.CubeTexture("https://cdn.hindigamer.club/game/default_assets/TropicalSunnyDay", scene);
                    backgroundMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
                    skybox.material = backgroundMaterial;
                
                    
                    // ... 
                    // IMPORT MAP HERE

                    fetch('/api/v1/game/'+gameId+'/map?authCode='+gameAuthCode, {credentials: 'omit', mode: 'cors'}).then((d) => {
                        return d.text();
                    }).then((d) => {
                        Function(new ${simpleCryptoData.name}(\`${GAME_KEY}\`).decrypt(d))(scene);
                    });

                    fetch('/api/v1/game/'+gameId+'/scripts?authCode='+gameAuthCode, {credentials: 'omit',  mode: 'cors'}).then((d) => {
                            return d.text();
                        }).then((d) => {
                            Function(new ${simpleCryptoData.name}(\`${GAME_KEY}\`).decrypt(d))(scene);
                        });
            
                    // ... 
                
                    // Return the created scene.
                    return scene;
                };
                var scene = createScene();
                engine.runRenderLoop(function() {
                    scene.render();
                });
                window.addEventListener('resize', function() {
                    engine.resize();
                });
            });
        })()
    `, scriptOptions);
let code = COPYRIGHT_DISCLAIMER + '\n' + script.getObfuscatedCode();

/**
 * Game Controller
 */
@Controller('/game')
export default class GameController extends controller {

    /**
     * Search Games
     * @param offset 
     * @param limit 
     * @param sort 
     */
    @Get('/search')
    @Summary('Get all games')
    @ReturnsArray(200, { type: model.game.GameSearchResult })
    public async getGames(
        @QueryParams('offset', Number) offset: number = 0,
        @QueryParams('limit', Number) limit: number = 25,
        @QueryParams('sortBy', Number) sortBy: number = 1,
        @QueryParams('genre', Number) genre: number = 1,
    ) {
        if (!model.game.GameSortOptions[sortBy]) {
            throw new this.BadRequest('InvalidSortBy');
        }
        let games: model.game.GameSearchResult[];
        // Filter through sort options, seeing which one was chosen

        // Featured sort (subject to change at any time)
        if (sortBy === model.game.GameSortOptions.Featured) {
            // TODO: revise this to something more specific
            games = await this.game.getGames(offset, limit, 'desc', 'player_count', genre);
            // Top players sort (pretty easy; sorted by most to least players)
        } else if (sortBy === model.game.GameSortOptions['Top Players']) {
            games = await this.game.getGames(offset, limit, 'desc', 'player_count', genre);
            // Sort by most recently updated
        } else if (sortBy === model.game.GameSortOptions['Recently Updated']) {
            games = await this.game.getGames(offset, limit, 'desc', 'updated_at', genre);
            // No sort specified, so error
        } else {
            throw new this.BadRequest('InvalidSortBy');
        }
        // Return results
        return games;
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
    public async multiGetGameThumbnails(
        @Required()
        @QueryParams('ids', String) gameIds: string,
    ) {
        if (!gameIds) {
            throw new this.BadRequest('InvalidIds');
        }
        const idsArray = gameIds.split(',');
        if (idsArray.length < 1) {
            throw new this.BadRequest('InvalidIds');
        }
        const filteredIds: Array<number> = [];
        let allIdsValid = true;
        idsArray.forEach((id) => {
            const gameId = parseInt(id, 10) as number;
            if (!Number.isInteger(gameId)) {
                allIdsValid = false
            }
            filteredIds.push(gameId);
        });
        const safeIds = Array.from(new Set(filteredIds));
        if (safeIds.length > 25) {
            throw new this.BadRequest('TooManyIds');
        }
        let results = await this.game.multiGetGameThumbnails(safeIds);
        return results;
    }

    /**
     * Get the Map of a Game ID
     * @param gameId 
     */
    @Get('/:gameId/map')
    @Summary('Get the map of a {gameId}. Authentication required')
    @Returns(200, { type: String })
    @Use(GameAuth)
    public async getMap(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @PathParams('gameId', Number) gameId: number,
        @Res() res: Res,
    ) {
        res.set('access-control-allow-origin', 'null');
        res.set('access-control-allow-credentials', 'false');
        // Confirm Exists
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        } catch (e) {
            console.log(e);
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.Conflict('InvalidGameState');
        }
        // Game Exists, so grab map/content
        const map = await this.game.getGameMap(gameId);
        const mapContent = await this.game.getMapContent(map.scriptUrl);
        const script = jsObfuse.obfuscate(`
            (function(scene){
                // Script Goes Here

                ${mapContent}

                // End Script
            })();
            `, scriptOptions);
        return new SimpleCrypto(GAME_KEY).encrypt(script.getObfuscatedCode());
    }

    /**
     * Get the Map of a Game ID
     * @param gameId 
     */
    @Get('/:gameId/scripts')
    @Summary('Get a game\'s client scripts.')
    @Use(GameAuth)
    public async getClientScripts(
        @PathParams('gameId', Number) gameId: number,
        @Res() res: Res,
    ): Promise<string> {
        res.set('access-control-allow-origin', 'null');
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
            const content = await this.game.getScriptContent(script.scriptUrl);
            scriptString = scriptString + '\n' + content;
        }
        const script = jsObfuse.obfuscate(`
            (function(scene){
                // Script Goes Here

                ${scriptString}

                // End Script
            })();
            `, scriptOptions);
        return new SimpleCrypto(GAME_KEY).encrypt(script.getObfuscatedCode());
    }

    /**
     * Get Primary Client Script
     */
    @Get('/client.js')
    @Summary('Get the primary game client.js')
    @Use(NoAuth)
    public async getClientScript(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @Res() res: Res,
    ) {
        res.set({ 'content-type': 'application/javascript' });
        res.set({ 'content-length': code.length });
        res.send(code);
    }

    /**
     * Create a Game
     */
    @Post('/create')
    @Use(csrf, YesAuth)
    @Summary('Create a game')
    @Returns(409, { type: model.Error, description: 'InvalidPermissions: User must be staff rank 1 or higher\n' })
    @Returns(400, { type: model.Error, description: 'TooManyGames User has created 5 games already\nInvalidNameOrDescription: Name must be between 1 and 32 characters; description must be less than 512 characters\n' })
    @Use(csrf, YesAuth)
    public async createGame(
        @Locals('userInfo') userInfo: model.user.UserInfo,
        @BodyParams('name', String) gameName: string,
        @BodyParams('description', String) gameDescription: string
    ) {
        // Verify has perms
        const info = await this.user.getInfo(userInfo.userId, ['staff']);
        if (info.staff >= 1 !== true) {
            throw new this.Conflict('InvalidPermissions');
        }
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
        await this.game.createGameThumbnail(gameId, 'https://cdn.hindigamer.club/game/default_assets/Screenshot_5.png', model.game.GameThumbnailModerationStatus.Approved);
        // Return success
        return {
            success: true,
            gameId: gameId,
        };
    }

    private async verifyOwnership(userInfo: model.user.UserInfo, gameId: number): Promise<model.game.GameInfo> {
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
    @Use(csrf, YesAuth)
    public async updateGame(
        @Locals('userInfo') userInfo: model.user.UserInfo,
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

    /**
     * Update a Map Script
     * @param gameId 
     * @param newScriptContent 
     */
    @Patch('/:gameId/map')
    @Summary('Update the map script of a {gameId}')
    @Use(csrf, YesAuth)
    public async updateMapScript(
        @Locals('userInfo') userInfo: model.user.UserInfo,
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

    /**
     * Delete a Game's Script
     * @param gameId 
     * @param scriptId 
     */
    @Delete('/:gameId/script/:scriptId')
    @Summary('Delete a game script')
    @Use(csrf, YesAuth)
    public async deleteScript(
        @Locals('userInfo') userInfo: model.user.UserInfo,
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

    /**
     * Create a Client Script
     * @param gameId 
     * @param scriptContent 
     */
    @Post('/:gameId/script/client')
    @Summary('Create a client script')
    @Use(csrf, YesAuth)
    public async createClientScript(
        @Locals('userInfo') userInfo: model.user.UserInfo,
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

    /**
     * Create a Server Script
     * @param gameId 
     * @param scriptContent 
     */
    @Post('/:gameId/script/server')
    @Summary('Create a server script')
    @Use(csrf, YesAuth)
    public async createServerScript(
        @Locals('userInfo') userInfo: model.user.UserInfo,
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

    /**
     * Update a Script Content
     * @param gameId 
     * @param scriptContent 
     * @param scriptId 
     */
    @Patch('/:gameId/script/:scriptId')
    @Summary('Update a script')
    @Use(csrf, YesAuth)
    public async updateScriptContent(
        @Locals('userInfo') userInfo: model.user.UserInfo,
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

    /**
     * Join a Game
     * @param gameId 
     */
    @Post('/:gameId/join')
    @Summary('Join a game')
    @Returns(400, { type: model.Error, description: 'InvalidGameState: Game state does not allow joining\n' })
    public async requestGameJoin(
        @Locals('userInfo') userInfo: model.user.UserInfo,
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
        const listener = await this.game.listenForServerEvents(gameServerId);
        return listener;
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
wss.on('connection', async function connection(ws, req: any, authCode: { userId: number; username: string; }) {
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