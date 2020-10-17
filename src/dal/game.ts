/**
 * Imports
 */
import redis from '../helpers/ioredis_pubsub';
import * as Game from '../models/v1/game';
import * as Catalog from '../models/v1/catalog';
import config from '../helpers/config';
import { Redis } from 'ioredis';
import _init from './_init';
import { game } from '../models/models';
import aws = require('aws-sdk');
import crypto = require('crypto');

class GameDAL extends _init {

    /**
     * Get Info about a Game from the gameId
     * @param id 
     * @param specificColumns 
     */
    public async getInfo(id: number, specificColumns?: Array<
        'gameId' | 'gameName' | 'gameDescription' | 'maxPlayers' | 'visitCount' | 'playerCount' | 'likeCount' | 'dislikeCount' | 'gameState' | 'creatorId' | 'creatorType' | 'createdAt' | 'updatedAt' | 'genre'
    >): Promise<Game.GameInfo> {
        if (!specificColumns) {
            specificColumns = ['gameId', 'gameName', 'gameDescription', 'visitCount', 'playerCount', 'likeCount', 'dislikeCount', 'gameState', 'creatorId', 'creatorType', 'genre', 'createdAt', 'updatedAt'];
        }
        specificColumns.forEach((element: string, index: number, array: Array<string>): void => {
            if (element === 'gameId') {
                array[index] = 'id as gameId';
            } else if (element === 'gameName') {
                array[index] = 'name as gameName';
            } else if (element === 'gameDescription') {
                array[index] = 'description as gameDescription';
            } else if (element === 'maxPlayers') {
                array[index] = 'max_players as maxPlayers';
            } else if (element === 'visitCount') {
                array[index] = 'visit_count as visitCount';
            } else if (element === 'playerCount') {
                array[index] = 'player_count as playerCount';
            } else if (element === 'likeCount') {
                array[index] = 'like_count as likeCount';
            } else if (element === 'dislikeCount') {
                array[index] = 'dislike_count as dislikeCount';
            } else if (element === 'gameState') {
                array[index] = 'game_state as gameState';
            } else if (element === 'creatorId') {
                array[index] = 'creator_id as creatorId';
            } else if (element === 'creatorType') {
                array[index] = 'creator_type as creatorType';
            } else if (element === 'createdAt') {
                array[index] = 'created_at as createdAt';
            } else if (element === 'updatedAt') {
                array[index] = 'updated_at as updatedAt';
            } else if (element === 'genre') {
                array[index] = 'genre';
            }
        });
        const gameInfo = await this.knex('game').select(specificColumns).where({ 'game.id': id });
        if (!gameInfo[0]) {
            throw new Error('The game specified does not exist.');
        }
        console.log("Query OK. Returning gameInfo...");
        return gameInfo[0] as Game.GameInfo;
    }

    /**
     * Get All Games. Sorted by most players to least
     * @param offset 
     * @param limit 
     * @param sortMode 
     */
    public async getGames(
        offset: number,
        limit: number,
        sortMode: 'asc' | 'desc',
        sortByColumn: string,
        genre: number,
        creatorConstraint?: game.GameSearchCreatorConstraint,
    ): Promise<Game.GameSearchResult> {
        let games;
        let total: number;
        let extraWhereClause: {
            'creator_id'?: number,
            'creator_type'?: number,
        } = {};
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
            // grab games
            games = await this.knex('game')
                .select(columnsToSelect)
                .limit(limit)
                .offset(offset)
                .orderBy(sortByColumn, sortMode)
                .where({
                    'game_state': Game.GameState.public,
                }).andWhere(extraWhereClause);
            // count games
            let _total = await this.knex('game').count('id as total').where({
                'game_state': Game.GameState.public,
            }).andWhere(extraWhereClause);
            total = _total[0]['total'] as number;
        } else {
            // grab games
            games = await this.knex('game')
                .select(columnsToSelect)
                .limit(limit)
                .offset(offset)
                .orderBy(sortByColumn, sortMode)
                .where({
                    'game_state': Game.GameState.public,
                    'genre': genre,
                }).andWhere(extraWhereClause);
            // count games
            let _total = await this.knex('game').count('id as total').where({
                'game_state': Game.GameState.public,
                'genre': genre,
            }).andWhere(extraWhereClause);
            total = _total[0]['total'] as number;
        }

