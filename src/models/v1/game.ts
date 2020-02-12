import * as Catalog from './catalog';
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

export interface Map {
    mapId: number;
    gameId: number;
    scriptUrl: string;
    createdAt: string;
    updatedAt: string;
}

export interface Script {
    scriptId: number;
    gameId: number;
    scriptUrl: string;
    createdAt: string;
    updatedAt: string;
    scriptType: ScriptType;
    scriptName: string;
}

export interface GameInfo {
    gameId: number;
    gameName: string;
    gameDescription: string;
    maxPlayers: number;
    iconAssetId: number;
    thumbnailAssetId: number;
    visitCount: number;
    playerCount: number;
    likeCount: number;
    dislikeCount: number;
    gameState: GameState;
    creatorId: number;
    creatorType: Catalog.creatorType;
    createdAt: string;
    updatedAt: string;
}

export interface GameSearchResult {
    gameId: number;
    gameName: string;
    gameDescription: string;
    iconAssetId: number;
    thumbnailAssetId: number;
    playerCount: number;
    creatorId: number;
    creatorType: Catalog.creatorType;
}

export interface GameServerPlayer {
    gameServerId: number;
    userId: number;
    createdAt: string;
}

export interface GameServer {
    gameServerId: number;
    gameId: number;
    createdAt: string;
    playerCount: number;
    isClosed: GameClosed;
}