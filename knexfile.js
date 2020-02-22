process.env.NODE_ENV = 'production';
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
// check if config vars exist
if (!process.env['SECRET_ENCRYPTION_KEY'] || !process.env['SECRET_ENCRYPTION_IV']) {
    // probably dev environment. warn anyway
    console.warn('[warning] reading SECRET_ENCRYPTION_KEY and SECRET_ENCRYPTION_IV for config.json directly from dev.env file. exit if you are not expecting this.');
    let confResults = dotenv.config({
        path: path.join(__dirname,'./env/development.env'),
    });
}
// const config = require("fs").readFileSync('./config.json');
let configJson = require('./dist/helpers/config').default;
delete configJson.mysql.charset;
let table;
if (configJson.mysqlTLS.enabled) {
    table = {

        production: {
          client: 'mysql',
          connection: {
            'host': configJson.mysql.host,
            'database': configJson.mysql.database,
            'user': configJson.mysql.user,
            'password': configJson.mysql.password,
            'ssl': {
                'ca': fs.readFileSync(path.resolve(__dirname, './ca.pem')).toString(),
                'cert': fs.readFileSync(path.resolve(__dirname, './client_cert.pem')).toString(),
                'key': fs.readFileSync(path.resolve(__dirname, './client_key.pem')).toString(),
            }
          },
          pool: {
              min: 2,
              max: 10
          },
          migrations: {
              tableName: 'knex_migrations'
          }
        },
      
      };
      
}else{
    table = {
        production: {
          client: 'mysql',
          connection: configJson["mysql"],
          pool: {
              min: 2,
              max: 10
          },
          migrations: {
              tableName: 'knex_migrations'
          }
        }
      
      };
      
}
module.exports = table;