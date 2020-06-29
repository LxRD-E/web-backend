"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_worker_threads_pool_1 = require("node-worker-threads-pool");
exports.ThreadPool = new node_worker_threads_pool_1.DynamicPool(4);

