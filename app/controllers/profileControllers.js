const { generateLocalSendResponse, } = require('../utils/sendResponse');
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
    UpdateSuccessful,
    ReadNeeded,
    UserDoesNotExist,
    GrantNeeded, } = require('../utils/messages');
const { SECRET_KEY, TokenExpiryTime, } = require('../../config');
const jwt = require(`jsonwebtoken`);
const { hashPassword, } = require('../helpers/hashPassword');
const { permissionsSchema, } = require('../validators/permissionSchema');

/** Signs up a new user
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
async function signup(req, res) {
    const localResponder = generateLocalSendResponse(res);

    let body;

    try {
        body = Joi.attempt(req.body, signupSchema);
    } catch (err) {
        localResponder({
            statusCode: 400,
            message: err.message,
        });

        return;
    }

    // if user with this email exists then do not proceed
    if (await PersonModel.findOne({ email: body.email, }).exec()) {
        localResponder({
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

    localResponder({
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
    const localResponder = generateLocalSendResponse(res);

    let body;

    try {
        body = Joi.attempt(req.body, loginSchema);
    } catch (err) {
        localResponder({
            statusCode: 400,
            message: err.message,
        });
        return;
    }

    body.password = hashPassword(body.password);
    const userData = await PersonModel.findOne(body).exec();

    if (! userData) {
        localResponder({
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

    localResponder({
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
    const localResponder = generateLocalSendResponse(res);

    let body;

    try {
        body = Joi.attempt(req.body, updateSchema);
    } catch (err) {
        localResponder({
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
        localResponder({
            statusCode: 403,
            message: TokenNotVerfied,
        });
        return;
    }

    // user can only update if they have write permission
    const userData = await PersonModel.findById(id).exec();

    if (! userData.permissions.write) {
        localResponder({
            statusCode: 403,
            message: WriteNeeded,
        });

        return;
    }

    const targetUser = await PersonModel.findById(body.id).exec();

    const unauthorizedOperation = localResponder.bind(undefined, {
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

    localResponder({
        statusCode: 200,
        message: UpdateSuccessful,
        updateStatus,
    });
}

/** Gets data on a user/admin/super-admin
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
async function getUser(req, res) {
    const localResponder = generateLocalSendResponse(res);

    // just in case token expires between calls
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

    // user can only read if they have read permission
    const userData = await PersonModel.findById(id).exec();

    if (! userData.permissions.read) {
        localResponder({
            statusCode: 403,
            message: ReadNeeded,
        });
        return;
    }

    // id of user to read
    let { id: targetId, } = req.params;
    targetId = String(targetId);

    const targetUser = await PersonModel.findById(targetId).exec();
    const unauthorizedOperation = localResponder.bind(undefined, {
        statusCode: 403,
        message: UnathorizedOperationDetected,
    });

    if (! targetUser) {
        localResponder({
            statusCode: 404,
            message: UserDoesNotExist,
        });
        return;
    }

    if (userData.role === `super-admin`) {
        // can read themselves, admins and users
        if (targetUser.role === `super-admin` &&
            String(targetUser._id) !== String(userData._id)) {
            unauthorizedOperation();
            return;
        }
    } else if (userData.role === `admin`) {
        // can read themselves and users
        if (targetUser.role === `super-admin` || (targetUser.role === `admin` &&
                            String(targetUser._id) !== String(userData._id))) {
            unauthorizedOperation();
            return;
        }
    } else if (userData.role === `user`) {
        if (String(targetUser._id) !== String(userData._id)) {
            unauthorizedOperation();
            return;
        }
    }

    localResponder({
        statusCode: 200,
        data: targetUser,
    });
}

/** Sets permissions
 * @param {Request} req Express request object
 * @param {Response} res Express response object
 */
async function setPermission(req, res) {
    const localResponder = generateLocalSendResponse(res);

    const respondSuccessfulUpdate = generateLocalSendResponse.bind(undefined, {
        statusCode: 200,
        message: UpdateSuccessful,
    });

    // confirm schema
    let body;

    try {
        body = Joi.attempt(req.body, permissionsSchema);
    } catch (err) {
        localResponder({
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
        localResponder({
            statusCode: 403,
            message: TokenNotVerfied,
        });
        return;
    }

    // user can only read if they have read permission
    const userData = await PersonModel.findById(id).exec();

    if (! userData.permissions.grant) {
        localResponder({
            statusCode: 403,
            message: GrantNeeded,
        });
        return;
    }

    // user cannot grant permissions
    if (userData.role === `user`) {
        localResponder({
            statusCode: 403,
            message: UnathorizedOperationDetected,
        });
        return;
    }

    const targetUser = await PersonModel.findById(body.id).exec();

    delete body.id; // because this will be the update query

    // user cannot be granted grant
    if (targetUser.role === `user`) {
        delete body.grant;
    }

    // if that was the only update, return
    if (Object.keys(body) === 1) {
        respondSuccessfulUpdate();
        return;
    }

    const unauthorizedOperation = localResponder.bind(undefined, {
        statusCode: 403,
        message: UnathorizedOperationDetected,
    });

    if (userData.role === `super-admin`) {
        // super-admin can define permissions for admin and user
        if (targetUser.role === `super-admin`) {
            unauthorizedOperation();
            return;
        }
    } else if (userData.role === `admin`) {
        // admin can defined permissions for users
        if (targetUser.role !== `user`) {
            unauthorizedOperation();
            return;
        }
    }

    await PersonModel.updateOne({
        _id: targetUser._id,
    }, {
        permissions: {
            read: !! body.read,
            write: !! body.write,
            grant: !! body.grant,
        },
    });

    respondSuccessfulUpdate();
    localResponder({
        statusCode: 200,
        message: UpdateSuccessful,
    });
}

module.exports = {
    signup,
    login,
    update,
    getUser,
    setPermission,
};
