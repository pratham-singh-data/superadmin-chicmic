const Joi = require(`joi`);
const passwordComplexity = require(`joi-password-complexity`);

const signupSchema = Joi.object({
    name: Joi.string().min(1).required(),
    email: Joi.string().email().lowercase().required(),
    password: passwordComplexity({
        min: 8,
        max: Infinity,
        lowerCase: 1,
        upperCase: 1,
        numeric: 1,
        symbol: 1,
        requirementCount: Infinity,
    }).required(),
    role: Joi.string().valid(`user`, `admin`, `super-admin`).required(),
});

module.exports = {
    signupSchema,
};
