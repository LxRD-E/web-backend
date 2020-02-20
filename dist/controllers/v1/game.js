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
const jsObfuse = require("javascript-obfuscator");
const simple_crypto_js_1 = require("simple-crypto-js");
const websockets_1 = require("../../start/websockets");
const config_1 = require("../../helpers/config");
const GAME_KEY = config_1.default.encryptionKeys.game;
const model = require("../../models/models");
const allowedDomains = [];
if (process.env.NODE_ENV === 'development') {
    allowedDomains.push('http://localhost/');
}
else {
    allowedDomains.push('https://hindigamer.club/', 'https://www.hindigamer.club/');
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
    stringArrayEncoding: 'rc4',
    stringArrayThreshold: 1,
};
const controller_1 = require("../controller");
const common_1 = require("@tsed/common");
const swagger_1 = require("@tsed/swagger");
const Auth_1 = require("../../middleware/Auth");
const auth_1 = require("../../dal/auth");
let GameController = class GameController extends controller_1.default {
    async getGames(offset = 0, limit = 25, sort = 'asc') {
        const games = await this.game.getGames(offset, limit, sort);
        return games;
    }
    async getMap(userInfo, gameId) {
        let gameInfo;
        try {
            gameInfo = await this.game.getInfo(gameId);
        }
        catch (e) {
            console.log(e);
            throw new this.BadRequest('InvalidGameId');
        }
        if (gameInfo.gameState !== model.game.GameState.public) {
            throw new this.Conflict('InvalidGameState');
        }
        const map = await this.game.getGameMap(gameId);
        const mapContent = await this.game.getMapContent(map.scriptUrl);
        const script = jsObfuse.obfuscate(`
            (function(scene){
                // Script Goes Here

                ${mapContent}

                // End Script
            })();
            `, scriptOptions);
        return new simple_crypto_js_1.default(GAME_KEY).encrypt(script.getObfuscatedCode());
    }
    async getClientScripts(gameId) {
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
        return new simple_crypto_js_1.default(GAME_KEY).encrypt(script.getObfuscatedCode());
    }
    async getClientScript(userInfo, res) {
        const script = jsObfuse.obfuscate(`
        /**
        * Game Data
        */
        const gamedata = document.getElementById('gamedata');
        if (!gamedata) {
            window.location.href = "/game-error";
        }
        const gameId = parseInt(gamedata.getAttribute('data-gameid'), 10);
        if (!gameId || isNaN(gameId)) {
            window.location.href = "/game-error";
        }
        let gameServerId = 0;

            // Join Game

            let wsurl = "wss://"+window.location.host+"/game-sockets/websocket.aspx";
            if (window.location.host.slice(0,9) === 'localhost') {
                wsurl = "ws://localhost:8080/game-sockets/websocket.aspx";
            }
            function getCsrf() {
                // For now, since the ws connection can't validate csrf tokens, we have to make this request which will result in a csrf validation error. 
                // 
                // In the future, I would probably like to look into either a) using a custom 'csrf'/'authentication' type system for ws connections, or an endpoint that returns a csrf token in the body/headers while returning '200 OK'
                return new Promise(function(res, rej) {
                    $.ajax({
                        type: "POST",
                        url: '/api/v1/chat/metadata',
                        data: '',
                        complete: function(xhr) {
                            res(xhr.getResponseHeader('X-CSRF-Token'));
                        },
            
                    });
                });
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
                getCsrf().then(function(csrf) {
                    var sock = new WebSocket(wsurl+'?csrf='+csrf);
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
                });
            }
            setupListen()

            /*
        request('/game/'+gameId+'/join', 'POST', JSON.stringify({}))
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

                fetch('/api/v1/game/'+gameId+'/map', {credentials: 'include'}).then((d) => {
                    return d.text();
                }).then((d) => {
                    Function(new SimpleCrypto(\`${GAME_KEY}\`).decrypt(d))(scene);
                });

                fetch('/api/v1/game/'+gameId+'/scripts', {credentials: 'include'}).then((d) => {
                        return d.text();
                    }).then((d) => {
                        Function(new SimpleCrypto(\`${GAME_KEY}\`).decrypt(d))(scene);
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
        });`, scriptOptions);
        res.set({ 'content-type': 'application/javascript' });
        res.send(script.getObfuscatedCode());
    }
    async createGame(userInfo, gameName, gameDescription) {
        const info = await this.user.getInfo(userInfo.userId, ['staff']);
        if (info.staff >= 1 !== true) {
            throw new this.Conflict('InvalidPermissions');
        }
        const games = await this.game.countGames(userInfo.userId, model.catalog.creatorType.User);
        if (games >= 5) {
            throw new this.BadRequest('TooManyGames');
        }
        if (gameName.length >= 32 || gameName.length < 1 || gameDescription.length >= 512) {
            throw new this.BadRequest('InvalidNameOrDescription');
        }
        const gameId = await this.game.create(userInfo.userId, model.catalog.creatorType.User, gameName, gameDescription);
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
    async updateGame(userInfo, gameId, gameName, gameDescription, maxPlayers) {
        await this.verifyOwnership(userInfo, gameId);
        if (gameName.length >= 32 || gameName.length < 1 || gameDescription.length >= 512) {
            throw new this.BadRequest('InvalidNameOrDescription');
        }
        if (maxPlayers < 1 || maxPlayers > 10) {
            throw new this.BadRequest('InvalidMaxPlayers');
        }
        await this.game.updateGameInfo(gameId, gameName, gameDescription, maxPlayers);
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
        const listener = await this.game.listenForServerEvents(gameServerId);
        return listener;
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
    swagger_1.ReturnsArray(200, { type: model.game.GameSearchResult }),
    __param(0, common_1.QueryParams('offset', Number)),
    __param(1, common_1.QueryParams('limit', Number)),
    __param(2, common_1.QueryParams('sort', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getGames", null);
__decorate([
    common_1.Get('/:gameId/map'),
    swagger_1.Summary('Get the map of a {gameId}. Authentication required'),
    swagger_1.Returns(200, { type: String }),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getMap", null);
__decorate([
    common_1.Get('/:gameId/scripts'),
    swagger_1.Summary('Get a game\'s client scripts.'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getClientScripts", null);
__decorate([
    common_1.Get('/client.js'),
    swagger_1.Summary('Get the primary game client.js'),
    common_1.Use(Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.Res()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Object]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "getClientScript", null);
__decorate([
    common_1.Post('/create'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    swagger_1.Summary('Create a game'),
    swagger_1.Returns(409, { type: model.Error, description: 'InvalidPermissions: User must be staff rank 1 or higher\n' }),
    swagger_1.Returns(400, { type: model.Error, description: 'TooManyGames User has created 5 games already\nInvalidNameOrDescription: Name must be between 1 and 32 characters; description must be less than 512 characters\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.BodyParams('name', String)),
    __param(2, common_1.BodyParams('description', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, String, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createGame", null);
__decorate([
    common_1.Patch('/:gameId'),
    swagger_1.Summary('Update a game'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidNameOrDescription: Name must be between 1 and 32 characters; description can be at most 512 characters\nInvalidMaxPlayers: Must be between 1 and 10\n' }),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('name', String)),
    __param(3, common_1.BodyParams('description', String)),
    __param(4, common_1.BodyParams('maxPlayers', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, String, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "updateGame", null);
__decorate([
    common_1.Patch('/:gameId/map'),
    swagger_1.Summary('Update the map script of a {gameId}'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "updateMapScript", null);
__decorate([
    common_1.Delete('/:gameId/script/:scriptId'),
    swagger_1.Summary('Delete a game script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.PathParams('scriptId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "deleteScript", null);
__decorate([
    common_1.Post('/:gameId/script/client'),
    swagger_1.Summary('Create a client script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createClientScript", null);
__decorate([
    common_1.Post('/:gameId/script/server'),
    swagger_1.Summary('Create a server script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "createServerScript", null);
__decorate([
    common_1.Patch('/:gameId/script/:scriptId'),
    swagger_1.Summary('Update a script'),
    common_1.Use(auth_1.csrf, Auth_1.YesAuth),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __param(2, common_1.BodyParams('script', String)),
    __param(3, common_1.PathParams('scriptId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number, String, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "updateScriptContent", null);
__decorate([
    common_1.Post('/:gameId/join'),
    swagger_1.Summary('Join a game'),
    swagger_1.Returns(400, { type: model.Error, description: 'InvalidGameState: Game state does not allow joining\n' }),
    __param(0, common_1.Locals('userInfo')),
    __param(1, common_1.PathParams('gameId', Number)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [model.user.UserInfo, Number]),
    __metadata("design:returntype", Promise)
], GameController.prototype, "requestGameJoin", null);
GameController = __decorate([
    common_1.Controller('/game')
], GameController);
exports.default = GameController;
websockets_1.wss.on('connection', async function connection(ws, req) {
    if (req.url !== '/game-sockets/websocket.aspx') {
        return;
    }
    console.log('connection started');
    const sess = req.session;
    if (!sess) {
        console.log('no session');
        ws.close();
        return;
    }
    const context = {
        'UserInfo': {
            'userId': sess.userdata.id,
            'username': sess.userdata.Username,
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
        console.log('ws messaged recieved');
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
