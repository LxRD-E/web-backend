/**
 * Swap out faulty encryption method with new encryption method for password hashes
 */
// imports
const config = require('../dist/helpers/config').default;
const {encrypt, decrypt, encryptPasswordHash, decryptPasswordHash} = require('../dist/dal/auth');
const bcrypt = require('bcrypt');

exports.up = async (knex, Promise) => {

    // confirm config vars setup right
    const example_pass = 'Hello World';
    let salt = 10;
    const hashedExample = bcrypt.hashSync(example_pass, salt);
    let encryptedExample = JSON.parse(encryptPasswordHash(hashedExample));
    let newEncryptedExample = JSON.parse(encryptPasswordHash(hashedExample));

    if (encryptedExample[0] === newEncryptedExample[0]) {
        throw new Error('Encrypted string test yielded identical results; are you specifying a proper IV?');
    }

    let allUsers = await knex('users').select('id','password');
    let newArrOfUsers = [];
    for (const user of allUsers) {
        // Decrypt users old password hash
        let decryptedHash = decrypt(user.password, config.encryptionKeys.password);

        // Encrypt a new hash
        let newHash = encryptPasswordHash(decryptedHash);

        // Decrypt the encrypted string to reveal hash
        let newDecryptedHash = decryptPasswordHash(newHash);
        // Confirm hashes match (i.e. confirm no encoding issues)
        if (newDecryptedHash !== decryptedHash) {
            throw new Error('Hash does not equal for userId '+user.id);
        }
        newArrOfUsers.push(user);
    }
    for (const user of newArrOfUsers) {
        // Decrypt users old password hash
        let decryptedHash = decrypt(user.password, config.encryptionKeys.password);

        // Encrypt a new hash
        let newHash = encryptPasswordHash(decryptedHash);
        
        // Update the hash
        await knex('users').update({'password': newHash}).where({'id': user.id});
    }

    // throw new Error('Testing');
};

exports.down = async (knex, Promise) => {

    let allUsers = await knex('users').select('id','password');
    for (const user of allUsers) {
        let newDecryptedHash = decryptPasswordHash(user.password);

        let oldEncryptMethod = encrypt(newDecryptedHash, config.encryptionKeys.password);
        // set
        await knex('users').update({'password': oldEncryptMethod}).where({'id': user.id});
    }
};