const jwt = require('jsonwebtoken');
const { SECRET_KEY, } = require('../../config');
const { PersonModel, } = require('../models/person');
const { TokenNotVerfied,
    UnableToVerifyCredentials, } = require('../utils/messages');
const { generateLocalSendResponse, } = require('../utils/sendResponse');

/** Verifies JWT token in headers
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 * @param {Function} next Express next function
 */
async function checkToken(req, res, next) {
    const localResponder = generateLocalSendResponse(res);

    if (! req.headers.token) {
        localResponder({
            statusCode: 403,
            message: TokenNotVerfied,
        });

        return;
    }

    let id;

    try {
        ({ id, } = jwt.verify(req.headers.token, SECRET_KEY));
    } catch (err) {
        localResponder({
            statusCode: 403,
            message: TokenNotVerfied,
        });
        return;
    }

    if (! await PersonModel.findById(id).exec()) {
        localResponder({
            statusCode: 403,
            message: UnableToVerifyCredentials,
        });

        return;
    }

    // user is valid if here
    next();
}

module.exports = {
    checkToken,
};
