const { sendResponse, } = require('../utils/sendResponse');
const { signupSchema, loginSchema, updateSchema, } = require('../validators');
const Joi = require(`joi`);
const { PersonModel, } = require('../models/person');
const { EmailAlreadyInUse,
    SuccessfullyRegisterred,
    UnableToVerifyCredentials,
    SuccessfullyLoggedIn,
    TokenNotVerfied,
    WriteNeeded,
    UnathorizedOperationDetected,
    UpdateSuccessful, } = require('../utils/messages');
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
    let body;

    try {
        body = Joi.attempt(req.body, updateSchema);
    } catch (err) {
        sendResponse(res, {
            statusCode: 400,
            message: err.message,
        });

        return;
    }


    // just in case token expires between calls
    let id;

    try {
        ({ id, } = jwt.verify(req.headers.token, SECRET_KEY));
    } catch (err) {
        sendResponse(res, {
            statusCode: 403,
            message: TokenNotVerfied,
        });
        return;
    }

    // user can only update if they have write permission
    const userData = await PersonModel.findById(id).exec();

    if (! userData.permissions.write) {
        sendResponse(res, {
            statusCode: 403,
            message: WriteNeeded,
        });

        return;
    }

    const targetUser = await PersonModel.findById(body.id).exec();

    const unauthorizedOperation = sendResponse.bind(undefined, res, {
        statusCode: 403,
        message: UnathorizedOperationDetected,
    });

    // a user can update lower users and themselves;
    // lowest can only update themselves
    if (userData.role === 'super-admin') {
        // can update anyone except other super-admins
        if ((targetUser.role !== `user` || targetUser.role !== `admin`) &&
        String(targetUser._id) !== String(userData._id)) {
            unauthorizedOperation();
            return;
        }
    } else if (userData.role === 'admin') {
        // can update themselves and user
        if (targetUser.role !== `user` &&
        String(targetUser._id) !== String(userData._id)) {
            unauthorizedOperation();
            return;
        }
    } else if (userData.role === 'user') {
        // user can only update themselves
        if (String(targetUser._id) !== String(userData._id)) {
            unauthorizedOperation();
            return;
        }
    }

    const updateStatus = {};
    const updateQuery = {};
    // update name and password without issues
    if (body.password) {
        const newPassword = hashPassword(body.password);
        updateStatus.password = newPassword !== targetUser.password,
        updateQuery.password = newPassword;
    }

    if (body.name) {
        updateStatus.name = body.name !== targetUser.name,
        updateQuery.name = body.name;
    }

    // email can only be updated if user with this email does not already exist
    if (await PersonModel.findOne({ email: body.email, }).exec()) {
        updateStatus.email = false;
    } else {
        updateStatus.email = true;
        updateQuery.email = body.email;
    }


    await PersonModel.updateOne({
        _id: targetUser._id,
    }, updateQuery).exec();

    sendResponse(res, {
        statusCode: 200,
        message: UpdateSuccessful,
        updateStatus,
    });
}

module.exports = {
    signup,
    login,
    update,
};
