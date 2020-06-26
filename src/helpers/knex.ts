import config from './config';
import knexLibrary = require('knex');

let thingToExport: knexLibrary<any, unknown[]>;
if (process.env.NODE_ENV !== 'test') {
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
        min: 3,
    }
    }
    thingToExport = knexLibrary(mysqlConfig as any);
}else{
    const func: any = (table: string) => {
        console.error('process.env is test; knex should not be accessed. exiting with code 1');
        process.exit(1);
    }
    thingToExport = func;
}


export default thingToExport;
/*
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
*/