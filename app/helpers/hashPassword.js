const { pbkdf2Sync, } = require(`crypto`);
const { SALT, } = require('../../config');

/** Returns the hash of the given password
 * @param {String} password Password whose hash is to be generated.
 * @return {String} hash value of the password.
 */
function hashPassword(password) {
    return pbkdf2Sync(password, SALT, 1000, 64, 'sha512').toString('hex');
}

module.exports = {
    hashPassword,
};
