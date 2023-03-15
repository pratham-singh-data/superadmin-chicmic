const Joi = require(`joi`);
const passwordComplexity = require(`joi-password-complexity`);

const updateSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().optional(),
    email: Joi.string().lowercase().optional(),
    password: passwordComplexity({
        min: 8,
        max: Infinity,
        lowerCase: 1,
        upperCase: 1,
        numeric: 1,
        symbol: 1,
        requirementCount: Infinity,
    }).optional(),
});

module.exports = {
    updateSchema,
};
