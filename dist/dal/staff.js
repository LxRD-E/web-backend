"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const redis = require("../helpers/ioredis");
const model = require("../models/models");
const _init_1 = require("./_init");
class StaffDAL extends _init_1.default {
    async insertBan(userId, reason, privateReason, unbanDate, createdAt, isTerminated, actorUserId) {
        await this.knex('user_moderation').insert({
            'userid': userId,
            'reason': reason,
            'date': createdAt,
            'until_unbanned': unbanDate,
            'is_terminated': isTerminated,
            'private_reason': privateReason,
            'actor_userid': actorUserId,
        });
    }
    async getModerationHistory(userId) {
        const history = await this.knex('user_moderation').select('userid as userId', 'reason', 'date', 'until_unbanned as untilUnbanned', 'is_terminated as isTerminated', 'private_reason as privateReason', 'actor_userid as actorUserId').where({ 'userid': userId }).limit(100).orderBy('id', 'desc');
        return history;
    }
    async recordBan(userId, userIdAffected, banned) {
        await this.knex('moderation_ban').insert({
            'userid': userId,
            'userid_modified': userIdAffected,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'type': banned,
        });
    }
    async getUserComments(userId, offset, limit) {
        const comments = await this.knex('user_staff_comments').select([
            'id as userCommentId',
            'user_id as userId',
            'staff_userid as staffUserId',
            'created_at as createdAt',
            'comment',
        ]).where({
            'user_id': userId,
        }).orderBy('id', 'desc').limit(limit).offset(offset);
        return comments;
    }
    async createComment(userId, staffUserId, comment) {
        await this.knex('user_staff_comments').insert({
            'user_id': userId,
            'staff_userid': staffUserId,
            'comment': comment,
        });
    }
    async deleteComment(userId, staffUserId, commentId) {
        await this.knex('user_staff_comments').delete().where({
            'user_id': userId,
            'staff_userid': staffUserId,
            'id': commentId,
        });
    }
    async getServerStatus() {
        const totalMemory = os.totalmem();
        const freemem = os.freemem();
        const memUsage = process.memoryUsage();
        const totalSystemUsedMemory = totalMemory - freemem;
        return {
            'system': {
                'memory': {
                    'gigabytes': {
                        'total': totalMemory / 1e+9,
                        'free': freemem / 1e+9,
                        'used': totalSystemUsedMemory / 1e+9,
                    },
                    'percentUsed': parseFloat((totalSystemUsedMemory / totalMemory * 100).toFixed(3)),
                },
                'hostname': os.hostname(),
            },
            'node': {
                'memory': {
                    'gigabytes': {
                        'total': memUsage.heapTotal / 1e+9,
                        'used': memUsage.heapUsed / 1e+9,
                    },
                    'percentUsed': parseFloat((memUsage.heapUsed / memUsage.heapTotal * 100).toFixed(3)),
                },
                'mysql': {
                    'pendingCreates': this.knex.client.pool.numPendingCreates(),
                    'numUsed': this.knex.client.pool.numUsed(),
                    'numFree': this.knex.client.pool.numFree(),
                    'numPendingAcquires': this.knex.client.pool.numPendingAcquires(),
                }
            },
        };
    }
    async recordGive(userId, userIdAffected, catalogId, userInventoryId) {
        await this.knex('moderation_give').insert({
            'userid': userId,
            'userid_to': userIdAffected,
            'catalog_id': catalogId,
            'inventory_id': userInventoryId,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }
    async recordGiveCurrency(userId, userIdAffected, amount, currency) {
        await this.knex('moderation_currency').insert({
            'userid': userId,
            'userid_affected': userIdAffected,
            'amount': amount,
            'currency': currency,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }
    async getCurrencyGivenToUser(userId, limit = 100, offset = 0) {
        return this.knex('moderation_currency').select('id as moderationCurrencyId', 'userid as userIdGiver', 'userid_affected as userIdReceiver', 'amount', 'currency', 'date').where({
            'userid_affected': userId,
        }).limit(limit).offset(offset).orderBy('id', 'desc');
    }
    async getCurrencySentByUser(userId, limit = 100, offset = 0) {
        return this.knex('moderation_currency').select('id as moderationCurrencyId', 'userid as userIdGiver', 'userid_affected as userIdReceiver', 'amount', 'currency', 'date').where({
            'userid': userId,
        }).limit(limit).offset(offset).orderBy('id', 'desc');
    }
    async multiGetThumbnailsFromIdsIgnoreModeration(ids) {
        const query = this.knex('thumbnails').select('thumbnails.url', 'thumbnails.reference_id as catalogId').innerJoin('catalog', 'catalog.id', 'thumbnails.reference_id').limit(25);
        ids.forEach((id) => {
            query.orWhere({ 'thumbnails.reference_id': id, 'thumbnails.type': 'catalog' });
        });
        const thumbnails = await query;
        return thumbnails;
    }
    async getItems() {
        let fullArr = [];
        const info = await this.knex("catalog").select("catalog.id as catalogId", "catalog.name as catalogName", "catalog.price", "catalog.currency", "catalog.creator as userId", "catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(25).orderBy('id', 'desc').where({ 'catalog.is_pending': model.catalog.moderatorStatus.Pending }).limit(100);
        for (const item of info) {
            item['type'] = 'CatalogItem';
            fullArr.push(item);
        }
        let pendingAds = await this.knex('user_ads').select('id as adId', 'user_id as userId', 'image_url as imageUrl', 'title').where({ 'moderation_status': model.ad.ModerationStatus.Pending }).limit(100);
        for (const ad of pendingAds) {
            ad['type'] = 'Advertisment';
            fullArr.push(ad);
        }
        let pendingGameThumbnails = await this.knex('game_thumbnails').select('id as gameThumbnailId', 'thumbnail_url as url').where({ 'moderation_status': model.game.GameThumbnailModerationStatus.AwaitingApproval }).limit(100);
        for (const item of pendingGameThumbnails) {
            item['type'] = 'GameThumbnail';
            fullArr.push(item);
        }
        return fullArr;
    }
    async updateItemStatus(catalogId, state) {
        await this.knex('catalog').update({ 'is_pending': state }).where({ 'catalog.id': catalogId });
    }
    async updateBannerText(bannerText) {
        await redis.get().set('siteWideBannerDisplay', bannerText);
    }
    async getBannerText() {
        const banner = await redis.get().get('siteWideBannerDisplay');
        return banner;
    }
    async createIpWhitelistItem(code) {
        await redis.get().setex('ip_whitelist_code_' + code, 86400, JSON.stringify({
            ip: undefined,
        }));
    }
    async setIpWhitelistIp(code, ip) {
        let data = await redis.get().get('ip_whitelist_code_' + code);
        if (!data) {
            throw new this.BadRequest('InvalidCode');
        }
        let decoded = JSON.parse(data);
        if (typeof decoded.ip === 'string') {
            throw new this.BadRequest('InvalidCode');
        }
        decoded.ip = ip;
        await redis.get().setex('ip_whitelist_code_' + code, 86400, JSON.stringify(decoded));
        await redis.get().setex('ip_whitelisted_' + ip, 86400, JSON.stringify({
            code: code,
        }));
        return;
    }
    async getIfIpWhitelisted(ip) {
        let isWhitelisted = await redis.get().get('ip_whitelisted_' + ip);
        if (!isWhitelisted) {
            return false;
        }
        let decoded = JSON.parse(isWhitelisted);
        return typeof decoded.code === 'string' || false;
    }
    async search(offset) {
        const results = await this.knex("users").select(['id as userId', 'username', 'user_status as status', 'user_joindate as joinDate', 'user_lastonline as lastOnline', 'user_staff as staff']).offset(offset).orderBy('id', 'asc').where('user_staff', '>=', model.user.staff.Mod);
        return results;
    }
    async updateAdState(adId, state) {
        await this.knex('user_ads').update({ 'moderation_status': state }).where({ 'id': adId }).limit(1);
    }
    async updateGameThumbnailState(gameThumbnailId, state) {
        await this.knex('game_thumbnails').update({ "moderation_status": state }).where({ 'id': gameThumbnailId }).limit(1);
    }
    async getPermissions(userId) {
        let results = await this.knex('user_staff_permission').select('permission', 'user_id').where({
            'user_id': userId,
        });
        return results.map(val => {
            return val.permission;
        });
    }
    async addPermissions(userId, permission) {
        await this.knex('user_staff_permission').insert({
            'user_id': userId,
            'permission': permission,
        });
    }
    async deletePermissions(userId, permission) {
        await this.knex('user_staff_permission').delete().where({
            'user_id': userId,
            'permission': permission,
        });
    }
}
exports.default = StaffDAL;

