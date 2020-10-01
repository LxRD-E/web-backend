/**
 * Imports
 */

import os = require('os');
import * as redis from '../helpers/ioredis';

import * as model from '../models/models';
import _init from './_init';

class StaffDAL extends _init {
    /**
     * Ban a User
     */
    public async insertBan(userId: number, reason: string, privateReason: string, unbanDate: string, createdAt: string, isTerminated: model.user.banType, actorUserId: number): Promise<void> {
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
    /**
     * Get a user's Moderation History
     * @param userId 
     */
    public async getModerationHistory(userId: number): Promise<model.staff.UserModerationHistory[]> {
        const history = await this.knex('user_moderation').select('userid as userId', 'reason', 'date', 'until_unbanned as untilUnbanned', 'is_terminated as isTerminated', 'private_reason as privateReason', 'actor_userid as actorUserId').where({ 'userid': userId }).limit(100).orderBy('id', 'desc');
        return history;
    }
    /**
     * Record a Staff Member banning or Unbanning a user
     * @param userId 
     * @param userIdAffected 
     * @param banned 
     */
    public async recordBan(userId: number, userIdAffected: number, banned: model.user.banned): Promise<void> {
        await this.knex('moderation_ban').insert({
            'userid': userId,
            'userid_modified': userIdAffected,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
            'type': banned,
        });
    }
    /**
     * Get Comments for a UserID made by staff
     * @param userId 
     */
    public async getUserComments(userId: number, offset: number, limit: number): Promise<model.staff.UserComment[]> {
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

    /**
     * Create Staff Comment
     * @param userId 
     * @param staffUserId 
     * @param comment 
     */
    public async createComment(userId: number, staffUserId: number, comment: string): Promise<void> {
        await this.knex('user_staff_comments').insert({
            'user_id': userId,
            'staff_userid': staffUserId,
            'comment': comment,
        });
    }

    /**
     * Delete a comment
     * @param userId 
     * @param staffUserId 
     * @param commentId 
     */
    public async deleteComment(userId: number, staffUserId: number, commentId: number): Promise<void> {
        await this.knex('user_staff_comments').delete().where({
            'user_id': userId,
            'staff_userid': staffUserId,
            'id': commentId,
        });
    }
    /**
     * Get the Server's Info
     */
    public async getServerStatus(): Promise<model.staff.SystemUsageStats> {
        // const cpus = os.cpus();
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
                // 'cpu': cpus,
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

    /**
     * Record the fact that an item was given to a user
     * @param userId 
     * @param userIdAffected 
     * @param catalogId 
     * @param userInventoryId 
     */
    public async recordGive(userId: number, userIdAffected: number, catalogId: number, userInventoryId: number): Promise<void> {
        await this.knex('moderation_give').insert({
            'userid': userId,
            'userid_to': userIdAffected,
            'catalog_id': catalogId,
            'inventory_id': userInventoryId,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Record Currency was Given to a user
     * @param userId 
     * @param userIdAffected 
     * @param amount 
     * @param currency 
     */
    public async recordGiveCurrency(userId: number, userIdAffected: number, amount: number, currency: number): Promise<void> {
        await this.knex('moderation_currency').insert({
            'userid': userId,
            'userid_affected': userIdAffected,
            'amount': amount,
            'currency': currency,
            'date': this.moment().format('YYYY-MM-DD HH:mm:ss'),
        });
    }

    /**
     * Get currency that was given to the {userId} by staff
     * @param userId 
     */
    public async getCurrencyGivenToUser(userId: number, limit: number = 100, offset: number = 0): Promise<model.staff.ModerationCurrencyEntry[]> {
        return this.knex('moderation_currency').select('id as moderationCurrencyId', 'userid as userIdGiver', 'userid_affected as userIdReceiver', 'amount', 'currency', 'date').where({
            'userid_affected': userId,
        }).limit(limit).offset(offset).orderBy('id', 'desc');
    }

    /**
     * Get currency that was sent to a user by staff
     * @param userId 
     */
    public async getCurrencySentByUser(userId: number, limit: number = 100, offset: number = 0): Promise<model.staff.ModerationCurrencyEntry[]> {
        return this.knex('moderation_currency').select('id as moderationCurrencyId', 'userid as userIdGiver', 'userid_affected as userIdReceiver', 'amount', 'currency', 'date').where({
            'userid': userId,
        }).limit(limit).offset(offset).orderBy('id', 'desc');
    }

    /**
     * Get Multiple Thumbnails of Catalog Items from their ID
     * @param ids Array of Catalog IDs
     */
    public async multiGetThumbnailsFromIdsIgnoreModeration(ids: Array<number>): Promise<Array<model.catalog.ThumbnailResponse>> {
        const query = this.knex('thumbnails').select('thumbnails.url', 'thumbnails.reference_id as catalogId').innerJoin('catalog', 'catalog.id', 'thumbnails.reference_id').limit(25);
        ids.forEach((id) => {
            query.orWhere({ 'thumbnails.reference_id': id, 'thumbnails.type': 'catalog' });
        });
        const thumbnails = await query;
        return thumbnails as Array<model.catalog.ThumbnailResponse>;
    }

    /**
     * Get Items Awaiting Moderation
     */
    public async getItems(): Promise<any> {
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

    /**
     * Update item's moderation status
     * @param catalogId 
     * @param state 
     */
    public async updateItemStatus(catalogId: number, state: model.catalog.moderatorStatus): Promise<void> {
        await this.knex('catalog').update({ 'is_pending': state }).where({ 'catalog.id': catalogId });
    }

    /**
     * Update site banner text
     * @param bannerText 
     */
    public async updateBannerText(bannerText: string): Promise<void> {
        await redis.get().set('siteWideBannerDisplay', bannerText);
    }

    /**
     * Get banner text
     */
    public async getBannerText(): Promise<string | null> {
        const banner = await redis.get().get('siteWideBannerDisplay');
        return banner;
    }

    /**
     * Generate an IP whitelist URL
     * @param code 
     */
    public async createIpWhitelistItem(code: string): Promise<void> {
        await redis.get().setex('ip_whitelist_code_' + code, 86400, JSON.stringify({
            ip: undefined,
        }));
    }

    /**
     * Set a IP whitelist url
     * @param code 
     * @param ip 
     */
    public async setIpWhitelistIp(code: string, ip: string): Promise<void> {
        let data = await redis.get().get('ip_whitelist_code_' + code);
        if (!data) {
            throw new this.BadRequest('InvalidCode');
        }
        let decoded = JSON.parse(data);
        if (typeof decoded.ip === 'string') {
            throw new this.BadRequest('InvalidCode');
        }
        decoded.ip = ip;
        // mark as used
        await redis.get().setex('ip_whitelist_code_' + code, 86400, JSON.stringify(decoded));
        // whitelist the ip
        await redis.get().setex('ip_whitelisted_' + ip, 86400, JSON.stringify({
            code: code,
        }));
        return
    }

    /**
     * Check if an IP was whitelisted by staff
     * @param ip 
     */
    public async getIfIpWhitelisted(ip: string): Promise<boolean> {
        let isWhitelisted = await redis.get().get('ip_whitelisted_' + ip);
        if (!isWhitelisted) {
            return false;
        }
        let decoded = JSON.parse(isWhitelisted);
        return typeof decoded.code === 'string' || false;
    }

    /**
     * Search Staff
     * @param offset 
     */
    public async search(offset: number): Promise<model.user.UserInfo[]> {
        const results = await this.knex("users").select(['id as userId', 'username', 'user_status as status', 'user_joindate as joinDate', 'user_lastonline as lastOnline', 'user_staff as staff']).offset(offset).orderBy('id', 'asc').where('user_staff', '>=', model.user.staff.Mod);
        return results;
    }

    /**
     * Update an ad items moderation state
     * @param adId 
     * @param state 
     */
    public async updateAdState(adId: number, state: number): Promise<void> {
        await this.knex('user_ads').update({ 'moderation_status': state }).where({ 'id': adId }).limit(1);
    }

    /**
     * Update a game thumbnails moderation status
     * @param gameThumbnailId 
     * @param state 
     */
    public async updateGameThumbnailState(gameThumbnailId: number, state: number): Promise<void> {
        await this.knex('game_thumbnails').update({ "moderation_status": state }).where({ 'id': gameThumbnailId }).limit(1);
    }

    /**
     * Get permissions for the {userId}
     * @param userId
     */
    public async getPermissions(userId: number): Promise<model.staff.Permission[]> {
        let results = await this.knex('user_staff_permission').select('permission', 'user_id').where({
            'user_id': userId,
        }) as { permission: number }[];
        return results.map(val => {
            return val.permission;
        });
    }

    /**
     * Add a permission to the {userId}
     * @param userId
     * @param permission
     */
    public async addPermissions(userId: number, permission: model.staff.Permission): Promise<void> {
        await this.knex('user_staff_permission').insert({
            'user_id': userId,
            'permission': permission,
        })
    }

    /**
     * Delete a permission from the {userId}
     * @param userId
     * @param permission
     */
    public async deletePermissions(userId: number, permission: model.staff.Permission): Promise<void> {
        await this.knex('user_staff_permission').delete().where({
            'user_id': userId,
            'permission': permission,
        })
    }
}

export default StaffDAL;
