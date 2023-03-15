const { sendResponse, } = require('../utils/sendResponse');
const { signupSchema, loginSchema, } = require('../validators');
const Joi = require(`joi`);
const { PersonModel, } = require('../models/person');
const { EmailAlreadyInUse,
    SuccessfullyRegisterred,
    UnableToVerifyCredentials,
    SuccessfullyLoggedIn, } = require('../utils/messages');
const { SECRET_KEY, TokenExpiryTime, } = require('../../config');
const jwt = require(`jsonwebtoken`);
const { hashPassword, } = require('../helpers/hashPassword');

/** Signs up a new user
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
async function signup(req, res) {
    let body;

    try {
        body = Joi.attempt(req.body, signupSchema);
    } catch (err) {
        sendResponse(res, {
            statusCode: 400,
            message: err.message,
        });

        return;
    }

    // if user with this email exists then do not proceed
    if (await PersonModel.findOne({ email: body.email, }).exec()) {
        sendResponse(res, {
            statusCode: 403,
            message: EmailAlreadyInUse,
        });
        return;
    }

    body.password = hashPassword(body.password);
    body.permissions = {
        read: true,
        write: true,
        grant: body.role !== `user`,
    };

    const newPerson = new PersonModel(body);

    const token = jwt.sign({
        id: newPerson._id,
    }, SECRET_KEY, {
        expiresIn: TokenExpiryTime,
    });

    await newPerson.save();

    sendResponse(res, {
        statusCode: 201,
        message: SuccessfullyRegisterred,
        token,
    });
}

/** Logs in an existing
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
async function login(req, res) {
    let body;

    try {
        body = Joi.attempt(req.body, loginSchema);
    } catch (err) {
        sendResponse(res, {
            statusCode: 400,
            message: err.message,
        });

        return;
    }

    body.password = hashPassword(body.password);
    const userData = await PersonModel.findOne(body).exec();

    if (! userData) {
        sendResponse(res, {
            statusCode: 403,
            message: UnableToVerifyCredentials,
        });

        return;
    }

    const token = jwt.sign({
        id: userData._id,
    }, SECRET_KEY, {
        expiresIn: TokenExpiryTime,
    });

    sendResponse(res, {
        statusCode: 200,
        message: SuccessfullyLoggedIn,
        token,
    });
}

/** Updates user profile
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
async function update(req, res) {
    res.send('done');
}

module.exports = {
    signup,
    login,
    update,
};
