const indexes = [
    {
        table: 'catalog',
        indexes: [
            [
                'creator',
                'creator_type',
            ],
            [
                'original_creatorid',
            ],
            [
                'is_collectible',
            ],
            [
                'is_for_sale',
            ],
        ],
    },
    {
        table: 'catalog_assets',
        indexes: [
            [
                'catalogid',
            ],
        ],
    },
    {
        table: 'catalog_comments',
        indexes: [
            [
                'catalog_id',
            ],
        ],
    },
    {
        table: 'chat_messages',
        indexes: [
            [
                'userid_from',
            ],
            [
                'userid_to',
            ]
        ],
    },
    {
        table: 'forum_posts',
        indexes: [
            [
                'sub_category',
            ],
            [
                'threadid',
            ],
            [
                'userid',
            ],
        ]
    },
    {
        table: 'forum_threads',
        indexes: [
            [
                'sub_category',
            ],
            [
                'userid',
            ],
        ],
    },
    {
        table: 'friendships',
        indexes: [
            [
                'userid_one',
            ],
            [
                'userid_two',
            ],
        ],
    },
    {
        table: 'friend_request',
        indexes: [
            [
                'userid_requester',
            ],
            [
                'userid_requestee',
            ],
        ],
    },
    {
        table: 'game_thumbnails',
        indexes: [
            [
                'game_id',
            ],
        ],
    },
    {
        table: 'groups',
        indexes: [
            [
                'owner_userid',
            ],
            [
                'membercount',
            ],
        ],
    },
    {
        table: 'group_members',
        indexes: [
            [
                'groupid',
            ],
            [
                'userid',
            ],
        ],
    },
    {
        table: 'group_members_pending',
        indexes: [
            [
                'user_id',
            ],
            [
                'group_id',
            ],
        ],
    },
    {
        table: 'group_ownership_change',
        indexes: [
            [
                'group_id',
            ],
        ],
    },
    {
        table: 'group_roles',
        indexes: [
            [
                'groupid',
            ],
        ],
    },
    {
        table: 'group_shout',
        indexes: [
            [
                'groupid',
                'id',
            ],
            [
                'groupid',
            ]
        ]
    },
    {
        table: 'group_wall',
        indexes: [
            [
                'groupid',
                'id',
            ]
        ],
    },
    {
        table: 'password_resets',
        indexes: [
            [
                'userid',
            ],
        ],
    },
    {
        table: 'thumbnails',
        indexes: [
            [
                'type',
                'reference_id',
            ],
        ],
    },
    {
        table: 'thumbnail_hashes',
        indexes: [
            [
                'hash',
            ]
        ]
    },
    {
        table: 'trades',
        indexes: [
            [
                'userid_one',
                'status',
                'id',
            ],
            [
                'userid_two',
                'status',
                'id',
            ],
        ]
    },
    {
        table: 'trade_items',
        indexes: [
            [
                'trade_id',
            ],
            [
                'trade_id',
                'side',
            ]
        ]
    },
    {
        table: 'transactions',
        indexes: [
            [
                'userid_to',
                'id',
                'to_type',
            ],
            [
                'userid_from',
                'id',
                'from_type',
            ],
        ]
    },
    {
        table: 'users_usernames',
        indexes: [
            [
                'userid'
            ]
        ]
    },
    {
        table: 'user_ads',
        indexes: [
            [
                'moderation_status',
                'ad_displaytype',
            ],
            [
                'user_id',
            ]
        ],
    },
    {
        table: 'user_avatar',
        indexes: [
            [
                'userid',
            ]
        ]
    },
    {
        table: 'user_avatarcolor',
        indexes: [
            [
                'userid',
            ]
        ]
    },
    {
        table: 'user_emails',
        indexes: [
            [
                'userid',
            ]
        ]
    },
    {
        table: 'user_inventory',
        indexes: [
            [
                'user_id',
            ],
            [
                'catalog_id',
            ],
        ]
    },
    {
        table: 'user_ip',
        indexes: [
            [
                'userid',
            ],
            [
                'userid',
                'action',
            ],
            [
                'ip_address'
            ]
        ]
    },
    {
        table: 'user_messages',
        indexes: [
            [
                'userid_to',
                'id',
            ],
        ],
    },
    {
        table: 'user_outfit',
        indexes: [
            [
                'user_id',
            ],
        ]
    },
    {
        table: 'user_outfit_avatar',
        indexes: [
            [
                'outfit_id',
            ]
        ]
    },
    {
        table: 'user_outfit_avatarcolor',
        indexes: [
            [
                'outfit_id'
            ]
        ]
    },
    {
        table: 'user_staff_comments',
        indexes: [
            [
                'staff_userid',
            ],
            [
                'user_id'
            ]
        ]
    },
    {
        table: 'user_status',
        indexes: [
            [
                'userid',
            ]
        ]
    },
    {
        table: 'user_status_abuse_report',
        indexes: [
            [
                'userstatus_id',
                'report_status',
            ],
            [
                'userstatus_id',
            ],
        ]
    },
    {
        table: 'user_status_comment',
        indexes: [
            [
                'status_id',
            ]
        ]
    },
    {
        table: 'user_status_comment_reply',
        indexes: [
            [
                'userstatuscomment_id'
            ]
        ]
    },
    {
        table: 'user_status_reactions',
        indexes: [
            [
                'status_id',
            ]
        ]
    },
    {
        table: 'users',
        indexes: [
            [
                'user_lastonline',
            ]
        ]
    }
]

exports.up = async (knex, Promise) => {
    for (const index of indexes) {
        await knex.schema.alterTable(index.table, (t) => {
           for (const indexType of index.indexes) {
               t.index(indexType);
           }
        });
    }
};

exports.down = async (knex, Promise) => {
    for (const index of indexes) {
        await knex.schema.alterTable(index.table, (t) => {
            for (const indexType of index.indexes) {
                t.dropIndex(indexType);
            }
        });
    }
};