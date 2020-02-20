import * as Catalog from './catalog';
import { PropertyType } from '@tsed/common';
export enum GameState {
    'public' = 1,
    'private',
    'underReview'
}

export enum ScriptType {
    'server' = 1,
    'client',
}

export enum GameClosed {
    false = 0,
    true = 1,
}

export class Map {
    @PropertyType(Number)
    mapId: number;
    @PropertyType(Number)
    gameId: number;
    @PropertyType(Number)
    scriptUrl: string;
    @PropertyType(String)
    createdAt: string;
    @PropertyType(String)
    updatedAt: string;
}

export class Script {
    @PropertyType(Number)
    scriptId: number;
    @PropertyType(Number)
    gameId: number;
    @PropertyType(String)
    scriptUrl: string;
    @PropertyType(String)
    createdAt: string;
    @PropertyType(String)
    updatedAt: string;
    scriptType: ScriptType;
    @PropertyType(String)
    scriptName: string;
}

export class GameInfo {
    @PropertyType(Number)
    gameId: number;

    @PropertyType(String)
    gameName: string;

    @PropertyType(String)
    gameDescription: string;

    @PropertyType(Number)
    maxPlayers: number;

    @PropertyType(Number)
    iconAssetId: number;

    @PropertyType(Number)
    thumbnailAssetId: number;

    @PropertyType(Number)
    visitCount: number;

    @PropertyType(Number)
    playerCount: number;

    @PropertyType(Number)
    likeCount: number;

    @PropertyType(Number)
    dislikeCount: number;

    gameState: GameState;

    @PropertyType(Number)
    creatorId: number;

    creatorType: Catalog.creatorType;

    @PropertyType(String)
    createdAt: string;
    
    @PropertyType(String)
    updatedAt: string;
}

export class GameSearchResult {
    gameId: number;
    gameName: string;
    gameDescription: string;
    iconAssetId: number;
    thumbnailAssetId: number;
    playerCount: number;
    creatorId: number;
    creatorType: Catalog.creatorType;
}

export class GameServerPlayer {
    gameServerId: number;
    userId: number;
    createdAt: string;
}

export class GameServer {
    gameServerId: number;
    gameId: number;
    createdAt: string;
    playerCount: number;
    isClosed: GameClosed;
}