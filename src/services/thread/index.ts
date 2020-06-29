import {DynamicPool} from "node-worker-threads-pool";
import * as os from 'os';

export const ThreadPoolSize = os.cpus().length || 2;
console.log('[info] ThreadPoolSize',ThreadPoolSize);
/**
 * Generic thread pool for CPU-intensive tasks (such as image resizing)
 */
export const ThreadPool = new DynamicPool(ThreadPoolSize);
