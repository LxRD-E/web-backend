"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_worker_threads_pool_1 = require("node-worker-threads-pool");
const os = require("os");
exports.ThreadPoolSize = os.cpus().length || 2;
console.log('[info] ThreadPoolSize', exports.ThreadPoolSize);
exports.ThreadPool = new node_worker_threads_pool_1.DynamicPool(exports.ThreadPoolSize);