        return {
            total: total,
            data: games,
        };
    }

    /**
     * Count the games a User or Group has created
     * @param creatorId 
     * @param creatorType 
     */
    public async countGames(creatorId: number, creatorType: Catalog.creatorType): Promise<number> {
        const count = await this.knex('game').count('id as Total').where({ 'creator_id': creatorId, 'creator_type': creatorType });
        let total = count[0]['Total'] as number;
        if (!total) {
            total = 0;
        }
        return total;
    }

    /**
     * Create a New Game
     * @param creatorId the ID of the creator
     * @param creatorType The type of creator (group, user)
     * @param gameName The Name
     * @param gameDescription The Description
     */
    public async create(creatorId: number, creatorType: Catalog.creatorType, gameName: string, gameDescription: string): Promise<number> {
        // Create the Game Itself
        const gameId = await this.knex('game').insert({
            name: gameName,
            description: gameDescription,
            'creator_type': creatorType,
            'creator_id': creatorId,
        });
        // Create Initial Map Script
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
        // Upload Map Script
        await this.knex('game_map').insert({
            'script_url': mapScriptName,
            'game_id': gameId[0],
        });

        // Return the Game ID
        return gameId[0];
    }

    /**
     * Create a new Script for a game. Returns script ID
     * @param gameId 
     * @param type 
     */
    public async createScript(gameId: number, type: Game.ScriptType, url: string): Promise<number> {
        const id = await this.knex('game_script').insert({
            'game_id': gameId,
            'script_type': type,
            'script_url': url,
        });
        return id[0];
    }

    /**
     * Get a Game's Map. This does not return the actual script content
     * @param gameId 
     */
    public async getGameMap(gameId: number): Promise<Game.Map> {
        const mapInfo = await this.knex('game_map').select('id as mapId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt').where({
            'game_id': gameId,
        }).limit(1).orderBy('id', 'desc');
        return mapInfo[0];
    }

    /**
     * Get a Game's Scripts
     * @param gameId 
     */
    public async getGameScripts(gameId: number, type: Game.ScriptType): Promise<Game.Script[]> {
        return await this.knex('game_script').select('id as scriptId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt', 'script_type as scriptType', 'name as scriptName').where({
            'game_id': gameId,
            'script_type': type,
        });
    }

    /**
     * Get All Game Scripts
     * @param gameId 
     */
    public async getAllGameScripts(gameId: number): Promise<Game.Script[]> {
        const scripts = await this.knex('game_script').select('id as scriptId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt', 'script_type as scriptType', 'name as scriptName').where({
            'game_id': gameId,
        });
        return scripts;
    }

    /**
     * Get a Game's Script by ID
     * @param scriptId 
     */
    public async getGameScript(scriptId: number): Promise<Game.Script> {
        const scripts = await this.knex('game_script').select('id as scriptId', 'game_id as gameId', 'script_url as scriptUrl', 'created_at as createdAt', 'updated_at as updatedAt', 'script_type as scriptType', 'name as scriptName').where({
            'id': scriptId,
        });
        return scripts[0];
    }

    /**
     * Delete a Game's Script by ID
     * @param scriptId 
     */
    public async deleteGameScript(scriptId: number): Promise<void> {
        await this.knex('game_script').delete().where({
            'id': scriptId,
        }).limit(1);
    }

    /**
     * Update a Game's Name and Desc
     */
    public async updateGameInfo(gameId: number, newName: string, newDesc: string, maxPlayers: number, genre: game.GameGenres): Promise<void> {
        await this.knex('game').update({
            'name': newName,
            'description': newDesc,
            'max_players': maxPlayers,
            'updated_at': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'genre': genre,
        }).where({ 'id': gameId }).limit(1);
    }

    /**
     * Get a Map's Content
     */
    public getMapContent(mapName: string): Promise<Buffer> {
        return new Promise((resolve, reject): void => {
            const s3 = new aws.S3({
                endpoint: config.aws.endpoint,
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            });
            s3.getObject({
                Bucket: config.aws.buckets.game,
                Key: 'maps/' + mapName,
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err)
                } else {
                    resolve(data.Body as Buffer);
                }
            });
        });
    }

    /**
     * Get a Script's Content
     */
    public getScriptContent(scriptName: string): Promise<Buffer> {
        return new Promise((resolve, reject): void => {
            const s3 = new aws.S3({
                endpoint: config.aws.endpoint,
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            });
            s3.getObject({
                Bucket: config.aws.buckets.game,
                Key: 'scripts/' + scriptName,
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err)
                } else {
                    resolve(data.Body as Buffer);
                }
            });
        });
    }

    /**
     * Upload a Script Map File to the CDN. Resolves with map script name
     * @param content Script Content
     */
    public uploadMap(content: string, mapName = crypto.randomBytes(64).toString('hex')): Promise<string> {
        return new Promise((resolve, reject): void => {
            const s3 = new aws.S3({
                endpoint: config.aws.endpoint,
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            });
            s3.putObject({
                Bucket: config.aws.buckets.game,
                Key: 'maps/' + mapName,
                Body: content,
                ACL: 'private',
                ContentType: 'text/plain',
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err)
                } else {
                    resolve(mapName);
                }
            });
        });
    }

    /**
     * Upload a Script file to the CDN. Resolves with script name
     * @param content Script Content
     * @param scriptName
     */
    public uploadScript(content: string, scriptName = crypto.randomBytes(64).toString('hex')): Promise<string> {
        console.log('creating script of name: ' + scriptName);
        return new Promise((resolve, reject): void => {
            const s3 = new aws.S3({
                endpoint: config.aws.endpoint,
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            });
            s3.putObject({
                Bucket: config.aws.buckets.game,
                Key: 'scripts/' + scriptName,
                Body: content,
                ACL: 'private',
                ContentType: 'text/plain',
            }, function (err, data) {
                if (err) {
                    console.log(err);
                    reject(err)
                } else {
                    resolve(scriptName);
                }
            });
        });
    }

    /**
     * Delete a Script file from the CDN
     * @param scriptName
     */
    public deleteScript(scriptName: string): Promise<void> {
        return new Promise((resolve, reject): void => {
            const s3 = new aws.S3({
                endpoint: config.aws.endpoint,
                accessKeyId: config.aws.accessKeyId,
                secretAccessKey: config.aws.secretAccessKey,
            });
            s3.deleteObject({
                Bucket: config.aws.buckets.game,
                Key: 'scripts/' + scriptName,
            }, function (err, data) {
                if (err) {
                    reject(err)
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Get if Player is in server. Returns undefined if not in a game
     * @param userId 
     */
    public async getPlayerServerState(userId: number): Promise<Game.GameServerPlayer> {
        const player = await this.knex('game_server_player').select('game_server_id as gameServerId', 'user_id as userId', 'created_at as createdAt').where({
            'user_id': userId,
        }).limit(1).orderBy('id', 'desc');
        return player[0];
    }

    /**
     * Get the Open Servers for a game. Returns empty if no servers
     * @param gameId 
     * @param maxCount 
     */
    public async getOpenServersForGame(gameId: number, maxCount: number): Promise<Game.GameServer[]> {
        const servers = await this.knex('game_server').select('id as gameServerId', 'game_id as gameId', 'created_at as createdAt', 'player_count as playerCount', 'is_closed as isClosed').where({
            'is_closed': Game.GameClosed.false,
            'game_id': gameId,
        }).andWhere('player_count', '<', maxCount).orderBy('player_count', 'asc');
        return servers;
    }

    /**
     * Join or Create a Game Server. Resolves with gameServerId
     * @param userId 
     * @param gameId 
     */
    public async joinServer(userId: number, gameServerId: number): Promise<void> {
        await this.knex('game_server_player').insert({
            'game_server_id': gameServerId,
            'user_id': userId,
        })
        await this.knex.raw(`UPDATE game_server SET player_count = player_count + 1 WHERE id = ?`, [gameServerId]);
        const listener = redis();
        listener.on('connect', async () => {
            await listener.publish('GameServer' + gameServerId, JSON.stringify({
                event: 'PlayerConnect',
                userId: userId.toString(),
            }));
            listener.disconnect();
        });
    }

    /**
     * Create a Game Server
     * @param gameId 
     */
    public async createGameServer(gameId: number): Promise<number> {
        // Create the DB file itself
        const gameServerId = await this.knex('game_server').insert({
            'game_id': gameId,
            'player_count': 0,
        });
        // setup listener
        // Primary Game Event Listener
        const listener = await this.listenForServerEvents(gameServerId[0]);
        const serverPublisherConnection = redis();
        const serverPublisher = serverPublisherConnection;
        listener.on('message', async (channel, message): Promise<void> => {
            const ev = JSON.parse(message);
            console.log(ev);
            if (ev.event === 'gameServerReady') {
                // OK. Start publishing script info
                // combine all server scipts into one and then publish as buffer for game server to handle
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
            } else if (ev.event === 'PlayerConnect') {
                // connect
            } else if (ev.event === 'PlayerDisconnect') {
                // disconnect
            } else if (ev.event === 'shutdown') {
                // shutdown server
                await this.knex('game_server').update({
                    'is_closed': 1,
                }).where({ 'id': gameServerId[0] });
                // disconnect
                listener.disconnect();
            }
        });
        // create server
        await this.publishServerCreationRequest(gameServerId[0]);
        // Start Game
        return gameServerId[0];
    }

    /**
     * Get server by it's ID
     * @param serverId 
     */
    public async getServerById(serverId: number): Promise<Game.GameServer> {
        const server = await this.knex('game_server').select('id as gameServerId', 'game_id as gameId', 'created_at as createdAt', 'player_count as playerCount', 'is_closed as isClosed').where({
            'id': serverId,
        })
        return server[0];
    }

    /**
     * Leave a Server
     * @param userId 
     */
    public async leaveServer(userId: number): Promise<void> {
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
        } else {
            await this.knex('game_server').update({
                'player_count': serverInfo.playerCount - 1,
            }).where({ 'id': serverInfo.gameServerId });
        }
        await this.knex('game_server_player').delete().where({
            'user_id': userId,
        });

        const listener = redis();
        listener.on('connect', async () => {
            await listener.publish('GameServer' + server.gameServerId, JSON.stringify({
                event: 'PlayerDisconnect',
                userId: userId.toString(),
            }));
            listener.disconnect();
        });
    }

    /**
     * Listen for Server Events
     * @param gameServerId 
     */
    public async listenForServerEvents(gameServerId: number): Promise<Redis> {
        return new Promise((res): void => {
            const listener = redis();
            listener.on('connect', async () => {
                await listener.subscribe('GameServer' + gameServerId);
                res(listener);
            });
        });
    }

    /**
     * Request a game server to be created
     * @param gameServerId 
     */
    public publishServerCreationRequest(gameServerId: number): Promise<void> {
        return new Promise((res): void => {
            console.log('server is being requqest');
            const listener = redis();
            listener.on('ready', async () => {
                await listener.publish('gameServerRequest', gameServerId.toString());
                console.log('published server creation request');
                await listener.disconnect();
                res();
            });
        });
    }

    /**
     * Increment a game's Visit Count
     * @param gameId 
     */
    public async incrementVisitCount(gameId: number): Promise<void> {
        await this.knex.raw(`UPDATE game SET visit_count = visit_count + 1 WHERE id = ?`, [gameId]);
    }

    /**
     * Create a thumbnail for the specified gameId
     * @param gameId 
     * @param url 
     */
    public async createGameThumbnail(gameId: number, url: string, moderationStatus: game.GameThumbnailModerationStatus): Promise<void> {
        await this.knex('game_thumbnails').insert({
            'thumbnail_url': url,
            'moderation_status': moderationStatus,
            'game_id': gameId,
        });
    }

    /**
     * Get the thumbnail for a game. Returns default thumbnail if pending/declined/not available
     */
    public async getGameThumbnail(gameId: number): Promise<game.GameThumbnail> {
        let thumbnail = await this.knex('game_thumbnails').select('thumbnail_url', 'id').where({ 'game_id': gameId, 'moderation_status': game.GameThumbnailModerationStatus.Approved }).orderBy('id', 'desc');
        if (thumbnail[0] && thumbnail[0]['thumbnail_url']) {
            return {
                url: thumbnail[0]['thumbnail_url'],
                moderationStatus: game.GameThumbnailModerationStatus.Approved,
                gameId: gameId,
            };
        }
        return {
            url: 'https://cdn.blockshub.net/game/default_assets/Screenshot_5.png',
            moderationStatus: game.GameThumbnailModerationStatus.Approved,
            gameId: gameId,
        };
    }

    /**
     * Multi-get game thumbnails by an array of gameIds. 
     * @param gameIds 
     */
    public async multiGetGameThumbnails(gameIds: number[], ignoreModerationState: boolean = false): Promise<game.GameThumbnail[]> {
        let object = this.knex('game_thumbnails').select('thumbnail_url as url', 'moderation_status as moderationStatus', 'game_id as gameId');
        for (const item of gameIds) {
            object = object.orWhere('game_id', '=', item);
        }
        let results = await object;
        for (const item of results) {
            if (!ignoreModerationState) {
                if (item.moderationStatus !== game.GameThumbnailModerationStatus.Approved) {
                    item.url = null;
                }
            }
        }
        return results;
    }
}

export default GameDAL;
