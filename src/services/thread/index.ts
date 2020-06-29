import {DynamicPool} from "node-worker-threads-pool";

/**
 * Generic thread pool for CPU-intensive tasks (such as image resizing)
 */
export const ThreadPool = new DynamicPool(4);
