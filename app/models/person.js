const { Schema, model, } = require(`mongoose`);

const permissionsSchema = new Schema({
    read: Boolean,
    write: Boolean,
    grant: Boolean,
});

const personSchema = new Schema({
    name: String,
    password: String,
    email: String,
    role: String,
    permissions: permissionsSchema,
});

const PersonModel = model(`person`, personSchema);

module.exports = {
    PersonModel,
};
