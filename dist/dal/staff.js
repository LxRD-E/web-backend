"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const os = require("os");
const ioredis_1 = require("../helpers/ioredis");
const model = require("../models/models");
const _init_1 = require("./_init");
class StaffDAL extends _init_1.default {
    async insertBan(userId, reason, privateReason, unbanDate, isTerminated, actorUserId) {
        await this.knex('user_moderation').insert({
            'userid': userId,
            'reason': reason,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'until_unbanned': this.moment(unbanDate).format('YYYY-MM-DD HH:mm:ss'),
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
    async multiGetThumbnailsFromIdsIgnoreModeration(ids) {
        const query = this.knex('thumbnails').select('thumbnails.url', 'thumbnails.reference_id as catalogId').innerJoin('catalog', 'catalog.id', 'thumbnails.reference_id').limit(25);
        ids.forEach((id) => {
            query.orWhere({ 'thumbnails.reference_id': id, 'thumbnails.type': 'catalog' });
        });
        const thumbnails = await query;
        return thumbnails;
    }
    async getItems() {
        const info = await this.knex("catalog").select("catalog.id as catalogId", "catalog.name as catalogName", "catalog.price", "catalog.currency", "catalog.creator as userId", "catalog.is_collectible as collectible", "catalog.max_sales as maxSales").limit(25).orderBy('id', 'desc').where({ 'catalog.is_pending': model.catalog.moderatorStatus.Pending });
        return info;
    }
    async updateItemStatus(catalogId, state) {
        await this.knex('catalog').update({ 'is_pending': state }).where({ 'catalog.id': catalogId });
    }
    async updateBannerText(bannerText) {
        await ioredis_1.default.set('siteWideBannerDisplay', bannerText);
    }
    async getBannerText() {
        const banner = await ioredis_1.default.get('siteWideBannerDisplay');
        return banner;
    }
    async search(offset) {
        const results = await this.knex("users").select(['id as userId', 'username', 'user_status as status', 'user_joindate as joinDate', 'user_lastonline as lastOnline', 'user_staff as staff']).offset(offset).orderBy('id', 'asc').where('user_staff', '>=', model.user.staff.Mod);
        return results;
    }
}
exports.default = StaffDAL;

