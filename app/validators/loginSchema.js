const Joi = require(`joi`);

const loginSchema = Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
});

module.exports = {
    loginSchema,
};
