const { loginSchema, } = require(`./loginSchema`);
const { signupSchema, } = require(`./signupSchema`);
const { updateSchema, } = require(`./updateSchema`);
const { permissionSchema, } = require(`./permissionSchema`);

module.exports = {
    loginSchema,
    signupSchema,
    updateSchema,
    permissionSchema,
};
