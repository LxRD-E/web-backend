import config from './config';
import knexLibrary = require('knex');
let mysqlConfig = {
    debug: false,
    client: 'mysql',
    connection: config["mysql"],
    /**
     * TODO: play around with these to determine optimal values
     *
    pool: {
        max: 50,
        min: 1,
    }
    */
   propagateCreateError: false,
   pool: {
       propagateCreateError: false,
       max: 50,
       min: 1,
   }
}
const knexSystem = knexLibrary(mysqlConfig as any);
export default knexSystem;

if (process.env.NODE_ENV === 'production') {
    setInterval(() => {
        console.log('== start debug stats ==');
        let pool = knexSystem.client.pool;
    
        // returns the number of non-free resources
        let numUsed = pool.numUsed();
        console.log('numUsed: '+numUsed);
    
        // returns the number of free resources
        let numFree = pool.numFree()
        console.log('numFree: '+numFree);
    
        // how many acquires are waiting for a resource to be released
        let numPendingAcquires = pool.numPendingAcquires();
        console.log('numPendingAcquires: '+numPendingAcquires);
    
        // how many asynchronous create calls are running
        let numPendingCreates = pool.numPendingCreates();
        console.log('numPendingCreates: '+numPendingCreates);
    
        console.log('== end debug stats ==');
    }, 5000);
    
}