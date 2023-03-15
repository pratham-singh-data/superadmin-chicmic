const Joi = require(`joi`);

const updateSchema = Joi.object({
    id: Joi.string().required(),
    name: Joi.string().required(),
    email: Joi.string().lowercase().required(),
});

module.exports = {
    updateSchema,
};
