"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ioredis_pubsub_1 = require("../helpers/ioredis_pubsub");
const Game = require("../models/v1/game");
const config_1 = require("../helpers/config");
const _init_1 = require("./_init");
const models_1 = require("../models/models");
const aws = require("aws-sdk");
const crypto = require("crypto");
class GameDAL extends _init_1.default {
    async getInfo(id, specificColumns) {
        if (!specificColumns) {
            specificColumns = ['gameId', 'gameName', 'gameDescription', 'visitCount', 'playerCount', 'likeCount', 'dislikeCount', 'gameState', 'creatorId', 'creatorType', 'genre', 'createdAt', 'updatedAt'];
        }
        specificColumns.forEach((element, index, array) => {
            if (element === 'gameId') {
                array[index] = 'id as gameId';
            }
            else if (element === 'gameName') {
                array[index] = 'name as gameName';
            }
            else if (element === 'gameDescription') {
                array[index] = 'description as gameDescription';
            }
            else if (element === 'maxPlayers') {
                array[index] = 'max_players as maxPlayers';
            }
            else if (element === 'visitCount') {
                array[index] = 'visit_count as visitCount';
            }
            else if (element === 'playerCount') {
                array[index] = 'player_count as playerCount';
            }
            else if (element === 'likeCount') {
                array[index] = 'like_count as likeCount';
            }
            else if (element === 'dislikeCount') {
                array[index] = 'dislike_count as dislikeCount';
            }
            else if (element === 'gameState') {
                array[index] = 'game_state as gameState';
            }
            else if (element === 'creatorId') {
                array[index] = 'creator_id as creatorId';
            }
            else if (element === 'creatorType') {
                array[index] = 'creator_type as creatorType';
            }
            else if (element === 'createdAt') {
                array[index] = 'created_at as createdAt';
            }
            else if (element === 'updatedAt') {
                array[index] = 'updated_at as updatedAt';
            }
            else if (element === 'genre') {
                array[index] = 'genre';
            }
        });
        const gameInfo = await this.knex('game').select(specificColumns).where({ 'game.id': id });
        if (!gameInfo[0]) {
            throw new Error('The game specified does not exist.');
        }
        console.log("Query OK. Returning gameInfo...");
        return gameInfo[0];
    }
    async getGames(offset, limit, sortMode, sortByColumn, genre, creatorConstraint) {
        let games;
        let total;
        let extraWhereClause = {};
        if (creatorConstraint) {
            extraWhereClause.creator_id = creatorConstraint.creatorId;
            extraWhereClause.creator_type = creatorConstraint.creatorType;
        }
        let columnsToSelect = [
            'id as gameId',
            'name as gameName',
            'description as gameDescription',
            'player_count as playerCount',
            'visit_count as visitCount',
            'genre',
            'creator_type as creatorType',
            'creator_id as creatorId',
            'created_at as createdAt',
            'updated_at as updatedAt',
        ];
        if (genre === Game.GameGenres.Any) {
            games = await this.knex('game')
                .select(columnsToSelect)
                .limit(limit)
                .offset(offset)
                .orderBy(sortByColumn, sortMode)
                .where({
                'game_state': Game.GameState.public,
            }).andWhere(extraWhereClause);
            let _total = await this.knex('game').count('id as total').where({
                'game_state': Game.GameState.public,
            }).andWhere(extraWhereClause);
            total = _total[0]['total'];
        }
        else {
            games = await this.knex('game')
                .select(columnsToSelect)
                .limit(limit)
                .offset(offset)
                .orderBy(sortByColumn, sortMode)
                .where({
                'game_state': Game.GameState.public,
                'genre': genre,
            }).andWhere(extraWhereClause);
            let _total = await this.knex('game').count('id as total').where({
                'game_state': Game.GameState.public,
                'genre': genre,
            }).andWhere(extraWhereClause);
            total = _total[0]['total'];
        }
        return {
            total: total,
            data: games,
        };
    }
    async countGames(creatorId, creatorType) {
        const count = await this.knex('game').count('id as Total').where({ 'creator_id': creatorId, 'creator_type': creatorType });
        let total = count[0]['Total'];
        if (!total) {
            total = 0;
        }
        return total;
    }
    async create(creatorId, creatorType, gameName, gameDescription) {
        const gameId = await this.knex('game').insert({
            name: gameName,
            description: gameDescription,
            'creator_type': creatorType,
            'creator_id': creatorId,
        });
        const mapScriptName = await this.uploadMap(`// Create a simple Ground shape
var ground = BABYLON.MeshBuilder.CreateGround('ground', { height: 1024, width: 1024, subdivisions: 2 }, scene);
// Give it a Material
var mat = new BABYLON.StandardMaterial("groundmat", scene);
// Setup the Diffuse Color (in this case, grey)
mat.diffuseColor = new BABYLON.Color4.FromInts(68, 68, 68, 0);
// Assign the Material to the Ground Shape
ground.material = mat;
// Give it a Physics Impostor to allow it to have physics
ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, scene);`);
        await this.knex('game_map').insert({
            'script_url': mapScriptName,
            'game_id': gameId[0],
        });
        return gameId[0];
    }
    async createScript(gameId, type, url) {
        const id = await this.knex('game_script').insert({
            'game_id': gameId,
            'script_type': type,
            'script_url': url,
        });
        return id[0];
    }
    async getGameMap(gameId) {
        const mapInfo = await this.knex('game_map').select('id as mapId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt').where({
            'game_id': gameId,
        }).limit(1).orderBy('id', 'desc');
        return mapInfo[0];
    }
    async getGameScripts(gameId, type) {
        return await this.knex('game_script').select('id as scriptId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt', 'script_type as scriptType', 'name as scriptName').where({
            'game_id': gameId,
            'script_type': type,
        });
    }
    async getAllGameScripts(gameId) {
        const scripts = await this.knex('game_script').select('id as scriptId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt', 'script_type as scriptType', 'name as scriptName').where({
            'game_id': gameId,
        });
        return scripts;
    }
    async getGameScript(scriptId) {
        const scripts = await this.knex('game_script').select('id as scriptId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt', 'script_type as scriptType', 'name as scriptName').where({
            'id': scriptId,
        });
        return scripts[0];
    }
    async deleteGameScript(scriptId) {
        await this.knex('game_script').delete().where({
            'id': scriptId,
        }).limit(1);
    }
    async updateGameInfo(gameId, newName, newDesc, maxPlayers, genre) {
        await this.knex('game').update({
            'name': newName,
            'description': newDesc,
            'max_players': maxPlayers,
            'updated_at': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'genre': genre,
        }).where({ 'id': gameId }).limit(1);
    }
    getMapContent(mapName) {
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config_1.default.aws.endpoint,
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            });
            s3.getObject({
                Bucket: config_1.default.aws.buckets.game,
                Key: 'maps/' + mapName,
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(data.Body);
                }
            });
        });
    }
    getScriptContent(scriptName) {
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config_1.default.aws.endpoint,
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            });
            s3.getObject({
                Bucket: config_1.default.aws.buckets.game,
                Key: 'scripts/' + scriptName,
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(data.Body);
                }
            });
        });
    }
    uploadMap(content, mapName = crypto.randomBytes(64).toString('hex')) {
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config_1.default.aws.endpoint,
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            });
            s3.putObject({
                Bucket: config_1.default.aws.buckets.game,
                Key: 'maps/' + mapName,
                Body: content,
                ACL: 'private',
                ContentType: 'text/plain',
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(mapName);
                }
            });
        });
    }
    uploadScript(content, scriptName = crypto.randomBytes(64).toString('hex')) {
        console.log('creating script of name: ' + scriptName);
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config_1.default.aws.endpoint,
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            });
            s3.putObject({
                Bucket: config_1.default.aws.buckets.game,
                Key: 'scripts/' + scriptName,
                Body: content,
                ACL: 'private',
                ContentType: 'text/plain',
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err);
                }
                else {
                    resolve(scriptName);
                }
            });
        });
    }
    deleteScript(scriptName) {
        return new Promise((resolve, reject) => {
            const s3 = new aws.S3({
                endpoint: config_1.default.aws.endpoint,
                accessKeyId: config_1.default.aws.accessKeyId,
                secretAccessKey: config_1.default.aws.secretAccessKey,
            });
            s3.deleteObject({
                Bucket: config_1.default.aws.buckets.game,
                Key: 'scripts/' + scriptName,
            }, function (err, data) {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        });
    }
    async getPlayerServerState(userId) {
        const player = await this.knex('game_server_player').select('game_server_id as gameServerId', 'user_id as userId', 'created_at as createdAt').where({
            'user_id': userId,
        }).limit(1).orderBy('id', 'desc');
        return player[0];
    }
    async getOpenServersForGame(gameId, maxCount) {
        const servers = await this.knex('game_server').select('id as gameServerId', 'game_id as gameId', 'created_at as createdAt', 'player_count as playerCount', 'is_closed as isClosed').where({
            'is_closed': Game.GameClosed.false,
            'game_id': gameId,
        }).andWhere('player_count', '<', maxCount).orderBy('player_count', 'asc');
        return servers;
    }
    async joinServer(userId, gameServerId) {
        await this.knex('game_server_player').insert({
            'game_server_id': gameServerId,
            'user_id': userId,
        });
        await this.knex.raw(`UPDATE game_server SET player_count = player_count + 1 WHERE id = ?`, [gameServerId]);
        const listener = ioredis_pubsub_1.default();
        listener.on('connect', async () => {
            await listener.publish('GameServer' + gameServerId, JSON.stringify({
                event: 'PlayerConnect',
                userId: userId.toString(),
            }));
            listener.disconnect();
        });
    }
    async createGameServer(gameId) {
        const gameServerId = await this.knex('game_server').insert({
            'game_id': gameId,
            'player_count': 0,
        });
        const listener = await this.listenForServerEvents(gameServerId[0]);
        const serverPublisherConnection = ioredis_pubsub_1.default();
        const serverPublisher = serverPublisherConnection;
        listener.on('message', async (channel, message) => {
            const ev = JSON.parse(message);
            console.log(ev);
            if (ev.event === 'gameServerReady') {
                const scripts = await this.getGameScripts(gameId, Game.ScriptType.server);
                let entireScript = '';
                for (const script of scripts) {
                    const content = await this.getScriptContent(script.scriptUrl);
                    entireScript = entireScript + '\n' + content;
                }
                await serverPublisher.publish('GameServer' + gameServerId[0].toString(), JSON.stringify({
                    event: 'serverScript',
                    script: entireScript,
                }));
            }
            else if (ev.event === 'PlayerConnect') {
            }
            else if (ev.event === 'PlayerDisconnect') {
            }
            else if (ev.event === 'shutdown') {
                await this.knex('game_server').update({
                    'is_closed': 1,
                }).where({ 'id': gameServerId[0] });
                listener.disconnect();
            }
        });
        await this.publishServerCreationRequest(gameServerId[0]);
        return gameServerId[0];
    }
    async getServerById(serverId) {
        const server = await this.knex('game_server').select('id as gameServerId', 'game_id as gameId', 'created_at as createdAt', 'player_count as playerCount', 'is_closed as isClosed').where({
            'id': serverId,
        });
        return server[0];
    }
    async leaveServer(userId) {
        const server = await this.getPlayerServerState(userId);
        if (!server) {
            throw Error('This player is not currently in a server.');
        }
        const serverInfo = await this.getServerById(server.gameServerId);
        if (serverInfo.playerCount === 0) {
            await this.knex('game_server').update({
                'player_count': 0,
                'is_closed': Game.GameClosed.true,
            }).where({ 'id': serverInfo.gameServerId });
        }
        else {
            await this.knex('game_server').update({
                'player_count': serverInfo.playerCount - 1,
            }).where({ 'id': serverInfo.gameServerId });
        }
        await this.knex('game_server_player').delete().where({
            'user_id': userId,
        });
        const listener = ioredis_pubsub_1.default();
        listener.on('connect', async () => {
            await listener.publish('GameServer' + server.gameServerId, JSON.stringify({
                event: 'PlayerDisconnect',
                userId: userId.toString(),
            }));
            listener.disconnect();
        });
    }
    async listenForServerEvents(gameServerId) {
        return new Promise((res) => {
            const listener = ioredis_pubsub_1.default();
            listener.on('connect', async () => {
                await listener.subscribe('GameServer' + gameServerId);
                res(listener);
            });
        });
    }
    publishServerCreationRequest(gameServerId) {
        return new Promise((res) => {
            console.log('server is being requqest');
            const listener = ioredis_pubsub_1.default();
            listener.on('ready', async () => {
                await listener.publish('gameServerRequest', gameServerId.toString());
                console.log('published server creation request');
                await listener.disconnect();
                res();
            });
        });
    }
    async incrementVisitCount(gameId) {
        await this.knex.raw(`UPDATE game SET visit_count = visit_count + 1 WHERE id = ?`, [gameId]);
    }
    async createGameThumbnail(gameId, url, moderationStatus) {
        await this.knex('game_thumbnails').insert({
            'thumbnail_url': url,
            'moderation_status': moderationStatus,
            'game_id': gameId,
        });
    }
    async getGameThumbnail(gameId) {
        let thumbnail = await this.knex('game_thumbnails').select('thumbnail_url', 'id').where({ 'game_id': gameId, 'moderation_status': models_1.game.GameThumbnailModerationStatus.Approved }).orderBy('id', 'desc');
        if (thumbnail[0] && thumbnail[0]['thumbnail_url']) {
            return {
                url: thumbnail[0]['thumbnail_url'],
                moderationStatus: models_1.game.GameThumbnailModerationStatus.Approved,
                gameId: gameId,
            };
        }
        return {
            url: 'https://cdn.blockshub.net/game/default_assets/Screenshot_5.png',
            moderationStatus: models_1.game.GameThumbnailModerationStatus.Approved,
            gameId: gameId,
        };
    }
    async multiGetGameThumbnails(gameIds, ignoreModerationState = false) {
        let object = this.knex('game_thumbnails').select('thumbnail_url as url', 'moderation_status as moderationStatus', 'game_id as gameId');
        for (const item of gameIds) {
            object = object.orWhere('game_id', '=', item);
        }
        let results = await object;
        for (const item of results) {
            if (!ignoreModerationState) {
                if (item.moderationStatus !== models_1.game.GameThumbnailModerationStatus.Approved) {
                    item.url = null;
                }
            }
        }
        return results;
    }
}
exports.default = GameDAL;

