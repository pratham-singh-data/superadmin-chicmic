const Joi = require(`joi`);

const permissionsSchema = Joi.object({
    id: Joi.string().required(),
    read: Joi.boolean().optional(),
    write: Joi.boolean().optional(),
    grant: Joi.boolean().optional(),
});

module.exports = {
    permissionsSchema,
};
