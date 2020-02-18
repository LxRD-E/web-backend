process.env.NODE_ENV = 'production';
const fs = require('fs');
const path = require('path');

const config = require("fs").readFileSync('./config.json');
let configJson = JSON.parse(config);
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